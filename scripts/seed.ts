import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { generateRandomString, hashPassword } from 'better-auth/crypto'

config({ path: ['.env.local', '.env'] })

const { db } = await import('#/db/index')
const { account, formDefinitionSnapshots, forms, user } = await import('#/db/schema')
const { createDefaultFormDefinition } = await import('#/lib/form-types')
const {
  createIpoInfosFormDefinition,
  createIpoSubscribeFormDefinition,
  IPO_FORM_SLUGS,
} = await import('#/lib/ipo-campaign')

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@everestfinance.com'
const adminPassword = process.env.SEED_ADMIN_PASSWORD
const adminName = process.env.SEED_ADMIN_NAME ?? 'Formos Admin'
const seedDemoForm = process.env.SEED_DEMO_FORM !== 'false'
const demoSlug = process.env.SEED_DEMO_FORM_SLUG ?? 'demo-contact'
const seedIpoCampaign = process.env.SEED_IPO_CAMPAIGN !== 'false'

function createId() {
  return generateRandomString(32, 'a-z', 'A-Z', '0-9')
}

async function seedAdminUser() {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, adminEmail),
  })

  if (existing) {
    console.log(`[seed] Admin user already exists: ${adminEmail}`)
    return existing
  }

  if (!adminPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required to create the first admin. Example: SEED_ADMIN_PASSWORD="your-password" bun run db:seed',
    )
  }

  if (adminPassword.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters.')
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

/** Use configured admin, or any existing user when only seeding forms. */
async function resolveSeedUser() {
  const byEmail = await db.query.user.findFirst({
    where: eq(user.email, adminEmail),
  })
  if (byEmail) return byEmail

  const anyUser = await db.query.user.findFirst()
  if (anyUser) {
    console.log(`[seed] No user for ${adminEmail}; using ${anyUser.email} for form seeding`)
    return anyUser
  }

  return seedAdminUser()
}

async function seedPublishedForm(
  adminUserId: string,
  options: { slug: string; title: string; definition: ReturnType<typeof createDefaultFormDefinition> },
) {
  const existing = await db.query.forms.findFirst({
    where: eq(forms.slug, options.slug),
  })

  if (existing) {
    console.log(`[seed] Form already exists: /f/${options.slug}`)
    return
  }

  const formId = crypto.randomUUID()

  await db.insert(forms).values({
    id: formId,
    title: options.title,
    slug: options.slug,
    status: 'published',
    definition: options.definition,
    version: 1,
    createdBy: adminUserId,
    publishedAt: new Date(),
  })

  await db.insert(formDefinitionSnapshots).values({
    id: crypto.randomUUID(),
    formId,
    version: 1,
    definition: options.definition,
  })

  console.log(`[seed] Created published form: /f/${options.slug}`)
}

async function seedPublishedDemoForm(adminUserId: string) {
  await seedPublishedForm(adminUserId, {
    slug: demoSlug,
    title: 'Demo contact',
    definition: createDefaultFormDefinition('Demo contact'),
  })
}

async function seedIpoCampaignForms(adminUserId: string) {
  await seedPublishedForm(adminUserId, {
    slug: IPO_FORM_SLUGS.subscribe,
    title: 'IPO Bridge Bank — Je veux souscrire',
    definition: createIpoSubscribeFormDefinition(),
  })

  await seedPublishedForm(adminUserId, {
    slug: IPO_FORM_SLUGS.infos,
    title: 'IPO Bridge Bank — Guide & informations',
    definition: createIpoInfosFormDefinition(),
  })

  console.log(`[seed] IPO campaign landing: /ipo-bridge-bank`)
}

try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Configure it in .env.local before seeding.')
  }

  const admin = await resolveSeedUser()

  if (seedDemoForm) {
    await seedPublishedDemoForm(admin.id)
  }

  if (seedIpoCampaign) {
    await seedIpoCampaignForms(admin.id)
  }

  console.log('[seed] Done.')
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(`[seed] Failed: ${message}`)
  process.exitCode = 1
}
