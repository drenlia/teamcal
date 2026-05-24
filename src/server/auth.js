import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const SESSION_COOKIE = 'teamcal_session';
export const SESSION_DAYS = 7;
export const ADMIN_USERNAME = 'admin';
export const BCRYPT_ROUNDS = 12;

export function generateId() {
  return crypto.randomUUID();
}

export function generatePassword(length = 16) {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function sessionExpiryDate() {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires.toISOString();
}

export function printAdminCredentials(username, password) {
  const line = '─'.repeat(52);
  console.log('\n' + line);
  console.log('  TeamCal — initial admin account (save these credentials)');
  console.log(line);
  console.log('  Username │ ' + username);
  console.log('  Password │ ' + password);
  console.log(line + '\n');
}

/** @param {import('better-sqlite3').Database} db */
export async function ensureAdminUser(db) {
  const existing = db
    .prepare("SELECT id FROM users WHERE role = 'admin' AND team_id IS NULL LIMIT 1")
    .get();
  if (existing) return null;

  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  const id = generateId();

  db.prepare(
    `INSERT INTO users (id, username, password_hash, role, team_id) VALUES (?, ?, ?, 'admin', NULL)`
  ).run(id, ADMIN_USERNAME, passwordHash);

  return { username: ADMIN_USERNAME, password };
}

export function parseSessionCookie(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** @param {import('better-sqlite3').Database} db */
export function getSessionUser(db, sessionId) {
  if (!sessionId) return null;
  const row = db
    .prepare(
      `
      SELECT u.id, u.username, u.role, u.team_id AS teamId
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `
    )
    .get(sessionId);
  return row ?? null;
}

/** @param {import('better-sqlite3').Database} db */
export function createAuthMiddleware(db) {
  return (req, res, next) => {
    const sessionId = parseSessionCookie(req);
    const user = getSessionUser(db, sessionId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.user = user;
    next();
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
