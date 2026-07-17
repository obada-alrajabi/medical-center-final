import { calcNetProfit } from "../utils/finance.js";

export interface DrawerTransaction {
  id?: number;
  dept: string;
  type: "in" | "out";
  title: string;
  category?: string | null;
  amount: number;
  tx_date?: string | null;
  date?: string | null;
  is_opening_balance?: boolean;
}

export interface DebtRow {
  id?: number;
  dept?: string;
  amount: number;
  [key: string]: unknown;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDebts: number;
  netProfit: number;
  breakdown: {
    income: { patients: number; receipts: number; other: number };
    expenses: { salaries: number; advances: number; purchases: number; vouchers: number; externalDebts: number; other: number };
  };
}

export interface UnifiedFinancialResult {
  revenue: number;
  expenses: number;
  salaryCost: number;
  profit: number;
  patientDebts: number;
  insuranceDebts: number;
  companyCreditors: number;
  breakdown: {
    revenue: { patientPayments: number; receiptVouchers: number };
    expenses: { purchaseRequests: number; personalExpenseVouchers: number };
    salary: { grossDisbursed: number; personalExpenseDeduction: number; advanceDeduction: number };
  };
}

const PERSONAL_EXP_CATS = ["نفقة شخصية للموظف", "مصروف شخصي — موظف", "مصروف شخصي"];
const SALARY_CATS = ["راتب موظف", "salary"];
const SKIP_CATS = ["رصيد افتتاحي"];

function toMs(raw: string | null | undefined, endOfDay = false): number | null {
  if (!raw) return null;
  const clean = (raw.includes("T") ? raw.slice(0, 10) : raw).trim();
  let iso: string;
  if (clean.includes("/")) {
    const p = clean.split("/");
    iso = p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : clean;
  } else {
    iso = clean;
  }
  const suffix = endOfDay ? "T23:59:59+03:00" : "T00:00:00+03:00";
  const d = new Date(iso + suffix);
  if (isNaN(d.getTime())) return null;
  return d.getTime();
}

function inRange(date: string | null | undefined, fromMs: number | null, toMsVal: number | null): boolean {
  if (!fromMs && !toMsVal) return true;
  const ms = toMs(date);
  if (ms === null) return true;
  if (fromMs !== null && ms < fromMs) return false;
  if (toMsVal !== null && ms > toMsVal) return false;
  return true;
}

/**
 * calculateFinancials — unified accounting engine
 *
 * Authoritative rules:
 *   Revenue        = Patient Payments (sessions.paid) + Receipt Vouchers
 *   Expenses       = Approved Purchase Requests + Personal Expense Payment Vouchers
 *   Salary Cost    = Net salary disbursed (drawer "راتب موظف" transactions)
 *   Profit         = Revenue − (Expenses + Salary Cost)
 *   Patient Debts  = debts table totals
 *   Insurance Debts= invoices remaining (status ≠ paid)
 *   Company Creditors = external_debts direction="received" + status pending (global only)
 *
 * Dates: handles both DD/MM/YYYY (sessions) and YYYY-MM-DD (vouchers/purchaseRequests).
 */
// ── سندات القبض الصادرة "مرآةً" عن تسديد دين مريض موجود أصلاً (من ملف المريض
//    أو من شاشة إدارة الديون) تحمل هذا النص دائماً بحقل reason (نصّ يضبطه
//    النظام نفسه عند الإنشاء، وليس نصاً حراً يكتبه المستخدم) — نستخدمه لاستثناء
//    هذه السندات من معادلة الإيرادات، لأن نفس المبلغ محتسب أصلاً عبر تحديث
//    sessions.paid (انظر الشرح المفصّل عند فلترة filteredRV بالأسفل). ──
export const DEBT_SETTLEMENT_RV_MARKER = "تسديد دين مريض";

// ── مساعد مشترك: أي مكان بالتطبيق بيجمع receiptVouchers مباشرة كـ"إيراد"
//    (خارج calculateFinancials) لازم يستخدم هذا الفلتر أولاً، وإلا كل تسديد
//    دين (اللي بيرفع sessions.paid تلقائياً) بينضاف مرة ثانية كسند قبض منفصل
//    فيتضاعف الإيراد المعروض. ──
export const isRevenueReceiptVoucher = (v: { reason?: string | null }): boolean =>
  !(v.reason || "").startsWith(DEBT_SETTLEMENT_RV_MARKER);

