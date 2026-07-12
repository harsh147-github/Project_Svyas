# NammaKasa Deep-Dive Research Report
### For: Svyas / Sushaasan — Answering the eGov Loop-Closing Question
**Date:** April 29, 2026 | *Compiled autonomously while you were away*

---

## The Core Question This Research Answers

eGov asked: *"Even if you build an amazing optimised solution, will it close the loop? How will the government execute — they can just say yes and nothing happens."*

NammaKasa is the closest comparable case in India. Here's the full picture.

---

## 1. What NammaKasa Is

**NammaKasa** (nammakasa.in) is a crowdsourced garbage reporting web platform for Bengaluru, built by **Jyothish VM**, a 31-year-old Product Designer currently employed full-time at Jar (fintech).

- **Founded:** April 4, 2026 (barely 3 weeks old as of this report)
- **Built in:** A single weekend using free, open-source tools
- **Registered:** Namma Kasa Private Limited (CIN: U38110KA2023PTC176770, incorporated July 31, 2023)
- **Revenue model:** Non-commercial civic initiative. Jyothish is turning down all funding offers.
- **Current traction:** 200+ real-time reports within 72 hours of launch

---

## 2. Service Offerings & Problem Being Solved

NammaKasa addresses the **garbage black spot problem** in Bengaluru — uncollected waste that accumulates into permanent dumps across the city's 243 wards.

**What it does:**
- Lets citizens anonymously photograph and pin garbage issues on a live city map
- No app download, no login, no phone number required — pure web platform
- Each report is geotagged and auto-linked to the responsible municipal ward, MLA, and MP
- Displays a public **accountability leaderboard** showing which MLAs/MPs have the most unresolved complaints in their constituency

**Design philosophy:** Two principles — *ultimate simplicity* and *strict anonymity*. Jyothish deliberately avoided a native app to eliminate friction.

---

## 3. Founder & Team

**Jyothish VM** — Sole founder, product designer by training.

**Background:**
- Born in Kerala, raised in Sakleshpura, Karnataka
- Started career at Tech Mahindra out of college
- Pivoted to design/product: Chefling → SuperShare (2019–2021) → StepSetGo (2021–2022) → SugarBox Networks (2022–2024) → currently Product Designer at Jar
- Also ran entrepreneurial ventures alongside his corporate career

**His philosophy on government engagement:**
> *"The bigger picture is also about educating citizens. It's not just the authorities who should be blamed; it is also the people who throw waste. It has to be a 50-50 effort — you help the government, and they help you."*

**LinkedIn:** https://in.linkedin.com/in/jyothish-vm

---

## 4. Technical Infrastructure

| Layer | What NammaKasa Uses |
|---|---|
| Platform | Web-only (no Android/iOS app) |
| Data collection | Crowdsourcing via citizen photo uploads |
| Geolocation | Browser GPS / geotagging on photo upload |
| Mapping | Live public map showing all active reports |
| Ward/constituency mapping | Automated cross-reference of GPS → ward → MLA/MP |
| Community | Telegram/WhatsApp feedback group (128 members) |
| Backend automation (planned) | Automated weekly emails to BBMP with coordinates |
| Social pressure layer (planned) | Twitter auto-tag of officials when a ward hits 10+ complaints |

**No proprietary hardware, no IoT, no scraping.** Pure crowdsourced data from citizen photos.

---

## 5. Government/BBMP Relationship

**Current status: ZERO formal integration with BBMP.**

This is the most important finding for Svyas:

> *"Despite the massive influx of user reports, the number of actual resolved issues currently stands at zero. Because the platform is brand new, government authorities (like the BBMP) are not yet integrated into the system to see or respond to these complaints. Jyothish acknowledges this gap, noting that citizens are doing their part by reporting, but the loop with the authorities hasn't been closed yet."*
> — Startup Pedia, April 2026

There is no MOU, no formal partnership, no BBMP pilot. The only government-facing mechanism is:
- A "Send message to BBMP" button that redirects users to the **BBMP Sahaya WhatsApp helpline** — manual, not automated
- Planned future: automated weekly coordinate emails to BBMP

**The loop is explicitly not closed.** Jyothish has openly acknowledged this.

---

## 6. The Loop-Closing Mechanism (Current vs. Planned)

### Current (as of April 2026):
```
Citizen spots garbage → Takes photo → Uploads to NammaKasa → 
Geotagged to ward/MLA/MP → Added to leaderboard → 
[Optional] User manually forwards to BBMP WhatsApp helpline → 
BBMP may or may not act → No tracking, no resolution confirmation
```

**Loop closure rate: 0%**

### Planned:
1. **Weekly automated emails** to BBMP with full list of geotagged reports (batched pressure)
2. **Twitter auto-tagging** of officials when a ward crosses 10 complaints threshold
3. **Open-source the platform** so control stays with the public, preventing political shutdown
4. **Partnership with Greater Bengaluru Authority** (GBA) for waste management response

### The Pressure Theory (not proven):
Jyothish's hypothesis is that *public visibility + political embarrassment* will pressure MLAs/MPs to act. The leaderboard is the core mechanism — no politician wants to be visibly ranked last in cleanliness.

**This is a shame-based accountability model, not a systems integration model.**

---

## 7. How They Approached Government Stakeholders

**They haven't — not formally, not yet.**

NammaKasa's strategy is to build citizen momentum first and use that as leverage. The approach is:
1. Accumulate reports → make the problem undeniable
2. Use data + public pressure to force government attention
3. Expect political pushback (Jyothish explicitly expects it)
4. Stay neutral, data-only, open-source to survive the pressure

