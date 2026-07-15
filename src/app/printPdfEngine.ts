// ─── محرك الطباعة/PDF الدائم (Canvas-based) ────────────────────────────────
// لماذا هذا الملف موجود:
// الطريقة القديمة لتطبيق الترويسة والهوامش كانت تعتمد بالكامل على خدع CSS
// أثناء طباعة المتصفح (@page margin + position:fixed لصورة الترويسة). هذه
// طريقة معروفة بأنها غير متّسقة بين المتصفحات (Chrome/Firefox/Safari تختلف
// في كيفية التعامل مع position:fixed داخل media الطباعة)، وهذا هو السبب
// الجذري لتقطّع تطبيق الترويسة/الهوامش أحياناً حتى مع إعدادات صحيحة محفوظة.
//
// الحل الدائم هنا: بدل الاعتماد على محرك طباعة المتصفح إطلاقاً، نُصيّر
// (render) محتوى الطباعة إلى صورة (canvas) بحجم دقيق بالمليمتر، نقصّها إلى
// صفحات (مع تجنّب قصّ منتصف صف/بطاقة)، ثم نبني ملف PDF فعلي عبر jsPDF حيث
// نرسم صورة الترويسة كخلفية كاملة لكل صفحة أولاً، ثم نلصق شريحة المحتوى
// داخل صندوق الهامش المحسوب يدوياً بالضبط. الناتج ملف PDF حقيقي يُفتح في
// تبويب جديد، فيتولى عارض PDF بالمتصفح أمر الطباعة/الحفظ — لا مجال لأي
// اختلاف بين المتصفحات بعد الآن لأن التخطيط والهوامش بايتات ثابتة داخل
// الملف، وليست معتمدة على محرّك طباعة كل متصفح.
//
// ملاحظة تزامن: الأصناف (classnames) بأسفل (table/th/td/.kpi/.pt-card/...)
// يجب أن تبقى مطابقة تماماً لنفس الأصناف المستخدمة داخل `_buildPrintDoc` في
// App.tsx، لأن نفس شذرات الـ HTML (bodyHtml) تُستخدم من الاثنين معاً (هذا
// الملف هو المسار الأساسي الآن، و `_buildPrintDoc` أصبح مساراً احتياطياً
// (fallback) يُستخدم تلقائياً فقط إذا فشل هذا المحرك لأي سبب).

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface PrintPageSettings {
  paperSize: string;
  orientation: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  letterheadImage?: string | null;
  fontFamily: string;
  fontSize: number;
}

export interface PrintDocParams {
  title: string;
  bodyHtml: string;
  settings: PrintPageSettings;
}

const PAPER_SIZES_MM: Record<string, [number, number]> = {
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  LETTER: [215.9, 279.4],
  LEGAL: [215.9, 355.6],
};

// 96 CSS px per inch (المعيار القياسي للمتصفحات) → مليمتر لكل بكسل
const MM_PER_PX = 25.4 / 96;
const mm2px = (mm: number) => Math.round(mm / MM_PER_PX);

function resolvePageSizeMm(paperSize: string, orientation: string): [number, number] {
  const key = (paperSize || "A4").toUpperCase();
  let [w, h] = PAPER_SIZES_MM[key] || PAPER_SIZES_MM.A4;
  if ((orientation || "portrait").toLowerCase() === "landscape") { const t = w; w = h; h = t; }
  return [w, h];
}

