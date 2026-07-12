---
name: Session payment drawer deduplication
description: Why sessions POST must NOT auto-create drawer_transaction, and how the frontend handles it correctly.
---

## Rule
`routes/sessions.js` POST must never insert a `drawer_transactions` row for the paid amount.

## Why
The frontend `doDeposit()` function (App.tsx) already:
1. Calls `api.drawers.transactions.create()` with the **correct** `balance_after` (current balance + amount).
2. Calls `api.drawers.updateBalance(dept, newBal)` to persist the new drawer balance.

When the backend also auto-inserts a transaction, every paid session produces two identical `drawer_transactions` rows — one with `is_auto=true` (wrong `balance_after = amount` instead of `current + amount`) and one from the frontend.

## How to apply
- Keep the comment block in sessions POST where the auto-transaction block used to be.
- If background/API-only session creation ever needs drawer recording, it must fetch the current drawer balance first and update `drawers.balance` atomically.
- The `is_auto` column in `drawer_transactions` is preserved for future use; backend-only auto entries can use it if properly implemented.
