import express from 'express';
import multer from 'multer';
import { ZipArchive } from 'archiver';
import pool, { reconnectPool } from '../db.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  encryptText, decryptText,
  runLocalBackup, listLocalBackups, deleteLocalBackup, restoreLocalBackup,
  restoreSqlContent,
  dumpDatabaseBuffer, listAllTableNames,
  uploadJsonToDrive, validateServiceAccountJson,
  listDriveBackups, downloadDriveFile,
  extractSqlFromBackupZip,
  isValidBackupFilename,
} from '../services/backupService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// ── Restore safety net: always take a fresh local backup right before any
// destructive restore runs, then verify the DB connection afterwards. ──────
async function safetyBackupThenRun(restoreFn) {
  let safetyFilename = null;
  try {
    const safety = await runLocalBackup();
    safetyFilename = safety.filename;
  } catch (err) {
    throw new Error(`تعذّر إنشاء نسخة أمان قبل الاسترداد — تم إلغاء العملية: ${err.message}`);
  }
  await restoreFn();
  await reconnectPool();
  return { safetyFilename };
}

// ── Backup failure notifications (shown on the backup screen only) ──────────
async function notifyBackupFailure(message) {
  try {
    await pool.query('INSERT INTO backup_notifications (message) VALUES ($1)', [message]);
  } catch (err) {
    console.error('[backup] failed to record failure notification:', err.message);
  }
}

