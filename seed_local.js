import pg from 'pg';
const { Client } = pg;

const DEPARTMENTS = [
  { id: 'surgery', name: 'عيادة الجراحة العامة والطوارئ', short_name: 'الجراحة', icon: 'Scissors', is_custom: false, sub_item_ids: null, sort_order: 1 },
  { id: 'lab', name: 'مختبر التحاليل الطبية', short_name: 'المختبر', icon: 'FlaskConical', is_custom: false, sub_item_ids: null, sort_order: 2 },
  { id: 'radiology', name: 'الأشعة التشخيصية', short_name: 'الأشعة', icon: 'Aperture', is_custom: false, sub_item_ids: null, sort_order: 3 },
  { id: 'rehab', name: 'العلاج التأهيلي', short_name: 'التأهيلي', icon: 'Dumbbell', is_custom: false, sub_item_ids: null, sort_order: 4 }
];

const RAD_CATALOG = [
  { id: 1, code: 'XR-CHEST', name: 'صورة صدر (X-Ray)', device: 'X-Ray', price: 120.00, time_val: 'فوري', time_unit: null, instructions: null, notes: null },
  { id: 2, code: 'XR-HAND', name: 'صورة يد (X-Ray)', device: 'X-Ray', price: 80.00, time_val: 'فوري', time_unit: null, instructions: null, notes: null },
  { id: 3, code: 'XR-SPINE', name: 'صورة عمود فقري (X-Ray)', device: 'X-Ray', price: 150.00, time_val: 'فوري', time_unit: null, instructions: null, notes: null },
  { id: 4, code: 'CT-HEAD', name: 'أشعة مقطعية — رأس (CT)', device: 'CT Scanner', price: 350.00, time_val: '30', time_unit: 'دقيقة', instructions: null, notes: null },
  { id: 5, code: 'CT-ABD', name: 'أشعة مقطعية — بطن (CT)', device: 'CT Scanner', price: 380.00, time_val: '30', time_unit: 'دقيقة', instructions: 'يُمنع الأكل 4 ساعات قبل الفحص', notes: null },
  { id: 6, code: 'MRI-KNEE', name: 'رنين مغناطيسي — ركبة (MRI)', device: 'MRI', price: 500.00, time_val: '1', time_unit: 'ساعة', instructions: 'إزالة المعادن', notes: null },
  { id: 7, code: 'US-ABD', name: 'تصوير بالموجات فوق صوتية', device: 'Ultrasound', price: 200.00, time_val: '20', time_unit: 'دقيقة', instructions: null, notes: null },
  { id: 8, code: 'MAMMO', name: 'تصوير الثدي (Mammogram)', device: 'Mammography', price: 280.00, time_val: '30', time_unit: 'دقيقة', instructions: null, notes: null }
];

