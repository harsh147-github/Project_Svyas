# SUAS · स्वास · Shut Up And Solve

> If you're curious enough to solve a problem — **that's the only credential you need.**

A global workshop where people BUILD real solutions to real problems — together. Like 3 Idiots' Rancho's lab, but for the whole world, on your phone.

**Live site:** [project-svyas.vercel.app](https://project-svyas.vercel.app)

---

## What's Here

| File | What it does |
|------|-------------|
| `index.html` | Landing page — manifesto, philosophy, how it works |
| `build.html` | Build Space — AI pipeline workspace with particle effects |
| `api/agent.js` | Vercel serverless function — 6 Claude AI agents |
| `vercel.json` | Routing + CORS config |
| `CLAUDE.md` | Full vision, architecture, design system (for Claude Code) |
| `SVYAS_BUILD_TASKS.md` | 15 step-by-step build prompts for Claude Code |
| `SVYAS_HOOK_ENGINE.md` | Engagement mechanics (swipe/shorts/streaks) |

## Deploy on Vercel (5 minutes)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import repo → Deploy
3. Add environment variable: `ANTHROPIC_API_KEY` = your key
4. Redeploy. Done.

Every push to GitHub auto-deploys via CI/CD.

## AI Agents

Six specialized agents power the Build Space:

| Agent | What it does |
|-------|-------------|
| Guide | Welcomes, routes, encourages |
| Ideation | Shapes vague ideas into build plans |
| Research | Maps the landscape, finds gaps |
| Builder | Writes actual code and prototypes |
| Connector | Finds communities and collaborators |
| Launch | Crafts pitches and launch strategies |

## Cost

- **Vercel:** Free tier (100K function calls/month)
- **Anthropic:** ~$0.01-0.05 per conversation (add $5 credits)

---

Built with desire, not degrees. © 2026 SUAS
