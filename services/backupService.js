/**
 * Backup Service — shared helpers for all backup methods:
 *  1. Google Drive (per-account, encrypted service-account credentials)
 *  2. Local server backup (pure-JS SQL dump, kept on hosting filesystem)
 *  3. Full ZIP export (pure-JS SQL dump + per-table JSON), streamed to the browser
 *
 * All dump/restore logic uses the app's own `pg` pool (pg_catalog
 * introspection + generated SQL text) instead of shelling out to the
 * `pg_dump`/`psql` binaries, since shared hosting environments (e.g.
 * Hostinger cPanel) typically don't expose those binaries to the Node
 * process — spawning them there fails with "pg_dump failed to start".
 *
 * Encryption: AES-256-GCM, key derived from BACKUP_ENCRYPTION_KEY (required).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import pool from '../db.js';

const { escapeLiteral, escapeIdentifier } = pg;

// ── Encryption helpers (mirrors services/smsService.js convention) ──────────
const ALGO = 'aes-256-gcm';

function getEncKey() {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'BACKUP_ENCRYPTION_KEY environment variable is not set. ' +
      'Add a strong random secret (32+ chars) to your environment secrets.'
    );
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptText(plaintext) {
  if (!plaintext) return null;
  const key = getEncKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptText(stored) {
  if (!stored) return null;
  try {
    const [ivHex, tagHex, ctHex] = stored.split(':');
    const key = getEncKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const plain = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}

// ── Local backup directory ───────────────────────────────────────────────────
// Production path lives on the Hostinger filesystem. In dev (where that path
// is not writable) we fall back to a local project directory so the feature
// remains testable — mirrors the env-aware pattern used for DB SSL in db.js.
const CONFIGURED_DIR = process.env.LOCAL_BACKUP_DIR || '/home/mjcczxsn/backups';
const FALLBACK_DIR = path.join(process.cwd(), '.local_backups');
let _resolvedDir = null;

export function getLocalBackupDir() {
  if (_resolvedDir) return _resolvedDir;
  try {
    fs.mkdirSync(CONFIGURED_DIR, { recursive: true });
    _resolvedDir = CONFIGURED_DIR;
  } catch (err) {
    console.error(`[backup] cannot use configured LOCAL_BACKUP_DIR "${CONFIGURED_DIR}" (${err.message}) — falling back to "${FALLBACK_DIR}" for this environment.`);
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    _resolvedDir = FALLBACK_DIR;
  }
  return _resolvedDir;
}

// ── امتداد .zip هو الصيغة الحالية (تحتوي database.sql + ملفات uploads/sessions
//    المرفقة بالجلسات)، وامتداد .sql القديم ما زال مقبولاً هون فقط للتوافق
//    الرجعي مع نسخ محفوظة قبل هذا التحديث — أي نسخة جديدة تُنشأ الآن دائماً
//    بصيغة .zip. ──
const FILENAME_RE = /^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.(zip|sql)$/;
export function isValidBackupFilename(name) {
  return typeof name === 'string' && FILENAME_RE.test(name);
}

function pad(n) { return String(n).padStart(2, '0'); }

export function timestampedSqlFilename(d = new Date()) {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  return `backup_${date}_${time}.zip`;
}

// ── مجلد المرفقات (uploads/sessions) — ملفات حقيقية مرفوعة على ملفات
//    الجلسات (صور/تقارير خارجية/إلخ)، محفوظة على قرص السيرفر بمعزل عن
//    قاعدة البيانات. لازم تنضم لأي نسخة احتياطية كاملة، وإلا بتضيع لو انفصل
//    القرص عن قاعدة البيانات. ──
const UPLOADS_SESSIONS_DIR = path.join(process.cwd(), 'uploads', 'sessions');
const ZIP_UPLOADS_PREFIX = 'uploads/sessions/';

function listUploadFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (d, rel) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(abs, relPath);
      else out.push({ abs, relPath });
    }
  };
  walk(dir, '');
  return out;
}

/** Builds the full backup ZIP buffer: database.sql + every file under uploads/sessions. */
export async function buildBackupZipBuffer() {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip();
  const sqlBuffer = await dumpDatabaseBuffer();
  zip.addFile('database.sql', sqlBuffer);
  for (const { abs, relPath } of listUploadFilesRecursive(UPLOADS_SESSIONS_DIR)) {
    zip.addLocalFile(abs, path.dirname(`${ZIP_UPLOADS_PREFIX}${relPath}`) === '.' ? '' : path.dirname(`${ZIP_UPLOADS_PREFIX}${relPath}`));
  }
  return zip.toBuffer();
}

