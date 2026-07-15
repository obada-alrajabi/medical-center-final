import pool from '../db.js';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

export async function createSession(token, username, role = 'admin') {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await pool.query(
    `INSERT INTO admin_sessions (token, username, role, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token)
     DO UPDATE SET expires_at = $4`,
    [token, username, role, expiresAt]
  );
}

export async function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'مطلوب تسجيل الدخول كمدير' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM admin_sessions 
       WHERE token = $1 
       AND expires_at > $2`,
      [token, new Date()]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'جلسة منتهية أو غير صالحة — سجّل الدخول مجدداً' });
    }

    req.adminSession = rows[0];
    next();

  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'خطأ في التحقق من الجلسة' });
  }
}


export async function requireFinancialAuth(req, res, next) {
  return requireAdmin(req, res, next);
}

export async function createStaffSession(token, username, staffId) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await pool.query(
    `INSERT INTO admin_sessions (token, username, role, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token) DO UPDATE SET expires_at = $4`,
    [token, username, `staff:${staffId}`, expiresAt]
  );
}
