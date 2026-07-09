import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { generateRandomString, hashPassword } from 'better-auth/crypto'

config({ path: ['.env.local', '.env'] })

const { db } = await import('#/db/index')
const { account, formDefinitionSnapshots, forms, user } = await import('#/db/schema')
const { createDefaultFormDefinition } = await import('#/lib/form-types')

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@everestfinance.com'
const adminPassword = process.env.SEED_ADMIN_PASSWORD
const adminName = process.env.SEED_ADMIN_NAME ?? 'Formos Admin'
const seedDemoForm = process.env.SEED_DEMO_FORM !== 'false'
const demoSlug = process.env.SEED_DEMO_FORM_SLUG ?? 'demo-contact'

function createId() {
  return generateRandomString(32, 'a-z', 'A-Z', '0-9')
}

async function seedAdminUser() {
  if (!adminPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required. Example: SEED_ADMIN_PASSWORD="your-password" bun run db:seed',
    )
  }

  if (adminPassword.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters.')
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, adminEmail),
  })

  if (existing) {
    console.log(`[seed] Admin user already exists: ${adminEmail}`)
    return existing
  }

  const userId = createId()
  const hashedPassword = await hashPassword(adminPassword)

  await db.insert(user).values({
    id: userId,
    name: adminName,
    email: adminEmail,
    emailVerified: false,
  })

  await db.insert(account).values({
    id: createId(),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: hashedPassword,
  })

  console.log(`[seed] Created admin user: ${adminEmail}`)
  return { id: userId, email: adminEmail, name: adminName }
}

async function seedPublishedDemoForm(adminUserId: string) {
  const existing = await db.query.forms.findFirst({
    where: eq(forms.slug, demoSlug),
  })

  if (existing) {
    console.log(`[seed] Demo form already exists: /f/${demoSlug}`)
    return
  }

  const formId = crypto.randomUUID()
  const definition = createDefaultFormDefinition('Demo contact')

  await db.insert(forms).values({
    id: formId,
    title: 'Demo contact',
    slug: demoSlug,
    status: 'published',
    definition,
    version: 1,
    createdBy: adminUserId,
    publishedAt: new Date(),
  })

  await db.insert(formDefinitionSnapshots).values({
    id: crypto.randomUUID(),
    formId,
    version: 1,
    definition,
  })

  console.log(`[seed] Created published demo form: /f/${demoSlug}`)
}

try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Configure it in .env.local before seeding.')
  }

  const admin = await seedAdminUser()

  if (seedDemoForm) {
    await seedPublishedDemoForm(admin.id)
  }

  console.log('[seed] Done.')
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(`[seed] Failed: ${message}`)
  process.exitCode = 1
}
