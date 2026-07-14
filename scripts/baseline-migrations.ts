/**
 * Record migrations already applied when the DB was built via db:push
 * (empty drizzle.__drizzle_migrations but tables/columns exist).
 *
 * Usage: bun run db:baseline
 * Then:  bun run db:migrate   # applies only pending migrations
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

import journal from '../drizzle/meta/_journal.json'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('[baseline] DATABASE_URL is not set')
  process.exit(1)
}

const ROOT = join(import.meta.dir, '..')

function migrationHash(tag: string): string {
  const sql = readFileSync(join(ROOT, 'drizzle', `${tag}.sql`), 'utf8')
  return createHash('sha256').update(sql).digest('hex')
}

/** Returns true if this migration's changes appear to already be in the DB. */
async function migrationAlreadyApplied(
  client: pg.PoolClient,
  tag: string,
): Promise<boolean> {
  if (tag === '0000_nostalgic_luke_cage') {
    const r = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forms'`,
    )
    return r.rowCount !== null && r.rowCount > 0
  }
  if (tag === '0001_easy_mordo' || tag === '0002_colossal_madrox') {
    // Later structural migrations — if forms exists, assume applied via push
    const r = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'form_slug_redirects'`,
    )
    return r.rowCount !== null && r.rowCount > 0
  }
  if (tag === '0003_talented_jubilee') {
    const r = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'intent'`,
    )
    return r.rowCount !== null && r.rowCount > 0
  }
  if (tag === '0004_numerous_sandman') {
    const r = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'campaign_id'`,
    )
    return r.rowCount !== null && r.rowCount > 0
  }
  if (tag === '0005_careful_garia') {
    const r = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaign_settings'`,
    )
    return r.rowCount !== null && r.rowCount > 0
  }
  return false
}

const pool = new pg.Pool({ connectionString })

try {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS drizzle;
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `)

    const { rows } = await client.query<{ hash: string }>(
      'SELECT hash FROM drizzle.__drizzle_migrations',
    )
    const applied = new Set(rows.map((r) => r.hash))

    let inserted = 0
    for (const entry of journal.entries) {
      const hash = migrationHash(entry.tag)
      if (applied.has(hash)) {
        console.log(`[baseline] skip ${entry.tag} (already in journal)`)
        continue
      }

      const inDb = await migrationAlreadyApplied(client, entry.tag)
      if (!inDb) {
        console.log(`[baseline] pending ${entry.tag} — will run via db:migrate`)
        continue
      }

      await client.query(
        'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
        [hash, entry.when],
      )
      console.log(`[baseline] recorded ${entry.tag} (schema already matches)`)
      inserted += 1
    }

    if (inserted === 0) {
      console.log('[baseline] Done. Run: bun run db:migrate')
    } else {
      console.log(`[baseline] Recorded ${inserted} migration(s). Run: bun run db:migrate`)
    }
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