export function calculateFinancials(
  sessions: { date: string; paid: number; dept: string }[],
  receiptVouchers: { date?: string; amount: number; dept?: string | null; reason?: string | null }[],
  paymentVouchers: { date?: string; amount: number; dept?: string | null; category?: string | null; paid_to_type?: string | null }[],
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

  // ── استثناء سندات القبض "المرآة" لتسديد ديون المرضى: لما يُسدَّد دين مريض
  //    (من ملف المريض أو من شاشة إدارة الديون)، الكود يعمل شيئين للمبلغ نفسه:
  //    (1) ينشئ سند قبض حقيقي، و(2) يزيد sessions.paid لنفس الجلسة (حتى يبقى
  //    "المدفوع" بملف المريض مطابقاً للواقع). فلو حسبنا كِلا الأثرين هون —
  //    receiptVouchers (سندات القبض) + patientPayments (sessions.paid) — كل
  //    تسديد دين كان يتضاعف بمعادلة الإيرادات. نبقي السند نفسه (للطباعة
  //    والأرشفة) لكن نستثنيه من مجموع الإيرادات لأن مصدر الحقيقة الوحيد لهذا
  //    المبلغ هو sessions.paid عبر patientPayments أدناه. ──
  const filteredRV = receiptVouchers.filter(v =>
    (departmentId ? v.dept === departmentId : true) && ir(v.date) &&
    !(v.reason || "").startsWith(DEBT_SETTLEMENT_RV_MARKER)
  );
  const receiptVoucherRev = filteredRV.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  // Revenue = Patient Payments + Receipt Vouchers
  const revenue = patientPayments + receiptVoucherRev;

  // Expenses = amount actually paid toward approved purchase requests
  //          + personal expense payment vouchers (real cash leaving the drawer,
  //            counted as an expense on the day it is disbursed — see below)
  const filteredPR = purchaseRequests.filter(r =>
    r.status === "approved" &&
    (departmentId ? r.dept === departmentId : true) &&
    ir(r.date)
  );
  const purchaseExpenses = filteredPR.reduce(
    (sum, r) => sum + (Number(r.paidAmount ?? r.paid_amount) || 0), 0
  );

  // Personal Expenses = Payment Vouchers (paid_to_type === "staff") — لكن هذه
  // ── منذ هذا التعديل ── مستبعدة بالكامل من "المصروفات" و"صافي الربح"، بقرار
  // صريح من صاحب النظام: سند الصرف الشخصي هو مبلغ يُسجَّل على حساب الموظف
  // نفسه ويُخصم لاحقاً من راتبه الفعلي — بما إن "صافي الربح" أصلاً بيخصم
  // الراتب (salaryCost) وهذا الراتب يفترض إنه محسوب صافياً بعد خصم أي سندات
  // صرف شخصية أخذها الموظف مسبقاً، فحسابها هون كمان كـ"مصروف" منفصل كان
  // بيعتبر بمثابة خصمها مرتين من صافي الربح (مرة كمصروف مباشر، ومرة ضمنياً
  // عبر الراتب الصافي الأقل). لسا نحسبها (personalExpenseVouchersAmt) ونرجعها
  // بالنتيجة لأغراض العرض/التقارير المستقلة (شاشات "سندات الصرف" ونظام
  // الرواتب)، فقط ما عادت تدخل على "expenses"/"profit" هون. سندات دفعات
  // الموردين (paid_to_type === "supplier") تبقى مستثناة كما كانت — قيمتها
  // محسوبة أصلاً عبر purchase_requests.paid_amount أعلاه (purchaseExpenses).
  const filteredPV = paymentVouchers.filter(v =>
    (departmentId ? v.dept === departmentId : true) && ir(v.date) &&
    v.paid_to_type !== "supplier"
  );
  const personalExpenseVouchersAmt = filteredPV.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  const expenses = purchaseExpenses;

  // Salaries: drawer transactions actually recorded as "راتب موظف" disbursements.
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

  // Salary Cost = actual disbursed salary, reduced only by advances already paid
  // out to the same employees — but never below zero. Advances given before any
  // salary is disbursed in the period must not flip salaryCost negative (which
  // would otherwise ADD to profit instead of subtracting from it).
  const salaryCost = Math.max(0, grossSalary - approvedAdvancesAmt);

  // Net Profit = Revenue - (Expenses + Salaries)
  const profit = revenue - (expenses + salaryCost);

  const filteredDebts = debts.filter(d => (departmentId ? d.dept === departmentId : true) && ir(d.date));
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
}

