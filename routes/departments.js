import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM departments ORDER BY sort_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM departments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { id, name, short_name, icon, is_custom, sub_item_ids, sort_order } = req.body;
  try {
    // ── منع إعادة استخدام معرّف قسم كان لقسم محذوف سابقاً: معرّف القسم
    //    (id) نص حر (slug) بيتولّد من اسم القسم، وما إله قيد تفرّد تاريخي —
    //    فلو انحذف قسم وانعمل قسم جديد بنفس الاسم بالضبط لاحقاً، رح ياخد
    //    نفس المعرّف ويورث كل البيانات القديمة المرتبطة فيه (خزنة، ديون،
    //    جلسات، مرضى، فواتير، طلبات شراء، سندات...) وكأنها له — نفس خلل
    //    تكرار رقم المريض المكتشَف سابقاً، بس على نطاق أوسع بكثير. فحص
    //    شامل هون قبل الإنشاء: إذا المعرّف لسا مرتبط بأي بيانات تاريخية
    //    بأي مكان بالنظام، نرفض الإنشاء ونطلب اسم مختلف. ──
    const { rows: conflictRows } = await pool.query(
      `SELECT 1 FROM drawers WHERE dept=$1
       UNION ALL SELECT 1 FROM drawer_transactions WHERE dept=$1
       UNION ALL SELECT 1 FROM debts WHERE dept=$1
       UNION ALL SELECT 1 FROM patient_debts WHERE dept=$1
       UNION ALL SELECT 1 FROM sessions WHERE dept=$1
       UNION ALL SELECT 1 FROM patient_sessions WHERE dept=$1
       UNION ALL SELECT 1 FROM patients WHERE dept=$1
       UNION ALL SELECT 1 FROM invoices WHERE dept=$1
       UNION ALL SELECT 1 FROM purchase_requests WHERE dept=$1
       UNION ALL SELECT 1 FROM receipt_vouchers WHERE dept=$1
       UNION ALL SELECT 1 FROM payment_vouchers WHERE dept=$1
       UNION ALL SELECT 1 FROM employees WHERE dept=$1
       UNION ALL SELECT 1 FROM attendance_records WHERE dept=$1
       LIMIT 1`,
      [id]
    );
    if (conflictRows.length) {
      return res.status(409).json({ error: 'هذا المعرّف مستخدَم من قسم سابق (محذوف) وما زال مرتبطاً ببيانات قديمة بالنظام — الرجاء اختيار اسم مختلف للقسم الجديد' });
    }
    const { rows } = await pool.query(
      `INSERT INTO departments (id, name, short_name, icon, is_custom, sub_item_ids, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, name, short_name, icon ?? null, is_custom ?? false, sub_item_ids ?? null, sort_order ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, short_name, icon, is_custom, sub_item_ids, sort_order } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE departments SET name=$1,short_name=$2,icon=$3,is_custom=$4,sub_item_ids=$5,sort_order=$6
       WHERE id=$7 RETURNING *`,
      [name, short_name, icon ?? null, is_custom ?? false, sub_item_ids ?? null, sort_order ?? 0, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM departments WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
