---
name: StaffPortal scope bug
description: StaffPortal is defined outside App — App state vars that must be passed as props, not accessed as closures.
---

## The Rule
`StaffPortal` is defined at module level (line ~9042), BEFORE `export default function App()` (line ~10880). It cannot access any React state from App as a closure.

**Why:** JavaScript closures only work inward (inner functions see outer vars). StaffPortal is a sibling of App, not nested inside it.

**Variables that MUST be props of StaffPortal (not closures):**
- `drugs` / `setDrugs` — used in NewPatientScreen and NewSessionScreen calls
- `staffList` — used in AttendanceScreen call
- `customDepts` — used in AttendanceScreen and DeptVouchersScreen calls, and for ALL_DEPTS
- `insurances` — used in DeptVouchersScreen call

**How to apply:**
- Any new App state used inside StaffPortal MUST be added to: (1) StaffPortal's destructured params, (2) StaffPortal's TypeScript type, (3) the `<StaffPortal .../>` call in App.
- Always add with safe defaults (e.g., `drugs=[]`) so the prop is optional.
- `ALL_DEPTS` inside StaffPortal must be built as `[RECEPTION_DEPT, ...DEPARTMENTS, ...customDeptsAsDepts]` to include custom depts.

**Missing screen blocks (also fixed):**
StaffPortal was missing render blocks for `lab-queue`, `lab-inventory`, `rad-queue`, `rehab-session`, `rehab-catalog`, `rehab-queue`. Clicking those sidebar items showed blank content. Always add a `{subScreen==="X"&&...}` block for every item added to `buildSubItems()`.
