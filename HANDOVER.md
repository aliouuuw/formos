# Formos — Handover Document

**Last updated:** 2026-06-10
**Repository:** `/Users/aliouwade/Documents/everest_finance/formos`

---

## What is Formos

Formos is an internal lead-generation form platform for Everest Finance. Staff build multi-step forms (Typeform-style), publish them to `/f/slug`, and track submissions, leads, and funnel analytics.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (TanStack Router + React Query + Vite + Vinxi) |
| Auth | Better Auth (via `better-auth` + Drizzle adapter) |
| API | oRPC (tRPC-like, typed RPC over HTTP) |
| ORM | Drizzle ORM + PostgreSQL |
| Styling | Tailwind CSS v4 (custom Everest design system in `src/styles.css`) |
| Components | Custom design system (`src/components/ui/*`) |
| Validation | Zod (shared between API and client) |
| Drag & Drop | `@dnd-kit/core` + `sortable` |

**Critical rule: always use `bun`** for this project.

---

## Project Structure

```
src/
  db/
    schema.ts           # Drizzle schema — forms, submissions, leads, analytics, snapshots
    db.ts               # Drizzle client init
  orpc/
    router/
      index.ts          # Router composition — routers register here
      forms.ts          # CRUD, publish, archive, stats
      submissions.ts    # Submit, list, get (with snapshot), CSV export
      analytics.ts      # Event tracking, form analytics
      leads.ts          # Lead list, stats, insights, status + assignee update
    client.ts           # oRPC client for React Query hooks
    context.ts          # Auth context (via Better Auth)
  routes/               # TanStack file-based routing
    __root.tsx          # Global layout, Sonner Toaster, sidebar
    index.tsx           # Public form renderer (via slug)
    f/$slug.tsx         # Public form page
    admin.tsx           # Admin layout with sidebar
    admin/index.tsx     # Forms list (workspace)
    admin/leads.tsx     # Lead list
    admin/forms/$formId.tsx            # Editor (build / results tabs)
    admin/forms/$formId.submissions.tsx # Submission table + CSV export
    admin/forms/$formId.submissions.$submissionId.tsx # Submission detail
  components/
    ui/                 # Design system primitives (Button, Input, Panel, etc.)
    form-builder.tsx    # Visual builder — structure rail + live preview + inspector
    form-renderer.tsx   # Public form renderer (what visitors see)
    page-header.tsx     # PageHeader (kicker, title, badge, actions)
    empty-state.tsx     # EmptyState illustration component
  lib/
    form-types.ts       # Zod schemas + TypeScript types for form definitions
    rate-limit.ts       # In-memory token-bucket rate limiter
    utils.ts            # cn() helper (Tailwind merge)
  integrations/better-auth/
    ...                 # Auth client, header user, middleware
  styles.css            # Global styles + CSS custom properties

context/
  backlog.json          # Project backlog (priority, status, notes)
  decisions.log         # ADR-style decisions

docs/
  admin-leads-roadmap.md  # Admin lead ops: current state, IPO cut, tiers
  ipo-channel-utm.md      # Campaign UTM conventions

PRODUCT.md              # Design context (register: product)
```

---

## Key Architectural Patterns

### 1. Form Definition Versioning

Every form has a `version` integer. When a form's `definition` changes via `updateForm`, the version auto-increments and a snapshot is written to `formDefinitionSnapshots` (inside a transaction). On submission, `submitForm` also writes a snapshot if the current version doesn't have one.

**Why:** Submissions must render with the exact field labels/structure that existed when the form was live. The `getSubmission` endpoint returns the matching snapshot or falls back to the current definition.

### 2. Builder ↔ JSON Dual Mode

The editor supports two modes:
- **Builder** — visual structure rail + live preview. `FormBuilder` component receives a `FormDefinition` and emits the full object on every change.
- **JSON** — direct JSON editing. Zod validation gates switching back to Builder.

The `handleSave` function validates against `formDefinitionSchema` regardless of mode before calling the API.

### 3. Live Preview

`FormBuilder` includes a `Preview` sub-component that renders the form as a visitor would see it (progress bar, step counter, styled inputs, CTA button). Clicking a field in the preview selects it in the structure rail for editing.

### 4. Results Tab

Analytics (views, starts, completions, completion rate) and funnel events live under the **Results** tab, separate from the builder. This separation is intentional — it mirrors Typeform's model.

### 5. File-Based Routing

TanStack Start uses file-based routing. Nested directories become nested routes. Route params use `$paramName`. The route tree auto-generates — if you create a new file in `routes/`, run `bunx tsr generate` to update `routeTree.gen.ts`.

### 6. Auth + Middleware

Better Auth handles session management. The admin routes (`/admin/*`) are wrapped in auth middleware. `orpc.context.ts` reads the session and attaches a user to the oRPC context. Most mutations use `authedContext` (requires login).

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `forms` | Form definitions, metadata, status, version |
| `form_definition_snapshots` | Frozen copies of form defs per version |
| `form_submissions` | Submitted answers (JSONB), formVersion, leadId |
| `leads` | Captured leads (contact, status, assignee, amount, channel, UTMs, insights JSONB) |
| `analytics_events` | Event tracking (form_started, field_answered, etc.) |

See `src/db/schema.ts` for full schema and relations.

---

## API Surface (oRPC Routers)

### Forms (`orpc.forms.*`)
- `list` — all forms
- `getById(id)` — single form
- `getBySlug(slug)` — public lookup (used by `/f/$slug`)
- `create({ title, slug, definition })`
- `update({ id, title?, slug?, definition? })` — auto-version + snapshot
- `publish(id)` / `archive(id)` — status transitions
- `stats(id)` — views, starts, completions, rate

