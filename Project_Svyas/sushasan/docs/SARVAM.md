# Sarvam AI in Sushaasan — the sovereign layer

Sushaasan is in the **Sarvam Startup Program**: ₹25,000 in API credits (6 months),
full access to STT / TTS / LLM / Translate / document digitization, and business-tier
rate limits.

- Dashboard: https://dashboard.sarvam.ai
- Docs: https://docs.sarvam.ai

Everything below is keyed off a single env var: **`SARVAM_API_KEY`**.

---

## 1. Why Sarvam, specifically

Not cost. The pilot ward is Kondhwa–NIBM, where a resident is as likely to report a
broken drain in Marathi, Hindi, Urdu or code-mixed English as in English. The pipeline
is only as multilingual as its front door, and a model trained on Indian languages and
Indian civic vocabulary needs less scaffolding to produce something a PMC officer
recognises as competent.

Concretely, Sarvam does four things Claude cannot do here at all:

| Capability | Why it matters to the loop |
|---|---|
| Saaras v3 STT (23 languages, auto-detect) | The citizen presses record and talks. No language dropdown, no literacy requirement. |
| Bulbul v3 TTS (11 languages) | The formal grievance is read *back* to the resident before it is filed in their name. |
| Mayura formal-register translation | A Marathi complaint becomes municipal-register Marathi, not translated-sounding Marathi. |
| Vision document digitization | A photographed bill or work order becomes quotable text in the officer's dossier. |

---

## 2. The key

The key lives in the environment, never in the repo.

**Local dev** — `apps/web/.env.local` (gitignored):

```bash
SARVAM_API_KEY=sk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Production** — Vercel → Project → Settings → Environment Variables.

**For the MCP server** — read from your shell environment, so also export it in your
shell profile. `.mcp.json` references it as `${SARVAM_API_KEY}` and is committed with
that placeholder only.

> If a key is ever pasted into a chat, screenshot, ticket, or commit, rotate it in the
> Sarvam dashboard. Treat exposure as compromise — the credits are spendable.

---

## 3. Module layout

All Sarvam access goes through `apps/web/lib/sarvam/`. Nothing else in the codebase
should call `api.sarvam.ai` directly.

```
lib/sarvam/
├── client.ts     auth, retries, timeouts, error types, language tables
├── stt.ts        Saaras v3 — transcribe, transcribeBilingual, batch init
├── tts.ts        Bulbul v3 — speak, speakGrievance, speakBrief, chunking
├── translate.ts  Mayura / sarvam-translate — translate, translateFormal,
│                 identifyLanguage, transliterate
├── llm.ts        chat completions — complete, completeJson
├── docs.ts       Vision doc-digitization job pipeline
├── analytics.ts  typed question answering (/text-analytics) — triage
├── pronunciation.ts  Pune place-name dictionary for TTS
└── index.ts      barrel — import from '@/lib/sarvam'
```

`packages/ai/provider.ts` is the equivalent chokepoint for the eight prompt-wrapper
modules in `packages/ai` (classify, cluster-centroid, solution, government-brief, …).
It exposes two tiers named for purpose rather than vendor — `callFast` (sarvam-30b) and
`callDeep` (sarvam-105b) — so a model version bump never touches eight call sites.

`client.ts` owns the two things that are easy to get wrong: the auth header is
`api-subscription-key` (**not** `Authorization: Bearer`), and `Content-Type` must be
left unset for multipart STT so the runtime can add its own boundary.

Retries cover transport failures, 429 and 5xx only. A 4xx is never retried — the
request was wrong on its merits and repeating it just burns credits.

---

## 4. Where Sarvam runs in the pipeline

```
citizen speaks / types
   │
   ├─ Saaras v3 ──────────► native transcript + English transcript + detected language
   │                        (/api/transcribe)
   │
   ├─ text-lid ───────────► language of a *typed* report
   │
   ▼
grievance synthesis (LLM: Sarvam or Claude, via lib/ai.ts)
   │
   ├─ Mayura formal ──────► the grievance in the citizen's own language
   ├─ Bulbul v3 ──────────► read back to the citizen (/api/tts)
   ▼
application number + map cluster
   │
   ▼
officer dossier (/api/gov/application/[id])
   ├─ Mayura formal ──────► Marathi / Hindi rendering of the whole form
   └─ Bulbul v3 ──────────► brief read aloud to an officer in transit
