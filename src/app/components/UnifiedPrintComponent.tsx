import { useState, useRef, useCallback, useEffect } from "react";
import { Image as ImageIcon, Printer, FileDown, Save, CheckCircle } from "lucide-react";
import { api, type PrintSettingsRow } from "../api";
import { openPrintPdf } from "../printPdfEngine";

// ─── Unified print settings ─────────────────────────────────────────────────
// Backed by ONE backend row per scope: "lab" | "surgery" | "rehab" |
// "radiology" | "general". A departmentId that isn't one of the 4 special
// departments (e.g. a custom department such as "الاستقبال") resolves to the
// "general" scope, matching the admin's "الإعدادات العامة" print settings —
// this is the exact same resolver App.tsx uses when actually printing.
const SPECIAL_DEPT_SCOPES = ["lab", "surgery", "rehab", "radiology"];
export const resolvePrintScope = (departmentId?: string | null): string =>
  departmentId && SPECIAL_DEPT_SCOPES.includes(departmentId) ? departmentId : "general";

export interface UnifiedPrintSettings {
  headerEnabled: boolean;
  headerImageBase64: string;
  marginTop: number;
  marginBottom: number;
  marginRight: number;
  marginLeft: number;
  fontFamily: string;
  fontSize: number;
  showSignature: boolean;
}

const DEFAULT_SETTINGS: UnifiedPrintSettings = {
  headerEnabled: true,
  headerImageBase64: "",
  marginTop: 25,
  marginBottom: 20,
  marginRight: 15,
  marginLeft: 15,
  fontFamily: "Tajawal",
  fontSize: 13,
  showSignature: true,
};

const PRINT_FONT_SIZES = [{ v: 11, l: "صغير — 11px" }, { v: 13, l: "عادي — 13px" }, { v: 15, l: "كبير — 15px" }, { v: 17, l: "كبير جداً — 17px" }];

const rowToSettings = (r: PrintSettingsRow | null | undefined): UnifiedPrintSettings => ({
  headerEnabled: r?.with_header ?? DEFAULT_SETTINGS.headerEnabled,
  headerImageBase64: r?.letterhead_image || "",
  marginTop: r?.margin_top ?? DEFAULT_SETTINGS.marginTop,
  marginBottom: r?.margin_bottom ?? DEFAULT_SETTINGS.marginBottom,
  marginRight: r?.margin_right ?? DEFAULT_SETTINGS.marginRight,
  marginLeft: r?.margin_left ?? DEFAULT_SETTINGS.marginLeft,
  fontFamily: r?.font_family || DEFAULT_SETTINGS.fontFamily,
  fontSize: r?.font_size ?? DEFAULT_SETTINGS.fontSize,
  showSignature: r?.show_signature ?? DEFAULT_SETTINGS.showSignature,
});

const settingsToRowPatch = (s: UnifiedPrintSettings): Partial<PrintSettingsRow> => ({
  with_header: s.headerEnabled,
  letterhead_image: s.headerImageBase64 || null,
  margin_top: s.marginTop,
  margin_bottom: s.marginBottom,
  margin_right: s.marginRight,
  margin_left: s.marginLeft,
  font_family: s.fontFamily,
  font_size: s.fontSize,
  show_signature: s.showSignature,
});

// ── ملاحظة معمارية: كان هذا الملف يحتوي سابقاً على مسار طباعة منفصل تماماً
//    (`generateUnifiedPrintHtml` + `doUnifiedPrint`) يعتمد على CSS
//    background-image و window.print() المباشر — نفس الخدعة غير الموثوقة التي
//    استُبدلت في كل باقي النظام بمحرك canvas+PDF الموحّد (`printPdfEngine.ts`)
//    تحديداً بسبب اعتمادها على خيار "طباعة الخلفيات" بالمتصفح، وتكرار الهوامش
//    الخاطئ عبر الصفحات المتعددة. أزلنا الازدواجية هنا واستبدلناها باستدعاء
//    مباشر لنفس المحرك الموحّد (`openPrintPdf`)، حتى لا يوجد أي مسار طباعة في
//    النظام لا يمر عبر نفس المحرك/نفس منطق الترويسة والهوامش. ──
export async function doUnifiedPrint(bodyHtml: string, settings: UnifiedPrintSettings, title = "طباعة") {
  await openPrintPdf({
    title,
    bodyHtml,
    settings: {
      paperSize: "A4",
      orientation: "portrait",
      marginTop: settings.marginTop,
      marginRight: settings.marginRight,
      marginBottom: settings.marginBottom,
      marginLeft: settings.marginLeft,
      letterheadImage: settings.headerEnabled ? (settings.headerImageBase64 || null) : null,
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
    },
  });
}

