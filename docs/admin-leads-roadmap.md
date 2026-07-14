# Admin leads roadmap

Last updated: 2026-07-14  
Source of truth for ticket IDs: [`context/backlog.json`](../context/backlog.json)

This document captures how Everest staff should manage IPO (and future campaign) leads in Formos admin, what exists today, and what to build next.

---

## Current state (2026-07-14)

| Capability | Status |
|---|---|
| Campaign scoping (IPO / all forms) | Done |
| Status pipeline (`new` → `contacted` → `rdv` → `souscrit` → `qualified` → `won` → `lost`) | Done |
| Agent assignment (from campaign settings) | Done |
| Aggregate stats + insights (amount, channel, agents) | Done |
| UTM source display | Done |
| Extracted contact + amount + preferred channel | Done |
| City / company in `insights` | Done (partial UI) |
| IPO extras (`investor_profile`, `securities_account`) | Stored in `insights.extras`, **not shown** in list |
| Lead list limit | Hard-capped at **200**, newest first |
| Status filter | Client-side only (API supports status; UI does not pass it) |
| Lead CSV export | Missing (CSV exists for **submissions** only) |
| Lead detail / notes UI | Missing |
| Search / sort / pagination | Missing |
| Activity history / audit trail | Missing |
| Duplicate detection | Missing |
| Slack / CRM push on new lead | Missing (`crm-webhooks`) |

Primary UI: `/admin/leads`  
API: `orpc.leads.list` · `stats` · `insights` · `updateStatus` · `updateAssignee`

---

## IPO-first cut (ship during subscription window)

Highest leverage for day-to-day ops:

1. **Lead CSV export** — `lead-csv-export`
2. **Server filters + search + sort + pagination** — `lead-list-query`
3. **Lead detail + notes + full answers** — `lead-detail-notes`
4. **Surface profil / compte titres in list** — `lead-ipo-fields-ui`
5. **Unassigned queue + aging (24h / 72h)** — `lead-work-queue`
6. **Slack / email on new lead** — `crm-webhooks`
7. **Bulk assign + status** — `lead-bulk-actions`

---

## Tier 1 — Core ops

Operational basics so agents can work a live campaign without leaving Formos or copying into spreadsheets by hand.

| Backlog ID | What |
|---|---|
| `lead-csv-export` | Filtered CSV/Excel: contact, amount, profile, compte titres, channel, city, UTMs, status, agent, createdAt |
| `lead-list-query` | Server-side status / assignee / intent / amount / channel / source / date / form + search (name/email/phone) + sort + pagination |
| `lead-detail-notes` | Detail drawer/page: submission answers, extras, editable notes, quick contact actions |
| `lead-ipo-fields-ui` | Show `investor_profile` and `securities_account` as badges/columns |
| `lead-work-queue` | “My leads” + unassigned; highlight SLA aging (`new` >24h, `contacted` >72h) |

---

## Tier 2 — Classification & organization

| Backlog ID | What |
|---|---|
| `lead-tags-priority` | Tags (`urgent`, `docs-incomplets`, `VIP`) + optional priority score |
| `lead-duplicates` | Same phone/email → flag or merge, keep history |
| `lead-saved-views` | Presets: Nouveaux WhatsApp, Institutionnels >10M, Sans agent, Fenêtre clôture |
| `lead-bulk-actions` | Multi-select → assign, status, export, tag |
| `lead-kanban` | Optional board by status (list remains primary) |

---

## Tier 3 — Automation & collaboration

| Backlog ID | What |
|---|---|
| `crm-webhooks` | Slack/email (Inngest) on new lead; later HubSpot / Notion / Sheets |
| `lead-click-to-contact` | One-click WhatsApp / call / email from preferred channel + log |
| `lead-round-robin` | Auto-assign across campaign agents |
| `lead-rbac` | Agents see own leads; admins all; optional read-only managers |
| `lead-audit-trail` | Who changed status / assignee / notes, when |

---

## Tier 4 — Advanced / later

| Backlog ID | What |
|---|---|
| `lead-funnel-join` | Source → start → complete → lead → souscrit |
| `partial-submissions` | Abandoned answers → warm recovery queue |
| `lead-smart-routing` | Route by profile / amount / channel |
| `lead-reminders` | Follow-up due dates, overdue badges |
| `lead-reporting-digest` | Daily digest by agent / source / amount |
| `lead-data-quality` | E.164 phones, email DQ, incomplete-dossier flags |
| `gdpr-consent` | Retention + subject export/delete (public consent intentionally omitted on IPO form) |
| Multi-campaign inbox | Unified inbox when campaigns beyond Bridge Bank IPO exist |
| AI assist | Summaries / suggested next step — only after Tier 1–2 are solid |

---

## Suggested process (ops playbook)

Until automation lands, treat `/admin/leads` as the system of record:

1. **Morning** — filter `new` + unassigned; assign agents; clear anything aged >24h.
2. **On contact** — move to `contacted`; note preferred channel and outcome in notes (when notes exist).
3. **Qualification** — use amount + profil + compte titres to prioritize; set `rdv` / `qualified`.
4. **Close** — `souscrit` / `won` / `lost` with a short reason in notes.
5. **Reporting** — until CSV export exists, use insights panels + manual export from submissions if needed.

---

## Related docs

- [`docs/ipo-channel-utm.md`](./ipo-channel-utm.md) — UTM conventions for campaign attribution
- [`docs/formulaire-leads-bridgebank-ipo.html`](./formulaire-leads-bridgebank-ipo.html) — IPO lead form field reference
- [`HANDOVER.md`](../HANDOVER.md) — architecture + API surface
