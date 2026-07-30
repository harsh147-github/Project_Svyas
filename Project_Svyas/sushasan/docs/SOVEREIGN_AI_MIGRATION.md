# Sovereign AI migration — Claude → Sarvam / BharatGen

Status as of 2026-07-30. This is the working tracker for Phase 1 of
[MONETIZATION.md](MONETIZATION.md) ("stop paying for AI"). It exists because
that doc previously claimed the switch was fully wired when it was not.

**Approach: one step at a time.** Each step below is independently shippable
and independently revertable. Do not batch them — classification and synthesis
are the core data path, and a provider that returns slightly different JSON
breaks the pipeline silently rather than loudly.

---

## Where it actually stands

`apps/web/lib/ai.ts` is a real, working provider-agnostic adapter:

- `AI_PROVIDER` = `anthropic` (default) | `sarvam` | `bharatgen`
- Sarvam and BharatGen share one OpenAI-style chat-completions adapter
- Sarvam auth uses the `api-subscription-key` header; BharatGen uses Bearer
- On any sovereign-provider error it **falls back to Claude** so the product
  never stalls — good design, and it means a failed migration degrades rather
  than breaks
- Provider only activates if its API key is actually present

The gap is adoption, not the adapter.

| Call site | Routed via `lib/ai.ts`? | Effect of `AI_PROVIDER=sarvam` | Relative AI spend |
|---|---|---|---|
| `/api/gov/assist` — War Room copilot | ✅ | switches | low (per officer question) |
| `lib/workers/classify-worker.ts` | ❌ direct SDK | none — stays Claude | **highest** (every scraped post) |
| `lib/workers/solution-worker.ts` | ❌ direct SDK | none — stays Claude | high (Opus, weekly per cluster) |
| `/api/admin/generate-briefs` | ❌ direct SDK | none — stays Claude | medium (Opus, manual sweeps) |
| `/api/add-report` | ❌ direct SDK | none — stays Claude | medium (per citizen report) |

Independently of `AI_PROVIDER`, one Sarvam integration is **already live and
working**: `/api/transcribe` uses Sarvam Saaras (`saarika:v2`) for `hi`/`mr`
speech-to-text with a Whisper fallback.

---

## Why this is not a find-and-replace

The four unmigrated call sites are not simple chat calls:

1. **They demand strict JSON.** Classification returns a fixed schema
   (`issue_tag`, `severity`, `sentiment`, `ward_id`, …) and synthesis returns
   a `steps[]` array that is written straight into Postgres. `chat()` returns
   a bare `string`. Any provider that wraps output in prose or code fences,
   or renames a field, corrupts the row.
2. **`chat()` has no structured-output contract.** It would need a
   `chatJSON<T>()` variant with parsing, validation, and a repair/retry path
   before the pipeline could safely depend on it.
3. **`add-report` sends images.** Its Anthropic call includes a base64 image
   block for photo-enriched grievances. The OpenAI-compatible adapter is
   text-only, so vision needs an explicit capability check and a text-only
   fallback.
4. **Failure is silent.** A malformed classification does not throw — it
   writes a wrong `issue_tag` and quietly skews the ward map.

---

## Migration steps, in order

### Step 0 — honest baseline ✅ done
Correct the docs so the claim matches the code. (This file + the
MONETIZATION.md edit.)

### Step 1 — add a structured-output path to the adapter
Add `chatJSON<T>(args, validate)` to `lib/ai.ts`:
- strips markdown code fences
- `JSON.parse` with a typed validator callback
- on parse/validation failure, one repair retry, then fall back to Anthropic
- returns the same shape regardless of provider

No call-site changes. Ship and leave it unused for a cycle.

### Step 2 — migrate the classify worker (highest value)
Classification is the biggest spend and the most schema-sensitive. Before
flipping any traffic:
- build a ~100-post eval set with known-good Claude classifications
  (the 100-post eval set is already contemplated in the 6-week plan)
- run the same posts through Sarvam via `chatJSON`
- compare `issue_tag` exact-match, `severity` within ±1, `ward_id` exact
- only adopt if agreement is high enough that the ward map does not shift

Keep `CLASSIFY_MODEL` semantics: Anthropic stays the default until the eval
passes.

### Step 3 — migrate report intake (`/api/add-report`)
Needs the vision decision first: either gate photo-enriched reports to
Anthropic, or drop to text-only under sovereign providers. User-visible
quality change — worth a deliberate call.

### Step 4 — migrate synthesis (solution worker + generate-briefs)
Opus-class reasoning over budget and department attribution is the hardest
thing to match. Do this last, and consider keeping synthesis on Claude
permanently even after classification moves — it is lower call volume, so the
cost argument is weakest here and the quality argument strongest.

### Step 5 — retire the direct SDK imports
Once all four route through `lib/ai.ts`, `@anthropic-ai/sdk` should be
imported in exactly one file. At that point the MONETIZATION.md claim becomes
true and can be restored to its original wording.

---

## Guardrails for whoever does this

- **Never migrate two call sites in one PR.** One site, one eval, one deploy.
- **The Claude fallback in `chat()` is load-bearing** — do not remove it as
  "cleanup" during migration.
- Model IDs for Claude live in `apps/web/lib/models.ts`. Sarvam/BharatGen
  model identifiers deliberately do **not** live there — they are different
  vendors' namespaces (`SARVAM_MODEL`, `BHARATGEN_MODEL`).
- `BHARATGEN_API_URL` currently defaults to an empty string, so BharatGen is
  non-functional until a real endpoint is configured. Sarvam is the realistic
  first target.
