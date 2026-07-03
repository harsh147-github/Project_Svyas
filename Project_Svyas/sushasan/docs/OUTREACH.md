# Authority Outreach — the NammaKasa-style channel to PMC

How Sushaasan's daily briefs reach Pune's authorities, and how to turn each
delivery layer on. The goal: every morning, the responsible officer sees the
ward's top grievances **with an AI action plan attached**, one tap away from
the War Room at sushaasan.in.

## The daily flow (already wired)

```
03:30 UTC  scrape + classify            (Vercel cron → /api/cron/daily-pipeline → Inngest)
05:00 UTC  authority dispatch           (Vercel cron → /api/cron/gov-dispatch)
             ├─ per-ward brief → email     (if recipient email verified)
             ├─ per-ward brief → WhatsApp  (if Cloud API configured + mobile on file)
             ├─ Daily War-Room Digest → AUTHORITY_DIGEST_EMAILS (fallback FOUNDER_EMAIL)
             └─ every attempt logged to dispatch_log
Sun 15:30  Opus solution synthesis      (Inngest) — briefs carry fresh plans
Mon 03:30  founder digest               (weekly meta-summary)
```

## Layer 0 — live today, zero setup beyond Resend

Set `RESEND_API_KEY` + `FOUNDER_EMAIL` in Vercel. Every morning the **Daily
War-Room Digest** email arrives: each priority brief with an *Open War Room*
button and a *Forward on WhatsApp* button (wa.me link with the brief text
prefilled). Forwarding a brief to a ward officer's WhatsApp is one tap from a
phone. This is the responsible start: no unverified official gets auto-mailed,
but the outreach loop runs daily from day one.

## Layer 1 — verified per-ward email

1. Call/visit the ward office (numbers in `public/data/gov-recipients.json`)
   and confirm the officer's or office's email.
2. Fill `email` for that ward in `gov-recipients.json` → next morning's brief
   goes to them directly, automatically.
3. In Resend, verify the `sushaasan.in` sending domain (SPF + DKIM) so briefs
   land in inboxes, not spam.

## Layer 2 — automated WhatsApp (Meta Cloud API)

WhatsApp is the channel Indian officials actually read. To automate it:

1. Create a Meta Business account → WhatsApp Business Platform → add a phone
   number (a dedicated SIM for "Sushaasan Briefs" works).
2. Complete business verification (takes days, needs GST/registration docs —
   start early).
3. Set `WHATSAPP_ACCESS_TOKEN` (permanent system-user token) and
   `WHATSAPP_PHONE_NUMBER_ID` in Vercel.
4. Put the officer's **mobile** (not the office landline) in
   `gov-recipients.json` → `phone`. Landlines are auto-skipped.
5. Note: business-initiated WhatsApp messages outside a 24h reply window
   require a pre-approved template. Get the officer to message the Sushaasan
   number once ("subscribe"), or register a `daily_civic_brief` template in
   Meta Business Manager.

Until then, the wa.me forward buttons in the digest cover WhatsApp delivery
manually — same message, one human tap.

## Layer 3 — official PMC channels (parallel track)

- PMC helpline **020-25501000** and the PMC CARE complaint portal are the
  formal intake. High-severity clusters can be filed there manually with the
  brief text; the War Room link goes in the complaint description so PMC staff
  discover the platform.
- The pitch meeting artifact: `/gov?token=…` on a tablet. The dispatch system
  is the hook ("you already get our briefs — here's the war room behind them").

## Accountability

Every dispatch attempt is written to `dispatch_log` (run
`ops/supabase/007_dispatch_log.sql` once). Query it to show authorities —
or journalists — exactly what was delivered and when.

## Rules of engagement

- Never spam: one digest per day, per-ward briefs only to verified contacts.
- Tone stays "one team": the officer is the capable actor, never the target.
- Every message carries the disclaimer that Sushaasan is independent,
  AI-generated, advisory — the officer decides.
