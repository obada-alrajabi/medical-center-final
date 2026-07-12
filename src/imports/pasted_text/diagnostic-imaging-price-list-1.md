
================================================================================
AMENDMENT 2 — MISSING FLOWS, NAVIGATION MERGE, PRINT SETTINGS, REAL DATA
نظام إدارة المركز الصحي — تعديلات شاملة على الفلو والتنقل والإعدادات
================================================================================

OVERRIDES AND EXTENDS all previous prompts.

================================================================================
PART 1 — COMPLETE MISSING CRUD FLOWS (every button must do something)
================================================================================

--------------------------------------------------------------------------------
1A — دليل الفحوصات والأسعار (مختبر التحاليل) — FULL CRUD FLOW
--------------------------------------------------------------------------------

SCREEN: قسم مختبر التحاليل → دليل الفحوصات والأسعار

THE TABLE must have these exact columns:
  # | اسم الفحص | الرمز | الفئة | السعر (₪) | Kit المرتبط | وقت الإنجاز | إجراءات

ACTION BAR (above table):
  Right: search input (instant filter by name or code)
  Left side buttons:
    [↑ استيراد من Excel]  outline button (green)
    [+ إضافة فحص جديد]   primary button (navy)
    [تصدير Excel]         ghost button

ROW ACTIONS (إجراءات column) — BOTH MUST WORK:
  [✏️ تعديل] → opens EDIT MODAL pre-filled with this row's data
  [🗑️ حذف]  → opens DELETE CONFIRMATION DIALOG

━━━ MODAL: إضافة / تعديل فحص ━━━
Size: 680px wide
Title: "إضافة فحص جديد" OR "تعديل فحص: [اسم الفحص]"

FIELDS (2-column grid):
  Right column:
    اسم الفحص بالعربي *       text input
    رمز الفحص (Code) *         text input — e.g. CBC, LFT
    الفئة *                    dropdown:
                                  تحاليل الدم | تحاليل البول | الهرمونات |
                                  الكيمياء الحيوية | الأمراض المعدية |
                                  تحاليل الغدة الدرقية | أخرى
    السعر (₪) *                number input
    وقت الإنجاز *              number input + unit toggle [ساعة / يوم]

  Left column:
    اسم الفحص بالإنجليزي      text input
    Kit المرتبط                multi-select from inventory list
                               (typing searches inventory items)
    وصف الفحص                 textarea (2 rows)
    ملاحظات خاصة              textarea (2 rows)

SECTION: المعدلات الطبيعية (Normal Ranges) — inside same modal, below divider:
  Title: "قيم المرجع / المعدلات الطبيعية"
  [+ إضافة معامل] button — adds a new row
  Repeatable rows table:
    اسم المعامل | الوحدة | الحد الأدنى | الحد الأعلى | ملاحظة
  Example rows shown:
    هيموغلوبين | g/dL | 12 | 18 | للبالغين
    كريات الدم البيضاء | 10³/μL | 4.5 | 11 |
  Each row has [🗑️] delete icon

MODAL FOOTER:
  [حفظ الفحص] primary button — validates all * fields first
  [إلغاء] outline button

ON SAVE:
  If ADD: new row appears at top of table with brief green highlight
  If EDIT: existing row updates with brief green highlight
  Toast: "تم حفظ الفحص بنجاح ✓"
  Modal closes

━━━ DIALOG: تأكيد حذف فحص ━━━
  Icon: warning triangle (48px, red)
  Title: "حذف الفحص"
  Body: "هل أنت متأكد من حذف فحص '[اسم الفحص]'؟
         ⚠️ إن كان هذا الفحص مرتبطاً بجلسات سابقة لن يُحذف من السجلات القديمة."
  [حذف — danger button] → row removed, toast "تم الحذف"
  [إلغاء] → closes, nothing changes

━━━ MODAL: استيراد من Excel ━━━
  Title: "استيراد فحوصات من ملف Excel"
  Step 1: File upload zone
    "اسحب ملف Excel هنا أو انقر للاختيار"
    Accepts: .xlsx .xls .csv
    Download template link: "⬇️ تحميل نموذج Excel الجاهز"
  Step 2 (after file selected): Preview table
    Shows first 10 rows from the file
    Column mapping: dropdown per column to match Excel column → system field
    Example: "العمود A" → اسم الفحص | "العمود B" → السعر
  Step 3: Validation results
    "تم التحقق: 45 فحص جاهز للاستيراد | 2 أخطاء"
    Errors listed: "الصف 5: السعر غير صالح" etc.
  [استيراد الآن] primary button → imports valid rows
  [إلغاء] outline button

