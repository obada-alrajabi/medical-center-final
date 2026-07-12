import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin, requireFinancialAuth } from '../middleware/adminAuth.js';
import { postLedgerEntry, getBalance, getAllBalances } from '../services/ledgerService.js';

const router = Router();

// ─── Drawers ───────────────────────────────────────────────────────────────
// Balances are DERIVED from the append-only ledger (SUM CREDIT − DEBIT). The
// drawers.balance column is kept as a cache but the ledger is the source of
// truth, so the response always overrides it with the derived value.
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const drawerRows = await pool.query('SELECT * FROM drawers ORDER BY dept');
    let txSql = 'SELECT * FROM drawer_transactions WHERE 1=1';
    const txParams = [];
    if (startDate && endDate) {
      txParams.push(startDate); txSql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' >= $${txParams.length}::date`;
      txParams.push(endDate);   txSql += ` AND created_at AT TIME ZONE 'Asia/Jerusalem' < $${txParams.length}::date + INTERVAL '1 day'`;
    }
    txSql += ' ORDER BY tx_date DESC, created_at DESC';
    const txRows = await pool.query(txSql, txParams);
    const txsByDept = {};
    for (const tx of txRows.rows) {
      if (!txsByDept[tx.dept]) txsByDept[tx.dept] = [];
      txsByDept[tx.dept].push(tx);
    }
    const ledgerBal = await getAllBalances();
    const result = drawerRows.rows.map(d => ({
      ...d,
      balance: ledgerBal[d.dept] !== undefined ? ledgerBal[d.dept] : (parseFloat(d.balance) || 0),
      txs: txsByDept[d.dept] || [],
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dept/:dept', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM drawers WHERE dept=$1', [req.params.dept]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const bal = await getBalance(req.params.dept);
    res.json({ ...rows[0], balance: bal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM drawers WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const bal = await getBalance(rows[0].dept);
    res.json({ ...rows[0], balance: bal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create / upsert a drawer. The client-supplied `balance` is IGNORED — balance
// is always derived from the ledger. This also makes the legacy
// api.drawers.updateBalance() call a safe no-op during the trust-model cutover.
router.post('/', requireFinancialAuth, async (req, res) => {
  const { dept, opening_balance, opening_balance_date } = req.body;
  try {
    const derived = await getBalance(dept);
    const { rows } = await pool.query(
      `INSERT INTO drawers (dept, balance, opening_balance, opening_balance_date)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (dept) DO UPDATE SET balance=$2, updated_at=NOW()
       RETURNING *`,
      [dept, derived, opening_balance ?? 0, opening_balance_date ?? null]
    );
    res.status(201).json({ ...rows[0], balance: derived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { opening_balance, opening_balance_date } = req.body;
  try {
    const { rows: curr } = await pool.query('SELECT * FROM drawers WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    // balance is DERIVED — never trust a client-supplied balance here.
    const derived = await getBalance(curr[0].dept);
    const { rows } = await pool.query(
      `UPDATE drawers SET balance=$1,opening_balance=$2,opening_balance_date=$3,updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [
        derived,
        opening_balance      !== undefined ? opening_balance      : (curr[0].opening_balance ?? 0),
        opening_balance_date !== undefined ? opening_balance_date : (curr[0].opening_balance_date ?? null),
        req.params.id,
      ]
    );
    res.json({ ...rows[0], balance: derived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG-01 fix: /reset must be registered BEFORE /:id to avoid being matched as id="reset"
router.delete('/reset', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // The ledger is append-only and cannot be deleted. To reset drawers back to
    // zero we post a compensating (reversing) entry per department so history is
    // preserved and the derived balance returns to 0.
    const balances = await getAllBalances(client);
    for (const [dept, bal] of Object.entries(balances)) {
      const b = parseFloat(bal) || 0;
      if (Math.abs(b) < 0.005) continue;
      await postLedgerEntry({
        dept,
        type: b > 0 ? 'DEBIT' : 'CREDIT',
        amount: Math.abs(b),
        category: 'تصفير الصندوق',
        description: 'Drawer reset to zero (reversing entry)',
        referenceType: 'drawer_reset',
        referenceId: dept,
        createdBy: req.adminSession?.username ?? 'admin',
      }, client);
    }
    await client.query('DELETE FROM drawer_transactions');
    await client.query('UPDATE drawers SET balance=0, updated_at=NOW()');
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم تصفير جميع بيانات الصناديق والإيرادات' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM drawers WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Drawer Transactions ───────────────────────────────────────────────────
router.get('/transactions/all', async (req, res) => {
  try {
    const { dept, from, to, type } = req.query;
    let q = 'SELECT * FROM drawer_transactions WHERE 1=1';
    const params = [];
    if (dept)  { params.push(dept);  q += ` AND dept=$${params.length}`; }
    if (type)  { params.push(type);  q += ` AND type=$${params.length}`; }
    if (from)  { params.push(from);  q += ` AND tx_date>=$${params.length}::date`; }
    if (to)    { params.push(to);    q += ` AND tx_date<=$${params.length}::date`; }
    q += ' ORDER BY tx_date DESC, created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM drawer_transactions WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The single authoritative money-movement endpoint. Every cash in/out in the
// app funnels through here (deposits, withdrawals, vouchers, salary payouts,
// debt settlement, manual adjustments).
//
// Security invariants:
//   • requireFinancialAuth — no anonymous money movement.
//   • The append-only ledger is written first (in → CREDIT, out → DEBIT).
//   • balance_after is COMPUTED server-side from the ledger. Any client-supplied
//     balance_after is IGNORED (frontend trust removed).
//   • drawer_transactions is a display mirror; drawers.balance is a cache.
//   • All three writes happen in one DB transaction.
router.post('/transactions', requireFinancialAuth, async (req, res) => {
  const { dept, type, title, category, beneficiary, amount, tx_time, tx_date, is_auto, ref_type, ref_id, is_opening_balance } = req.body;
  if (type !== 'in' && type !== 'out') {
    return res.status(400).json({ error: "type must be 'in' or 'out'" });
  }
  if (!dept) return res.status(400).json({ error: 'dept is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const isOpening = is_opening_balance ?? (category === 'رصيد افتتاحي');

    // 1) authoritative append-only ledger entry
    await postLedgerEntry({
      dept,
      type: type === 'in' ? 'CREDIT' : 'DEBIT',
      amount,
      category: category ?? title,
      description: title,
      referenceType: ref_type ?? 'drawer_tx',
      referenceId: ref_id ?? null,
      createdBy: req.financialActor?.username ?? 'system',
    }, client);

    // 2) server-computed running balance (client balance_after ignored)
    const balanceAfter = await getBalance(dept, client);

    // 3) display mirror row
    const { rows } = await client.query(
      `INSERT INTO drawer_transactions
       (dept,type,title,category,beneficiary,amount,balance_after,tx_time,tx_date,is_auto,ref_type,ref_id,is_opening_balance)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [dept, type, title, category ?? null, beneficiary ?? null, amount, balanceAfter,
       tx_time ?? null, tx_date, is_auto ?? false, ref_type ?? null, ref_id ?? null, isOpening]
    );

    // 4) balance cache
    await client.query(
      `INSERT INTO drawers (dept, balance, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (dept) DO UPDATE SET balance=$2, updated_at=NOW()`,
      [dept, balanceAfter]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Editing a past transaction cannot mutate the ledger (append-only). Instead we
// post a reversal of the original ledger effect plus a new entry, then update
// the display mirror. Admin-only.
router.put('/transactions/:id', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: curr } = await client.query('SELECT * FROM drawer_transactions WHERE id=$1', [req.params.id]);
    if (!curr.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const c = curr[0];
    const { title, category, beneficiary, amount, tx_time, tx_date } = req.body;
    const newAmount = amount !== undefined ? amount : c.amount;
    const actor = req.adminSession?.username ?? 'admin';

    // reverse the original ledger effect
    await postLedgerEntry({
      dept: c.dept,
      type: c.type === 'in' ? 'DEBIT' : 'CREDIT',
      amount: c.amount,
      category: 'تعديل حركة (عكس)',
      description: `عكس حركة #${c.id}`,
      referenceType: 'drawer_tx_edit_reverse',
      referenceId: c.id,
      createdBy: actor,
    }, client);
    // post the corrected effect
    await postLedgerEntry({
      dept: c.dept,
      type: c.type === 'in' ? 'CREDIT' : 'DEBIT',
      amount: newAmount,
      category: 'تعديل حركة',
      description: title !== undefined ? title : c.title,
      referenceType: 'drawer_tx_edit',
      referenceId: c.id,
      createdBy: actor,
    }, client);

    const bal = await getBalance(c.dept, client);
    const { rows } = await client.query(
      `UPDATE drawer_transactions SET title=$1,category=$2,beneficiary=$3,amount=$4,
       balance_after=$5,tx_time=$6,tx_date=$7 WHERE id=$8 RETURNING *`,
      [
        title       !== undefined ? title       : c.title,
        category    !== undefined ? category    : c.category,
        beneficiary !== undefined ? beneficiary : c.beneficiary,
        newAmount,
        bal,
        tx_time     !== undefined ? tx_time     : c.tx_time,
        tx_date     !== undefined ? tx_date     : c.tx_date,
        req.params.id,
      ]
    );
    await client.query(
      `INSERT INTO drawers (dept, balance, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (dept) DO UPDATE SET balance=$2, updated_at=NOW()`,
      [c.dept, bal]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Deleting a transaction posts a reversing ledger entry (the ledger itself is
// immutable) then removes the display mirror row. Admin-only.
router.delete('/transactions/:id', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: curr } = await client.query('SELECT * FROM drawer_transactions WHERE id=$1', [req.params.id]);
    if (!curr.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const c = curr[0];
    await postLedgerEntry({
      dept: c.dept,
      type: c.type === 'in' ? 'DEBIT' : 'CREDIT',
      amount: c.amount,
      category: 'حذف حركة (عكس)',
      description: `عكس/حذف حركة #${c.id}: ${c.title}`,
      referenceType: 'drawer_tx_delete',
      referenceId: c.id,
      createdBy: req.adminSession?.username ?? 'admin',
    }, client);
    await client.query('DELETE FROM drawer_transactions WHERE id=$1', [req.params.id]);
    const bal = await getBalance(c.dept, client);
    await client.query(
      `INSERT INTO drawers (dept, balance, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (dept) DO UPDATE SET balance=$2, updated_at=NOW()`,
      [c.dept, bal]
    );
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
