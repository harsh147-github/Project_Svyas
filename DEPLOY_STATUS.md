# Sushasan MVP — Deployment Status
_Last updated by automated task: 2026-04-30_

---

## What was fixed (auto-completed while you were away)

| Fix | Status |
|---|---|
| `postcss.config.js` missing → Tailwind wouldn't render | ✅ Created |
| `api/gov/action/route.ts` missing → loop-closure endpoint was absent | ✅ Created |
| `/about` page missing | ✅ Created (full About page) |
| `vercel.json` parse errors (null bytes) | ✅ Fixed previously |
| `vercel.json` content | ✅ Valid, clean JSON |

---

## One step you must do (requires your presence)

**Vercel login** — the CLI has a stale/invalid token. Run these two commands in PowerShell:

```powershell
cd "C:\Users\Harsh\OneDrive\Documents\Claude\Projects\Project-Svyas\Project_Svyas\sushasan"

vercel login
```

It will open a browser tab — click **Continue with GitHub** (or email). Takes 30 seconds.

Then deploy:

```powershell
vercel env add GOV_ACCESS_TOKEN
# When prompted: type any secret (e.g. svyas-gov-2026), press Enter, choose "All environments"

vercel --prod
```

---

## After deploy: set your domain (sushasan.in)

Once you get a `.vercel.app` URL from the step above, run:

```powershell
vercel domains add sushasan.in
```

Then in your domain registrar (GoDaddy / Namecheap / wherever), add:

| Type | Name | Value |
|---|---|---|
| A | @ | 76.76.21.21 |
| CNAME | www | cns1.vercel-dns.com |

DNS propagates in 5–30 minutes. After that, **sushasan.in is live**.

---

## Vercel project settings (if you're configuring via Dashboard)

Go to your project → Settings → General → Build & Development Settings:

| Setting | Value |
|---|---|
| Root Directory | `sushasan` |
| Framework Preset | Next.js |
| Build Command | `cd apps/web && pnpm build` |
| Output Directory | `apps/web/.next` |
| Install Command | `pnpm install --no-frozen-lockfile` |

Environment Variables to add:
- `GOV_ACCESS_TOKEN` = your secret (e.g. `svyas-gov-2026`)

---

## MVP pages that will be live

| URL | Description |
|---|---|
| `/` | Full-screen Pune ward hotspot map (NIBM · Wanowrie) |
| `/dashboard` | Citizen transparency dashboard — 7 live issue clusters |
| `/ward/46` | Mohammadwadi ward detail with 2 AI solutions |
| `/ward/47` | Kondhwa Budruk ward detail with solutions |
| `/ward/43` | Wanawadi ward detail |
| `/gov` | Corporator dashboard (requires GOV_ACCESS_TOKEN) |
| `/ethics` | Privacy & ethics page |
| `/about` | About Sushasan |

---

## What's seeded (no Supabase needed for MVP)

- **3 pilot wards**: Mohammadwadi (46), Kondhwa Budruk (47), Wanawadi (43)
- **7 issue clusters**: traffic, water, garbage, electricity incidents
- **3 AI solutions**: fully detailed step-by-step plans with cost estimates
- **Real GeoJSON**: actual PMC ward boundaries from the repo

The map runs on OpenFreeMap (no API key needed for MVP).
Supabase + live scraping wires in for Week 2+.
