
================================================================================
FIGMA AI — USER FLOW COMPLETION PROMPT
نظام إدارة المركز الصحي — Complete All Flows & Screen Connections
================================================================================

The existing Figma file has screens designed but flows are INCOMPLETE.
Your task is to COMPLETE every user flow end-to-end and connect all screens.
Do NOT redesign — ADD the missing steps, missing screens, and missing connections.

--------------------------------------------------------------------------------
FLOW 1 — تسجيل مريض جديد وبدء جلسة (Most Critical Flow)
--------------------------------------------------------------------------------

ENTRY POINT: أي قسم طبي → القائمة الجانبية → "فتح ملف مريض"

STEP 1 — واجهة الاختيار الأولى:
  Screen shows two clear options as large cards:
  Card A: [+ تسجيل مريض جديد]     → goes to STEP 2
  Card B: [🔍 بدء جلسة لمريض مسجل] → goes to STEP 5

STEP 2 — بحث قبل التسجيل:
  Search field: "أدخل رقم الهوية للتحقق من وجود المريض"
  [بحث] button
  IF FOUND → yellow alert appears:
    "المريض [الاسم] موجود مسبقاً"
    [بدء جلسة جديدة له] button → goes to STEP 6 (session financial details)
    [إلغاء والبقاء هنا] button → stays on STEP 2
  IF NOT FOUND → green message "لا يوجد مريض بهذا الرقم — يمكنك التسجيل"
    Auto-fills ID field in form
    [المتابعة للتسجيل →] button → goes to STEP 3

STEP 3 — نموذج بيانات المريض:
  Stepper shows: [① بيانات المريض] → [② التفاصيل المالية] → [③ ملف الجلسة]
  Current step: ① highlighted
  Form fills with all patient data fields (2 columns)
  Conditional fields:
    حساسية = نعم → textarea slides down
    أمراض مزمنة = نعم → textarea slides down
    تأمين = نعم → insurance company dropdown appears
  [التالي →] button validates required fields then → goes to STEP 4
  [إلغاء] → returns to STEP 1

STEP 4 — التفاصيل المالية للجلسة:
  Stepper: ② highlighted
  Three number fields:
    سعر الكشف/الخدمة (₪) *
    الخصم (₪ أو %)
    المبلغ المدفوع (₪) *
  Auto-calculated display (updates live as user types):
    الباقي / الدين = السعر - الخصم - المدفوع
    If Debt > 0: shows red "₪ XX سيُضاف كدين على المريض"
    If Debt = 0: shows green "✓ مسدد بالكامل"
  [← رجوع] → STEP 3
  [حفظ وفتح ملف الجلسة →] → STEP 5 (creates patient + opens session)

STEP 5 — ملف الجلسة (depends on department):
  Stepper: ③ highlighted
  IF عيادة الجراحة OR علاج تأهيلي → opens S04 (clinic session form)
  IF مختبر التحاليل → opens S05 (lab session form)
  IF الأشعة التشخيصية → opens S06 (radiology session form)
  Top strip shows: patient name + ID + session date
  [حفظ الجلسة] → success toast → goes to S03 (patient file)

COMPLETE CONNECTION MAP:
  S_entry → S_search → S02_form → S02_financial → S04/S05/S06 → S03

--------------------------------------------------------------------------------
FLOW 2 — بدء جلسة لمريض مسجل مسبقاً
--------------------------------------------------------------------------------

ENTRY: واجهة الاختيار الأولى → Card B "بدء جلسة لمريض مسجل"

STEP 1 — بحث عن المريض:
  Large search bar center of screen
  Search by: name or ID number
  [بحث] button OR instant search after 3 chars typed
  Results list appears (table style):
    Name | ID | Phone | Last Visit | [اختيار] button per row
  If no results: "لا يوجد مريض بهذه البيانات" + [تسجيل مريض جديد] link

STEP 2 — تأكيد المريض:
  After clicking [اختيار]:
  Patient summary card slides in:
    Name (large) + ID + Blood type + Insurance status
    Last session date + total debt (if any)
  [تأكيد والمتابعة →] → STEP 3
  [بحث عن مريض آخر] → back to STEP 1

STEP 3 — التفاصيل المالية:
  Same as FLOW 1 STEP 4
  After saving → opens session file for this department

COMPLETE CONNECTION MAP:
  S_entry → S_search → S_confirm → S02_financial → S04/S05/S06 → S03

