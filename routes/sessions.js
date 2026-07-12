import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { sendSMS } from "../services/smsService.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads", "sessions");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const sessionFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadSessionFiles = multer({ storage: sessionFileStorage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// ─── Sessions ──────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { patient_id, dept, from, to, startDate, endDate } = req.query;
    let sql = `SELECT s.*,
      COALESCE((SELECT array_agg(r.test_name) FROM session_lab_refs r WHERE r.session_id=s.id), '{}') AS lab_refs,
      COALESCE((SELECT array_agg(rr.image_name) FROM session_rad_refs rr WHERE rr.session_id=s.id), '{}') AS rad_refs,
      COALESCE((SELECT array_agg(d.name) FROM session_diagnoses d WHERE d.session_id=s.id), '{}') AS diagnoses,
      COALESCE((SELECT json_agg(json_build_object('name',m.name,'dose',m.dose,'freq',m.freq,'duration',m.duration)) FROM session_medications m WHERE m.session_id=s.id), '[]') AS medications
      FROM sessions s WHERE 1=1`;
    const params = [];
    if (patient_id) {
      params.push(patient_id);
      sql += ` AND s.patient_id=$${params.length}`;
    }
    if (dept) {
      params.push(dept);
      sql += ` AND s.dept=$${params.length}`;
    }
    if (from) {
      params.push(from);
      sql += ` AND s.date>=$${params.length}::date`;
    }
    if (to) {
      params.push(to);
      sql += ` AND s.date<=$${params.length}::date`;
    }
    if (startDate && endDate) {
      params.push(startDate);
      sql += ` AND s.created_at AT TIME ZONE 'Asia/Jerusalem' >= $${params.length}::date`;
      params.push(endDate);
      sql += ` AND s.created_at AT TIME ZONE 'Asia/Jerusalem' < $${params.length}::date + INTERVAL '1 day'`;
    }
    sql += " ORDER BY s.date DESC, s.created_at DESC";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sessions WHERE id=$1", [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG-06 fix: requireAdmin added — session creation writes to financial ledger
router.post("/", requireAdmin, async (req, res) => {
  const {
    patient_id,
    dept,
    doctor,
    date,
    notes,
    amount,
    paid,
    debt,
    discount,
    discount_type,
    patient_name,
    patient_phone,
    diagnoses,
    medications,
    lab_refs,
    rad_refs,
  } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (patient_id,dept,doctor,date,notes,amount,paid,debt,discount,discount_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        patient_id,
        dept ?? null,
        doctor ?? null,
        date,
        notes ?? null,
        amount ?? 0,
        paid ?? 0,
        debt ?? 0,
        discount ?? 0,
        discount_type ?? "amount",
      ],
    );
    const session = rows[0];

    // NOTE: drawer_transaction is NOT auto-created here.
    // The frontend always calls doDeposit() which creates the transaction via
    // api.drawers.transactions.create() with the correct balance_after and
    // also updates drawers.balance. Creating one here would produce duplicates.

    // ── Persist structured diagnoses ────────────────────────────────────────
    if (Array.isArray(diagnoses)) {
      for (const d of diagnoses) {
        const name = typeof d === "string" ? d.trim() : (d?.name || "").trim();
        if (!name) continue;
        await pool.query(
          `INSERT INTO session_diagnoses (session_id,code,name,category) VALUES ($1,$2,$3,$4)`,
          [
            session.id,
            typeof d === "object" && d?.code ? d.code : null,
            name,
            typeof d === "object" && d?.category ? d.category : null,
          ],
        );
      }
    }

    // ── Persist structured medications ──────────────────────────────────────
    if (Array.isArray(medications)) {
      for (const m of medications) {
        const name = (m?.name || "").trim();
        if (!name) continue;
        await pool.query(
          `INSERT INTO session_medications (session_id,name,dose,freq,duration) VALUES ($1,$2,$3,$4,$5)`,
          [
            session.id,
            name,
            m?.dose ?? null,
            m?.freq ?? null,
            m?.duration ?? null,
          ],
        );
      }
    }

    // ── Persist lab / radiology referrals ───────────────────────────────────
    if (Array.isArray(lab_refs)) {
      for (const t of lab_refs) {
        const test_name = (t || "").trim();
        if (!test_name) continue;
        await pool.query(
          `INSERT INTO session_lab_refs (session_id,test_name) VALUES ($1,$2)`,
          [session.id, test_name],
        );
      }
    }
    if (Array.isArray(rad_refs)) {
      for (const img of rad_refs) {
        const image_name = (img || "").trim();
        if (!image_name) continue;
        await pool.query(
          `INSERT INTO session_rad_refs (session_id,image_name) VALUES ($1,$2)`,
          [session.id, image_name],
        );
      }
    }

    res.status(201).json(session);

    // BUG-13 fix: SMS is fire-and-forget; wrapped in its own try/catch so any
    // synchronous throw here cannot trigger a "headers already sent" error.
    try {
      const phone = patient_phone || null;
      if (phone) {
        const deptLabel =
          dept === "rehab"
            ? "التأهيل"
            : dept === "surgery"
              ? "الجراحة والطوارئ"
              : dept === "lab"
                ? "المختبر"
                : dept === "radiology"
                  ? "الأشعة"
                  : "العيادة";
        const dateLabel =
          date ||
          new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const patName = patient_name || "المريض";
        const msg = `عزيزي/عزيزتي ${patName}، تم تسجيل جلستك في قسم ${deptLabel} بتاريخ ${dateLabel} في مركز الدكتور مهند سليمان جابر. نتمنى لكم الشفاء العاجل.`;
        sendSMS(phone, msg).then((r) => {
          if (!r.ok && !r.skipped)
            console.warn(
              `[SMS] session notify failed — patient=${patName} err=${r.error}`,
            );
        }).catch(() => {});
      }
    } catch (_smsErr) {}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG-06 fix: requireAdmin added — session edits can change financial fields
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { rows: curr } = await pool.query(
      "SELECT * FROM sessions WHERE id=$1",
      [req.params.id],
    );
    if (!curr.length) return res.status(404).json({ error: "Not found" });
    const c = curr[0];
    const { doctor, date, notes, amount, paid, debt, discount, discount_type } =
      req.body;

    const newPaid = paid !== undefined ? parseFloat(paid) : parseFloat(c.paid);

    const { rows } = await pool.query(
      `UPDATE sessions SET doctor=$1,date=$2,notes=$3,amount=$4,paid=$5,
       debt=$6,discount=$7,discount_type=$8,updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [
        doctor !== undefined ? doctor : c.doctor,
        date !== undefined ? date : c.date,
        notes !== undefined ? notes : c.notes,
        amount !== undefined ? amount : c.amount,
        newPaid,
        debt !== undefined ? debt : c.debt,
        discount !== undefined ? discount : c.discount,
        discount_type !== undefined ? discount_type : c.discount_type,
        req.params.id,
      ],
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM sessions WHERE id=$1", [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Session Diagnoses ─────────────────────────────────────────────────────
router.get("/:session_id/diagnoses", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM session_diagnoses WHERE session_id=$1",
      [req.params.session_id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:session_id/diagnoses", async (req, res) => {
  const { code, name, category } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO session_diagnoses (session_id,code,name,category) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.session_id, code ?? null, name, category ?? null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:session_id/diagnoses/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM session_diagnoses WHERE id=$1 AND session_id=$2",
      [req.params.id, req.params.session_id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Session Medications ───────────────────────────────────────────────────
router.get("/:session_id/medications", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM session_medications WHERE session_id=$1",
      [req.params.session_id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:session_id/medications", async (req, res) => {
  const { name, dose, freq, duration } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO session_medications (session_id,name,dose,freq,duration) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        req.params.session_id,
        name,
        dose ?? null,
        freq ?? null,
        duration ?? null,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:session_id/medications/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM session_medications WHERE id=$1 AND session_id=$2",
      [req.params.id, req.params.session_id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Session Lab Refs ──────────────────────────────────────────────────────
router.get("/:session_id/lab-refs", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM session_lab_refs WHERE session_id=$1",
      [req.params.session_id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:session_id/lab-refs", async (req, res) => {
  const { test_name } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO session_lab_refs (session_id,test_name) VALUES ($1,$2) RETURNING *`,
      [req.params.session_id, test_name],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:session_id/lab-refs/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM session_lab_refs WHERE id=$1 AND session_id=$2",
      [req.params.id, req.params.session_id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Session Rad Refs ──────────────────────────────────────────────────────
router.get("/:session_id/rad-refs", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM session_rad_refs WHERE session_id=$1",
      [req.params.session_id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:session_id/rad-refs", async (req, res) => {
  const { image_name } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO session_rad_refs (session_id,image_name) VALUES ($1,$2) RETURNING *`,
      [req.params.session_id, image_name],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:session_id/rad-refs/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM session_rad_refs WHERE id=$1 AND session_id=$2",
      [req.params.id, req.params.session_id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/files", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM session_files WHERE session_id=$1 ORDER BY id ASC",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/files", uploadSessionFiles.array("files", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });
    const sessionId = req.params.id;
    const saved = [];
    for (const f of req.files) {
      const { rows } = await pool.query(
        "INSERT INTO session_files (session_id, filename, originalname, size) VALUES ($1, $2, $3, $4) RETURNING *",
        [sessionId, f.filename, f.originalname, f.size]
      );
      saved.push({ id: rows[0].id, filename: f.filename, originalname: f.originalname, size: f.size });
    }
    res.status(201).json({ ok: true, files: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/files/:fileId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT filename FROM session_files WHERE id=$1 AND session_id=$2",
      [req.params.fileId, req.params.id]
    );
    if (rows.length > 0) {
      const filePath = path.join(uploadsDir, rows[0].filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await pool.query("DELETE FROM session_files WHERE id=$1", [req.params.fileId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