router.get('/notifications', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM backup_notifications WHERE dismissed = false ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE backup_notifications SET dismissed = true WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Method 3 — full ZIP export (pg_dump + per-table JSON), streamed download ─
router.get('/export', async (_req, res) => {
  try {
    const [sqlBuffer, tables] = await Promise.all([dumpDatabaseBuffer(), listAllTableNames()]);
    const date = new Date(Date.now()+3*60*60*1000).toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${date}.zip"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);
    archive.append(sqlBuffer, { name: 'database.sql' });

    for (const table of tables) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${JSON.stringify(table).slice(1, -1)}`);
        archive.append(JSON.stringify(rows, null, 2), { name: `tables/${table}.json` });
      } catch (err) {
        archive.append(JSON.stringify({ error: err.message }), { name: `tables/${table}.error.json` });
      }
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

// ── Method 2 — local server backup (pg_dump saved to hosting filesystem) ────
router.post('/local', requireAdmin, async (_req, res) => {
  try {
    const result = await runLocalBackup();
    res.json({ success: true, ...result });
  } catch (err) {
    await notifyBackupFailure(`فشل النسخ الاحتياطي المحلي اليدوي: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.get('/local/list', requireAdmin, async (_req, res) => {
  try {
    res.json(listLocalBackups());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── اسم الملف صار يوصل بجسم الطلب (req.body.filename) مش بمسار الرابط —
//    لأنه أي مسار ينتهي بامتداد حقيقي متل ".sql" كان بيتصادم مع قاعدة
//    "fallback" الاستضافة (أي رابط "شكله" ملف ثابت غير موجود فعلياً على
//    القرص يرجع صفحة الموقع index.html بدل ما يوصل لكود الخادم أصلاً) —
//    هيك كان زر "استرجاع" و"حذف" بشاشة النسخ المحلية يرجع صفحة HTML كاملة
//    بدل تنفيذ العملية الفعلية. إبقاء نسخة المسار القديمة (:filename) لأي
//    استدعاء خارجي قديم، بس الواجهة الأمامية صارت تستخدم النسخة الجديدة. ──
async function handleLocalRestore(req, res) {
  try {
    const filename = req.body?.filename || req.params.filename;
    if (!isValidBackupFilename(filename)) {
      return res.status(400).json({ error: 'اسم ملف غير صالح' });
    }
    const { safetyFilename } = await safetyBackupThenRun(() => restoreLocalBackup(filename));
    res.json({ success: true, safetyFilename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.post('/local/restore', requireAdmin, handleLocalRestore);
router.post('/local/restore/:filename', requireAdmin, handleLocalRestore);
// Alias matching the exact path requested for the restore feature spec.
router.post('/restore/local/:filename', requireAdmin, handleLocalRestore);

async function handleLocalDelete(req, res) {
  try {
    const filename = req.body?.filename || req.params.filename;
    if (!isValidBackupFilename(filename)) {
      return res.status(400).json({ error: 'اسم ملف غير صالح' });
    }
    deleteLocalBackup(filename);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.post('/local/delete', requireAdmin, handleLocalDelete);
router.delete('/local/:filename', requireAdmin, handleLocalDelete);

// ── Method 1 — Google Drive accounts (3 independent slots) ──────────────────
function maskDriveRow(row) {
  if (!row) return null;
  return {
    slot: row.slot,
    name: row.name,
    folder_id: row.folder_id,
    last_backup: row.last_backup,
    status: row.status,
    has_credentials: !!row.credentials_json,
  };
}

router.get('/drives', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM backup_drives ORDER BY slot');
    const bySlot = new Map(rows.map((r) => [r.slot, r]));
    const all = [1, 2, 3].map((slot) => maskDriveRow(bySlot.get(slot) || { slot, status: 'inactive' }));
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function upsertDriveSlot(slot, { name, credentials_json, folder_id }) {
  if (![1, 2, 3].includes(Number(slot))) {
    throw new Error('رقم الحساب يجب أن يكون 1 أو 2 أو 3');
  }
  const { rows: existingRows } = await pool.query('SELECT * FROM backup_drives WHERE slot = $1', [slot]);
  const existing = existingRows[0] || {};

  let credsEnc = existing.credentials_json ?? null;
  if (credentials_json) {
    validateServiceAccountJson(credentials_json);
    credsEnc = encryptText(credentials_json);
  }
  const finalName = name !== undefined ? name : existing.name ?? null;
  const finalFolderId = folder_id !== undefined ? folder_id : existing.folder_id ?? null;
  const status = (credsEnc && finalFolderId) ? 'active' : 'inactive';

  const { rows } = await pool.query(`
    INSERT INTO backup_drives (slot, name, credentials_json, folder_id, status)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (slot) DO UPDATE
      SET name = EXCLUDED.name,
          credentials_json = EXCLUDED.credentials_json,
          folder_id = EXCLUDED.folder_id,
          status = EXCLUDED.status
    RETURNING *
  `, [slot, finalName, credsEnc, finalFolderId, status]);
  return rows[0];
}

router.post('/drives', requireAdmin, async (req, res) => {
  try {
    const { slot, name, credentials_json, folder_id } = req.body;
    const row = await upsertDriveSlot(slot, { name, credentials_json, folder_id });
    res.json(maskDriveRow(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/drives/:slot', requireAdmin, async (req, res) => {
  try {
    const { name, credentials_json, folder_id } = req.body;
    const row = await upsertDriveSlot(Number(req.params.slot), { name, credentials_json, folder_id });
    res.json(maskDriveRow(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/drives/:slot', requireAdmin, async (req, res) => {
  try {
    const slot = Number(req.params.slot);
    if (![1, 2, 3].includes(slot)) return res.status(400).json({ error: 'رقم الحساب يجب أن يكون 1 أو 2 أو 3' });
    await pool.query(`
      INSERT INTO backup_drives (slot, name, credentials_json, folder_id, last_backup, status)
      VALUES ($1, NULL, NULL, NULL, NULL, 'inactive')
      ON CONFLICT (slot) DO UPDATE
        SET name = NULL, credentials_json = NULL, folder_id = NULL, last_backup = NULL, status = 'inactive'
    `, [slot]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function runDriveBackup(slot) {
  const { rows } = await pool.query('SELECT * FROM backup_drives WHERE slot = $1', [slot]);
  const row = rows[0];
  if (!row || row.status !== 'active' || !row.credentials_json || !row.folder_id) {
    throw new Error('الحساب غير مرتبط بعد');
  }
  const credentialsJson = decryptText(row.credentials_json);
  if (!credentialsJson) throw new Error('تعذّر فك تشفير بيانات الاعتماد');
  const sqlBuffer = await dumpDatabaseBuffer();
  const date = new Date(Date.now()+3*60*60*1000).toISOString().slice(0, 10);
  const filename = `backup_${date}.sql`;
  await uploadJsonToDrive({
    credentialsJson,
    folderId: row.folder_id,
    filename,
    content: sqlBuffer,
  });
  await pool.query('UPDATE backup_drives SET last_backup = NOW() WHERE slot = $1', [slot]);
  return { slot, filename };
}

router.post('/drive/all', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query("SELECT slot FROM backup_drives WHERE status = 'active'");
  const results = [];
  for (const { slot } of rows) {
    try {
      await runDriveBackup(slot);
      results.push({ slot, success: true });
    } catch (err) {
      results.push({ slot, success: false, error: err.message });
      await notifyBackupFailure(`فشل النسخ الاحتياطي لحساب Google Drive رقم ${slot}: ${err.message}`);
    }
  }
  res.json({ results });
});

router.post('/drive/:slot', requireAdmin, async (req, res) => {
  try {
    const slot = Number(req.params.slot);
    if (![1, 2, 3].includes(slot)) return res.status(400).json({ error: 'رقم الحساب يجب أن يكون 1 أو 2 أو 3' });
    const result = await runDriveBackup(slot);
    res.json({ success: true, ...result });
  } catch (err) {
    await notifyBackupFailure(`فشل النسخ الاحتياطي لحساب Google Drive رقم ${req.params.slot}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Restore — Google Drive: list existing backups in the linked folder ─────
router.get('/drive/:slot/list', requireAdmin, async (req, res) => {
  try {
    const slot = Number(req.params.slot);
    if (![1, 2, 3].includes(slot)) return res.status(400).json({ error: 'رقم الحساب يجب أن يكون 1 أو 2 أو 3' });
    const { rows } = await pool.query('SELECT * FROM backup_drives WHERE slot = $1', [slot]);
    const row = rows[0];
    if (!row || row.status !== 'active' || !row.credentials_json || !row.folder_id) {
      return res.status(400).json({ error: 'الحساب غير مرتبط بعد' });
    }
    const credentialsJson = decryptText(row.credentials_json);
    if (!credentialsJson) return res.status(500).json({ error: 'تعذّر فك تشفير بيانات الاعتماد' });
    const files = await listDriveBackups({ credentialsJson, folderId: row.folder_id });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Restore — Google Drive: download a chosen backup file and restore it ───
router.post('/restore/drive/:slot', requireAdmin, async (req, res) => {
  try {
    const slot = Number(req.params.slot);
    if (![1, 2, 3].includes(slot)) return res.status(400).json({ error: 'رقم الحساب يجب أن يكون 1 أو 2 أو 3' });
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'يجب تحديد النسخة المطلوب استردادها' });
    const { rows } = await pool.query('SELECT * FROM backup_drives WHERE slot = $1', [slot]);
    const row = rows[0];
    if (!row || row.status !== 'active' || !row.credentials_json || !row.folder_id) {
      return res.status(400).json({ error: 'الحساب غير مرتبط بعد' });
    }
    const credentialsJson = decryptText(row.credentials_json);
    if (!credentialsJson) return res.status(500).json({ error: 'تعذّر فك تشفير بيانات الاعتماد' });

    const { safetyFilename } = await safetyBackupThenRun(async () => {
      const sqlText = await downloadDriveFile({ credentialsJson, fileId });
      await restoreSqlContent(sqlText);
    });
    res.json({ success: true, safetyFilename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Restore — uploaded ZIP export (validated against this system's own export format) ─
router.post('/restore/zip', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    const sqlText = await extractSqlFromBackupZip(req.file.buffer);
    const { safetyFilename } = await safetyBackupThenRun(() => restoreSqlContent(sqlText));
    res.json({ success: true, safetyFilename });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
export { notifyBackupFailure };
