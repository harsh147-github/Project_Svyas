# Sushaasan — Launch Compliance & Safety Checklist

> For a public, citizen-facing civic platform in India that hosts user-submitted
> content. The goal: launch safely, stay legal, and not get banned or sued.
> Status legend: ✅ done in code · ⚠️ needs the team's action · 🔲 optional / later.

Last updated: June 2026.

---

## 1. Legal positioning (highest risk — impersonation & defamation)

- ✅ **"Not a government body" disclaimer** shown on: report flow, dashboard
  footer, Privacy, Terms, and gov dashboard. Sushaasan is clearly framed as an
  *independent civic-tech platform*, not PMC / government. (Prevents the #1 ban
  risk: looking like an official government portal.)
- ✅ **AI-content disclaimer** — briefs/severity/costs labelled AI-generated,
  indicative, not official records or engineering/legal advice.
- ✅ **Defamation safety** — report form forbids false/personal allegations and
  named-individual accusations; content shown anonymised + aggregated.
- ⚠️ **Trademark/branding** — confirm "Sushaasan" doesn't infringe an existing
  mark; consider a word-mark registration before scaling.

## 2. IT Rules, 2021 (intermediary due diligence — mandatory)

- ✅ **Terms of Use** published at `/terms` with acceptable-use + prohibited
  content list mirroring Rule 3(1)(b).
- ✅ **Grievance Officer** named with contact + SLA (24h ack / 15-day resolve)
  on `/terms` and `/privacy`.
- ⚠️ **Make `grievance@sushaasan.in` a real, monitored mailbox.** It is
  referenced legally — it MUST receive and be answered. Same for
  `privacy@sushaasan.in`. (Currently some pages still use a personal Gmail for
  "Contact" — fine as a fallback, but the grievance address must work.)
- ⚠️ **Maintain a grievance log** (date received → acknowledged → resolved) to
  evidence compliance if ever questioned.
- 🔲 **Takedown workflow** — process to remove court/government-ordered content
  within statutory timelines (36h for govt/court orders).

## 3. DPDP Act, 2023 (data protection)

- ✅ **Privacy Policy** updated with data-principal rights (access / correction
  / erasure / withdraw consent) and lawful basis.
- ✅ **Data minimisation by design** — usernames SHA-256 hashed w/ monthly salt;
  PII (phones, emails, plates, IDs) scrubbed before public surfaces & storage.
- ✅ **Consent at submission** — report form states data is shown publicly in
  anonymised form and the user confirms genuineness.
- ✅ **Retention stated** — raw text 90 days, briefs 12 months, erasure on
  request within 7 days.
- ⚠️ **Honour erasure requests** — wire a simple internal way to delete a
  raw_post / post / cluster row on request (currently manual via DB).
- 🔲 If user base grows large, assess "Significant Data Fiduciary" obligations.

## 4. Content & abuse safety (UGC platform)

- ✅ **Rate limiting** on report submission (10 / IP / 10 min) with memory-leak
  pruning.
- ✅ **PII auto-scrub** on every report + scraped post.
- ⚠️ **Spam/abuse moderation** — at scale, add: profanity/abuse filter on the AI
  synthesizer output, a "flag this" link on public reports, and a manual review
  queue. (See `docs/SCALING.md` for the abuse-review query.)
- 🔲 **Minimum-quality gate** — drop reports the AI classifies as non-civic /
  spam before they hit the map.

## 5. Scraping & third-party data

- ✅ **Public-only sources**, robots.txt respected, no login-walled content
  (stated in Privacy + Terms).
- ⚠️ Periodically re-check each source platform's ToS; prefer official APIs
  (Reddit) over scraping where possible to reduce legal exposure.

## 6. Accessibility & trust

- ✅ WCAG basics: alt text, ARIA labels, keyboard focus trap, `h1` per page,
  44px touch targets, reduced-motion respected.
- ✅ HTTPS (Vercel) — required for PWA + secure data.
- ✅ Branded 404, offline page.

## 7. Operational / infra (see docs/SCALING.md)

- ✅ CDN caching on `/api/*` (s-maxage=120, SWR) shields the DB from read storms.
- ✅ DB indexes for hot paths (`ops/supabase/006_scale_indexes.sql`).
- ⚠️ **Run `006_scale_indexes.sql`** in Supabase before a traffic spike.
- ⚠️ **Use the Supabase connection POOLER** (port 6543) for serverless, not
  direct 5432, or connections will exhaust under load.
- ⚠️ Set spend caps / alerts on Apify, Anthropic, Supabase, Vercel.
- 🔲 Error monitoring (Sentry DSN) + uptime alert on `/api/health`.

---

## The 6 things to do before a public launch push (the team)

1. Create & monitor **grievance@sushaasan.in** + **privacy@sushaasan.in** mailboxes.
2. Run **`ops/supabase/006_scale_indexes.sql`** in Supabase.
3. Confirm server DB connection uses the **pooler (6543)**.
4. Set **billing caps/alerts** on Apify / Anthropic / Vercel / Supabase.
5. Skim **`/terms`** and **`/privacy`** and confirm the Grievance Officer name +
   city are correct (currently "the Sushaasan team, Pune, Maharashtra").
6. Have a **takedown + erasure** habit: when someone emails, act within the SLA
   and log it.
