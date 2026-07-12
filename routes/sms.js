/**
 * SMS Settings & Manual Send Routes
 * GET    /api/sms/settings        — get config (masked key) — any authenticated user
 * POST   /api/sms/settings        — save config              — admin only
 * POST   /api/sms/send            — manual send              — admin only
 * POST   /api/sms/test            — send a test message      — admin only
 */

import { Router } from 'express';
import {
  getSmsConfig,
  saveSmsConfig,
  decryptApiKey,
  maskApiKey,
  sendSMS,
} from '../services/smsService.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// ── GET /api/sms/settings ──────────────────────────────────────────────────────
// Returns config with masked API key — safe for frontend (no auth needed)
router.get('/settings', async (_req, res) => {
  try {
    const cfg = await getSmsConfig();
    if (!cfg) return res.json({ provider: 'jawwal', sender_id: '', enabled: false, api_key_masked: '', has_key: false });
    const plain = decryptApiKey(cfg.api_key_enc);
    res.json({
      provider:        cfg.provider,
      sender_id:       cfg.sender_id || '',
      enabled:         cfg.enabled,
      api_key_masked:  maskApiKey(plain),
      has_key:         !!plain,
    });
  } catch (err) {
    console.error('[SMS settings GET]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/sms/settings — admin only ────────────────────────────────────────
router.post('/settings', requireAdmin, async (req, res) => {
  try {
    const { provider, api_key, sender_id, enabled } = req.body;
    const isNewKey = api_key && !api_key.includes('••••');
    if (isNewKey) {
      await saveSmsConfig({ provider, apiKey: api_key, senderId: sender_id, enabled });
    } else {
      const existing = await getSmsConfig();
      const existingKey = existing ? decryptApiKey(existing.api_key_enc) : null;
      await saveSmsConfig({ provider, apiKey: existingKey, senderId: sender_id, enabled });
    }
    res.json({ ok: true, message: 'تم حفظ إعدادات SMS بنجاح' });
  } catch (err) {
    console.error('[SMS settings POST]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/sms/send — admin only ────────────────────────────────────────────
router.post('/send', requireAdmin, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone و message مطلوبان' });
  const result = await sendSMS(phone, message);
  if (result.skipped) return res.json({ ok: false, reason: 'SMS غير مفعّل في الإعدادات' });
  if (!result.ok)     return res.status(502).json({ ok: false, error: result.error || 'فشل إرسال الرسالة — تحقق من رصيد أو إعدادات SMS' });
  res.json({ ok: true });
});

// ── POST /api/sms/test — admin only ────────────────────────────────────────────
router.post('/test', requireAdmin, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
  const result = await sendSMS(phone, 'رسالة اختبارية من نظام إدارة مركز الدكتور مهند سليمان جابر ✔');
  if (result.skipped) return res.json({ ok: false, reason: 'SMS غير مفعّل في الإعدادات' });
  if (!result.ok)     return res.status(502).json({ ok: false, error: result.error || 'فشل إرسال الرسالة' });
  res.json({ ok: true, message: 'تم إرسال رسالة الاختبار بنجاح' });
});

export default router;
