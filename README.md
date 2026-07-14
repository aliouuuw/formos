# Formos

Internal Typeform-style lead capture platform for Everest Finance.

## Stack

- **TanStack Start** (React 19, SSR, file routes)
- **oRPC** (typed API + OpenAPI at `/api`)
- **Drizzle ORM** + **Neon Postgres**
- **Better Auth** (email/password, TanStack Start cookies)
- **Inngest** (background jobs on submission)
- **Bun** (package manager + runtime)

## Quick start

### 1. Database

**Local Postgres (simplest)**

```bash
docker compose up -d postgres
cp .env.example .env.local
# Set BETTER_AUTH_SECRET: openssl rand -base64 32
```

**Neon Local (branchable cloud dev DB)**

```bash
# Add NEON_API_KEY + NEON_PROJECT_ID to .env.local
docker compose --profile neon up -d neon-local
```

### 2. Install & migrate

```bash
bun install
bun run db:push
bun run db:seed
```

Set a password for the first admin user when seeding:

```bash
SEED_ADMIN_EMAIL=you@everestfinance.com \
SEED_ADMIN_PASSWORD='choose-a-strong-password' \
bun run db:seed
```

Sign-up is disabled in the app, so `db:seed` is how you provision admin accounts (local or production DB).

### 3. Run

```bash
# Terminal 1
bun run dev

# Terminal 2 (optional, for background jobs)
bun run inngest:dev
```

Open [http://localhost:3000](http://localhost:3000).

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/ipo-bridge-bank` (IPO campaign) |
| `/ipo-bridge-bank` | IPO Bridge Bank landing |
| `/ipo-bridge-bank/guide` | Subscription guide (web) |
| `/admin/login` | Staff sign in |
| `/login` | Redirects to `/admin/login` |
| `/admin` | Form dashboard |
| `/admin/forms/:formId` | Edit, publish, analytics |
| `/admin/leads` | Lead pipeline |
| `/f/:slug` | Public multi-step form |
| `/api/rpc` | oRPC endpoint |
| `/api` | OpenAPI docs |
| `/api/inngest` | Inngest serve handler |

## Workflow

1. Sign in at `/admin/login` (accounts are provisioned manually; sign-up is disabled).
2. Create a form in `/admin`.
3. Edit the JSON definition or metadata, then **Publish**.
4. Share `/f/your-slug` on a landing page or dedicated route.
5. Submissions create leads and emit `form/submission.completed` to Inngest.

## Scripts

```bash
bun run dev           # Start dev server
bun run build         # Production build (Nitro + Bun preset)
bun run start         # Run production server
bun run db:push       # Push Drizzle schema to Postgres
bun run db:seed       # Provision admin user (+ optional demo form)
bun run db:studio     # Drizzle Studio
bun run generate-routes
bun run inngest:dev   # Local Inngest dev server
```

## Form definition

Forms are stored as versioned JSON in Postgres (`forms.definition`). A minimal example:

```json
{
  "pages": [
    {
      "id": "page-1",
      "title": "Contact",
      "fields": [
        {
          "id": "email",
          "type": "email",
          "label": "Work email",
          "required": true
        }
      ]
    }
  ],
  "theme": {
    "thankYouMessage": "We'll be in touch soon."
  }
}
```

Supported field types: `short_text`, `long_text`, `email`, `phone`, `number`, `select`, `checkbox`, `date`.
