import { useState, useRef, useCallback } from "react";
import { Image as ImageIcon, Printer, FileDown } from "lucide-react";

export interface UnifiedPrintSettings {
  headerEnabled: boolean;
  headerImageBase64: string;
  marginTop: number;
  marginBottom: number;
  marginRight: number;
  marginLeft: number;
}

const DEFAULT_SETTINGS: UnifiedPrintSettings = {
  headerEnabled: true,
  headerImageBase64: "",
  marginTop: 25,
  marginBottom: 20,
  marginRight: 15,
  marginLeft: 15,
};

function lsLoad(dept: string): UnifiedPrintSettings {
  try {
    const raw = localStorage.getItem(`print_settings_${dept}`);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  try {
    const lh = localStorage.getItem(`print_letterhead_${dept}`) || "";
    const mRaw = localStorage.getItem(`print_margins_${dept}`);
    const m = mRaw ? JSON.parse(mRaw) : {};
    return {
      headerEnabled: true,
      headerImageBase64: lh,
      marginTop: m.top ?? DEFAULT_SETTINGS.marginTop,
      marginBottom: m.bottom ?? DEFAULT_SETTINGS.marginBottom,
      marginRight: m.right ?? DEFAULT_SETTINGS.marginRight,
      marginLeft: m.left ?? DEFAULT_SETTINGS.marginLeft,
    };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function lsSave(dept: string, s: UnifiedPrintSettings) {
  try {
    localStorage.setItem(`print_settings_${dept}`, JSON.stringify(s));
    if (s.headerImageBase64) {
      localStorage.setItem(`print_letterhead_${dept}`, s.headerImageBase64);
      localStorage.setItem("print_letterhead_global", s.headerImageBase64);
    } else {
      localStorage.removeItem(`print_letterhead_${dept}`);
    }
    localStorage.setItem(
      `print_margins_${dept}`,
      JSON.stringify({ top: s.marginTop, bottom: s.marginBottom, right: s.marginRight, left: s.marginLeft })
    );
  } catch {}
}

export function generateUnifiedPrintHtml(
  bodyHtml: string,
  settings: UnifiedPrintSettings,
  title = "طباعة"
): string {
  const { headerEnabled, headerImageBase64, marginTop, marginBottom, marginRight, marginLeft } = settings;
  const hasBg = headerEnabled && !!headerImageBase64;
  const bgCss = hasBg
    ? `background-image:url('${headerImageBase64}');background-size:100% 100%;background-repeat:no-repeat;-webkit-print-color-adjust:exact;print-color-adjust:exact;`
    : "";
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;500;700&display=swap');
*{box-sizing:border-box}
@page{size:A4;margin:0}
body{margin:0;padding:0;background:transparent;font-family:Tajawal,Arial,sans-serif;direction:rtl;color:#1A1A1A;font-size:13px}
.lh-bg{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;${bgCss}}
.content-area{
  padding:${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
  position:relative;z-index:0;
}
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
.rm{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:14px;border-bottom:1px solid #E8EDF5;background:#F5F8FF;padding:6px 10px;border-radius:0 0 6px 6px}
.rm-item{font-size:11px;color:#444;display:inline-flex;align-items:center;gap:4px}
.rm-item strong{color:#1B3A6B}
@media print{.pt-card{page-break-inside:avoid}}
</style>
</head>
<body>
${hasBg ? '<div class="lh-bg"></div>' : ""}
<div class="content-area">
${bodyHtml}
</div>
</body>
</html>`;
}

export function doUnifiedPrint(bodyHtml: string, settings: UnifiedPrintSettings, title = "طباعة") {
  const html = generateUnifiedPrintHtml(bodyHtml, settings, title);
  const pw = window.open("", "_blank");
  if (!pw) return;
  pw.document.write(html);
  pw.document.close();
  setTimeout(() => {
    try { pw.focus(); pw.print(); } catch {}
  }, 500);
}

interface Props {
  departmentId: string;
  departmentName: string;
  onSettingsChange?: (s: UnifiedPrintSettings) => void;
  compact?: boolean;
}

export default function UnifiedPrintComponent({ departmentId, departmentName, onSettingsChange, compact = false }: Props) {
  const [settings, setSettings] = useState<UnifiedPrintSettings>(() => lsLoad(departmentId));
  const fileRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<UnifiedPrintSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      lsSave(departmentId, next);
      onSettingsChange?.(next);
      return next;
    });
  }, [departmentId, onSettingsChange]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      update({ headerImageBase64: b64, headerEnabled: true });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => update({ headerImageBase64: "" });

  const { headerEnabled, headerImageBase64, marginTop, marginBottom, marginRight, marginLeft } = settings;

  return (
    <div className={compact ? "space-y-3" : "p-6 bg-white rounded-xl shadow-lg space-y-5"} style={compact ? {} : { border: "1px solid #BBDEFB" }}>
      {!compact && (
        <h2 className="text-lg font-bold text-[#1B3A6B]">إعدادات الطباعة: {departmentName}</h2>
      )}

      {/* Header toggle */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3" style={{ border: "1px solid #E0E0E0" }}>
        <p className="text-sm font-bold text-[#1B3A6B]">نوع الورق</p>
        {([
          [true, "مع ترويسة المركز", "ادرج صورة الترويسة لتُطبع كخلفية للورقة كاملة، أو اتركها فارغة لطباعة اسم المركز نصاً"],
          [false, "بدون ترويسة", "للورق المطبوع مسبقاً — هامش علوي موسّع تلقائياً"],
        ] as [boolean, string, string][]).map(([v, label, hint]) => (
          <button key={String(v)} onClick={() => update({ headerEnabled: v })}
            className={`w-full text-right px-3 py-2.5 rounded-xl transition-colors ${headerEnabled === v ? "bg-[#EBF3FB]" : "bg-[#FAFAFA] hover:bg-[#F5F5F5]"}`}
            style={{ border: `1.5px solid ${headerEnabled === v ? "#1B3A6B" : "#E0E0E0"}` }}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${headerEnabled === v ? "border-[#1B3A6B]" : "border-[#CCC]"}`}>
                {headerEnabled === v && <div className="w-2 h-2 rounded-full bg-[#1B3A6B]" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{label}</div>
                <div className="text-[10px] text-[#888]">{hint}</div>
              </div>
            </div>
          </button>
        ))}

        {/* Image uploader */}
        {headerEnabled && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-[#555] mb-2">صورة الترويسة الرسمية</p>
            {headerImageBase64 ? (
              <div className="rounded-xl overflow-hidden border border-[#D0D9E8]" style={{ background: "#F9FAFB" }}>
                <img src={headerImageBase64} alt="الترويسة" className="w-full object-contain" style={{ maxHeight: 110 }} />
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#E0E0E0]">
                  <span className="text-[10px] text-[#388E3C] font-semibold">✓ تم رفع الترويسة — ستُطبع كخلفية للورقة كاملة</span>
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className="text-[11px] text-[#1B3A6B] font-semibold hover:underline">تغيير</button>
                    <button onClick={removeImage} className="text-[11px] text-[#D32F2F] font-semibold hover:underline">حذف</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-[#B0C4DE] hover:border-[#1B3A6B] hover:bg-[#F0F5FF] transition-colors"
                style={{ background: "#FAFCFF" }}>
                <ImageIcon size={22} className="text-[#1B3A6B] opacity-60" />
                <span className="text-xs text-[#555]">اضغط لرفع صورة الترويسة</span>
                <span className="text-[10px] text-[#AAA]">PNG / JPG / WEBP — تُطبع كخلفية للورقة كاملة</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        )}
      </div>

      {/* Margins */}
      <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: "1px solid #E0E0E0" }}>
        <p className="text-sm font-bold text-[#1B3A6B] mb-3">هوامش الصفحة (mm)</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["marginTop", "العلوي", marginTop],
            ["marginBottom", "السفلي", marginBottom],
            ["marginRight", "الأيمن", marginRight],
            ["marginLeft", "الأيسر", marginLeft],
          ] as [keyof UnifiedPrintSettings, string, number][]).map(([key, label, val]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#999]">{label} (mm)</label>
              <input type="number" min={0} max={80} value={val}
                onChange={e => update({ [key]: parseInt(e.target.value) || 0 })}
                className="h-8 px-2 rounded-lg text-sm text-center outline-none"
                style={{ border: "1px solid #CCC", backgroundColor: "#FAFAFA" }} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#AAA] mt-2">تُطبَّق على هذا القسم فقط</p>
      </div>

      {/* Quick print buttons (when used standalone) */}
      {!compact && (
        <div className="flex gap-2">
          <button
            onClick={() => doUnifiedPrint('<p style="color:#888;text-align:center">محتوى التقرير سيظهر هنا</p>', settings, departmentName)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1B3A6B] text-white font-bold hover:bg-[#0D2A56] transition-colors">
            <Printer size={16} /> طباعة
          </button>
          <button
            onClick={() => doUnifiedPrint('<p style="color:#888;text-align:center">محتوى التقرير سيظهر هنا</p>', settings, departmentName)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold hover:bg-[#EBF3FB] transition-colors">
            <FileDown size={16} /> حفظ PDF
          </button>
        </div>
      )}
    </div>
  );
}