--------------------------------------------------------------------------------
1B — دليل الصور والأسعار (الأشعة التشخيصية) — FULL CRUD FLOW
--------------------------------------------------------------------------------

SCREEN: قسم الأشعة التشخيصية → دليل الصور والأسعار

THE TABLE — columns:
  # | نوع الصورة | الرمز | الجهاز / الوسيلة | السعر (₪) | وقت الإنجاز | ملاحظات | إجراءات

SAMPLE DATA (use this real data in the mockup):
  1 | صورة صدر (X-Ray)           | XR-CHEST  | X-Ray         | ₪ 120 | فوري      |
  2 | صورة يد (X-Ray)            | XR-HAND   | X-Ray         | ₪ 80  | فوري      |
  3 | صورة عمود فقري             | XR-SPINE  | X-Ray         | ₪ 150 | فوري      |
  4 | أشعة مقطعية — رأس (CT)     | CT-HEAD   | CT Scanner    | ₪ 350 | 30 دقيقة  |
  5 | أشعة مقطعية — بطن (CT)     | CT-ABD    | CT Scanner    | ₪ 380 | 30 دقيقة  |
  6 | رنين مغناطيسي — ركبة (MRI) | MRI-KNEE  | MRI           | ₪ 500 | ساعة      |
  7 | تصوير بالموجات فوق صوتية   | US-ABD    | Ultrasound    | ₪ 200 | 20 دقيقة  |
  8 | تصوير الثدي (Mammogram)     | MAMMO     | Mammography   | ₪ 280 | 30 دقيقة  |

ACTION BAR:
  [+ إضافة صورة جديدة] primary button
  [تصدير Excel] ghost button
  Search input

ROW ACTIONS — BOTH MUST WORK:
  [✏️ تعديل] → EDIT MODAL (pre-filled)
  [🗑️ حذف]  → DELETE CONFIRMATION

━━━ MODAL: إضافة / تعديل صورة شعاعية ━━━
  Size: 560px
  Title: "إضافة نوع صورة جديدة" OR "تعديل: [نوع الصورة]"

  FIELDS:
    نوع الصورة / التصوير *     text input — e.g. صورة صدر (X-Ray)
    الرمز (Code)               text input — e.g. XR-CHEST
    الجهاز / الوسيلة *         dropdown:
                                  X-Ray | CT Scanner | MRI | Ultrasound |
                                  Mammography | Fluoroscopy | أخرى
    السعر (₪) *                number input
    وقت الإنجاز التقريبي       number input + [دقيقة / ساعة] toggle
    تعليمات التحضير            textarea — e.g. "يُمنع الأكل قبل ساعتين"
    ملاحظات                    textarea

  FOOTER: [حفظ] primary + [إلغاء] outline

  ON SAVE: row updates/adds in table + toast + modal closes

━━━ DELETE CONFIRMATION for radiology images ━━━
  "هل تريد حذف '[نوع الصورة]' من الدليل؟"
  [حذف] danger + [إلغاء]

--------------------------------------------------------------------------------
1C — الرئيسية والإحصائيات (كل الأقسام) — NO LONGER EMPTY
--------------------------------------------------------------------------------

After merging (see Part 2), this section becomes "الجرار وحركاته".
The statistics must show REAL CONTENT — not empty.

WHAT THE STATS SECTION MUST SHOW (with sample data):

DRAWER CARD (top, full width, navy bg):
  "جرار عيادة الجراحة العامة والطوارئ"
  الرصيد الحالي: ₪ 4,350
  [↑ إضافة للجرار] + [↓ سحب من الجرار]

STATS CARDS (3 cards below drawer):
  Card 1: عدد المرضى اليوم: 12  | إجمالي المرضى: 342  | (mini trend line)
  Card 2: إيرادات اليوم: ₪ 1,800 | إيرادات الشهر: ₪ 22,300
  Card 3: إجمالي السحوبات: ₪ 8,200 | رصيد صافي: ₪ 14,150

CHART — حركة الجرار (last 14 days):
  Area chart, 50% width
  X: dates | Y: ₪ balance
  Shows ups (green) and downs (red)