/**
 * Extracts a backup ZIP into { sqlText, uploadFiles } — uploadFiles is a list
 * of { relPath, data } for every entry under uploads/sessions/ in the archive.
 * Accepts either the full backup format (database.sql + uploads/sessions/*)
 * or the older Method-3 export format (database.sql + tables/*.json, no files).
 */
export async function extractBackupZip(buffer) {
  const AdmZip = (await import('adm-zip')).default;
  let zip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new Error('الملف المرفوع ليس ملف ZIP صالح');
  }
  const entry = zip.getEntry('database.sql');
  if (!entry) {
    throw new Error('هذا الملف ليس نسخة احتياطية صادرة من هذا النظام (لا يحتوي database.sql)');
  }
  const sqlText = entry.getData().toString('utf8');
  if (!/PostgreSQL database dump/i.test(sqlText) && !/^--/.test(sqlText.trim())) {
    throw new Error('محتوى database.sql داخل الملف غير صالح');
  }
  const uploadFiles = zip.getEntries()
    .filter((e) => !e.isDirectory && e.entryName.startsWith(ZIP_UPLOADS_PREFIX))
    .map((e) => ({ relPath: e.entryName.slice(ZIP_UPLOADS_PREFIX.length), data: e.getData() }));
  return { sqlText, uploadFiles };
}

