---
name: Financial system audit facts
description: Non-obvious accuracy pitfalls for the finance/accounting subsystem, surfaced during the read-only audit.
---

# Financial system — non-obvious facts

- **Staff members API is `/staff` (root), not `/staff/members`.** Payroll rows are a separate resource: `/staff/employees/*`. Advances `/staff/advances/*`, attendance `/staff/attendance/*`, permissions `/staff/:staff_id/permissions[/:dept]`, requests `/staff/advance-requests`.

- **Permission write allowlist drops fine-grained columns silently.** `staff_dept_permissions` has ~50 `can_*` columns, but `PERM_COLS_ALLOWED` in `routes/staff.js` accepts only 8 generic ones: `can_view, can_edit, can_delete, can_create, can_approve, can_view_financials, can_manage_staff, can_manage_settings`. POST/PUT `/:staff_id/permissions` filter through it, so any `can_drawer_*`/`can_vouchers` value sent to the server is discarded — UI tree shows more than the API can persist.
  **Why:** creates a gap between displayed vs. stored permission; don't assume a checkbox the UI renders is actually saved server-side.

- **Daily/shift salary type is configured, not implemented.** `staff_members` has `shift_amount/shift_start/shift_end` and `calcTotalHours` exists, but `PayrollScreen.calcNet` is always `salary + commission − expenses − pendingAdvances`; it never consumes `attendance_records` or `shift_amount` for net pay. Attendance hours are display/tracking only.

- **Voucher DELETE routes are unprotected.** `DELETE /finance/receipt-vouchers/:id` and `DELETE /finance/payment-vouchers/:id` lack `requireAdmin` (their POSTs auto-create drawer transactions, but delete does not reverse the cash movement).

- **No global auth; voucher POST bypasses the protected drawer boundary.** `server.js` mounts routers with no auth middleware in front; protection is per-route via `requireAdmin` only. The `drawers` mutation routes ARE guarded, but `POST /finance/receipt-vouchers` and `/payment-vouchers` (UNguarded) themselves INSERT `drawer_transactions` and UPDATE `drawers.balance` — so an unauthenticated caller can move any drawer balance through vouchers, defeating the drawer guard. Most finance writes (invoices/debts/external-debts create+update) are also unguarded; only `/finance/summary` and DELETEs for invoices/debts/external-debts (NOT vouchers) carry `requireAdmin`.
  **Why:** treat the drawer routes' `requireAdmin` as NOT the real protection boundary — vouchers are an open side-door into the same tables.

- **Ledger is not tamper-proof / not append-only.** `PUT /drawers/transactions/:id` rewrites `amount`+`balance_after` on historical rows and `DELETE /drawers/transactions/:id` removes them; `balance_after` is client-supplied (computed in `doDeposit`/`doWithdraw`, accepted verbatim by `POST /drawers/transactions`), not a server-derived running sum. No DB-transaction atomicity around multi-write ops (voucher POST = 3 unwrapped writes).
