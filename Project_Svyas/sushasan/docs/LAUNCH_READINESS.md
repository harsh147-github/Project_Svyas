# Sushaasan — Launch Readiness Verdict

_Final pre-launch check. Short version: the product is ready. A few billing/
config switches (15 min, in your dashboards) make a mass launch safe._

---

## ✅ Verified working (code is production-ready)

| Area | Status |
|---|---|
| Frontend — map, dashboard, ward pages, PWA, mobile | ✅ all routes 200, no overflow, no JS errors |
| **Add Report engine** | ✅ accepts report → resolves ward → strips PII → AI grievance → pins on map → persists |
| Citizen loop | ✅ report → map → resolution on /dashboard |
| Government loop | ✅ /gov → War Room → AI copilot → loop-closure → citizens see it |
| AI pipeline (scrape → classify → cluster → Opus solution) | ✅ confirmed live via /api/health (supabase:true, daily cron, 100 solutions) |
| Daily scraper + weekly synthesis + daily gov dispatch crons | ✅ wired in vercel.json |
| Legal / compliance (Terms, DPDP privacy, disclaimers, grievance officer) | ✅ |

## ⚙️ Confirm before MASS launch (only you can — ~15 min in dashboards)

1. **Vercel → Pro plan ($20/mo).** Hobby is *non-commercial* per Vercel ToS and
   throttles crons (your data pipeline). **Required** for a real public product.
2. **Billing caps + alerts on Anthropic and Apify.** A viral spike or abuse must
   not run up a surprise bill. **Critical.**
3. **Anthropic credit** topped up (the AI engine spends per report + synthesis).
4. **Supabase → Pro ($25/mo)** recommended before heavy traffic (always-on, more
   connections, daily backups) + run `ops/supabase/006_scale_indexes.sql` once,
   and confirm the server uses the connection **pooler (port 6543)**.
5. **grievance@sushaasan.in** mailbox live + monitored (legal requirement).

## 💰 What it costs (realistic monthly burn)

| Service | Launch tier | ~Monthly |
|---|---|---|
| Vercel | Pro (required) | $20 / ₹1,700 |
| Supabase | Free → Pro recommended | $0–25 / ₹0–2,100 |
| Anthropic (Claude) | classify + synthesis + copilot | $25–50 / ₹2,000–4,200 |
| Apify (scraping) | starter plan | ~$49 / ₹4,100 |
| Voyage / Resend / Inngest / Sentry | free tiers | $0 |
| **Total at launch** | | **≈ $100–150 / ₹8,500–12,500/mo** |

- **Initial outlay to go live today:** the first month (~₹8,500–12,500) + a small
  prepaid Anthropic credit (~$20–50) and the Apify plan. Comfortably inside the
  ₹25,000/mo cap with room to grow.
- **Variable cost driver = report volume.** AI synthesis per citizen report scales
  with usage; at a truly massive userbase (tens of thousands of reports/mo) budget
  ~₹25–40k/mo — by which point you have traction.

## 📈 Can it handle large traffic?

- **Reads (map viewers): yes, easily.** `/api/*` + pages are CDN-cached at the
  edge — thousands of simultaneous viewers hit Vercel's cache, not the database.
  This is the core scaling strength; a viral moment won't take the DB down.
- **Writes (reports):** rate-limited (10/IP/10min, leak-pruned) + indexed upserts.
  Fine at launch. For sustained heavy write load, Supabase Pro + pooler, and
  (only if report-spam appears) Upstash Redis for durable limits — documented in
  `docs/SCALING.md`.

## Verdict

**The platform is ready to launch and the loops work end to end.** You *can* go
live today. To do it *safely at scale this second*, switch Vercel to Pro and set
billing caps first (15 min) — mainly so your crons keep firing and costs can't
surprise you. Everything in the code is done, verified, and deployed.
