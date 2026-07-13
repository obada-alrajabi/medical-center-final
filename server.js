import 'dotenv/config';
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { exec } from "child_process";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import pool from "./db.js";

import { seedAll } from "./seeds/seed.js";

import departmentsRouter from "./routes/departments.js";
import drawersRouter from "./routes/drawers.js";
import smsRouter from "./routes/sms.js";
import { ensureSmsSettingsTable } from "./services/smsService.js";
import patientsRouter from "./routes/patients.js";
import sessionsRouter from "./routes/sessions.js";
import staffRouter from "./routes/staff.js";
import financeRouter from "./routes/finance.js";
import labRouter from "./routes/lab.js";
import radiologyRouter from "./routes/radiology.js";
import surgeryRouter from "./routes/surgery.js";
import settingsRouter from "./routes/settings.js";
import queuesRouter from "./routes/queues.js";
import diagnosesRouter from "./routes/diagnoses.js";
import rehabRouter from "./routes/rehab.js";
import adminRouter from "./routes/admin.js";
import remindersRouter from "./routes/reminders.js";
import broadcastRouter from "./routes/broadcast.js";
import staffNoticesRouter from "./routes/staff-notices.js";
import backupRouter from "./routes/backup.js";
import cron from "node-cron";
import { runLocalBackup } from "./services/backupService.js";

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── GitHub Webhook — must be registered BEFORE express.json() so req.body is
//    the raw Buffer needed for HMAC-SHA256 signature verification ──────────────
app.post("/git-webhook", express.raw({ type: "*/*" }), (req, res) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook] GITHUB_WEBHOOK_SECRET not set — rejecting request",
    );
    return res.status(403).json({ error: "Webhook secret not configured" });
  }
  const sig = req.headers["x-hub-signature-256"];
  if (!sig) {
    return res
      .status(401)
      .json({ error: "Missing X-Hub-Signature-256 header" });
  }
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(req.body) // req.body is a Buffer here (raw middleware)
      .digest("hex");
  const trusted = Buffer.from(expected);
  const received = Buffer.from(sig);
  if (
    trusted.length !== received.length ||
    !crypto.timingSafeEqual(trusted, received)
  ) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }
  res.status(200).send("OK");
  exec("cd /home/mjcczxsn/medical-center && git pull", (err, stdout) => {
    if (err) console.error("[webhook] git pull error:", err);
    else console.log("[webhook] git pull success:", stdout);
  });
});

// ── JSON body parser for all other routes ────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ── Secure append-only ledger (migration 001) ───────────────────────────────
// Auto-applies on every startup so the external cPanel/Hostinger production DB
// gets the ledger table + immutability triggers + backfill without manual psql
// access. The SQL is fully idempotent and guarded (see the file header).
try {
  const ledgerSql = readFileSync(
    join(__dirname, "migrations", "001_secure_ledger.sql"),
    "utf8",
  );
  pool
    .query(ledgerSql)
    .then(() => console.log("[migration] secure ledger applied"))
    .catch((e) => console.error("[migration] secure ledger:", e.message));
} catch (e) {
  console.error("[migration] secure ledger read:", e.message);
}

// ── DB migrations (idempotent — run on every startup) ───────────────────────
pool
  .query(
    `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_attendance BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) DEFAULT 0`,
  )
  .catch(() => {});
// Composite unique constraint on code and is_l2l for lab tests
pool
  .query(
    `ALTER TABLE lab_tests DROP CONSTRAINT IF EXISTS lab_tests_code_key`,
  )
  .then(() => {
    return pool.query(`ALTER TABLE lab_tests ADD CONSTRAINT lab_tests_code_is_l2l_key UNIQUE (code, is_l2l)`);
  })
  .catch(() => {});
