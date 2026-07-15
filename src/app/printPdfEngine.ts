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
export const PRINT_CONTENT_CSS = (fontFamily: string, fontSize: number) => `
*{box-sizing:border-box}
.ppdf-root{font-family:${fontFamily},Arial,sans-serif;direction:rtl;color:#1A1A1A;font-size:${fontSize}px;margin:0;padding:0;background:#fff}
.ch{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;margin-bottom:0;border-bottom:2px solid #1B3A6B}
.ct{font-size:17px;color:#1B3A6B;display:block;font-weight:700;margin-bottom:3px}.cs{font-size:11px;color:#555}.cm{font-size:10px;color:#888;text-align:left;white-space:nowrap;line-height:1.6}
.rm{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:14px;border-bottom:1px solid #E8EDF5;background:#F5F8FF;padding:6px 10px;border-radius:0 0 6px 6px}
.rm-item{font-size:11px;color:#444;display:inline-flex;align-items:center;gap:4px}
.rm-item strong{color:#1B3A6B}
h2{font-size:13px;color:#1B3A6B;margin:14px 0 6px;font-weight:700;border-bottom:1px solid #E0E0E0;padding-bottom:4px}
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:11px}
th{background:#1B3A6B;color:white;padding:7px 8px;text-align:right;font-weight:700}
td{border:1px solid #ddd;padding:5px 8px;vertical-align:middle}
tr:nth-child(even)>td{background:#F9FAFB}
tfoot td{background:#EBF3FB;font-weight:700;border-top:2px solid #1B3A6B}
.in{color:#388E3C;font-weight:700}.out{color:#D32F2F;font-weight:700}
.kpi{display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.kpi-box{background:#F5F7FA;border:1px solid #E0E0E0;border-radius:8px;padding:8px 16px;text-align:center}
.kpi-l{font-size:10px;color:#777;margin-bottom:2px}.kpi-v{font-size:14px;font-weight:700;color:#1B3A6B}
.pt-card{border:1px solid #D0D9E8;border-radius:10px;padding:16px;margin-bottom:18px;background:#fff}
.pt-name{font-size:16px;font-weight:700;color:#1B3A6B;margin-bottom:6px}
.pt-info{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:10px}
.pt-field{font-size:11px;color:#555}.pt-field b{color:#1A1A1A}
.tests-title{font-size:12px;font-weight:700;color:#1B3A6B;margin:10px 0 4px;padding-bottom:3px;border-bottom:1px solid #E0E0E0}
.tests-list{margin:0;padding:0 18px;font-size:12px;line-height:1.9}
.sig-area{display:flex;justify-content:space-between;margin-top:22px;padding-top:10px;border-top:1px dashed #CCC}
.sig-box{text-align:center;font-size:10px;color:#888}.sig-line{border-top:1px solid #888;width:120px;margin:28px auto 4px}
.footer{margin-top:20px;font-size:9px;color:#aaa;text-align:center;padding-top:8px;border-top:1px solid #eee}
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
