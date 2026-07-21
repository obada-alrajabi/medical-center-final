import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createSession, createStaffSession, requireAdmin } from '../middleware/adminAuth.js';
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

// ─── Print Settings ────────────────────────────────────────────────────────
// One row per scope: 'lab' | 'surgery' | 'rehab' | 'radiology' | 'general'.
// The 4 department scopes drive every print button inside that department;
// 'general' drives every other print button in the system (reception,
// financial reports, vouchers, payroll, patient-file printouts, etc.).
const PRINT_SCOPES = ['lab', 'surgery', 'rehab', 'radiology', 'general'];

router.get('/print', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM print_settings');
    // Always return all 5 scopes, even if a row is somehow missing (e.g. DB
    // migration hasn't run yet on an older deployment) — fall back to defaults.
    const bySc = Object.fromEntries(rows.map(r => [r.scope, r]));
    const full = PRINT_SCOPES.map(sc => bySc[sc] ?? {
      scope: sc, letterhead_image: null,
      margin_top: 25, margin_right: 15, margin_bottom: 20, margin_left: 15,
      paper_size: 'A4', orientation: 'portrait', font_size: 13, font_family: null,
      show_signature: true, with_header: true, patient_fields: null,
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/print/:scope', async (req, res) => {
  const scope = req.params.scope;
  if (!PRINT_SCOPES.includes(scope)) return res.status(400).json({ error: 'نطاق طباعة غير معروف' });
  try {
    const { rows } = await pool.query('SELECT * FROM print_settings WHERE scope=$1', [scope]);
    res.json(rows[0] ?? { scope });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/print/:scope', requireAdmin, async (req, res) => {
  const scope = req.params.scope;
  if (!PRINT_SCOPES.includes(scope)) return res.status(400).json({ error: 'نطاق طباعة غير معروف' });
  const {
    letterhead_image, margin_top, margin_right, margin_bottom, margin_left,
    paper_size, orientation, font_size, font_family, show_signature, with_header,
    patient_fields,
  } = req.body;
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM print_settings WHERE scope=$1', [scope]);
    const existing = existingRows[0] ?? {};
    const { rows } = await pool.query(
      `INSERT INTO print_settings (scope, letterhead_image, margin_top, margin_right, margin_bottom, margin_left,
                                    paper_size, orientation, font_size, font_family, show_signature, with_header, patient_fields, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
       ON CONFLICT (scope) DO UPDATE SET
         letterhead_image=$2, margin_top=$3, margin_right=$4, margin_bottom=$5, margin_left=$6,
         paper_size=$7, orientation=$8, font_size=$9, font_family=$10, show_signature=$11, with_header=$12, patient_fields=$13, updated_at=NOW()
       RETURNING *`,
      [
        scope,
        letterhead_image !== undefined ? letterhead_image : (existing.letterhead_image ?? null),
        margin_top ?? existing.margin_top ?? 25,
        margin_right ?? existing.margin_right ?? 15,
        margin_bottom ?? existing.margin_bottom ?? 20,
        margin_left ?? existing.margin_left ?? 15,
        paper_size ?? existing.paper_size ?? 'A4',
        orientation ?? existing.orientation ?? 'portrait',
        font_size ?? existing.font_size ?? 13,
        font_family !== undefined ? font_family : (existing.font_family ?? null),
        show_signature ?? existing.show_signature ?? true,
        with_header ?? existing.with_header ?? true,
        patient_fields !== undefined ? JSON.stringify(patient_fields) : (existing.patient_fields ?? null),
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
// ── هذا المسار موحَّد: يتحقق من جدول المدراء أولاً، ولو ما لقى اسم المستخدم
//    فيه (مش خطأ — طبيعي لو الحساب حساب "موظف")، يكمل يفحص جدول الموظفين
//    بنفس الطلب، من دون ما يرجع 401 للواجهة الأمامية بينهم. سابقاً كانت
//    الواجهة تطلق طلبين منفصلين (auth/login ثم auth/staff-login) لأي حساب
//    موظف، وكان أول طلب (auth/login) يرجع 401 حقيقي بشكل طبيعي ومتوقع —
//    بس كان يظهر بالكونسول كـ"Unauthorized" أحمر يخوّف المستخدم رغم إنه
//    مش خلل فعلي وتسجيل الدخول كان ينجح بعده مباشرة بالطلب الثاني. توحيد
//    الفحص هون بطلب واحد فقط بيلغي هالمظهر المُربك تماماً. ──
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'اسم المستخدم وكلمة السر مطلوبان' });
  }
  const uname = username.trim();
  try {
    const { rows } = await pool.query(
      'SELECT * FROM admin_accounts WHERE username=$1', [uname]
    );
    if (rows.length) {
      const account = rows[0];
      const stored = (account.password_hash || '').trim();
      const valid = stored.startsWith('$2')
        ? await bcrypt.compare(password, stored)
        : stored === password;
      if (valid) {
        const token = crypto.randomBytes(32).toString('hex');
        await createSession(token, account.username, 'admin');
        return res.json({ authRole: 'admin', id: account.id, username: account.username, display_name: account.display_name, token });
      }
      console.error(`[Auth/login] password mismatch for admin username="${uname}" hash_prefix="${stored.slice(0, 7)}"`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    // ── ما في حساب مدير بهالاسم — نفحص جدول الموظفين بنفس الطلب بدل ما
    //    نرجّع 401 ونخلي الواجهة تطلق طلب ثاني منفصل. ──
    const { rows: staffRows } = await pool.query(
      `SELECT sm.*, json_agg(sdp.*) AS permissions
       FROM staff_members sm
       LEFT JOIN staff_dept_permissions sdp ON sdp.staff_id=sm.id
       WHERE sm.username=$1 AND sm.status='active'
       GROUP BY sm.id`,
      [uname]
    );
    if (!staffRows.length) {
      console.error(`[Auth/login] no account found for username="${uname}"`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    const member = staffRows[0];
    const storedStaff = member.password_hash || '';
    const validStaff = storedStaff.startsWith('$2')
      ? await bcrypt.compare(password, storedStaff)
      : storedStaff === password;
    if (!validStaff) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await createStaffSession(token, member.username, member.id);
    // ── خلل أمني خطير كان هون: `{ role: 'staff', ...safe, token }` — بما إنه
    //    جدول staff_members عنده عمود اسمه "role" أصلاً (المسمى الوظيفي،
    //    مثلاً "طبيب"/"محاسب")، فكان spread الكائن `safe` بعد `role: 'staff'`
    //    يدهس (overwrite) القيمة ويخليها المسمى الوظيفي بدل الكلمة "staff" —
    //    فالواجهة الأمامية (يلي بتفحص `role === "staff"` لتحديد نوع الحساب)
    //    كانت ما تلاقيها "staff" أبداً، فتسقط تلقائياً على فرع "مدير" وتسجّل
    //    دخول أي موظف كأنه مدير النظام الكامل! الحل: اسم حقل مختلف تماماً
    //    (authRole) ما إله تصادم مع أي عمود موجود بجدول الموظفين. ──
    const { password_hash, ...safe } = member;
    res.json({ authRole: 'staff', ...safe, token });
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