// Staff dept permissions — 4 extra permission columns referenced by the frontend
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_vouchers       BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_delete_patient BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_patient   BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_date      BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_voucher   BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_delete_voucher BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
// Sovereign order — granular dept-permission sub-sections (register patient, print/export,
// catalog CRUD, inventory CRUD, per-dept attendance, staff advance, surgery clinic inventory)
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_register_patient     BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_print_export         BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue                BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue_add            BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue_edit_status    BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue_delete         BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_catalog_add          BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_catalog_edit         BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_catalog_delete       BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_inventory_add        BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_inventory_edit       BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_inventory_delete     BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_attendance_dept      BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_attendance_view      BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_attendance_mark      BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_staff_advance        BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_staff_advance_submit BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_surgery_clinic_inv   BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_profit          BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_debts           BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_settle_debts         BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_revenue         BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_expenses        BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_add_expense          BOOLEAN DEFAULT false`,
  )
  .catch(() => {});
// Multi-department support for staff members
pool
  .query(
    `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS assigned_depts   TEXT DEFAULT '[]'`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS percentage_depts TEXT DEFAULT '[]'`,
  )
  .catch(() => {});
// Salary can now be deducted proportionally (by revenue share) from more than one department drawer
pool
  .query(
    `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS pay_from_depts TEXT DEFAULT '[]'`,
  )
  .catch(() => {});
// Fix: debts.dept and patient_debts.dept had FK → departments.id but frontend sends
// short display names ("جراحة","المختبر") not dept IDs — drop these constraints.
pool
  .query(`ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_dept_fkey`)
  .catch(() => {});
pool
  .query(
    `ALTER TABLE patient_debts DROP CONSTRAINT IF EXISTS patient_debts_dept_fkey`,
  )
  .catch(() => {});
ensureSmsSettingsTable().catch((e) =>
  console.error("[SMS migration]", e.message),
);

// ── Suppliers table ──────────────────────────────────────────────────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'مستلزمات طبية',
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] suppliers:", e.message));

// ── Rehab services catalog ───────────────────────────────────────────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS rehab_services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL DEFAULT 'تأهيل عظمي ومفصلي',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] rehab_services:", e.message));

// ── Rehab plans ──────────────────────────────────────────────────────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS rehab_plans (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  total_sessions INT NOT NULL DEFAULT 1,
  completed_sessions INT NOT NULL DEFAULT 0,
  price_per_session NUMERIC(10,2) DEFAULT 0,
  plan_price NUMERIC(10,2) DEFAULT 0,
  pricing_mode TEXT DEFAULT 'per-session',
  specialist TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] rehab_plans:", e.message));

// ── Rehab queue entries (session attendance) — no FK to avoid ordering issue ──
pool
  .query(
    `CREATE TABLE IF NOT EXISTS rehab_queue_entries (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  plan_id INT,
  diagnosis TEXT,
  specialist TEXT,
  session_number INT DEFAULT 1,
  session_time TEXT,
  session_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  therapist_notes TEXT,
  session_result TEXT,
  gross_motor_skills TEXT,
  fine_motor_skills TEXT,
  sensory_condition TEXT,
  adl_activities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] rehab_queue_entries:", e.message));

// ── Rehab evaluation fields migration (add if not exists) ─────────────────────
pool
  .query(
    `ALTER TABLE rehab_queue_entries ADD COLUMN IF NOT EXISTS gross_motor_skills TEXT`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE rehab_queue_entries ADD COLUMN IF NOT EXISTS fine_motor_skills TEXT`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE rehab_queue_entries ADD COLUMN IF NOT EXISTS sensory_condition TEXT`,
  )
  .catch(() => {});
pool
  .query(
    `ALTER TABLE rehab_queue_entries ADD COLUMN IF NOT EXISTS adl_activities TEXT`,
  )
  .catch(() => {});

// ── Patient reminders (admin-only "المذكرات والتعميمات" section) ────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS patient_reminders (
  id SERIAL PRIMARY KEY,
  patient_name TEXT NOT NULL,
  source TEXT,
  arrival_date DATE,
  procurement_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] patient_reminders:", e.message));

// ── Broadcast notice — single live row (id=1) shown as a banner to all staff ─
pool
  .query(
    `CREATE TABLE IF NOT EXISTS broadcast_notices (
  id INT PRIMARY KEY DEFAULT 1,
  message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] broadcast_notices:", e.message));

// ── Staff notices — targeted or global notices sent by admin ─────────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS staff_notices (
  id          SERIAL PRIMARY KEY,
  message     TEXT NOT NULL,
  target_staff_id INT REFERENCES staff_members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)`
  )
  .catch((e) => console.error("[migration] staff_notices:", e.message));

// ── Session files attachments ───────────────────────────────────────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS session_files (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  originalname TEXT NOT NULL,
  size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`
  )
  .catch((e) => console.error("[migration] session_files:", e.message));

