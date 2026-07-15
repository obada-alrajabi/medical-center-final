import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin, requireFinancialAuth } from '../middleware/adminAuth.js';

const router = Router();

// ─── Invoices ──────────────────────────────────────────────────────────────
router.get('/invoices', async (req, res) => {
  try {
    const { dept, status, from, to, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    if (dept)   { params.push(dept);   sql += ` AND dept=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND status=$${params.length}`; }
    if (from)   { params.push(from);   sql += ` AND date>=$${params.length}::date`; }
    if (to)     { params.push(to);     sql += ` AND date<=$${params.length}::date`; }
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY date DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices', requireFinancialAuth, async (req, res) => {
  const { id, company, date, total, paid, status, dept, notes, claim_no, patient_id, patient_name } = req.body;
  const t = total ?? 0; const p = paid ?? 0;
  try {
    const { rows } = await pool.query(
      `INSERT INTO invoices (id,company,date,total,paid,status,dept,notes,claim_no,patient_id,patient_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, company, date, t, p, status ?? 'unpaid', dept ?? null, notes ?? null, claim_no ?? null, patient_id ?? null, patient_name ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/invoices/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { company, date, total, paid, status, dept, notes, claim_no, patient_id, patient_name } = req.body;
    const { rows } = await pool.query(
      `UPDATE invoices SET company=$1,date=$2,total=$3,paid=$4,status=$5,dept=$6,notes=$7,claim_no=$8,patient_id=$9,patient_name=$10,updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [
        company !== undefined ? company : c.company,
        date    !== undefined ? date    : c.date,
        total   !== undefined ? total   : c.total,
        paid    !== undefined ? paid    : c.paid,
        status  !== undefined ? status  : c.status,
        dept    !== undefined ? dept    : c.dept,
        notes   !== undefined ? notes   : c.notes,
        claim_no     !== undefined ? claim_no     : c.claim_no,
        patient_id   !== undefined ? patient_id   : c.patient_id,
        patient_name !== undefined ? patient_name : c.patient_name,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/invoices/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Debts ─────────────────────────────────────────────────────────────────
router.get('/debts', async (req, res) => {
  try {
    const { dept, patient_id, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM debts WHERE 1=1';
    const params = [];
    if (dept)       { params.push(dept);       sql += ` AND dept=$${params.length}`; }
    if (patient_id) { params.push(patient_id); sql += ` AND patient_id=$${params.length}`; }
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/debts/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM debts WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/debts', requireFinancialAuth, async (req, res) => {
  const { patient, patient_id, dept, amount, date, phone, sms_sent } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO debts (patient,patient_id,dept,amount,date,phone,sms_sent)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [patient, patient_id ?? null, dept ?? null, amount ?? 0, date ?? null, phone ?? null, sms_sent ?? false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/debts/:id', requireFinancialAuth, async (req, res) => {
  try {
    // Fetch current row first — caller may send only partial fields (e.g. only {amount})
    const { rows: curr } = await pool.query('SELECT * FROM debts WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { patient, patient_id, dept, amount, date, phone, sms_sent } = req.body;
    const { rows } = await pool.query(
      `UPDATE debts SET patient=$1,patient_id=$2,dept=$3,amount=$4,date=$5,phone=$6,sms_sent=$7,updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [
        patient    !== undefined ? patient    : c.patient,
        patient_id !== undefined ? patient_id : c.patient_id,
        dept       !== undefined ? dept       : c.dept,
        amount     !== undefined ? amount     : c.amount,
        date       !== undefined ? date       : c.date,
        phone      !== undefined ? phone      : c.phone,
        sms_sent   !== undefined ? sms_sent   : c.sms_sent,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /debts/:id]', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/debts/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM debts WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── External Debts ────────────────────────────────────────────────────────
router.get('/external-debts', async (req, res) => {
  try {
    const { direction, status, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM external_debts WHERE 1=1';
    const params = [];
    if (direction) { params.push(direction); sql += ` AND direction=$${params.length}`; }
    if (status)    { params.push(status);    sql += ` AND status=$${params.length}`; }
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/external-debts/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM external_debts WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/external-debts', requireFinancialAuth, async (req, res) => {
  // Accept `dir` (frontend field name) or `direction` (DB column name)
  const direction = req.body.direction ?? req.body.dir;
  const { party, amount, date, note, status } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO external_debts (direction,party,amount,date,note,status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [direction, party, amount, date ?? null, note ?? null, status ?? 'pending']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/external-debts/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM external_debts WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const direction    = req.body.direction ?? req.body.dir;
    const { party, amount, date, note, status, settled_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE external_debts SET direction=$1,party=$2,amount=$3,date=$4,note=$5,status=$6,settled_date=$7
       WHERE id=$8 RETURNING *`,
      [
        direction     !== undefined ? direction     : c.direction,
        party         !== undefined ? party         : c.party,
        amount        !== undefined ? amount        : c.amount,
        date          !== undefined ? date          : c.date,
        note          !== undefined ? note          : c.note,
        status        !== undefined ? status        : c.status,
        settled_date  !== undefined ? settled_date  : c.settled_date,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/external-debts/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM external_debts WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Purchase Requests ─────────────────────────────────────────────────────
router.get('/purchase-requests', async (req, res) => {
  try {
    const { dept, status, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM purchase_requests WHERE 1=1';
    const params = [];
    if (dept)   { params.push(dept);   sql += ` AND dept=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND status=$${params.length}`; }
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.json(rows);
    const ids = rows.map(r => r.id);
    const { rows: itemRows } = await pool.query(
      'SELECT * FROM purchase_request_items WHERE request_id = ANY($1::int[]) ORDER BY id',
      [ids]
    );
    const itemsByRequest = {};
    for (const item of itemRows) {
      (itemsByRequest[item.request_id] ??= []).push(item);
    }
    res.json(rows.map(r => ({ ...r, items: itemsByRequest[r.id] || [] })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/purchase-requests/:id', async (req, res) => {
  try {
    const [req_row, items_row] = await Promise.all([
      pool.query('SELECT * FROM purchase_requests WHERE id=$1', [req.params.id]),
      pool.query('SELECT * FROM purchase_request_items WHERE request_id=$1 ORDER BY id', [req.params.id])
    ]);
    if (!req_row.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...req_row.rows[0], items: items_row.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-requests', requireFinancialAuth, async (req, res) => {
  const { dept, requested_by, date, total_amount, paid_amount, status, note, items, supplier, drawer_tx_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO purchase_requests (dept,requested_by,date,total_amount,paid_amount,status,note,supplier,drawer_tx_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [dept ?? null, requested_by ?? null, date, total_amount ?? 0, paid_amount ?? 0, status ?? 'pending', note ?? null, supplier ?? null, drawer_tx_id ?? null]
    );
    const pr = rows[0];
    if (items && items.length) {
      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_request_items (request_id,name,qty,unit,estimated_price,note)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [pr.id, item.name, item.qty ?? 1, item.unit ?? null, item.estimated_price ?? 0, item.note ?? null]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(pr);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/purchase-requests/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM purchase_requests WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { dept, requested_by, date, total_amount, paid_amount, status, approved_by, approved_date, rejection_reason, note, supplier, drawer_tx_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE purchase_requests SET dept=$1,requested_by=$2,date=$3,total_amount=$4,
       paid_amount=$5,status=$6,approved_by=$7,approved_date=$8,rejection_reason=$9,note=$10,supplier=$11,drawer_tx_id=$12
       WHERE id=$13 RETURNING *`,
      [
        dept             !== undefined ? dept             : c.dept,
        requested_by     !== undefined ? requested_by     : c.requested_by,
        date             !== undefined ? date             : c.date,
        total_amount     !== undefined ? total_amount     : c.total_amount,
        paid_amount      !== undefined ? paid_amount      : c.paid_amount,
        status           !== undefined ? status           : c.status,
        approved_by      !== undefined ? approved_by      : c.approved_by,
        approved_date    !== undefined ? approved_date    : c.approved_date,
        rejection_reason !== undefined ? rejection_reason : c.rejection_reason,
        note             !== undefined ? note             : c.note,
        supplier         !== undefined ? supplier         : c.supplier,
        drawer_tx_id     !== undefined ? drawer_tx_id     : c.drawer_tx_id,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/purchase-requests/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM purchase_requests WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Purchase Request Items ────────────────────────────────────────────────
router.get('/purchase-requests/:request_id/items', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM purchase_request_items WHERE request_id=$1 ORDER BY id',
      [req.params.request_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-requests/:request_id/items', requireFinancialAuth, async (req, res) => {
  const { name, qty, unit, estimated_price, note } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO purchase_request_items (request_id,name,qty,unit,estimated_price,note)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.request_id, name, qty ?? 1, unit ?? null, estimated_price ?? 0, note ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/purchase-items/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM purchase_request_items WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { name, qty, unit, estimated_price, note } = req.body;
    const { rows } = await pool.query(
      `UPDATE purchase_request_items SET name=$1,qty=$2,unit=$3,estimated_price=$4,note=$5
       WHERE id=$6 RETURNING *`,
      [
        name            !== undefined ? name            : c.name,
        qty             !== undefined ? qty             : c.qty,
        unit            !== undefined ? unit            : c.unit,
        estimated_price !== undefined ? estimated_price : c.estimated_price,
        note            !== undefined ? note            : c.note,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/purchase-items/:id', requireFinancialAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM purchase_request_items WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Receipt Vouchers ────────────────────────────────────────────────────────

router.get('/receipt-vouchers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sql = 'SELECT * FROM receipt_vouchers WHERE 1=1';
    const params = [];
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/receipt-vouchers/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM receipt_vouchers WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// This route ONLY records the voucher document. The cash movement is performed
// separately by the frontend via POST /drawers/transactions (doDeposit), which
// is the single ledgered money path. Previously this route ALSO inserted a
// drawer_transaction and mutated the balance, which double-counted every
// voucher (creation moved money twice, cancellation reversed it once). That
// side effect has been removed so creation and cancellation are symmetric.
router.post('/receipt-vouchers', requireFinancialAuth, async (req, res) => {
  const { date, amount, received_from_type, received_from_id, received_from_name, reason, dept, notes, approved_by, drawer_tx_id } = req.body;
  try {
    const year = new Date(Date.now()+3*60*60*1000).getUTCFullYear();
    const { rows: [{ next_num }] } = await pool.query(
      `SELECT COALESCE(MAX(CAST(NULLIF(SPLIT_PART(voucher_no,'-',3),'') AS INTEGER)),0)+1 AS next_num FROM receipt_vouchers`
    );
    const voucher_no = `RV-${year}-${String(next_num).padStart(4,'0')}`;
    const { rows } = await pool.query(
      `INSERT INTO receipt_vouchers (voucher_no,date,amount,received_from_type,received_from_id,received_from_name,reason,dept,notes,approved_by,drawer_tx_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [voucher_no, date, amount, received_from_type, received_from_id||null, received_from_name, reason, dept||null, notes||null, approved_by||null, drawer_tx_id||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/receipt-vouchers/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM receipt_vouchers WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { date, amount, received_from_type, received_from_id, received_from_name, reason, dept, notes, approved_by, drawer_tx_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE receipt_vouchers SET date=$1,amount=$2,received_from_type=$3,received_from_id=$4,received_from_name=$5,reason=$6,dept=$7,notes=$8,approved_by=$9,drawer_tx_id=$10 WHERE id=$11 RETURNING *`,
      [
        date               !== undefined ? date               : c.date,
        amount             !== undefined ? amount             : c.amount,
        received_from_type !== undefined ? received_from_type : c.received_from_type,
        received_from_id   !== undefined ? received_from_id   : c.received_from_id,
        received_from_name !== undefined ? received_from_name : c.received_from_name,
        reason             !== undefined ? reason             : c.reason,
        dept               !== undefined ? dept               : c.dept,
        notes              !== undefined ? notes              : c.notes,
        approved_by        !== undefined ? approved_by        : c.approved_by,
        drawer_tx_id        !== undefined ? drawer_tx_id       : c.drawer_tx_id,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/receipt-vouchers/:id', requireFinancialAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM receipt_vouchers WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Payment Vouchers ─────────────────────────────────────────────────────────

router.get('/payment-vouchers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sql = 'SELECT * FROM payment_vouchers WHERE 1=1';
    const params = [];
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/payment-vouchers/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payment_vouchers WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Records the voucher document only. Cash movement is done by the frontend via
// POST /drawers/transactions (doWithdraw) — the single ledgered money path. The
// previous auto drawer_transaction + balance mutation was removed (it
// double-counted every payment voucher).
router.post('/payment-vouchers', requireFinancialAuth, async (req, res) => {
  const { date, amount, paid_to_type, paid_to_id, paid_to_name, reason, dept, category, notes, approved_by, drawer_tx_id } = req.body;
  try {
    const year = new Date(Date.now()+3*60*60*1000).getUTCFullYear();
    const { rows: [{ next_num }] } = await pool.query(
      `SELECT COALESCE(MAX(CAST(NULLIF(SPLIT_PART(voucher_no,'-',3),'') AS INTEGER)),0)+1 AS next_num FROM payment_vouchers`
    );
    const voucher_no = `PV-${year}-${String(next_num).padStart(4,'0')}`;
    const { rows } = await pool.query(
      `INSERT INTO payment_vouchers (voucher_no,date,amount,paid_to_type,paid_to_id,paid_to_name,reason,dept,category,notes,approved_by,drawer_tx_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [voucher_no, date, amount, paid_to_type, paid_to_id||null, paid_to_name, reason, dept||null, category||null, notes||null, approved_by||null, drawer_tx_id||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/payment-vouchers/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM payment_vouchers WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { date, amount, paid_to_type, paid_to_id, paid_to_name, reason, dept, category, notes, approved_by, drawer_tx_id, applied_to_payroll } = req.body;
    const { rows } = await pool.query(
      `UPDATE payment_vouchers SET date=$1,amount=$2,paid_to_type=$3,paid_to_id=$4,paid_to_name=$5,reason=$6,dept=$7,category=$8,notes=$9,approved_by=$10,drawer_tx_id=$11,applied_to_payroll=$12 WHERE id=$13 RETURNING *`,
      [
        date        !== undefined ? date        : c.date,
        amount      !== undefined ? amount      : c.amount,
        paid_to_type!== undefined ? paid_to_type: c.paid_to_type,
        paid_to_id  !== undefined ? paid_to_id  : c.paid_to_id,
        paid_to_name!== undefined ? paid_to_name: c.paid_to_name,
        reason      !== undefined ? reason      : c.reason,
        dept        !== undefined ? dept        : c.dept,
        category    !== undefined ? category    : c.category,
        notes       !== undefined ? notes       : c.notes,
        approved_by !== undefined ? approved_by : c.approved_by,
        drawer_tx_id !== undefined ? drawer_tx_id : c.drawer_tx_id,
        applied_to_payroll !== undefined ? applied_to_payroll : c.applied_to_payroll,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/payment-vouchers/:id', requireFinancialAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM payment_vouchers WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Financial Summary (المحرك المالي الشامل) ────────────────────────────────
// GET /api/finance/summary?dept=surgery&from=2026-01-01&to=2026-12-31
//
// يحسب من جدول drawer_transactions:
//   totalIncome   — كل type='in'  باستثناء الرصيد الافتتاحي
//   totalExpenses — كل type='out' باستثناء الرصيد الافتتاحي
//   totalDebts    — ديون نشطة من جدول debts
//   netProfit     — totalIncome - totalExpenses
//   breakdown     — تفصيل الإيرادات والمصروفات بالتصنيف
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const { dept, from, to } = req.query;

    const SKIP_CATS     = ['رصيد افتتاحي'];
    const SALARY_CATS   = ['راتب موظف', 'salary'];
    const ADVANCE_CATS  = ['سلف موظفين', 'سلفة موظف'];
    const PURCHASE_CATS = ['مشتريات مباشرة', 'مشتريات', 'purchase', 'supply', 'مستلزمات'];
    const VOUCHER_CATS  = ['سند صرف', 'voucher_out', 'إلغاء سند قبض'];
    const EXT_DEBT_CATS = ['ديون خارجية'];
    const PATIENT_CATS  = ['إيراد مريض'];
    const RECEIPT_CATS  = ['سند قبض', 'سند قبض — دفعة نقدية', 'إلغاء سند صرف'];

    // Build drawer_transactions query
    let txSql = `SELECT type, amount, category FROM drawer_transactions WHERE is_opening_balance = false`;
    const txParams = [];

    if (dept) {
      txParams.push(dept);
      txSql += ` AND dept = $${txParams.length}`;
    }
    if (from) {
      txParams.push(from);
      txSql += ` AND (tx_date + INTERVAL '3 hours') >= $${txParams.length}::date`;
    }
    if (to) {
      txParams.push(to);
      txSql += ` AND (tx_date + INTERVAL '3 hours') < $${txParams.length}::date + INTERVAL '1 day'`;
    }

    // Build debts query
    let debtSql = `SELECT COALESCE(SUM(amount),0)::float AS total FROM debts WHERE 1=1`;
    const debtParams = [];
    if (dept) {
      debtParams.push(dept);
      debtSql += ` AND dept = $${debtParams.length}`;
    }

    const [txResult, debtResult] = await Promise.all([
      pool.query(txSql, txParams),
      pool.query(debtSql, debtParams),
    ]);

    const catIn = (cat, list) => list.some(c => (cat || '').includes(c));

    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalDebts: Number(debtResult.rows[0]?.total) || 0,
      netProfit: 0,
      breakdown: {
        income:   { patients: 0, receipts: 0, other: 0 },
        expenses: { salaries: 0, advances: 0, purchases: 0, vouchers: 0, externalDebts: 0, other: 0 },
      },
    };

    for (const row of txResult.rows) {
      const amount = Number(row.amount) || 0;
      const cat    = row.category;

      if (catIn(cat, SKIP_CATS)) continue;

      if (row.type === 'in') {
        summary.totalIncome += amount;
        if      (catIn(cat, PATIENT_CATS)) summary.breakdown.income.patients += amount;
        else if (catIn(cat, RECEIPT_CATS)) summary.breakdown.income.receipts += amount;
        else                               summary.breakdown.income.other    += amount;
      } else if (row.type === 'out') {
        summary.totalExpenses += amount;
        if      (catIn(cat, SALARY_CATS))   summary.breakdown.expenses.salaries     += amount;
        else if (catIn(cat, ADVANCE_CATS))  summary.breakdown.expenses.advances     += amount;
        else if (catIn(cat, PURCHASE_CATS)) summary.breakdown.expenses.purchases    += amount;
        else if (catIn(cat, VOUCHER_CATS))  summary.breakdown.expenses.vouchers     += amount;
        else if (catIn(cat, EXT_DEBT_CATS)) summary.breakdown.expenses.externalDebts+= amount;
        else                                summary.breakdown.expenses.other         += amount;
      }
    }

    summary.netProfit = summary.totalIncome - summary.totalExpenses;

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
