import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM patient_reminders ORDER BY created_at DESC, id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const rowsIn = Array.isArray(req.body?.reminders) ? req.body.reminders : [req.body];
    const inserted = [];
    for (const r of rowsIn) {
      const { patient_name, source, arrival_date, procurement_date } = r || {};
      if (!patient_name) continue;
      const { rows } = await pool.query(
        `INSERT INTO patient_reminders (patient_name, source, arrival_date, procurement_date, status)
         VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
        [patient_name, source || null, arrival_date || null, procurement_date || null]
      );
      inserted.push(rows[0]);
    }
    res.status(201).json(inserted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM patient_reminders WHERE id=$1", [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "not found" });
    const cur = existing.rows[0];
    const { patient_name, source, arrival_date, procurement_date, status } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE patient_reminders SET
        patient_name=$1, source=$2, arrival_date=$3, procurement_date=$4, status=$5
       WHERE id=$6 RETURNING *`,
      [
        patient_name ?? cur.patient_name,
        source ?? cur.source,
        arrival_date ?? cur.arrival_date,
        procurement_date ?? cur.procurement_date,
        status ?? cur.status,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM patient_reminders WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
