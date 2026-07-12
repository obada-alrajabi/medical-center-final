---
name: App data model
description: Single-file app state structure and how data flows between screens
---

## State in App root
- `drawers`: Record<dept, {balance, txs[]}> — updated by doDeposit/doWithdraw
- `debts`: DebtRow[] — updated by NewSessionScreen (underpayment), LabSessionScreen (underpayment), DebtManagementScreen (settlement)
- `sessions`: PatientSession[] — updated by NewSessionScreen.handleSave
- `diagnoses`: DiagnosisEntry[] — can be added inline in NewSessionScreen
- `employees`, `invoices`: payroll and company invoices

## Key connections
- `doDeposit(dept, amount, title, category)` → updates drawer balance + appends tx
- `doWithdraw(dept, amount, title, category, beneficiary?)` → same pattern
- Settling a debt in DebtManagementScreen calls doDeposit + removes from debts[]
- Payroll payment calls doWithdraw

**Why:** all state is React in-memory; nothing persists on refresh (Task #2 is pending to fix this).

## Naming convention for drawer deposits
Pattern: `دفعة مريض — {patientName}`, category: `إيراد مريض`
