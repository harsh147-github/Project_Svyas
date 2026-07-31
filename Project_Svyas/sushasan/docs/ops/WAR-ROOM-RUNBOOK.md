# War Room Runbook — daily automated health sweep

This is the procedure the **daily Sushaasan War Room Routine** executes. It
fires once a day into a fresh Claude Code session, works through every check
below, fixes what is fixable in code, and pushes.

If you are a human reading this: you should not need to. That's the point.
The Routine reports only when something needs *you* specifically.

---

## Operating rules for the agent running this

1. **Verify, never assume.** Every claim in your report must trace to a command
   you actually ran. If a check could not run, say "could not verify" — do not
   infer a green from silence.
2. **Fix what is code. Escalate what is not.** A missing API key, an exhausted
   credit balance, an unverified DNS record — none of these can be fixed from
   the repo. Report those to the founder; do not pretend to fix them.
3. **Never invent numbers.** If `/api/health` is unreachable from your sandbox,
   say so explicitly rather than quoting figures from a previous run or a doc.
4. **One fix, one commit, one PR.** Never push to `main`. Branch from the
   latest `main`, commit with a clear message, push, open a **draft** PR.
5. **Never flip `AI_PROVIDER` to a non-Anthropic value.** That decision needs a
   human-reviewed quality comparison — see `SOVEREIGN_AI_MIGRATION.md`.
6. **Never disable a failing check to make the sweep look green.** A red check
   that is correctly red is a success of this system, not a failure.

---

## Step 1 — Is the site actually up and healthy?

```
GET https://sushaasan.in/api/health
```

Read these fields:

| Field | Healthy looks like | If not |
|---|---|---|
| `status` | `"live"` | `"seed-mode"` = Supabase unconfigured; `"error"` = read `error` |
| `supabase` | `true` | Supabase env vars missing/wrong → escalate |
| `env.ai` | `[]` | lists missing `ANTHROPIC_API_KEY` → escalate |
| `env.scraping` | `[]` | lists missing `APIFY_API_TOKEN` → escalate |
| `env.email` | `[]` | dispatch cannot send → escalate |
| `env.cron` | `[]` | **`CRON_SECRET` unset = cron routes publicly triggerable → escalate as security** |
| `counts.*` | rising over time | flat for days = pipeline stalled |
| `last_24h.raw_posts_scraped` | `> 0` | `0` = scraper dead → Step 2 |
| `last_24h.classification_keeping_pace` | `true` or `null` | `false` = Inngest classify worker lagging → Step 3 |
| `scrape.dead_sources` | `[]` or shrinking | lists sources returning zero → Step 2 |
| `scrape.last_run_scraped` | `> 0` | `0` = every source failed at once (usually token or credit) |
| `dispatch.last_dispatched_at` | recent date | `null` = has never sent → Step 4 |

> **If the endpoint is unreachable from your sandbox** (egress is restricted in
> some environments — `curl` returns HTTP 000), say so plainly and continue
> with the checks you *can* do (Steps 5–7). Do **not** report the site as down
> on the basis of your own network failure — that is your sandbox, not their
> infrastructure.

---

## Step 2 — Scrapers returning zero

Sources: `instagram`, `reddit`, `twitter`, `gmaps`, `facebook`, `news`.

The pipeline logs now distinguish the causes — read Vercel function logs for
`/api/cron/daily-pipeline`:

| Log line | Meaning | Action |
|---|---|---|
| `[<actor>] ok, N items` | Ran fine, genuinely found N | None if N reasonable |
| `[<actor>] <status>: <body>` | Apify rejected the call | 401/403 → token expired or credit exhausted → **escalate** |
| `[<actor>] failed (AbortError, timeout was Ns)` | Actor slower than its timeout | Raise `TWITTER_TIMEOUT_SEC` / `GMAPS_TIMEOUT_SEC` (max 280) → **escalate**, it's an env change |
| `[reddit] r/<sub> ... HTTP 403/429` | Reddit blocking datacenter IPs | Needs `REDDIT_CLIENT_ID`/`SECRET` → **escalate** |
| `[reddit] using authenticated OAuth endpoint` | OAuth active | Good |
| Actor 404 / "not found" | Actor renamed or removed from Apify Store | **This one you CAN fix**: find the current actor id, verify `https://api.apify.com/v2/acts/<id>` returns 200, update the id in `daily-pipeline/route.ts`, PR it. Never guess an id. |

**Do not remove a source from the list because it is failing.** Fix it or
report the blocker.

---

## Step 3 — AI pipeline correctness

1. **Is anything being classified?** `last_24h.posts_classified` vs
   `raw_posts_scraped`. Below 30% is a real problem.
2. **Is Inngest firing?** Check app.inngest.com for recent runs of
   `classifyPostsWorker` and `solutionSynthesisWorker`. No runs at all usually
   means `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` are missing → escalate.
3. **Are classifications sane?** Spot-check recent `posts` rows: `issue_tag`
   should be one of traffic/water/electricity/garbage/other, `severity` 1–5,
   `ward_id` populated. A flood of `other` with null wards means the classifier
   prompt or the model is misbehaving.
4. **Which provider ran?** `posts.classifier_ver` records
   `<provider>-v2`. If this ever reads `sarvam-*` without a human decision
   having been made, that is a misconfiguration — escalate immediately.
