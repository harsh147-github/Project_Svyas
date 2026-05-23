# Sushaasan — Technical Architecture Blueprint
## "The Tetris: How Every Piece Fits Together"

**Purpose:** This document is your living proof that you know exactly how to build this. Every component, every data flow, every integration point — mapped and explained. This is what you show investors when they ask "but how does it actually work?"

---

## THE BIG PICTURE — Three Layers

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    LAYER 1: DATA INGESTION                          ║
║  "Where citizen voice enters the system"                            ║
║                                                                     ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ║
║  │ WhatsApp │ │ Twitter/ │ │Instagram │ │  Reddit  │ │ In-App   │  ║
║  │   API    │ │  X API   │ │   API    │ │   API    │ │   PWA    │  ║
║  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  ║
║       │            │            │            │            │         ║
║       └────────────┴────────────┴────────────┴────────────┘         ║
║                              │                                      ║
║                    ┌─────────▼──────────┐                           ║
║                    │  UNIFIED INGESTION │                           ║
║                    │     GATEWAY        │                           ║
║                    │  (Express.js API)  │                           ║
║                    └─────────┬──────────┘                           ║
╠═════════════════════════════╪═══════════════════════════════════════╣
║                    LAYER 2: AI SYNTHESIS ENGINE                     ║
║  "Where noise becomes intelligence"                                 ║
║                              │                                      ║
║                    ┌─────────▼──────────┐                           ║
║                    │    BullMQ Queue    │                           ║
║                    │  (Redis/Upstash)   │                           ║
║                    └─────────┬──────────┘                           ║
║                              │                                      ║
║         ┌────────────────────┼────────────────────┐                 ║
║         │                    │                    │                 ║
║    ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐           ║
║    │  JOB 1   │        │  JOB 2   │        │  JOB 3   │           ║
║    │ Language │        │  Topic   │        │   NER    │           ║
║    │Detection │        │Clustering│        │Extraction│           ║
║    │+Translate│        │          │        │          │           ║
║    └────┬─────┘        └────┬─────┘        └────┬─────┘           ║
║         │                    │                    │                 ║
║    ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐           ║
║    │  JOB 4   │        │  JOB 5   │        │  JOB 6   │           ║
║    │Sentiment │        │Consensus │        │ Summary  │           ║
║    │ +Urgency │        │Detection │        │Generator │           ║
║    └────┬─────┘        └────┬─────┘        └────┬─────┘           ║
║         │                    │                    │                 ║
║         └────────────────────┼────────────────────┘                 ║
║                              │                                      ║
║                    ┌─────────▼──────────┐                           ║
║                    │ SYNTHESIS RESULT   │                           ║
║                    │  (PostgreSQL)      │                           ║
║                    └─────────┬──────────┘                           ║
╠═════════════════════════════╪═══════════════════════════════════════╣
║                    LAYER 3: OUTPUT & ACTION                         ║
║  "Where intelligence reaches decision-makers"                       ║
║                              │                                      ║
║    ┌─────────────────────────┼─────────────────────────┐           ║
║    │                         │                         │           ║
║  ┌─▼──────────┐    ┌────────▼───────┐    ┌────────────▼──┐        ║
║  │ CITIZEN    │    │  GOVERNANCE    │    │  ENFORCEMENT  │        ║
║  │ DASHBOARD  │    │  DASHBOARD     │    │  LAYER        │        ║
║  │ (React PWA)│    │  (SaaS Portal) │    │               │        ║
║  │            │    │                │    │ • CPGRAMS     │        ║
║  │ • See your │    │ • Priorities   │    │   auto-file   │        ║
║  │   impact   │    │ • Root causes  │    │ • RTI auto-   │        ║
║  │ • Track    │    │ • Cost est.    │    │   generate    │        ║
║  │   progress │    │ • Dept routing │    │ • Media API   │        ║
║  │ • Compare  │    │ • Performance  │    │               │        ║
║  │   wards    │    │   scoreboard   │    │               │        ║
║  └────────────┘    └────────────────┘    └───────────────┘        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## LAYER 1: DATA INGESTION — The Tetris Pieces

### Piece 1: Social Media Connectors

**What it does:** Pulls civic-related posts from existing social media platforms.

