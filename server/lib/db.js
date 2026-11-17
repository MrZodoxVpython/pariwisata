import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });

const { Pool } = pg;

function stripUnsupportedSslParams(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    // pg v8 treats sslmode=require as verify-full, which fails against
    // Supabase's pooler certificate chain. TLS is configured on the pool.
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    return url.toString();
  } catch {
    return value;
  }
}

function buildFromPostgresParts() {
  const host = process.env.POSTGRES_HOST || process.env.PGHOST;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  if (!host || !password) return '';

  const user = process.env.POSTGRES_USER || process.env.PGUSER || 'postgres';
  const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || 'postgres';
  const port = process.env.POSTGRES_PORT || process.env.PGPORT || '5432';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const candidates = [
  ['DATABASE_URL', process.env.DATABASE_URL],
  ['POSTGRES_URL', process.env.POSTGRES_URL],
  ['SUPABASE_DB_URL', process.env.SUPABASE_DB_URL],
  ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
  ['POSTGRES_URL_NON_POOLING', process.env.POSTGRES_URL_NON_POOLING],
  ['POSTGRES_*', buildFromPostgresParts()],
];

const detected = candidates.find(([, value]) => Boolean(value));
export const databaseUrlSource = detected?.[0] || null;
export const connectionString = stripUnsupportedSslParams(detected?.[1] || '');
export const isDatabaseConfigured = Boolean(connectionString);

if (!isDatabaseConfigured) {
  console.error(
    'DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables ' +
      '(or copy server/.env.example to server/.env for local development).'
  );
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = isDatabaseConfigured
  ? new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error', err);
  });
}

export function query(text, params) {
  if (!pool) {
    return Promise.reject(
      new Error(
        'DATABASE_URL is not configured. Add DATABASE_URL to Vercel Environment Variables and redeploy.'
      )
    );
  }
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  if (!pool) {
    throw new Error(
      'DATABASE_URL is not configured. Add DATABASE_URL to Vercel Environment Variables and redeploy.'
    );
  }

  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}