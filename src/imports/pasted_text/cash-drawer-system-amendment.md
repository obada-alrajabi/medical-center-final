
================================================================================
CRITICAL AMENDMENT — CASH DRAWER IS THE ONLY FINANCIAL LEDGER
نظام إدارة المركز الصحي — تعديل جوهري على المنطق المالي
================================================================================

OVERRIDES ALL PREVIOUS PROMPTS WHERE THEY CONFLICT WITH THIS DOCUMENT.

--------------------------------------------------------------------------------
THE CORE RULE — READ THIS FIRST
--------------------------------------------------------------------------------

There is NO concept of "مصروفات" (expenses) anywhere in this system.

EVERY single shekel that leaves the system — regardless of reason — is recorded
as ONE thing only: سحب من الجرار (Drawer Withdrawal) with a title and category.

This includes:
  ✓ موظف أخذ مصروف شخصي      → سحب من الجرار | العنوان: "مصروف شخصي — [اسم الموظف]"
  ✓ دفع فاتورة شركة            → سحب من الجرار | العنوان: "دفع فاتورة — [اسم الشركة]"
  ✓ صرف راتب موظف             → سحب من الجرار | العنوان: "راتب [اسم الموظف] — [الشهر]"
  ✓ أي مصروف آخر              → سحب من الجرار | العنوان: "[وصف حر]"

EVERY shekel that enters the system is:
  ✓ دفعة من مريض (جلسة)       → إضافة للجرار (تلقائية)
  ✓ تسديد دين مريض             → إضافة للجرار (تلقائية)
  ✓ إضافة يدوية                → إضافة للجرار | العنوان: "[وصف السند]"

THE DRAWER IS THE ONLY ACCOUNT. No separate expense ledger exists.

--------------------------------------------------------------------------------
EACH DEPARTMENT HAS ITS OWN INDEPENDENT DRAWER (جرار)
--------------------------------------------------------------------------------

4 DRAWERS, ONE PER DEPARTMENT:
  Drawer 1: عيادة الجراحة العامة والطوارئ
  Drawer 2: مختبر التحاليل الطبية
  Drawer 3: الأشعة التشخيصية
  Drawer 4: عيادة العلاج التأهيلي

Each drawer is completely independent:
  - Its own current balance
  - Its own deposit history (from patients in that department)
  - Its own withdrawal history (any money out from that department)
  - Its own charts and statements

The financial center (النظام المالي) shows:
  - Each drawer's balance and history separately
  - Total across all 4 drawers combined

--------------------------------------------------------------------------------
HOW EACH DRAWER WORKS
--------------------------------------------------------------------------------

AUTOMATIC DEPOSITS (no action needed, happen by the system):
  When a patient pays during a session in Department X:
    → That amount is automatically added to Department X's drawer
  When a patient pays a debt:
    → Added to the drawer of the department where the debt originated

MANUAL DEPOSITS (user initiates):
  Button: [↑ إضافة للجرار]
  Modal fields:
    المبلغ (₪) *
    عنوان السند / سبب الإضافة *  (e.g. "دفعة نقدية من مريض خارج النظام")
  Saved as: نوع = إضافة | المصدر = يدوي

WITHDRAWALS (user initiates — replaces ALL expense concepts):
  Button: [↓ سحب من الجرار]
  Modal fields:
    المبلغ (₪) *
    العنوان / الوصف *         (free text: what is this for)
    التصنيف *                 (dropdown — see categories below)
    المستفيد                  (optional: employee name / company name)
  Saved as: نوع = سحب | التصنيف = [selected]

WITHDRAWAL CATEGORIES (التصنيفات):
  راتب موظف                  (salary)
  مصروف شخصي — موظف         (employee took cash)
  دفع فاتورة شركة            (supplier invoice payment)
  مشتريات                    (direct purchase)
  إيداع في البنك             (bank deposit — internal transfer, not an expense)
  مصروف تشغيلي              (operational expense)
  أخرى                       (other — requires description)

The category "إيداع في البنك" is visually distinct:
  Labeled as: "حركة داخلية — ليس مصروفاً"
  Shown in different color in reports (blue, not red)
  Excluded from expense totals but shown in drawer balance

--------------------------------------------------------------------------------
SCREENS THAT CHANGE — COMPLETE REDESIGN OF THESE SCREENS
--------------------------------------------------------------------------------

