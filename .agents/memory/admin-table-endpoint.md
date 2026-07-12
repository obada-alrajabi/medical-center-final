---
name: Generic table admin endpoint
description: Backend endpoint that lists every DB table with row counts and deletes all rows in a single allow-listed table
---

`routes/admin.js` exposes admin-only endpoints (protected by `requireAdmin`):
- `GET /api/admin/tables` — returns `{ table, count }[]` for every table defined in `schema.sql`.
- `DELETE /api/admin/tables/:table` — deletes all rows from one table.

**Why an allow-list:** the table name comes from client input, so it is validated against a hardcoded `ALLOWED_TABLES` array (kept in sync with `schema.sql`) before being interpolated into SQL. Never accept an arbitrary table name straight from the request.

**How to apply:** this is wired into `DataDeletionScreen` (src/app/App.tsx) as a "delete a full table" section, separate from the existing scoped/typed data-deletion flow. If `schema.sql` gains or loses a table, update `ALLOWED_TABLES` in `routes/admin.js` to match.
