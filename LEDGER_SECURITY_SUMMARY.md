# Secure Ledger Refactor — Security Improvements Summary

This document summarizes the security changes made to the financial subsystem
and the residual risks / follow-ups. It complements `FINANCIAL_EXPLOIT_REPORT.md`
(the original vulnerability report) and `LEDGER_MIGRATION_CHECKLIST.md`.

## Goal

Convert the financial subsystem from **frontend-controlled truth** to a
**backend-authoritative, append-only ledger**, without changing any business
feature or breaking the existing UI (this is a real-money production system).

---

## What changed

### 1. Immutable, append-only ledger (source of truth)
- New table `ledger_entries` (`migrations/001_secure_ledger.sql`): credit/debit,
  amount, category, reference type/id, `created_by`, `is_reversed`.
- **Database-level immutability**: `BEFORE UPDATE` and `BEFORE DELETE` triggers
  raise an exception, so ledger rows cannot be altered or removed — not even by
  the application's own DB role or by direct SQL.
- Balances are now **derived** as `SUM(CREDIT − DEBIT)` per department.
  `drawers.balance` is demoted to a synchronized cache; it is no longer the
  source of financial truth.
- The migration backfills existing `drawer_transactions` into the ledger and
  posts a one-time reconciliation entry to absorb any pre-existing drift, so
  displayed balances are unchanged after cutover.

**Fixes:** ledger forgery / silent balance edits (Tampering, Information
integrity).

### 2. Single money choke-point + server-computed balance
- `POST /drawers/transactions` is the **only** path that moves cash. It:
  - runs inside a single `BEGIN`/`COMMIT`,
  - posts the ledger entry first (via `services/ledgerService.js`),
  - **computes `balance_after` server-side** from the ledger, and
  - mirrors the row into `drawer_transactions` and updates the drawer cache.
- Any `balance_after` sent by the client is **ignored**. `GET`/`POST`/`PUT` on
  drawers derive/ignore balance rather than trusting the client.
- `PUT`/`DELETE` of a transaction and drawer `reset` post **reversing /
  compensating** ledger entries (admin-only) instead of mutating history.

**Fixes:** fabricated balances via client-supplied `balance_after`
(Spoofing/Tampering of financial state).

### 3. Voucher double-count removed (user-directed fix)
- Previously, creating a receipt/payment voucher **both** inserted a
  `drawer_transaction` **and** mutated the balance, while the frontend money
  function *also* moved the cash — double counting real money.
- Voucher `POST` routes now **record the document only**. The cash is moved
  exactly once through the frontend `doDeposit`/`doWithdraw` →
  `/drawers/transactions` path, which is the single ledgered choke-point.

**Fixes:** real-money double counting on every voucher.

### 4. Authentication on all money-mutating routes
- New `requireFinancialAuth` guard (`middleware/adminAuth.js`) accepts a valid
  **admin token or staff token** (staff tokens issued at staff-login, in-memory,
  8-hour TTL).
- Applied to every financial write: drawer transactions, invoices, debts,
  external debts, purchase requests, purchase items, and voucher deletes.
- Destructive drawer operations (transaction `PUT`/`DELETE`, drawer `reset`)
  remain **admin-only** (`requireAdmin`).

**Fixes:** previously *unauthenticated* money routes (anyone on the network
could drain funds / fabricate income) — Elevation of Privilege / Spoofing.

### 5. Frontend trust-model edits
- `src/app/api.ts` + `src/app/App.tsx`: the money functions
  (`doDeposit`/`doWithdraw`/`doAdjustBalance`) no longer send `balance_after`
  and no longer call `api.drawers.updateBalance`. They send only amount +
  metadata; the backend returns the authoritative balance.
- Staff login now stores the issued token so authenticated financial calls work
  for staff performing normal flows (e.g. session payments).

### 6. Production rollout
- The migration auto-applies on server startup (idempotent + guarded), so the
  external cPanel/Hostinger production DB is upgraded without manual `psql`
  access. A manual checklist is also provided (`LEDGER_MIGRATION_CHECKLIST.md`).

---

## Verification performed (development database)

All checks passed against the dev DB via live API + `psql`:

| Check | Result |
|-------|--------|
| Unauthenticated `POST /drawers/transactions` | **401 rejected** |
| Unauthenticated voucher `POST` | **401 rejected** |
| Admin login issues a session token | ✅ |
| Client-supplied `balance_after` (99999) on deposit | **ignored** — server computed 300, then 180 |
| `GET /drawers` derived balance vs. `SUM(CREDIT−DEBIT)` | **equal** (180 == 180) |
| Direct `UPDATE` on `ledger_entries` | **blocked** ("append-only … UPDATE is not permitted") |
| Direct `DELETE` on `ledger_entries` | **blocked** ("append-only … DELETE is not permitted") |
| Migration re-run (idempotency) | ✅ no duplicate rows |

> Note: the development database contains **0 real financial rows**; production
> data lives only on the external host. The verification exercised the code
> paths with temporary seed data that was cleaned up afterward.

---

## Residual risks & recommended follow-ups

1. **Per-staff financial authorization is not yet enforced (identity-only).**
   Money routes now require a *valid session* (authentication), but any active
   staff token is accepted — the server does not yet check a staff member's
   `can_access_financial` capability or department scope on each mutation.
   This is a deliberate scope boundary: restricting `/drawers/transactions` to
   finance-only staff would break legitimate staff session-payment flows, and
   the task scoped auth to *coverage*, not an authorization-model rewrite. A
   follow-up should add capability + department-scoped authorization
   (from `staff_dept_permissions`) with negative tests for privilege boundaries.

2. **Startup migration is not awaited before serving traffic.** Consistent with
   the existing fire-and-forget migration pattern in `server.js`. The SQL is
   idempotent and fast, and a failure cannot corrupt data (writes fail cleanly),
   but there is a millisecond-scale race window on the very first cold start
   where a ledger-dependent read could error. A follow-up could gate
   ledger-dependent routes until the migration completes.

3. **Denormalized salary/commission display fields are non-authoritative.**
   Payroll cash movement is ledgered (via `doWithdraw`), but `net_salary` /
   `commission` remain client-computed display fields. They do not control the
   money moved, but should be recomputed/validated server-side in a follow-up.

4. **Historical voucher duplicates are not purged.** The double-count fix is
   forward-looking; any duplicates created by the old code remain in historical
   data and must be corrected via compensating drawer transactions if desired.