--------------------------------------------------------------------------------
FLOW 3 — إنجاز فحص مختبر وتسليم النتائج
--------------------------------------------------------------------------------

ENTRY: قسم مختبر التحاليل → واجهة فتح ملف مريض → يصل لـ S05

WITHIN S05 — complete this flow:

A) اختيار الفحوصات:
   Checkboxes on test list
   Running total updates live: "الإجمالي: ₪ 145 | 3 فحوصات"
   [بدء الجلسة] button →

B) Status Board updates:
   Selected tests appear in "قيد الإنجاز" column as Kanban cards
   Each card: test name + patient name + timestamp

C) إدخال النتائج (per test):
   [إدخال النتائج] button on Kanban card →
   Modal opens: results table with input fields per parameter
   User fills: النتيجة values
   System auto-flags: if outside normal range → "غير طبيعي" badge (red)
   Kit quantity auto-decrements (shown: "سيُخصم 1 من مخزون CBC Kit")
   [طباعة التقرير] →
     Print preview modal opens
     [طباعة] → browser print dialog
     [إغلاق] → back to results modal
   [تم التسليم] →
     Test card moves from "قيد الإنجاز" → "مكتمل" column (animated)
     Success toast: "تم تسليم تقرير فحص [اسم الفحص]"
     If kit stock reaches alert threshold → notification bell badge +1

COMPLETE CONNECTION MAP:
  S05_tests → S05_status_board → S05_modal_results → S05_print → S05_done

--------------------------------------------------------------------------------
FLOW 4 — إنجاز تصوير شعاعي وتسليم النتائج
--------------------------------------------------------------------------------

SAME PATTERN AS FLOW 3 but in S06:

A) اختيار الصور → [بدء الجلسة] → Status Board
B) [رفع نتائج الأشعة] per card →
   File upload modal opens
   User uploads: JPEG/PNG/DICOM/PDF files
   Files show as thumbnails in modal
   [تم التسليم] → card moves to "مكتمل" column

COMPLETE CONNECTION MAP:
  S06_images → S06_status_board → S06_upload_modal → S06_done

--------------------------------------------------------------------------------
FLOW 5 — عمليات الجرار (Cash Drawer)
--------------------------------------------------------------------------------

ENTRY: أي قسم → الرئيسية والإحصائيات (S07)

Cash Drawer card always visible at top.

WITHDRAWAL FLOW (سحب نقد):
  [سحب نقد ↓] button →
  Confirmation modal opens:
    Warning text: "هذا المبلغ سيُسجَّل كإيداع في البنك — لن يُحتسب كمصروف"
    Input: المبلغ المسحوب (₪) *
    Input: سبب السحب (text)
    [تأكيد السحب] →
      Modal closes
      Drawer balance updates immediately (decreases)
      Success toast: "تم تسجيل سحب ₪ [المبلغ] من الجرار"
    [إلغاء] → modal closes, no change

DEPOSIT FLOW (إضافة نقد):
  [إضافة نقد ↑] button →
  Modal opens:
    Input: المبلغ المُضاف (₪) *
    Input: عنوان السند الثانوي (e.g. "دفعة من مريض سابق")
    [تأكيد الإضافة] →
      Modal closes
      Drawer balance updates (increases)
      Toast: "تم تسجيل إضافة ₪ [المبلغ] للجرار"
    [إلغاء] → closes

COMPLETE CONNECTION MAP:
  S07 → Modal_withdrawal OR Modal_deposit → S07 (balance updated)

--------------------------------------------------------------------------------
FLOW 6 — إنشاء فاتورة شراء وتسديدها
--------------------------------------------------------------------------------

ENTRY: أي قسم → المصروفات وفاتورة شراء → تبويب فواتير الشراء (S09)

CREATION FLOW:
  TAB "إنشاء فاتورة جديدة" →
  Select company (dropdown) →
  Add product rows:
    [+ إضافة صنف] adds new empty row
    Fill: product name | qty | unit price → line total auto-calculates
  Fill financial fields: discount + amount paid
  Remaining (debt) auto-calculates
  [حفظ الفاتورة] →
    Loading state on button
    Success: invoice saved, switches to TAB "الفواتير السابقة"
    New invoice appears at top of table
    Toast: "تم حفظ الفاتورة رقم [XXX]"

