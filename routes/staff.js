import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// BUG-04 fix: allowlist for staff_dept_permissions columns to prevent SQL injection
const PERM_COLS_ALLOWED = new Set([
  'can_view', 'can_open_patient',
  'can_drawer_view', 'can_drawer_view_balance', 'can_drawer_adjust_balance', 'can_drawer_deposit', 'can_drawer_withdraw',
  'can_drawer_view_history', 'can_drawer_view_stats', 'can_drawer_view_charts', 'can_drawer_view_employees',
  'can_drawer_view_invoices', 'can_drawer_settle_invoices', 'can_drawer_financials',
  'can_lab_session', 'can_lab_catalog', 'can_rad_session', 'can_rad_catalog',
  'can_purchase_reqs', 'can_lab_queue', 'can_lab_inventory', 'can_rad_queue',
  'can_rehab_session', 'can_rehab_catalog', 'can_rehab_queue', 'can_print',
  'can_vouchers', 'can_delete_patient', 'can_edit_patient', 'can_edit_date', 'can_edit_session',
  'can_edit_voucher', 'can_delete_voucher', 'can_register_patient', 'can_print_export',
  'can_queue', 'can_queue_add', 'can_queue_edit_status', 'can_queue_delete',
  'can_catalog_add', 'can_catalog_edit', 'can_catalog_delete',
  'can_inventory_add', 'can_inventory_edit', 'can_inventory_delete',
  'can_attendance_dept', 'can_attendance_view', 'can_attendance_mark',
  'can_staff_advance', 'can_staff_advance_submit', 'can_surgery_clinic_inv',
  'can_dept_profit', 'can_dept_debts', 'can_settle_debts', 'can_dept_revenue',
  'can_dept_expenses', 'can_add_expense'
]);
function filterPermCols(obj) {
  const cols = Object.keys(obj).filter(k => PERM_COLS_ALLOWED.has(k));
  const vals = cols.map(k => obj[k]);
  return { cols, vals };
}

