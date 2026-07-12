-- ══════════════════════════════════════════════════════════════════════════════
-- سكريبت التصفير الشامل لبيانات النظام المالي
-- مركز وعيادة الدكتور مهند سليمان جابر
-- الاستخدام: تُنفَّذ مرة واحدة فقط عند بدء التشغيل الفعلي للنظام
-- تحذير: هذه العملية لا يمكن التراجع عنها — قم بعمل نسخة احتياطية أولاً
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. تصفير الجرارات (الصناديق) ─────────────────────────────────────────────
DELETE FROM drawer_transactions;
UPDATE drawers SET balance = 0, updated_at = NOW();

-- ── 2. حذف سندات القبض والصرف ────────────────────────────────────────────────
DELETE FROM receipt_vouchers;
DELETE FROM payment_vouchers;

-- ── 3. حذف الديون والمديونيات ────────────────────────────────────────────────
DELETE FROM debts;
DELETE FROM external_debts;

-- ── 4. حذف طلبات الشراء وبنودها ─────────────────────────────────────────────
DELETE FROM purchase_request_items;
DELETE FROM purchase_requests;

-- ── 5. تصفير سلف الموظفين وطلبات السلف ──────────────────────────────────────
DELETE FROM employee_advances;
DELETE FROM staff_advance_requests;

-- ── 6. حذف الفواتير ──────────────────────────────────────────────────────────
DELETE FROM invoices;

-- ── 7. حذف سجلات جلسات المرضى (الزيارات والأعمال الطبية) ────────────────────
-- ملاحظة: يتضمن هذا حذف تشخيصات الجلسات والأدوية والإحالات المخبرية والشعاعية
DELETE FROM session_diagnoses;
DELETE FROM session_medications;
DELETE FROM session_lab_refs;
DELETE FROM session_rad_refs;
DELETE FROM sessions;

-- ── 8. حذف سجلات المرضى ───────────────────────────────────────────────────────
-- قم بإلغاء تعليق السطر التالي إذا أردت حذف سجلات المرضى أيضاً
-- DELETE FROM patient_delete_requests;
-- DELETE FROM patients;

-- ── 9. إعادة تعيين تسلسلات الأرقام (Sequences) لتبدأ من 1 ──────────────────
-- قم بتعديل أسماء sequences حسب ما هو موجود في قاعدة البيانات لديك
-- DO $$
-- DECLARE seq text;
-- BEGIN
--   FOR seq IN SELECT sequence_name FROM information_schema.sequences
--              WHERE sequence_schema = 'public' LOOP
--     EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq);
--   END LOOP;
-- END $$;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- للتحقق من النتيجة بعد التنفيذ:
-- SELECT 'drawer_transactions' AS tbl, COUNT(*) FROM drawer_transactions
-- UNION ALL SELECT 'receipt_vouchers', COUNT(*) FROM receipt_vouchers
-- UNION ALL SELECT 'payment_vouchers', COUNT(*) FROM payment_vouchers
-- UNION ALL SELECT 'debts', COUNT(*) FROM debts
-- UNION ALL SELECT 'purchase_requests', COUNT(*) FROM purchase_requests
-- UNION ALL SELECT 'employee_advances', COUNT(*) FROM employee_advances
-- UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
-- UNION ALL SELECT 'sessions', COUNT(*) FROM sessions;
-- ══════════════════════════════════════════════════════════════════════════════