▶ SCREEN: رئيسية القسم والإحصائيات (S07) — UPDATED

  DRAWER CARD (full width, --navy background):
    Right side:
      Label: "الجرار — [اسم القسم]" (12px, white muted)
      Balance: "₪ 4,350" (32px/700, white)
      Sub-label: "الرصيد الحالي"
    Left side (two buttons):
      [↑ إضافة للجرار]   --teal filled button
      [↓ سحب من الجرار]  white outline button

  RECENT TRANSACTIONS (below drawer card, inside same card or separate):
    Last 5 movements list (compact):
    Icon | العنوان | التصنيف badge | المبلغ | الوقت
    ↑ دفعة مريض — أحمد محمد        إضافة تلقائية    +₪ 150    منذ 20 دقيقة
    ↓ مصروف شخصي — محمد علي       مصروف موظف      -₪ 30     منذ ساعة
    ↓ دفع فاتورة — شركة الطبي     فاتورة شركة     -₪ 500    أمس
    ↑ إضافة يدوية — سند قبض        إضافة يدوية     +₪ 200    أمس
    [عرض كل الحركات →] link

  DEPARTMENT SUMMARY (3 KPI cards, below drawer):
    عدد المرضى في القسم
    إجمالي الإيرادات (الإضافات التلقائية فقط — من المرضى)
    إجمالي السحوبات من الجرار (كل أنواع السحب مجتمعة)

  EMPLOYEES LIST (same as before)

▶ SCREEN: المصروفات وفاتورة شراء → RENAMED AND REDESIGNED

  OLD NAME: المصروفات وفاتورة شراء
  NEW NAME: سجل حركات الجرار

  This screen shows ALL drawer movements (deposits + withdrawals) for this dept.

  TABS:
    [كل الحركات]  [الإضافات ↑]  [السحوبات ↓]  [فواتير الشركات]

  TAB: كل الحركات
    Date range filter + category filter + export
    Table columns:
      التاريخ | النوع | العنوان / الوصف | التصنيف | المستفيد | المبلغ | الرصيد بعد
    Type column:
      ↑ إضافة → green text/icon
      ↓ سحب   → red text/icon
    Amount column:
      Additions: +₪ XXX (green)
      Withdrawals: -₪ XXX (red)
    Running balance in last column

  TAB: الإضافات ↑
    Shows only deposits
    Filtered table with same columns

  TAB: السحوبات ↓
    Shows only withdrawals
    Filter by category (salary / employee expense / invoice / etc.)
    Table + total at bottom

  TAB: فواتير الشركات
    Invoice management (same as old S09 purchase invoices)
    When user pays an invoice → AUTOMATICALLY creates a سحب من الجرار:
      العنوان: "دفع فاتورة #[رقم] — [اسم الشركة]"
      التصنيف: دفع فاتورة شركة
      المبلغ: المبلغ المُسدَّد
    Invoice table shows status + link to the drawer withdrawal record

▶ MODAL: سحب من الجرار (completely redesigned)

  Triggered by: [↓ سحب من الجرار] button OR any action that requires a withdrawal

  HEADER: "تسجيل سحب من جرار [اسم القسم]"

  Current balance shown prominently:
    "الرصيد الحالي: ₪ 4,350"

  FIELDS:
    المبلغ (₪) *
      Number input
      Live preview: "الرصيد بعد السحب: ₪ [balance - amount]"
      Warning if amount > balance: "⚠️ المبلغ يتجاوز رصيد الجرار"

    التصنيف *
      Dropdown with all categories:
        💼 راتب موظف
        👤 مصروف شخصي — موظف
        🧾 دفع فاتورة شركة
        🛒 مشتريات مباشرة
        🏦 إيداع في البنك  ← shows special note "حركة داخلية"
        ⚙️ مصروف تشغيلي
        📝 أخرى

    العنوان / الوصف *
      Text input — auto-fills suggestion based on category:
        If "راتب موظف" selected → auto-suggest: "راتب [month] — [موظف]"
        If "مصروف شخصي" → auto-suggest: "مصروف شخصي — "
        If "دفع فاتورة" → auto-suggest: "دفع فاتورة — "
      User can edit freely

    المستفيد (اختياري)
      Smart dropdown:
        If category = راتب OR مصروف شخصي → shows employees list
        If category = دفع فاتورة → shows companies list
        If category = أخرى → free text

    ملاحظات (اختياري)
      Textarea

  FOOTER BUTTONS:
    [تأكيد السحب] primary button
    [إلغاء] outline button

  ON CONFIRM:
    Drawer balance decreases immediately
    Transaction record created
    Toast: "تم تسجيل سحب ₪ [المبلغ] — [العنوان]"
    If this was triggered by salary payment: employee salary status → مصروف
    If this was triggered by invoice payment: invoice status updates

