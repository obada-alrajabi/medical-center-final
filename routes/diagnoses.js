import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { dept } = req.query;
    const q = dept
      ? "SELECT * FROM diagnoses_catalog WHERE dept=$1 ORDER BY id"
      : "SELECT * FROM diagnoses_catalog ORDER BY dept, id";
    const { rows } = dept ? await pool.query(q, [dept]) : await pool.query(q);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { code, name, category, dept } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO diagnoses_catalog (code,name,category,dept) VALUES($1,$2,$3,$4) RETURNING *",
      [code || "", name || "", category || "أخرى", dept || "surgery"]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { code, name, category, dept } = req.body;
    const { rows } = await pool.query(
      "UPDATE diagnoses_catalog SET code=COALESCE($1,code), name=COALESCE($2,name), category=COALESCE($3,category), dept=COALESCE($4,dept) WHERE id=$5 RETURNING *",
      [code, name, category, dept, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM diagnoses_catalog WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
