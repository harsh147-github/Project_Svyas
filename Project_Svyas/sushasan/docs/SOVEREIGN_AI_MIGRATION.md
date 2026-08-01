# Sovereign AI — Sushaasan runs on Sarvam

Status as of 2026-08-01.

**The commitment:** Sushaasan runs entirely on Sarvam — made-in-India models,
Indian data residency. This is a product decision, not a cost optimisation. A
civic platform that municipal governments come to depend on should not sit on
foreign inference, and the Indian-language strength that Sarvam is actually
built for is exactly what grievances in Marathi and Hindi need.

**The honest part:** Sarvam is not, today, as strong as Claude at every task in
this pipeline. That is expected and it is not a reason to wait. The plan is to
run on Sarvam, measure precisely where it falls short, and close those gaps one
prompt and one route at a time. This document is how that gets measured.

---

## How it works now

`AI_PROVIDER` defaults to **`sarvam`**. `apps/web/lib/ai.ts` is the only file
in `apps/web` that imports `@anthropic-ai/sdk` — every AI call in the product
goes through it:

| Call site | Task | Volume |
|---|---|---|
| `lib/workers/classify-worker.ts` | per-post classification | highest |
| `lib/workers/solution-worker.ts` | weekly solution synthesis | high |
| `/api/admin/generate-briefs` | manual brief sweeps | medium |
| `/api/add-report` | citizen grievance intake (incl. photos) | medium |
| `/api/gov/assist` | War Room copilot | low |

Also live and independent of `AI_PROVIDER`: `/api/transcribe` uses Sarvam Saaras
(`saarika:v2`) for `hi`/`mr` speech-to-text, with a Whisper fallback.

### The fallback, and why it is not cheating

When a Sarvam call fails, `chat()` retries on Claude. A citizen filing a
grievance at 11pm should not see a broken form because a model returned a stray
markdown fence, and a ward officer should not miss a brief.

But a *silent* fallback would be the worst outcome available — the site would
look perfectly healthy while sovereignty quietly eroded to zero. So every
fallback is recorded in `ai_provider_events` (migration `008`) with its cause,
and the numbers are public at `/api/health`:

```jsonc
"ai": {
  "intended": "sarvam",
  "active": "sarvam",
  "sovereign": true,
  "strict": false,
  "misconfigured": null,
  "last_24h": {
    "calls": 412,
    "sovereign": 388,
    "fallbacks": 21,
    "errors": 3,
    "sovereignty_pct": 94,
    "top_failures": [{ "kind": "bad_json", "task": "classify", "count": 18 }]
  }
}
```

`sovereignty_pct` is the headline number of this project. **Drive it to 100.**
`top_failures` is the ranked list of what stands in the way — it is the daily
work queue, not a report card.

### `AI_STRICT_SOVEREIGN`

Set to `true` to remove the safety net entirely: Sarvam failures surface as real
errors instead of Claude answers. Use it in preview/staging to find every gap
fast. Leave it `false` in production until the fallback rate is already zero —
then flipping it on is a formality that locks the door behind you.

---

## The failure classes, and who owns each

`error_kind` in `ai_provider_events` buckets every failure into something with a
specific owner and a specific fix. Full triage table lives in
[`ops/WAR-ROOM-RUNBOOK.md` Step 3b](ops/WAR-ROOM-RUNBOOK.md), which the daily
sweep executes. In short:

| Kind | Owner | Typical fix |
|---|---|---|
| `bad_json` | **us** | tighten the prompt for that task — literal schema, "JSON only", worked example |
| `bad_request` | **us** | our payload shape is wrong for Sarvam (e.g. vision on a text-only model) |
| `timeout` | **us** | raise the adapter timeout or shorten the prompt |
| `auth` | founder | `SARVAM_API_KEY` wrong/revoked, or no access to `SARVAM_MODEL` |
| `rate_limit` | founder | QPS ceiling or credits |
| `server` | Sarvam | transient; act only if sustained |

### What we already do to prevent `bad_json`

