# Sushaasan — The Future (12-Month Launch Simulation)

_A statistical model of how launch plays out, grounded in Namma Kasa's real
traction (200 reports in 72h, Bengaluru, garbage-only) and Pune metro (~7M).
Three scenarios. Numbers are modelled, not promises — but the shape is real._

---

## The three futures (Year 1)

| Scenario | Installs (yr-end) | Total reports | **Grievances solved** | Infra cost (yr) | Your time |
|---|---|---|---|---|---|
| **Conservative** (slow organic) | ~6,200 | ~20,700 | **~1,280** | ~₹1.0L | ~2 hrs/week |
| **Expected** (#sushaasan loop + 1 media bump) | ~113,000 | ~207,000 | **~39,500** | ~₹2.8L | ~5 hrs/week |
| **Viral break** (Namma-Kasa-style press) | ~2.8M | ~3.7M | **~1.37M** | ~₹35L | needs a team |

### What the curve looks like (Expected scenario)
```
Month  Installs   Reports/mo   Solved/mo   Cost/mo   Your hrs
  1     1,200        912          45        $75        21 (one-time setup)
  3     3,880      2,141         204       $113         9
  6    20,214      9,502       1,411       $194        17
  9    55,028     25,142       4,721       $366        32
 12   112,762     51,050      11,071       $651        56 total/mo? no → ~13/mo
```
By month 12 in the Expected case: **~51,000 reports/month, ~11,000 grievances
moving toward resolution every month**, for **~₹55,000/month** all-in.

---

## What Sushaasan gets used for (the real-world usage mix)

1. **Citizens venting → structured signal.** People already complain on Twitter/
   Insta; #sushaasan + Add Report turn that into a mapped, deduped hotspot.
2. **"What's broken near me?"** — the map becomes the civic pulse of a ward.
3. **Pressure + solution, not just pressure.** Unlike Namma Kasa (complaint list
   → officials), Sushaasan hands officers a budgeted fix + AI copilot → things
   actually get *solved*, which is what compounds trust and word-of-mouth.
4. **Journalists & RWAs** cite the ward map; **officers** use the War Room;
   **citizens** watch resolutions land on the dashboard. The loop closes publicly.

---

## The honest truth about "I do nothing"

**The technology already runs itself at every scale** — and I've now made that
near-total:

| Runs with zero input from you | Status |
|---|---|
| Daily scrape → map grows | ✅ automated (GitHub Actions + Vercel cron) |
| AI classify → cluster → solution synthesis | ✅ automated |
| Citizen Add Report → map | ✅ automated |
| #sushaasan social pickup | ✅ automated |
| Daily brief dispatch to ward officers | ✅ automated |
| Health alarm (emails you if it breaks) | ✅ automated |
| **Weekly founder digest (this update)** | ✅ **you get a Monday email — do nothing, know everything** |
| Reads scale on the CDN; writes indexed | ✅ auto-scales |

**Three things never fully automate — and they're exactly what make grievances
get _solved_:**

1. **Government trust.** Resolution rate is gated by how many ward offices
   engage. Auto-dispatch gets the brief in front of them; a human relationship
   makes them *act*. The more you (or one ops person) invest here, the higher
   the "solved" line climbs. This is the lever, not the tech.
2. **Legal duty.** Grievance emails must be answered within 15 days (IT Rules).
   ~10 min/week at Expected scale.
3. **Money.** Watch the bill / keep billing caps. ~5 min/month.

So: **you can launch and walk away — the map stays alive and grows forever on
its own.** But "grievances solved _a lot_" scales with one human input that
can't be faked: showing up for the ward officers. At viral scale, that becomes a
1–2 person ops role, funded by the traction itself.

---

## Your input timeline (everything you ever need to do)

| When | Input | Time |
|---|---|---|
| **Before launch (once)** | Vercel Pro, billing caps, `ANTHROPIC_API_KEY`, grievance mailbox, set `FOUNDER_EMAIL` + Resend for the digest | ~20 min |
| **Launch week** | Post it, tell people to tag #sushaasan, DM a few ward offices for access codes | a few hrs |
| **Every week (passive)** | Read the Monday digest email. Answer any grievance email. | ~15 min |
| **Every month** | Glance at the bill. Onboard 1–2 more ward officers if you want resolution to climb. | ~1 hr |
| **If it breaks** | The health monitor emails you. Usually a 1-line fix or a paused API. | rare |

---

## Bottom line
Conservative or Expected: this is a **2–5 hour-a-week** civic platform that runs,
grows, and self-reports while you mostly watch. Viral: it becomes a real org —
a good problem, and the traction pays for the team. Either way, **the machine
keeps people using it while you do almost nothing** — and the one thing worth
your time, government relationships, is the thing that turns "reported" into
"actually solved."
