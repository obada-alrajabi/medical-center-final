---
name: DB-vs-UI permission audits
description: How to audit staff_dept_permissions DB columns against the frontend DeptPermissions tree and decide what to wire vs. skip.
---

When a task says the permissions/departments screen is missing options that exist in the database, audit by diffing the live schema against the frontend type, not by trusting either side blindly.

**Why:** A prior `staff_dept_permissions` audit found 10 DB columns absent from the frontend `DeptPermissions` type/tree. Wiring all 10 blindly would have re-introduced `can_edit_voucher`, a column with no matching "edit voucher" feature anywhere in the app (see permission-tree-scope.md) — it was previously dropped on purpose. Backend routes for staff permissions are already column-agnostic (`Object.keys(req.body)`), so gaps are almost always frontend-only.

**How to apply:**
1. `psql \d staff_dept_permissions` (or equivalent) to get the authoritative column list.
2. Grep the frontend `DeptPermissions` type/tree for each column name (camelCase) to find what's missing.
3. Before wiring a missing column, grep for the real UI action it should gate. If one exists (e.g. drawer view/balance/history/stats/charts/employees/invoices/settle — all real drawer screen sections), wire it into: type, `makeDefaultDeptPerms`, the subitem/tree catalog entries, `allPermOn`, `savePerms` (camelCase→snake_case), and `parseDeptPermissionsFromApi`.
4. If no matching feature exists, leave the column unwired — do not invent UI just to justify it.