Two mitigations ship ahead of the backlog rather than waiting for it:

1. **Native JSON mode.** `chatJSON` sets `response_format: {type:'json_object'}`
   on OpenAI-compatible providers, which removes fenced/prefaced output at the
   source instead of parsing around it. A `400` retries once without the field,
   so a deployment that doesn't support it degrades to `extractJson` rather than
   failing.
2. **Prompts written for a literal reader.** The classify prompt now carries a
   worked example, the closed sub-tag vocabulary, and the valid ward list.
   Smaller models follow a concrete example far more reliably than a schema
   sketch — and a placeholder like `"severity": 1-5` is something a weaker model
   will occasionally echo back verbatim.

On top of that, `issue_tag`, `sub_tags`, and `ward_id` are validated against
closed sets before they reach Postgres. A model that answers `"Traffic"` or
invents ward `"88"` cannot corrupt the map — and `ward_id` prefers `null` over a
guess, because a fabricated ward is indistinguishable from a real one after the
fact.

Most of the remaining backlog will still be `bad_json`, and that is good news: it is the
class we can fix ourselves, in a prompt, in an afternoon. Sarvam follows format
instructions well when they are literal and exemplified — the prompts in this
repo were written for Claude, which is more forgiving about being told a schema
once.

---

## Quality is not the same as success

A call that returns valid JSON can still be wrong, and no amount of parsing
catches that. `chatJSON` validates shape, not judgement.

So the daily sweep also **samples**: ~10 recent `posts` rows with
`classifier_ver = 'sarvam-v2'`, checking that `issue_tag` matches the text,
`ward_id` is a real pilot ward, and `severity` is proportionate. A drift toward
`other` with null wards means the classify prompt needs Sarvam-specific work
even though nothing is "failing".

The 100-post eval set contemplated in the 6-week plan is the rigorous version of
this, and is the right next investment: it turns "seems fine" into a number that
can be compared across prompt revisions.

---

## Where the hard problems are, in order

1. **Classification** — highest volume, most schema-sensitive, and the one that
   directly shapes the ward map. Wrong `issue_tag` at scale is a wrong map, and
   a wrong map shown to a corporator is worse than no map.
2. **Solution synthesis** — Opus-class reasoning over budgets and department
   attribution is the hardest thing to match. Expect this to be the last gap to
   close, and expect it to need prompt work with much more explicit structure:
   PMC department list, cost-rate anchors, step granularity examples.
3. **Vision on intake** — `ChatArgs.image` sends a native block to Anthropic and
   an `image_url` data URI to Sarvam. If Sarvam's configured model lacks vision,
   that call falls back and shows up as `bad_request` on `add-report`. The fix
   is picking a Sarvam vision-capable model in `SARVAM_MODEL`, not gating photos
   back to Claude.

---

## Guardrails

- **Never "fix" a Sarvam problem by setting `AI_PROVIDER=anthropic`.** That is
  not a fix, it is abandoning the goal. Fix the cause; the fallback covers
  users in the meantime.
- **The Claude fallback in `chat()` is load-bearing** until `sovereignty_pct`
  holds at 100. Do not remove it as "cleanup".
- **One route, one eval, one PR.** Prompt changes are behaviour changes to the
  data path — batching them makes a regression untraceable.
- Claude model IDs live in `apps/web/lib/models.ts`. Sarvam/BharatGen model
  identifiers deliberately do **not** — different vendors' namespaces
  (`SARVAM_MODEL`, `BHARATGEN_MODEL`).
- `BHARATGEN_API_URL` defaults to an empty string, so BharatGen is
  non-functional until a real endpoint is configured. Sarvam is the target.

---

## Definition of done

- `sovereignty_pct` at 100 for 14 consecutive days
- `AI_STRICT_SOVEREIGN=true` in production
- `ANTHROPIC_API_KEY` removed from Vercel and from `REQUIRED.ai`
- `@anthropic-ai/sdk` removed from `package.json`

At that point Sushaasan is a fully sovereign civic AI platform, and that claim
is backed by a ledger rather than an assertion.
