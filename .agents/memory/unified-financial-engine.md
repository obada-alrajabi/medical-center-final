---
name: Unified Financial Engine
description: Architecture decisions for financialEngine.ts — single accounting engine for all financial screens.
---

## Rule
`calculateFinancials()` in `src/app/financialEngine.ts` is the ONLY profit engine.
Every financial screen must use it or derive from it — no ad-hoc drawer-based formulas.

**Formula (exact):**
- Revenue = sessions.paid + receiptVouchers.amount (for the date range)
- Expenses = approved purchaseRequests.totalAmount + personal paymentVouchers
- Gross Salary = drawer "راتب موظف" transactions
- Personal deduction = paymentVouchers with personal-expense categories
- Advance deduction = employeeAdvances where !repaid (for period)
- Salary Cost = max(0, grossSalary − personalDeduction − advanceDeduction)
- Profit = Revenue − (Expenses + Salary Cost)

Personal expense voucher categories: `["نفقة شخصية للموظف","مصروف شخصي — موظف","مصروف شخصي"]`

## Signature (12 params)
```ts
calculateFinancials(
  sessions, receiptVouchers, paymentVouchers, purchaseRequests,
  drawerTxs, debts, invoices, externalDebts,
  departmentId, dateFrom, dateTo,
  employeeAdvances  // ← 12th param; filter !a.repaid inside engine
)
```

## Prop naming quirk — FinancialSummaryScreen
FinancialSummaryScreen has its OWN local state named `receiptVouchers` and `paymentVouchers`
(loaded via internal useEffect for CRUD). Do NOT add props with those same names — conflict.
Instead the prop for global payment vouchers is named **`allPaymentVouchers`** and for
global receipt vouchers **`allReceiptVouchers`**.
StaffPortal also receives and passes `allPaymentVouchers` AND `allReceiptVouchers`.

## Global voucher state
`receiptVouchersGlobal` and `paymentVouchersGlobal` are App-root state vars.
All financial screens receive them. FinancialSummaryScreen uses them for KPIs
(allReceiptVouchers/allPaymentVouchers props) while its local CRUD state handles display.

## Authoritative sources per metric
- Patient revenue: `sessions.paid` (NOT drawer "in" txs)
- Receipt voucher revenue: `receiptVouchers` records (NOT drawer "سند قبض" mirrors)
- Expenses: `purchaseRequests` (approved) + `paymentVouchers` records
- Salary cost: drawer "راتب موظف" txs MINUS personal PV MINUS approved advances
- Charts (dept revenue, monthly trend): sessions-based, NOT drawer "in" txs
- Expense pie: paymentVouchers categories + approved PRs + salary tx net
- Total withdrawals KPI: drawer "out" txs (cash-flow metric, drawer-based is correct)
- Drawer balance: drawer state (correct — it IS the drawer balance)

## FinancialSummaryScreen hybrid approach
Uses `calculateFinancials()` for headline KPIs (totalRevenue, netProfit).
`totalWithdrawals` stays drawer-based (it is a cash-flow, not a P&L metric).
Local voucher CRUD state (`receiptVouchers`/`paymentVouchers` useState) is for the
CRUD table UI only — KPIs always use the allReceiptVouchers/allPaymentVouchers props.

## Why
Old system had 3+ different profit formulas across screens — same period showed different
numbers on Dashboard vs FinProfitScreen vs FinancialSummaryScreen. Engine unification
makes all screens agree on the same period.

## How to apply
When adding a new financial KPI or screen: import `calculateFinancials` and pass the
domain tables (sessions, receiptVouchers, paymentVouchers, purchaseRequests, employeeAdvances)
+ drawerTxs for salary only. Never compute revenue from drawer "in" totals directly.
