# تقرير التدقيق المعماري للنظام المالي والمحاسبي
# Financial & Accounting System — Architectural Audit

> **مركز وعيادة الدكتور مهند سليمان جابر — نظام الإدارة الشاملة**
> **نوع الوثيقة:** تدقيق معماري للقراءة فقط (Read-only architectural audit)
> **النطاق:** النظام المالي والمحاسبي بالكامل — الواجهة الأمامية (React + Vite) والخلفية (Express + PostgreSQL)
> **تاريخ التقرير:** 2026-07-04

---

## ⚠️ إخلاء مسؤولية / Scope Statement

هذا المستند **توثيقي بحت (documentation only)**. لا يحتوي على أي تعديل للكود، ولا إعادة هيكلة، ولا إصلاحات، ولا ميزات جديدة. قسم "المخاطر" (Risks) يصف المخاطر **دون حلول**. القسم الوحيد الذي يقترح مواضع للتوسّع هو "نقاط التوسّع الآمنة" (Safe Extension Points)، وهو يصف **أين** يمكن التوسّع بأمان دون أن يفرض تنفيذاً معيّناً.

---

## 🔴 0. تدقيق عالي الصرامة — تصنيف الخطورة / High-Strictness Severity Classification

> **افتراض التدقيق:** النظام يتعامل مع أموال حقيقية ويُعامَل كنظام إنتاجي حرج (production-critical). أي تعارض في **التفويض (authorization)** أو **منطق المحاسبة** أو **سلامة السجل المحاسبي (ledger integrity)** يُصنَّف **CRITICAL**. الأدلة أدناه من قراءة فعلية للكود على القرص (file:line)، لا تخمين.

### 0.1 الأجوبة الصريحة الثلاثة / The Three Explicit Answers

**س1) هل يمكن تجاوز الخلفية (Can the backend be bypassed)? — نعم، بشكل قاطع.**
- **لا يوجد حارس تفويض عام (no global auth middleware).** يركّب `server.js` جميع الراوترات مباشرةً (`app.use(\`${BASE}/api/...\`, router)` عند الأسطر 476–494) دون أي `app.use` للمصادقة قبلها. الحماية اختيارية لكل مسار عبر `requireAdmin` فقط.
- **معظم عمليات الكتابة المالية بلا أي حارس:** إنشاء/تعديل الفواتير والديون والديون الخارجية، وإنشاء **وحذف** سندات القبض والصرف — كلها بدون `requireAdmin`. أي عميل HTTP (curl) يستدعيها **بلا رمز (token)** ويحصل على `201/200`.
- **تجاوز حدود الصندوق المحمي:** مسارات `drawers` المُعدِّلة محمية بـ `requireAdmin`، لكنّ `POST /finance/receipt-vouchers` (سطر 453) و`POST /finance/payment-vouchers` (سطر 541) — **غير المحميّة** — تُدخِل صفّاً في `drawer_transactions` وتُعدِّل `drawers.balance` مباشرةً. النتيجة: **يُلتَف حول حماية الصندوق بالكامل**، ويمكن لمهاجم غير مُصادَق أن يضخّم/يخفض رصيد أي صندوق عبر إنشاء سندات.

**س2) هل يمكن التلاعب بالبيانات المالية من الواجهة الأمامية (Can financial data be manipulated from the frontend)? — نعم، بل ومن دون الواجهة أصلاً.**
- كل تمييز للأدوار/الصلاحيات (مدير مقابل موظف مقابل قسم) يُفرَض في حالة React على المتصفّح (كما في `threat_model.md`)، ولا يُعاد التحقق منه على الخادم إلا عبر فحص رمز `requireAdmin` الرقيق على مجموعة جزئية من المسارات.
- بما أن أغلب مسارات الكتابة المالية غير مُصادَقة، فالمهاجم **لا يحتاج الواجهة**: نداءات API مباشرة تُنشئ/تُعدّل الفواتير والديون والسندات، ومن خلال السندات تُعدّل أرصدة الصناديق.
- **`balance_after` يُحسَب على العميل** (في `doDeposit`/`doWithdraw`، `src/app/App.tsx` ~14805/14796) ويُقبَل حرفياً في `POST /drawers/transactions` (سطر 133) — أي أن عمود الرصيد الجاري في السجل **مُتحكَّم فيه من العميل**.

**س3) هل السجل المحاسبي مقاوم للعبث (Is the ledger tamper-proof)? — لا.**
- صفوف `drawer_transactions` **قابلة للتعديل**: `PUT /drawers/transactions/:id` (سطر 151) يعيد كتابة `amount` و`balance_after`، و**قابلة للحذف**: `DELETE /drawers/transactions/:id` (سطر 177). لا يوجد نمط append-only ولا ثبات (immutability).
- `balance_after` مُورَّد من المستدعي وليس مشتقاً من مجموع جارٍ موثوق على الخادم — عمود سلامة السجل مُتحكَّم فيه من العميل.
- إنشاء السند يكتب صفوف سجل عبر مسار غير مُصادَق؛ وحذف السند يزيل السند **دون عكس** حركة الصندوق (لا قيد مزدوج/double-entry، لا reversal).
- عمليات الكتابة متعددة الصفوف **غير ملفوفة بمعاملة قاعدة بيانات (no DB transaction)** → كتابات جزئية/ممزّقة ممكنة.
- **الخلاصة:** السجل جدول صفوف قابلة للتعديل والحذف بأرصدة يحسبها العميل، بلا ثبات ولا مطابقة ولا قيد مزدوج — **ليس مقاوماً للعبث.**

### 0.2 جدول تصنيف الخطورة / Severity Matrix

