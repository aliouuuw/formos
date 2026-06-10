import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.ts'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn(
    '[formos] DATABASE_URL is not set. Database operations will fail until configured.',
  )
}

const pool = new Pool({
  connectionString: connectionString ?? 'postgresql://postgres:postgres@localhost:5432/formos',
  max: 10,
})

export const db = drizzle(pool, { schema })
