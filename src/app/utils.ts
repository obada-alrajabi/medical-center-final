import type { DeptPermissions, DeptPrintAdv } from "./types";

// ─── FORMAT ──────────────────────────────────────────────────────────────────

export const fmt = (n: number | undefined | null): string =>
  `₪ ${(n ?? 0).toLocaleString("en-US")}`;

// ── العمر أصبح حقل نص حر (مش رقم سنوات فقط) — لدعم كتابة عمر الرضّع بالأشهر
//    مباشرة (مثلاً "9 أشهر") بدل إجبار المستخدم على تحويلها لسنوات. لو القيمة
//    المخزّنة رقم صرف (بيانات قديمة من قبل هذا التحديث، أو أدخلها المستخدم
//    كرقم سنوات عادي)، نلحقها بكلمة "سنة" تلقائياً زي ما كان يصير سابقاً؛
//    أما لو المستخدم كتب نص كامل (مثل "9 أشهر" أو "35 سنة")، نعرضه كما هو
//    بدون أي إضافة. ──
export const formatAge = (age: string | number | undefined | null): string => {
  const s = String(age ?? "").trim();
  if (!s) return "";
  return /^\d+(\.\d+)?$/.test(s) ? `${s} سنة` : s;
};

// ─── PALESTINE / JERUSALEM TIMEZONE (UTC+3) ──────────────────────────────────

export const _JLM_OFFSET = 3 * 60 * 60 * 1000;
export const _jlmNow = (): Date => new Date(Date.now() + _JLM_OFFSET);

export const _nowDT = (): { date: string; time: string } => {
  const d = _jlmNow();
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return { date: `${dd}/${mm}/${yy}`, time: `${hh}:${mi}:${ss}` };
};

export const _today = (): string => {
  const d = _jlmNow();
  return `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()}`;
};

export const _isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export const _localISO = (): string => _jlmNow().toISOString().slice(0, 10);

export const _nowHHMM = (): string => {
  const d = _jlmNow();
  return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
};

// ─── DATE RANGE FILTER ───────────────────────────────────────────────────────

export function inRangeDDMMYYYY(dateStr: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const parse = (s: string): Date | null => {
    if (!s) return null;
    const clean = s.trim();
    // Support DD/MM/YYYY
    if (clean.includes("/")) {
      const p = clean.split("/");
      if (p.length === 3) {
        const [d, m, y] = p.map(Number);
        if (!isNaN(y) && y > 2000) return new Date(y, m - 1, d, 12, 0, 0);
      }
    }
    // Support YYYY-MM-DD
    const parts = clean.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts.map(Number);
      if (!isNaN(y)) return new Date(y, m - 1, d, 12, 0, 0);
    }
    const iso = Date.parse(clean);
    if (!isNaN(iso)) {
      const d = new Date(iso);
      d.setHours(12, 0, 0, 0);
      return d;
    }
    return null;
  };
  const date = parse(dateStr);
  if (!date) return false;
  if (from) {
    const f = parse(from);
    if (f) {
      f.setHours(0, 0, 0, 0);
      if (date < f) return false;
    }
  }
  if (to) {
    const t = parse(to);
    if (t) {
      t.setHours(23, 59, 59, 999);
      if (date > t) return false;
    }
  }
  return true;
}

// ─── LOCALSTORAGE HELPERS ────────────────────────────────────────────────────

export const _lsGetMargins = (dept: string): {top:number;right:number;bottom:number;left:number} | null => {
  try {
    const r = localStorage.getItem(`print_margins_${dept}`);
    if (r) return JSON.parse(r);
  } catch (_) {}
  return null;
};

export const _lsSaveMargins = (dept: string, m: {top:number;right:number;bottom:number;left:number}): void => {
  try { localStorage.setItem(`print_margins_${dept}`, JSON.stringify(m)); } catch (_) {}
};

export const _lsGetLetterhead = (dept: string): string => {
  try { return localStorage.getItem(`print_letterhead_${dept}`) || ""; } catch (_) { return ""; }
};

export const _lsGetLetterheadGlobal = (): string => {
  try { return localStorage.getItem("print_letterhead_global") || ""; } catch (_) { return ""; }
};

export const _lsSaveLetterhead = (dept: string, img: string): void => {
  try {
    localStorage.setItem(`print_letterhead_${dept}`, img);
    localStorage.setItem("print_letterhead_global", img);
  } catch (_) {}
};