/**
 * calculateFinancialsLegacy — drawer-based engine kept for any ad-hoc usage.
 * @deprecated Prefer calculateFinancials with domain tables.
 */
export function calculateFinancialsLegacy(
  transactions: DrawerTransaction[],
  debts: DebtRow[],
  departmentId: string | null = null,
  dateFrom?: string,
  dateTo?: string,
): FinancialSummary {
  const ADVANCE_CATS  = ["سلف موظفين", "سلفة موظف"];
  const PURCHASE_CATS = ["مشتريات مباشرة", "مشتريات", "purchase", "supply", "مستلزمات"];
  const VOUCHER_CATS  = ["سند صرف", "voucher_out", "إلغاء سند قبض"];
  const EXT_DEBT_CATS = ["ديون خارجية"];
  const PATIENT_CATS  = ["إيراد مريض"];
  const RECEIPT_CATS  = ["سند قبض", "سند قبض — دفعة نقدية", "إلغاء سند صرف"];

  function catIn(cat: string | null | undefined, list: string[]): boolean {
    if (!cat) return false;
    return list.some(c => cat.includes(c));
  }

  let txs = departmentId ? transactions.filter(t => t.dept === departmentId) : [...transactions];

  if (dateFrom || dateTo) {
    const fromMs = toMs(dateFrom);
    const toMsVal = toMs(dateTo, true);
    txs = txs.filter(t => {
      const raw = t.tx_date || t.date;
      if (!raw) return true;
      const ms = toMs(raw);
      if (ms === null) return true;
      if (fromMs !== null && ms < fromMs) return false;
      if (toMsVal !== null && ms > toMsVal) return false;
      return true;
    });
  }

  const result: FinancialSummary = {
    totalIncome: 0, totalExpenses: 0, totalDebts: 0, netProfit: 0,
    breakdown: {
      income: { patients: 0, receipts: 0, other: 0 },
      expenses: { salaries: 0, advances: 0, purchases: 0, vouchers: 0, externalDebts: 0, other: 0 },
    },
  };

  for (const t of txs) {
    const amount = Number(t.amount) || 0;
    const cat = t.category;
    if (catIn(cat, SKIP_CATS)) continue;
    if (t.type === "in") {
      result.totalIncome += amount;
      if (catIn(cat, PATIENT_CATS))       result.breakdown.income.patients += amount;
      else if (catIn(cat, RECEIPT_CATS))  result.breakdown.income.receipts += amount;
      else                                result.breakdown.income.other    += amount;
    } else if (t.type === "out") {
      result.totalExpenses += amount;
      if (catIn(cat, SALARY_CATS))         result.breakdown.expenses.salaries     += amount;
      else if (catIn(cat, ADVANCE_CATS))   result.breakdown.expenses.advances     += amount;
      else if (catIn(cat, PURCHASE_CATS))  result.breakdown.expenses.purchases    += amount;
      else if (catIn(cat, VOUCHER_CATS))   result.breakdown.expenses.vouchers     += amount;
      else if (catIn(cat, EXT_DEBT_CATS))  result.breakdown.expenses.externalDebts += amount;
      else                                 result.breakdown.expenses.other         += amount;
    }
  }

  const filteredDebts = departmentId ? debts.filter(d => d.dept === departmentId) : debts;
  result.totalDebts = filteredDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  result.netProfit = calcNetProfit(result.totalIncome, 0, result.totalExpenses, 0);
  return result;
}
