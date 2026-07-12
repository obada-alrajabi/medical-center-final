/**
 * adminAuth middleware — validates Bearer token issued at admin login.
 * Tokens are stored in the shared in-memory Map exported from server.js.
 * On server restart tokens are cleared; the admin must re-login.
 */

// BUG-12 fix: 8-hour token TTL — stolen tokens expire automatically
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

// Module-level token store (shared across routes via import)
export const adminTokens = new Map(); // token → { username, createdAt }

/**
 * Express middleware: requires a valid admin Bearer token.
 * Sends 401 if missing, 403 if invalid/expired.
 */
export function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'مطلوب تسجيل الدخول كمدير' });
  }
  const session = adminTokens.get(token);
  if (!session) {
    return res.status(403).json({ error: 'جلسة منتهية أو غير صالحة — سجّل الدخول مجدداً' });
  }
  if (Date.now() - session.createdAt > TOKEN_TTL_MS) {
    adminTokens.delete(token);
    return res.status(403).json({ error: 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً' });
  }
  req.adminSession = session;
  next();
}

// Staff session token store — issued at staff login (see routes/settings.js).
// token → { staffId, username, createdAt }
export const staffTokens = new Map();

/**
 * requireFinancialAuth — gate for money-moving endpoints.
 *
 * A financial write is allowed for ANY authenticated actor: an admin OR a
 * logged-in staff member. This closes the "anonymous internet user can move
 * money" hole (the core threat) while preserving the staff workflows that
 * legitimately create deposits, withdrawals, vouchers and purchase requests.
 * Fine-grained capability (which staff may do what) remains enforced by the
 * per-department permission UI; this middleware only proves identity.
 *
 * Admin-only maintenance (deleting ledgered records, resets, staff/settings
 * management) must keep using requireAdmin instead.
 */
export function requireFinancialAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'مطلوب تسجيل الدخول لإجراء عملية مالية' });
  }
  const admin = adminTokens.get(token);
  if (admin) {
    if (Date.now() - admin.createdAt > TOKEN_TTL_MS) {
      adminTokens.delete(token);
      return res.status(403).json({ error: 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً' });
    }
    req.financialActor = { kind: 'admin', username: admin.username };
    req.adminSession = admin;
    return next();
  }
  const staff = staffTokens.get(token);
  if (staff) {
    if (Date.now() - staff.createdAt > TOKEN_TTL_MS) {
      staffTokens.delete(token);
      return res.status(403).json({ error: 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً' });
    }
    req.financialActor = { kind: 'staff', username: staff.username, staffId: staff.staffId };
    return next();
  }
  return res.status(403).json({ error: 'جلسة منتهية أو غير صالحة — سجّل الدخول مجدداً' });
}
