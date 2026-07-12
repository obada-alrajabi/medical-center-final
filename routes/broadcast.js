import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM broadcast_notices WHERE id=1");
    res.json(rows[0] || { id: 1, message: null, updated_at: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/", requireAdmin, async (req, res) => {
  try {
    const { message } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO broadcast_notices (id, message, updated_at) VALUES (1,$1,NOW())
       ON CONFLICT (id) DO UPDATE SET message=$1, updated_at=NOW() RETURNING *`,
      [message || null]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO broadcast_notices (id, message, updated_at) VALUES (1,NULL,NOW())
       ON CONFLICT (id) DO UPDATE SET message=NULL, updated_at=NOW() RETURNING *`
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