5. **Are solutions being generated?** `counts.solutions` should grow after the
   Sunday `30 15 * * 0` Inngest cron.

---

## Step 4 — Government dispatch

`dispatch.last_dispatched_at` null or stale means briefs are not reaching ward
officers — the product's core loop is broken even if the map looks fine.

Read Vercel logs for `[gov-dispatch] resend`:

| Log | Cause | Action |
|---|---|---|
| `resend 403 ... domain not verified` | `sushaasan.in` unverified in Resend | **Escalate** — DNS records at the registrar, cannot be done from code |
| `resend 401` | Bad/revoked `RESEND_API_KEY` | **Escalate** |
| `resend 422` | Malformed recipient | Check `AUTHORITY_DIGEST_EMAILS` / `FOUNDER_EMAIL` formatting |
| No log at all | Route never ran | Check the cron is still in both `vercel.json` files |

---

## Step 5 — Deployment health

1. **Latest `main` deploy succeeded?** Check the GitHub Actions `build` job on
   the most recent `main` commit, and the Vercel deployment status.
2. **Is `main` ahead of what's deployed?** A merged PR that never deployed is a
   silent regression.
3. **Any open PR with red CI?** If it's a PR this system opened, drive it to
   green.

---

## Step 6 — Repo and config integrity

Run from `Project_Svyas/sushasan`:

```bash
pnpm install
pnpm --filter @sushasan/web build   # must exit 0
pnpm --filter @sushasan/web lint    # must exit 0
```

Then confirm config invariants:

```bash
# the two vercel.json cron arrays must stay identical
diff <(jq .crons vercel.json) <(jq .crons apps/web/vercel.json)

# the agent tool layer must remain provably read-only
grep -rE "\.(insert|update|delete|upsert|rpc)\(" apps/web/lib/agents/

# no Claude model string may exist outside lib/models.ts
grep -rn "'claude-[a-z0-9.-]*'" apps/web --include=*.ts --include=*.tsx | grep -v lib/models.ts
```

All three must come back clean. Any drift is a real regression — fix and PR it.

---

## Step 7 — Fix, commit, push

For anything fixable in code:

```bash
git fetch origin main
git checkout -B claude/warroom-<yyyy-mm-dd> origin/main
# ... make the fix ...
pnpm --filter @sushasan/web build && pnpm --filter @sushasan/web lint
git commit -m "fix(warroom): <what and why>"
git push -u origin claude/warroom-<yyyy-mm-dd>
```

Then open a **draft** PR describing what broke, how you diagnosed it, and what
you changed. Do not merge.

### Tooling fallback — read this before assuming a step is impossible

Routine-fired sessions currently run **without GitHub MCP tools**
(`mcp__github__*`). Plan for that:

| If you need to… | With MCP tools | Without them (the fallback) |
|---|---|---|
| Push a fix | either | `git push -u origin <branch>` — the git proxy is authenticated, this works |
| Open a PR | `create_pull_request` | **Push the branch, then put this URL in your report** for the founder to click:<br>`https://github.com/harsh147-github/Project_Svyas/compare/main...<branch>?expand=1` |
| Check CI on `main` | `pull_request_read` / `actions_list` | Not directly available — say "could not verify CI" and rely on your own local `build` + `lint`, which are the same checks CI runs |
| Read Vercel logs | — | Not available from the sandbox. Report which log line the founder should search for (e.g. `[gov-dispatch] resend`) rather than guessing the cause |

**Pushing the branch is the part that matters** — the work is preserved and
reviewable either way. Never skip a fix because you cannot open the PR; push
it and hand over the compare link.

If a run needs GitHub or Vercel tools regularly, the Routine can be recreated
from the claude.ai Routines UI with those connectors granted.

---

## Step 8 — Report

End every run with a report in this shape. Keep it short — the founder should
be able to read it in fifteen seconds and know whether to act.

```
SUSHAASAN WAR ROOM — <date>

STATUS: healthy | degraded | down | could-not-verify

WORKING
  - <check> ✓ <the actual number or evidence>

BROKEN
  - <what> — <root cause from logs, not a guess>

FIXED THIS RUN
  - <what> → PR #<n>

NEEDS YOU (cannot be fixed from code)
  - <exact action, which dashboard, which value>

COULD NOT VERIFY
  - <what, and why — e.g. sandbox has no egress to sushaasan.in>
```

**If everything is green and nothing was fixed, say so in two lines.** Do not
manufacture work to look busy, and do not email the founder just to say
"all fine" — the daily `uptime-check` cron already covers silent failure.

---

## What this system genuinely cannot do

Be honest about these rather than letting them look covered:

- **It is not second-by-second.** Routines fire on a schedule (hourly at the
  fastest). Real-time detection is the job of the `uptime-check` cron, which
  emails `FOUNDER_EMAIL` when the pipeline degrades — that is the always-on
  layer; this Routine is the daily deep sweep.
- **It cannot fix vendor-side problems.** Expired keys, exhausted Anthropic or
  Apify credit, unverified DNS, an expired Reddit app — all require the founder
  in an external dashboard.
- **It cannot merge its own PRs.** By design.
- **A sandbox without egress cannot reach `sushaasan.in`.** When that happens
  the run must say "could not verify" rather than guessing.
