import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp, ArrowDown, X, Check,
  CheckCircle, XCircle, AlertTriangle, AlertCircle,
  RefreshCw, Archive, Shield,
} from "lucide-react";
import { C } from "../constants";
import { _toastAdd, _toastRem } from "../toastStore";
import type { ToastItem } from "../types";

// ─── BADGE ────────────────────────────────────────────────────────────────────

export function Badge({ color, children }: { color:"success"|"warning"|"danger"|"info"|"neutral"|"secondary"; children: React.ReactNode }) {
  const s = {
    success: "bg-[#E8F5E9] text-[#388E3C]",
    warning: "bg-[#FFF8E1] text-[#FF8F00]",
    danger:  "bg-[#FFEBEE] text-[#D32F2F]",
    info:    "bg-[#E3F2FD] text-[#1565C0]",
    neutral: "bg-[#F5F5F5] text-[#555555]",
    secondary: "bg-[#E6F4F4] text-[#0D7377]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s[color]}`}>
      {children}
    </span>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

export function KPICard({ title, value, sub, Icon, color = "primary", trend }: {
  title: string; value: string; sub?: string;
  Icon: React.ComponentType<{size?: number}>;
  color?: "primary"|"secondary"|"danger"|"success"|"warning";
  trend?: { val: string; up: boolean };
}) {
  const ic = {
    primary:   "bg-[#EBF3FB] text-[#1B3A6B]",
    secondary: "bg-[#E6F4F4] text-[#0D7377]",
    danger:    "bg-[#FFEBEE] text-[#D32F2F]",
    success:   "bg-[#E8F5E9] text-[#388E3C]",
    warning:   "bg-[#FFF8E1] text-[#FF8F00]",
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]" style={{border:"1px solid #E0E0E0"}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#555555] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#1B3A6B]">{value}</p>
          {sub && <p className="text-xs text-[#999] mt-1">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.up ? "text-[#388E3C]" : "text-[#D32F2F]"}`}>
              {trend.up ? <ArrowUp size={11}/> : <ArrowDown size={11}/>}
              <span>{trend.val} الشهر الماضي</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${ic[color]}`}>
          <Icon size={22}/>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, footer, wide, danger, className }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean; danger?: boolean; className?: string;
}) {
  if (!open) return null;
  return createPortal(
    <div
      className="flex items-center justify-center p-3 sm:p-5"
      style={{position:"fixed",inset:0,zIndex:1000,backgroundColor:"rgba(0,0,0,0.5)",backdropFilter:"blur(2px)"}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={`bg-white flex flex-col w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-2xl shadow-2xl`}
        style={{maxHeight:"90vh",overflow:"hidden",zIndex:1001,position:"relative"}}
        dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] flex-shrink-0">
          <h2 className="text-base font-bold text-[#1B3A6B]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F5F5] flex items-center justify-center text-[#555] transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-4 border-t border-[#E0E0E0] flex gap-3 justify-start flex-wrap flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────

export function ConfirmModal({ open, onClose, onConfirm, title, message, danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}><Check size={16}/>تأكيد</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <p className="text-sm text-[#555] leading-relaxed">{message}</p>
    </Modal>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────

export function Card({ title, action, children, className = "" }: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`} style={{border:"1px solid #E0E0E0"}}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
          <h3 className="text-sm font-semibold text-[#1B3A6B]">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── FOCUS NEXT (Enter-key navigation) ───────────────────────────────────────

export function focusNext(e: React.KeyboardEvent<HTMLElement>): void {
  if (e.key !== "Enter") return;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "TEXTAREA") return;
  e.preventDefault();
  const sel = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled]),select:not([disabled]),textarea:not([disabled])';
  const all = Array.from(document.querySelectorAll<HTMLElement>(sel)).filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const idx = all.indexOf(e.target as HTMLElement);
  if (idx > -1 && idx < all.length - 1) all[idx + 1].focus();
}

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────

export function InputField({ label, required, type = "text", placeholder, value, onChange, children }: {
  label: string; required?: boolean; type?: string; placeholder?: string;
  value?: string; onChange?: (v: string) => void; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#555555]">
        {label}{required && <span className="text-[#D32F2F] mr-1">*</span>}
      </label>
      {children || (
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={focusNext}
          className="h-10 px-3 rounded-lg text-sm text-[#1A1A1A] outline-none transition-all"
          style={{border:"1px solid #CCCCCC",backgroundColor:"#FAFAFA"}}
          onFocus={e => { e.target.style.borderColor = "#0D7377"; e.target.style.boxShadow = "0 0 0 3px rgba(13,115,119,0.12)"; }}
          onBlur={e  => { e.target.style.borderColor = "#CCCCCC"; e.target.style.boxShadow = "none"; }}
        />
      )}
    </div>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────

export function Btn({ variant = "primary", onClick, children, small, full, disabled, loading, className, style }: {
  variant?: "primary"|"secondary"|"outline"|"outline-white"|"danger"|"success"|"ghost";
  onClick?: (e?: any) => void; children: React.ReactNode;
  small?: boolean; full?: boolean; disabled?: boolean; loading?: boolean;
  className?: string; style?: React.CSSProperties;
}) {
  const s = {
    primary:       "bg-[#1B3A6B] text-white hover:bg-[#142d55]",
    secondary:     "bg-[#0D7377] text-white hover:bg-[#0a5c60]",
    outline:       "bg-transparent text-[#1B3A6B] border-[#1B3A6B] hover:bg-[#EBF3FB]",
    "outline-white":"bg-white/10 text-white border-white/60 hover:bg-white/20",
    danger:        "bg-[#D32F2F] text-white hover:bg-[#b71c1c]",
    success:       "bg-[#388E3C] text-white hover:bg-[#2e7d32]",
    ghost:         "bg-transparent text-[#555] hover:bg-[#F5F5F5]",
  };
  return (
    <button
      onClick={onClick}
      style={style}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${s[variant]} ${(variant === "outline" || variant === "outline-white") ? "border" : ""} ${full ? "w-full" : ""} ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}>
      {loading ? <><RefreshCw size={small ? 12 : 14} className="animate-spin"/>جارٍ...</> : children}
    </button>
  );
}

// ─── TOAST CONTAINER ─────────────────────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    const add = (t: ToastItem) => setToasts(p => [...p, t]);
    const rem = (id: number) => setToasts(p => p.filter(t => t.id !== id));
    _toastAdd.push(add);
    _toastRem.push(rem);
    return () => {
      _toastAdd.splice(_toastAdd.indexOf(add), 1);
      _toastRem.splice(_toastRem.indexOf(rem), 1);
    };
  }, []);
  if (!toasts.length) return null;
  const s = { success:"bg-[#388E3C]", error:"bg-[#D32F2F]", warning:"bg-[#FF8F00]", info:"bg-[#1565C0]" };
  const ic = {
    success: <CheckCircle size={16}/>,
    error:   <XCircle size={16}/>,
    warning: <AlertTriangle size={16}/>,
    info:    <AlertCircle size={16}/>,
  };
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-sm z-[1100] flex flex-col gap-2" dir="rtl">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${s[t.type]}`} style={{animation:"slideUp 0.3s ease"}}>
          {ic[t.type]}<span className="flex-1">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── TABLE HELPERS ────────────────────────────────────────────────────────────

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{backgroundColor: C.primary, color:"white"}}>
        {cols.map(c => (
          <th key={c} className="px-3 py-2.5 text-right text-xs font-semibold">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export function TRow({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <tr style={{backgroundColor: i % 2 === 0 ? "#FFF" : "#F9FBFD"}} className="hover:bg-[#EBF3FB] transition-colors">
      {children}
    </tr>
  );
}

export function TD({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 text-sm ${className}`}>{children}</td>;
}

export function EmptyState({ msg = "لا توجد بيانات بعد" }: { msg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Archive size={36} className="text-[#CCC] mb-2"/>
      <p className="text-sm text-[#999]">{msg}</p>
    </div>
  );
}

export function AccessDeniedScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Shield size={40} className="text-[#D32F2F] mb-3"/>
      <p className="text-base font-semibold text-[#D32F2F]">هذه الشاشة مخصّصة لمدير النظام فقط</p>
      <p className="text-sm text-[#999] mt-1">لا تملك صلاحية الوصول إلى هذا القسم المالي</p>
    </div>
  );
}
