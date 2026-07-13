import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin, requireFinancialAuth } from '../middleware/adminAuth.js';
import { sendSMS } from '../services/smsService.js';

const router = Router();

// BUG-11 fix: removed GET /clear-done/:dept — GET must be side-effect-free.
// BUG-15 fix: requireAdmin added to all mutation routes.

router.get('/', async (req, res) => {
  try {
    const { dept } = req.query;
    const q = dept
      ? 'SELECT * FROM queues WHERE dept=$1 ORDER BY created_at ASC'
      : 'SELECT * FROM queues ORDER BY created_at ASC';
    const vals = dept ? [dept] : [];
    const { rows } = await pool.query(q, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireFinancialAuth, async (req, res) => {
  try {
    const { dept, patient_name, patient_num, phone, dest_dept, notes, items, queue_time, status } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO queues (dept,patient_name,patient_num,phone,dest_dept,notes,items,queue_time,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [dept, patient_name, patient_num ?? null, phone ?? null, dest_dept ?? null, notes ?? null,
       JSON.stringify(items ?? []), queue_time ?? null, status ?? 'pending']
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM queues WHERE id=$1', [req.params.id]);
    if (!existingRows[0]) return res.status(404).json({ error: 'not found' });
    const current = existingRows[0];
    const status = req.body.status ?? current.status;
    const results = req.body.results !== undefined ? JSON.stringify(req.body.results) : current.results;
    const { rows } = await pool.query(
      'UPDATE queues SET status=$1, results=$2 WHERE id=$3 RETURNING *',
      [status, results, req.params.id]
    );
    const entry = rows[0];
    res.json(entry);

    // ── SMS trigger: lab results ready ────────────────────────────────────
    if (entry && status === 'done' && entry.dept === 'lab' && entry.phone) {
      const msg = `عزيزي/عزيزتي ${entry.patient_name}، نتائج فحوصاتك المخبرية جاهزة الآن، يمكنك مراجعة مركز الدكتور مهند سليمان جابر لاستلامها. شكراً لثقتكم.`;
      sendSMS(entry.phone, msg).then(r => {
        if (!r.ok && !r.skipped) console.warn(`[SMS] lab results notify failed — patient=${entry.patient_name} err=${r.error}`);
      }).catch(() => {});
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/clear-done/:dept', requireFinancialAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM queues WHERE dept=$1 AND status='done'", [req.params.dept]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireFinancialAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM queues WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
