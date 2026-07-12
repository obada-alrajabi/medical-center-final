import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { device, q } = req.query;
    let sql = 'SELECT * FROM rad_catalog WHERE 1=1';
    const params = [];
    if (device) { params.push(device); sql += ` AND device=$${params.length}`; }
    if (q) { params.push(`%${q}%`); sql += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`; }
    sql += ' ORDER BY device, name';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rad_catalog WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { code, name, device, price, time_val, time_unit, instructions, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO rad_catalog (code,name,device,price,time_val,time_unit,instructions,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code ?? null, name, device ?? null, price ?? 0,
       time_val ?? null, time_unit ?? null, instructions ?? null, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM rad_catalog WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { code, name, device, price, time_val, time_unit, instructions, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE rad_catalog SET code=$1,name=$2,device=$3,price=$4,time_val=$5,
       time_unit=$6,instructions=$7,notes=$8 WHERE id=$9 RETURNING *`,
      [
        code         !== undefined ? code         : c.code,
        name         !== undefined ? name         : c.name,
        device       !== undefined ? device       : c.device,
        price        !== undefined ? price        : c.price,
        time_val     !== undefined ? time_val     : c.time_val,
        time_unit    !== undefined ? time_unit    : c.time_unit,
        instructions !== undefined ? instructions : c.instructions,
        notes        !== undefined ? notes        : c.notes,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM rad_catalog WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