| Platform | API/Method | What We Capture | Rate Limits | Cost |
|---|---|---|---|---|
| **Twitter/X** | X API v2 (Basic) | Tweets with civic keywords, geotagged to Indian cities | 10K tweets/month (Basic) | $100/month |
| **Instagram** | Instagram Graph API | Public posts with civic hashtags, comments | 200 calls/hour | Free (with Meta app) |
| **Reddit** | Reddit API | Posts from r/india, r/pune, city subreddits | 100 requests/min | Free (with app) |
| **WhatsApp** | WhatsApp Business API (via Twilio) | User-submitted messages to Sushaasan number | Pay per message | ~₹0.50/message |
| **In-App PWA** | Direct submission | Text, voice, image uploads from Sushaasan app | Unlimited | Server cost only |

**Technical implementation:**
```
// Connector architecture
social-connectors/
├── twitter-connector.ts    // Streaming API + keyword filters
├── reddit-connector.ts     // PRAW-style polling every 5 min
├── instagram-connector.ts  // Webhook on mentions/hashtags
├── whatsapp-connector.ts   // Twilio webhook handler
└── direct-input.ts         // In-app REST API endpoint
```

**Keyword filter examples (multilingual):**
```
Hindi: "पानी नहीं आ रहा", "सड़क टूटी", "बिजली कटौती", "कचरा"
English: "pothole", "water supply", "traffic", "corruption"
Marathi: "पाणी बंद", "रस्ता खराब", "कचरा उचलला नाही"
```

**Geolocation strategy:**
- Twitter: Use `place_id` or geocode from tweet metadata
- Instagram: Location tags on posts
- Reddit: Subreddit = city (r/pune → Pune)
- WhatsApp/In-App: User provides location or GPS auto-detect
- Fallback: NER extracts location names from text ("Ward 12 Kothrud")

### Piece 2: Unified Ingestion Gateway

**What it does:** Normalizes all incoming data into a single format regardless of source.

```typescript
// Normalized input schema
interface CivicInput {
  id: string;                    // UUID
  source: 'twitter' | 'reddit' | 'instagram' | 'whatsapp' | 'direct';
  rawText: string;               // Original text in any language
  mediaUrls?: string[];          // Photos, videos
  location?: {
    lat: number;
    lng: number;
    wardName?: string;
    cityName?: string;
    stateName?: string;
  };
  timestamp: Date;
  anonymousUserId?: string;      // Device-based, not identity
  engagementMetrics?: {
    likes: number;
    comments: number;
    shares: number;
  };
}
```

**API endpoint:**
```
POST /api/v1/ingest
Body: CivicInput
Response: { inputId: string, status: 'queued', estimatedProcessingTime: '3-5s' }
```

---

## LAYER 2: AI SYNTHESIS ENGINE — The Brain

### The 6-Job BullMQ Pipeline

Every civic input triggers a sequential pipeline of 6 AI jobs. Each job adds intelligence. The pipeline completes in **under 5 seconds** for a single input.

```
INPUT → Job 1 → Job 2 → Job 3 → Job 4 → Job 5 → Job 6 → SYNTHESIS RESULT
        │         │         │         │         │         │
        3s        1s        1s        1s        2s        3s
        ↓         ↓         ↓         ↓         ↓         ↓
     Translate  Cluster    Extract   Score    Detect    Generate
     to Hindi   topic      entities  urgency  consensus summary
     +English
```

### Job 1: Language Detection & Translation

**AI Provider:** Sarvam AI (Saaras V3 for ASR, Sarvam Translate for text)
**Fallback:** OpenAI GPT-4o-mini

**What it does:**
- Detects input language (22 Indian languages supported)
- If voice input: Speech-to-text via Sarvam Saaras V3
- Translates to Hindi + English (dual storage for processing + display)
- Handles code-mixed text (Hinglish, Marathlish)

```typescript
// Job 1 output
interface TranslatedInput extends CivicInput {
  detectedLanguage: string;      // 'hi', 'mr', 'ta', 'en', etc.
  translatedText: {
    hindi: string;
    english: string;
  };
  isVoiceInput: boolean;
  transcription?: string;        // If voice, raw transcription
}
```

**Latency target:** < 3 seconds (including ASR if voice)
**Cost per input:** ~₹0.10-0.30 (Sarvam API pricing)

### Job 2: Topic Clustering

**AI Provider:** Sarvam-105B or Sarvam-30B (structured JSON output via function calling)

**What it does:**
- Classifies input into civic topic categories
- Uses dynamic category discovery (not hardcoded categories)
- Links to existing topic clusters if similar issues already exist

