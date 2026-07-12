import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// ─── Patients ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { dept, q } = req.query;
    let sql = 'SELECT * FROM patients WHERE 1=1';
    const params = [];
    if (dept) { params.push(dept); sql += ` AND dept=$${params.length}`; }
    if (q)    { params.push(`%${q}%`); sql += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR national_id ILIKE $${params.length})`; }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const {
    id, name, age, gender, phone, national_id, blood_type, address, email,
    has_allergy, allergy_detail, has_chronic, chronic_detail,
    has_insurance, insurance_company, dept, debt, notes, date
  } = req.body;
  try {
    let patientId = id;
    if (!patientId) {
      const { rows: maxRow } = await pool.query(
        `SELECT MAX(CAST(id AS INTEGER)) AS max_id FROM patients WHERE id ~ '^[0-9]+$'`
      );
      const maxId = maxRow[0]?.max_id;
      patientId = String(maxId ? maxId + 1 : 100001);
    }
    const { rows } = await pool.query(
      `INSERT INTO patients
       (id,name,age,gender,phone,national_id,blood_type,address,email,
        has_allergy,allergy_detail,has_chronic,chronic_detail,
        has_insurance,insurance_company,dept,debt,notes,date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [patientId, name, age ?? null, gender ?? null, phone ?? null, national_id ?? null,
       blood_type ?? null, address ?? null, email ?? null,
       has_allergy ?? false, allergy_detail ?? null,
       has_chronic ?? false, chronic_detail ?? null,
       has_insurance ?? false, insurance_company ?? null,
       dept ?? null, debt ?? 0, notes ?? null, date ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { rows: curr } = await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id]);
    if (!curr.length) return res.status(404).json({ error: 'Not found' });
    const c = curr[0];

    const {
      name, age, gender, phone, national_id, blood_type, address, email,
      has_allergy, allergy_detail, has_chronic, chronic_detail,
      has_insurance, insurance_company, dept, debt, notes, date
    } = req.body;

    const resolvedName = name !== undefined ? name : c.name;
    const resolvedAge = age !== undefined ? age : c.age;
    const resolvedGender = gender !== undefined ? gender : c.gender;
    const resolvedPhone = phone !== undefined ? phone : c.phone;
    const resolvedNationalId = national_id !== undefined ? national_id : c.national_id;
    const resolvedBloodType = blood_type !== undefined ? blood_type : c.blood_type;
    const resolvedAddress = address !== undefined ? address : c.address;
    const resolvedEmail = email !== undefined ? email : c.email;
    const resolvedHasAllergy = has_allergy !== undefined ? has_allergy : c.has_allergy;
    const resolvedAllergyDetail = allergy_detail !== undefined ? allergy_detail : c.allergy_detail;
    const resolvedHasChronic = has_chronic !== undefined ? has_chronic : c.has_chronic;
    const resolvedChronicDetail = chronic_detail !== undefined ? chronic_detail : c.chronic_detail;
    const resolvedHasInsurance = has_insurance !== undefined ? has_insurance : c.has_insurance;
    const resolvedInsuranceCompany = insurance_company !== undefined ? insurance_company : c.insurance_company;
    const resolvedDept = dept !== undefined ? dept : c.dept;
    const resolvedDebt = debt !== undefined ? debt : c.debt;
    const resolvedNotes = notes !== undefined ? notes : c.notes;
    const resolvedDate = date !== undefined ? date : c.date;

    const { rows } = await pool.query(
      `UPDATE patients SET
       name=$1,age=$2,gender=$3,phone=$4,national_id=$5,blood_type=$6,
       address=$7,email=$8,has_allergy=$9,allergy_detail=$10,
       has_chronic=$11,chronic_detail=$12,has_insurance=$13,
       insurance_company=$14,dept=$15,debt=$16,notes=$17,date=$18,updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [resolvedName, resolvedAge, resolvedGender, resolvedPhone, resolvedNationalId, resolvedBloodType,
       resolvedAddress, resolvedEmail, resolvedHasAllergy, resolvedAllergyDetail,
       resolvedHasChronic, resolvedChronicDetail, resolvedHasInsurance,
       resolvedInsuranceCompany, resolvedDept, resolvedDebt, resolvedNotes, resolvedDate, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cascade Delete (Admin only) ─────────────────────────────────────────
// Deletes patient + all related records: sessions, debts, delete-requests
router.delete('/cascade/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Session child tables (FK order)
    await pool.query(
      'DELETE FROM session_diagnoses WHERE session_id IN (SELECT id FROM sessions WHERE patient_id=$1)', [id]
    );
    await pool.query(
      'DELETE FROM session_medications WHERE session_id IN (SELECT id FROM sessions WHERE patient_id=$1)', [id]
    );
    await pool.query(
      'DELETE FROM session_lab_refs WHERE session_id IN (SELECT id FROM sessions WHERE patient_id=$1)', [id]
    );
    await pool.query(
      'DELETE FROM session_rad_refs WHERE session_id IN (SELECT id FROM sessions WHERE patient_id=$1)', [id]
    );
    // 2. Sessions (both tables)
    await pool.query('DELETE FROM sessions WHERE patient_id=$1', [id]);
    await pool.query('DELETE FROM patient_sessions WHERE patient_id=$1', [id]);
    // 3. Debts (both tables)
    await pool.query('DELETE FROM debts WHERE patient_id=$1', [id]);
    await pool.query('DELETE FROM patient_debts WHERE patient_id=$1', [id]);
    // 4. Delete requests
    await pool.query('DELETE FROM patient_delete_requests WHERE patient_id=$1', [id]);
    // 5. Patient record
    const { rowCount } = await pool.query('DELETE FROM patients WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Patient not found' });
    res.json({ success: true, deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM patients WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Patient Delete Requests ───────────────────────────────────────────────
router.get('/delete-requests/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM patient_delete_requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/delete-requests/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM patient_delete_requests WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete-requests', async (req, res) => {
  const { patient_id, patient_name, requested_by, request_dept, request_date, reason } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO patient_delete_requests
       (patient_id,patient_name,requested_by,request_dept,request_date,reason)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [patient_id, patient_name, requested_by, request_dept ?? null, request_date, reason ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/delete-requests/:id', requireAdmin, async (req, res) => {
  const { status, reviewed_by, review_date, rejection_reason } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE patient_delete_requests SET status=$1,reviewed_by=$2,review_date=$3,rejection_reason=$4
       WHERE id=$5 RETURNING *`,
      [status, reviewed_by ?? null, review_date ?? null, rejection_reason ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG-09 fix: requireAdmin added — prevents bypassing the admin-approval workflow
router.delete('/delete-requests/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM patient_delete_requests WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