CHART — الإيرادات اليومية (last 14 days):
  Bar chart, 50% width

TRANSACTIONS LIST (recent 10):
  Tabbed: [الكل] [الإضافات ↑] [السحوبات ↓]
  Each row: icon + description + category + amount (colored) + time ago
  [عرض الكل →] loads full transaction history

EMPLOYEES CARD (bottom):
  Title: "موظفو القسم"
  List: name | role | this month's withdrawals taken
  [+ إضافة سحب لموظف] quick action button per row

================================================================================
PART 2 — NAVIGATION MERGES
================================================================================

--------------------------------------------------------------------------------
2A — MERGE: كل قسم طبي — دمج "الرئيسية والإحصائيات" مع "الجرار وحركاته"
--------------------------------------------------------------------------------

BEFORE (old navigation inside each department):
  ├── فتح ملف مريض
  ├── الرئيسية والإحصائيات       ← REMOVE THIS
  ├── الجرار وحركاته             ← KEEP THIS, EXPAND IT
  └── دليل الفحوصات/الصور       (lab & radiology only)

AFTER (new navigation inside each department):
  ├── فتح ملف مريض
  ├── الجرار وحركاته             ← NOW CONTAINS BOTH (stats + drawer)
  └── دليل الفحوصات/الصور       (lab & radiology only)

THE MERGED SCREEN "الجرار وحركاته" contains (in this order):
  1. Drawer balance card with action buttons           (was: الجرار)
  2. Department KPI stats (patients, revenue, etc.)   (was: الإحصائيات)
  3. Charts (drawer movement + daily revenue)         (was: الإحصائيات)
  4. Employees list + quick withdrawal per employee   (was: الإحصائيات)
  5. Full transaction history table with tabs         (was: الجرار)
  6. فواتير الشركات tab                               (stays here)

--------------------------------------------------------------------------------
2B — MERGE: النظام المالي — نقل "سحوبات الجرار" إلى "الجرار - كل الأقسام"
--------------------------------------------------------------------------------

BEFORE (tabs in النظام المالي):
  الملخص المالي | الجرار - كل الأقسام | الإيرادات | سحوبات الجرار | الرواتب | الديون

AFTER (tabs in النظام المالي):
  الملخص المالي | الجرار - كل الأقسام | الإيرادات | الرواتب | الديون

THE NEW "الجرار - كل الأقسام" TAB contains:
  Two sections (use sub-tabs or accordion):

  Section A: "نظرة عامة — كل الجرارات"
    4 cards (one per department):
      Each card: dept name + current balance + today's movement (+/-)
    Total balance bar at top: "إجمالي النقد في جميع الجرارات: ₪ 18,200"
    Bar chart: رصيد كل جرار (4 bars, one per dept)

  Section B: "سحوبات الجرار" (the content that was its own tab)
    Date range picker
    Filter by: القسم | التصنيف | المستفيد
    Table: التاريخ | القسم | العنوان | التصنيف | المستفيد | المبلغ | الرصيد بعد
    Totals row at bottom per category
    Export: Excel + PDF

================================================================================
PART 3 — إعدادات الطباعة (NEW SECTION in System Settings)
================================================================================

ADD THIS as a new tab in إعدادات النظام, alongside المخزون والكيتات and النسخ الاحتياطي.

TAB NAME: إعدادات الطباعة

PURPOSE: The center uses pre-printed letterhead paper. All print jobs must
avoid printing over the existing letterhead. Admin sets custom margins.

SCREEN LAYOUT:

HEADER:
  Title: "إعدادات الطباعة"
  Subtitle: "حدد الهوامش لكل نوع مطبوعة حتى لا يتداخل الطباعة مع ترويسة الورق"

INFO BANNER (blue):
  "ℹ️ المركز يطبع على ورق مطبوع مسبقاً بترويسة رأسية وتذييل. قم بتحديد هوامش
   كافية لكل نوع من المطبوعات لتجنب الطباعة فوق الترويسة الموجودة."

