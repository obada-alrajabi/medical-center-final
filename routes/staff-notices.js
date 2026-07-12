import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

// ─── GET — list notices for a specific staff member (or all global notices) ──
router.get("/:staff_id", async (req, res) => {
  try {
    const { staff_id } = req.params;
    const { rows } = await pool.query(
      `SELECT n.*,
              r.id IS NOT NULL AS is_read,
              r.read_at
       FROM   staff_notices n
       LEFT   JOIN staff_notice_reads r
              ON  r.notice_id = n.id AND r.staff_id = $1
       WHERE  n.target_staff_id IS NULL OR n.target_staff_id = $1
       ORDER  BY n.created_at DESC`,
      [staff_id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST — create a new notice (admin only) ──────────────────────────────────
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { message, target_staff_id } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: "message required" });
    const { rows } = await pool.query(
      `INSERT INTO staff_notices (message, target_staff_id, created_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [message.trim(), target_staff_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── DELETE — remove a notice (admin only) ────────────────────────────────────
router.delete("/:notice_id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM staff_notices WHERE id=$1", [req.params.notice_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PATCH — mark a notice as read by a staff member (staff action) ───────────
router.patch("/:notice_id/read", async (req, res) => {
  try {
    const { staff_id } = req.body || {};
    if (!staff_id) return res.status(400).json({ error: "staff_id required" });
    const { rows } = await pool.query(
      `INSERT INTO staff_notice_reads (notice_id, staff_id, read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (notice_id, staff_id) DO NOTHING
       RETURNING *`,
      [req.params.notice_id, staff_id]
    );
    res.json(rows[0] || { notice_id: req.params.notice_id, staff_id, already_read: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET all notices (admin overview) ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.*,
              sm.name AS target_staff_name,
              (SELECT count(*) FROM staff_notice_reads r WHERE r.notice_id=n.id) AS read_count
       FROM   staff_notices n
       LEFT   JOIN staff_members sm ON sm.id = n.target_staff_id
       ORDER  BY n.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