// نفس أصناف الـ CSS المستخدمة بمحرك الطباعة القديم (`_buildPrintDoc` داخل
// App.tsx) — أُبقيت مطابقة عمداً حتى تظهر كل شاشات النظام بنفس الشكل تماماً
// سواء طُبعت عبر هذا المحرك أو عبر المسار الاحتياطي القديم.
// ── توحيد كل أحجام الخط بالتقرير على إعداد fontSize واحد ────────────────────
// المشكلة: كل صنف (class) هون كان له حجم خط ثابت بالبكسل (17px، 11px، 10px،
// 9px...) مكتوب يدوياً بمعزل تام عن إعداد "حجم الخط" — فمهما غيّر المستخدم
// القيمة، ولا حتى بعد تصحيح الجدول سابقاً لياخد ${"fontSize-2"} بدل رقم ثابت،
// كان الفارق نفسه (٢px) يبقى ثابتاً بمعزل عن الإعداد الفعلي، فبحجم خط صغير
// جداً (مثلاً 8px) يصير الفارق نسبة كبيرة من الحجم الكلي فيظهر الجدول أكبر
// ملحوظ من النص المحيط. الحل الدائم: كل الأحجام الآن نسبية (em) لعنصر
// .ppdf-root الحامل لإعداد fontSize مباشرة، فتتحرك كل نصوص التقرير معاً
// بنفس النسبة أياً كانت قيمة الإعداد — ونص الجدول تحديداً صار 1em بالضبط
// (يعني مطابق لحجم النص العادي خارج الجدول) بدل أي فارق ثابت.
const REM = (ratio: number) => `${ratio}em`;
export const PRINT_CONTENT_CSS = (fontFamily: string, fontSize: number) => `
*{box-sizing:border-box}
.ppdf-root{font-family:${fontFamily},Arial,sans-serif;direction:rtl;color:#1A1A1A;font-size:${fontSize}px;margin:0;padding:0;background:#fff}
.ch{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;margin-bottom:0;border-bottom:2px solid #1B3A6B}
.ct{font-size:${REM(1.3)};color:#1B3A6B;display:block;font-weight:700;margin-bottom:3px}.cs{font-size:${REM(0.85)};color:#555}.cm{font-size:${REM(0.77)};color:#888;text-align:left;white-space:nowrap;line-height:1.6}
.rm{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:14px;border-bottom:1px solid #E8EDF5;background:#F5F8FF;padding:6px 10px;border-radius:0 0 6px 6px}
.rm-item{font-size:${REM(0.85)};color:#444;display:inline-flex;align-items:center;gap:4px}
.rm-item strong{color:#1B3A6B}
h2{font-size:${REM(1)};color:#1B3A6B;margin:14px 0 6px;font-weight:700;border-bottom:1px solid #E0E0E0;padding-bottom:4px}
/* ── جدول موحّد لكل شاشات الطباعة — لا يوجد نمط منفصل لأي تقرير على حدة.
      عرض الأعمدة النهائي (table-layout:fixed + colgroup) يُحسَب ديناميكياً
      بدالة normalizeTableColumns() قبل التصوير مباشرة (انظر أسفل)، بناءً على
      المحتوى الفعلي لكل عمود بالرأس والجسم معاً — بهيك يبقى الرأس مطابقاً
      تماماً لأعمدة الجسم دائماً، وبنفس الوقت الأعمدة تاخد عرضها الحقيقي حسب
      محتواها بدل التساوي القسري. ── */
/* نص الجدول الآن 1em بالضبط — أي مطابق تماماً لحجم النص العادي خارج الجدول،
   ويتحرك مع إعداد fontSize بنفس النسبة (انظر تعليق REM أعلاه). */
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:${REM(1)};line-height:1.5}
th,td{border:1px solid #ddd;padding:8px 10px;vertical-align:middle;text-align:right;word-wrap:break-word;overflow-wrap:break-word;white-space:normal}
/* ── عناوين الأعمدة (th) ما لازم تنكسر إطلاقاً — لا بمنتصف الكلمة ولا حتى
      بين كلمتين — بغض النظر عن عرض العمود، لأن انكسار كلمة عربية واحدة
      بمنتصفها بصير شكله مقلوب/غير مفهوم بصفوف RTL (مثال: "الطبيب" تطلع
      "لطبي" بسطر و"ب" لحاله بسطر تاني). الحل الدائم: نمنع الالتفاف كلياً على
      عناوين الأعمدة عبر white-space:nowrap، ونضمن حصول كل عمود على عرض كافٍ
      فعلياً لعنوانه عبر تصحيح دالة القياس بالأسفل (انظر normalizeTableColumns
      وتعليق whiteSpace فيها). محتوى الجسم (td) يبقى قادراً على الالتفاف
      كالمعتاد لأنه غالباً نص طويل (تشخيص، ملاحظات) وده مقبول بصرياً. ── */
th{background:#1B3A6B;color:white;font-weight:700;white-space:nowrap}
tr:nth-child(even)>td{background:#F9FAFB}
tfoot td{background:#EBF3FB;font-weight:700;border-top:2px solid #1B3A6B}
.in{color:#388E3C;font-weight:700}.out{color:#D32F2F;font-weight:700}
.kpi{display:flex;gap:22px;margin-bottom:16px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid #E0E0E0}
.kpi-box{text-align:right;padding:0}
.kpi-l{font-size:${REM(0.77)};color:#777;margin-bottom:2px}.kpi-v{font-size:${REM(1)};font-weight:700;color:#1B3A6B}
.pt-card{border:1px solid #D0D9E8;border-radius:10px;padding:16px;margin-bottom:18px;background:#fff}
.pt-name{font-size:${REM(1.23)};font-weight:700;color:#1B3A6B;margin-bottom:6px}
.pt-info{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:10px}
.pt-field{font-size:${REM(0.85)};color:#555}.pt-field b{color:#1A1A1A}
.tests-title{font-size:${REM(0.92)};font-weight:700;color:#1B3A6B;margin:10px 0 4px;padding-bottom:3px;border-bottom:1px solid #E0E0E0}
.tests-list{margin:0;padding:0 18px;font-size:${REM(0.92)};line-height:1.9}
.sig-area{display:flex;justify-content:space-between;margin-top:22px;padding-top:10px;border-top:1px dashed #CCC}
.sig-box{text-align:center;font-size:${REM(0.77)};color:#888}.sig-line{border-top:1px solid #888;width:120px;margin:28px auto 4px}
.footer{margin-top:20px;font-size:${REM(0.69)};color:#aaa;text-align:center;padding-top:8px;border-top:1px solid #eee}
`;