const LAB_TESTS = [
  { id: 1, code: 'CBC', name: 'CBC', name_en: 'CBC', category: 'تحاليل الدم', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 15.00, is_l2l: false, kit: 'syringe + needle +alcohol swap + EDTA tube +diluant', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 2, code: 'ESR', name: 'ESR', name_en: 'ESR', category: 'تحاليل الدم', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syringe + needle +alcohol swap + ESR Tube', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 3, code: 'PT', name: 'PT', name_en: 'PT', category: 'تحاليل الدم', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syringe +needle +alcohol swap + Na citrate tube +test tube +Pt reagent', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 4, code: 'PTT', name: 'PTT', name_en: 'PTT', category: 'تحاليل الدم', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syringe +needle +alcohol swap + Na citrate tube +test tube +aPtt reagent', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 5, code: 'BLOODGROUP', name: 'Blood group', name_en: 'Blood group', category: 'تحاليل الدم', price_official: 20.00, price: 20.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'lancet +slide+wodden stick +ABO reagent', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 6, code: 'BHCG-', name: 'BHCG(+/-)', name_en: 'BHCG(+/-)', category: 'الهرمونات', price_official: 20.00, price: 20.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syring +needle +alcohol swap +test tube + kit ( exp 24.6.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 7, code: 'BHCGTITER', name: 'BHCG Titer', name_en: 'BHCG Titer', category: 'الهرمونات', price_official: 70.00, price: 70.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp3.2.2028 )', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 8, code: 'BUN', name: 'BUN', name_en: 'BUN', category: 'الكيمياء الحيوية', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 9, code: 'CREATININ', name: 'Creatinin', name_en: 'Creatinin', category: 'الكيمياء الحيوية', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 10, code: 'CHOLESTEROL', name: 'Cholesterol', name_en: 'Cholesterol', category: 'الكيمياء الحيوية', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 11, code: 'LDL', name: 'LDL', name_en: 'LDL', category: 'الكيمياء الحيوية', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 15.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 12, code: 'HDL', name: 'HDL', name_en: 'HDL', category: 'الكيمياء الحيوية', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 15.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 13, code: 'TG', name: 'TG', name_en: 'TG', category: 'الكيمياء الحيوية', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp22.9.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 14, code: 'FSH', name: 'FSH', name_en: 'FSH', category: 'الهرمونات', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow and blue tip+ test tube + Reage', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 15, code: 'FERRITIN', name: 'Ferritin', name_en: 'Ferritin', category: 'الهرمونات', price_official: 80.00, price: 80.00, consumables_cost: 0.00, price_cost: 35.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 12.3.2.2028)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 16, code: 'FT4', name: 'F T4', name_en: 'F T4', category: 'الهرمونات', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 13.10.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 17, code: 'FT3', name: 'F T3', name_en: 'F T3', category: 'الهرمونات', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 18, code: 'FOLATEFOLICA', name: 'Folate (folic acid )', name_en: 'Folate (folic acid )', category: 'الهرمونات', price_official: 80.00, price: 80.00, consumables_cost: 0.00, price_cost: 40.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 19, code: 'PROLACTINPRL', name: 'Prolactin (PRL)', name_en: 'Prolactin (PRL)', category: 'الهرمونات', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 13.10.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 20, code: 'LH', name: 'LH', name_en: 'LH', category: 'الهرمونات', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp27.8.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 21, code: 'LDH', name: 'LDH', name_en: 'LDH', category: 'أخرى', price_official: 40.00, price: 40.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 22, code: 'ASOT', name: 'ASOT', name_en: 'ASOT', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 23, code: 'ANA', name: 'ANA', name_en: 'ANA', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 45.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 24, code: 'AMH', name: 'AMH', name_en: 'AMH', category: 'الهرمونات', price_official: 200.00, price: 200.00, consumables_cost: 0.00, price_cost: 120.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp22.9.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 25, code: 'E2', name: 'E2', name_en: 'E2', category: 'أخرى', price_official: 70.00, price: 70.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 26, code: 'PROGESTERON', name: 'Progesteron', name_en: 'Progesteron', category: 'أخرى', price_official: 70.00, price: 70.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 12.11.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 27, code: 'PHPSPHORUS', name: 'Phpsphorus', name_en: 'Phpsphorus', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 28, code: 'CA', name: 'Ca', name_en: 'Ca', category: 'أخرى', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 29, code: 'MG', name: 'Mg', name_en: 'Mg', category: 'أخرى', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 30, code: 'CL', name: 'Cl', name_en: 'Cl', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 15.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 31, code: 'K', name: 'K', name_en: 'K', category: 'أخرى', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 32, code: 'NA', name: 'Na', name_en: 'Na', category: 'أخرى', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 33, code: 'ELECTROLYTE', name: 'Electrolyte', name_en: 'Electrolyte', category: 'أخرى', price_official: 85.00, price: 85.00, consumables_cost: 0.00, price_cost: 55.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 34, code: 'VIT-D', name: 'Vit - D', name_en: 'Vit - D', category: 'أخرى', price_official: 150.00, price: 150.00, consumables_cost: 0.00, price_cost: 100.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 35, code: 'VIT-B12', name: 'vit - B 12', name_en: 'vit - B 12', category: 'أخرى', price_official: 90.00, price: 90.00, consumables_cost: 0.00, price_cost: 40.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp9.11.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 36, code: 'URINEANALYSI', name: 'urine analysis', name_en: 'urine analysis', category: 'أخرى', price_official: 20.00, price: 20.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 37, code: 'URICACID', name: 'uric acid', name_en: 'uric acid', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 38, code: 'SEMINALFLUID', name: 'Seminal Fluid', name_en: 'Seminal Fluid', category: 'أخرى', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 39, code: 'SEMINALCULTU', name: 'Seminal culture', name_en: 'Seminal culture', category: 'الأمراض المعدية', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 40, code: 'STOOLANALYSI', name: 'stool analysis', name_en: 'stool analysis', category: 'تحاليل البول', price_official: 20.00, price: 20.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 41, code: 'STOOLCULTURE', name: 'stool culture', name_en: 'stool culture', category: 'تحاليل البول', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 42, code: 'URINECULTURE', name: 'urine culture', name_en: 'urine culture', category: 'الأمراض المعدية', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 43, code: 'HVCCULTURE', name: 'HVC Culture', name_en: 'HVC Culture', category: 'الأمراض المعدية', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 44, code: 'TSH', name: 'TSH', name_en: 'TSH', category: 'الهرمونات', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 45, code: 'TESTOSTERONT', name: 'Testosteron total', name_en: 'Testosteron total', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 40.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 46, code: 'FREETESTO', name: 'Free Testo', name_en: 'Free Testo', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 50.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 47, code: 'TROPONIN-', name: 'Troponin (+/-)', name_en: 'Troponin (+/-)', category: 'أخرى', price_official: 70.00, price: 70.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +kit ( exp 17.12.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 48, code: 'TIBC', name: 'TIBC', name_en: 'TIBC', category: 'أخرى', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 49, code: 'TRANSFIRRIN', name: 'Transfirrin', name_en: 'Transfirrin', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 60.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 50, code: 'TOTALPROTIEN', name: 'Total Protien', name_en: 'Total Protien', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 51, code: 'TORCHIGG', name: 'TORCH IgG', name_en: 'TORCH IgG', category: 'أخرى', price_official: 250.00, price: 250.00, consumables_cost: 0.00, price_cost: 120.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 52, code: 'CPK', name: 'CPK', name_en: 'CPK', category: 'أخرى', price_official: 40.00, price: 40.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 53, code: 'COOMBSDIRECT', name: 'Coombs direct', name_en: 'Coombs direct', category: 'أخرى', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 54, code: 'ICTTITER', name: 'ICTTiter', name_en: 'ICTTiter', category: 'أخرى', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 55, code: 'C-PIPTIDE', name: 'C - piptide', name_en: 'C - piptide', category: 'تحاليل الدم', price_official: 200.00, price: 200.00, consumables_cost: 0.00, price_cost: 90.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 56, code: 'CRP', name: 'CRP', name_en: 'CRP', category: 'أخرى', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 15.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 57, code: 'HBS', name: 'Hbs', name_en: 'Hbs', category: 'أخرى', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube  +kit ( exp18.12.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 58, code: 'RBS', name: 'RBS', name_en: 'RBS', category: 'أخرى', price_official: 20.00, price: 20.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 59, code: 'RUBELLA', name: 'Rubella', name_en: 'Rubella', category: 'الأمراض المعدية', price_official: 70.00, price: 70.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 60, code: 'HPYLORISTOOL', name: 'H.pylori stool', name_en: 'H.pylori stool', category: 'تحاليل البول', price_official: 80.00, price: 80.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: 'cup non-sterile +kit(exp 30.10.2027 )', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 61, code: 'HPYLORISERUM', name: 'H.pylori serum', name_en: 'H.pylori serum', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 80.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +kits ( exp 19.9.2026)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 62, code: 'OCCULTBLOOD', name: 'Occult blood', name_en: 'Occult blood', category: 'أخرى', price_official: 40.00, price: 40.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: 'cup non-sterile +kit(exp 13.11.2027)', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 63, code: 'D-DIMER', name: 'D-Dimer', name_en: 'D-Dimer', category: 'أخرى', price_official: 140.00, price: 140.00, consumables_cost: 0.00, price_cost: 70.00, is_l2l: false, kit: 'syring +needle +alcohol swap +plain tube +yellow tip +kit ( exp 18.11.2027', kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 64, code: 'ANTICARDIOLI', name: 'Anti Cardiolipin', name_en: 'Anti Cardiolipin', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 50.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 65, code: 'ANTIPHOSPHOL', name: 'Anti Phospholipid', name_en: 'Anti Phospholipid', category: 'أخرى', price_official: 150.00, price: 150.00, consumables_cost: 0.00, price_cost: 70.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 66, code: 'THROMPOPHILI', name: 'Thrompophilia panle (12 mutation )', name_en: 'Thrompophilia panle (12 mutation )', category: 'أخرى', price_official: 850.00, price: 850.00, consumables_cost: 0.00, price_cost: 500.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 67, code: 'RF', name: 'RF', name_en: 'RF', category: 'أخرى', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 0.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 68, code: 'IRON', name: 'Iron', name_en: 'Iron', category: 'أخرى', price_official: 40.00, price: 40.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 69, code: 'HBELECTROPHO', name: 'Hb Electrophoresis', name_en: 'Hb Electrophoresis', category: 'أخرى', price_official: 150.00, price: 150.00, consumables_cost: 0.00, price_cost: 100.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 70, code: 'RETICCELL', name: 'Retic Cell', name_en: 'Retic Cell', category: 'أخرى', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 71, code: 'INSULIN', name: 'Insulin', name_en: 'Insulin', category: 'الهرمونات', price_official: 150.00, price: 150.00, consumables_cost: 0.00, price_cost: 70.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 72, code: 'HA1C', name: 'HA1C', name_en: 'HA1C', category: 'أخرى', price_official: 60.00, price: 60.00, consumables_cost: 0.00, price_cost: 25.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 73, code: 'BLOODFILIM', name: 'Blood filim', name_en: 'Blood filim', category: 'أخرى', price_official: 100.00, price: 100.00, consumables_cost: 0.00, price_cost: 50.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 74, code: 'BILIROBINTOT', name: 'Bilirobin Total', name_en: 'Bilirobin Total', category: 'أخرى', price_official: 30.00, price: 30.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 75, code: 'BILIROBINDIR', name: 'Bilirobin Direct', name_en: 'Bilirobin Direct', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 76, code: 'GCT', name: 'GCT', name_en: 'GCT', category: 'أخرى', price_official: 50.00, price: 50.00, consumables_cost: 0.00, price_cost: 20.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 77, code: 'GTT', name: 'GTT', name_en: 'GTT', category: 'أخرى', price_official: 70.00, price: 70.00, consumables_cost: 0.00, price_cost: 30.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 78, code: 'ALTGPT', name: 'ALT(GPT)', name_en: 'ALT(GPT)', category: 'تحاليل الدم', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 79, code: 'GGT', name: 'GGT', name_en: 'GGT', category: 'أخرى', price_official: 40.00, price: 40.00, consumables_cost: 0.00, price_cost: 15.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 80, code: 'ALP', name: 'ALP', name_en: 'ALP', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 81, code: 'ALBUMIN', name: 'Albumin', name_en: 'Albumin', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 82, code: 'ASTGOT', name: 'AST (GOT)', name_en: 'AST (GOT)', category: 'أخرى', price_official: 25.00, price: 25.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' },
  { id: 83, code: 'FBS', name: 'FBS', name_en: 'FBS', category: 'أخرى', price_official: 20.00, price: 20.00, consumables_cost: 0.00, price_cost: 10.00, is_l2l: false, kit: null, kit_qty: 0.00, kit_unit: 'وحدة', kit_threshold: 10.00, time_estimate: 'فوري' }
];

async function run() {
  const client = new Client({
    connectionString: 'postgresql://mjcczxsn_admin@127.0.0.1:5432/mjcczxsn_medical_center'
  });
  await client.connect();
  console.log('Connected to DB');

  // 1. Seed departments
  for (const dept of DEPARTMENTS) {
    await client.query(
      `INSERT INTO departments (id, name, short_name, icon, is_custom, sub_item_ids, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name, icon = EXCLUDED.icon`,
      [dept.id, dept.name, dept.short_name, dept.icon, dept.is_custom, dept.sub_item_ids, dept.sort_order]
    );
  }
  console.log('Departments seeded successfully');

  // 2. Seed rad_catalog
  for (const rad of RAD_CATALOG) {
    await client.query(
      `INSERT INTO rad_catalog (id, code, name, device, price, time_val, time_unit, instructions, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, price = EXCLUDED.price`,
      [rad.id, rad.code, rad.name, rad.device, rad.price, rad.time_val, rad.time_unit, rad.instructions, rad.notes]
    );
  }
  console.log('Rad catalog seeded successfully');

  // 3. Seed lab_tests
  for (const test of LAB_TESTS) {
    await client.query(
      `INSERT INTO lab_tests (id, code, name, name_en, category, price_official, price, consumables_cost, price_cost, is_l2l, kit, kit_qty, kit_unit, kit_threshold, time_estimate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, price = EXCLUDED.price`,
      [test.id, test.code, test.name, test.name_en, test.category, test.price_official, test.price, test.consumables_cost, test.price_cost, test.is_l2l, test.kit, test.kit_qty, test.kit_unit, test.kit_threshold, test.time_estimate]
    );
  }
  console.log('Lab tests seeded successfully');

  // 4. Seed sidebar_settings
  await client.query(
    `INSERT INTO sidebar_settings (id, hidden_sections, hide_revenue_from_staff)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [1, [], true]
  );
  console.log('Sidebar settings seeded successfully');

  // 5. Update sequence numbers
  await client.query(`SELECT pg_catalog.setval('public.admin_accounts_id_seq', 34, true)`);
  await client.query(`SELECT pg_catalog.setval('public.diagnoses_catalog_id_seq', 150, true)`);
  await client.query(`SELECT pg_catalog.setval('public.lab_tests_id_seq', 83, true)`);
  await client.query(`SELECT pg_catalog.setval('public.rad_catalog_id_seq', 8, true)`);
  await client.query(`SELECT pg_catalog.setval('public.sidebar_settings_id_seq', 1, true)`);
  console.log('Sequences updated successfully');

  await client.end();
  console.log('Local seed complete');
}

run().catch(console.error);
