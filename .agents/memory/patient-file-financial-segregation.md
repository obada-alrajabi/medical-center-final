---
name: Patient file financial segregation
description: How financial data visibility is scoped by department in PatientFileScreen (Unified Medical File / Isolated Financial File).
---

Patient sessions/history stay unified across departments (diagnoses, meds, referrals visible to
any staff), but financial figures (invoice amount, paid, debt) inside `PatientFileScreen` are
gated per-department for non-admin staff via a `canSeeFinance(sessDept)` helper
(`isAdmin || sessDept === dept`). Admin always sees all departments' financial data combined.

**Why:** User's sovereign-order security requirement — a patient has one unified medical file, but
each department's staff must not see another department's invoices/debts/vouchers. Net effect must
still look like a single coherent screen, so cross-dept sessions remain visible for medical context
but their money fields are masked with a lock icon instead of being removed entirely.

**How to apply:** Any new report/print/export generated from `PatientFileScreen` (or a similarly
unified per-patient view) must reuse the same `canSeeFinance` gate — never assume `pSess`/`debts`
arrays are safe to sum directly once a `dept`-scoped staff view is involved. Only apply this
gating inside patient-file-style screens; department-scoped screens (drawers, dept revenue, etc.)
are already inherently scoped and don't need it.