SECTION 1 — الهوامش الافتراضية لكل المطبوعات:
  Title: "الهوامش الافتراضية (تنطبق على جميع المطبوعات ما لم يُحدَّد غير ذلك)"
  4 fields in a cross/box layout representing paper:
    ┌─────────────────────────────┐
    │    الهامش العلوي: [____] mm │
    │ الهامش  ┌───────┐  الهامش  │
    │ الأيمن: │ ورقة │ الأيسر:  │
    │ [__] mm └───────┘ [__] mm  │
    │   الهامش السفلي: [____] mm │
    └─────────────────────────────┘
  Default values: 25mm / 15mm / 15mm / 20mm (top generous for letterhead)

  Paper size dropdown: [A4] [A5] [Letter]
  Orientation toggle: [عمودي Portrait ☑] [أفقي Landscape]

SECTION 2 — هوامش مخصصة لكل نوع مطبوعة:
  Toggle at top: "تفعيل هوامش مخصصة لكل نوع" ON/OFF
  If ON, shows expandable card per print type:

  Card 1: نتائج المختبر
    الهامش العلوي: [___] mm   ← usually largest (letterhead is at top)
    الهامش الأيمن: [___] mm
    الهامش الأيسر: [___] mm
    الهامش السفلي: [___] mm   ← may need room for footer stamp area
    [معاينة الطباعة] button

  Card 2: الفواتير والإيصالات
    Same 4 margin fields
    [معاينة الطباعة] button

  Card 3: كشوفات الحسابات
    Same 4 margin fields
    [معاينة الطباعة] button

  Card 4: تقرير الأشعة
    Same 4 margin fields
    [معاينة الطباعة] button

  Card 5: تقرير مالي
    Same 4 margin fields
    [معاينة الطباعة] button

SECTION 3 — معاينة الصفحة:
  A live visual preview of an A4 page:
    ┌─────────────────────────┐
    │░░░░░ منطقة الترويسة ░░░│  ← gray shaded = letterhead area (untouchable)
    │░░░░░ (ارتفاع الهامش)░░│
    ├─────────────────────────┤
    │                         │
    │   منطقة الطباعة المتاحة │  ← white = where content prints
    │   (آمنة ولا تتداخل     │
    │    مع الترويسة)         │
    │                         │
    ├─────────────────────────┤
    │░░░░ منطقة التذييل ░░░░│  ← gray shaded = footer letterhead
    └─────────────────────────┘
  The gray areas resize live as admin changes the margin values
  Measurements shown on the sides (like a ruler)

[معاينة الطباعة] MODAL (triggered per card or globally):
  Shows a real A4 preview of that document type
  Gray bars at top and bottom representing the pre-printed areas
  Content positioned within the safe margins
  [طباعة صفحة اختبار] button — prints a test page with margin guides

SAVE BUTTON:
  [حفظ إعدادات الطباعة] primary button — fixed at bottom of page
  On save: toast "تم حفظ إعدادات الطباعة ✓ — ستُطبَّق على جميع المطبوعات"

================================================================================
PART 4 — REAL DATA FOR LAB TEST CATALOG (use in mockup)
================================================================================

USE THIS DATA to populate دليل الفحوصات والأسعار in the mockup (not Lorem Ipsum):

