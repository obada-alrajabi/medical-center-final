import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createSession, requireAdmin } from '../middleware/adminAuth.js';
const router = Router();

// ─── Insurance Companies ───────────────────────────────────────────────────
router.get('/insurance', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM insurance_companies ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/insurance/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM insurance_companies WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/insurance', requireAdmin, async (req, res) => {
  const { name, phone, discount_clinic, discount_lab, discount_rad } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO insurance_companies (name,phone,discount_clinic,discount_lab,discount_rad)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, phone ?? null, discount_clinic ?? 0, discount_lab ?? 0, discount_rad ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/insurance/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM insurance_companies WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { name, phone, discount_clinic, discount_lab, discount_rad } = req.body;
    const { rows } = await pool.query(
      `UPDATE insurance_companies SET name=$1,phone=$2,discount_clinic=$3,discount_lab=$4,discount_rad=$5
       WHERE id=$6 RETURNING *`,
      [
        name             !== undefined ? name             : c.name,
        phone            !== undefined ? phone            : c.phone,
        discount_clinic  !== undefined ? discount_clinic  : c.discount_clinic,
        discount_lab     !== undefined ? discount_lab     : c.discount_lab,
        discount_rad     !== undefined ? discount_rad     : c.discount_rad,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/insurance/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM insurance_companies WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Accounts ────────────────────────────────────────────────────────
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,username,display_name,created_at FROM admin_accounts ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admins/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,username,display_name,created_at FROM admin_accounts WHERE id=$1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admins', requireAdmin, async (req, res) => {
  const { username, password_hash, display_name } = req.body;
  try {
    const storedHash = password_hash
      ? (password_hash.startsWith('$2') ? password_hash : await bcrypt.hash(password_hash.trim(), 10))
      : null;
    const { rows } = await pool.query(
      `INSERT INTO admin_accounts (username,password_hash,display_name) VALUES ($1,$2,$3) RETURNING id,username,display_name,created_at`,
      [username, storedHash, display_name ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admins/:id', requireAdmin, async (req, res) => {
  const { username, display_name, password_hash } = req.body;
  try {
    let sql, params;
    if (password_hash) {
      const storedHash = password_hash.startsWith('$2')
        ? password_hash
        : await bcrypt.hash(password_hash.trim(), 10);
      sql = `UPDATE admin_accounts SET username=$1,display_name=$2,password_hash=$3 WHERE id=$4 RETURNING id,username,display_name,created_at`;
      params = [username, display_name ?? null, storedHash, req.params.id];
    } else {
      sql = `UPDATE admin_accounts SET username=$1,display_name=$2 WHERE id=$3 RETURNING id,username,display_name,created_at`;
      params = [username, display_name ?? null, req.params.id];
    }
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admins/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM admin_accounts WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sidebar Settings ──────────────────────────────────────────────────────
router.get('/sidebar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sidebar_settings ORDER BY id LIMIT 1');
    res.json(rows[0] ?? {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sidebar', requireAdmin, async (req, res) => {
  const { hidden_sections, hide_revenue_from_staff, dept_capacity } = req.body;
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM sidebar_settings ORDER BY id LIMIT 1');
    const existing = existingRows[0] ?? {};
    const { rows } = await pool.query(
      `UPDATE sidebar_settings SET hidden_sections=$1,hide_revenue_from_staff=$2,dept_capacity=$3,updated_at=NOW()
       WHERE id=(SELECT id FROM sidebar_settings ORDER BY id LIMIT 1) RETURNING *`,
      [
        hidden_sections ?? existing.hidden_sections ?? [],
        hide_revenue_from_staff ?? existing.hide_revenue_from_staff ?? false,
        JSON.stringify(dept_capacity ?? existing.dept_capacity ?? {}),
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Suppliers ─────────────────────────────────────────────────────────────
router.get('/suppliers', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', requireAdmin, async (req, res) => {
  const { name, type, phone, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name,type,phone,notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, type ?? 'مستلزمات طبية', phone ?? null, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/suppliers/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM suppliers WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { name, type, phone, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE suppliers SET name=$1,type=$2,phone=$3,notes=$4 WHERE id=$5 RETURNING *`,
      [
        name  !== undefined ? name  : c.name,
        type  !== undefined ? type  : c.type,
        phone !== undefined ? phone : c.phone,
        notes !== undefined ? notes : c.notes,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/suppliers/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM suppliers WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'اسم المستخدم وكلمة السر مطلوبان' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM admin_accounts WHERE username=$1', [username.trim()]
    );
    if (!rows.length) {
      console.error(`[Auth/login] no account found for username="${username}"`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    const account = rows[0];
    const stored = (account.password_hash || '').trim();
    const valid = stored.startsWith('$2')
      ? await bcrypt.compare(password, stored)
      : stored === password;
    if (!valid) {
      console.error(`[Auth/login] password mismatch for username="${username}" hash_prefix="${stored.slice(0, 7)}"`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await createSession(token, account.username, 'admin');
    res.json({ id: account.id, username: account.username, display_name: account.display_name, token });
  } catch (err) {
    console.error('[Auth/login] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Credentials (self-service with bcrypt) ──────────────────────────
router.patch('/admins/:id/credentials', requireAdmin, async (req, res) => {
  const { username, display_name, new_password } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
  }
  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM admin_accounts WHERE username=$1 AND id<>$2',
      [username.trim(), req.params.id]
    );
    if (existing.length) return res.status(409).json({ error: 'اسم المستخدم مستخدم من قبل' });

    let sql, params;
    if (new_password && new_password.trim()) {
      const hash = await bcrypt.hash(new_password.trim(), 10);
      sql = `UPDATE admin_accounts SET username=$1,display_name=$2,password_hash=$3 WHERE id=$4 RETURNING id,username,display_name`;
      params = [username.trim(), display_name ?? null, hash, req.params.id];
    } else {
      sql = `UPDATE admin_accounts SET username=$1,display_name=$2 WHERE id=$3 RETURNING id,username,display_name`;
      params = [username.trim(), display_name ?? null, req.params.id];
    }
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'الحساب غير موجود' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/staff-login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT sm.*, json_agg(sdp.*) AS permissions
       FROM staff_members sm
       LEFT JOIN staff_dept_permissions sdp ON sdp.staff_id=sm.id
       WHERE sm.username=$1 AND sm.status='active'
       GROUP BY sm.id`,
      [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const member = rows[0];
    const storedStaff = member.password_hash || '';
    const validStaff = storedStaff.startsWith('$2')
      ? await bcrypt.compare(password, storedStaff)
      : storedStaff === password;
    if (!validStaff) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    // Issue a staff session token so staff financial writes are authenticated
    // (required by requireFinancialAuth on money-moving routes).
    const token = crypto.randomBytes(32).toString('hex');
    await createStaffSession(token, member.username, member.id);
    const { password_hash, ...safe } = member;
    res.json({ ...safe, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
