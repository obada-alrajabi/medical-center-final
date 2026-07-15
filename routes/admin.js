import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Allow-list of every table currently defined in schema.sql.
// Any table not in this list can never be targeted by the generic
// delete-all endpoint below, regardless of what the client sends.
const ALLOWED_TABLES = [
  'admin_accounts',
  'attendance_records',
  'debts',
  'departments',
  'diagnoses_catalog',
  'drawer_transactions',
  'drawers',
  'employee_advances',
  'employees',
  'external_debts',
  'insurance_companies',
  'inventory_items',
  'invoices',
  'lab_inventory',
  'lab_inventory_params',
  'lab_inventory_tests',
  'lab_test_consumables',
  'lab_test_normal_ranges',
  'lab_tests',
  'patient_debts',
  'patient_delete_requests',
  'patient_reminders',
  'patient_sessions',
  'patients',
  'payment_vouchers',
  'print_settings',
  'purchase_request_items',
  'purchase_request_payments',
  'purchase_requests',
  'queues',
  'rad_catalog',
  'rad_images',
  'receipt_vouchers',
  'rehab_plans',
  'rehab_queue_entries',
  'rehab_services',
  'session_diagnoses',
  'session_lab_refs',
  'session_medications',
  'session_rad_refs',
  'sessions',
  'sidebar_settings',
  'sms_settings',
  'staff_advance_requests',
  'staff_dept_permissions',
  'staff_members',
  'staff_notice_reads',
  'staff_notices',
  'suppliers',
  'surgery_clinic_inventory',
  'surgery_clinic_items',
];

// ─── List every table with its current row count ────────────────────────────
// Each table is queried independently so that a single missing/renamed table
// (e.g. schema drift between environments) never breaks the whole list.
router.get('/tables', requireAdmin, async (req, res) => {
  const results = [];
  for (const table of ALLOWED_TABLES) {
    try {
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      results.push({ table, count: rows[0].count });
    } catch (err) {
      // Table doesn't exist on this database yet — skip it instead of failing everything.
    }
  }
  res.json(results);
});

// ─── Generic FK-aware cascade resolver ───────────────────────────────────────
// المشكلة الأصلية: PRE_DELETE_STEPS كانت لائحة يدوية بتغطي بس جدولين
// (patients و purchase_requests) — أي جدول تاني عنده جداول فرعية بترتبط فيه
// بقيد NO ACTION (مش CASCADE) كان زر حذفه بيفشل دايماً بخطأ قيد مفتاحي أجنبي
// (foreign key violation)، أوضح مثال: جدول "الأقسام" (departments) مرتبط فيه
// 16 جدول تقريباً (المرضى، الجلسات، الموظفين، الصناديق...) وما كان في أي خطوة
// تمهيدية لحذفهم قبله. بدل ما نكتب لائحة يدوية لكل جدول (بتصير قديمة كل ما
// يتغيّر السكيما)، منستعلم information_schema وقت التنفيذ عشان نلاقي *كل*
// الجداول اللي بترجع لهذا الجدول بقيد مفتاحي أجنبي، ومنحذف بياناتها أولاً
// (بشكل تكراري لو هي نفسها عندها جداول ترجع إلها)، وبعدين نحذف الجدول
// المطلوب. القيود يلي فيها ON DELETE CASCADE أصلاً بتتصفى تلقائياً من
// بوستجرس فما في داعي نلمسها يدوياً. ──
async function findReferencingTables(client, tableName) {
  const { rows } = await client.query(
    `SELECT tc.table_name AS child_table, rc.delete_rule
     FROM information_schema.table_constraints tc
     JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name AND tc.constraint_schema = rc.constraint_schema
     JOIN information_schema.constraint_column_usage ccu
       ON rc.unique_constraint_name = ccu.constraint_name AND rc.unique_constraint_schema = ccu.constraint_schema
     WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = $1 AND tc.table_schema = 'public'`,
    [tableName]
  );
  return rows;
}

async function cascadeDeleteAll(client, table, visited, deletedCounts) {
  if (visited.has(table)) return;
  visited.add(table);
  const refs = await findReferencingTables(client, table);
  for (const ref of refs) {
    if (ref.child_table === table) continue; // self-referencing FK — no-op guard
    if (ref.delete_rule !== 'CASCADE') {
      await cascadeDeleteAll(client, ref.child_table, visited, deletedCounts);
    }
    // CASCADE constraints are handled automatically by Postgres when the
    // parent row is deleted below — no manual pre-step needed for those.
  }
  const { rowCount } = await client.query(`DELETE FROM ${table}`);
  deletedCounts[table] = (deletedCounts[table] || 0) + rowCount;
}