/** Writes extracted upload files back to disk under uploads/sessions (merge, does not delete existing files). */
function restoreUploadFiles(uploadFiles) {
  for (const { relPath, data } of uploadFiles) {
    if (!relPath || relPath.includes('..')) continue; // safety: no path traversal
    const dest = path.join(UPLOADS_SESSIONS_DIR, relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
  }
}

/** Restores the database and uploads/sessions attachments from a full backup ZIP buffer (Drive download or manual upload). */
export async function restoreFromZipBuffer(buffer) {
  const { sqlText, uploadFiles } = await extractBackupZip(buffer);
  await restoreSqlContent(sqlText);
  restoreUploadFiles(uploadFiles);
  return true;
}

// ── Pure-JS logical dump/restore ─────────────────────────────────────────────
// Shared hosting (e.g. Hostinger cPanel) does not expose the `pg_dump` /
// `psql` binaries to the Node app process, so shelling out to them fails
// with "pg_dump failed to start" (spawn ENOENT). All backup/restore paths
// below instead use the app's own `pg` connection (`pool`) to introspect the
// schema (via pg_catalog) and serialize data as plain SQL text — no external
// binaries required, so this works identically in dev and on hosting.

function pgArrayElem(v) {
  if (v === null || v === undefined) return 'NULL';
  const s = String(v);
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sqlLiteral(value, dataType) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return escapeLiteral(value.toISOString());
  if (Buffer.isBuffer(value)) return `'\\x${value.toString('hex')}'`;
  if (Array.isArray(value) && dataType && dataType.endsWith('[]')) {
    const literal = `{${value.map(pgArrayElem).join(',')}}`;
    return `${escapeLiteral(literal)}::${dataType}`;
  }
  if (Array.isArray(value) || (typeof value === 'object' && (dataType === 'jsonb' || dataType === 'json'))) {
    const suffix = dataType === 'jsonb' ? '::jsonb' : dataType === 'json' ? '::json' : '';
    return `${escapeLiteral(JSON.stringify(value))}${suffix}`;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return escapeLiteral(String(value));
}

/** Introspects every base table in the `public` schema (columns, PK/UK/FK, indexes, sequences). */
async function introspectSchema() {
  const { rows: tables } = await pool.query(`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `);

  const { rows: sequences } = await pool.query(`
    SELECT sequencename, start_value, min_value, max_value, increment_by, cycle, cache_size, last_value
    FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename
  `);

  const tableInfo = [];
  for (const { table_name } of tables) {
    const { rows: columns } = await pool.query(`
      SELECT a.attname AS column_name,
             format_type(a.atttypid, a.atttypmod) AS data_type,
             a.attnotnull AS not_null,
             pg_get_expr(d.adbin, d.adrelid) AS column_default,
             a.attgenerated AS generated
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      WHERE n.nspname = 'public' AND c.relname = $1 AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum
    `, [table_name]);

    const { rows: constraints } = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = $1::regclass
      ORDER BY CASE contype WHEN 'p' THEN 0 WHEN 'u' THEN 1 ELSE 2 END, conname
    `, [table_name]);

    const { rows: indexes } = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
        AND indexname NOT IN (SELECT conname FROM pg_constraint WHERE conrelid = $1::regclass)
    `, [table_name]);

    tableInfo.push({ table_name, columns, constraints, indexes });
  }

  return { tableInfo, sequences };
}

/** Builds a full plain-SQL dump (schema + data) without any external binary. */
export async function dumpDatabaseBuffer() {
  const { tableInfo, sequences } = await introspectSchema();
  const lines = [];
  lines.push('-- PostgreSQL database dump (pure-JS, generated by backupService.js)');
  lines.push(`-- Generated at ${new Date().toISOString()}`);
  lines.push('');
  lines.push('SET client_min_messages = warning;');
  lines.push('');

  for (const seq of sequences) {
    lines.push(`DROP SEQUENCE IF EXISTS ${escapeIdentifier(seq.sequencename)} CASCADE;`);
    lines.push(
      `CREATE SEQUENCE ${escapeIdentifier(seq.sequencename)} ` +
      `START WITH ${seq.start_value} INCREMENT BY ${seq.increment_by} ` +
      `MINVALUE ${seq.min_value} MAXVALUE ${seq.max_value} ` +
      `CACHE ${seq.cache_size}${seq.cycle ? ' CYCLE' : ''};`
    );
  }
  lines.push('');

  for (const { table_name, columns } of tableInfo) {
    lines.push(`DROP TABLE IF EXISTS ${escapeIdentifier(table_name)} CASCADE;`);
    const colDefs = columns.map((c) => {
      let def = `  ${escapeIdentifier(c.column_name)} ${c.data_type}`;
      if (c.generated && c.generated !== '' && c.column_default) {
        // Generated column (e.g. invoices.remaining) — reproduce as GENERATED ALWAYS, not a plain default.
        def += ` GENERATED ALWAYS AS (${c.column_default}) STORED`;
      } else {
        if (c.column_default) def += ` DEFAULT ${c.column_default}`;
        if (c.not_null) def += ' NOT NULL';
      }
      return def;
    });
    lines.push(`CREATE TABLE ${escapeIdentifier(table_name)} (\n${colDefs.join(',\n')}\n);`);
    lines.push('');
  }

  // Primary key / unique constraints go on before data loads so the table
  // shape matches production, but foreign keys and indexes are deferred
  // until AFTER data is loaded (mirrors pg_dump's own ordering) — otherwise
  // alphabetical per-table insert order would violate FKs whose referenced
  // rows haven't been inserted yet (e.g. staff_dept_permissions before
  // staff_members).
  for (const { table_name, constraints } of tableInfo) {
    for (const con of constraints.filter((c) => c.contype === 'p' || c.contype === 'u')) {
      lines.push(`ALTER TABLE ${escapeIdentifier(table_name)} ADD CONSTRAINT ${escapeIdentifier(con.conname)} ${con.def};`);
    }
  }
  lines.push('');

  for (const { table_name, columns } of tableInfo) {
    const { rows } = await pool.query(`SELECT * FROM ${escapeIdentifier(table_name)}`);
    if (!rows.length) continue;
    const insertableColumns = columns.filter((c) => !c.generated || c.generated === '');
    const colNames = insertableColumns.map((c) => c.column_name);
    const colTypeByName = Object.fromEntries(insertableColumns.map((c) => [c.column_name, c.data_type]));
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const valuesSql = batch
        .map((row) => `(${colNames.map((name) => sqlLiteral(row[name], colTypeByName[name])).join(', ')})`)
        .join(',\n');
      lines.push(
        `INSERT INTO ${escapeIdentifier(table_name)} (${colNames.map(escapeIdentifier).join(', ')}) VALUES\n${valuesSql};`
      );
    }
    lines.push('');
  }

  // Plain (non-constraint-backed) indexes after data load.
  for (const { indexes } of tableInfo) {
    for (const idx of indexes) {
      lines.push(`${idx.indexdef};`);
    }
  }
  lines.push('');

  // Foreign keys last, once all rows exist and every referenced unique key/index is in place.
  for (const { table_name, constraints } of tableInfo) {
    for (const con of constraints.filter((c) => c.contype !== 'p' && c.contype !== 'u')) {
      lines.push(`ALTER TABLE ${escapeIdentifier(table_name)} ADD CONSTRAINT ${escapeIdentifier(con.conname)} ${con.def};`);
    }
  }
  lines.push('');

  for (const seq of sequences) {
    lines.push(`SELECT setval(${escapeLiteral(seq.sequencename)}, ${seq.last_value}, true);`);
  }

  return Buffer.from(lines.join('\n'), 'utf8');
}

