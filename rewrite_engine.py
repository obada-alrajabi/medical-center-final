import re

with open('src/app/financialEngine.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to completely rewrite the calculateFinancials function.
# Let's write the new function.

new_function = """export function calculateFinancials(
  sessions: { date: string; paid: number; dept: string }[],
  receiptVouchers: { date?: string; amount: number; dept?: string | null }[],
  paymentVouchers: { date?: string; amount: number; dept?: string | null; category?: string | null }[],
  purchaseRequests: { date?: string; totalAmount?: number; total_amount?: number; paidAmount?: number; paid_amount?: number; status: string; dept?: string | null }[],
  drawerTxs: DrawerTransaction[],
  debts: DebtRow[],
  invoices: { date?: string; remaining: number; status: string; dept?: string | null }[],
  externalDebts: { dir?: string; direction?: string; amount: number; status?: string }[],
  departmentId: string | null = null,
  dateFrom?: string,
  dateTo?: string,
  employeeAdvances: { date: string; amount: number; dept: string; repaid: boolean }[] = [],
): UnifiedFinancialResult {
  const fromMs = dateFrom ? toMs(dateFrom) : null;
  const toMsVal = dateTo ? toMs(dateTo, true) : null;
  const ir = (d?: string | null) => inRange(d, fromMs, toMsVal);

  const filteredSessions = sessions.filter(s =>
    (departmentId ? s.dept === departmentId : true) && ir(s.date)
  );
  const patientPayments = filteredSessions.reduce((sum, s) => sum + (Number(s.paid) || 0), 0);

  const filteredRV = receiptVouchers.filter(v =>
    (departmentId ? v.dept === departmentId : true) && ir(v.date)
  );
  const receiptVoucherRev = filteredRV.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  // Revenue = Patient Payments + Receipt Vouchers
  const revenue = patientPayments + receiptVoucherRev;

  // Expenses = ONLY the amount actually paid toward approved purchase requests
  const filteredPR = purchaseRequests.filter(r =>
    r.status === "approved" &&
    (departmentId ? r.dept === departmentId : true) &&
    ir(r.date)
  );
  const purchaseExpenses = filteredPR.reduce(
    (sum, r) => sum + (Number(r.paidAmount ?? r.paid_amount) || 0), 0
  );
  const expenses = purchaseExpenses;

  // Personal Expenses = Payment Vouchers
  const filteredPV = paymentVouchers.filter(v =>
    (departmentId ? v.dept === departmentId : true) && ir(v.date)
  );
  const personalExpenseVouchersAmt = filteredPV.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  // Salaries: Original Salaries - Approved Advances - Personal Expenses
  // Original salaries represent the full disbursed salary transaction amount (which is recorded as net in the drawer)
  // Wait, if the transaction is 'راتب موظف', the value recorded in the drawer IS the net salary.
  // The user states: "Salaries = Original Salaries - Approved Advances - Personal Expenses"
  // If the user records the ORIGINAL salary in the drawer, then the equation applies.
  // We will sum the drawer transactions for 'راتب موظف' inside the date range.
  const filteredSalary = drawerTxs.filter(t =>
    t.type === "out" &&
    SALARY_CATS.some(c => (t.category || "").includes(c)) &&
    (departmentId ? t.dept === departmentId : true) &&
    ir(t.tx_date || t.date)
  );
  const grossSalary = filteredSalary.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredAdvances = employeeAdvances.filter(a =>
    !a.repaid &&
    (departmentId ? a.dept === departmentId : true) &&
    ir(a.date)
  );
  const approvedAdvancesAmt = filteredAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // To perfectly match user's explicit request: Salaries = Original Salary(grossSalary) - Advances - Personal Expenses
  const salaryCost = grossSalary - approvedAdvancesAmt - personalExpenseVouchersAmt;

  // Net Profit = Revenue - (Expenses + Salaries)
  const profit = revenue - (expenses + salaryCost);

  const filteredDebts = departmentId ? debts.filter(d => d.dept === departmentId) : debts;
  const patientDebts = filteredDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const filteredInvoices = invoices.filter(i =>
    i.status !== "paid" && (departmentId ? i.dept === departmentId : true) && ir(i.date)
  );
  const insuranceDebts = filteredInvoices.reduce((s, i) => s + (Number(i.remaining) || 0), 0);

  // Company Debts = remaining unpaid balance of approved purchase requests
  const companyCreditors = filteredPR.reduce((s, r) => {
    const total = Number(r.totalAmount ?? r.total_amount) || 0;
    const paid = Number(r.paidAmount ?? r.paid_amount) || 0;
    return s + (total - paid);
  }, 0);

  return {
    revenue,
    expenses,
    salaryCost,
    profit,
    patientDebts,
    insuranceDebts,
    companyCreditors,
    breakdown: {
      revenue: { patientPayments, receiptVouchers: receiptVoucherRev },
      expenses: { purchaseRequests: purchaseExpenses, personalExpenseVouchers: personalExpenseVouchersAmt },
      salary: { grossDisbursed: grossSalary, personalExpenseDeduction: personalExpenseVouchersAmt, advanceDeduction: approvedAdvancesAmt },
    },
  };
}"""

# regex to replace the function calculateFinancials
pattern = re.compile(r"export function calculateFinancials\([\s\S]*?^}\n", re.MULTILINE)
if not pattern.search(content):
    print("Could not find calculateFinancials")
else:
    content = pattern.sub(new_function + "\n", content)
    with open('src/app/financialEngine.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced calculateFinancials")

