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
  exec("cd /home/mjcczxsn/medical-center && git pull && npm run build", (err, stdout) => {
    if (err) console.error("[webhook] git pull & build error:", err);
    else console.log("[webhook] git pull & build success:", stdout);
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
    `CREATE TABLE IF NOT EXISTS public.admin_sessions (
       token VARCHAR(255) PRIMARY KEY,
       username VARCHAR(100) NOT NULL,
       role VARCHAR(50) NOT NULL,
       expires_at TIMESTAMP WITH TIME ZONE NOT NULL
     )`
  )
  .then(() => console.log("[migration] admin_sessions table verified"))
  .catch((e) => console.error("[migration] admin_sessions table:", e.message));

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
// ── تعديل تفاصيل الجلسات (تشخيص/أدوية/فحوصات/مبلغ) — صلاحية جديدة يتحكم بها
//    المدير لكل موظف/قسم لحاله، منفصلة عن تعديل بيانات المريض الشخصية ──
pool
  .query(
    `ALTER TABLE staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_session   BOOLEAN DEFAULT false`,
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

// ── Print settings — one row per scope (letterhead image + margins) ─────────
// Scopes: the 4 departments with their own dedicated print identity (lab,
// surgery, rehab, radiology) plus "general" which covers every OTHER print
// button in the system (reception, financial reports, vouchers, payroll,
// patient-file printouts, etc.) per the admin's "الإعدادات العامة" screen.
pool
  .query(
    `CREATE TABLE IF NOT EXISTS print_settings (
  scope TEXT PRIMARY KEY,
  letterhead_image TEXT,
  margin_top INT NOT NULL DEFAULT 25,
  margin_right INT NOT NULL DEFAULT 15,
  margin_bottom INT NOT NULL DEFAULT 20,
  margin_left INT NOT NULL DEFAULT 15,
  paper_size TEXT NOT NULL DEFAULT 'A4',
  orientation TEXT NOT NULL DEFAULT 'portrait',
  font_size INT NOT NULL DEFAULT 13,
  font_family TEXT,
  show_signature BOOLEAN NOT NULL DEFAULT true,
  with_header BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
)`,
  )
  .then(() =>
    pool.query(
      `INSERT INTO print_settings (scope) VALUES ('lab'),('surgery'),('rehab'),('radiology'),('general')
       ON CONFLICT (scope) DO NOTHING`,
    ),
  )
  .catch((e) => console.error("[migration] print_settings:", e.message));

// ── Employees ↔ staff_members link (fixes duplicate payroll rows) ───────────
// Previously the "employees" (payroll) row for a staff member was located by
// matching on `name` alone, done independently in THREE separate places
// (client-side in App.tsx, and twice server-side in routes/staff.js) with no
// database-level safeguard — any race between those meant the same staff
// member could get two "employees" rows inserted, which is exactly the
// duplicate-rows-in-payroll bug that was reported. This migration:
//   1. Adds a nullable, UNIQUE `staff_id` column linking employees → staff_members.
//   2. Backfills staff_id for existing rows by unambiguous name match.
//   3. Merges any existing duplicate employees rows for the same person into
//      one (keeping the most complete data), before the unique constraint is
//      applied — otherwise the constraint itself would fail to add.
// Steps 2–3 only ever act on rows that are still duplicated / unlinked, so
// running this again on every future startup is a safe no-op.
(async () => {
  try {
    await pool.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS staff_id INT REFERENCES staff_members(id) ON DELETE SET NULL`
    );
    // Backfill: only when the name maps to exactly one staff member, to avoid
    // mis-linking two different people who happen to share a name.
    await pool.query(`
      UPDATE employees e SET staff_id = sm.id
      FROM staff_members sm
      WHERE e.staff_id IS NULL AND e.name = sm.name
        AND (SELECT COUNT(*) FROM staff_members sm2 WHERE sm2.name = e.name) = 1
    `);
    // Merge duplicate rows — group by staff_id when known, else by exact name.
    const { rows: dupGroups } = await pool.query(`
      SELECT COALESCE(staff_id::text, 'n:' || name) AS gkey, array_agg(id ORDER BY id) AS ids
      FROM employees
      GROUP BY gkey
      HAVING COUNT(*) > 1
    `);
    for (const g of dupGroups) {
      const { rows: dupRows } = await pool.query(
        `SELECT * FROM employees WHERE id = ANY($1::int[]) ORDER BY id`,
        [g.ids]
      );
      // Winner: prefer a row already linked to staff_id, then the one with the
      // highest salary (most likely to have been kept up to date), then the
      // most recently created row.
      const winner = [...dupRows].sort((a, b) => {
        if (!!b.staff_id !== !!a.staff_id) return (b.staff_id ? 1 : 0) - (a.staff_id ? 1 : 0);
        if (Number(b.salary) !== Number(a.salary)) return Number(b.salary) - Number(a.salary);
        return b.id - a.id;
      })[0];
      const merged = {
        staff_id: winner.staff_id ?? dupRows.find(r => r.staff_id)?.staff_id ?? null,
        dept: winner.dept ?? dupRows.find(r => r.dept)?.dept ?? null,
        role: winner.role ?? dupRows.find(r => r.role)?.role ?? null,
        salary: Math.max(...dupRows.map(r => Number(r.salary) || 0)),
        expenses: Math.max(...dupRows.map(r => Number(r.expenses) || 0)),
        status: winner.status ?? "pending",
        paid_date: winner.paid_date ?? dupRows.find(r => r.paid_date)?.paid_date ?? null,
      };
      await pool.query(
        `UPDATE employees SET staff_id=$1, dept=$2, role=$3, salary=$4, expenses=$5, status=$6, paid_date=$7 WHERE id=$8`,
        [merged.staff_id, merged.dept, merged.role, merged.salary, merged.expenses, merged.status, merged.paid_date, winner.id]
      );
      const loserIds = g.ids.filter((id) => id !== winner.id);
      if (loserIds.length) {
        await pool.query(`DELETE FROM employees WHERE id = ANY($1::int[])`, [loserIds]);
        console.log(`[migration] employees_dedupe: merged ${loserIds.length} duplicate row(s) into id=${winner.id} (${winner.name})`);
      }
    }
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE employees ADD CONSTRAINT employees_staff_id_unique UNIQUE (staff_id);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("[migration] employees_staff_id_link applied");
  } catch (e) {
    console.error("[migration] employees_staff_id_link:", e.message);
  }
})();

// ── Employee advances ↔ staff_members link ───────────────────────────────────
// Same class of bug as the employees/payroll table above: advances were only
// ever matched to a staff member by free-text name (`emp_name`), including in
// the access-control filter that decides which advances a logged-in staff
// member is allowed to see for their own "سلف الموظفين" screen. Two staff
// members sharing a name could therefore see each other's advance records.
// Adds a nullable staff_id link and best-effort backfills it from existing data.
(async () => {
  try {
    await pool.query(
      `ALTER TABLE employee_advances ADD COLUMN IF NOT EXISTS staff_id INT REFERENCES staff_members(id) ON DELETE SET NULL`
    );
    await pool.query(`
      UPDATE employee_advances ea SET staff_id = sm.id
      FROM staff_members sm
      WHERE ea.staff_id IS NULL AND ea.emp_name = sm.name
        AND (SELECT COUNT(*) FROM staff_members sm2 WHERE sm2.name = ea.emp_name) = 1
    `);
    console.log("[migration] employee_advances_staff_id_link applied");
  } catch (e) {
    console.error("[migration] employee_advances_staff_id_link:", e.message);
  }
})();

// ── Queues ↔ patients link (fixes wrong-patient data on shared names) ───────
// The lab/radiology queue only ever stored `patient_name` as free text, with
// no `patient_id` FK. Screens that look up "this patient's pending lab/rad
// entries" or build the OFFICIAL printed lab/rad report matched purely by
// name — so two patients sharing a name could see each other's queue entries,
// and a printed report could carry the wrong patient's file number/age/phone.
// Adds a nullable patient_id column; existing rows are left NULL (patients.id
// is a free-text code, not reliably unique-by-name-only to backfill safely —
// new queue entries created after this migration always carry the real id).
pool
  .query(`ALTER TABLE queues ADD COLUMN IF NOT EXISTS patient_id VARCHAR(50)`)
  .then(() => console.log("[migration] queues_patient_id applied"))
  .catch((e) => console.error("[migration] queues_patient_id:", e.message));

// ── Lab tests ↔ lab inventory link (fixes: kit stock never auto-deducted) ────
// The test catalog's "kit name" field was a free-text label with no real link
// to any inventory row, and the actual automatic-deduction logic at
// registration time only ever matched by a SEPARATE free-text list typed
// manually on the inventory item itself (never even persisted to the DB) — so
// filling in a test's "kit" name never caused any real stock to be deducted.
// Adds a real nullable FK from a lab test to the inventory item it consumes.
pool
  .query(`ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS kit_inventory_id INTEGER REFERENCES lab_inventory(id) ON DELETE SET NULL`)
  .then(() => console.log("[migration] lab_tests_kit_inventory_link applied"))
  .catch((e) => console.error("[migration] lab_tests_kit_inventory_link:", e.message));

// ── Lab inventory unit cost (fixes: kit consumption never affected profit) ──
// Adds a per-unit cost on each inventory item so that automatic kit deduction
// at test-registration time can also record the real cost as a lab expense —
// previously the test catalog's "cost" fields were manual, informational-only
// numbers never wired into any profit/expense calculation anywhere.
pool
  .query(`ALTER TABLE lab_inventory ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12,2) DEFAULT 0`)
  .then(() => console.log("[migration] lab_inventory_cost_per_unit applied"))
  .catch((e) => console.error("[migration] lab_inventory_cost_per_unit:", e.message));

// ── Insurance claim linkage on invoices (فواتير شركات التأمين): رقم كشفية
//    التأمين + ربط الفاتورة بالمريض صاحب المطالبة — لازمة لطباعة كشف حساب
//    فعلي قابل لتقديمه لشركة التأمين ──
pool
  .query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS claim_no VARCHAR(100)`)
  .then(() => console.log("[migration] invoices_claim_no applied"))
  .catch((e) => console.error("[migration] invoices_claim_no:", e.message));
pool
  .query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS patient_id VARCHAR(30)`)
  .then(() => console.log("[migration] invoices_patient_id applied"))
  .catch((e) => console.error("[migration] invoices_patient_id:", e.message));
pool
  .query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS patient_name VARCHAR(200)`)
  .then(() => console.log("[migration] invoices_patient_name applied"))
  .catch((e) => console.error("[migration] invoices_patient_name:", e.message));

// ── Supplier linkage on purchase requests (شركة المورد) — كانت تُكتب كنص حر
//    داخل حقل الملاحظات فقط، وليست عموداً حقيقياً قابلاً للفلترة أو الربط
//    بدليل شركات الموردين ──
pool
  .query(`ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS supplier VARCHAR(200)`)
  .then(() => console.log("[migration] purchase_requests_supplier applied"))
  .catch((e) => console.error("[migration] purchase_requests_supplier:", e.message));

// ── ربط طلبات الشراء وسندات الصرف/القبض بحركة الصندوق (drawer_transactions)
//    التي أنشأتها فعلياً — يحل مشكلة: عند حذف الطلب/السند بعد اعتماده، كانت
//    حركة السحب/الإيداع المرتبطة تبقى معلّقة للأبد في سجل الصندوق (رصيد غير
//    صحيح + "ملاحظات" عالقة لا تُحذف)، لأنه لم يكن هناك أي رابط بينهما.
//    الآن نحفظ رقم الحركة الحقيقي من قاعدة البيانات وقت إنشائها، لنستطيع لاحقاً
//    حذفها أو تعديل مبلغها مباشرة عبر /drawers/transactions/:id بدل ترك أثر دائم ──
pool
  .query(`ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS drawer_tx_id INTEGER`)
  .then(() => console.log("[migration] purchase_requests_drawer_tx_id applied"))
  .catch((e) => console.error("[migration] purchase_requests_drawer_tx_id:", e.message));
pool
  .query(`ALTER TABLE payment_vouchers ADD COLUMN IF NOT EXISTS drawer_tx_id INTEGER`)
  .then(() => console.log("[migration] payment_vouchers_drawer_tx_id applied"))
  .catch((e) => console.error("[migration] payment_vouchers_drawer_tx_id:", e.message));
pool
  .query(`ALTER TABLE receipt_vouchers ADD COLUMN IF NOT EXISTS drawer_tx_id INTEGER`)
  .then(() => console.log("[migration] receipt_vouchers_drawer_tx_id applied"))
  .catch((e) => console.error("[migration] receipt_vouchers_drawer_tx_id:", e.message));

// ── تعليم سندات الصرف الشخصية "مُستهلَكة" بعد احتسابها ضمن صرف راتب —
//    بنفس مبدأ عمود employee_advances.repaid تماماً. قبل هذا العمود كانت
//    دالة حساب صافي الراتب تجمع كل سندات الصرف الشخصية للموظف منذ استخدام
//    النظام بدون أي تحديد بتاريخ، فيُخصم نفس السند من راتب كل شهر جديد للأبد
//    بدل أن يُخصم مرة واحدة فقط عند أول صرف راتب يشمله ──
pool
  .query(`ALTER TABLE payment_vouchers ADD COLUMN IF NOT EXISTS applied_to_payroll BOOLEAN DEFAULT false`)
  .then(() => console.log("[migration] payment_vouchers_applied_to_payroll applied"))
  .catch((e) => console.error("[migration] payment_vouchers_applied_to_payroll:", e.message));

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