```typescript
// Topic taxonomy (expandable)
const CIVIC_TOPICS = {
  INFRASTRUCTURE: ['roads', 'bridges', 'buildings', 'construction'],
  WATER_SUPPLY: ['pipeline', 'tanker', 'contamination', 'shortage'],
  SANITATION: ['garbage', 'sewage', 'drain', 'cleanliness'],
  ELECTRICITY: ['power_cut', 'billing', 'transformer', 'streetlight'],
  TRANSPORT: ['traffic', 'public_transit', 'parking', 'road_safety'],
  HEALTHCARE: ['hospital', 'clinic', 'ambulance', 'medicine'],
  EDUCATION: ['school', 'college', 'teacher', 'fees'],
  SAFETY: ['crime', 'police', 'harassment', 'accident'],
  ENVIRONMENT: ['pollution', 'noise', 'trees', 'encroachment'],
  GOVERNANCE: ['corruption', 'delay', 'transparency', 'RTI']
};

// Job 2 output
interface ClusteredInput extends TranslatedInput {
  primaryTopic: string;          // e.g., 'WATER_SUPPLY'
  subTopic: string;              // e.g., 'shortage'
  confidence: number;            // 0-1
  existingClusterId?: string;    // Links to existing issue cluster
  governanceLevel: 'ward' | 'city' | 'state' | 'national';
}
```

### Job 3: Named Entity Recognition (NER)

**AI Provider:** Sarvam-30B with structured output

**What it does:**
- Extracts specific entities: locations, departments, people, dates, amounts
- Maps to governance hierarchy (Ward → City → State → National)
- Identifies responsible department

```typescript
// Job 3 output
interface EnrichedInput extends ClusteredInput {
  entities: {
    locations: string[];         // ['Ward 12', 'Kothrud', 'Pune']
    departments: string[];       // ['PWD', 'Municipal Water Board']
    officials: string[];         // ['Ward Corporator']
    dates: string[];             // ['last 3 days', 'since Monday']
    amounts: string[];           // ['₹4.2 crore', '₹500']
    infrastructure: string[];    // ['main pipeline', 'Sector 7']
  };
  responsibleDept: string;       // Primary department
  wardId?: string;               // Mapped ward ID
}
```

### Job 4: Sentiment & Urgency Scoring

**AI Provider:** Sarvam-30B

**What it does:**
- Rates urgency on 1-10 scale
- Detects emotional intensity
- Flags emergency/crisis situations

```typescript
// Job 4 output
interface ScoredInput extends EnrichedInput {
  urgencyScore: number;          // 1-10
  sentimentScore: number;        // -1 to +1
  emotionalIntensity: 'low' | 'medium' | 'high' | 'crisis';
  isEmergency: boolean;          // Auto-escalate if true
  affectedPopulationEstimate: number;  // Based on ward data + engagement
}
```

### Job 5: Consensus Detection

**AI Provider:** Vector similarity (embeddings) + weighted voting

**What it does:**
- Compares this input against ALL other inputs in the same topic cluster
- Detects if multiple people are saying the same thing
- Calculates consensus percentage
- Triggers synthesis when consensus threshold reached

```typescript
// Job 5 output
interface ConsensusInput extends ScoredInput {
  similarInputCount: number;     // How many others said similar things
  consensusPercentage: number;   // 0-100%
  topAgreements: string[];       // Most common points of agreement
  topDisagreements: string[];    // Points of contention
  uniqueInsight: boolean;        // Is this adding new info?
  synthesisTriggered: boolean;   // If consensus > 80% + 500 voices → synthesize
}
```

### Job 6: Structured Summary Generation

**AI Provider:** Sarvam-105B (highest quality for final output)

**What it does:**
- Generates the final synthesis report
- Creates actionable governance brief
- Estimates cost, timeline, department routing