| # | الخطورة | العنوان | الملف : السطر / الدالة | التصنيف |
|---|---------|---------|------------------------|---------|
| **C1** | 🔴 CRITICAL | تعديل أرصدة الصناديق دون مصادقة عبر إنشاء السندات (التفاف على مسارات الصندوق المحمية) | `routes/finance.js:453` (receipt), `:541` (payment) → تكتب `drawer_transactions` + `drawers.balance` | فقدان مالي + وصول غير مصرّح |
| **C2** | 🔴 CRITICAL | حذف السندات المالية دون مصادقة **ودون عكس** الحركة النقدية | `routes/finance.js:509`, `:598` (لا `requireAdmin`؛ قارن PUT `:484`/`:572` المحميّة) | فقدان مالي + فجوة تدقيق |
| **C3** | 🔴 CRITICAL | إنشاء/تعديل الفواتير والديون والديون الخارجية دون مصادقة | `routes/finance.js:39,54` (invoices), `:120,134` (debts), `:202,218` (external) | تلاعب مالي + وصول غير مصرّح |
| **C4** | 🔴 CRITICAL | قراءة كل البيانات المالية والمرتبطة بالمرضى دون مصادقة (إفشاء) | `routes/finance.js` GETs 8/91/173/256/430/518 (فقط `/summary:614` محمي) | إفشاء بيانات مالية/صحية منظّمة |
| **C5** | 🔴 CRITICAL | السجل غير مقاوم للعبث: صفوف قابلة للتعديل/الحذف + `balance_after` من العميل | `routes/drawers.js:151` (PUT edit), `:177` (DELETE); `:133` يقبل `balance_after` من العميل | سلامة السجل / فقدان مالي |
| **C6** | 🔴 CRITICAL | لا حارس تفويض عام؛ التفويض على العميل فقط وتطبيق غير متسق لكل مسار | `server.js:476–494` (لا middleware مصادقة عام); `threat_model.md` | وصول غير مصرّح (تعارض تفويض) |
| **H1** | 🟠 HIGH | كتابات الصندوق fire-and-forget بلا `await`/`catch` وكتابات جزئية غير ذرّية | `src/app/App.tsx:14796` (`doWithdraw`), `:14805` (`doDeposit`), `:14813` (`doAdjustBalance`) | سلامة البيانات |
| **H2** | 🟠 HIGH | مسار كتابة الصلاحيات يُسقِط ~47 عموداً بصمت (يُخزَّن `can_view` فقط عملياً) | `routes/staff.js:9–12` (`PERM_COLS_ALLOWED`), `src/app/App.tsx:10880` (`savePerms` يرسل ~50) | سلامة البيانات / عدم تطابق تفويض |
| **H3** | 🟠 HIGH | إنشاء السند = 3 كتابات دون معاملة قاعدة بيانات (لا ذرّية) | `routes/finance.js:453–483` (INSERT voucher → INSERT tx → UPDATE balance) | سلامة السجل |
| **H4** | 🟠 HIGH | راتب `daily`/الشِفت مُهيّأ لكنه غير مُنفَّذ؛ صافي الراتب يتجاهل الدوام و`shift_amount` | `src/app/App.tsx` — `PayrollScreen.calcNet` (`salary+commission−expenses−pendingAdvances`) | منطق محاسبة (راتب خاطئ محتمل) |
| **M1** | 🟡 MEDIUM | مخزن رموز المدير في الذاكرة (يُفقد عند إعادة التشغيل، بلا إلغاء مركزي، بلا حد) | `middleware/adminAuth.js` (`adminTokens = new Map()`, TTL 8h) | عدم اتساق معماري / إدارة جلسات |
| **M2** | 🟡 MEDIUM | نمط حماية غير متسق (DELETE محمي للفواتير/الديون لا للسندات؛ PUT محمي للسندات لا POST) | `routes/finance.js` (مقارنة `:80/:162/:245` مقابل `:509/:598`) | عدم اتساق معماري |
| **M3** | 🟡 MEDIUM | لا ذرّية معاملات عبر عمليات متعددة الكتابة عموماً (خارج السندات أيضاً) | `routes/*.js` (لا `BEGIN/COMMIT`) | عدم اتساق معماري |
| **L1** | 🔵 LOW | رسالة نجاح مضلِّلة عند حفظ الصلاحيات رغم الإسقاط الصامت للأعمدة | `src/app/App.tsx:10947` (`toast("تم حفظ الصلاحيات بنجاح")`) | تجربة/توثيق |
| **L2** | 🔵 LOW | `doWithdraw` يعود بصمت عند نقص الرصيد بلا إعلام للمستخدم | `src/app/App.tsx:14798` (`if(...currentBal<amount)return;`) | تجربة/توثيق |

> **ملخّص تنفيذي بلا تلطيف:** النظام **ليس آمناً مالياً بوضعه الحالي كنظام إنتاجي**. الخلفية قابلة للتجاوز، والبيانات المالية قابلة للتلاعب مباشرةً عبر API دون مصادقة، والسجل المحاسبي قابل للتعديل والحذف بأرصدة يحسبها العميل. البنود C1–C6 يجب اعتبارها موانع إطلاق (release blockers) لأي تشغيل بأموال حقيقية.

---

جدول المحتويات:

0. [تدقيق عالي الصرامة — تصنيف الخطورة](#-0-تدقيق-عالي-الصرامة--تصنيف-الخطورة--high-strictness-severity-classification)

1. [البنية المعمارية العامة](#1-البنية-المعمارية-العامة--overall-architecture)
2. [جداول قاعدة البيانات المالية](#2-جداول-قاعدة-البيانات-المالية--database-tables)
3. [ملفات الخلفية (Backend Files)](#3-ملفات-الخلفية--backend-files)
4. [واجهات برمجة التطبيقات (APIs)](#4-واجهات-برمجة-التطبيقات--apis)
5. [نظام الرواتب (Salary System)](#5-نظام-الرواتب--salary-system)
6. [التدفق النقدي (Cash Flow)](#6-التدفق-النقدي--cash-flow)
7. [التقارير (Reports)](#7-التقارير--reports)
8. [حسابات الموظفين (Employee Accounts)](#8-حسابات-الموظفين--employee-accounts)
9. [منطق المحاسبة والمعادلات](#9-منطق-المحاسبة-والمعادلات--accounting-logic--formulas)
10. [الصلاحيات (Permissions)](#10-الصلاحيات--permissions)
11. [شاشات الواجهة الأمامية](#11-شاشات-الواجهة-الأمامية--frontend-screens)
12. [خرائط الاعتمادية (Dependency Maps)](#12-خرائط-الاعتمادية--dependency-maps)
13. [المخاطر (بدون حلول)](#13-المخاطر--risks-no-solutions)
14. [نقاط التوسّع الآمنة](#14-نقاط-التوسّع-الآمنة--safe-extension-points)
- [ملخّص ختامي وقوائم](#ملخّص-ختامي--closing-summary)
- [مخطط النظام](#مخطط-النظام--system-diagram)

---

## 1. البنية المعمارية العامة — Overall Architecture

النظام تطبيق صفحة واحدة (SPA) بواجهة عربية RTL، مبني على طبقتين:

| الطبقة | التقنية | الدور المالي |
|--------|---------|--------------|
| **الواجهة الأمامية** | React 18 + TypeScript + Vite 6 + Tailwind 4 | كل شاشات المال، إدخال الحركات، احتساب الرواتب، الطباعة والتصدير، والاحتساب المحاسبي الظاهر للمستخدم |
| **الخلفية** | Express (ESM) + PostgreSQL (`pg` Pool) | تخزين واستعلام كل الجداول المالية، محرّك `/summary`، ترقيم السندات، حراسة المشرف (requireAdmin) |
| **قاعدة البيانات** | PostgreSQL | مصدر الحقيقة الدائم لكل الأرصدة والحركات والديون والرواتب والسندات |

### 1.1 الخصائص المعمارية المميّزة

- **حالة مركزية في الجذر:** كل الحالة المالية (`drawers`, `debts`, `invoices`, `employees`, `employeeAdvances`, `externalDebts`, `staffAdvanceRequests`, `purchaseRequests`) تعيش في مكوّن `App` الجذري وتُمرّر للأسفل عبر props. لا يوجد Redux/Zustand — الاعتماد على `useState` + `props drilling`.
- **مزامنة متفائلة (optimistic):** كل عملية مالية تُحدّث حالة React فوراً ثم تُطلق نداء API غير محجوب (`api.*` بدون `await` في معظم المواضع) لتثبيت التغيير في PostgreSQL.
- **تحميل دوري:** `useEffect` في الجذر يشغّل `setInterval` كل ثانية يستدعي `_doLoad()` لإعادة جلب البيانات من الخلفية (يتخطّى التحديث أثناء كتابة المستخدم). هذا سلوك مقصود لا حلقة خاطئة.
- **مسارَان منفصلان للواجهة:** `App()` (واجهة المشرف) و`StaffPortal` (واجهة الموظف) شجرتان JSX مستقلتان تماماً؛ لا غلاف مشترك. أي عنصر مالي عام يجب إضافته لكليهما بشكل منفصل.
- **التوطين الزمني:** كل مقارنات التواريخ تستخدم توقيت **آسيا/القدس (Asia/Jerusalem, UTC+3)** في الخلفية (`AT TIME ZONE 'Asia/Jerusalem'`) وفي الواجهة (`_jlmNow()` + دوال UTC).
- **الإنتاج خارج Replit:** بيئة الإنتاج الفعلية تعمل على استضافة cPanel/Hostinger خارجية بقاعدة بياناتها الخاصة (وليست نشرة Replit). `DATABASE_URL` لدى الوكيل يصل فقط لقاعدة التطوير.

---

## 2. جداول قاعدة البيانات المالية — Database Tables

جميع الجداول ضمن مخطط `public`. القيم النقدية `numeric(12,2)` أو `numeric(10,2)`. التعريفات الكاملة في `schema.sql`.

### 2.1 الصناديق النقدية

**`drawers`** — رصيد الصندوق النقدي لكل قسم:

| العمود | النوع | ملاحظة |
|--------|-------|--------|
| `id` | integer PK | |
| `dept` | varchar(50) | معرّف القسم (بما فيه `reception`) |
| `balance` | numeric(12,2) | الرصيد الحالي |
| `opening_balance` | numeric(12,2) | الرصيد الافتتاحي |
| `opening_balance_date` | date | |
| `updated_at` | timestamptz | |

**`drawer_transactions`** — دفتر يومية كل حركة نقدية (سطر الحقيقة المحاسبي):

| العمود | النوع | ملاحظة |
|--------|-------|--------|
| `id` | integer PK | |
| `dept` | varchar(50) | القسم |
| `type` | varchar(5) | `in` أو `out` (قيد CHECK) |
| `title` | text | وصف الحركة |
| `category` | varchar(100) | تصنيف عربي (يُستخدم للتحليل المحاسبي) |
| `beneficiary` | varchar(200) | المستفيد (للمصروفات/الرواتب) |
| `amount` | numeric(12,2) | المبلغ |
| `balance_after` | numeric(12,2) | الرصيد بعد الحركة (تدقيق) |
| `tx_time` / `tx_date` | time / date | التوقيت والتاريخ |
| `is_auto` | boolean | يميّز الحركات التي تُنشأ آلياً من الخلفية |
| `ref_type` / `ref_id` | varchar / integer | ربط بمرجع (سند/فاتورة) |
| `is_opening_balance` | boolean | يُستثنى من احتساب الربح |

### 2.2 الديون

**`debts`** — ديون المرضى الفعلية المستخدمة في الواجهة (الأساسي):
`id, patient, patient_id, dept, amount, date, phone, sms_sent, created_at, updated_at`.

**`patient_debts`** — جدول ديون مرضى بديل/موازٍ (`patient_id, patient_name, dept, amount, debt_date, days_overdue, phone, sms_sent`). موجود في المخطط لكن المسار الحيّ في الواجهة يستخدم `debts`.

**`external_debts`** — الديون والسلف الخارجية (مع أطراف خارج المرضى):
`id, direction ('given'|'received' — CHECK), party, amount, date, note, status ('pending'|'settled'), settled_date`.

### 2.3 الفواتير

**`invoices`** — فواتير شركات التأمين لكل قسم:
`id (varchar PK), company, date, total, paid, remaining (GENERATED ALWAYS AS total - paid STORED), status, dept, notes`.
> ⚠️ `remaining` عمود محسوب تلقائياً (`GENERATED ALWAYS`) — لا يُكتب إليه مباشرة.

### 2.4 الرواتب والموظفون

**`employees`** — سجلات كشف الرواتب (حالة الصرف):
`id, name, dept, role, salary, expenses, status ('pending'|'calculated'|'paid'), paid_date, commission, net_salary`.

**`staff_members`** — بيانات الموظف الكاملة + إعدادات الراتب:
`id, name, national_id, dob, username, password_hash, job_title, primary_dept, phone, role, salary_type ('fixed' default), fixed_salary, percentage_dept, percentage_value, shift_start, shift_end, shift_amount, status, join_date, can_access_financial, can_access_settings, can_access_reports, can_manage_staff, is_admin_role, can_attendance, notes`.

**`employee_advances`** — سلف الموظفين (تُخصم من الراتب):
`id, emp_name, dept, amount, date, note, repaid, repaid_date`.

**`staff_advance_requests`** — طلبات سلف يقدّمها الموظف للاعتماد:
`id, staff_id, staff_name, dept, amount, request_date (وليس date), reason, status ('pending'|'approved'|'rejected' — CHECK), reviewed_by, review_date, rejection_reason`.

**`attendance_records`** — سجلات الدوام (تغذّي احتساب الأجر اليومي/الشِفت).

### 2.5 السندات

**`receipt_vouchers`** — سندات القبض (نقد داخل):
`id, voucher_no (RV-YYYY-NNNN), date, amount, received_from_type, received_from_id, received_from_name, reason, dept, notes, approved_by`.

**`payment_vouchers`** — سندات الصرف (نقد خارج):
`id, voucher_no (PV-YYYY-NNNN), date, amount, paid_to_type, paid_to_id, paid_to_name, reason, dept, category, notes, approved_by`.

### 2.6 طلبات الشراء

**`purchase_requests`** — رأس الطلب: `id, dept, requested_by, date, total_amount, status ('pending'|...), approved_by, approved_date, rejection_reason, note`.
**`purchase_request_items`** — بنود الطلب: `id, request_id (FK), name, qty, unit, estimated_price, note`.

### 2.7 جداول مساندة مالية

- **`suppliers`** — الموردون (`id, name, type, phone`) — تُستخدم كمصدر لأسماء سندات الصرف.
- **`insurance_companies`** — شركات التأمين — مصدر الفواتير وسندات القبض.
- **`sessions`** — الجلسات العلاجية (`amount, paid, debt`) — مصدر الإيرادات وأساس احتساب النِسب للرواتب.
- **`staff_dept_permissions`** — ~50 عموداً منطقياً (boolean) تتحكّم في الوصول لكل عملية (تشمل `can_drawer_*`, `can_vouchers`, `can_staff_advance`, ...).

---

## 3. ملفات الخلفية — Backend Files

| الملف | الدور المالي |
|-------|--------------|
| `server.js` | تركيب كل المسارات تحت `BASE/api/...` |
| `db.js` | تجمّع اتصالات `pg` (Pool). إعداد SSL واعٍ للبيئة: `false` في التطوير، `{rejectUnauthorized:false}` في الإنتاج |
| `routes/finance.js` (707 سطر) | الفواتير، الديون، الديون الخارجية، سندات القبض والصرف، محرّك `/summary`، وكعب `/reset-all` (410) |
| `routes/drawers.js` | جلب/تحديث الصناديق، إنشاء الحركات (`drawer_transactions`)، تحديث الرصيد |
| `routes/staff.js` | الموظفون (`staff_members` / `employees`)، السلف، طلبات السلف، الدوام واحتساب الساعات (`calcTotalHours`) |
| `routes/sessions.js` | الجلسات العلاجية — مصدر الإيرادات (لا يُنشئ حركة صندوق آلياً؛ الواجهة تتكفّل عبر `doDeposit`) |
| `routes/settings.js` | حسابات المشرفين، تسجيل الدخول، إعدادات (تأمين/موردون/SMS)، بيانات الاعتماد |
| `routes/admin.js` | نقاط حذف البيانات المجمّعة (`/admin/execute-delete`, `/admin/tables`) |
| `routes/backup.js` + `services/backupService.js` | النسخ الاحتياطي والاستعادة بلغة JS خالصة (بدون `pg_dump`) |
| `routes/patients.js` | المرضى (مرتبطة بالديون والجلسات) |
| `middleware/adminAuth.js` | `requireAdmin` — رموز Bearer، خريطة رموز في الذاكرة بعمر 8 ساعات |

### 3.1 محرّك الملخص المالي `/finance/summary`

- محمي بـ `requireAdmin`.
- يعكس منطق `financialEngine.ts` في الواجهة: يصنّف `drawer_transactions` حسب سلاسل التصنيف العربية.
- يستثني `رصيد افتتاحي` من الإيراد/الربح.
- `netProfit = income − expenses`؛ `totalDebts` من جدول `debts`.

### 3.2 كعب إعادة الضبط `/finance/reset-all`

مسار ميّت (أسماء جداول خاطئة) يُعيد الآن **410 Gone** مع حارس `requireAdmin`. الحذف الفعلي المجمّع يتم عبر `POST /api/admin/execute-delete` (targetCategory: patients/financials/all).

---

## 4. واجهات برمجة التطبيقات — APIs

كل المسارات مثبّتة تحت `BASE/api/...`. طبقة الواجهة موحّدة في `src/app/api.ts`.

### 4.1 خريطة نقاط النهاية المالية

| المجموعة | المسارات | الحماية |
|----------|----------|---------|
| **الفواتير** | GET `/invoices`, GET `/invoices/:id`, POST, PUT, DELETE | القراءة والكتابة مفتوحة؛ **DELETE يتطلب `requireAdmin`** |
| **الديون** | GET `/debts`, GET `/debts/:id`, POST, PUT, DELETE | DELETE يتطلب `requireAdmin`؛ PUT بنمط fetch-first |
| **الديون الخارجية** | GET `/external-debts`, GET `/:id`, POST (يقبل `dir` أو `direction`), PUT, DELETE | مشابهة |
| **سندات القبض** | GET `/receipt-vouchers`, GET `/:id`, POST (ينشئ حركة `in` + يزيد الرصيد), DELETE | ⚠️ DELETE **غير محمي** بـ requireAdmin |
| **سندات الصرف** | GET `/payment-vouchers`, GET `/:id`, POST (ينشئ حركة `out` + ينقص الرصيد), DELETE | ⚠️ DELETE **غير محمي** بـ requireAdmin |
| **الصناديق** | GET `/drawers`, `/drawers/:dept`, POST `/drawers` (upsert), PUT balance, GET/POST `/drawer-transactions` | الكتابة عبر الواجهة |
| **الموظفون (staff_members)** | GET/POST/PUT/DELETE `/staff`, GET `/staff/:id`, PATCH `/staff/:id/credentials` | POST/PUT/DELETE تتطلب `requireAdmin` |
| **كشف الرواتب (employees)** | GET `/staff/employees/all`, GET `/:id`, POST/PUT/DELETE `/staff/employees` | الكتابة `requireAdmin` |
| **السلف** | GET `/staff/advances/all`, POST/PUT/DELETE `/staff/advances` | الكتابة `requireAdmin` |
| **الدوام** | GET `/staff/attendance/all`, POST/PUT/DELETE `/staff/attendance` | |
| **صلاحيات القسم** | GET `/staff/:staff_id/permissions`, POST/PUT/DELETE `/staff/:staff_id/permissions[/:dept]` | الكتابة `requireAdmin` |
| **طلبات السلف** | `/staff/advance-requests` (يجب تسجيله **قبل** `/:id` وإلا التقطه Express كوسيط integer) | DELETE `requireAdmin` |
| **الملخّص** | GET `/finance/summary` | `requireAdmin` |
| **الحذف الإداري** | POST `/admin/execute-delete`, GET/DELETE `/admin/tables` | `requireAdmin` |
| **النسخ** | `/backup/*` | |

### 4.2 ملاحظات على أنماط الـ API

- **نمط PUT fetch-first:** كل مسارات PUT تجلب السجل أولاً (`SELECT`) ثم تدمج الحقول الجزئية، فلا تُمحى قيمة بإرسال حقل واحد فقط.
- **مرشّحات المدى الزمني:** المعاملات `startDate`/`endDate` تُطبّق عبر `created_at AT TIME ZONE 'Asia/Jerusalem'`؛ و`from`/`to` عبر عمود `date`.
- **`api.parseDateISO`:** الواجهة تحوّل التواريخ العربية/المحلية إلى ISO قبل الإرسال.

---

## 5. نظام الرواتب — Salary System

المصدر: `PayrollScreen` (في `App.tsx`) + `staff_members` + `employees` + `employee_advances` + `sessions`.

### 5.1 أنواع الراتب (`salary_type`)

| النوع | الوصف | مصدر العمولة |
|-------|-------|--------------|
| `fixed` | راتب ثابت شهري | لا عمولة (0) |
| `percentage` | نسبة من الإيرادات الفردية | `round(إيراد الموظف × percentage_value/100)` |
| `both` / مختلط | ثابت + نسبة | كلاهما |
| `daily` (شِفت) | حقول أجر يومي/شِفت مُهيّأة (`shift_amount`, `shift_start`, `shift_end`) | — (انظر التنبيه أدناه) |

> ⚠️ **مُهيّأ مقابل مُنفَّذ (configured vs implemented):** أنواع `fixed` و`percentage` و`both` **منفّذة فعلياً** في معادلة صافي الراتب (`calcNet`). أمّا نوع `daily`/الشِفت فحقوله (`shift_amount`, `shift_start`, `shift_end`) **مُهيّأة في النموذج والقاعدة فقط**، ومعادلة صافي الراتب في `PayrollScreen` **لا تستهلك `attendance_records` ولا `shift_amount`** في احتساب المستحق؛ فهي دائماً `salary + commission − expenses − pendingAdvances`. ساعات الدوام تُحسب (`calcTotalHours`) لأغراض العرض/التتبّع، لا لدفع صافي الراتب.
>
> ملاحظة توثيقية: نموذج إعداد الراتب يُظهر حقول النسبة/القسم لأنواع `percentage`, `both`, و`daily`؛ ونوع `daily` يعرض صندوق معلومات إيراد القسم.

### 5.2 معادلة الراتب الفعلية (الواجهة)

```
commission (للأنواع ذات النسبة) = round(rangeRevenue × percentage_value / 100)
  حيث rangeRevenue = Σ paid للجلسات التي:
        s.doctor === اسم الموظف
        AND (لا أقسام محدّدة  OR  s.dept ضمن percentageDepts)
        AND s.date ضمن المدى [from, to]
net = max(0,  salary + commission − expenses − totalPendingAdvances)
```

- `totalPendingAdvances` = مجموع `employee_advances` غير المسدّدة (`repaid = false`) للموظف.
- المعادلة تُعرض للمستخدم نصّياً: **الراتب الأساسي + نسبة الإيرادات الفردية − الخصومات − السلف القائمة = الصافي المستحق**.

### 5.3 تقسيم الصرف متعدد الأقسام (`getPaySplit`)

عند وجود أكثر من صندوق في `payFromDepts` للموظف، يُقسَّم الصافي **تناسبياً مع الإيراد الفعلي** لكل قسم:

```
share_i = revenue_i / Σ revenue      (أو توزيع متساوٍ إن كان الإجمالي = 0)
amount_i = round(net × share_i)
الفرق (بسبب التقريب) يُضاف لآخر قسم
```

### 5.4 آلية الصرف

- زر **احتساب** ← يضبط `status = calculated` ويخزّن `commission` و`net_salary` عبر `api.staff.employees.update`.
- زر **صرف الراتب** ← يتحقق من كفاية الرصيد المجمّع، ثم لكل قسم يستدعي `doWithdraw(dept, amount, "راتب ...", "راتب موظف", empName)` ← تُنشأ حركة `out` في `drawer_transactions` ويُنقص رصيد الصندوق ← يضبط `status = paid` + `paid_date`.
- **قسيمة الراتب (payslip):** قابلة للطباعة بمدى تاريخي، تُظهر تفاصيل الجلسات والعمولة والخصومات والسلف.

---

## 6. التدفق النقدي — Cash Flow

### 6.1 دوال الحركة الجذرية (في `App`)

| الدالة | الأثر | نداء الـ API |
|--------|-------|--------------|
| `doDeposit(dept, amount, title, cat)` | حركة `in`، رصيد += amount | `drawers.transactions.create({type:'in', balance_after:newBal, is_opening_balance: cat==='رصيد افتتاحي'})` + `updateBalance` |
| `doWithdraw(dept, amount, title, cat, ben?)` | حركة `out`، رصيد −= amount (يمنع الرصيد السالب) | `drawers.transactions.create({type:'out', balance_after:newBal})` + `updateBalance` |
| `doAdjustBalance(dept, newBalance, reason)` | تعديل يدوي، حركة `in`/`out` حسب الفرق، تصنيف `تعديل رصيد` | مشابه |
| `onAddDeptDrawer(deptId)` | إنشاء صندوق جديد برصيد 0 | `drawers.upsert(deptId, 0)` |

> **قاعدة منع الازدواج المحاسبي:** مسار `sessions` في الخلفية **لا يُنشئ** حركة صندوق آلياً؛ لأن `doDeposit` في الواجهة يتكفّل بها مع `balance_after` الصحيح. علم `is_auto` يميّز الحركات المُنشأة من الخلفية إن أُعيد استخدامها لاحقاً.

### 6.2 المصادر التي تُغذّي الصندوق (in)

- دفع الجلسات (Reception/Lab/Rad/Rehab/Surgery) عبر `doDeposit`.
- تسوية الديون (تحصيل دين مريض) عبر `doDeposit`.
- سندات القبض (`receipt_vouchers` POST — يُنشئ حركة `in` تلقائياً في الخلفية).
- تسوية دين خارجي مُستلم.
- الرصيد الافتتاحي (تصنيف `رصيد افتتاحي`، يُستثنى من الربح).

### 6.3 المصارف (out)

- الرواتب (`راتب موظف`) عبر `doWithdraw`.
- سلف الموظفين.
- المصروفات وطلبات الشراء المعتمدة.
- سندات الصرف (`payment_vouchers` POST — يُنشئ حركة `out` تلقائياً).
- الديون الخارجية المُعطاة.

### 6.4 دورة الفاتورة (شركات التأمين)

الفاتورة تُنشأ برصيد `total`/`paid`؛ `remaining` محسوب تلقائياً. تسوية الفاتورة من شاشة صندوق القسم تُحدّث `paid` وتُنشئ حركة قبض مناظرة.

---

## 7. التقارير — Reports

### 7.1 محرّك الطباعة الموحّد

كل الطباعة تمرّ عبر `printHtml` / `savePdfHtml` باستخدام مستند iframe مستقل. متغيّرات إعدادات الطباعة العامة (`gPrintSettings` إلخ) تبقى في `App.tsx` كـ `let` لأنها تُعاد كتابتها.

> ⚠️ ملاحظة تدقيق: أزرار «طباعة» في بعض شاشات الأقسام كثيراً ما تكون غير موصولة أو تفتقد التقاط بيانات الإدخال — يجب فحص `onClick` وثبات الحالة، لا CSS فقط.

### 7.2 شاشات ومسارات التقارير المالية

- **`FinancialSummaryScreen`** (`fin-summary`) — ملخّص شامل: إيراد/مصروف/ربح لكل قسم، محسوب ديناميكياً من الحركات المفلترة.
- **`FinChartsScreen`** (`fin-charts`) — رسوم بيانية: الإيراد حسب القسم، الاتجاه الشهري، فئات المصروفات (تُحسب ديناميكياً داخل الشاشة من `filteredTxs`).
- **`ReportsScreen`** (`fin-statements`) — الكشوفات والتقارير.
- **التصدير:** Excel عبر `XLSX` (SheetJS) وHTML/PDF عبر محرّك الطباعة في معظم الشاشات المالية (الرواتب، الديون الخارجية، ...).

### 7.3 التوقيت الزمني في التقارير

`getWeekStart` / `getMonthStart` وحلقة الـ 7 أيام في لوحة القيادة تستخدم `_jlmNow()` + دوال UTC (توقيت القدس)، وليس دوال `Date` المحلية. `tx_date` من عمود `DATE` يصل كسلسلة ISO `"YYYY-MM-DDT00:00:00.000Z"` ويُقتطع بـ `slice(0,10)`.

---

## 8. حسابات الموظفين — Employee Accounts

### 8.1 شاشات الموظف المالية

| الشاشة | المسار | الوظيفة |
|--------|--------|---------|
| `MyFinancialAccountScreen` | حساب الموظف الشخصي | يعرض راتبه، سلفه، دوامه، ويقدّم طلب سلفة |
| `StaffAdvanceRequestScreen` | طلب سلفة | تقديم طلب سلفة للاعتماد (`staff_advance_requests`) |
| `EmployeeAdvancesScreen` | سلف الموظفين (مشرف) | تسجيل/اعتماد/رفض السلف، الخصم من الصندوق عبر `doWithdraw` |
| `StaffManagementScreen` | إدارة الموظفين (مشرف) | بيانات الموظف، إعداد الراتب، الصلاحيات |

### 8.2 دورة السلفة

1. الموظف يقدّم طلباً (`staff_advance_requests`, status=`pending`).
2. المشرف يعتمد ← يُنشأ سجل `employee_advances` (`repaid=false`) وقد يُخصم من الصندوق.
3. عند احتساب الراتب تُطرح السلف غير المسدّدة من الصافي.

> ⚠️ قابلية الوصول: `StaffPortal` له مبدّل عرض خاص؛ الشاشات الموجودة فقط في `renderScreen` الخاص بالمشرف (المالية/إدارة الموظفين/الإعدادات) **غير قابلة للوصول** من واجهة الموظف.

### 8.3 فصل البيانات المالية في ملف المريض

`PatientFileScreen` يقيّد أرقام الفاتورة/المدفوع/الدين لكل قسم عبر `canSeeFinance()`؛ بينما يبقى التاريخ الطبي (التشخيصات/الأدوية/الإحالات) موحّداً.

---

## 9. منطق المحاسبة والمعادلات — Accounting Logic & Formulas

### 9.1 المحرّك المالي في الواجهة (`financialEngine.ts` → `calculateFinancials`)

- يصنّف كل `drawer_transactions` حسب سلاسل التصنيف العربية (ثوابت الفئات).
- يستثني حركات `رصيد افتتاحي`.
- يجمّع الدخل (`type=in`) والمصروفات (`type=out`).

### 9.2 صافي الربح (`src/utils/finance.ts` → `calcNetProfit`)

```
netProfit = revenue − costPrice − expenses − salaries
```

### 9.3 الملخّص في الخلفية (`/finance/summary`)

```
income   = Σ amount حيث type='in'  AND category ≠ 'رصيد افتتاحي'
expenses = Σ amount حيث type='out'
netProfit = income − expenses
totalDebts = Σ amount من جدول debts
```

### 9.4 معادلة الراتب

```
net = max(0, salary + commission − expenses − pendingAdvances)
```
(التفاصيل في القسم 5.)

### 9.5 ترقيم السندات

```
سند قبض:  RV-YYYY-NNNN
سند صرف:  PV-YYYY-NNNN
```

### 9.6 الرصيد بعد الحركة

كل حركة تخزّن `balance_after` (لقطة الرصيد بعدها) لأغراض التدقيق والتتبّع.

---

## 10. الصلاحيات — Permissions

### 10.1 نظام موحّد واحد

بعد إزالة نظام صلاحيات ثانٍ سابق، يوجد **نظام واحد فقط**: `DEPT_PERM_TREE` / `DeptPermissions` (واجهة) ← `staff_dept_permissions` (~50 عموداً boolean، قاعدة البيانات).

> ⚠️ **قيد مهم على مسار الكتابة (write allowlist):** رغم أن جدول `staff_dept_permissions` يضمّ ~50 عموداً دقيقاً (`can_drawer_*`, `can_vouchers`, ...)، فإن مسارات كتابة الصلاحيات في الخلفية (`routes/staff.js`، POST/PUT `/:staff_id/permissions`) تمرّر القيم عبر قائمة سماح `PERM_COLS_ALLOWED` تحوي **8 أعمدة عامّة فقط**: `can_view, can_edit, can_delete, can_create, can_approve, can_view_financials, can_manage_staff, can_manage_settings`. أي عمود دقيق خارج هذه القائمة **يُهمَل بصمت عند الكتابة عبر الخادم** (لن يُخزَّن). هذا فرق جوهري بين ما يُعرَض في شجرة الواجهة وما يثبت فعلياً في القاعدة عبر الـ API.

### 10.2 الأعلام المالية البارزة

| العمود | العملية المحكومة |
|--------|-------------------|
| `can_drawer_view` / `can_drawer_view_balance` | رؤية الصندوق/الرصيد |
| `can_drawer_deposit` / `can_drawer_withdraw` | الإيداع/السحب |
| `can_drawer_adjust_balance` | تعديل الرصيد يدوياً |
| `can_drawer_view_history` / `_stats` / `_charts` | السجل/الإحصاء/الرسوم |
| `can_drawer_view_invoices` / `can_drawer_settle_invoices` | الفواتير وتسويتها |
| `can_drawer_financials` | الوصول المالي للصندوق |
| `can_vouchers` | السندات وحساباتها |
| `can_staff_advance` / `can_staff_advance_submit` | سلف الموظفين/تقديم طلب |
| `can_purchase_reqs` | طلبات الشراء |

### 10.3 مبادئ انضباط شجرة الصلاحيات

- **إضافة صلاحية فقط عند وجود عملية UI فعلية مقابلة** — تُسقط الصلاحيات بلا ميزة بدل بناء UI لتبريرها.
- عند مزامنة أعمدة `staff_dept_permissions` مع الواجهة: قارن قائمة الأعمدة (psql `\d`) مع نوع `DeptPermissions`، ووصّل فقط الأعمدة ذات ميزة حجب حقيقية، وتجاوز الأعمدة اليتيمة (مثل `can_edit_voucher`).
- عناصر القوائم `adminOnly:true` (الديون/الإيراد/الربح/المصروفات لكل قسم) محجوبة عن الموظف على مستوى الشريط الجانبي.

### 10.4 الحدود الأمنية الحالية (كما في `threat_model.md`)

كل الصلاحيات المالية الحساسة (`fin-*`, DELETE للسندات) تعتمد جزئياً على `requireAdmin` (رمز Bearer، ذاكرة 8 ساعات) في الخلفية، لكن **معظم قراءات GET مفتوحة** وبعض مسارات DELETE للسندات **غير محمية** (انظر القسم 4 و13).

---

## 11. شاشات الواجهة الأمامية — Frontend Screens

### 11.1 مجموعة «النظام المالي العام» (الشريط الجانبي `financial`)

| العنصر | المسار (`screen`) | المكوّن |
|--------|-------------------|---------|
| الربح | `fin-profit` | `FinProfitScreen` |
| الديون | `fin-debts` | `DebtManagementScreen` |
| الإيرادات / الدخل | `fin-revenue` | `FinRevenueScreen` |
| المصروفات | `fin-expenses` | `FinExpensesScreen` |
| طلبات الشراء | `fin-purchase-reqs` | `FinAllPurchaseReqsScreen` |
| الرواتب | `fin-payroll` | `PayrollScreen` |
| سلف الموظفين | `fin-advances` | `EmployeeAdvancesScreen` |
| ديون وسلف خارجية | `fin-external-debts` | `ExternalDebtsScreen` |
| الرسوم البيانية المالية | `fin-charts` | `FinChartsScreen` |
| الملخص المالي | `fin-summary` | `FinancialSummaryScreen` |
| الكشوفات والتقارير | `fin-statements` | `ReportsScreen` |

### 11.2 الشاشات المالية على مستوى القسم (لكل قسم)

| العنصر | المسار | المكوّن | ملاحظة |
|--------|--------|---------|--------|
| السندات وحساباتها | `dept-vouchers` | `DeptVouchersScreen` | متاح للموظف حسب الصلاحية |
| الربح | `dept-profit` | `FinProfitScreen` (بمعامل dept) | `adminOnly` |
| الديون | `dept-debts` | `DebtManagementScreen` | `adminOnly` |
| الإيرادات / الدخل | `dept-revenue` | `FinRevenueScreen` | `adminOnly` |
| المصروفات | `dept-expenses` | `FinExpensesScreen` | `adminOnly` |
| الصندوق | `dept-drawer` | `DeptDrawerScreen` | الحركات + تسوية الفواتير |

### 11.3 شاشات مالية أخرى

- `DataDeletionScreen` — حذف بيانات مالية/تشغيلية (يستخدم `/admin/tables` و`/admin/execute-delete`).
- `BackupScreen` — النسخ والاستعادة.
- `MyFinancialAccountScreen` / `StaffAdvanceRequestScreen` — حسابات الموظف.
- `AttendanceScreen` — الدوام (يغذّي الأجر اليومي).

### 11.4 نمط بناء الشاشات المالية

- كل الشاشات دوال React ضمن الملف الأحادي `App.tsx` (~15,000 سطر) — بنية المكوّن الأحادي مقصودة (تفضيل المستخدم).
- الحسابات المشتقة (الإيراد حسب القسم، الاتجاه الشهري) تُحسب داخل الشاشة من الحركات المفلترة — **لا مصفوفات ثابتة على مستوى الوحدة** (كان ذلك خطأً سابقاً وأُصلح).

---

## 12. خرائط الاعتمادية — Dependency Maps

### 12.1 تدفّق الحركة المالية الواحدة (End-to-End)

```
شاشة (مثل NewPatientScreen / DeptVouchersScreen)
   │  استدعاء doDeposit / doWithdraw  (في App الجذر)
   ▼
setDrawers(...)  ← تحديث حالة React فوري (تفاؤلي)
   │
   ├─► api.drawers.transactions.create({...balance_after})
   │        └─► POST /api/drawer-transactions ─► INSERT drawer_transactions
   │
   └─► api.drawers.updateBalance(dept, newBal)
            └─► PUT /api/drawers/:dept/balance ─► UPDATE drawers.balance
   ▼
setInterval كل 1s ─► _doLoad() ─► GET /api/... ─► إعادة مزامنة الحالة من PostgreSQL
```

### 12.2 اعتمادية الرواتب

```
staff_members (salary_type, percentage_value, percentageDepts, payFromDepts)
      +  sessions (doctor, dept, paid, date)      ← مصدر الإيراد الفردي
      +  employee_advances (repaid=false)         ← الخصم
      ▼
PayrollScreen.calcNet / getCommission / getPaySplit
      ▼
doWithdraw("راتب موظف") ─► drawer_transactions (out) + drawers.balance
      ▼
employees.status = paid, paid_date, commission, net_salary
```

### 12.3 اعتمادية الملخّص المالي

```
drawer_transactions (كل الأقسام)
   ├─► [واجهة] financialEngine.calculateFinancials ─► FinancialSummaryScreen / FinChartsScreen
   └─► [خلفية] GET /finance/summary (requireAdmin) ─► income/expenses/netProfit
debts ─► totalDebts
invoices ─► المستحقات على شركات التأمين
```

### 12.4 اعتمادية الحذف المجمّع

```
DataDeletionScreen
   ├─► GET /admin/tables (عدّ الصفوف)
   ├─► DELETE /admin/tables/:table  (قائمة سماح مقابل schema.sql)
   └─► POST /admin/execute-delete (patients | financials | all)
        └─► ترتيب FK: مسح debts + patient_delete_requests قبل patients (PRE_DELETE_STEPS)
```

### 12.5 جدول الاعتمادية بين الكيانات

| الكيان | يعتمد على | يؤثّر في |
|--------|-----------|----------|
| الجلسة `sessions` | المريض | الإيراد، الدين، عمولة الراتب |
| الدين `debts` | الجلسة/المريض | إجمالي الديون، تسويته تُودع بالصندوق |
| الراتب | staff_members + sessions + advances | حركة صندوق `out` |
| السند | القسم + طرف (تأمين/مورد/موظف/مريض) | حركة صندوق (in/out) |
| الفاتورة | شركة التأمين + القسم | المستحقات، تسويتها تُودع |
| السلفة | الموظف | خصم الراتب، حركة صندوق |

---

## 13. المخاطر — Risks (No Solutions)

> هذا القسم يصف المخاطر **دون اقتراح حلول**، وفق نطاق التدقيق.

### 13.1 مخاطر أمنية / التفويض

1. **مسارات DELETE للسندات غير محمية:** حذف `receipt_vouchers` و`payment_vouchers` في `routes/finance.js` **لا يمرّ عبر `requireAdmin`**؛ ما يعني إمكانية حذف سند (وأثره على التتبّع المحاسبي) دون صلاحية مشرف على مستوى الخادم.
2. **معظم قراءات GET المالية مفتوحة:** جلب الفواتير/الديون/الحركات/الصناديق لا يتطلّب تفويضاً على الخادم؛ أي طرف يصل للـ API يقرأ بيانات مالية حسّاسة.
3. **التفويض معتمد على العميل جزئياً:** التمييز بين المشرف/الموظف والحجب (`adminOnly`, `DeptPermissions`) يُفرض غالباً في الواجهة (React state)؛ متجاوز الواجهة قد ينفّذ عمليات لا يفرض الخادم كلها.
4. **رموز المشرف في الذاكرة (8 ساعات):** خريطة الرموز في `middleware/adminAuth.js` بالذاكرة؛ تُفقد عند إعادة التشغيل، ولا تُلغى مركزياً، وتتوسّع بلا حد نظري.
5. **الحدود المذكورة في `threat_model.md`:** كل منطق الأعمال المالي في متناول المتصفّح؛ لا فصل مفروض على الخادم بين السطوح العامة/المصادَق عليها/الإدارية.
5.1 **إهمال صامت لأعمدة الصلاحيات:** قائمة السماح `PERM_COLS_ALLOWED` (8 أعمدة) تُهمِل بصمت أي عمود صلاحية دقيق (`can_drawer_*`, `can_vouchers`, ...) يُرسَل للكتابة عبر الخادم؛ فقد لا تُحفظ صلاحية مالية دقيقة ضبطها المشرف في الواجهة، ما يخلق فجوة بين الصلاحية المعروضة والصلاحية المثبَّتة فعلياً.

### 13.2 مخاطر تكامل البيانات المحاسبية

6. **المزامنة التفاؤلية بلا تراجع (rollback):** `doDeposit`/`doWithdraw` تحدّث حالة React ثم تطلق نداء API **دون `await` ولا معالجة فشل**؛ فشل الشبكة يترك الواجهة والقاعدة غير متطابقتين حتى دورة التحميل التالية.
7. **الرصيد يُحسب في العميل:** `balance_after` يُحسب في الواجهة (`currentBal ± amount`) ويُرسل للخادم؛ حركتان متزامنتان قد تكتبان `balance_after` متعارضاً (سباق).
8. **ازدواج/تعدّد جداول الديون:** وجود `debts` و`patient_debts` معاً قد يسبب لبساً؛ المسار الحيّ يستخدم `debts` بينما `patient_debts` قائم في المخطط.
9. **حذف السند لا يعكس الحركة النقدية:** لا يوجد ما يضمن أن حذف سند يعكس أثر حركة الصندوق التي أنشأها (لا حركة مقابلة موصوفة).
10. **`employees` مقابل `staff_members`:** الراتب موزّع على جدولين (حالة الصرف في `employees`، إعداد الراتب في `staff_members`)؛ عدم التطابق بينهما (بالاسم) قد يُسقط العمولة إن اختلف الاسم.
11. **ثبات التشخيصات/الأدوية:** جدول `sessions` بلا أعمدة تشخيص/أدوية — تُخزّن في جداول فرعية؛ إغفال ذلك يفقد البيانات عند إعادة التحميل (خطر تشغيلي مرتبط بالإيراد/الفوترة).

### 13.3 مخاطر تشغيلية / بنيوية

12. **ملف أحادي ضخم:** `App.tsx` (~15,000 سطر) يحوي كل الشاشات المالية؛ خطر انحدار عالٍ عند أي تعديل، وصعوبة العزل والاختبار.
13. **تحميل دوري كل ثانية:** `setInterval` كل 1s يجلب البيانات؛ حِمل شبكة/خادم مستمر ويضخّم أثر أي بطء في الاستعلام.
14. **أزرار طباعة غير موصولة:** بعض أزرار «طباعة» بالأقسام غير موصولة أو تفتقد التقاط البيانات؛ خطر تقارير ناقصة/فارغة.
15. **النسخ الاحتياطي بلغة JS خالصة:** غياب `pg_dump`/`psql` على الاستضافة المشتركة يفرض تفريغاً يدوياً بترتيب جُمَل صارم؛ خطأ في الترتيب يكسر الاستعادة، والاستعادة على قاعدة حيّة خطرة.
16. **عمود `remaining` محسوب (GENERATED):** أي كود يحاول الكتابة إليه سيفشل؛ خطر عند أي مسار إدراج/تحديث فاتورة يشمل `remaining`.
17. **حساسية ترتيب المسارات:** `/staff/advance-requests` يجب أن يُسجّل قبل `/:id`؛ إعادة ترتيب المسارات قد يكسر النقطة بصمت (تُلتقط كوسيط integer).
18. **بيئة الإنتاج خارجية:** الإنتاج على cPanel/Hostinger بقاعدة منفصلة؛ تغييرات المخطط في التطوير لا تنعكس تلقائياً على الإنتاج (خطر «العمود غير موجود» في الإنتاج).

---

## 14. نقاط التوسّع الآمنة — Safe Extension Points

> يصف هذا القسم **أين** يمكن التوسّع بأقل خطر انحدار، دون فرض تنفيذ.

1. **طبقة الـ API الموحّدة (`src/app/api.ts`):** نقطة مركزية لإضافة نقاط نهاية مالية جديدة أو تغليف منطق مشترك (مثل توحيد معالجة الأخطاء) دون لمس الشاشات.
2. **مسارات Express المعزولة (`routes/*.js`):** كل مجال مالي في ملف مستقل؛ إضافة مسار جديد (مثلاً تقرير مجمّع) داخل `routes/finance.js` معزولة ولا تمسّ غيرها.
3. **محرّك الملخّص (`/finance/summary` + `financialEngine.ts`):** يعكسان بعضهما؛ أي مقياس محاسبي جديد يُضاف في كليهما بتناسق (نقطة توسّع محدّدة المعالم).
4. **شجرة الصلاحيات (`DEPT_PERM_TREE` + `staff_dept_permissions`):** إضافة عمود boolean + عنصر شجرة مقابل لعملية UI **موجودة فعلاً** توسّع آمن (بشرط انضباط النطاق في القسم 10.3).
5. **جداول السندات (`receipt_vouchers` / `payment_vouchers`):** بنية مرقّمة (RV/PV) قابلة للتوسّع بأنواع أطراف جديدة عبر حقول `*_type`/`*_id`/`*_name` القائمة.
6. **نقاط الحذف الإداري المعمّمة (`/admin/tables`):** مبنية على قائمة سماح مقابل `schema.sql`؛ إضافة جدول مالي جديد للمخطط يجعله متاحاً تلقائياً للعدّ/الحذف.
7. **إعدادات الطباعة العامة (`gPrintSettings`) + `printHtml`:** واجهة طباعة موحّدة؛ إضافة قالب تقرير جديد يمرّ عبرها دون بناء آلية طباعة موازية.
8. **حقول إعداد الراتب في `staff_members`:** حقول `salary_type`/`percentage_*`/`shift_*` تدعم أنواع راتب إضافية عبر توسيع منطق `PayrollScreen.calcNet`/`getPaySplit` في موضع واحد.
9. **مصفوفة الأقسام (`DEPARTMENTS` + custom depts):** الشاشات المالية على مستوى القسم مُعمَّمة بمعامل `dept`؛ إضافة قسم جديد تُفعّل شاشاته المالية تلقائياً.
10. **النسخ الاحتياطي (`services/backupService.js`):** خدمة معزولة بلغة JS خالصة؛ توسيع نطاق التفريغ يتم في موضع واحد دون لمس مسارات الأعمال.

---

## ملخّص ختامي — Closing Summary

### قائمة الجداول المالية (18)

`drawers`, `drawer_transactions`, `debts`, `patient_debts`, `external_debts`, `invoices`, `employees`, `staff_members`, `employee_advances`, `staff_advance_requests`, `attendance_records`, `receipt_vouchers`, `payment_vouchers`, `purchase_requests`, `purchase_request_items`, `suppliers`, `insurance_companies`, `staff_dept_permissions`.

### قائمة ملفات الخلفية المالية

`routes/finance.js`, `routes/drawers.js`, `routes/staff.js`, `routes/sessions.js`, `routes/settings.js`, `routes/admin.js`, `routes/backup.js`, `services/backupService.js`, `middleware/adminAuth.js`, `db.js`, `server.js`.

### قائمة الشاشات المالية (الواجهة)

`FinProfitScreen`, `FinExpensesScreen`, `FinChartsScreen`, `FinancialSummaryScreen`, `FinRevenueScreen`, `DebtManagementScreen`, `EmployeeAdvancesScreen`, `ExternalDebtsScreen`, `PayrollScreen`, `FinAllPurchaseReqsScreen`, `DataDeletionScreen`, `BackupScreen`, `ReportsScreen`, `StaffManagementScreen`, `MyFinancialAccountScreen`, `StaffAdvanceRequestScreen`, `DeptVouchersScreen`, `DeptDrawerScreen`.

### المعادلات المحاسبية الأساسية

| المقياس | المعادلة |
|---------|----------|
| صافي الربح (utils) | `revenue − costPrice − expenses − salaries` |
| الربح (summary) | `income − expenses` (باستثناء `رصيد افتتاحي`) |
| صافي الراتب | `max(0, salary + commission − expenses − pendingAdvances)` |
| العمولة | `round(rangeRevenue × percentage_value / 100)` |
| المتبقي من الفاتورة | `total − paid` (GENERATED ALWAYS) |
| تقسيم الصرف | `amount_i = round(net × revenue_i / Σ revenue)` |

### أبرز المخاطر (ترتيب أولوية)

1. مسارات DELETE للسندات غير محمية بـ `requireAdmin`.
2. معظم قراءات GET المالية مفتوحة على الخادم.
3. التفويض معتمد جزئياً على العميل.
4. المزامنة التفاؤلية بلا تراجع عند فشل الشبكة.
5. الرصيد يُحسب في العميل (خطر سباق).

---

## مخطط النظام — System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      الواجهة الأمامية (React + Vite)                          │
│                                                                            │
│   App (الجذر) — الحالة المركزية                                              │
│   drawers · debts · invoices · employees · employeeAdvances ·              │
│   externalDebts · staffAdvanceRequests · purchaseRequests                  │
│        │                                                                   │
│        ├── doDeposit / doWithdraw / doAdjustBalance  (تدفّق نقدي)            │
│        │                                                                   │
│   ┌────┴───────────────── الشاشات المالية ─────────────────────────┐        │
│   │ النظام العام: fin-profit/debts/revenue/expenses/payroll/       │        │
│   │   advances/external-debts/charts/summary/statements/purchase   │        │
│   │ مستوى القسم: dept-vouchers/drawer/profit/debts/revenue/expenses│        │
│   │ الموظف: MyFinancialAccount · StaffAdvanceRequest               │        │
│   └───────────────────────────────────────────────────────────────┘        │
│        │                                                                   │
│   financialEngine.ts (calculateFinancials) · utils/finance.ts             │
│        │                                                                   │
│   src/app/api.ts  (طبقة API موحّدة)                                          │
└────────┼───────────────────────────────────────────────────────────────────┘
         │  HTTP  (BASE/api/...)   ▲  تحميل دوري كل 1s (_doLoad)
         ▼                         │
┌──────────────────────────────────────────────────────────────────────────┐
│                       الخلفية (Express + PostgreSQL)                         │
│                                                                            │
│  server.js ─► routes/                                                       │
│     finance.js  (invoices · debts · external-debts · receipt/payment       │
│                  vouchers · /summary [requireAdmin] · /reset-all 410)      │
│     drawers.js  (drawers · drawer-transactions · balance)                  │
│     staff.js    (employees · members · advances · advance-requests · دوام) │
│     sessions.js (الجلسات — مصدر الإيراد، لا حركة صندوق آلية)                 │
│     settings.js · admin.js (execute-delete · tables) · backup.js          │
│                                                                            │
│  middleware/adminAuth.js  (requireAdmin — Bearer، ذاكرة 8h)                │
│  db.js  (pg Pool — SSL واعٍ للبيئة)                                          │
│        │                                                                   │
│        ▼                                                                   │
│  PostgreSQL — 18 جدولاً مالياً (drawers, drawer_transactions, debts,        │
│  invoices, employees, staff_members, *_vouchers, *_advances, ...)          │
│  التوقيت: Asia/Jerusalem (UTC+3)                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

*انتهى التقرير — وثيقة توثيقية للقراءة فقط، دون أي تعديل على الكود.*