### Submissions (`orpc.submissions.*`)
- `submit({ formId, answers, sessionId?, metadata?, lead? })` — write snapshot if missing
- `list({ formId })` — all submissions for a form (limit 500)
- `get({ formId, submissionId })` — single submission with versioned definition
- `exportCsv({ formId })` — CSV string with headers from field labels

### Analytics (`orpc.analytics.*`)
- `track({ formId, eventType, fieldId?, pageIndex? })` — fire event
- `getByForm({ formId })` — funnel + field events

### Leads (`orpc.leads.*`)
- `list({ formId?, status?, campaignId? })` — leads for owned forms (limit 200, newest first)
- `stats({ campaignId? })` — totals, by status / intent / source, conversion rate
- `insights({ campaignId? })` — amount buckets, preferred channels, agent load
- `updateStatus({ id, status })`
- `updateAssignee({ id, assignee })`

Admin UI: `/admin/leads` (campaign chips, client status filter, inline status + assignee).  
Roadmap for export, search, detail/notes, SLA queue, webhooks: [`docs/admin-leads-roadmap.md`](docs/admin-leads-roadmap.md).

---

## Design System

### Color Tokens (CSS custom properties)
- `--mauve` (deep plum) — primary accent
- `--everest-green` — positive, live, success states
- `--gold` — rare highlights, dirty-dot indicator
- `--night` — ink/text
- `--bone` — warm paper background

### Component Vocabulary
- `Button` — variants: default, everest, mauve, secondary, outline, ghost, destructive. Sizes: default, sm, lg. Supports `showArrow`.
- `Panel` + `PanelHeader` + `PanelBody` — card-like container (use sparingly; avoid nesting)
- `Input`, `Textarea`, `Label` — form primitives
- `Badge` — variants: everest, mauve, outline

### Typography
- 11px uppercase tracking-wide for labels (`text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60`)
- System font stack (SF Pro / Inter equivalent)
- Line length capped for prose

See `src/components/ui/*` for full implementations.

---

## Development Workflow

```bash
# Install dependencies
bun install

# Start dev server
bun run dev         # http://localhost:3000

# Type check (always run before committing)
bunx tsc --noEmit

# Generate route tree after adding routes
bunx tsr generate
```

**Important:** The dev server requires Bun 1.3+ or Node 22.12+. Older versions fail on Vite dependency optimization.

---

## Known Issues & Gotchas

1. **Rate limiter memory** — in-memory token-bucket. Fine for single instance, needs Redis for horizontal scaling.
2. **Analytics event noise** — events fire on every interaction; the `getFormAnalytics` endpoint groups by type but doesn't deduplicate sessions.
3. **Form renderer checkbox** — checkbox fields render as a checkbox + text label, not a boolean toggle. The `field_answered` event fires on blur, not per keystroke.
4. **CSV export** — no pagination; capped at 500 submissions. Large forms need streaming export.
5. **Preview in builder** — the live preview is a static render, not the full `FormRenderer` component. It shows field labels but not interactive validation or page transitions.

---

## Backlog (High Priority Remaining)

See `context/backlog.json` for the full list and [`docs/admin-leads-roadmap.md`](docs/admin-leads-roadmap.md) for the admin lead-ops tiers. Key remaining items:

| ID | Title | Priority | Notes |
|----|-------|----------|-------|
| `lead-csv-export` | Lead CSV export | high | Filtered export for campaign ops (submissions CSV already exists). |
| `lead-list-query` | Lead search / filters / pagination | high | Replace 200-row client filter with server query. |
| `lead-detail-notes` | Lead detail + notes | high | Assignment exists; still need detail, notes, full answers. |
| `lead-ipo-fields-ui` | Show IPO profil / compte titres | high | Extras stored but not visible in list. |
| `lead-work-queue` | Unassigned + aging queue | high | SLA vs 24h callback promise. |
| `crm-webhooks` | Slack / email on new lead | high | Inngest notify; later CRM sync. |
| `spam-honeypot` | Spam / bot protection | medium | Honeypot + rate-limit hardening. |
| `partial-submissions` | Partial submissions | medium | Abandon → warm recovery queue. |
| `embed-mode` | Embeddable forms | medium | iframe / script embed for landing pages. |
| `conditional-logic` | Conditional field logic | medium | Show/hide fields based on answers. |
| `gdpr-consent` | Retention / export / delete | low | Public consent omitted on IPO form; retention still needed. |

---

## How to Extend

### Adding a New Field Type

1. Add to `FieldType` union in `src/lib/form-types.ts`
2. Add glyph + label in `form-builder.tsx` `fieldTypes` array
3. Add preview branch in `PreviewField` (builder) and `FieldInput` (renderer)
4. Add CSV handling in `exportSubmissionsCsv` if needed

### Adding a New Route

1. Create file in `src/routes/` matching the desired path
2. Export `Route` via `createFileRoute('/path')({ component: ... })`
3. Run `bunx tsr generate`
4. Verify type check: `bunx tsc --noEmit`

### Adding an API Endpoint

1. Define handler in the appropriate router file (`src/orpc/router/*.ts`)
2. Export it from `src/orpc/router/index.ts`
3. Use it client-side via `orpc.{router}.{handler}` with React Query hooks

---

## Commits Since Last Major Milestone

- `c5aaefc` — Visual form builder with drag-and-drop fields
- `b538c32` — Typeform-style editor revamp with live preview
- `a9a2315` — Submission detail view, list table, and CSV export
- `72cf9b1` — Backlog update (submission-export-detail done)

---

## Contact / Context

This project is maintained for Everest Finance. The design direction is "calm, premium, financial-grade trust" — warm paper backgrounds, deep plum accents, quiet confidence. The builder is the product; every editing change should feel live and immediate.
