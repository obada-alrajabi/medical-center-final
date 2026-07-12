---
name: Patient screen architecture
description: Three-screen patient workflow — how screens connect and what props they require
---

## Screens

### OpenPatientScreen
- Two-panel split: left = patient list (300px), right = selected patient detail + recent sessions
- Props: `dept, onNavigate, sessions: PatientSession[], debts: DebtRow[]`
- Debt shown via `liveDebt(pid) = debts.filter(d=>d.pid===pid).sum()`
- Last visit derived from sessions, falls back to mockPatients.date
- Actions: "الملف الكامل" → patient-file, "جلسة جديدة" → new-session, "مريض جديد" → new-patient

### NewSessionScreen
- For EXISTING patients only (no basic info re-entry)
- Props: `dept, patientId, sessions, setSessions, doDeposit, setDebts, toast, onNavigate, diagnoses, setDiagnoses`
- Sections: diagnosis (searchable, addable), medications (add/remove rows), referrals (lab+rad checkboxes), financials (amount/paid → debt), notes, file upload
- On save: deposits paid amount to dept drawer, creates DebtRow if underpaid, adds PatientSession

### PatientFileScreen
- Props: `dept, onNavigate, patientId, sessions: PatientSession[], debts: DebtRow[]`
- Header shows liveDebt (from debts state) and lastVisit (from sessions)
- Three tabs: الجلسات (expandable cards), الوصفات (table), الإحالات (table)

## Data types
- `PatientSession`: id, patientId, dept, doctor, date, diagnoses[], medications[], notes, labRefs[], radRefs[], amount, paid, debt
- `DiagnosisEntry`: id, code, name, category
- `Route`: screen, dept?, patientId?

## Key rule
**Why:** debt must come from `debts` state (not mockPatients.debt) so settling a debt in DebtManagementScreen is reflected immediately in patient headers.
**How to apply:** any screen showing patient debt should use `debts.filter(d=>d.pid===pid).sum()`.