// ─── Delete ALL rows from a single table (allow-listed only) ────────────────
router.delete('/tables/:table', requireAdmin, async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'اسم جدول غير مسموح به' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deletedCounts = {};
    await cascadeDeleteAll(client, table, new Set(), deletedCounts);
    await client.query('COMMIT');
    res.json({ success: true, table, deleted: deletedCounts[table] || 0, cascaded: deletedCounts });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── Reset all financial transactions (preserves master data) ───────────────
// Clears: drawer_transactions, drawer balances, debts, patient_debts,
// external_debts, employee_advances, staff_advance_requests,
// receipt_vouchers, payment_vouchers, purchase_request_items,
// purchase_requests, invoices.
// Does NOT touch: patients, sessions, employees, staff, catalogs, settings.
router.post('/reset-financials', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Order matters: child tables first, then parents
    const steps = [
      'DELETE FROM drawer_transactions',
      'DELETE FROM patient_debts',
      'DELETE FROM external_debts',
      'DELETE FROM debts',
      'DELETE FROM employee_advances',
      'DELETE FROM staff_advance_requests',
      'DELETE FROM receipt_vouchers',
      'DELETE FROM payment_vouchers',
      'DELETE FROM purchase_request_items',
      'DELETE FROM purchase_requests',
      'DELETE FROM invoices',
      // Reset drawer balances to zero (keep the drawer rows themselves)
      'UPDATE drawers SET balance = 0, opening_balance = 0, opening_balance_date = NULL',
    ];

    const deleted = {};
    for (const sql of steps) {
      const r = await client.query(sql);
      const table = sql.match(/(?:FROM|UPDATE)\s+(\w+)/i)?.[1] || '?';
      deleted[table] = r.rowCount ?? 0;
    }

    await client.query('COMMIT');
    res.json({ success: true, deleted, message: 'تم تصفير كافة المعاملات المالية بنجاح.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ─── Category-based bulk delete (patients | financials | all) ───────────────
// patients  → sessions sub-tables, sessions, patients, patient_debts, debts
// financials → same as reset-financials (drawer_transactions, vouchers, etc.)
// all        → both categories
router.post('/execute-delete', requireAdmin, async (req, res) => {
  const { targetCategory } = req.body;
  const allowed = ['patients', 'financials', 'all'];
  if (!allowed.includes(targetCategory)) {
    return res.status(400).json({ success: false, message: 'targetCategory غير مسموح به' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleted = {};

    if (targetCategory === 'patients' || targetCategory === 'all') {
      // Order is critical: child tables with FK (NO ACTION) → patients must come before patients.
      // debts.patient_id and patient_delete_requests.patient_id both have NO ACTION FK to patients.
      const patientSteps = [
        'DELETE FROM patient_delete_requests',
        'DELETE FROM patient_sessions',
        'DELETE FROM session_diagnoses',
        'DELETE FROM session_medications',
        'DELETE FROM session_lab_refs',
        'DELETE FROM session_rad_refs',
        'DELETE FROM sessions',
        'DELETE FROM patient_sessions',
        'DELETE FROM patient_debts',
        'DELETE FROM patient_delete_requests',
        'DELETE FROM debts WHERE patient_id IS NOT NULL',
        'DELETE FROM patients',
      ];
      for (const sql of patientSteps) {
        const r = await client.query(sql);
        const table = sql.match(/FROM\s+(\w+)/i)?.[1] || '?';
        deleted[table] = r.rowCount ?? 0;
      }
    }

    if (targetCategory === 'financials' || targetCategory === 'all') {
      const finSteps = [
        'DELETE FROM drawer_transactions',
        'DELETE FROM patient_debts',
        'DELETE FROM external_debts',
        'DELETE FROM debts',
        'DELETE FROM employee_advances',
        'DELETE FROM staff_advance_requests',
        'DELETE FROM receipt_vouchers',
        'DELETE FROM payment_vouchers',
        'DELETE FROM purchase_request_items',
        'DELETE FROM purchase_requests',
        'DELETE FROM invoices',
        'UPDATE drawers SET balance = 0, opening_balance = 0, opening_balance_date = NULL',
      ];
      for (const sql of finSteps) {
        const r = await client.query(sql);
        const table = sql.match(/(?:FROM|UPDATE)\s+(\w+)/i)?.[1] || '?';
        if (!deleted[table]) deleted[table] = r.rowCount ?? 0;
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, deleted, message: 'تم تنفيذ عملية الحذف بنجاح.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ─── Delete ONE row by id from any allow-listed table ───────────────────────
// Table name is validated against ALLOWED_TABLES; id is passed as a
// parameterised query argument so there is no SQL-injection risk.
router.delete('/records/:table/:id', requireAdmin, async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ success: false, message: 'اسم جدول غير مسموح به' });
  }
  try {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }
    res.json({ success: true, table, deleted: id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
export default router;
