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
└── index.ts      barrel — import from '@/lib/sarvam'
```

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

## 5. Switching the pipeline to Sarvam

```bash
AI_PROVIDER=sarvam
SARVAM_API_KEY=...
```

That single switch moves grievance synthesis, the war-room copilot and solution
synthesis onto Sarvam models. `lib/ai.ts` falls back to Anthropic automatically on any
error or missing key, so flipping it can never take the product down.

STT, TTS, translation and document extraction do **not** depend on `AI_PROVIDER` — they
are Sarvam-only capabilities and activate as soon as `SARVAM_API_KEY` is present.

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

## 8. Credit hygiene

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

## 9. MCP server (build-time)

`.mcp.json` declares a `sarvam` stdio server (`uvx sarvam-mcp`) so Claude Code can query
the authoritative API reference, model list, language coverage and speaker roster while
writing code. Requires `uv` on PATH.

Verify with `/mcp` in Claude Code — `sarvam` should show as connected. Its `sarvam_code_*`
tools are local and need no network; `sarvam_tools_*` make live API calls and need both
the key and network access to `api.sarvam.ai`.

Production code paths never go through MCP — they call the HTTP API via `lib/sarvam/`.
