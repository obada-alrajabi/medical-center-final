import {
  Scissors, FlaskConical, Aperture, Dumbbell,
  Briefcase, User, Receipt, ShoppingCart, Landmark, Wrench, FileEdit,
} from "lucide-react";
import type { DiagnosisEntry } from "./types";

// ─── COLORS ──────────────────────────────────────────────────────────────────

export const C = {
  primary:"#1B3A6B", secondary:"#0D7377", primaryLight:"#EBF3FB", secondaryLight:"#E6F4F4",
  bg:"#F5F5F5", card:"#FFFFFF", border:"#E0E0E0",
  textPrimary:"#1A1A1A", textSecondary:"#555555", textMuted:"#999999",
  success:"#388E3C", warning:"#FF8F00", danger:"#D32F2F", info:"#1565C0",
};

export const PIE_COLORS = [C.primary, C.secondary, C.success, C.warning, C.danger, C.info];

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  { id:"surgery",   name:"عيادة الجراحة العامة والطوارئ", short:"الجراحة",  Icon:Scissors    },
  { id:"lab",       name:"مختبر التحاليل الطبية",          short:"المختبر",  Icon:FlaskConical },
  { id:"radiology", name:"قسم الأشعة الطبية",              short:"الأشعة",   Icon:Aperture    },
  { id:"rehab",     name:"قسم العلاج التأهيلي",            short:"التأهيلي", Icon:Dumbbell    },
];

// ─── DRAWER CATEGORIES ───────────────────────────────────────────────────────

export const WITHDRAW_CATS = [
  {id:"salary",   label:"راتب موظف",          Icon:Briefcase,    suggest:"راتب "},
  {id:"empexp",   label:"مصروف شخصي — موظف", Icon:User,         suggest:"مصروف شخصي — "},
  {id:"invoice",  label:"دفع فاتورة شركة",    Icon:Receipt,      suggest:"دفع فاتورة — "},
  {id:"purchase", label:"مشتريات مباشرة",     Icon:ShoppingCart, suggest:"مشتريات — "},
  {id:"bank",     label:"إيداع في البنك",      Icon:Landmark,     suggest:"إيداع بنكي"},
  {id:"ops",      label:"مصروف تشغيلي",       Icon:Wrench,       suggest:"مصروف تشغيلي — "},
  {id:"other",    label:"أخرى",               Icon:FileEdit,     suggest:""},
];

export const DEPOSIT_TYPES = [
  {id:"receipt",  label:"سند قبض — دفعة نقدية"},
  {id:"transfer", label:"تحويل من قسم آخر"},
  {id:"other",    label:"تعديل يدوي — أخرى"},
];

// ─── LAB & RADIOLOGY ─────────────────────────────────────────────────────────

export const LAB_CATS = [
  "تحاليل الدم","تحاليل البول","الهرمونات","الكيمياء الحيوية",
  "الأمراض المعدية","تحاليل الغدة الدرقية","أخرى",
];

export const RAD_DEVICES = ["X-Ray","CT Scanner","MRI","Ultrasound","Mammography","Fluoroscopy","أخرى"];
export const RAD_CATS = ["أشعة تقليدية X-Ray","طبقي محوري CT","رنين مغناطيسي MRI","سونار Ultrasound","أشعة باريوم","فحوصات أخرى"];

// ─── INVENTORY ───────────────────────────────────────────────────────────────

export const ITEM_TYPES = [
  "كيت تشخيصي","كاشف كيميائي","سرنجة / إبرة","أنابيب / تيوب","وعاء عينة",
  "مستلزم طبي","محلول / كيمياوي","مواد استهلاكية","معدة ومواد","أخرى",
];

export const LAB_ITEM_UNITS = [
  "عدد","صندوق","كيس","علبة","برطمان","زجاجة","كيلوغرام","لتر","مل","حبة","رول","أخرى",
];

export const SURGERY_CLINIC_CATS = [
  "أدوية وعلاجات","مستلزمات جراحية","معدات طبية","مواد تعقيم وتطهير","أخرى",
];

// ─── REHAB ───────────────────────────────────────────────────────────────────

export const REHAB_SERVICES = [
  "تأهيل عظمي ومفصلي","علاج عصبي","علاج الرياضيين","ما بعد الجراحة",
  "العمود الفقري","الأطراف العلوية","الأطراف السفلية","أخرى",
];

// ─── DIAGNOSIS CATEGORIES ─────────────────────────────────────────────────────

export const DIAG_CATS_SURGERY: DiagnosisEntry["category"][] = [
  "الجهاز الهضمي","الجراحة العامة","الجهاز التنفسي","القلب والأوعية","الجهاز البولي",
  "الغدد الصماء","الجهاز العصبي","عظام ومفاصل","الجلد","النساء والتوليد","الأمراض المعدية",
  "أنف وأذن وحنجرة","العيون","الأمراض النفسية","أمراض الدم","طوارئ","وقائي",
  "الجراحة الوعائية","جراحة الثدي","جراحة الغدد","الأورام","طب الأطفال","أخرى",
];

export const DIAG_CATS_REHAB: DiagnosisEntry["category"][] = [
  "عظام ومفاصل","الجهاز العصبي","العمود الفقري","الأطراف العلوية","الأطراف السفلية",
  "التوازن والمشي","ما بعد الجراحة","أمراض الرياضة","أخرى",
];

// ─── FINANCIAL & INSURANCE ───────────────────────────────────────────────────

export const DEPT_CAPACITY: Record<string, number> = {
  surgery:25, lab:30, radiology:15, rehab:20,
};

export const DEPT_COLORS_MAP: Record<string, string> = {
  الجراحة: C.primary,
  المختبر: C.secondary,
  الأشعة:  C.success,
  التأهيلي: C.warning,
};

export const INSURANCE_COMPANIES = [
  "شركة التأمين الوطنية","شركة الخليج للتأمين","شركة الرعاية الصحية",
  "شركة التأمين الفلسطينية","شركة النيل للتأمين","شركة المتحدة للتأمين",
  "تأمين حكومي","شركة الأمان للتأمين","شركة العربية للتأمين","شركة ميدغلف","أخرى",
];

// ─── PURCHASE & RECEIPT ───────────────────────────────────────────────────────

export const PURCHASE_UNITS = [
  "قطعة","علبة","كرتون","لتر","مل","كغ","غ","باكيت","رزمة","أخرى",
];

export const RECEIPT_TYPES = [
  "دفعة خارجية","دفعة علاج سابق","تسديد دين مريض","إيراد متنوع","أخرى",
];

// ─── PRINT SETTINGS ───────────────────────────────────────────────────────────

export const PRINT_FONT_FAMILIES = [
  {id:"Tajawal", label:"تجوّل (افتراضي)"},
  {id:"Cairo",   label:"القاهرة"},
  {id:"Amiri",   label:"أميري (كلاسيكي)"},
  {id:"Arial",   label:"أريال"},
];

export const PRINT_FONT_SIZES = [
  {v:11, l:"صغير — 11px"},
  {v:13, l:"عادي — 13px"},
  {v:15, l:"كبير — 15px"},
  {v:17, l:"كبير جداً — 17px"},
];
