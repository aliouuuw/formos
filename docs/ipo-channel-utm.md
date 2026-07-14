# IPO Bridge Bank — Channel UTM kit

One-pager for marketing & sales. All traffic should land on the campaign page with tracked UTMs so `/admin/leads` can attribute source.

**Campaign:** `ipo-bridge-juillet-2026`  
**Landing:** `/ipo-bridge-bank`  
**Forms:** `/f/ipo-souscrire` · `/f/ipo-infos`  
**Guide (web):** `/ipo-bridge-bank/guide`  
**Guide (PDF):** `/campaign/guide-souscription-ipo-bridge-bank.pdf`

Replace `https://YOUR_DOMAIN` with the production URL.

---

## Ready-to-use links

### LinkedIn (organic posts / BRVM network)

```
https://YOUR_DOMAIN/ipo-bridge-bank?utm_source=linkedin&utm_medium=social&utm_campaign=ipo-bridge-juillet-2026
```

### WhatsApp Business (status, broadcasts, bio)

```
https://YOUR_DOMAIN/ipo-bridge-bank?utm_source=whatsapp&utm_medium=social&utm_campaign=ipo-bridge-juillet-2026
```

Prefill message for advisers (app button uses `VITE_IPO_WHATSAPP_NUMBER`):

> Bonjour, je souhaite recevoir des informations sur l’IPO Bridge Bank via Everest Finance.

### Base clients Everest (email)

```
https://YOUR_DOMAIN/ipo-bridge-bank?utm_source=email&utm_medium=email&utm_campaign=ipo-bridge-juillet-2026
```

Optional deep links:

- Subscribe CTA in email:  
  `https://YOUR_DOMAIN/f/ipo-souscrire?utm_source=email&utm_medium=email&utm_campaign=ipo-bridge-juillet-2026`
- Infos / guide CTA:  
  `https://YOUR_DOMAIN/f/ipo-infos?utm_source=email&utm_medium=email&utm_campaign=ipo-bridge-juillet-2026`

### Site Everest (bandeau / pop-up)

```
https://YOUR_DOMAIN/ipo-bridge-bank?utm_source=everest-site&utm_medium=referral&utm_campaign=ipo-bridge-juillet-2026
```

---

## Calendar copy cues

| Phase | Dates (approx.) | Message focus |
|---|---|---|
| Teasing | Before 20 Jul 2026 | “L’IPO arrive” · push guide |
| Launch | From 20 Jul | Dual CTA · souscrire dominant |
| Mid | ~mid-window | Relance dossiers incomplets |
| Final | 3–6 Aug 2026 | Clôture réelle le 6 août |
| Closed | After 6 Aug | Suivi / WhatsApp only |

Phases are driven in the app from ISO dates in `src/lib/ipo-campaign.ts`.

---

## Admin follow-up (24 h rule)

1. New lead → contact within 24h on preferred channel  
2. High amount → prioritize  
3. WhatsApp selected → WhatsApp first  
4. No reply → follow up 24–48h later  
5. Qualified → status `rdv` + assign named adviser  
6. Done → status `souscrit`

Advisers: set `VITE_IPO_ADVISERS="Name One,Name Two,Name Three"` (defaults: Aminata Diallo, Jean Kouassi, Fatou Ndiaye).

---

## Regenerating the mock PDF

```bash
bun run scripts/generate-ipo-guide-pdf.ts
```

Replace the file under `public/campaign/` with the official notice PDF when compliance provides it (keep the same filename or update `IPO_GUIDE_PDF_PATH`).
