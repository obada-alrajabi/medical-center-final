# Secure Ledger — Production Migration Checklist

This checklist is for the **system owner** who administers the production
deployment (external **cPanel / Hostinger** hosting with its own PostgreSQL
database). The Replit agent can only reach the development database, so the
production migration must be run by the owner following the steps below.

The migration is **idempotent and guarded** — it is safe to run more than once,
and it is also applied automatically on every server startup (see
`server.js` → `migrations/001_secure_ledger.sql`). This checklist covers the
**manual/first-run** path and the verification you should perform afterward.

---

## 0. Before you start

- [ ] Take a **full database backup** (SQL dump) of the production database.
      This migration backfills and reconciles financial rows; a backup is your
      rollback path.
- [ ] Confirm the production `DATABASE_URL` (or the cPanel PostgreSQL
      credentials) points at the **production** database, not a staging copy.
- [ ] Note the current per-department drawer balances shown in the UI
      (Financial → Summary). You will compare these to the derived balances
      after migration.

## 1. Deploy the new code

- [ ] Pull/upload the new application build to the production host.
- [ ] Ensure `migrations/001_secure_ledger.sql` is present in the deployed files.
- [ ] Restart the Node.js app (cPanel → Setup Node.js App → Restart).
- [ ] Check the startup log for the line:

      [migration] secure ledger applied

  If you instead see `[migration] secure ledger:` followed by an error, the
  migration did not complete — stop and resolve the error before using the app.

> The startup auto-apply is enough for most deployments. Steps 2–3 below are the
> **manual equivalent** if you prefer to run it yourself via `psql`, or if the
> host cannot run the auto-apply.

## 2. (Optional) Apply the migration manually via psql

- [ ] Open a shell / phpPgAdmin SQL console with access to the prod DB.
- [ ] Run the migration file:

      psql "$DATABASE_URL" -f migrations/001_secure_ledger.sql

- [ ] It should complete without error. Re-running it is safe (idempotent).

## 3. Verify the migration

Run each check against the **production** database.

- [ ] **Ledger table exists and is protected**

      SELECT to_regclass('public.ledger_entries');            -- not null
      -- Both of the following MUST fail with:
      --   "ledger_entries is append-only: UPDATE/DELETE is not permitted"
      UPDATE ledger_entries SET amount = amount WHERE false;
      DELETE FROM ledger_entries WHERE false;

- [ ] **Backfill is complete** — every existing drawer transaction is mirrored:

      SELECT
        (SELECT count(*) FROM drawer_transactions) AS tx,
        (SELECT count(*) FROM ledger_entries WHERE reference_type='drawer_tx') AS mirrored;
      -- tx should equal mirrored

- [ ] **Derived balance == displayed balance** for every department:

      SELECT d.dept,
             d.balance                                   AS stored_balance,
             COALESCE(l.bal, 0)                          AS ledger_balance,
             d.balance - COALESCE(l.bal, 0)              AS drift
      FROM drawers d
      LEFT JOIN (
        SELECT dept,
               SUM(CASE WHEN type='CREDIT' THEN amount ELSE -amount END) AS bal
        FROM ledger_entries GROUP BY dept
      ) l ON l.dept = d.dept;
      -- drift must be 0.00 for every row (the migration posts a one-time
      -- "تسوية ترحيل" reconciliation entry to absorb any pre-existing drift).

- [ ] Open the app → Financial → Summary and confirm the per-department
      balances match what you noted in step 0.

## 4. Smoke-test the money flows (in the running app)

- [ ] Log in as **admin**; confirm the dashboard and drawer balances load.
- [ ] Perform a small **deposit** and a small **withdrawal** in a test
      department; confirm the balance updates and a transaction row appears.
- [ ] Create a **receipt voucher** and a **payment voucher**; confirm the money
      moves **exactly once** (no double counting) and the voucher document is
      recorded.
- [ ] Log in as a **staff** user and confirm normal session-payment flows still
      work.
- [ ] Confirm reports / financial summary numbers are unchanged from before.

## 5. Rollback (only if verification fails)

- [ ] Restore the database backup taken in step 0.
- [ ] Redeploy the previous application build.
- [ ] The ledger table and triggers can be dropped if needed:

      DROP TRIGGER IF EXISTS trg_ledger_no_update ON public.ledger_entries;
      DROP TRIGGER IF EXISTS trg_ledger_no_delete ON public.ledger_entries;
      DROP TABLE IF EXISTS public.ledger_entries;

---

## Notes

- **Historical duplicates are not retroactively purged.** The voucher
  double-count fix is *forward-looking*: from this deploy onward, voucher
  creation records the document only and the cash is moved once through the
  drawer-transaction path. Any duplicate movements created by the previous code
  remain in the historical data and must be corrected manually if desired
  (post a compensating drawer transaction — never edit the ledger directly).
- `drawers.balance` is now a **derived cache**, kept in sync by the app. The
  source of financial truth is `SUM(CREDIT − DEBIT)` over `ledger_entries`.
- The `ledger_entries` table is **append-only at the database level**. Never
  attempt to `UPDATE`/`DELETE` rows to "fix" figures — post a reversing or
  compensating entry instead (the app does this for edits, deletes, and resets).