```

### Route-level map

| Route | Sarvam usage |
|---|---|
| `POST /api/transcribe` | Saaras v3 primary for **all** languages, auto-detect, native + English in one flow. Whisper (Groq, then OpenAI) is the fallback. |
| `POST /api/add-report` | `identifyLanguage` for typed reports, `translateFormal` for the citizen-language mirror, LLM synthesis via `lib/ai.ts`. |
| `POST /api/tts` | Bulbul v3. `voice: 'citizen'` reads grievances, `voice: 'official'` reads briefs. |
| `POST/GET /api/verify-document` | Vision doc-digitization job pipeline. |
| `GET /api/gov/application/[id]` | `?lang=mr` runs the dossier's narrative fields through formal-register translation. |
| `POST /api/gov/assist` | War-room copilot, routed through `lib/ai.ts`. |

### Model versions

The codebase was previously pinned to models that are now deprecated or gone. Current:

| Use | Model | Was |
|---|---|---|
| STT | `saaras:v3` | `saarika:v2` |
| TTS | `bulbul:v3` | — (new) |
| LLM | `sarvam-30b` / `sarvam-105b` | `sarvam-m` |
| Translate | `sarvam-translate:v1` / `mayura:v1` | — (new) |

`/speech-to-text-translate` is deprecated; the translate leg now uses
`/speech-to-text` with `mode=translate`.

---

## 5. Sarvam is the default, not an option

Setting `SARVAM_API_KEY` is enough. The provider chain is Sarvam → Anthropic → BharatGen,
so every AI call in the product runs on Sarvam unless Sarvam is unavailable.

### Sovereign mode

```bash
SARVAM_ONLY=true
```

With this set, Sarvam is the *only* provider. No Whisper fallback for speech, no Claude
fallback for reasoning, no silent cross-border reroute when a call fails. A failure
surfaces as a failure.

This is the setting that makes "Sushaasan runs on Indian models" a claim you can defend
in a PMC room rather than a default that quietly flips under load. Two behaviours change:

| Path | Normal | `SARVAM_ONLY=true` |
|---|---|---|
| `/api/transcribe` | Saaras → Groq Whisper → OpenAI Whisper | Saaras only; 503 `sovereignMode` on failure |
| Photo grievance enrichment | Claude vision reads the photo | Photo dropped from synthesis; text-only grievance. The photo still reaches the officer. |

The photo case is a real limitation, stated plainly: Sarvam's vision model is document
digitisation (OCR), not general scene understanding, so there is no Sarvam-native way to
read a photo of a pothole.

### Degradation contract

Every path has a defined behaviour when Sarvam is absent:

| Capability | Without `SARVAM_API_KEY` |
|---|---|
| Voice capture | Falls back to Groq Whisper → OpenAI Whisper → typing |
| Grievance synthesis | Runs on Claude |
| Citizen-language mirror | Omitted; English grievance still filed |
| Listen button | Hides itself (503 → `unavailable`) |
| Document attach | Hides itself |
| Dossier `?lang=mr` | Returns English |

Nothing 500s, and nothing blocks a citizen from filing a report.

---

## 6. What document extraction is and is not

`/api/verify-document` **extracts** text from an uploaded document. It does **not**
authenticate it. The response carries `verified: false` permanently, and the UI says
"reads the text — it does not verify authenticity".

This is deliberate. An extracted PMC work-order number is a *claim* for a human to check
against PMC records. A citizen who believed Sushaasan had validated their paperwork, and
acted on that at a ward counter, would be worse off than if the feature didn't exist.

---

## 7. The application number

`lib/gov-application.ts` mints a stable reference for every grievance:

```
SUS/W46/WTR/2026-07/4B7C21
```

It is deterministic — derived by hash from ward, issue, reference and month — so the
same grievance always produces the same number without a database counter. The citizen's
receipt and the officer's dossier always agree.

**It is a Sushaasan reference, not a PMC application number.** Sushaasan is an
independent civic-technology platform, not a government body, so minting something that
could pass for a PMC-issued number would be fabricating a government record. The `SUS/`
prefix, the platform name on every rendering, and an explicit disclaimer line on the form
all exist to keep that boundary visible.

---

## 8. Triage — Sarvam text-analytics

`lib/sarvam/analytics.ts` uses `/text-analytics`, which answers *typed* questions
(boolean / enum / number / short answer) over a text. Unlike an LLM JSON blob, the shape
is declared up front — no fence-stripping, no schema drift.

It runs over the citizen's **own words**, not the AI's rewrite of them, so nothing is
lost in the paraphrase. Its most important job is the escalation call:

```
isEmergency → severity forced to 5 → red banner on the citizen's receipt
```

A live wire or a contaminated supply cannot sit in a weekly synthesis queue, and that
decision is too consequential to infer from prose. When the model's severity and the
triage verdict disagree, the more cautious of the two wins — under-calling an emergency
costs far more than over-calling one.

Triage is an *enhancement, never a gate*: if it fails or Sarvam is unconfigured, the
report is still filed, it just doesn't get the fast lane.

---

## 9. Pronunciation — saying Pune's names correctly

`lib/sarvam/pronunciation.ts`. A TTS voice that reads "NIBM" as a word, or stresses
"Kondhwa" wrongly, tells a Pune resident in one syllable that this product was not built
for them. For a platform asking people to trust it with a complaint against their own
municipality, that is a credibility failure on first contact — not a rough edge.

Two layers:

1. **Remote dictionary** — `createPuneDictionary()` registers ~35 entries (place names,
   society names, PMC department terms) once against the account. Store the returned id
   in `SARVAM_PRONUNCIATION_DICT_ID`; it is then attached to every TTS call at no
   per-synthesis cost.
2. **Initialism safety net** — applied client-side before synthesis, so a deployment
   that has not run the setup step still never says "nibbem":

   ```
   "NIBM Road, PMC has issued..."  →  "N I B M Road, P M C has issued..."
   ```

---

## 10. Credit hygiene

Credits are finite and STT is the hungry path (audio minutes, not tokens).

- Keep bulk classification on `AI_PROVIDER=anthropic` unless deliberately A/B-ing
  quality — that cron runs hourly and would burn credits fastest.
- `transcribeBilingual` skips the second (translate) call when the detected language is
  already English.
- `translate` short-circuits when source and target match.
- The dossier only pays for translation when `?lang=` is non-English.
- `/api/tts` (20/IP/10min) and `/api/verify-document` (5/IP/30min) are rate-limited
  because both are credit-spending and reachable without a gov token.
- Check the balance at https://dashboard.sarvam.ai before any bulk backfill.

---

## 11. MCP server (build-time)

`.mcp.json` declares a `sarvam` stdio server (`uvx sarvam-mcp`) so Claude Code can query
the authoritative API reference, model list, language coverage and speaker roster while
writing code. Requires `uv` on PATH.

Verify with `/mcp` in Claude Code — `sarvam` should show as connected. Its `sarvam_code_*`
tools are local and need no network; `sarvam_tools_*` make live API calls and need both
the key and network access to `api.sarvam.ai`.

Production code paths never go through MCP — they call the HTTP API via `lib/sarvam/`.