**No value proposition presentation to BBMP has been made yet.** No officials have been formally pitched. No MOUs exist.

---

## 8. Impact & Scalability

**What's proven:**
- Viral traction: major media coverage (Deccan Herald, The Better India, NewsFirst Prime, Startup Pedia) within days
- Community building: 128-person feedback community formed organically
- Strong product-market fit for citizen engagement side

**What's unproven:**
- Government responsiveness — zero resolved issues
- Scalability of pressure model — unclear if leaderboard shame actually moves BBMP
- Long-term government cooperation — entirely untested

**Scalability risk:** Jyothish expects political pushback from the very MLAs/MPs the platform is embarrassing. This is the core sustainability risk.

---

## 9. Key Insight for Svyas / eGov Response

**The loop-closing problem is REAL and UNSOLVED — even for the best civic tech in India right now.**

NammaKasa proves:
1. **Citizen engagement is easy** — 200 reports in 72 hours
2. **Government integration is the hard part** — 0 resolutions in the same period
3. **Pressure models don't automatically close loops** — public shame ≠ government action
4. **The gap is the product** — whoever bridges citizen data to government execution wins

**What Svyas should learn/adapt from NammaKasa:**

| NammaKasa | Svyas / Sushaasan |
|---|---|
| Shame-based pressure (leaderboard) | Should build incentive alignment (show government why acting is in their interest) |
| No formal govt. partnership | Need to explore pilot MOU from Day 1 |
| Citizen-initiated data | Can include AI-aggregated data (more scale) |
| No resolution tracking | Build resolution tracking as a core feature — that's the loop closer |
| Non-commercial | Svyas has a commercial model — use it to fund the loop-closing infrastructure |
| Bengaluru only | Design for multi-city from architecture up |
| Political risk (embarrassment model) | Frame as a governance enabler, not a shaming tool |

**The answer to eGov's question:** NammaKasa shows that even excellent civic tech, built by a brilliant founder, cannot close the loop without *formal government integration*. The loop-closing infrastructure — dashboards, SLAs, resolution tracking, feedback to citizens — is what Svyas needs to make its core product. The civic engagement side is the easy part.

---

## 10. LinkedIn DM Draft — Jyothish VM

*(Drafted for the team to send manually via LinkedIn: https://in.linkedin.com/in/jyothish-vm)*

---

**Subject / Opening line:** Hey Jyothish — NammaKasa is genuinely impressive work

---

Hi Jyothish,

I came across NammaKasa a few weeks ago and have been following it closely — what you've built in a single weekend and the traction you've got is genuinely remarkable.

I'm the team, a founder building Svyas — a platform focused on the same broken loop between citizens and government, but on a different civic problem. I've been researching the exact challenge you've publicly acknowledged: the loop with authorities hasn't been closed yet. That's the piece I'm obsessing over.

I'd love to have a 20-minute conversation with you — not to pitch anything, just to learn. Specifically:
- What's been your experience trying to engage BBMP informally?
- Has any MLA or ward-level official reached out after seeing the leaderboard?
- What's your hypothesis for *what it will take* to get government to act?

I'm working on this from the angle of: how do you design a product where government *wants* to close the loop, rather than one that pressures them to? I think you've built something that proves the citizen side perfectly. I want to understand your thinking on the government side.

Completely understand if you're swamped — the DMs must be insane right now. But if you have 20 minutes sometime, I'd genuinely value it. This is for the betterment of the country, as you said — and I'd rather collaborate than reinvent separately.

Best,
the team
Founder, Svyas

---

*(Keep it under 200 words. Don't mention "studying" his model or anything that sounds transactional. Lead with genuine respect.)*

---

## Sources

- [NammaKasa Official Website](https://www.nammakasa.in/)
- [Startup Pedia — NammaKasa Platform Deep Dive](https://startuppedia.in/tech-innovation/this-man-builds-nammakasa-where-users-can-report-garbage-issues-in-30-sec-putting-mlas-and-mps-names-on-an-accountability-leaderboard-11716016)
- [Startup Pedia — Jyothish VM Interview: "50-50 efforts"](https://startuppedia.in/trending/if-you-help-the-government-they-will-help-you-because-its-50-50-efforts-to-improve-the-system-says-nammakasa-founder-jyothish-vm-11716087)
- [The Better India — Report Garbage in Seconds](https://thebetterindia.com/videos/report-garbage-in-seconds-how-namma-kasa-is-fixing-city-waste-11738109)
- [Deccan Herald — App fix for Bengaluru's garbage black spots](https://www.deccanherald.com/india/karnataka/bengaluru/app-fix-for-bengalurus-garbage-black-spots-3976024)
- [NewsFirst Prime — NammaKasa accountability tracker](https://newsfirstprime.com/bengaluru/namma-kasa-app-click-garbage-track-leaders-accountability-in-bengaluru-11720146)
- [Digit.in — Tired of poor civic sense, this man built NammaKasa](https://www.digit.in/news/general/tired-of-poor-civic-sense-this-bengaluru-man-built-nammakasa-app-to-fix-it.html)
- [News Karnataka — Designer Jyothish builds NammaKasa](https://newskarnataka.com/karnataka/designer-jyothish-builds-nammakasa-to-tackle-bengaluru-garbage-woes/15042026)
- [Jyothish VM on LinkedIn](https://in.linkedin.com/in/jyothish-vm)
