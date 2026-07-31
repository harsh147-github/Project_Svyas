# Sushaasan — From Self-Burn to B2G Exit

The path you described, made concrete: self-fund → leverage traction for
credits/partnerships → switch to sovereign AI to stop burning → government
expansion + MoUs → B2G sale. Each phase lists the trigger, the targets, and
what to have ready.

---

## Phase 0 — Self-fund (now → ~5k users)
- **Burn:** ~₹8,000–12,000/mo (Vercel Pro, Apify, Anthropic, Supabase).
- **Goal:** prove the loop — real reports, real grievances *solved*, a few
  ward offices engaged, one press mention.
- **Do:** launch, push #sushaasan, log every resolved grievance (these are your
  case studies and your valuation later).

## Phase 1 — Stop paying for AI: switch to sovereign models
> **Partially wired — see [SOVEREIGN_AI_MIGRATION.md](SOVEREIGN_AI_MIGRATION.md).**
> `lib/ai.ts` is a working provider-agnostic adapter, and `AI_PROVIDER=sarvam`
> (+ `SARVAM_API_KEY`) genuinely switches providers — but today only **one**
> call site imports it: the `/api/gov/assist` War Room copilot.
>
> Classification, solution synthesis, brief generation and report intake each
> construct the Anthropic SDK directly and stay on Claude regardless of
> `AI_PROVIDER`. Those are where essentially all AI spend is, so flipping the
> switch today does **not** yet cut burn. The migration doc tracks the
> remaining steps in dependency order.
>
> Already sovereign and live: **Sarvam Saaras** (`saarika:v2`) powers
> Hindi/Marathi speech-to-text in `/api/transcribe`, independent of
> `AI_PROVIDER`.

- **Sarvam AI** — Indian LLM, strong in Indian languages (huge for citizen
  grievances in Hindi/Marathi). Apply to their startup/partner program; pitch
  the civic-good + made-in-India angle.
- **BharatGen** — govt-backed (MeitY / IIT-Bombay) sovereign foundation model.
  A Sushaasan-on-BharatGen story is *gold* for B2G: the government selling to
  the government, on the government's own AI.
- **Why it matters:** cuts your biggest variable cost, AND becomes the headline
  of every government pitch (data sovereignty + Indian-language + Atmanirbhar).

## Phase 2 — Non-dilutive credits & grants (trigger: traction + a press hit)
Apply once you have numbers (users, reports, solved). All free money:
- **Cloud/infra credits:** AWS Activate (~$1k–100k), Google for Startups,
  Microsoft for Startups, NVIDIA Inception (GPU/compute).
- **AI credits:** Anthropic / OpenAI / Sarvam startup programs.
- **India gov / ecosystem:** Startup India (DPIIT recognition → tax + grants),
  MeitY TIDE 2.0 / SAMRIDH, state Smart City innovation funds, T-Hub / CIIE.co
  (IIM-A) civic-tech tracks, Nasscom GovTech.
- **Civic/impact:** Omidyar Network India, Gates Foundation civic-tech, Bloomberg
  Philanthropies (cities). Sushaasan's "grievances actually solved" metric is
  exactly what impact funders score on.

## Phase 3 — Government expansion + MoU (trigger: 1 ward office actively using it)
- **First MoU target:** the PMC ward office already in the loop → a no-cost
  pilot MoU ("Sushaasan provides AI civic intelligence; PMC provides feedback").
  One signed MoU is the credential that opens every other door.
- **Then:** PMC Smart City SPV, Maharashtra IT/Urban Dev dept, MoHUA Smart
  Cities Mission, MeitY. Approach with: the live map, the solved-grievance count,
  and the BharatGen-powered sovereignty story.
- **Have ready:** a 1-page case study per solved grievance, the `/gov` War Room
  demo, the compliance pack (you already have Terms/DPDP/grievance officer).

## Phase 4 — Stop burning entirely / B2G sale
Two exits, not mutually exclusive:
1. **B2G SaaS (recurring):** license Sushaasan per-city to municipal corps /
   Smart City SPVs. ₹X lakh/yr per city. The MoUs + case studies set the price.
2. **Acquisition:** the natural buyers —
   - **GovTech / e-gov SIs** (TCS, Wipro Gov, eGov Foundation, Pratham,
     Janaagraha's civic arms) wanting a ready AI civic layer.
   - **Smart City integrators** needing a citizen-engagement module.
   - **The government itself** (a state/city adopting it as official infra).
- **Valuation drivers:** monthly active citizens, grievances-resolved rate,
  number of govt MoUs, and that it runs on sovereign AI (de-risks gov procurement).

---

## What makes this sellable (and you've already built most of it)
- ✅ Self-running pipeline (scrape → AI → map → War Room → resolution), automated CI/CD + health alarms.
- ✅ Provider-agnostic AI (Claude → Sarvam → BharatGen by config) — the sovereignty card.
- ✅ Legal/compliance pack (IT Rules + DPDP + grievance officer).
- ⬜ **For B2G scale, the one real engineering add: multi-tenancy** (per-city
  instances / a `city` column so one deployment serves many municipalities).
  Worth building only once a second city is real — say the word and I'll do it.

## The honest sequence
1. Launch, get the loop working in Pune, collect solved-grievance case studies.
2. Flip `AI_PROVIDER` to Sarvam/BharatGen → burn drops, sovereignty story turns on.
3. Use traction + that story to land credits/grants → burn goes to ~zero.
4. Sign the first ward-office MoU → use it to climb to Smart City / state / MoHUA.
5. License per-city (recurring) or sell to a GovTech buyer. You stop burning; it keeps running.