// ── تحويل صورة الترويسة (أياً كانت صيغتها الأصلية: PNG/JPEG/WEBP، وسواء
//    data:URL أو رابط خارجي) إلى JPEG عبر canvas قبل تمريرها لـ jsPDF.
//    السبب: محرك فك ترميز PNG المدمج داخل jsPDF نفسه يفشل بصمت (silent
//    throw يُبتلع بمحاولة try/catch) مع بعض أنواع ملفات PNG (كالمفهرسة
//    palette-based أو المتشابكة interlaced)، وهذا هو التفسير الأرجح لاختفاء
//    الترويسة بالكامل رغم ضبطها بشكل صحيح بالإعدادات. بينما فك الترميز عبر
//    عنصر <img> الحقيقي بالمتصفح موثوق دائماً (نفس الآلية المستخدمة أصلاً
//    لتصيير شرائح المحتوى التي تعمل بنجاح)، فتحويل الترويسة لنفس المسار
//    (canvas → JPEG dataURL) يضمن قبولها من jsPDF بلا استثناء ──
function loadImageAsJpegDataUrl(url: string): Promise<string | null> {
  return new Promise(resolve => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    if (!url.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { resolve(null); return; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        // خلفية بيضاء أولاً حتى لا تتحول أي شفافية بصورة PNG إلى أسود عند
        // تصديرها كـ JPEG (JPEG لا يدعم قناة alpha إطلاقاً)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      } catch (err) {
        console.warn("تعذّر تحويل صورة الترويسة عبر canvas:", err);
        resolve(null);
      }
    };
    img.onerror = () => { console.warn("تعذّر تحميل صورة الترويسة (onerror) — لن تظهر بهذه الطباعة"); resolve(null); };
    img.src = url;
  });
}

