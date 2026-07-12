---
name: Voucher name/reason field requirements
description: Receipt/payment voucher forms (rvModal/pvModal in FinanceVouchersScreen and DeptVouchersScreen) — correct requirement for name entry by type.
---

Two separate voucher-entry implementations exist: `FinanceVouchersScreen` (admin finance route) and `DeptVouchersScreen` (StaffPortal / dept-vouchers route). Both handle receipt vouchers (received_from) and payment vouchers (paid_to), each with a type selector (patient/insurance/staff/supplier vs. "أخرى"/other).

**Confirmed requirement (per explicit user correction):** for the موظف/مريض/شركة/مورد (staff/patient/insurance/supplier) types, the name field must be a searchable dropdown only — no free text allowed, must select an existing record. Free text is only permitted when type = "أخرى" (Other).

**Why:** Prevents unlinked/misspelled names from being recorded against real financial entities; keeps received_from_id/paid_to_id populated so the backend can join to the actual patient/insurance/staff/supplier row (backend already supports these id columns in `routes/finance.js`).

**How to apply:** Both screens now: (1) bind the visible input to a local search string, not directly to the name field; (2) only set `received_from_name`/`paid_to_id` (or `paid_to_name`/`paid_to_id`) when the user clicks a dropdown suggestion; (3) show a red "no match" hint when search text yields zero results; (4) block save (`saveRv`/`savePv`) if the selected type is not "other" and no id was set. `DeptVouchersScreen` sources patients from the module-level `mockPatients` array (no `patients` prop needed) and gets employees/insurances/suppliers via existing props.
