-- ============================================================================
-- Migration 001 — Secure append-only ledger
-- Idempotent. Safe to run multiple times and against production (cPanel/Hostinger).
--
-- Phase 2 of the Secure Ledger Refactor:
--   • Adds ledger_entries (append-only, DB-enforced immutability)
--   • Backfills existing drawer_transactions into the ledger
--   • Reconciles any drift between derived ledger balance and drawers.balance
--   • drawers.balance becomes a DERIVED cache (kept in sync by the app), no
--     longer the source of financial truth.
-- ============================================================================

-- ── 1. Ledger table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id             BIGSERIAL PRIMARY KEY,
    dept           VARCHAR(50)  NOT NULL,
    type           VARCHAR(6)   NOT NULL,
    amount         NUMERIC(12,2) NOT NULL,
    category       TEXT,
    description    TEXT,
    reference_type TEXT,
    reference_id   TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by     TEXT,
    is_reversed    BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT ledger_entries_type_check   CHECK (type IN ('CREDIT','DEBIT')),
    CONSTRAINT ledger_entries_amount_check CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ledger_dept    ON public.ledger_entries (dept);
CREATE INDEX IF NOT EXISTS idx_ledger_ref     ON public.ledger_entries (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON public.ledger_entries (created_at);

-- ── 2. Immutability — block UPDATE and DELETE at the database level ─────────
--    Triggers fire for every role (including the table owner the app connects
--    as), so this cannot be bypassed by the application code path.
CREATE OR REPLACE FUNCTION public.ledger_entries_block_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only: % is not permitted', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_no_update ON public.ledger_entries;
CREATE TRIGGER trg_ledger_no_update
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.ledger_entries_block_mutation();

DROP TRIGGER IF EXISTS trg_ledger_no_delete ON public.ledger_entries;
CREATE TRIGGER trg_ledger_no_delete
  BEFORE DELETE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.ledger_entries_block_mutation();

-- ── 3. Backfill from existing drawer_transactions (guarded / idempotent) ────
--    'in'  → CREDIT, 'out' → DEBIT. Each source row mirrored exactly once.
INSERT INTO public.ledger_entries
    (dept, type, amount, category, description, reference_type, reference_id, created_at, created_by, is_reversed)
SELECT dt.dept,
       CASE WHEN dt.type = 'in' THEN 'CREDIT' ELSE 'DEBIT' END,
       dt.amount,
       dt.category,
       dt.title,
       'drawer_tx',
       dt.id::text,
       dt.created_at,
       'migration',
       false
FROM public.drawer_transactions dt
WHERE NOT EXISTS (
  SELECT 1 FROM public.ledger_entries le
  WHERE le.reference_type = 'drawer_tx' AND le.reference_id = dt.id::text
);

-- ── 4. Reconcile drift (direct balance edits / adjustments not in tx log) ───
--    One-time per drawer: if the stored balance differs from the derived
--    ledger balance, post a single reconciliation entry so the derived balance
--    matches what the app currently displays. Guarded so it never double-posts.
INSERT INTO public.ledger_entries
    (dept, type, amount, category, description, reference_type, reference_id, created_by)
SELECT d.dept,
       CASE WHEN (COALESCE(d.balance,0) - COALESCE(l.bal,0)) >= 0 THEN 'CREDIT' ELSE 'DEBIT' END,
       ABS(COALESCE(d.balance,0) - COALESCE(l.bal,0)),
       'تسوية ترحيل',
       'Ledger migration reconciliation (opening drift)',
       'reconciliation',
       d.dept,
       'migration'
FROM public.drawers d
LEFT JOIN (
  SELECT dept, SUM(CASE WHEN type='CREDIT' THEN amount ELSE -amount END) AS bal
  FROM public.ledger_entries GROUP BY dept
) l ON l.dept = d.dept
WHERE ABS(COALESCE(d.balance,0) - COALESCE(l.bal,0)) > 0.005
  AND NOT EXISTS (
    SELECT 1 FROM public.ledger_entries le
    WHERE le.reference_type = 'reconciliation' AND le.reference_id = d.dept
  );
