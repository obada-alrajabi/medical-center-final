/**
 * ledgerService — the ONLY authorized writer of the append-only financial ledger.
 *
 * Design principles (secure ledger):
 *   • Append-only: entries are INSERT-only. UPDATE/DELETE are blocked at the
 *     database level by triggers (see migrations/001_secure_ledger.sql).
 *   • Server-authoritative: balances are DERIVED as SUM(CREDIT − DEBIT); the
 *     client never supplies a balance.
 *   • Double-entry semantics per drawer: money in = CREDIT, money out = DEBIT.
 *
 * All financial mutations in the app must funnel through postLedgerEntry().
 */
import pool from '../db.js';

const VALID_TYPES = new Set(['CREDIT', 'DEBIT']);

/**
 * Insert one immutable ledger entry.
 * @param {object} p
 * @param {string} p.dept            department key (drawer identity)
 * @param {'CREDIT'|'DEBIT'} p.type  CREDIT = money in, DEBIT = money out
 * @param {number} p.amount          non-negative magnitude
 * @param {string} [p.category]      short bucket label (e.g. "سند قبض")
 * @param {string} [p.description]   free text
 * @param {string} [p.referenceType] originating record kind (e.g. "receipt_voucher")
 * @param {string|number} [p.referenceId] originating record id
 * @param {string} [p.createdBy]     actor (admin username / "system")
 * @param {import('pg').PoolClient} [client] optional txn client
 */
export async function postLedgerEntry(
  { dept, type, amount, category, description, referenceType, referenceId, createdBy },
  client = pool,
) {
  if (!dept) throw new Error('postLedgerEntry: dept is required');
  if (!VALID_TYPES.has(type)) throw new Error("postLedgerEntry: type must be 'CREDIT' or 'DEBIT'");
  const amt = Math.abs(parseFloat(amount) || 0);
  const { rows } = await client.query(
    `INSERT INTO ledger_entries
       (dept, type, amount, category, description, reference_type, reference_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      dept,
      type,
      amt,
      category ?? null,
      description ?? null,
      referenceType ?? null,
      referenceId != null ? String(referenceId) : null,
      createdBy ?? null,
    ],
  );
  return rows[0];
}

/** Derived balance for one department = SUM(CREDIT) − SUM(DEBIT). */
export async function getBalance(dept, client = pool) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(CASE WHEN type='CREDIT' THEN amount ELSE -amount END), 0) AS balance
       FROM ledger_entries WHERE dept=$1`,
    [dept],
  );
  return parseFloat(rows[0].balance) || 0;
}

/** Derived balances for every department, as a { dept: balance } map. */
export async function getAllBalances(client = pool) {
  const { rows } = await client.query(
    `SELECT dept, COALESCE(SUM(CASE WHEN type='CREDIT' THEN amount ELSE -amount END), 0) AS balance
       FROM ledger_entries GROUP BY dept`,
  );
  const map = {};
  for (const r of rows) map[r.dept] = parseFloat(r.balance) || 0;
  return map;
}

/** Filtered ledger read for a department (or all when dept is falsy). */
export async function getLedgerByDept(dept, { from, to, limit } = {}, client = pool) {
  const params = [];
  let sql = 'SELECT * FROM ledger_entries WHERE 1=1';
  if (dept) { params.push(dept); sql += ` AND dept=$${params.length}`; }
  if (from) { params.push(from); sql += ` AND created_at >= $${params.length}::date`; }
  if (to)   { params.push(to);   sql += ` AND created_at < $${params.length}::date + INTERVAL '1 day'`; }
  sql += ' ORDER BY created_at DESC, id DESC';
  if (limit) { params.push(limit); sql += ` LIMIT $${params.length}`; }
  const { rows } = await client.query(sql, params);
  return rows;
}

/**
 * Backward-compat cache sync: keep the legacy drawers.balance column equal to
 * the derived ledger balance so existing screens that still read the column
 * stay correct during migration. The ledger remains the source of truth.
 */
export async function syncDrawerBalance(dept, client = pool) {
  const bal = await getBalance(dept, client);
  await client.query(
    `INSERT INTO drawers (dept, balance, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT (dept) DO UPDATE SET balance=$2, updated_at=NOW()`,
    [dept, bal],
  );
  return bal;
}
