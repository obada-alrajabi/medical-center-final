---
name: Secure ledger (financial source of truth)
description: How money truth works after the ledger refactor — append-only ledger, single choke-point, derived balances, forward-only voucher fix.
---

# Secure ledger — financial source of truth

`ledger_entries` (append-only) is the source of financial truth. `drawers.balance`
is a derived cache. Balance = `SUM(CREDIT − DEBIT)` per dept.

**Append-only is DB-enforced:** BEFORE UPDATE/DELETE triggers RAISE EXCEPTION
("ledger_entries is append-only"). You cannot edit/delete ledger rows even via
psql. To clean test data you must temporarily `ALTER TABLE ledger_entries
DISABLE TRIGGER trg_ledger_no_update/trg_ledger_no_delete`, delete, re-enable.
To correct real figures, post a **reversing/compensating** entry — never mutate.

**Single money choke-point:** ALL cash moves through frontend
doDeposit/doWithdraw/doAdjustBalance → `POST /drawers/transactions`. That route is
the ONLY place the ledger is mirrored; it computes `balance_after` server-side in
a BEGIN/COMMIT and **ignores any client-sent balance_after**. Frontend no longer
sends balance_after and no longer calls api.drawers.updateBalance.

**Voucher fix is FORWARD-ONLY (user decision):** receipt/payment voucher POST
records the DOCUMENT ONLY — it must NOT insert a drawer_transaction or mutate a
balance (that caused real-money double counting because the frontend money fn
also moves the cash). Historical duplicates are NOT purged.

**Auth:** `requireFinancialAuth` (middleware/adminAuth.js) accepts admin OR staff
token (staff token issued at staff-login, in-memory Map, 8h TTL) on all money
writes. tx PUT/DELETE + drawer reset stay `requireAdmin`.
**Why identity-only, not capability-based:** restricting /drawers/transactions to
`can_access_financial` staff would break legitimate staff session-payment flows
(regular staff collect session payments via doDeposit). Per-staff authorization
is a documented follow-up, not done here.

**Prod topology:** external cPanel/Hostinger DB; agent reaches only the empty dev
DB. Migration `migrations/001_secure_ledger.sql` is idempotent+guarded and
auto-applied at server.js startup (fire-and-forget, not awaited — matches
existing migration pattern; race window is ms on first cold start only).

**Gotcha:** dev DB has 0 departments/drawers; `drawer_transactions_dept_fkey →
departments(id)` still exists, so testing money flow needs a real departments row
seeded first (built-in dept IDs are frontend constants, never seeded in dev).

Docs: `LEDGER_MIGRATION_CHECKLIST.md`, `LEDGER_SECURITY_SUMMARY.md`.