export const _lsDelLetterhead = (dept: string): void => {
  try { localStorage.removeItem(`print_letterhead_${dept}`); } catch (_) {}
};

export const _lsGetPrintAdv = (dept: string): DeptPrintAdv | null => {
  try {
    const r = localStorage.getItem(`print_adv_${dept}`);
    if (r) return JSON.parse(r) as DeptPrintAdv;
  } catch (_) {}
  return null;
};

export const _lsSavePrintAdv = (dept: string, a: unknown): void => {
  try { localStorage.setItem(`print_adv_${dept}`, JSON.stringify(a)); } catch (_) {}
};

// ─── SHIFT / ATTENDANCE HOURS HELPERS ─────────────────────────────────────────
// نقطة مصدر واحدة موثوقة لحساب الساعات بين وقتين — تُستخدم من شاشة الدوام
// ومن حسابات الرواتب معاً، بدل نسخ منفصلة كانت تتفرّق بمرور الوقت وتحتوي على
// نفس علة الورديات الليلية (checkOut أبكر من checkIn بسبب عبور منتصف الليل).

// عدد الساعات بين وقتين "HH:MM"، مع دعم الورديات العابرة لمنتصف الليل
// (مثلاً 22:00 → 06:00 = 8 ساعات). يرجع null لو الوقتان غير صالحين أو متطابقان.
export const hoursBetweenTimes = (ci?: string, co?: string): number | null => {
  if (!ci || !co) return null;
  const [h1, m1] = ci.split(":").map(Number);
  const [h2, m2] = co.split(":").map(Number);
  if ([h1, m1, h2, m2].some(n => Number.isNaN(n))) return null;
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 1440; // عبور منتصف الليل
  return mins > 0 && mins <= 1440 ? Math.round((mins / 60) * 100) / 100 : null;
};

// أجر الساعة لموظف نوع راتبه "وردية": قيمة الوردية ÷ مدة الوردية بالساعات.
// بهيك لو الموظف داوم أكتر أو أقل من وردية المحددة بيوم معيّن، الحساب يبقى
// صحيحاً دائماً (أجر_الساعة × الساعات الفعلية المسجَّلة ذاك اليوم) بدل ما
// يُقيَّد بمدة الوردية الاسمية أو يُرفَض/يُصحَّح تعسفياً.
export const staffHourlyRate = (s?: { shiftStart?: string; shiftEnd?: string; shiftAmount?: number }): number => {
  if (!s || !s.shiftAmount || !s.shiftStart || !s.shiftEnd) return 0;
  const shiftHours = hoursBetweenTimes(s.shiftStart, s.shiftEnd);
  if (!shiftHours || shiftHours <= 0) return 0;
  return s.shiftAmount / shiftHours;
};

// ─── STAFF HELPERS ────────────────────────────────────────────────────────────

export const makeDefaultDeptPerms = (enabled = false): DeptPermissions => ({
  canView: enabled, canOpenPatient: enabled,
  canLabSession: false, canLabCatalog: false, canRadSession: false, canRadCatalog: false,
  canPurchaseReqs: false, canDeletePurchaseReqs: false, canLabQueue: false, canLabInventory: false,
  canRadQueue: false, canRehabSession: false, canRehabCatalog: false, canRehabQueue: false,
  canPrint: false, canVouchers: false,
  canDeletePatient: false, canEditPatient: false, canEditDate: false,
  canViewRevenue: false, canAddDeposit: false, canWithdraw: false,
  canDrawerView: false, canDrawerViewBalance: false, canDrawerAdjustBalance: false,
  canDrawerViewHistory: false, canDrawerViewStats: false, canDrawerViewCharts: false,
  canDrawerViewEmployees: false, canDrawerViewInvoices: false, canDrawerSettleInvoices: false,
  canRegisterPatient: false, canPrintExport: false,
  canQueue: false, canQueueAdd: false, canQueueEditStatus: false, canQueueDelete: false,
  canCatalogAdd: false, canCatalogEdit: false, canCatalogDelete: false,
  canInventoryAdd: false, canInventoryEdit: false, canInventoryDelete: false,
  canAttendanceDept: false, canAttendanceView: false, canAttendanceMark: false,
  canStaffAdvance: false, canStaffAdvanceSubmit: false,
  canSurgeryClinicInv: false,
  canDeptProfit: false, canDeptDebts: false, canSettleDebts: false,
  canDeptRevenue: false, canDeptExpenses: false, canAddExpense: false,
});