// ── توحيد عرض أعمدة الجداول بين الرأس والجسم وصف الإجمالي قبل تصويرها ───────
// المشكلة الجذرية الأصلية (٣ أسباب مجتمعة): (١) html2canvas لا يُصيّر
// colgroup/col بدقة موثوقة مع border-collapse+colspan، (٢) خطأ حسابي بالنسب
// المئوية كان يرفع الأعمدة الضيقة لحد أدنى ٦٪ بدون توزيع الفرق فيتجاوز
// المجموع ١٠٠٪، (٣) عدّاد الأعمدة كان يعتمد على عدد الخلايا الفعلي بدل مجموع
// colSpan. الحل: نحسب عدد الأعمدة من مجموع colSpan، ونُحدِّد عرض كل خلية
// صراحة كبكسل ثابت (بما فيها خلايا colspan) بدل الاعتماد غير المباشر على
// colgroup — هذا الجزء ما زال كما هو ولم يتغيّر.
//
// المشكلة الجديدة (ظهرت بعد ربط حجم خط الجدول بإعداد "حجم الخط"): الخوارزمية
// القديمة كانت تحسب "الحد الأدنى" لكل عمود كنسبة مئوية ثابتة (٦٪) بمعزل عن
// حجم الخط الفعلي، ثم كانت تُعيد توزيع أي عمود يتجاوز نصيبه (مثل عمود
// "التشخيص" الطويل) بـ"سحب" مساحة من كل الأعمدة الأخرى بالتساوي تقريباً —
// بما فيها أعمدة قصيرة المحتوى (مثل اسم الطبيب/القسم) التي ممنوع نصّها من
// الالتفاف (white-space:nowrap على th) أو حتى الالتفاف منتصف كلمة واحدة
// بالجسم. فبحجم خط كبير، عرض هذه الأعمدة المفروض (بعد السحب) يصير أضيق من
// أقصر كلمة فيها فعلياً، فينكسر النص منتصف الكلمة أو يُرسَم فوقه خط العمود
// التالي (يظهر وكأنه "مقصوص"). الحل الدائم: بدل نسبة مئوية ثابتة، نحسب لكل
// عمود قيمتين حقيقيتين بالبكسل عبر canvas 2D measureText (سريع، بلا reflow):
//   • "الحد الأدنى" (min) = عرض أطول *كلمة واحدة* غير قابلة للتقسيم في العمود
//     (رأساً وجسماً) — هذا فعلياً أصغر عرض ممكن للعمود بدون كسر كلمة منتصفها.
//   • "العرض المفضّل" (preferred) = نفس القياس القديم (عرض السطر الكامل بلا التفاف).
// ثم نوزّع عرض الجدول المتاح بحيث لا يقل عمود أبداً عن حده الأدنى: لو
// المساحة المتاحة تكفي كل الأعمدة بعرضها المفضّل، توزَّع الزيادة تناسبياً؛
// ولو تكفي الحد الأدنى فقط، تُعطى كل الأعمدة حدّها الأدنى أولاً ثم يُوزَّع
// الفائض على الأعمدة الأكثر احتياجاً. وفي الحالة النادرة التي حتى مجموع
// الحدود الدنيا (كلمات مفردة) يتجاوز عرض الجدول المتاح (خط كبير جداً + ورق
// ضيق)، نُصغِّر خط هذا الجدول تحديداً (وليس كل التقرير) بأقل نسبة ممكنة حتى
// يتسع، مع حد أدنى معقول (٧px) — تصغير تلقائي وقت الطباعة فقط، وليس رقماً
// ثابتاً مكتوباً باليد؛ يستجيب ديناميكياً لأي حجم خط يختاره المستخدم ولأي
// محتوى.
const _measureCanvas = document.createElement("canvas");
const _measureCtx = _measureCanvas.getContext("2d");
function _cellFont(cell: HTMLElement): string {
  const cs = window.getComputedStyle(cell);
  return `${cs.fontWeight || "400"} ${cs.fontSize} ${cs.fontFamily}`;
}
// أطول "كلمة" غير قابلة للتقسيم داخل الخلية (نقسّم على المسافات وعلى بعض
// علامات الترقيم الشائعة التي يجوز كسر السطر عندها: – · / , مثل "التاريخ –
// النوع" أو "Amoxicillin/Clavulanate")
function _longestTokenWidth(ctx: CanvasRenderingContext2D, text: string): number {
  const tokens = text.trim().split(/[\s/·,]+/).filter(Boolean);
  let max = 0;
  for (const t of tokens) {
    const w = ctx.measureText(t).width;
    if (w > max) max = w;
  }
  return max;
}
function _measureColumnWidths(rows: HTMLTableRowElement[], colCount: number) {
  const minW = new Array(colCount).fill(0);
  const prefW = new Array(colCount).fill(0);
  rows.forEach(row => {
    let colIdx = 0;
    Array.from(row.cells).forEach(cell => {
      const span = cell.colSpan || 1;
      if (span === 1 && colIdx < colCount && _measureCtx) {
        _measureCtx.font = _cellFont(cell as HTMLElement);
        const cs = window.getComputedStyle(cell as HTMLElement);
        const hPad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
          + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0) + 2;
        const text = (cell.textContent || "").trim();
        const tokenW = _longestTokenWidth(_measureCtx, text) + hPad;
        // العرض المفضّل: نفس القياس السابق (السطر الكامل بلا التفاف) عبر
        // scrollWidth بعد إجبار nowrap مؤقتاً — أدق من measureText لأنه يشمل
        // فعلياً أي عناصر HTML متداخلة (مثل <b>) داخل الخلية
        const prevWs = (cell as HTMLElement).style.whiteSpace;
        (cell as HTMLElement).style.whiteSpace = "nowrap";
        const fullW = (cell as HTMLElement).scrollWidth;
        (cell as HTMLElement).style.whiteSpace = prevWs;
        if (tokenW > minW[colIdx]) minW[colIdx] = tokenW;
        if (fullW > prefW[colIdx]) prefW[colIdx] = fullW;
      }
      colIdx += span;
    });
  });
  return { minW, prefW };
}
function normalizeTableColumns(root: HTMLElement) {
  const tables = Array.from(root.querySelectorAll("table"));
  tables.forEach(table => {
    const rows = Array.from(table.rows);
    if (!rows.length) return;
    const colCount = Math.max(...rows.map(r => Array.from(r.cells).reduce((s, c) => s + (c.colSpan || 1), 0)));
    if (colCount < 2) return;

    let { minW, prefW } = _measureColumnWidths(rows, colCount);
    // أعمدة ما انقاست أبداً (نادر — كل الصفوف غطّتها بـ colspan) تاخد نصيباً
    // احتياطياً بدل صفر
    const prefTotal0 = prefW.reduce((a, b) => a + b, 0);
    const fallback = prefTotal0 > 0 ? prefTotal0 / colCount : 20;
    minW = minW.map(w => (w > 0 ? w : fallback * 0.5));
    prefW = prefW.map((w, i) => (w > 0 ? w : Math.max(fallback, minW[i])));

    let tableWidthPx = table.getBoundingClientRect().width || table.scrollWidth;
    if (tableWidthPx <= 0) return;
    let totalMin = minW.reduce((a, b) => a + b, 0);

    // ── حالة نادرة: حتى الحدود الدنيا (أطول كلمة بكل عمود) تتجاوز عرض
    //    الجدول المتاح — نُصغِّر خط *هذا الجدول تحديداً* بأقل نسبة كافية،
    //    ثم نعيد القياس مرة واحدة على الحجم الجديد (كافٍ عملياً؛ التصغير
    //    يقلّل كل الأعراض تناسبياً تقريباً) ──
    if (totalMin > tableWidthPx) {
      const curFontPx = parseFloat(window.getComputedStyle(table).fontSize) || 13;
      // ── لا حد أدنى تعسفي على نسبة التصغير (كان ٥٥٪ سابقاً) — لأنه لو
      //    المحتوى يحتاج تصغيراً أكبر من ٤٥٪ ليتسع (خط كبير جداً + عمود بكلمة
      //    طويلة)، وقف التصغير عند ٥٥٪ كان يترك تجاوزاً أفقياً متبقياً رغم
      //    "تفعيل" التصغير — بالضبط ما يمنعه المستخدم صراحة. نسمح للنسبة
      //    بالنزول لأي درجة مطلوبة، والحد الوحيد هو حد قراءة مطلق (٧px) —
      //    لو حتى هذا غير كافٍ (حالة فيزيائية نادرة جداً: عمود بمحتوى أطول من
      //    عرض الورقة نفسها) فهي مشكلة محتوى/حجم ورق لا يحلّها أي تصغير خط. ──
      const requiredScale = tableWidthPx / totalMin;
      const newFontPx = Math.max(7, curFontPx * requiredScale);
      const actualScale = newFontPx / curFontPx;
      (table as HTMLElement).style.fontSize = `${newFontPx}px`;
      ({ minW, prefW } = _measureColumnWidths(rows, colCount));
      minW = minW.map(w => (w > 0 ? w : fallback * 0.5 * actualScale));
      prefW = prefW.map((w, i) => (w > 0 ? w : Math.max(minW[i], fallback * actualScale)));
      tableWidthPx = table.getBoundingClientRect().width || table.scrollWidth;
      totalMin = minW.reduce((a, b) => a + b, 0);
    }

    const prefTotal = prefW.reduce((a, b) => a + b, 0);
    let finalWidths: number[];
    if (prefTotal <= tableWidthPx) {
      // مساحة كافية لعرض كل الأعمدة بعرضها المفضّل — أي فائض يُوزَّع تناسبياً
      const extra = tableWidthPx - prefTotal;
      finalWidths = prefW.map(w => w + (prefTotal > 0 ? extra * (w / prefTotal) : extra / colCount));
    } else {
      // لا تكفي المساحة لعرض الجميع بشكل مفضّل — نضمن الحد الأدنى لكل عمود
      // أولاً (مضمون الآن لأن totalMin <= tableWidthPx)، ثم نوزّع الباقي حسب
      // "رغبة" كل عمود (الفرق بين المفضّل والحد الأدنى)
      const remaining = Math.max(0, tableWidthPx - totalMin);
      const desire = prefW.map((p, i) => Math.max(0, p - minW[i]));
      const totalDesire = desire.reduce((a, b) => a + b, 0);
      finalWidths = minW.map((m, i) => m + (totalDesire > 0 ? remaining * (desire[i] / totalDesire) : remaining / colCount));
    }

    const finalPct = finalWidths.map(w => (w / tableWidthPx) * 100);

    let existing = table.querySelector("colgroup");
    if (existing) existing.remove();
    const colgroup = document.createElement("colgroup");
    finalPct.forEach(p => {
      const col = document.createElement("col");
      col.style.width = `${p}%`;
      colgroup.appendChild(col);
    });
    table.insertBefore(colgroup, table.firstChild);
    (table as HTMLElement).style.tableLayout = "fixed";

    // ── التثبيت الحاسم لمحاذاة صف الإجمالي: عرض بكسل صريح على كل خلية ──
    rows.forEach(row => {
      let colIdx = 0;
      Array.from(row.cells).forEach(cell => {
        const span = cell.colSpan || 1;
        const wPx = finalWidths.slice(colIdx, colIdx + span).reduce((a, b) => a + b, 0);
        if (wPx > 0) {
          (cell as HTMLElement).style.width = `${wPx}px`;
          (cell as HTMLElement).style.maxWidth = `${wPx}px`;
        }
        colIdx += span;
      });
    });
  });
}

