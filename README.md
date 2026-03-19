# Sushasan (सुशासन) — Collective Intelligence for Good Governance

### Where Citizens and Government Build Solutions Together

**[🌐 Live Manifesto](https://harsh147-github.github.io/Project_Svyas/) · [🚀 Try the MVP](https://478421c3-f633-4888-a301-72a61c9235bc-00-3n2i4ddsygvo9.worf.replit.dev/app)**

---

India votes once every 5 years. Between elections, 1.4 billion people have **zero structured mechanism** to tell decision-makers what they need. CPGRAMS has 62% satisfaction. PMC Road Mitra died in 6 months. Twitter is noise without synthesis. Change.org collects signatures with no solutions.

**Sushasan is the pipe that should always have existed.**

Citizens contribute "vibe answers" — casual, low-friction inputs about local problems in any language. AI synthesizes thousands of these into optimal, structured solutions with confidence scores, action items, cost estimates, and responsible authorities. A transparent dashboard serves **both citizens and decision-makers** at every governance level — from your housing society secretary to Parliament.

> **Voting says "I choose you."**
> **Sushasan says "Here's what we need, here's how to do it, and here's our support."**

---

## What Makes Sushasan Different

**Without AI, this is Reddit. With AI, this is national infrastructure.**

1. **Lowers the bar** — Say "paani nahi aa raha subah se" and AI converts it into structured governance intelligence. Any language. 5 seconds.
2. **Synthesizes at scale** — 10,000 citizen opinions become ONE optimal solution with weighted themes, action items, cost estimates, and responsible authorities. 15 seconds.
3. **Routes intelligently** — AI knows a pothole is a ward problem and a water policy is a state problem. Auto-classifies and routes to the exact right desk.
4. **Interconnects problems** — "Hinjewadi traffic" isn't one problem — it's 4 sub-problems across 4 departments. Sushasan decomposes compound crises for parallel resolution.

---

## Dual Interface: Citizens + Decision-Makers

### For Citizens
- Zero-friction contribution in any language (voice, text, images)
- AI refines casual input into structured intelligence (approve or correct)
- See how YOUR input shaped the synthesis — contribution attribution
- Transparent dashboard at every governance level
- Track progress — see when authorities respond and what actions they take

### For Decision-Makers (The Authority Dashboard)
- **Prioritized intelligence queue** — ranked problems with urgency scores and ready solutions
- **AI-synthesized action plans** — action items, responsible department, cost estimate, and timeline
- **Early warning system** — 5+ wards report the same issue → auto-escalation
- **Problem decomposition** — compound crises broken into parallel workstreams
- **One-click response** — respond publicly and get credit for being responsive
- **Performance metrics** — response rates per department for reviews
- **Budget justification** — "2,341 citizens need X, AI estimates ₹45Cr"

---

## The AI Engine — 6 Autonomous Jobs

| Job | Trigger | Model | Latency | What It Does |
|-----|---------|-------|---------|--------------|
| **REFINE** | New solution | gpt-4o-mini | <3s | Converts casual vibe input into structured intelligence. Auto-detects language. |
| **ROUTE** | New problem | gpt-4o-mini | <2s | Classifies governance level and routes to correct authority/department. |
| **SYNTHESIZE** | 5/15/50/100 solutions | gpt-4o | 5-15s | Aggregates all inputs into optimal solution with themes, action items, costs. |
| **BUBBLE-UP** | Every 6 hours | gpt-4o | Async | Detects 5+ child locations with same problem → auto-escalates to parent level. |
| **INTERCONNECT** | On synthesis | gpt-4o | 5-10s | Maps causal relationships. Decomposes compound problems for parallel resolution. |
| **PETITION** | Petition created | gpt-4o | 5-10s | Generates formal petition with RTI-ready language and PDF. |

---

## Governance Hierarchy

```
INDIA (National)  ← PM, Cabinet, Lok Sabha, Rajya Sabha
  └── MAHARASHTRA (State)  ← CM, State Cabinet, Vidhan Sabha
       └── PUNE (City)  ← Municipal Commissioner
            └── Ward 5 - Kharadi (Ward)  ← Corporator, Ward Officer
                 └── Kumar Pristine (Society)  ← Society Secretary

Auto-escalation:
  5+ wards same problem  → City-level synthesis
  5+ cities same problem → State-level synthesis
  5+ states same problem → National-level synthesis
```

---

## Website Architecture

This manifesto site is built as a high-performance, zero-dependency static site:

```
Project_Svyas/
├── index.html              # Main manifesto page
├── css/
│   └── main.css            # Full design system (dark theme, glassmorphism, responsive)
├── js/
│   └── app.js              # Lenis smooth scroll + GSAP ScrollTrigger animations
├── public/
│   └── assets/
│       ├── hero-video.mp4  # Hero background video (flag placement)
│       ├── parliament-hero.png
│       ├── india-network.png
│       ├── hero.png
│       ├── problem.png
│       └── solution.png
├── netlify/
│   └── functions/
│       └── agent.js        # AI agent serverless function (Anthropic API)
└── README.md
```

### Design Features
- **Lenis smooth scrolling** — butter-smooth, lerp-based scroll (1.4s easing)
- **GSAP ScrollTrigger** — every element animates on scroll (stagger, fade, slide, scale, parallax)
- **Hero video background** — flag placement video with dark gradient overlay
- **Parallax images** — Parliament + India network images at different scroll speeds
- **Counter animations** — stats count up when scrolled into view
- **Animated bar charts** — evidence bars grow from 0 to target width
- **Preloader** — spinning Ashoka Chakra with "सुशासन" text
- **Film grain overlay** — subtle texture for premium feel
- **Marquee banner** — infinitely scrolling stats with tricolor dots
- **Custom scrollbar** — styled to match the dark theme

### Libraries (via CDN)
- [Lenis](https://lenis.darkroom.engineering/) v1.1.18 — smooth scrolling
- [GSAP](https://gsap.com/) v3.12.7 + ScrollTrigger — scroll animations

---

## Tech Stack (Full Platform)

**Frontend:** React 18 + Vite + TailwindCSS v4 + Framer Motion + wouter + TanStack Query

**Backend:** Express.js + PostgreSQL + Drizzle ORM + Redis (Upstash) + BullMQ job queue

**AI:** OpenAI API (gpt-4o-mini for refine/route, gpt-4o for synthesis/petition) + structured JSON output + prompt versioning

**Auth:** Phone OTP via Firebase Auth + JWT + Redis-backed sessions

**Deploy:** GitHub Pages (manifesto) + Railway (backend) + Neon.tech (PostgreSQL)

**Cost:** $20-35/month runs the entire platform for a city.

---

## Real Problems We're Solving (Pune Seed Data)

1. **PMC Road Mitra app dead** — 6 months after launch (verified, March 2026)
2. **Kharadi water crisis** — residents buying tanker water daily
3. **Hinjewadi-Baner traffic** — 2+ hour commute for 10km (interconnected: 4 departments)
4. **42% of Pune's water meters faulty** — bills are guesswork (PMC Budget 2026-27)
5. **Garbage collection failure** in Viman Nagar — wet waste ignored
6. **Baner-Balewadi** — 300% growth in 10 years, zero infrastructure planning
7. **Kondhwa-Saswad Road** — deadly potholes ignored for years
8. **Undri-Pisoli summer water emergency** — annual crisis, no permanent solution

---

## The Vision

**Aadhaar** gave every Indian an identity. **UPI** gave every Indian a payment system. **Sushasan** gives every Indian a voice that decision-makers can actually hear.

```
Aadhaar  → Identity
UPI      → Payments
Sushasan → Participation
```

---

## Roadmap

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| **Pilot** | Month 1-3 | One city (Pune). 50 users. First petition submitted to PMC. Commissioner sees Authority Dashboard. |
| **Expand** | Month 3-6 | Multi-city (Mumbai, Bangalore). State dashboards live. WhatsApp bot integration. |
| **National** | Month 6-12 | 100 Smart Cities. Central government dashboard. CPGRAMS integration. BHASHINI for 22 languages. |
| **Scale** | Year 2+ | Panchayat to Parliament. Custom ML models. India exports the model to other democracies. |

---

## Built By

**Harsh Sonawane** — Pune, India

This is not a side project. This is a mission to build the democratic infrastructure India was always supposed to have.

---

*Data sourced from PRS Legislative Research, Official Lok Sabha/Rajya Sabha records, DARPG Annual Reports, and verified Indian journalism (The Hindu, Indian Express, Business Standard, Punekar News).*