```typescript
// Job 6 output — THE FINAL PRODUCT
interface SynthesisResult {
  id: string;
  topic: string;
  title: string;                 // "Water Supply Crisis — Ward 12, Kothrud, Pune"
  
  summary: {
    problem: string;             // "Intermittent water supply for 3+ days"
    rootCause: string;           // "Pipeline damage near XYZ junction"
    affectedPopulation: number;  // 12,500
    evidenceCount: number;       // 4,200 citizen inputs
    photoCount: number;          // 230 photos submitted
    consensusPercentage: number; // 94.2%
  };
  
  solution: {
    recommended: string;         // "Emergency pipeline repair + long-term replacement"
    estimatedCost: string;       // "₹4.2 crore"
    estimatedTimeline: string;   // "2 weeks emergency, 6 months permanent"
    departments: string[];       // ['Municipal Water Board', 'PWD']
    dependencies: string[];      // ['Budget approval from Standing Committee']
  };
  
  routing: {
    primaryDept: string;
    secondaryDepts: string[];
    governanceLevel: string;
    wardId: string;
    cityId: string;
    stateId: string;
  };
  
  accountability: {
    responsibleOfficial: string;
    cpgramsAutoFiled: boolean;
    cpgramsId?: string;
    daysWaiting: number;
    publicVisibility: boolean;
  };
  
  metadata: {
    createdAt: Date;
    lastUpdatedAt: Date;
    sourceBreakdown: {
      twitter: number;
      reddit: number;
      instagram: number;
      whatsapp: number;
      direct: number;
    };
    languageBreakdown: Record<string, number>;
  };
}
```

---

## LAYER 3: OUTPUT & ACTION

### Piece 1: Citizen Dashboard (React PWA)

**What citizens see:**
- Live feed of civic issues in their ward/city
- Synthesis reports with progress tracking
- Impact attribution: "Your input was part of a synthesis seen by 12,000 people"
- Ward councillor performance scoreboard
- Status tracker: Received → Synthesized → Routed → Acknowledged → In Progress → Resolved

**Tech:**
- React 18 + Vite + TailwindCSS v4
- Framer Motion (animations)
- TanStack Query (data fetching)
- PWA (installable, works offline)

### Piece 2: Governance Dashboard (SaaS Portal)

**What decision-makers see:**
- Prioritized issue queue ranked by citizen consensus + urgency
- AI-generated action plans per issue
- Budget justification data
- Inter-department dependency mapping
- Performance metrics (response rate, resolution time)
- Comparative ward/city benchmarking

**Revenue model:** ₹10K-50K/month per municipality (freemium) → ₹1-10 Cr/year per city (enterprise)

### Piece 3: Enforcement Layer

**CPGRAMS Auto-Filing:**
- When synthesis reaches threshold (500+ voices, 80%+ consensus), auto-generate CPGRAMS complaint
- Include: synthesis summary, evidence photos, affected population, recommended solution
- Triggers 21-day mandatory SLA

**RTI Auto-Generation:**
- Template-based RTI requests for budget data, maintenance records, department allocation
- 30-day mandatory response timeline

**Media API:**
- Public API for journalists to embed synthesis data
- Monthly "State of the City" auto-generated reports
- Embeddable widgets for news websites

---

## DATABASE SCHEMA (Drizzle ORM — PostgreSQL)