interface Props {
  departmentId: string;
  departmentName: string;
  onSettingsChange?: (s: UnifiedPrintSettings) => void;
  // Called right after a successful backend save with the raw row — callers
  // use this to refresh the shared `gAllPrintSettings` cache in App.tsx so
  // every print button reflects the change immediately, without a reload.
  onSaved?: (row: PrintSettingsRow) => void;
  compact?: boolean;
}

export default function UnifiedPrintComponent({ departmentId, departmentName, onSettingsChange, onSaved, compact = false }: Props) {
  const scope = resolvePrintScope(departmentId);
  const [settings, setSettings] = useState<UnifiedPrintSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    api.settings.print.getByScope(scope).then(row => {
      if (cancelled) return;
      setSettings(rowToSettings(row));
      setLoaded(true);
    }).catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [scope]);

  const update = useCallback((patch: Partial<UnifiedPrintSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      onSettingsChange?.(next);
      return next;
    });
  }, [onSettingsChange]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const row = await api.settings.print.update(scope, settingsToRowPatch(settings));
      if (row) onSaved?.(row);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [scope, settings, onSaved]);

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

  const { headerEnabled, headerImageBase64, marginTop, marginBottom, marginRight, marginLeft, fontSize, showSignature } = settings;

  return (
    <div className={compact ? "space-y-3" : "p-6 bg-white rounded-xl shadow-lg space-y-5"} style={compact ? {} : { border: "1px solid #BBDEFB" }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        {!compact ? (
          <h2 className="text-lg font-bold text-[#1B3A6B]">إعدادات الطباعة: {departmentName}</h2>
        ) : (
          <div>
            <p className="text-sm font-bold text-[#1B3A6B]">⚙️ إعدادات الطباعة — {departmentName}</p>
            <p className="text-[10px] text-[#999] mt-0.5">تُطبَّق تلقائياً على كل زر طباعة {scope === "general" ? "في النظام (ما عدا المختبر/الجراحة/التأهيلي/الأشعة)" : `داخل هذا القسم`} — لكل الموظفين والمدير على أي جهاز</p>
          </div>
        )}
        <button onClick={save} disabled={saving || !loaded}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
          style={{ backgroundColor: saved ? "#388E3C" : "#1B3A6B", color: "white" }}>
          {saved ? <><CheckCircle size={14} />تم الحفظ</> : <><Save size={14} />{saving ? "جارٍ الحفظ..." : "حفظ إعدادات الطباعة"}</>}
        </button>
      </div>

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
            <p className="text-xs font-semibold text-[#555] mb-2">صورة الترويسة الرسمية (تُطبع كصفحة A4 كاملة خلف المحتوى)</p>
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
      </div>

      {/* Font size */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-xs font-semibold text-[#555] mb-2">حجم الخط (Font Size)</p>
          {/* ── تحديد حر بالبكسل بدل ٤ خيارات ثابتة بس — سلايدر + حقل رقمي
              يقبلوا أي قيمة ضمن مدى معقول (٨–٣٠px)، مع أزرار اختصار سريعة
              للأحجام الشائعة تبقى متاحة كنقطة انطلاق سريعة. ── */}
          <div className="flex items-center gap-3 mb-2">
            <input type="range" min={8} max={30} step={1} value={fontSize}
              onChange={e => update({ fontSize: parseInt(e.target.value) || DEFAULT_SETTINGS.fontSize })}
              className="flex-1 accent-[#1B3A6B]" />
            <div className="flex items-center gap-1 flex-shrink-0">
              <input type="number" min={8} max={30} value={fontSize}
                onChange={e => update({ fontSize: Math.max(8, Math.min(30, parseInt(e.target.value) || DEFAULT_SETTINGS.fontSize)) })}
                className="w-16 h-8 px-2 rounded-lg text-sm text-center outline-none"
                style={{ border: "1px solid #CCC", backgroundColor: "#FAFAFA" }} />
              <span className="text-xs text-[#999]">px</span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRINT_FONT_SIZES.map(s => (
              <button key={s.v} onClick={() => update({ fontSize: s.v })}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${fontSize === s.v ? "bg-[#1B3A6B] text-white" : "bg-[#F5F5F5] text-[#555] hover:bg-[#E0E0E0]"}`}
                style={{ border: `1px solid ${fontSize === s.v ? "#1B3A6B" : "#E0E0E0"}` }}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Signature toggle */}
      <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E0E0E0" }}>
        <div>
          <p className="text-xs font-semibold text-[#333]">التوقيع والختم (Signature & Stamp)</p>
          <p className="text-[10px] text-[#999] mt-0.5">إظهار خانة توقيع أسفل التقارير التي تدعم ذلك</p>
        </div>
        <button onClick={() => update({ showSignature: !showSignature })}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${showSignature ? "bg-[#388E3C]" : "bg-[#CCC]"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${showSignature ? "right-0.5" : "left-0.5"}`} />
        </button>
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