// ── Staff notice reads — per-staff read tracking ──────────────────────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS staff_notice_reads (
  id         SERIAL PRIMARY KEY,
  notice_id  INT  NOT NULL REFERENCES staff_notices(id) ON DELETE CASCADE,
  staff_id   INT  NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (notice_id, staff_id)
)`,
  )
  .catch((e) => console.error("[migration] staff_notice_reads:", e.message));

// ── Backup — Google Drive account slots (3 independent accounts) ────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS backup_drives (
  id SERIAL PRIMARY KEY,
  slot SMALLINT UNIQUE CHECK (slot IN (1,2,3)),
  name VARCHAR(200),
  credentials_json TEXT,
  folder_id VARCHAR(200),
  last_backup TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] backup_drives:", e.message));

// ── Backup — failure notifications shown on the backup screen ───────────────
pool
  .query(
    `CREATE TABLE IF NOT EXISTS backup_notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .catch((e) => console.error("[migration] backup_notifications:", e.message));

// ── Base path (set APP_BASE_PATH env var on Hostinger, e.g. /45.159.160.11) ──
const BASE = process.env.APP_BASE_PATH || "";

// ── Health check ────────────────────────────────────────────────────────────
app.get(`${BASE}/api/health`, async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res
      .status(503)
      .json({ status: "error", db: "disconnected", error: err.message });
  }
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use(`${BASE}/api/departments`, departmentsRouter);
app.use(`${BASE}/api/drawers`, drawersRouter);
app.use(`${BASE}/api/sms`, smsRouter);
app.use(`${BASE}/api/patients`, patientsRouter);
app.use(`${BASE}/api/sessions`, sessionsRouter);
app.use(`${BASE}/api/staff`, staffRouter);
app.use(`${BASE}/api/finance`, financeRouter);
app.use(`${BASE}/api/lab`, labRouter);
app.use(`${BASE}/api/radiology`, radiologyRouter);
app.use(`${BASE}/api/surgery-inventory`, surgeryRouter);
app.use(`${BASE}/api/settings`, settingsRouter);
app.use(`${BASE}/api/queues`, queuesRouter);
app.use(`${BASE}/api/diagnoses`, diagnosesRouter);
app.use(`${BASE}/api/rehab`, rehabRouter);
app.use(`${BASE}/api/admin`, adminRouter);
app.use(`${BASE}/api/reminders`, remindersRouter);
app.use(`${BASE}/api/broadcast`, broadcastRouter);
app.use(`${BASE}/api/staff-notices`, staffNoticesRouter);
app.use(`${BASE}/api/backup`, backupRouter);

// ── Daily automatic local backup at 2:00 AM server time ──────────────────────
cron.schedule("0 2 * * *", async () => {
  try {
    const result = await runLocalBackup();
    console.log(`[backup] automatic local backup created: ${result.filename}`);
  } catch (err) {
    console.error("[backup] automatic local backup FAILED:", err.message);
    try {
      await pool.query(
        "INSERT INTO backup_notifications (message) VALUES ($1)",
        [`فشل النسخ الاحتياطي التلقائي (2:00 صباحاً): ${err.message}`],
      );
    } catch (notifyErr) {
      console.error(
        "[backup] failed to record failure notification:",
        notifyErr.message,
      );
    }
  }
});

// ── Serve frontend from dist/ if built (production hybrid mode) ──────────────
const distPath = join(__dirname, "dist");
app.use(`${BASE}/uploads`, express.static(join(__dirname, "uploads")));
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => res.sendFile(join(distPath, "index.html")));
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});
if (typeof PORT === 'string' && (PORT.startsWith('/') || PORT.startsWith('\\\\'))) {
  app.listen(PORT, () => {
    console.log(`✅ API Server running on socket ${PORT}`);
    seedAll().catch((e) => console.error("[seed] error:", e.message));
  });
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API Server running on port ${PORT}`);
    console.log(`   GET http://localhost:${PORT}/api/health`);
    seedAll().catch((e) => console.error("[seed] error:", e.message));
  });
}
