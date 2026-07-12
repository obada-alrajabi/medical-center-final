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