```typescript
// 5 core tables

// 1. Users (optional — anonymous-first)
users: {
  id: uuid PRIMARY KEY,
  deviceId: string UNIQUE,       // Anonymous identifier
  phone?: string,                // Optional, for OTP auth
  wardId?: string,               // Home ward
  createdAt: timestamp
}

// 2. Communities (wards, cities, states)
communities: {
  id: uuid PRIMARY KEY,
  name: string,                  // "Ward 12, Kothrud, Pune"
  level: enum('ward', 'city', 'state', 'national'),
  parentId?: uuid REFERENCES communities,
  population: integer,
  officialName?: string,         // Ward councillor name
  officialContact?: string
}

// 3. Posts (individual civic inputs)
posts: {
  id: uuid PRIMARY KEY,
  userId?: uuid REFERENCES users,
  communityId: uuid REFERENCES communities,
  rawText: string,
  translatedText: jsonb,         // {hindi: '...', english: '...'}
  source: enum('twitter', 'reddit', 'instagram', 'whatsapp', 'direct'),
  sourceUrl?: string,
  mediaUrls: string[],
  location: jsonb,               // {lat, lng, wardName, cityName}
  detectedLanguage: string,
  primaryTopic: string,
  urgencyScore: integer,
  sentimentScore: decimal,
  entities: jsonb,
  synthesisId?: uuid REFERENCES synthesis_results,
  createdAt: timestamp
}

// 4. Comments (on posts — for community discussion)
comments: {
  id: uuid PRIMARY KEY,
  postId: uuid REFERENCES posts,
  userId?: uuid REFERENCES users,
  text: string,
  upvotes: integer DEFAULT 0,
  createdAt: timestamp
}

// 5. Synthesis Results (the output product)
synthesis_results: {
  id: uuid PRIMARY KEY,
  communityId: uuid REFERENCES communities,
  topic: string,
  title: string,
  summary: jsonb,                // Full SynthesisResult object
  solution: jsonb,
  routing: jsonb,
  accountability: jsonb,
  inputCount: integer,
  consensusPercentage: decimal,
  status: enum('synthesizing', 'ready', 'routed', 'acknowledged', 'in_progress', 'resolved'),
  cpgramsId?: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## INFRASTRUCTURE & COST MODEL

### Development Stack
| Component | Technology | Monthly Cost (MVP) |
|---|---|---|
| **Backend** | Express.js on Railway | $5-10 |
| **Database** | PostgreSQL on Neon.tech | Free tier → $25 |
| **Queue** | Redis on Upstash | Free tier → $10 |
| **AI Primary** | Sarvam AI APIs | Free tier (LLMs currently free) |
| **AI Fallback** | OpenAI GPT-4o-mini | ~$10-20 |
| **Frontend** | React PWA on Cloudflare Pages | Free |
| **Auth** | Firebase Auth (Phone OTP) | Free tier |
| **CDN** | Cloudflare | Free |
| **Domain** | sushaasan.in | ₹500/year |
| **TOTAL** | | **$20-65/month** |

### Scaling Cost Model
| Scale | Users | Monthly Inputs | AI Cost | Infra Cost | Total |
|---|---|---|---|---|---|
| **College Pilot** | 1K | 5K | $5 | $20 | $25 |
| **City (Pune)** | 50K | 200K | $200 | $100 | $300 |
| **Multi-City (5)** | 500K | 2M | $2,000 | $500 | $2,500 |
| **National** | 10M | 50M | $50,000 | $5,000 | $55,000 |

**Unit economics at scale:** ~$0.001 per civic input processed. 80-85% gross margins.

---

## MVP BUILD SEQUENCE (12-Week Sprint)

### Weeks 1-2: Foundation
- [ ] Set up monorepo (client/ + server/ + shared/)
- [ ] Database schema (Drizzle ORM migrations)
- [ ] Express.js API boilerplate with auth middleware
- [ ] React PWA shell with routing

### Weeks 3-4: Core Pipeline
- [ ] BullMQ setup with Redis
- [ ] Job 1: Language detection + Sarvam Translate integration
- [ ] Job 2: Topic clustering with Sarvam LLM
- [ ] Job 3: NER extraction

### Weeks 5-6: Intelligence Layer
- [ ] Job 4: Sentiment + urgency scoring
- [ ] Job 5: Consensus detection (vector similarity)
- [ ] Job 6: Summary generation
- [ ] End-to-end pipeline test: input → synthesis in < 5 seconds

### Weeks 7-8: Citizen Frontend
- [ ] Community feed (post list, sorting, filtering)
- [ ] Post creation (text + voice + image upload)
- [ ] Synthesis result display
- [ ] Impact tracker (your posts → synthesis contribution)

### Weeks 9-10: Governance Dashboard
- [ ] Priority queue display
- [ ] Synthesis detail view (root cause, solution, cost, department)
- [ ] Ward-level analytics
- [ ] Performance scoreboard

### Weeks 11-12: Polish & Deploy
- [ ] PWA offline support
- [ ] Push notifications
- [ ] Deploy: Railway (backend) + Cloudflare Pages (frontend) + Neon (DB)
- [ ] College pilot launch (1 campus, 1K students target)

---

## WHAT THIS BLUEPRINT PROVES TO INVESTORS

1. **Every component is identified** — no hand-waving about "AI magic"
2. **Every API is specified** — Sarvam AI, social media connectors, CPGRAMS integration
3. **Every cost is estimated** — $25/month MVP to $55K/month national scale
4. **Every timeline is realistic** — 12-week MVP sprint
5. **The AI pipeline is defensible** — 6 discrete jobs, each with clear input/output
6. **The business model is proven** — SaaS pricing, 80%+ margins, aggregation economics
7. **The sovereignty narrative is technical, not just marketing** — Sarvam AI, Indian-hosted data, Bhashini integration

This is not a pitch deck. This is engineering documentation. And that's what separates Sushaasan from "just another civic tech idea."
