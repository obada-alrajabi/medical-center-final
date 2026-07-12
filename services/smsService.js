/**
 * SMS Service — Jawwal Palestine Gateway
 * ----------------------------------------
 * - API keys are AES-256-GCM encrypted before storage
 * - Decryption happens only server-side at send time
 * - Frontend receives only a masked key (never the full plaintext)
 */

import crypto from 'crypto';
import pool from '../db.js';

// ── Encryption helpers ─────────────────────────────────────────────────────────
const ALGO = 'aes-256-gcm';

function getEncKey() {
  const raw = process.env.SMS_ENCRYPTION_KEY;
  if (!raw) {
    // Encryption key is required — refuse to operate silently with a weak default.
    throw new Error(
      'SMS_ENCRYPTION_KEY environment variable is not set. ' +
      'Add a strong random secret (32+ chars) to your environment secrets.'
    );
  }
  // Derive a 32-byte key from the provided secret
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptApiKey(plaintext) {
  if (!plaintext) return null;
  const key = getEncKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as hex: iv:tag:ciphertext
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptApiKey(stored) {
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

export function maskApiKey(plaintext) {
  if (!plaintext || plaintext.length < 6) return '••••••••';
  return plaintext.slice(0, 4) + '••••••••' + plaintext.slice(-3);
}

// ── DB helpers ─────────────────────────────────────────────────────────────────
export async function ensureSmsSettingsTable() {
  // Single-row table: row with id=1 is the sole configuration record.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sms_settings (
      id            INTEGER       PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      provider      VARCHAR(100)  NOT NULL DEFAULT 'jawwal',
      api_key_enc   TEXT,
      sender_id     VARCHAR(50),
      enabled       BOOLEAN       NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `);
  // Seed the single row if the table is still empty (handles first run).
  await pool.query(`
    INSERT INTO sms_settings (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `);
}

export async function getSmsConfig() {
  const { rows } = await pool.query('SELECT * FROM sms_settings WHERE id=1');
  return rows[0] ?? null;
}

export async function saveSmsConfig({ provider, apiKey, senderId, enabled }) {
  const encKey = encryptApiKey(apiKey);
  const { rows } = await pool.query(`
    INSERT INTO sms_settings (id, provider, api_key_enc, sender_id, enabled)
    VALUES (1, $1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE
      SET provider      = EXCLUDED.provider,
          api_key_enc   = EXCLUDED.api_key_enc,
          sender_id     = EXCLUDED.sender_id,
          enabled       = EXCLUDED.enabled,
          updated_at    = NOW()
    RETURNING *
  `, [provider || 'jawwal', encKey, senderId || null, enabled !== false]);
  return rows[0];
}

// ── Jawwal SMS API ─────────────────────────────────────────────────────────────
// Jawwal Palestine REST SMS API
// Docs: https://sms.jawwal.ps — standard HTTPSMS REST endpoint
const JAWWAL_API_URL = 'https://sms.jawwal.ps/HTTPSMS/Service.svc/REST/SendSMS';

/**
 * Send an SMS via Jawwal gateway.
 * @param {string} to      — recipient phone (e.g. 0599123456 or 970599123456)
 * @param {string} message — UTF-8 message body
 * @returns {{ ok: boolean, status?: number, body?: string, error?: string }}
 */
export async function sendSmsViaJawwal(apiKey, senderId, to, message) {
  // Normalise phone: ensure it starts with 970
  const phone = normalisePhone(to);
  if (!phone) return { ok: false, error: 'رقم الهاتف غير صالح' };

  // Jawwal API accepts JSON POST
  const payload = {
    userName:   '',          // not needed when using API key auth
    password:   apiKey,      // Jawwal uses the API key as the password field
    userSender: senderId || 'Medical',
    recipientno: phone,
    msgBody:    message,
  };

  try {
    const res = await fetch(JAWWAL_API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    const ok = res.ok || res.status === 200;
    if (!ok) {
      console.error(`[SMS] Jawwal HTTP ${res.status}: ${text}`);
    }
    return { ok, status: res.status, body: text };
  } catch (err) {
    console.error('[SMS] Network/timeout error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * High-level send — loads config from DB, decrypts key, sends.
 * Logs errors silently; never throws (so callers never crash).
 * @returns {{ ok: boolean, skipped?: boolean, error?: string }}
 */
export async function sendSMS(phone, message) {
  try {
    const cfg = await getSmsConfig();
    if (!cfg || !cfg.enabled) return { ok: false, skipped: true, reason: 'SMS disabled' };

    const apiKey = decryptApiKey(cfg.api_key_enc);
    if (!apiKey) return { ok: false, error: 'API key not configured' };

    const result = await sendSmsViaJawwal(apiKey, cfg.sender_id, phone, message);
    if (!result.ok) {
      console.warn(`[SMS] Send failed → phone=${phone} status=${result.status} err=${result.error}`);
    }
    return result;
  } catch (err) {
    console.error('[SMS] Unexpected error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Phone normalisation ────────────────────────────────────────────────────────
function normalisePhone(raw) {
  if (!raw) return null;
  let p = String(raw).replace(/\D/g, '');
  if (!p) return null;
  if (p.startsWith('00970')) p = p.slice(2);      // 00970xxx → 970xxx
  if (p.startsWith('0'))    p = '970' + p.slice(1); // 0599xxx  → 970599xxx
  if (!p.startsWith('970')) p = '970' + p;
  return p.length >= 12 ? p : null;
}
