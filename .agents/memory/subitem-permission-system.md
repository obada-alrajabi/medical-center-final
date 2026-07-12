---
name: Staff permissions unified into single list (reversal)
description: The former second/parallel staff-permission system (staff_subitem_permissions) was fully removed; only one permission list remains.
---

**Superseded note (2026-07-03):** an earlier decision recorded here said to keep two parallel staff-permission systems (`staff_dept_permissions`/`DeptPermissions` and a newer finer-grained `staff_subitem_permissions`). The user later reversed that decision explicitly and asked for a single unified list.

**Current state:** `staff_subitem_permissions` and all its supporting code (`SUBITEM_PERM_GROUPS`, `subitemGroupFor`, `SUBITEM_PERM_SPEC`, `subitemPermKey`, `parseSubitemPermsFromApi`, the subitem-permission UI panel in StaffManagementScreen, the backend table/routes, and the `api.staff.subitemPermissions` namespace) were deleted. Only `staff_dept_permissions` / `DeptPermissions` remains, extended with four additive groups per department (profit, debts, income/revenue, expenses) that replaced the old per-department "cash-box"/drawer permission groups.

**Why:** avoid re-introducing a second permission list — if similar work resurfaces, extend the existing `DEPT_PERM_TREE` structure in App.tsx rather than building a parallel system, unless the user explicitly asks for two systems again.

**How to apply:** when adding new department-level permissions, add a new `PermSubItem` group to `DEPT_PERM_TREE` (matching the existing `{id, label, emoji, accessKey, actions}` shape), extend `DeptPermissions`/`makeDefaultDeptPerms`/`allPermOn`/`parseDeptPermissionsFromApi`, and add the corresponding column(s) to `staff_dept_permissions` in server.js. Do not create a second table or a second toggle UI.