/** Generates a full backup ZIP (database.sql + uploads/sessions files) and saves it as a timestamped .zip file inside the local backup dir. */
export async function runLocalBackup() {
  const dir = getLocalBackupDir();
  const filename = timestampedSqlFilename();
  const filePath = path.join(dir, filename);
  const buffer = await buildBackupZipBuffer();
  fs.writeFileSync(filePath, buffer);
  await pruneOldLocalBackups(30);
  const stat = fs.statSync(filePath);
  return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
}

export function listLocalBackups() {
  const dir = getLocalBackupDir();
  const files = fs.readdirSync(dir).filter(isValidBackupFilename);
  return files
    .map((filename) => {
      const stat = fs.statSync(path.join(dir, filename));
      return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function pruneOldLocalBackups(keep = 30) {
  const all = listLocalBackups();
  const toDelete = all.slice(keep);
  const dir = getLocalBackupDir();
  for (const f of toDelete) {
    try { fs.unlinkSync(path.join(dir, f.filename)); } catch { /* ignore */ }
  }
  return toDelete.length;
}

export function deleteLocalBackup(filename) {
  if (!isValidBackupFilename(filename)) throw new Error('اسم ملف غير صالح');
  const dir = getLocalBackupDir();
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) throw new Error('الملف غير موجود');
  fs.unlinkSync(filePath);
}

/**
 * Restores the database from raw SQL text (e.g. downloaded from Google Drive,
 * extracted from an uploaded ZIP, or read from a local .sql backup file).
 * Runs the whole script as one query — Postgres' simple query protocol
 * executes multi-statement text as an implicit transaction, so a failure
 * partway through rolls back everything instead of leaving a half-restored DB.
 */
export async function restoreSqlContent(sqlText) {
  const client = await pool.connect();
  try {
    await client.query(sqlText);
  } catch (err) {
    throw new Error(`فشل تنفيذ سكربت الاسترداد: ${err.message}`);
  } finally {
    client.release();
  }
  return true;
}

/** Restores the database (and, for .zip backups, the uploads/sessions attachments) from a local backup file. */
export async function restoreLocalBackup(filename) {
  if (!isValidBackupFilename(filename)) throw new Error('اسم ملف غير صالح');
  const dir = getLocalBackupDir();
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) throw new Error('الملف غير موجود');
  if (filename.endsWith('.zip')) {
    const buffer = fs.readFileSync(filePath);
    const { sqlText, uploadFiles } = await extractBackupZip(buffer);
    await restoreSqlContent(sqlText);
    restoreUploadFiles(uploadFiles);
    return true;
  }
  // نسخة قديمة بصيغة .sql خام (من قبل هذا التحديث) — قاعدة بيانات فقط، بدون مرفقات.
  const sqlText = fs.readFileSync(filePath, 'utf8');
  return restoreSqlContent(sqlText);
}

/** Lists all user tables in the public schema. */
export async function listAllTableNames() {
  const { rows } = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  return rows.map((r) => r.tablename);
}

// ── Google Drive upload (service-account JWT auth) ──────────────────────────
export async function uploadJsonToDrive({ credentialsJson, folderId, filename, content, mimeType }) {
  const { google } = await import('googleapis');
  let creds;
  try {
    creds = JSON.parse(credentialsJson);
  } catch {
    throw new Error('ملف اعتماد Google غير صالح (JSON تالف)');
  }
  if (!creds.client_email || !creds.private_key) {
    throw new Error('ملف اعتماد Google لا يحتوي على client_email أو private_key');
  }
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  // ── محتوى .zip ثنائي — لازم يترفع كـ stream من Buffer خام، مش نص UTF-8،
  //    وإلا بينكسر أول ما يتفك ضغطه (google-api-nodejs-client بيتوقع stream
  //    قابل للقراءة لمحتوى ثنائي، مش نص). ──
  const isBinary = (mimeType || '').includes('zip');
  const { Readable } = await import('stream');
  const res = await drive.files.create({
    requestBody: { name: filename, parents: folderId ? [folderId] : undefined },
    media: { mimeType: mimeType || 'application/json', body: isBinary ? Readable.from(Buffer.from(content)) : Buffer.from(content).toString('utf8') },
    fields: 'id,name',
  });
  return res.data;
}

/** Lists .sql backup files previously uploaded to a Drive folder by this service account. */
export async function listDriveBackups({ credentialsJson, folderId }) {
  const { google } = await import('googleapis');
  const creds = JSON.parse(credentialsJson);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,size,createdTime)',
    orderBy: 'createdTime desc',
    pageSize: 100,
  });
  return (res.data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    size: f.size ? Number(f.size) : null,
    created_at: f.createdTime,
  }));
}

