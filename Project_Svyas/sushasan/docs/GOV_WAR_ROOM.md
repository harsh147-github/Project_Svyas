# Sushaasan — Government Side: The War Room

How a ward officer receives a grievance and solves it with AI assistance.

---

## 1. Reverse-engineered: how Namma Kasa delivers to officials (and where it stops)

From the repo research (`NammaKasa_Research_Report.md`):

```
Citizen geotags garbage report → auto-linked to ward / MLA / MP →
added to a public accountability leaderboard →
[planned] weekly automated email of coordinates to BBMP →
[planned] Twitter auto-tag of officials when a ward crosses 10 complaints
```

**Their model is pressure-based.** Its own founder admits the gap:

> *"the number of actual resolved issues currently stands at zero… government authorities are not yet integrated… the loop with the authorities hasn't been closed yet."*

So Namma Kasa is excellent at **making the problem undeniable**, but it hands the
official a *list of complaints* and stops. The official still has to figure out
**what to do**.

## 2. Where Sushaasan goes further — we close the loop

Sushaasan delivers the same **batched, geotagged pressure**, but the brief is not
a complaint list — it's a **decision-ready mission** with an AI copilot to solve
it. We don't just tell the officer *what's broken*; we hand them *how to fix it*
and an AI that works the problem with them.

```
AI signal → clustered grievance + AI battle plan (the "missile")
   → delivered to the officer's contact point (WhatsApp / email / link) as a brief
   → link opens the WAR ROOM
        ├─ Dossier: dissect the signal
        ├─ Battle plan: budgeted, step-by-step (officer ticks it off)
        ├─ Sushaasan AI copilot: root-cause, draft work order, cost, precedent…
        └─ Human command: officer marks progress → citizens see it on /dashboard
   → loop closed, transparently
```

## 3. The delivery — "the missile"

`lib/gov-brief.ts` formats any mission into a deliverable brief:
`subject`, `whatsappText`, branded `emailHtml`, `plainText`, and the **War Room
deep link** (carries the gov token so the officer lands authenticated).

Three delivery channels, all live:

| Channel | How | Status |
|---|---|---|
| **WhatsApp** | `DispatchPanel` → `wa.me` deep link with the brief | ✅ works now, no setup |
| **Email (manual)** | `DispatchPanel` → `mailto:` | ✅ works now |
| **Copy link** | deep link to the War Room | ✅ works now |
| **Email (automated)** | `POST /api/gov/dispatch {missionId,to,send:true}` via Resend | ⚙️ needs `RESEND_API_KEY` + verified `sushaasan.in` sender |

### Wiring the automated "daily news" dispatch
1. Set `RESEND_API_KEY` and verify the `sushaasan.in` domain in Resend; set
   `DISPATCH_FROM` (e.g. `Sushaasan <briefs@sushaasan.in>`).
2. Populate officer contact emails (the ward-incharge registry `current_authority_name`
   fields are pending — add an `email` per ward).
3. Add a cron (Vercel) that POSTs the top open missions to `/api/gov/dispatch`
   each morning, so each officer gets their ward's briefs as daily civic news.

> Until officer emails + Resend are wired, dispatch runs in **preview mode**
> (returns the brief) and officers receive briefs via the WhatsApp/email/link
> share — which already works today.

## 4. The War Room — `/gov/war-room/<ward>-<issue>` (token-gated)

Three columns (stacks on mobile):

- **The Dossier** — reports count, severity, status, sources, verbatim signal.
- **The Battle Plan** — the AI solution as a field checklist (action · dept ·
  timeline · ₹), a budget bar (cost vs ward allocation), and **Human Command**
  loop-closure (Mark in progress / resolved → updates the public dashboard).
- **Sushaasan AI** — the copilot (`/api/gov/assist`, Claude grounded in the
  mission dossier). One-tap quick actions: root-cause, who-owns-it/who-to-call,
  draft work order, cost breakdown, precedents, citizen update, risks,
  escalation note — plus free-form questions.

**Human-in-command, always.** The AI advises; the officer decides and acts. Every
screen says so, and the loop only closes when a human marks it.

## 5. Principle (from CLAUDE.md)

> Never anti-government. Frame the officer as the **capable actor**, never the
> target of blame. Sushaasan is the Jarvis; the officer is Iron Man.
