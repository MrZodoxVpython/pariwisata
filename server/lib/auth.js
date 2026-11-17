import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const TOKEN_TTL = '8h';

export function jwtSecret() {
  return process.env.ADMIN_JWT_SECRET || '';
}

export function isJwtConfigured() {
  return jwtSecret().length >= 16;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.token_version ?? 0,
    },
    jwtSecret(),
    { expiresIn: TOKEN_TTL }
  );
}

export function decodeToken(token) {
  try {
    return jwt.verify(token, jwtSecret());
  } catch (error) {
    return null;
  }
}

/**
 * Loads the current admin from a verified token payload. Also enforces
 * account state and token_version so disabling a user or bumping the
 * version revokes every existing token.
 */
export async function loadAdminFromPayload(payload) {
  if (!payload?.sub) return null;
  const { rows } = await query(
    `select id, email, name, role, active, token_version, last_login_at, created_at
     from public.admin_users where id = $1`,
    [payload.sub]
  );
  const user = rows[0];
  if (!user || !user.active) return null;
  if (Number(payload.ver ?? 0) !== Number(user.token_version)) return null;
  return user;
}

export function publicAdminUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

export const ROLES = ['owner', 'manager', 'staff'];