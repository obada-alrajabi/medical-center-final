---
name: Dynamic depts, Reception, Date filters
description: How custom departments, reception screen, and financial date filters are wired in App.tsx
---

## Custom Departments
- `customDepts` state lives in App root: `useState<Array<{id,name,short,iconId}>>([])`.
- `onAddDeptDrawer(deptId)` initializes an empty drawer entry when a new dept is created.
- `Sidebar` accepts `customDepts` prop and maps them to nav items using `iconById()`.
- `StaffManagementScreen` accepts `customDepts`, `setCustomDepts`, `onAddDeptDrawer` and renders a "depts" tab (إدارة الأقسام) with ICON_OPTIONS picker (10 icons).
- `ICON_OPTIONS` constant and `iconById()` helper are defined just above `StaffManagementScreen`.
- The "إدارة الأقسام" button appears in the list tab header of StaffManagementScreen.

**Why:** Admins need to add clinic-specific departments (e.g. pediatrics) without code changes.

## Reception Screen
- `ReceptionScreen` is a standalone queue-management screen (waiting/called/done states + add-patient form + drawer tab).
- Wired via `case "reception":` in App's `renderScreen`.
- Nav entry is in `NAV_ITEMS_BASE` (not in DEPARTMENTS, so it's always fixed).
- Drawer initialized in `initialDrawers` with key `"reception"`.

## Financial Date Range Filters
- `FinAllDrawersScreen`: `finFrom`/`finTo` state, filters `allTxs` rows.
- `DebtManagementScreen`: `debtFrom`/`debtTo` state, filters debt rows by `dueDate`.
- `PayrollScreen`: `payFrom`/`payTo` state + `inPayRange()` helper; shows pending employees regardless of range; filters paid by `paidDate` (converted dd/mm/yyyy → iso).
- `FinRevenueScreen`: `revFrom`/`revTo` state; filter bar UI added to header row (no data filtering yet — data is mock; bar is UI-complete for future wiring).

**How to apply:** All date inputs use native `<input type="date">` (ISO format) inside a blue pill row. Clear button (`<X>`) shown only when a date is set.
