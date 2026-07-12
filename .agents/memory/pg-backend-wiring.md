---
name: PostgreSQL backend wiring
description: Full DB wiring status for all CRUD operations in the hospital app
---

## Startup data loading (Promise.all — 19 items)
drawers, patients, staff, employees, staffAdvanceRequests (x2), externalDebts,
insurances, customDepts, admins, debts, employeeAdvances, labTests, inventory,
radImages, sessions, invoices, **attendance**, **purchaseRequests**

## All mutations wired to DB (as of 2026-07-01)

| Feature | Operations |
|---|---|
| drawers / transactions | CREATE tx + UPDATE balance (doDeposit/doWithdraw/doAdjust) |
| patients | CREATE (Reception, NewPatient, LabSession, RadSession) |
| sessions | CREATE (NewSessionScreen) |
| debts | CREATE / UPDATE / DELETE |
| external_debts | CREATE / UPDATE |
| lab_tests | CREATE / UPDATE / DELETE |
| lab_inventory | CREATE / UPDATE / DELETE + qty deduct per test in LabSession |
| rad_catalog | CREATE / UPDATE / DELETE |
| invoices | CREATE (insurance patient) / UPDATE (settle) |
| purchase_requests | CREATE / UPDATE-approve / UPDATE-reject |
| insurance companies | CREATE / UPDATE / DELETE |
| attendance_records | CREATE / UPDATE / DELETE |
| staff | CREATE / UPDATE / DELETE + permissions |
| staff_advance_requests | CREATE / APPROVE / REJECT |
| departments (custom) | CREATE / UPDATE / DELETE |
| sidebar settings | READ / SAVE (direct fetch PUT, not api.ts) |
| payroll employees | UPDATE status paid |

## Not implemented
- Backup screen — not built

## Key quirks

**Route ordering in staff.js:** `/staff/advance-requests` must be registered BEFORE `/:id`
or Express matches it as `/:id = "advance-requests"` → integer cast → 500 error.

**Column name:** `staff_advance_requests` uses `request_date` (not `date`).

**`invoices.remaining`** is GENERATED ALWAYS AS (total-paid) — omit from INSERT.

**`sessions.patient_id` FK** was dropped to allow historical session seeding.

**`drawer_transactions.balance_after`** is NOT NULL — seed with 0.

**Historical data seeded:** 47 purchase_requests + 16 attendance_records in DB.

**`purchase_request_items`** are a separate table; initial DB load returns items:[] empty array
(full items need per-request JOIN — not implemented in initial load).

**mockPatients:** mutable module-level array; DB patients pushed into it on mount; new
patients also push + call API.

**drawersRef:** useRef mirror of drawers state used in doDeposit/doWithdraw for
synchronous balance read without closure staleness.

**DB admin login:** password_hash stored as plain text, compared directly (no bcrypt).
