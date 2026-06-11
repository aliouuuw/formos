import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { FormDefinition } from '#/lib/form-types'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Formos domain tables
export const forms = pgTable(
  'forms',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    status: text('status').notNull().default('draft'),
    definition: jsonb('definition').$type<FormDefinition>().notNull(),
    version: integer('version').notNull().default(1),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
  },
  (table) => [
    uniqueIndex('forms_slug_idx').on(table.slug),
    index('forms_created_by_idx').on(table.createdBy),
    index('forms_status_idx').on(table.status),
  ],
)

export const formSlugRedirects = pgTable(
  'form_slug_redirects',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => [
    uniqueIndex('form_slug_redirects_slug_idx').on(table.slug),
    index('form_slug_redirects_form_id_idx').on(table.formId),
    index('form_slug_redirects_expires_at_idx').on(table.expiresAt),
  ],
)

export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    formVersion: integer('form_version').notNull(),
    sessionId: text('session_id').notNull(),
    answers: jsonb('answers').$type<Record<string, unknown>>().notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('form_submissions_form_id_idx').on(table.formId),
    index('form_submissions_session_id_idx').on(table.sessionId),
  ],
)

export const leads = pgTable(
  'leads',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => formSubmissions.id, { onDelete: 'cascade' }),
    email: text('email'),
    name: text('name'),
    phone: text('phone'),
    status: text('status').notNull().default('new'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('leads_form_id_idx').on(table.formId),
    index('leads_status_idx').on(table.status),
    index('leads_email_idx').on(table.email),
  ],
)

export const formDefinitionSnapshots = pgTable(
  'form_definition_snapshots',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    definition: jsonb('definition').$type<FormDefinition>().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('form_def_snapshots_form_version_idx').on(table.formId, table.version),
    index('form_def_snapshots_form_id_idx').on(table.formId),
  ],
)

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull(),
    eventType: text('event_type').notNull(),
    fieldId: text('field_id'),
    pageId: text('page_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('analytics_events_form_id_idx').on(table.formId),
    index('analytics_events_session_id_idx').on(table.sessionId),
    index('analytics_events_event_type_idx').on(table.eventType),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  forms: many(forms),
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const formsRelations = relations(forms, ({ one, many }) => ({
  creator: one(user, { fields: [forms.createdBy], references: [user.id] }),
  submissions: many(formSubmissions),
  leads: many(leads),
  analyticsEvents: many(analyticsEvents),
  definitionSnapshots: many(formDefinitionSnapshots),
  slugRedirects: many(formSlugRedirects),
}))

export const formSlugRedirectsRelations = relations(formSlugRedirects, ({ one }) => ({
  form: one(forms, { fields: [formSlugRedirects.formId], references: [forms.id] }),
}))

export const formDefinitionSnapshotsRelations = relations(formDefinitionSnapshots, ({ one }) => ({
  form: one(forms, { fields: [formDefinitionSnapshots.formId], references: [forms.id] }),
}))

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  form: one(forms, { fields: [formSubmissions.formId], references: [forms.id] }),
  lead: one(leads, { fields: [formSubmissions.id], references: [leads.submissionId] }),
}))

export const leadsRelations = relations(leads, ({ one }) => ({
  form: one(forms, { fields: [leads.formId], references: [forms.id] }),
  submission: one(formSubmissions, {
    fields: [leads.submissionId],
    references: [formSubmissions.id],
  }),
}))
