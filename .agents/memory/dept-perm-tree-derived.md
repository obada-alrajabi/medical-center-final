---
name: Dept permission tree derived from admin menu
description: DEPT_PERM_TREE for built-in depts is generated from NAV_ITEMS_BASE, not hardcoded; how to extend it correctly.
---

The built-in-department employee-permission tree (`DEPT_PERM_TREE` in `src/app/App.tsx`) is **generated at module load** by `buildDeptPermTree()`, which iterates `NAV_ITEMS_BASE` (the admin sidebar menu = single source of truth) rather than being a hand-written object.

**Why:** product decision — admin-menu submenus must drive each dept's permission sub-items so future admin-menu additions auto-appear in the permissions screen without a second edit.

**How to apply:**
- Each dept child's `screen` is resolved to a permission-catalog id via `deptNavScreenToSubItemId`: explicit `DEPT_PERM_NAV_SCREEN_TO_SUBITEM` map, then suffix rules (`-purchase-reqs`→`purchase-reqs`, `-print`→`print-export`), then an **identity fallback** (if the screen name equals an `AVAILABLE_DEPT_SUBITEMS` id, use it directly). So to make a NEW admin menu item appear in permissions, just add a matching-id entry to `AVAILABLE_DEPT_SUBITEMS` (or the explicit map if the screen name differs).
- Permission-only extras that are NOT admin menu items (reception `open-patient`; `staff-advance` for all depts) live in `DEPT_PERM_EXTRAS` and are appended after menu-derived items. Reception has no `open-patient` in NAV, so it MUST stay in extras.
- The definition (accessKey + granular actions + emoji) always comes from `AVAILABLE_DEPT_SUBITEMS` — labels are overridden from the menu child label.
- The financial **drawer** (`dept-drawer`) sub-section was removed from `AVAILABLE_DEPT_SUBITEMS` and `CUSTOM_DEPT_SUBITEM_ORDER`, but all `canDrawer*` keys stay in `types.ts`/`utils.makeDefaultDeptPerms`/save/parse — the DeptDrawerScreen still exists gated by `canDrawerView`. Do not treat those keys as unused.

**Dept personal-expense voucher:** DeptVouchersScreen payment-voucher modal supports reason `"نفقة شخصية للموظف"` (staff beneficiary required); savePv sends `category` = that string so it's reportable/searchable. Receipt vouchers untouched. Backend payment-voucher create already accepts `category` (FinancialSummaryScreen sends it too).