/** Downloads a Drive file's raw content as a Buffer (used for .zip backups containing DB + attachments). */
export async function downloadDriveFileBuffer({ credentialsJson, fileId }) {
  const { google } = await import('googleapis');
  const creds = JSON.parse(credentialsJson);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

/** Downloads a Drive file's content as a UTF-8 string (legacy path — used only for pre-update plain .sql backups). */
export async function downloadDriveFile({ credentialsJson, fileId }) {
  const buffer = await downloadDriveFileBuffer({ credentialsJson, fileId });
  return buffer.toString('utf8');
}

/**
 * Validates that an uploaded buffer is a real backup ZIP produced by this
 * system's own export (Method 3) — i.e. it must contain a `database.sql`
 * entry. Returns the extracted SQL text, or throws if invalid.
 */
export async function extractSqlFromBackupZip(buffer) {
  const AdmZip = (await import('adm-zip')).default;
  let zip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new Error('الملف المرفوع ليس ملف ZIP صالح');
  }
  const entry = zip.getEntry('database.sql');
  if (!entry) {
    throw new Error('هذا الملف ليس نسخة احتياطية صادرة من هذا النظام (لا يحتوي database.sql)');
  }
  const sqlText = entry.getData().toString('utf8');
  if (!/PostgreSQL database dump/i.test(sqlText) && !/^--/.test(sqlText.trim())) {
    throw new Error('محتوى database.sql داخل الملف غير صالح');
  }
  return sqlText;
}

export function validateServiceAccountJson(rawJson) {
  let creds;
  try {
    creds = JSON.parse(rawJson);
  } catch {
    throw new Error('ملف JSON غير صالح');
  }
  if (creds.type !== 'service_account' || !creds.client_email || !creds.private_key) {
    throw new Error('هذا ليس ملف Google Service Account صالح');
  }
  return creds;
}
