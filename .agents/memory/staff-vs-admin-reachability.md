---
name: Staff vs admin screen reachability
description: Which screens/permission flags are real (staff-reachable) vs structurally dead, before extending any permission tree.
---

Before extending the staff permission system, check which screens a non-admin staff login can actually reach. `StaffPortal` (rendered for `loggedUser.type==="staff"`) has its own independent render switch, separate from the admin `App`'s `renderScreen()`. Screens only present in the admin switch (financial system fin-*, staff-management, dept-management, delete-requests, settings screens, admin-reminders/admin-broadcast) are never rendered for staff — an admin login (`isAdminRole`) always bypasses permission checks by design, so there is nothing to gate there.

**Why:** `StaffMember.canAccessSettings`, `canManageStaff`, and `canAccessReports` are saved/edited in the UI but have zero real gating usage anywhere in the codebase — they are dead flags left over from an earlier design. Only `canAccessFinancial` does real work (gates one dept-scoped mini financial view inside StaffPortal). `canPrint` in `DEPT_PERM_TREE` is likewise unwired (no conditional ever checks it) but must stay untouched since wiring it would mean touching print code, which is off-limits.

**How to apply:** Grep for `case"<screen>"` in both the admin `renderScreen` switch and `StaffPortal`'s own `subScreen===` blocks before adding any new permission granularity for that screen. If a screen only appears in the admin switch, do not build staff-facing checkboxes for it — that would be inventing controls for something structurally unreachable. The existing `DEPT_PERM_TREE` (per-dept 3-level tree: dept → sub-item → sensitive action) already has full 1:1 parity with everything staff can actually reach.
