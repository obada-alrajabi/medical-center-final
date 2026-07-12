import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM surgery_clinic_inventory WHERE 1=1';
    const params = [];
    if (category) { params.push(category); sql += ` AND category=$${params.length}`; }
    sql += ' ORDER BY name';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM surgery_clinic_inventory WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, category, qty, threshold, expiry_date, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO surgery_clinic_inventory (name,category,qty,threshold,expiry_date,notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, category ?? null, qty ?? 0, threshold ?? 0, expiry_date ?? null, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM surgery_clinic_inventory WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { name, category, qty, threshold, expiry_date, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE surgery_clinic_inventory SET name=$1,category=$2,qty=$3,threshold=$4,expiry_date=$5,notes=$6
       WHERE id=$7 RETURNING *`,
      [
        name        !== undefined ? name        : c.name,
        category    !== undefined ? category    : c.category,
        qty         !== undefined ? qty         : c.qty,
        threshold   !== undefined ? threshold   : c.threshold,
        expiry_date !== undefined ? expiry_date : c.expiry_date,
        notes       !== undefined ? notes       : c.notes,
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
    const { rowCount } = await pool.query('DELETE FROM surgery_clinic_inventory WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