#  | اسم الفحص                            | الرمز    | الفئة              | السعر  | Kit           | وقت
---|--------------------------------------|----------|--------------------|--------|---------------|--------
1  | تعداد الدم الكامل                    | CBC      | تحاليل الدم        | ₪ 45   | CBC Kit       | فوري
2  | تحليل البول العام                    | UA       | تحاليل البول       | ₪ 30   | Urine Strip   | فوري
3  | سكر الدم الصيامي                     | FBS      | الكيمياء الحيوية   | ₪ 25   | Glucose Kit   | فوري
4  | سكر الدم التراكمي (HbA1c)            | HBA1C    | الكيمياء الحيوية   | ₪ 65   | HbA1c Kit     | ساعة
5  | وظائف الكبد (LFTs)                   | LFT      | الكيمياء الحيوية   | ₪ 85   | LFT Kit       | ساعة
6  | وظائف الكلى (Creatinine + BUN)       | KFT      | الكيمياء الحيوية   | ₪ 75   | KFT Kit       | ساعة
7  | الدهون الثلاثية والكوليسترول         | LIPID    | الكيمياء الحيوية   | ₪ 90   | Lipid Kit     | ساعة
8  | هرمون الغدة الدرقية (TSH)            | TSH      | الهرمونات          | ₪ 75   | TSH Kit       | يوم
9  | هرمون T3 و T4                        | T3T4     | الهرمونات          | ₪ 110  | Thyroid Kit   | يوم
10 | فيروس الكبد B (HBsAg)               | HBSAG    | الأمراض المعدية    | ₪ 55   | HBsAg Kit     | ساعة
11 | فيروس الكبد C (HCV)                  | HCV      | الأمراض المعدية    | ₪ 65   | HCV Kit       | ساعة
12 | فيروس نقص المناعة (HIV)              | HIV      | الأمراض المعدية    | ₪ 70   | HIV Kit       | ساعة
13 | حمض البوليك (Uric Acid)              | UA-ACID  | الكيمياء الحيوية   | ₪ 35   | UA Kit        | فوري
14 | الحديد والتشبع (Iron + TIBC)         | IRON     | الكيمياء الحيوية   | ₪ 80   | Iron Kit      | ساعة
15 | فيتامين د (Vit D3)                   | VITD     | الهرمونات          | ₪ 95   | Vit D Kit     | يوم
16 | فيتامين ب١٢ (Vit B12)               | VITB12   | الهرمونات          | ₪ 85   | B12 Kit       | يوم
17 | بروتين سي التفاعلي (CRP)             | CRP      | الأمراض المعدية    | ₪ 45   | CRP Kit       | فوري
18 | معدل ترسيب الدم (ESR)                | ESR      | تحاليل الدم        | ₪ 25   | —             | فوري
19 | مجموعة الدم وعامل ريسوس             | BLOOD-GRP| تحاليل الدم        | ₪ 40   | Blood Group   | فوري
20 | تحليل البراز العام                   | STOOL    | تحاليل البول       | ₪ 30   | —             | ساعة
21 | هرمون الحمل (β-HCG)                 | BHCG     | الهرمونات          | ₪ 55   | HCG Kit       | فوري
22 | البروستاتا (PSA)                     | PSA      | الهرمونات          | ₪ 80   | PSA Kit       | يوم
23 | معدل ترشيح الكبيبات (GFR)           | GFR      | الكيمياء الحيوية   | ₪ 50   | KFT Kit       | ساعة
24 | الصوديوم والبوتاسيوم (Electrolytes) | ELEC     | الكيمياء الحيوية   | ₪ 70   | Electro Kit   | ساعة
25 | ثقافة البول (Urine Culture)          | UC       | الأمراض المعدية    | ₪ 90   | Culture Kit   | 3 أيام

ALSO ADD "استيراد من Excel" FEATURE to this screen:
  Button [↑ استيراد من Excel] opens upload modal
  Admin can upload .xlsx file → system reads columns → maps them → imports
  This is how the above 25 tests were initially added to the system

================================================================================
PART 5 — COMPLETE FLOW CHECKLIST (VERIFY EVERY INTERACTION)
================================================================================

For دليل الفحوصات (Lab):
  [ ] [+ إضافة فحص جديد] opens add modal
  [ ] [✏️ تعديل] on any row opens edit modal pre-filled with that row's data
  [ ] [🗑️ حذف] on any row opens confirmation dialog
  [ ] [استيراد من Excel] opens import modal
  [ ] Add modal: all fields functional, save closes modal and adds row
  [ ] Edit modal: all fields pre-filled, save closes modal and updates row
  [ ] Delete: row disappears after confirmation
  [ ] Search bar: filters table live as user types

For دليل الصور (Radiology):
  [ ] [+ إضافة صورة جديدة] opens add modal
  [ ] [✏️ تعديل] on any row opens edit modal pre-filled
  [ ] [🗑️ حذف] opens confirmation dialog
  [ ] All modal fields functional
  [ ] Table populated with sample data (from Part 4 radiology section)

For الجرار وحركاته (each department):
  [ ] Stats cards show real numbers (not empty)
  [ ] Charts render with sample data
  [ ] [↑ إضافة للجرار] opens deposit modal
  [ ] [↓ سحب من الجرار] opens withdrawal modal with category dropdown
  [ ] Transaction table shows history with colored amounts
  [ ] Tabs [الكل] [الإضافات ↑] [السحوبات ↓] all filter correctly
  [ ] [فواتير الشركات] tab shows invoice management

For إعدادات الطباعة:
  [ ] All 4 margin inputs functional (update preview live)
  [ ] Preview illustration updates as margins change
  [ ] Per-document-type custom margins toggle works
  [ ] [معاينة الطباعة] opens print preview modal
  [ ] [حفظ إعدادات الطباعة] saves with success toast

================================================================================
END OF AMENDMENT 2
================================================================================