PAYMENT FLOW:
  In invoices table, find unpaid invoice →
  [تسديد] button →
  Modal opens:
    Shows: "المبلغ الإجمالي: ₪ 1,200 | المدفوع: ₪ 700 | المتبقي: ₪ 500"
    Input: المبلغ المُسدَّد الآن (₪) *
    Live calculation: الجديد المتبقي = ₪ 500 - [input]
    If input = remaining → "ستتحول الفاتورة لـ مسدد بالكامل ✓"
    If input < remaining → "ستبقى جزئية — متبقي ₪ [new amount]"
    [تأكيد التسديد] →
      Modal closes
      Invoice row updates: paid amount increases, remaining decreases
      Status badge changes accordingly
      Toast: "تم تسجيل دفعة ₪ [المبلغ]"
    [إلغاء] → closes

PRINT FLOW:
  [طباعة] icon on any invoice row →
  Print preview modal opens (invoice template with center logo)
  [طباعة] → browser print
  [إغلاق] → back to table

COMPLETE CONNECTION MAP:
  S09_create → S09_history (auto-switch) → S09_payment_modal → S09_updated
  S09_history → S09_print_modal → browser_print

--------------------------------------------------------------------------------
FLOW 7 — تسديد دين مريض وإرسال SMS
--------------------------------------------------------------------------------

ENTRY: النظام المالي → تبويب الديون (S16)

VIEW DEBTS:
  Table loads with all patient debts
  Color coded rows by age (< 30 days white, 30-90 orange, > 90 red)

FILTER FLOW:
  Department dropdown → table filters live
  Age range buttons → [< 30 يوم] [30-90 يوم] [> 90 يوم] → table filters
  Search by name → instant filter

SMS FLOW:
  [📱] SMS icon on a patient row →
  SMS Modal opens:
    Patient name + phone shown (read-only)
    Pre-filled message textarea (editable):
      "عزيزي/عزيزتي [اسم المريض]، يرجى التكرم بتسديد دينك المستحق
       بقيمة ₪ [المبلغ]. للاستفسار اتصل على: [رقم المركز]"
    Character counter: "120/160"
    [إرسال الرسالة] →
      Loading state
      Success: modal closes, toast "تم إرسال الرسالة لـ [الاسم]"
      Row shows small "تم إرسال SMS" indicator (muted text + timestamp)
    [إلغاء] → closes

PAYMENT FLOW:
  [💰] payment icon on a patient row →
  Payment Modal opens:
    Patient name + debt amount (large red number)
    Input: المبلغ المُسدَّد الآن (₪) *
    Live remaining: ₪ [debt - input]
    [تأكيد التسديد] →
      If full payment: row removed from table (or marked مسدد)
      If partial: row updates with new lower amount
      Toast: "تم تسجيل دفعة ₪ [المبلغ] من [الاسم]"
    [إلغاء] → closes

COMPLETE CONNECTION MAP:
  S16 → filter → S16_sms_modal → S16 (row updated)
  S16 → S16_payment_modal → S16 (row updated or removed)

--------------------------------------------------------------------------------
FLOW 8 — احتساب وصرف الرواتب
--------------------------------------------------------------------------------

ENTRY: النظام المالي → تبويب الرواتب (S15)

STEP 1 — احتساب الراتب:
  Employee row shows status "لم يُحتسب" (gray badge)
  [احتساب الراتب] button →
    Inline calculation animation (brief)
    صافي الراتب column fills: الأساسي - المصاريف الشخصية = الصافي
    Status badge → "مُحتسب" (orange)
    Button changes to [صرف راتب يونيو]

STEP 2 — صرف الراتب:
  [صرف راتب يونيو] button →
  Confirmation Dialog:
    Icon: wallet (large, teal)
    Title: "تأكيد صرف الراتب"
    Body: "سيتم صرف راتب [اسم الموظف] لشهر يونيو 2026 بمبلغ ₪ [الصافي]"
    [تأكيد الصرف — primary] →
      Dialog closes
      Status badge → "مصروف" (green)
      [صرف الراتب] button → disappears, replaced by date: "صُرف بتاريخ 29/06/2026"
      Total month salary card updates
      Toast: "تم صرف راتب [الاسم] ✓"
    [إلغاء] → dialog closes, no change

COMPLETE CONNECTION MAP:
  S15_row → احتساب → S15_row_calculated → تأكيد_modal → S15_row_paid

--------------------------------------------------------------------------------
FLOW 9 — تصدير التقارير والكشوفات
--------------------------------------------------------------------------------