▶ MODAL: إضافة للجرار (updated)

  HEADER: "تسجيل إضافة لجرار [اسم القسم]"

  Current balance: "الرصيد الحالي: ₪ 4,350"

  FIELDS:
    المبلغ (₪) *
      Live: "الرصيد بعد الإضافة: ₪ [balance + amount]"

    نوع الإضافة *
      Radio or dropdown:
        💳 سند قبض — دفعة نقدية
        🔄 تحويل من قسم آخر
        📝 تعديل يدوي — أخرى

    العنوان / وصف السند *
      Text input

    ملاحظات (اختياري)
      Textarea

  ON CONFIRM:
    Balance increases
    Toast: "تم تسجيل إضافة ₪ [المبلغ] للجرار"

--------------------------------------------------------------------------------
PAYROLL FLOW — UPDATED (salary = withdrawal from drawer)
--------------------------------------------------------------------------------

IN S15 (Payroll tab in النظام المالي):

  When user clicks [صرف راتب يونيو] on an employee row:

  STEP 1 — Confirmation Dialog:
    "تأكيد صرف راتب [الاسم] لشهر يونيو 2026"
    Amount: ₪ [net salary]
    Note: "سيُخصم من جرار القسم: [اسم القسم]"
    Current drawer balance shown: "رصيد الجرار: ₪ 4,350"
    Warning if salary > drawer balance: "⚠️ رصيد الجرار غير كافٍ — رصيد متاح: ₪ [X]"
    Buttons: [تأكيد الصرف — primary] + [إلغاء]

  STEP 2 — On Confirm:
    A drawer withdrawal is automatically created:
      القسم: [employee's department]
      المبلغ: ₪ [net salary]
      التصنيف: راتب موظف
      العنوان: "راتب [اسم الموظف] — يونيو 2026"
      المستفيد: [اسم الموظف]
    Employee row status → مصروف ✓ (green)
    Department drawer balance decreases
    Toast: "تم صرف راتب [الاسم] ✓ — خُصم من جرار [القسم]"

--------------------------------------------------------------------------------
INVOICE PAYMENT FLOW — UPDATED (payment = withdrawal from drawer)
--------------------------------------------------------------------------------

IN S09 / financial tab for invoices:

  When user clicks [تسديد] on an invoice:

  MODAL — تسديد فاتورة:
    Invoice details: company name, total, remaining
    Input: المبلغ المُسدَّد (₪) *
    Note: "سيُخصم من جرار القسم: [اسم القسم]"
    Current drawer balance: "رصيد الجرار: ₪ 4,350"
    Warning if payment > drawer balance

    ON CONFIRM:
      Drawer withdrawal auto-created:
        التصنيف: دفع فاتورة شركة
        العنوان: "دفع فاتورة #[رقم] — [اسم الشركة]"
        المبلغ: المبلغ المُسدَّد
      Invoice remaining decreases
      Invoice status updates
      Toast: "تم تسديد ₪ [المبلغ] لـ [الشركة] — خُصم من الجرار"

--------------------------------------------------------------------------------
FINANCIAL SUMMARY — UPDATED CALCULATIONS
--------------------------------------------------------------------------------

DRAWER BALANCE FORMULA (per department):
  الرصيد = (إجمالي الإضافات التلقائية من المرضى)
          + (إجمالي الإضافات اليدوية)
          - (إجمالي السحوبات بكل تصنيفاتها)

TOTAL CENTER BALANCE:
  الرصيد الكلي = Drawer 1 + Drawer 2 + Drawer 3 + Drawer 4

FINANCIAL SUMMARY KPIs (S11) — NEW LOGIC:
  ₪ الرصيد الكلي لجميع الجرارات          (sum of all 4 drawers)
  ₪ إجمالي الإيرادات (إضافات من مرضى)   (all automatic deposits)
  ₪ إجمالي السحوبات                      (all withdrawals, all types)
    ↳ منها رواتب: ₪ X
    ↳ منها فواتير شركات: ₪ X
    ↳ منها مصروفات موظفين: ₪ X
    ↳ منها إيداعات بنكية: ₪ X (shown separately, not counted as expense)
    ↳ منها أخرى: ₪ X
  ₪ صافي الربح = الإيرادات - السحوبات (بدون إيداعات بنكية)
  ₪ ديون المرضى (مبالغ لم تُدفع بعد)

CHARTS IN S11 — UPDATED:
  Bar: رصيد كل جرار مقارنةً ببعض (4 bars)
  Bar: إيرادات كل قسم (automatic deposits from patients)
  Bar: سحوبات كل قسم (all withdrawals per department)
  Stacked Bar: تصنيف السحوبات لكل قسم
    (رواتب | فواتير | مصروفات موظفين | أخرى — stacked colors)
  Line: حركة الجرار الكلي عبر الأشهر (balance over time)

--------------------------------------------------------------------------------
STATEMENTS — UPDATED
--------------------------------------------------------------------------------

DRAWER STATEMENT (new statement type):
  Added as new tab in الكشوفات: "كشف الجرار"
  Shows: all movements (in/out) for selected drawer + date range
  Columns: التاريخ | النوع | العنوان | التصنيف | المستفيد | المبلغ | الرصيد
  Export: PDF with center logo

EXPENSE REPORTS → REPLACED BY:
  "تقرير السحوبات" — filtered by category
  User can filter by: category type + date range + department
  Shows total per category + all individual transactions

--------------------------------------------------------------------------------
TERMINOLOGY CHANGES ACROSS ALL SCREENS
--------------------------------------------------------------------------------

REMOVE these terms completely:
  ❌ مصروفات شخصية
  ❌ مصاريف
  ❌ تسجيل مصروف
  ❌ إنشاء مصروف شخصي

REPLACE WITH:
  ✓ سحب من الجرار
  ✓ تسجيل سحب
  ✓ حركات الجرار
  ✓ سجل السحوبات

IN NAVIGATION (Sidebar):
  OLD: المصروفات وفاتورة شراء
  NEW: الجرار وحركاته

IN FINANCIAL TABS:
  OLD: تبويب المصروفات وفواتير الشركاء
  NEW: تبويب سحوبات الجرار

IN KPI CARDS:
  OLD: إجمالي المصروفات
  NEW: إجمالي سحوبات الجرار

IN TABLE HEADERS:
  OLD: نوع المصروف / عنوان المصروف
  NEW: تصنيف السحب / وصف السحب

--------------------------------------------------------------------------------
VISUAL TREATMENT — HOW TO SHOW DRAWER MOVEMENTS
--------------------------------------------------------------------------------

COLOR CODING in all transaction lists:
  ↑ Additions (IN):   green icon + green amount (+₪ XXX)
  ↓ Withdrawals (OUT): red icon + red amount (-₪ XXX)
  🏦 Bank deposits:    blue icon + gray amount (-₪ XXX) + "حركة داخلية" label

CATEGORY ICONS in transaction rows:
  💼 راتب موظف          → briefcase icon
  👤 مصروف موظف         → person icon
  🧾 فاتورة شركة        → receipt icon
  🛒 مشتريات            → shopping-cart icon
  🏦 إيداع بنكي         → bank icon
  ⚙️ تشغيلي             → settings icon
  📝 أخرى               → note icon
  ✅ إيراد مريض          → user-check icon (for automatic deposits)

DRAWER BALANCE CARD (in S07):
  If balance is healthy (> threshold): balance number in white
  If balance is low (< configurable threshold): balance number in #FFC107 amber
  If balance is zero or negative: balance number in --danger red + warning icon

--------------------------------------------------------------------------------
SUMMARY OF WHAT TO BUILD / CHANGE IN FIGMA
--------------------------------------------------------------------------------

1. REMOVE all "مصروفات شخصية" screens and replace with drawer transaction list
2. RENAME "المصروفات وفاتورة شراء" section → "الجرار وحركاته"
3. UPDATE S07 drawer card → add recent transactions list below balance
4. REDESIGN سحب modal → add category dropdown + auto-fill title
5. ADD إضافة modal → with source type and description
6. UPDATE S09 invoice payment → auto-creates drawer withdrawal
7. UPDATE S15 salary payment → auto-creates drawer withdrawal
8. UPDATE S11 financial summary → new KPIs and charts based on drawer logic
9. ADD "كشف الجرار" tab in الكشوفات section
10. UPDATE all terminology across every screen (remove مصروفات, add سحوبات)
11. ADD 4 separate drawers (one per department) visible in النظام المالي
12. ADD stacked bar chart showing withdrawal categories per department

================================================================================
END OF CASH DRAWER AMENDMENT
================================================================================