/**
 * يُصيّر شذرة HTML (bodyHtml) إلى ملف PDF حقيقي مطابق تماماً لإعدادات
 * الترويسة/الهوامش/الورق/الخط المُمرَّرة، ويُعيد الناتج كـ Blob.
 */
export async function generatePrintPdf(params: PrintDocParams): Promise<Blob> {
  const { bodyHtml, settings } = params;
  const [pageWmm, pageHmm] = resolvePageSizeMm(settings.paperSize, settings.orientation);
  const marginTop = Math.max(0, settings.marginTop || 0);
  const marginRight = Math.max(0, settings.marginRight || 0);
  const marginBottom = Math.max(0, settings.marginBottom || 0);
  const marginLeft = Math.max(0, settings.marginLeft || 0);
  const contentWmm = Math.max(20, pageWmm - marginLeft - marginRight);
  const contentHmm = Math.max(20, pageHmm - marginTop - marginBottom);
  const contentWpx = mm2px(contentWmm);

  // ── تصيير المحتوى خارج الشاشة بعرض مطابق تماماً لعرض منطقة المحتوى
  //    الحقيقية بالمليمتر (بعد طرح الهوامش)، حتى يلتفّ النص/الجدول بنفس
  //    الشكل الذي سيظهر بالضبط داخل صندوق الهامش على الورقة ──
  const container = document.createElement("div");
  container.setAttribute("dir", "rtl");
  container.style.cssText = `position:fixed;top:0;left:-100000px;width:${contentWpx}px;background:#fff;z-index:-1;`;
  const styleTag = document.createElement("style");
  styleTag.textContent = PRINT_CONTENT_CSS(settings.fontFamily, settings.fontSize);
  container.appendChild(styleTag);
  const inner = document.createElement("div");
  inner.className = "ppdf-root";
  inner.innerHTML = bodyHtml;
  container.appendChild(inner);
  document.body.appendChild(container);

  try { await (document as any).fonts?.ready; } catch (_) { /* بعض المتصفحات لا تدعم document.fonts */ }
  await new Promise(r => setTimeout(r, 80)); // مهلة قصيرة لاستقرار التخطيط/الخطوط قبل التصوير
  normalizeTableColumns(inner); // تثبيت عرض الأعمدة قبل التصوير مباشرة (انظر التعليق أعلى الدالة)

  let rasterCanvas: HTMLCanvasElement;
  try {
    rasterCanvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: contentWpx,
    });
  } finally {
    document.body.removeChild(container);
  }

  const canvasScale = rasterCanvas.width / contentWpx; // بكسل الالتقاط لكل بكسل CSS
  const pxPerMm = rasterCanvas.width / contentWmm;
  const pageContentHeightPx = Math.round(contentHmm * pxPerMm);
  const totalH = rasterCanvas.height;

  // ── نقاط قصّ آمنة قريبة من حدود كل صفحة، لكن "ملتصقة" بأقرب حد عنصر
  //    (صف جدول / بطاقة مريض / عنوان) قبلها مباشرة — لتفادي قصّ صف أو بطاقة
  //    من المنتصف بين صفحتين ──
  const boundaryEls = Array.from(inner.querySelectorAll("tr, .pt-card, .kpi, h2, .sig-area")) as HTMLElement[];
  const boundaries = boundaryEls.map(el => el.offsetTop * canvasScale).sort((a, b) => a - b);

  const cutPoints: number[] = [0];
  let cursor = 0;
  let guard = 0;
  while (cursor < totalH && guard < 500) {
    guard++;
    const next = cursor + pageContentHeightPx;
    if (next >= totalH) { cutPoints.push(totalH); break; }
    const candidates = boundaries.filter(b => b > cursor + 20 && b <= next);
    const snapped = candidates.length ? candidates[candidates.length - 1] : next;
    cutPoints.push(snapped > cursor ? snapped : next);
    cursor = cutPoints[cutPoints.length - 1];
  }
  if (cutPoints[cutPoints.length - 1] < totalH) cutPoints.push(totalH);

  const orientationJs: "portrait" | "landscape" =
    (settings.orientation || "portrait").toLowerCase() === "landscape" ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation: orientationJs, unit: "mm", format: [pageWmm, pageHmm] });

  // نحوّل صورة الترويسة مرة واحدة فقط (وليس بكل صفحة) عبر canvas → JPEG
  // dataURL موثوق قبل بدء حلقة الصفحات
  const letterheadJpeg = settings.letterheadImage ? await loadImageAsJpegDataUrl(settings.letterheadImage) : null;
  if (settings.letterheadImage && !letterheadJpeg) {
    console.warn("⚠️ صورة الترويسة محفوظة بالإعدادات لكن تعذّر تحميلها/ترميزها — سيُطبع المستند بدون ترويسة على هذه المرة فقط");
  }

  let pageIndex = 0;
  for (let i = 0; i < cutPoints.length - 1; i++) {
    const sy = cutPoints[i];
    const sh = cutPoints[i + 1] - sy;
    if (sh <= 2) continue;
    if (pageIndex > 0) pdf.addPage([pageWmm, pageHmm], orientationJs);
    pageIndex++;

    if (letterheadJpeg) {
      try { pdf.addImage(letterheadJpeg, "JPEG", 0, 0, pageWmm, pageHmm, undefined, "FAST"); }
      catch (err) { console.warn("فشل رسم صورة الترويسة على الصفحة رغم نجاح تحميلها:", err); }
    }

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = rasterCanvas.width;
    pageCanvas.height = sh;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(rasterCanvas, 0, sy, rasterCanvas.width, sh, 0, 0, rasterCanvas.width, sh);
    const sliceDataUrl = pageCanvas.toDataURL("image/jpeg", 0.92);
    const sliceHmm = sh / pxPerMm;
    pdf.addImage(sliceDataUrl, "JPEG", marginLeft, marginTop, contentWmm, sliceHmm, undefined, "FAST");
  }

  return pdf.output("blob");
}

/**
 * يبني ملف PDF ثم يفتحه في تبويب جديد (يوحّد "طباعة" و"حفظ PDF" بمسار واحد،
 * لأن عارض PDF بالمتصفح يوفر أزرار الطباعة/الحفظ مباشرة). لو منع المتصفح
 * فتح التبويب (popup blocked) نلجأ لتنزيل الملف مباشرة بدلاً من ذلك.
 */
export async function openPrintPdf(params: PrintDocParams): Promise<void> {
  const blob = await generatePrintPdf(params);
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${params.title || "طباعة"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) { } }, 60000);
}
