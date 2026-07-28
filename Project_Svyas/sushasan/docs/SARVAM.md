# Sarvam AI — credits, MCP server, and where it plugs into Sushaasan

Sushaasan is in the **Sarvam Startup Program**: ₹25,000 in API credits (valid 6 months
from provisioning), full access to Sarvam's STT / TTS / LLM / Translate / document
digitization APIs, and business-tier rate limits.

- Dashboard: https://dashboard.sarvam.ai
- Docs: https://docs.sarvam.ai

Everything below is keyed off a single env var: **`SARVAM_API_KEY`**.

---

## 1. The key

The key lives in the environment, never in the repo.

**Local dev** — put it in `apps/web/.env.local` (gitignored):

```bash
SARVAM_API_KEY=sk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Production** — Vercel → Project → Settings → Environment Variables.

**For the MCP server** — it is read from your shell environment, so also export it in
your shell profile (`~/.bashrc`, `~/.zshrc`, or Windows `setx SARVAM_API_KEY ...`).
`.mcp.json` references it as `${SARVAM_API_KEY}` and is committed with that
placeholder only.

> If a key is ever pasted into a chat, screenshot, ticket, or commit, rotate it in the
> Sarvam dashboard. Treat exposure as compromise — the credits are spendable.

---

## 2. MCP server (Claude Code / Cursor)

Declared in the repo root `.mcp.json`:

```json
{
  "mcpServers": {
    "sarvam": {
      "command": "uvx",
      "args": ["sarvam-mcp"],
      "env": {
        "SARVAM_API_KEY": "${SARVAM_API_KEY}"
      }
    }
  }
}
```

Requires [`uv`](https://docs.astral.sh/uv/) on PATH (`uvx` ships with it) — no separate
install step, `uvx` fetches `sarvam-mcp` on first run.

The server is listed in `.claude/settings.local.json` under `enabledMcpjsonServers`, so
Claude Code picks it up without a per-session approval prompt.

Verify with `/mcp` inside Claude Code — `sarvam` should show as connected. If it shows
as failed, the usual causes are `uv` missing from PATH or `SARVAM_API_KEY` unset in the
shell that launched the editor.

**What it's for:** exploratory work during development — trying a transcription on a
sample clip, checking translation quality on Marathi civic complaints, sanity-checking a
model before wiring it into a route. Production code paths do **not** go through MCP;
they call the HTTP API directly (§3).

---

## 3. Where Sarvam runs in the product

| Surface | File | What Sarvam does |
|---|---|---|
| Voice reports (hi/mr) | `apps/web/app/api/transcribe/route.ts` | Saarika `saarika:v2` speech-to-text for Hindi/Marathi audio; Whisper is the fallback for other languages |
| Provider-agnostic LLM layer | `apps/web/lib/ai.ts` | `AI_PROVIDER=sarvam` routes classification / synthesis / copilot chat to `sarvam-m` via the OpenAI-compatible chat-completions endpoint |
| Gov copilot | `apps/web/app/api/gov/assist/route.ts` | Runs on whichever provider `lib/ai.ts` resolves — Sarvam counts as configured |

Sarvam uses the `api-subscription-key` header, not `Authorization: Bearer` — handled in
`chatOpenAICompatible()` in `lib/ai.ts`.

### Switching the LLM to Sarvam

```bash
AI_PROVIDER=sarvam
SARVAM_API_KEY=...
# optional overrides
SARVAM_MODEL=sarvam-m
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions
```

`lib/ai.ts` falls back to Anthropic automatically if Sarvam errors or if
`SARVAM_API_KEY` is missing, so flipping the switch can never take the product down.
Transcription degrades the same way: no key → Whisper → empty transcript, never a 500.

---

## 4. Credit hygiene

Credits are finite and the STT path is the hungry one (audio minutes, not tokens).

- Keep `AI_PROVIDER=anthropic` for the bulk classification cron unless deliberately
  A/B-ing quality — that job runs every 60 min and would burn credits fastest.
- Sarvam's clear win is Indian-language work: Marathi/Hindi voice reports and
  translation, where it beats the alternatives on accuracy and cost.
- Check the remaining balance at https://dashboard.sarvam.ai before any bulk backfill.