// ─── Staff Members ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { dept, status } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (dept)   { params.push(dept);   where += ` AND sm.primary_dept=$${params.length}`; }
    if (status) { params.push(status); where += ` AND sm.status=$${params.length}`; }
    const sql = `
      SELECT sm.*,
        (SELECT json_agg(x.*) FROM staff_dept_permissions x WHERE x.staff_id=sm.id) AS permissions
      FROM staff_members sm
      ${where}
      ORDER BY sm.name
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows.map(({ password_hash, ...safe }) => safe));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Staff Advance Requests (must come BEFORE /:id to avoid route conflict) ─
router.get('/advance-requests', async (req, res) => {
  try {
    const { staff_id, status, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM staff_advance_requests WHERE 1=1';
    const params = [];
    if (staff_id) { params.push(staff_id); sql += ` AND staff_id=$${params.length}`; }
    if (status)   { params.push(status);   sql += ` AND status=$${params.length}`; }
    if (startDate && endDate) {
      params.push(startDate); sql += ` AND request_date >= $${params.length}::date`;
      params.push(endDate);   sql += ` AND request_date < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += ' ORDER BY request_date DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/advance-requests', async (req, res) => {
  const { staff_id, staff_name, dept, amount, date, reason } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO staff_advance_requests (staff_id,staff_name,dept,amount,request_date,reason,status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [staff_id, staff_name, dept ?? null, amount, date ?? null, reason]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/advance-requests/:id', requireAdmin, async (req, res) => {
  const { status, reviewed_by, review_date, rejection_reason } = req.body;
  try {
    const { rowCount, rows } = await pool.query(
      `UPDATE staff_advance_requests SET status=$1,reviewed_by=$2,review_date=$3,rejection_reason=$4 WHERE id=$5 RETURNING *`,
      [status, reviewed_by ?? null, review_date ?? null, rejection_reason ?? null, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/advance-requests/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM staff_advance_requests WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/credentials', requireAdmin, async (req, res) => {
  const { username, new_password } = req.body;
  try {
    let sql, fields;
    if (new_password && new_password.trim()) {
      const hash = await bcrypt.hash(new_password.trim(), 10);
      sql = `UPDATE staff_members SET username=$1, password_hash=$2, updated_at=NOW() WHERE id=$3 RETURNING id, username`;
      fields = [username ?? null, hash, req.params.id];
    } else {
      sql = `UPDATE staff_members SET username=$1, updated_at=NOW() WHERE id=$2 RETURNING id, username`;
      fields = [username ?? null, req.params.id];
    }
    const { rows } = await pool.query(sql, fields);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM staff_members WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    // BUG-08 fix: strip password_hash before sending
    const { password_hash: _, ...safe } = rows[0];
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const {
    name, national_id, dob, username, password_hash, job_title, primary_dept,
    assigned_depts, phone, role, salary_type, fixed_salary, percentage_dept,
    percentage_depts, pay_from_depts, percentage_value, shift_start, shift_end, shift_amount,
    status, join_date, can_access_financial, can_access_settings,
    can_access_reports, can_manage_staff, is_admin_role, can_attendance, notes
  } = req.body;
  try {
    const hashedPassword = password_hash
      ? (password_hash.startsWith('$2') ? password_hash : await bcrypt.hash(password_hash.trim(), 10))
      : null;
    const { rows } = await pool.query(
      `INSERT INTO staff_members
       (name,national_id,dob,username,password_hash,job_title,primary_dept,assigned_depts,
        phone,role,salary_type,fixed_salary,percentage_dept,percentage_depts,pay_from_depts,percentage_value,
        shift_start,shift_end,shift_amount,status,join_date,can_access_financial,
        can_access_settings,can_access_reports,can_manage_staff,is_admin_role,can_attendance,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
       RETURNING *`,
      [name, national_id ?? null, dob ?? null, username ?? null, hashedPassword,
       job_title ?? null, primary_dept ?? null, assigned_depts ?? '[]',
       phone ?? null, role ?? null,
       salary_type ?? 'fixed', fixed_salary ?? 0, percentage_dept ?? null,
       percentage_depts ?? '[]', pay_from_depts ?? '[]', percentage_value ?? 0,
       shift_start ?? null, shift_end ?? null, shift_amount ?? 0,
       status ?? 'active', join_date ?? null,
       can_access_financial ?? false, can_access_settings ?? false,
       can_access_reports ?? false, can_manage_staff ?? false,
       is_admin_role ?? false, can_attendance ?? false, notes ?? null]
    );

    // ── مزامنة سجل الرواتب (employees) — upsert ذرّي بمفتاح staff_id بدل
    //    "ابحث بالاسم ثم أضف" (كان عرضة لسباق يُنتج صفّين مكرَّرين لنفس الموظف) ──
    if (name && rows[0]?.id) {
      await pool.query(
        `INSERT INTO employees (staff_id, name, dept, role, salary, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         ON CONFLICT (staff_id) DO UPDATE SET name=EXCLUDED.name, dept=EXCLUDED.dept, role=EXCLUDED.role, salary=EXCLUDED.salary`,
        [rows[0].id, name, primary_dept ?? null, job_title ?? role ?? null, fixed_salary ?? 0]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM staff_members WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];

    const {
      name, national_id, dob, username, password_hash, job_title, primary_dept,
      phone, role, salary_type, fixed_salary, percentage_dept,
      percentage_depts, pay_from_depts, percentage_value, shift_start, shift_end, shift_amount,
      status, join_date, can_access_financial, can_access_settings,
      can_access_reports, can_manage_staff, is_admin_role, can_attendance, notes,
      assigned_depts
    } = req.body;

    const resolvedName = name !== undefined ? name : c.name;
    const resolvedNationalId = national_id !== undefined ? national_id : c.national_id;
    const resolvedDob = dob !== undefined ? dob : c.dob;
    const resolvedUsername = username !== undefined ? username : c.username;
    const resolvedJobTitle = job_title !== undefined ? job_title : c.job_title;
    const resolvedPrimaryDept = primary_dept !== undefined ? primary_dept : c.primary_dept;
    const resolvedAssignedDepts = assigned_depts !== undefined ? assigned_depts : (c.assigned_depts || '[]');
    const resolvedPhone = phone !== undefined ? phone : c.phone;
    const resolvedRole = role !== undefined ? role : c.role;
    const resolvedSalaryType = salary_type !== undefined ? salary_type : (c.salary_type || 'fixed');
    const resolvedFixedSalary = fixed_salary !== undefined ? fixed_salary : (c.fixed_salary || 0);
    const resolvedPercentageDept = percentage_dept !== undefined ? percentage_dept : c.percentage_dept;
    const resolvedPercentageDepts = percentage_depts !== undefined ? percentage_depts : (c.percentage_depts || '[]');
    const resolvedPayFromDepts = pay_from_depts !== undefined ? pay_from_depts : (c.pay_from_depts || '[]');
    const resolvedPercentageValue = percentage_value !== undefined ? percentage_value : (c.percentage_value || 0);
    const resolvedShiftStart = shift_start !== undefined ? shift_start : c.shift_start;
    const resolvedShiftEnd = shift_end !== undefined ? shift_end : c.shift_end;
    const resolvedShiftAmount = shift_amount !== undefined ? shift_amount : (c.shift_amount || 0);
    const resolvedStatus = status !== undefined ? status : (c.status || 'active');
    const resolvedJoinDate = join_date !== undefined ? join_date : c.join_date;
    const resolvedCanAccessFinancial = can_access_financial !== undefined ? can_access_financial : (c.can_access_financial || false);
    const resolvedCanAccessSettings = can_access_settings !== undefined ? can_access_settings : (c.can_access_settings || false);
    const resolvedCanAccessReports = can_access_reports !== undefined ? can_access_reports : (c.can_access_reports || false);
    const resolvedCanManageStaff = can_manage_staff !== undefined ? can_manage_staff : (c.can_manage_staff || false);
    const resolvedIsAdminRole = is_admin_role !== undefined ? is_admin_role : (c.is_admin_role || false);
    const resolvedCanAttendance = can_attendance !== undefined ? can_attendance : (c.can_attendance || false);
    const resolvedNotes = notes !== undefined ? notes : c.notes;

    const fields = [
      resolvedName, resolvedNationalId, resolvedDob, resolvedUsername,
      resolvedJobTitle, resolvedPrimaryDept, resolvedAssignedDepts,
      resolvedPhone, resolvedRole,
      resolvedSalaryType, resolvedFixedSalary, resolvedPercentageDept,
      resolvedPercentageDepts, resolvedPayFromDepts, resolvedPercentageValue,
      resolvedShiftStart, resolvedShiftEnd, resolvedShiftAmount,
      resolvedStatus, resolvedJoinDate,
      resolvedCanAccessFinancial, resolvedCanAccessSettings,
      resolvedCanAccessReports, resolvedCanManageStaff,
      resolvedIsAdminRole, resolvedCanAttendance, resolvedNotes, req.params.id
    ];

    let sql = `UPDATE staff_members SET
      name=$1,national_id=$2,dob=$3,username=$4,
      job_title=$5,primary_dept=$6,assigned_depts=$7,
      phone=$8,role=$9,
      salary_type=$10,fixed_salary=$11,percentage_dept=$12,
      percentage_depts=$13,pay_from_depts=$14,percentage_value=$15,
      shift_start=$16,shift_end=$17,shift_amount=$18,
      status=$19,join_date=$20,
      can_access_financial=$21,can_access_settings=$22,
      can_access_reports=$23,can_manage_staff=$24,
      is_admin_role=$25,can_attendance=$26,notes=$27,updated_at=NOW()
      WHERE id=$28 RETURNING *`;

    if (password_hash !== undefined && password_hash !== null) {
      const hashedPw = password_hash.startsWith('$2')
        ? password_hash
        : await bcrypt.hash(password_hash.trim(), 10);
      fields.push(hashedPw);
      sql = `UPDATE staff_members SET
        name=$1,national_id=$2,dob=$3,username=$4,password_hash=$29,
        job_title=$5,primary_dept=$6,assigned_depts=$7,
        phone=$8,role=$9,
        salary_type=$10,fixed_salary=$11,percentage_dept=$12,
        percentage_depts=$13,pay_from_depts=$14,percentage_value=$15,
        shift_start=$16,shift_end=$17,shift_amount=$18,
        status=$19,join_date=$20,
        can_access_financial=$21,can_access_settings=$22,
        can_access_reports=$23,can_manage_staff=$24,
        is_admin_role=$25,can_attendance=$26,notes=$27,updated_at=NOW()
        WHERE id=$28 RETURNING *`;
    }

    const { rows } = await pool.query(sql, fields);

    // ── مزامنة سجل الرواتب (employees) — upsert ذرّي بمفتاح staff_id بدل
    //    "ابحث بالاسم ثم عدّل/أضف" (كان عرضة لسباق يُنتج صفّين مكرَّرين لنفس الموظف) ──
    if (rows.length && resolvedName) {
      await pool.query(
        `INSERT INTO employees (staff_id, name, dept, role, salary, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         ON CONFLICT (staff_id) DO UPDATE SET name=EXCLUDED.name, dept=EXCLUDED.dept, role=EXCLUDED.role, salary=EXCLUDED.salary`,
        [req.params.id, resolvedName, resolvedPrimaryDept ?? null, resolvedJobTitle || resolvedRole || null, resolvedFixedSalary ?? 0]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // staff_advance_requests.staff_id has a RESTRICT FK (no CASCADE/SET NULL) —
    // must be cleaned up first or the DELETE below fails with a raw FK-violation
    // 500 for any staff member who ever had an advance request, even an old
    // settled one. The matching employee_advances row (if the request was
    // approved) is handled separately below via SET NULL on staff_id, which is
    // safe to leave — it's a real historical financial record.
    await pool.query('DELETE FROM staff_advance_requests WHERE staff_id=$1', [req.params.id]);
    const { rowCount } = await pool.query('DELETE FROM staff_members WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    // Matches prior behavior: the linked payroll row is removed too (now matched
    // reliably via staff_id instead of by name).
    await pool.query('DELETE FROM employees WHERE staff_id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Staff Dept Permissions ────────────────────────────────────────────────
router.get('/:staff_id/permissions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM staff_dept_permissions WHERE staff_id=$1', [req.params.staff_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:staff_id/permissions', requireAdmin, async (req, res) => {
  const { dept, ...perms } = req.body;
  const { cols, vals } = filterPermCols(perms);
  try {
    const setCols = cols.map((c, i) => `${c}=$${i + 3}`).join(',');
    const { rows } = await pool.query(
      `INSERT INTO staff_dept_permissions (staff_id,dept${cols.length ? ',' + cols.join(',') : ''})
       VALUES ($1,$2${vals.map((_, i) => `,$${i + 3}`).join('')})
       ON CONFLICT (staff_id,dept) DO UPDATE SET ${setCols || 'can_view=can_view'}
       RETURNING *`,
      [req.params.staff_id, dept, ...vals]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:staff_id/permissions/:dept', requireAdmin, async (req, res) => {
  const { cols, vals } = filterPermCols(req.body);
  if (!cols.length) return res.status(400).json({ error: 'No valid permission fields to update' });
  const setCols = cols.map((c, i) => `${c}=$${i + 3}`).join(',');
  try {
    const { rows } = await pool.query(
      `UPDATE staff_dept_permissions SET ${setCols} WHERE staff_id=$1 AND dept=$2 RETURNING *`,
      [req.params.staff_id, req.params.dept, ...vals]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:staff_id/permissions/:dept', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM staff_dept_permissions WHERE staff_id=$1 AND dept=$2',
      [req.params.staff_id, req.params.dept]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Subitem-Permissions (aliases → staff_dept_permissions) ─────────────────
router.get('/:staff_id/subitem-permissions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM staff_dept_permissions WHERE staff_id=$1', [req.params.staff_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:staff_id/subitem-permissions', requireAdmin, async (req, res) => {
  const { dept, ...perms } = req.body;
  const { cols, vals } = filterPermCols(perms);
  try {
    const setCols = cols.map((c, i) => `${c}=$${i + 3}`).join(',');
    const { rows } = await pool.query(
      `INSERT INTO staff_dept_permissions (staff_id,dept${cols.length ? ',' + cols.join(',') : ''})
       VALUES ($1,$2${vals.map((_, i) => `,$${i + 3}`).join('')})
       ON CONFLICT (staff_id,dept) DO UPDATE SET ${setCols || 'can_view=can_view'}
       RETURNING *`,
      [req.params.staff_id, dept, ...vals]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Employees ─────────────────────────────────────────────────────────────
router.get('/employees/all', async (req, res) => {
  try {
    const { dept, status } = req.query;
    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    if (dept)   { params.push(dept);   sql += ` AND dept=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND status=$${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/employees/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employees WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', requireAdmin, async (req, res) => {
  const { name, dept, role, salary, expenses, status, paid_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO employees (name,dept,role,salary,expenses,status,paid_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, dept ?? null, role ?? null, salary ?? 0, expenses ?? 0, status ?? 'pending', paid_date ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/employees/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM employees WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];

    const { name, dept, role, salary, expenses, status, paid_date, commission, net_salary } = req.body;

    const resolvedName = name !== undefined ? name : c.name;
    const resolvedDept = dept !== undefined ? dept : c.dept;
    const resolvedRole = role !== undefined ? role : c.role;
    const resolvedSalary = salary !== undefined ? salary : c.salary;
    const resolvedExpenses = expenses !== undefined ? expenses : c.expenses;
    const resolvedStatus = status !== undefined ? status : c.status;
    const resolvedPaidDate = paid_date !== undefined ? paid_date : c.paid_date;
    const resolvedCommission = commission !== undefined ? commission : c.commission;
    const resolvedNetSalary = net_salary !== undefined ? net_salary : c.net_salary;

    const { rows } = await pool.query(
      `UPDATE employees SET name=$1,dept=$2,role=$3,salary=$4,expenses=$5,status=$6,paid_date=$7,commission=$8,net_salary=$9
       WHERE id=$10 RETURNING *`,
      [resolvedName, resolvedDept, resolvedRole, resolvedSalary, resolvedExpenses, resolvedStatus, resolvedPaidDate, resolvedCommission, resolvedNetSalary, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/employees/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM employees WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Employee Advances ─────────────────────────────────────────────────────
router.get('/advances/all', async (req, res) => {
  try {
    const { dept, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM employee_advances WHERE 1=1';
    const params = [];
    if (dept) { params.push(dept); sql += ` AND dept=$${params.length}`; }
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

router.get('/advances/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employee_advances WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/advances', requireAdmin, async (req, res) => {
  const { emp_name, staff_id, dept, amount, date, note } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO employee_advances (emp_name,staff_id,dept,amount,date,note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [emp_name, staff_id ?? null, dept ?? null, amount, date, note ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/advances/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM employee_advances WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { emp_name, staff_id, dept, amount, date, note, repaid, repaid_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE employee_advances SET emp_name=$1,staff_id=$2,dept=$3,amount=$4,date=$5,note=$6,repaid=$7,repaid_date=$8
       WHERE id=$9 RETURNING *`,
      [
        emp_name    !== undefined ? emp_name    : c.emp_name,
        staff_id    !== undefined ? staff_id    : c.staff_id,
        dept        !== undefined ? dept        : c.dept,
        amount      !== undefined ? amount      : c.amount,
        date        !== undefined ? date        : c.date,
        note        !== undefined ? note        : c.note,
        repaid      !== undefined ? repaid      : c.repaid,
        repaid_date !== undefined ? repaid_date : c.repaid_date,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/advances/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM employee_advances WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Attendance Records ────────────────────────────────────────────────────
router.get('/attendance/all', async (req, res) => {
  try {
    const { dept, emp_id, from, to, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    if (dept)   { params.push(dept);   sql += ` AND dept=$${params.length}`; }
    if (emp_id) { params.push(emp_id); sql += ` AND emp_id=$${params.length}`; }
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

router.get('/attendance/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM attendance_records WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// نفس منطق hoursBetweenTimes بالفرونت‌إند (utils.ts) — مصدر واحد للحساب حتى
// لا تتفرّق الصيغتان بمرور الوقت. يدعم الورديات العابرة لمنتصف الليل
// (مثلاً check_in=22:00, check_out=06:00 → 8 ساعات بدل قيمة سالبة/فارغة)،
// ويضيف حد أعلى منطقي (24 ساعة) كصمام أمان بسيط ضد إدخال قيم غير منطقية،
// دون رفض أو منع أي فرق ساعات حقيقي بين الوردية الاسمية والساعات الفعلية.
function calcTotalHours(check_in, check_out) {
  if (!check_in || !check_out) return null;
  const [h1, m1] = String(check_in).split(':').map(Number);
  const [h2, m2] = String(check_out).split(':').map(Number);
  if ([h1, m1, h2, m2].some(n => Number.isNaN(n))) return null;
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 1440; // عبور منتصف الليل
  return mins > 0 && mins <= 1440 ? Math.round((mins / 60) * 100) / 100 : null;
}

// BUG-16 fix: requireAdmin added — attendance records affect payroll
router.post('/attendance', requireAdmin, async (req, res) => {
  const { emp_id, emp_name, dept, date, day_name, check_in, check_out } = req.body;
  const total_hours = calcTotalHours(check_in, check_out);
  try {
    const { rows } = await pool.query(
      `INSERT INTO attendance_records (emp_id,emp_name,dept,date,day_name,check_in,check_out,total_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [emp_id, emp_name, dept ?? null, date, day_name ?? null, check_in ?? null, check_out ?? null, total_hours]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/attendance/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM attendance_records WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];
    const { emp_name, dept, date, day_name, check_in, check_out } = req.body;
    const resolvedCheckIn  = check_in  !== undefined ? check_in  : c.check_in;
    const resolvedCheckOut = check_out !== undefined ? check_out : c.check_out;
    const total_hours = calcTotalHours(resolvedCheckIn, resolvedCheckOut);
    const { rows } = await pool.query(
      `UPDATE attendance_records SET emp_name=$1,dept=$2,date=$3,day_name=$4,check_in=$5,check_out=$6,total_hours=$7
       WHERE id=$8 RETURNING *`,
      [
        emp_name !== undefined ? emp_name : c.emp_name,
        dept     !== undefined ? dept     : c.dept,
        date     !== undefined ? date     : c.date,
        day_name !== undefined ? day_name : c.day_name,
        resolvedCheckIn,
        resolvedCheckOut,
        total_hours,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/attendance/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM attendance_records WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
