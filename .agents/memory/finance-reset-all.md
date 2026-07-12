---
name: Finance reset-all stub
description: POST /finance/reset-all is a dead/deprecated route; the correct bulk-delete endpoint is /api/admin/execute-delete.
---

## Rule
`POST /api/finance/reset-all` now returns **410 Gone** with `requireAdmin` guard.

## Why
The original route referenced non-existent tables (`transactions`, `debts`, `purchases`, `salaries`) — it always failed with 500. It also had no `requireAdmin` guard, making it a security hole. The correct bulk-delete functionality lives in `routes/admin.js`:
- `POST /api/admin/execute-delete` with `{ targetCategory: "patients" | "financials" | "all" }` — uses a transaction, deletes from correct tables, returns row counts.

## How to apply
- Never restore the old `reset-all` logic.
- The frontend DataDeletionScreen uses `api.admin.executeDelete(targetCategory)` — check there first if bulk-delete is broken.
- Confirm `requireAdmin` is present on any route that deletes data across the system.
