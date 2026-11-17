import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from '../lib/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, 'migrations');

/**
 * Applies every SQL file in db/migrations in filename order.
 * Safe to run repeatedly: all statements are written to be idempotent.
 */
export async function migrate() {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`✓ migration applied: ${file}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await migrate();
    console.log('✓ database migrated');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}