ENTRY: النظام المالي → الكشوفات → تبويب التقارير المخصصة

STEP 1 — نوع التقرير:
  Dropdown: مرضى / شركات / تأمين / أقسام / مخصص
  On select → shows relevant filter options

STEP 2 — الفترة الزمنية:
  Date range picker: من [date] → إلى [date]
  Quick picks: اليوم | هذا الأسبوع | هذا الشهر | هذا العام
  On date select → preview table updates live

STEP 3 — اختيار الحقول (custom report only):
  Checkbox grid of available fields
  "تحديد الكل" + "إلغاء الكل" buttons
  On checkbox toggle → preview table columns update live

STEP 4 — معاينة:
  Table shows first 10 results matching filters
  "عرض [N] نتيجة" counter
  Columns match selected fields

STEP 5 — تصدير:
  [تصدير Excel] →
    Loading indicator
    Download starts
    Toast: "جارٍ تحميل ملف Excel..."
  [تصدير PDF] →
    PDF preview modal opens (full-page, formatted with center letterhead)
    [طباعة] + [تنزيل PDF] + [إغلاق] buttons

COMPLETE CONNECTION MAP:
  Reports → filters → live_preview → export_modal / download

--------------------------------------------------------------------------------
FLOW 10 — إدارة مخزون الكيتات وتنبيهات النقص
--------------------------------------------------------------------------------

TRIGGER: Kit stock reaches alert threshold during ANY lab session

NOTIFICATION FLOW:
  Bell icon in TopBar: badge count increases (+1)
  Bell dropdown shows: "تنبيه: مخزون Kit CBC وصل للحد الأدنى (5 قطع)"
  Dashboard Alert Banner appears: "تنبيه: مخزون Kit CBC منخفض"
  Inside Lab section → alert strip at top of page

INVENTORY MANAGEMENT FLOW:
  إعدادات النظام → المخزون والكيتات (S22)
  Find low-stock item (highlighted row + badge "منخفض")
  [📦 إضافة كمية] button →
  Modal opens:
    Shows current quantity: "الكمية الحالية: 5"
    Input: الكمية المُضافة *
    Toggle: [فاتورة شراء] ← recommended | [إضافة مباشرة]
    If "فاتورة شراء" selected:
      Additional fields: اسم الشركة | السعر الإجمالي
    [تأكيد الإضافة] →
      Stock updates in table
      If was below threshold and now above: badge changes to "كافٍ"
      Notification cleared from bell
      Toast: "تم إضافة [الكمية] وحدة لـ Kit [الاسم]"

COMPLETE CONNECTION MAP:
  Any_Lab_Session → kit_depletes → bell_notification → S22 → modal_add → S22_updated

--------------------------------------------------------------------------------
FLOW 11 — عمل نسخة احتياطية يدوية
--------------------------------------------------------------------------------

ENTRY: إعدادات النظام → النسخ الاحتياطي (S23)

VIEW STATUS:
  Page loads showing last backup time per destination (4 rows)
  Any failed backup: shows red "فشلت" badge + retry button

MANUAL BACKUP:
  [نسخ الآن] button on any destination card →
    Button state → loading (spinner + "جارٍ الرفع...")
    Progress bar appears below button (0% → 100%)
    On success:
      Button returns to normal
      Last backup time updates to "الآن"
      Status badge → green "✓ ناجحة"
      Toast: "تم الرفع بنجاح لـ [الوجهة]"
    On failure:
      Error state: button red "فشل — إعادة المحاولة"
      Error message below: "[سبب الخطأ]"

DOWNLOAD ZIP:
  [تصدير ZIP الآن] →
    Loading state (preparing...)
    Progress bar
    Browser download dialog appears
    Toast: "جارٍ تحضير ملف النسخة الاحتياطية..."

COMPLETE CONNECTION MAP:
  S23 → backup_button_loading → S23_success / S23_error

--------------------------------------------------------------------------------
MISSING MICRO-FLOWS (complete these inside existing screens)
--------------------------------------------------------------------------------

INSIDE any form — validation flow:
  User clicks submit with empty required fields →
    All empty required fields get red border
    Error message appears below each: "هذا الحقل إلزامي"
    Page scrolls to first error
    Button returns to normal (not loading)

