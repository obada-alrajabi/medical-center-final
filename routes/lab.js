import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// ─── Lab Tests ─────────────────────────────────────────────────────────────
router.get('/tests', async (req, res) => {
  try {
    const { category, q } = req.query;
    let sql = `
      SELECT lt.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', lnr.id,
            'param', lnr.param,
            'unit', lnr.unit,
            'min', lnr.min_val,
            'max', lnr.max_val,
            'note', lnr.note
          )) FROM lab_test_normal_ranges lnr WHERE lnr.test_id = lt.id),
          '[]'::json
        ) AS "normalRanges"
      FROM lab_tests lt WHERE 1=1
    `;
    const params = [];
    if (category) { params.push(category); sql += ` AND lt.category=$${params.length}`; }
    if (q) { params.push(`%${q}%`); sql += ` AND (lt.name ILIKE $${params.length} OR lt.code ILIKE $${params.length})`; }
    sql += ' ORDER BY lt.category, lt.name';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tests/:id', async (req, res) => {
  try {
    const [test, ranges] = await Promise.all([
      pool.query('SELECT * FROM lab_tests WHERE id=$1', [req.params.id]),
      pool.query('SELECT * FROM lab_test_normal_ranges WHERE test_id=$1 ORDER BY id', [req.params.id])
    ]);
    if (!test.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...test.rows[0], normal_ranges: ranges.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tests', requireAdmin, async (req, res) => {
  const {
    code, name, name_en, category, price_official, price,
    consumables_cost, price_cost, is_l2l, kit, kit_qty, kit_unit,
    kit_threshold, kit_inventory_id, time_estimate, normalRanges
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO lab_tests
       (code,name,name_en,category,price_official,price,consumables_cost,price_cost,
        is_l2l,kit,kit_qty,kit_unit,kit_threshold,kit_inventory_id,time_estimate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [code ?? null, name, name_en ?? null, category ?? null, price_official ?? 0,
       price ?? 0, consumables_cost ?? 0, price_cost ?? 0, is_l2l ?? false,
       kit ?? null, kit_qty ?? 0, kit_unit ?? null, kit_threshold ?? 0, kit_inventory_id ?? null, time_estimate ?? null]
    );
    const createdTest = rows[0];
    const rangesToInsert = normalRanges || req.body.normal_ranges;
    if (rangesToInsert && Array.isArray(rangesToInsert)) {
      for (const r of rangesToInsert) {
        if (!r.param) continue;
        await client.query(
          `INSERT INTO lab_test_normal_ranges (test_id,param,unit,min_val,max_val,note)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [createdTest.id, r.param, r.unit ?? null, r.min ?? r.min_val ?? null, r.max ?? r.max_val ?? null, r.note ?? null]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(createdTest);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/tests/:id', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: curr } = await client.query('SELECT * FROM lab_tests WHERE id=$1', [req.params.id]);
    if (!curr.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const c = curr[0];
    const {
      code, name, name_en, category, price_official, price,
      consumables_cost, price_cost, is_l2l, kit, kit_qty, kit_unit,
      kit_threshold, kit_inventory_id, time_estimate, normalRanges
    } = req.body;
    const { rows } = await client.query(
      `UPDATE lab_tests SET code=$1,name=$2,name_en=$3,category=$4,price_official=$5,
       price=$6,consumables_cost=$7,price_cost=$8,is_l2l=$9,kit=$10,kit_qty=$11,
       kit_unit=$12,kit_threshold=$13,kit_inventory_id=$14,time_estimate=$15 WHERE id=$16 RETURNING *`,
      [
        code             !== undefined ? code             : c.code,
        name             !== undefined ? name             : c.name,
        name_en          !== undefined ? name_en          : c.name_en,
        category         !== undefined ? category         : c.category,
        price_official   !== undefined ? price_official   : c.price_official,
        price            !== undefined ? price            : c.price,
        consumables_cost !== undefined ? consumables_cost : c.consumables_cost,
        price_cost       !== undefined ? price_cost       : c.price_cost,
        is_l2l           !== undefined ? is_l2l           : c.is_l2l,
        kit              !== undefined ? kit              : c.kit,
        kit_qty          !== undefined ? kit_qty          : c.kit_qty,
        kit_unit         !== undefined ? kit_unit         : c.kit_unit,
        kit_threshold    !== undefined ? kit_threshold    : c.kit_threshold,
        kit_inventory_id !== undefined ? kit_inventory_id : c.kit_inventory_id,
        time_estimate    !== undefined ? time_estimate    : c.time_estimate,
        req.params.id,
      ]
    );
    const rangesToInsert = normalRanges || req.body.normal_ranges;
    if (rangesToInsert !== undefined && Array.isArray(rangesToInsert)) {
      await client.query('DELETE FROM lab_test_normal_ranges WHERE test_id=$1', [req.params.id]);
      for (const r of rangesToInsert) {
        if (!r.param) continue;
        await client.query(
          `INSERT INTO lab_test_normal_ranges (test_id,param,unit,min_val,max_val,note)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [req.params.id, r.param, r.unit ?? null, r.min ?? r.min_val ?? null, r.max ?? r.max_val ?? null, r.note ?? null]
        );
      }
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/tests/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM lab_tests WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Lab Test Normal Ranges ────────────────────────────────────────────────
router.get('/tests/:test_id/ranges', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM lab_test_normal_ranges WHERE test_id=$1 ORDER BY id', [req.params.test_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tests/:test_id/ranges', requireAdmin, async (req, res) => {
  const { param, unit, min_val, max_val, note } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO lab_test_normal_ranges (test_id,param,unit,min_val,max_val,note)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.test_id, param, unit ?? null, min_val ?? null, max_val ?? null, note ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/ranges/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM lab_test_normal_ranges WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { param, unit, min_val, max_val, note } = req.body;
    const { rows } = await pool.query(
      `UPDATE lab_test_normal_ranges SET param=$1,unit=$2,min_val=$3,max_val=$4,note=$5
       WHERE id=$6 RETURNING *`,
      [
        param   !== undefined ? param   : c.param,
        unit    !== undefined ? unit    : c.unit,
        min_val !== undefined ? min_val : c.min_val,
        max_val !== undefined ? max_val : c.max_val,
        note    !== undefined ? note    : c.note,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/ranges/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM lab_test_normal_ranges WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Lab Inventory ─────────────────────────────────────────────────────────
router.get('/inventory', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT li.*,
        CASE WHEN li.qty <= 0 THEN 'out' WHEN li.qty <= li.threshold THEN 'low' ELSE 'ok' END AS status,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id',lit.id,'test_name',lit.test_name)) FILTER (WHERE lit.id IS NOT NULL),'[]') AS tests,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id',lip.id,'name',lip.name,'unit',lip.unit,'min_val',lip.min_val,'max_val',lip.max_val)) FILTER (WHERE lip.id IS NOT NULL),'[]') AS params
       FROM lab_inventory li
       LEFT JOIN lab_inventory_tests lit ON lit.inventory_id=li.id
       LEFT JOIN lab_inventory_params lip ON lip.inventory_id=li.id
       GROUP BY li.id ORDER BY li.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/:id', async (req, res) => {
  try {
    const [inv, tests, params] = await Promise.all([
      pool.query('SELECT * FROM lab_inventory WHERE id=$1', [req.params.id]),
      pool.query('SELECT * FROM lab_inventory_tests WHERE inventory_id=$1', [req.params.id]),
      pool.query('SELECT * FROM lab_inventory_params WHERE inventory_id=$1', [req.params.id])
    ]);
    if (!inv.rows.length) return res.status(404).json({ error: 'Not found' });
    const item = inv.rows[0];
    item.status = item.qty <= 0 ? 'out' : item.qty <= item.threshold ? 'low' : 'ok';
    res.json({ ...item, tests: tests.rows, params: params.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory', requireAdmin, async (req, res) => {
  const { name, item_type, qty, threshold, unit, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO lab_inventory (name,item_type,qty,threshold,unit,notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, item_type ?? null, qty ?? 0, threshold ?? 0, unit ?? null, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/inventory/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM lab_inventory WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { name, item_type, qty, threshold, unit, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE lab_inventory SET name=$1,item_type=$2,qty=$3,threshold=$4,unit=$5,notes=$6
       WHERE id=$7 RETURNING *`,
      [
        name      !== undefined ? name      : c.name,
        item_type !== undefined ? item_type : c.item_type,
        qty       !== undefined ? qty       : c.qty,
        threshold !== undefined ? threshold : c.threshold,
        unit      !== undefined ? unit      : c.unit,
        notes     !== undefined ? notes     : c.notes,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/inventory/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM lab_inventory WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Lab Inventory Tests / Params sub-routes ───────────────────────────────
router.post('/inventory/:inventory_id/tests', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO lab_inventory_tests (inventory_id,test_name) VALUES ($1,$2) RETURNING *`,
      [req.params.inventory_id, req.body.test_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/inventory/tests/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM lab_inventory_tests WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/:inventory_id/params', requireAdmin, async (req, res) => {
  const { name, unit, min_val, max_val } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO lab_inventory_params (inventory_id,name,unit,min_val,max_val)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.inventory_id, name, unit ?? null, min_val ?? null, max_val ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/inventory/params/:id', requireAdmin, async (req, res) => {
  const { name, unit, min_val, max_val } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE lab_inventory_params SET name=$1,unit=$2,min_val=$3,max_val=$4 WHERE id=$5 RETURNING *`,
      [name, unit ?? null, min_val ?? null, max_val ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/inventory/params/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM lab_inventory_params WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
