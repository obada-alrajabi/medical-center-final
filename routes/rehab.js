import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// ─── Rehab Services Catalog ─────────────────────────────────────────────────
router.get('/services', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rehab_services ORDER BY category,name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/services', requireAdmin, async (req, res) => {
  const { name, name_en, category, price, price_cost } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO rehab_services (name,name_en,category,price,price_cost)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, name_en ?? '', category ?? 'تأهيل عظمي ومفصلي', price ?? 0, price_cost ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/services/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM rehab_services WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { name, name_en, category, price, price_cost } = req.body;
    const { rows } = await pool.query(
      `UPDATE rehab_services SET name=$1,name_en=$2,category=$3,price=$4,price_cost=$5
       WHERE id=$6 RETURNING *`,
      [
        name       !== undefined ? name       : c.name,
        name_en    !== undefined ? name_en    : c.name_en,
        category   !== undefined ? category   : c.category,
        price      !== undefined ? price      : c.price,
        price_cost !== undefined ? price_cost : c.price_cost,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/services/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM rehab_services WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rehab Plans ────────────────────────────────────────────────────────────
router.get('/plans', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rehab_plans ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG-14 fix: requireAdmin added — plan creation/edit touches financial fields
router.post('/plans', requireAdmin, async (req, res) => {
  const { patient_id, patient_name, diagnosis, total_sessions, completed_sessions,
          price_per_session, plan_price, pricing_mode, specialist, status, start_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO rehab_plans
         (patient_id,patient_name,diagnosis,total_sessions,completed_sessions,
          price_per_session,plan_price,pricing_mode,specialist,status,start_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_id, patient_name, diagnosis, total_sessions ?? 1, completed_sessions ?? 0,
       price_per_session ?? 0, plan_price ?? 0, pricing_mode ?? 'per-session',
       specialist ?? null, status ?? 'active', start_date ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/plans/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM rehab_plans WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { diagnosis, total_sessions, completed_sessions, price_per_session,
            plan_price, pricing_mode, specialist, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE rehab_plans
       SET diagnosis=$1,total_sessions=$2,completed_sessions=$3,price_per_session=$4,
           plan_price=$5,pricing_mode=$6,specialist=$7,status=$8
       WHERE id=$9 RETURNING *`,
      [
        diagnosis          !== undefined ? diagnosis          : c.diagnosis,
        total_sessions     !== undefined ? total_sessions     : c.total_sessions,
        completed_sessions !== undefined ? completed_sessions : c.completed_sessions,
        price_per_session  !== undefined ? price_per_session  : c.price_per_session,
        plan_price         !== undefined ? plan_price         : c.plan_price,
        pricing_mode       !== undefined ? pricing_mode       : c.pricing_mode,
        specialist         !== undefined ? specialist         : c.specialist,
        status             !== undefined ? status             : c.status,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/plans/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM rehab_plans WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rehab Queue Entries (session attendance) ───────────────────────────────
router.get('/queue', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rehab_queue_entries ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/queue', async (req, res) => {
  const { patient_id, patient_name, plan_id, diagnosis, specialist,
          session_number, session_time, session_date, status } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO rehab_queue_entries
         (patient_id,patient_name,plan_id,diagnosis,specialist,
          session_number,session_time,session_date,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, patient_name, plan_id ?? null, diagnosis ?? null, specialist ?? null,
       session_number ?? 1, session_time ?? null, session_date ?? null, status ?? 'pending']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/queue/:id', async (req, res) => {
  const { status, therapist_notes, session_result, gross_motor_skills, fine_motor_skills, sensory_condition, adl_activities } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE rehab_queue_entries
       SET status=$1, therapist_notes=$2, session_result=$3,
           gross_motor_skills=$4, fine_motor_skills=$5,
           sensory_condition=$6, adl_activities=$7
       WHERE id=$8 RETURNING *`,
      [status, therapist_notes ?? null, session_result ?? null,
       gross_motor_skills ?? null, fine_motor_skills ?? null,
       sensory_condition ?? null, adl_activities ?? null,
       req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/queue/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM rehab_queue_entries WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