INSIDE patient file (S03) — session detail drawer:
  User clicks any session row →
    Drawer slides in from right (400px wide)
    Overlay darkens rest of page
    Shows: date, department, diagnosis, medications, financial summary
    [إغلاق ×] → drawer slides out

INSIDE any table — delete flow:
  [🗑️ حذف] clicked →
    Confirmation dialog: "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء"
    [حذف — danger] → row removed from table, toast "تم الحذف"
    [إلغاء] → dialog closes, no change

INSIDE any table — edit flow:
  [✏️ تعديل] clicked →
    Modal opens with fields pre-filled with current data
    User edits
    [حفظ التغييرات] → modal closes, row updates in table, toast "تم التحديث"
    [إلغاء] → modal closes, no change

INSIDE S02 — Stepper back navigation:
  User on Step 2, clicks [← رجوع] →
    Returns to Step 1 with previously entered data preserved (not cleared)
  User on Step 3, clicks [← رجوع] →
    Returns to Step 2 with data preserved

INSIDE notifications bell:
  Click bell icon → dropdown opens (list of notifications)
  Each notification has icon + message + time ago
  Types: debt alert (red), low stock (orange), backup success (green)
  [تحديد الكل كمقروء] button → all badges clear
  [عرض الكل] → navigates to a notifications page (if designed)

--------------------------------------------------------------------------------
SCREEN CONNECTIONS REFERENCE MAP
--------------------------------------------------------------------------------

Login → Dashboard (S01)
S01 (KPI debt card click) → S16 (debts tab)
S01 (any department card) → S07 (dept home)
Sidebar "فتح ملف مريض" → FLOW 1 entry screen
FLOW 1 → S04 OR S05 OR S06 (based on department)
S04/S05/S06 save → S03 (patient file)
S03 (+ جلسة جديدة) → FLOW 2 entry
S03 (session row click) → S03 Drawer opens
S07 (cash withdrawal) → Modal → S07 (updated balance)
S08 (save expense) → S08 (table updates)
S09 (save invoice) → S09 Tab 2 (invoice history)
S09 (pay invoice) → S09 (row updates)
S10 (add test) → Modal → S10 (table updates)
S11-S16 connected via Financial tab navigation
S16 (SMS) → Modal → S16 (row updated)
S16 (pay debt) → Modal → S16 (row updated)
S22 (add stock) → Modal → S22 (row updates) → bell notification clears
S23 (backup) → loading state → S23 (success/error)
Any form save → toast notification → same screen
Any delete → confirmation dialog → same screen (row removed)

--------------------------------------------------------------------------------
INTERACTIVE STATES MISSING — ADD THESE
--------------------------------------------------------------------------------

FOR EVERY BUTTON that triggers an action:
  Default → Hover (color change) → Active/Click (scale 0.98) →
  Loading (spinner replaces icon, text changes to "جارٍ...") →
  Success (brief green flash) → returns to Default
  OR Error (red flash, error message) → returns to Default

FOR EVERY MODAL:
  Trigger click → overlay fades in → modal scales from 0.95 to 1.0 →
  User interacts →
  Save: loading → success → modal closes → toast appears
  Cancel: modal closes (no animation needed)

FOR STATUS BOARD (S05 Lab / S06 Radiology):
  Test added → card appears in "قيد الإنجاز" with slide-in animation
  [تم التسليم] → card slides out of left column → slides into right column

FOR CASH DRAWER BALANCE:
  After transaction → number animates (count up or count down)

FOR KPI CARDS on Dashboard:
  After date filter change → numbers update with brief fade animation

FOR TABLE ROWS:
  After edit saved → row briefly flashes green
  After delete → row slides up and disappears
  New row added → row slides in from bottom with green highlight

--------------------------------------------------------------------------------
FLOW COMPLETION CHECKLIST
--------------------------------------------------------------------------------

Verify every screen has:
[ ] At least one clear ENTRY POINT (how does the user arrive here?)
[ ] All buttons lead somewhere (no dead-end buttons)
[ ] All forms have: validation errors + loading + success + cancel paths
[ ] All modals: can be opened AND closed (both ✕ and Cancel work)
[ ] All tables: empty state + loading state + error state
[ ] All delete actions: have confirmation dialogs
[ ] All save actions: have loading state + success toast
[ ] Financial calculations: auto-update when inputs change
[ ] Navigation: back buttons work and preserve form data
[ ] After every completed action: user knows what happened (toast/message)

================================================================================
END OF FLOW COMPLETION PROMPT
================================================================================
