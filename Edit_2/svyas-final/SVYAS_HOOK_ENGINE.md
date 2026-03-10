# SVYAS HOOK ENGINE — Technical Integration Plan
## Making Problem-Solving as Effortless as Swiping Tinder

---

## THE PSYCHOLOGY WE'RE USING (But For Good)

### What Makes Tinder/Reels Addictive (The Science)

1. **Variable Reward Loop** — You don't know if the next swipe will be amazing or boring. This uncertainty releases MORE dopamine than a guaranteed reward. Same as slot machines. Each swipe = "maybe the next one is incredible."

2. **Zero Decision Fatigue** — Binary choice only. Right or left. Watch or swipe. No menus, no options, no thinking. The brain can operate on autopilot (System 1 thinking).

3. **Instant Feedback** — Swipe right → instant "It's a Match!" animation. Post → instant likes. No waiting. Dopamine spike is IMMEDIATE.

4. **No Preview of Next** — TikTok/Reels deliberately hide what's next. You HAVE to swipe to find out. This removes the ability to "decide not to look" — your curiosity does it automatically.

5. **The Loop Has No End** — Infinite scroll. No page 2. No "you've seen everything." The brain never gets the "done" signal, so it keeps going.

6. **Micro-Completion Dopamine** — Each completed action (swipe, like, comment) is tiny but feels productive. 50 swipes = 50 micro-rewards.

### How We Apply This to Building Solutions

The key insight: **We don't make problem-solving addictive. We make CONTRIBUTING addictive.** Every micro-contribution (upvote, comment, small task, suggestion) gives the same dopamine hit as a Tinder match or a viral Reel.

---

## THREE NEW INTERACTION MODES

### MODE A: "SWIPE BUILDS" (The Tinder for Problems)

**What it is:** Full-screen cards, one at a time. Swipe right = "I want to help build this." Swipe left = "Not for me." Swipe up = "This is brilliant" (Super Like).

**The Screen:**
```
┌──────────────────────────────────┐
│                                  │
│   [Beautiful photo/mockup]       │
│                                  │
│   Building: QR Medicine Labels   │
│   for elderly patients           │
│                                  │
│   🔥 47 builders · Testing stage │
│   "Need someone to test with     │
│    grandparents in Mumbai"       │
│                                  │
│   ← SKIP          HELP BUILD →  │
│                                  │
└──────────────────────────────────┘
```

**Backend Architecture:**
```
Swipe Recommendation Engine (Supabase + pgvector):

1. User opens Swipe Mode
2. API call: GET /api/swipe/deck
3. Server generates a "deck" of 20 build cards:
   a. Query user's interest_embedding from profiles table
   b. Find 20 builds with closest need_embedding (pgvector cosine similarity)
   c. Exclude builds user already swiped on (check swipe_history table)
   d. Mix in 3-4 "trending" builds regardless of interests (exploration)
   e. Order: 70% interest-matched, 20% trending, 10% random (serendipity)
4. Return deck as JSON array

On swipe right ("I want to help"):
   a. Insert into swipe_history (user_id, build_id, direction: 'right', timestamp)
   b. Auto-follow the build (insert into follows table)
   c. Show instant animation: "You joined! Here's your first task you can do in 2 minutes:"
   d. AI generates a micro-task tailored to the user's interests
   e. Push notification to build creator: "Someone new wants to help!"
   f. +1 karma for the swiper (reward the action)

On swipe left ("Not for me"):
   a. Insert into swipe_history (user_id, build_id, direction: 'left', timestamp)
   b. Feed algorithm learns: decrease weight for similar tags
   c. Smooth animation → next card immediately (no delay = no exit point)

On swipe up ("Super Like"):
   a. Same as right swipe + boost the build's visibility score
   b. +2 karma for the swiper
   c. Build gets pushed to 50 more people's swipe decks
   d. Special animation: card flies up with particle burst

MATCH MECHANISM (adapted from Tinder):
   When user swipes right on a build, AND the build has an open task
   matching the user's interests → "IT'S A MATCH!" screen:
   "You + [Build Name] = Perfect Match! Here's a task made for you:"
   This gives the EXACT same dopamine hit as a Tinder match.
```

**New Database Tables:**
```sql
-- Swipe history
create table public.swipe_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  build_id uuid references public.problems(id),
  direction text check (direction in ('left', 'right', 'super')),
  created_at timestamptz default now()
);

-- Create index for fast "already swiped" lookups
create index idx_swipe_user_build on public.swipe_history(user_id, build_id);
```

**API Endpoint:**
```
POST /api/swipe
Body: { build_id, direction: "right" | "left" | "super" }
Response: {
  action: "joined",
  micro_task: { title: "...", description: "...", est_time: "2 min" },
  match: true | false,
  karma_earned: 1,
  next_card: { ... } // preloaded for zero-wait
}
```

---

### MODE B: "BUILD SHORTS" (The TikTok/Reels for Solutions)

**What it is:** Full-screen, vertical, swipeable stories showing 15-30 second snapshots of builds in progress. Not videos necessarily — animated cards with progress, photos, updates, milestones. Swipe up for next. Tap to enter the build.

**The Screen:**
```
┌──────────────────────────────────┐
│                                  │
│  ┌─ BUILDING ─────────────────┐  │
│  │                             │  │
│  │  "River Pollution Sensor"   │  │
│  │  [Photo of Arduino setup]   │  │
│  │                             │  │
│  │  Week 3 update:             │  │
│  │  ✅ Sensor calibrated!      │  │
│  │  ✅ First test in Pune river│  │
│  │  🔧 Need: Mobile dashboard  │  │
│  │                             │  │
│  │  12 builders · 89% complete │  │
│  │  ░░░░░░░░░░░░░░░░░▓▓       │  │
│  └─────────────────────────────┘  │
│                                  │
│  ↑ Swipe up for next             │
│  [❤️ 234]  [💬 Comment]  [🔨 Join] │
│                                  │
└──────────────────────────────────┘
```

**Why This Works (The Neuroscience):**
- Each "Short" is a BUILD UPDATE, not a video. But it triggers the same loop.
- You don't know if the next swipe shows a breakthrough, a prototype photo, a "we shipped!" celebration, or a "we need help with X."
- Variable reward: some are inspiring (shipped!), some need your help (dopamine from "I can do that!"), some are funny fails (relatable).
- The progress bar creates "completion desire" — brain wants to see it hit 100%.
- No preview of next = compulsive swiping.

**Backend Architecture:**
```
Build Shorts Generation Engine:

1. Every build automatically generates "shorts" from activity:
   - New build created → "📢 New Build: [title] — [one-line description]"
   - Task completed → "✅ [builder] just shipped [task] for [build]"
   - Milestone reached → "🎯 [build] hit [X] builders / reached [stage]!"
   - Help needed → "🔧 [build] needs [skill/task] — can you help?"
   - Build shipped → "🚀 [build] is LIVE! [X] people are using it!"

2. Shorts are stored in a dedicated table:
   create table public.build_shorts (
     id uuid default gen_random_uuid() primary key,
     build_id uuid references public.problems(id),
     short_type text, -- 'new', 'progress', 'milestone', 'help', 'shipped'
     title text,
     body text,
     image_url text,
     progress_pct int,
     engagement_score float default 0,
     created_at timestamptz default now()
   );

3. Shorts feed algorithm (similar to TikTok):
   GET /api/shorts/feed
   - 40% from builds you follow (keep you invested)
   - 30% trending shorts (high engagement_score in last 24h)
   - 20% interest-matched (pgvector similarity)
   - 10% random (serendipity / exploration)
   
   engagement_score = (upvotes * 1) + (comments * 3) + (joins * 10) + (task_claims * 15)
   Recalculated every hour.

4. Interaction tracking:
   - Watch time per short (did they read it or swipe instantly?)
   - Swipe-away rate in first 2 seconds (= bad hook, downrank)
   - Tap-through rate (tapped to enter build = high quality signal)
   - These feed back into the algorithm to improve recommendations
```

**Dopamine Loop Design:**
```
OPEN APP → First short auto-loads (no blank screen EVER)
          → Variable content: inspiring / needs help / celebration
          → SWIPE UP → Next short (instant, preloaded)
          → See "🔧 Need: Record 3 Hindi explainers"
          → Think "I can do that in 5 min!"
          → Tap → Claim task → DO IT → Complete → +5 karma
          → DOPAMINE HIT: "You just helped 500 students!"
          → Back to shorts → Keep swiping
          → 20 minutes later: contributed to 3 builds without trying
```

---

### MODE C: "MICRO-TASKS" (The 2-Minute Build Contribution)

**What it is:** A dedicated feed of tiny, completable tasks. Each takes 1-5 minutes. Like a todo list for the world's problems. Swipe through them. Claim. Do. Done. Karma.

**The Screen:**
```
┌──────────────────────────────────┐
│  ⚡ QUICK BUILDS · 2-5 min each  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ "Find 3 mandi price APIs"  │  │
│  │  For: Farmer Market Bot    │  │
│  │  ⏱️ ~5 min  · +5 karma     │  │
│  │  [CLAIM →]                 │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ "Test UPI app with elderly │  │
│  │  family member, report"    │  │
│  │  For: UPI Simplifier       │  │
│  │  ⏱️ ~10 min · +8 karma     │  │
│  │  [CLAIM →]                 │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ "Translate 5 NEET Qs to   │  │
│  │  Tamil"                    │  │
│  │  For: NEET WhatsApp Bot    │  │
│  │  ⏱️ ~3 min  · +5 karma     │  │
│  │  [CLAIM →]                 │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Why This Works:**
- **Completion dopamine**: Each task is FINISHABLE in minutes. That "done" feeling is addictive.
- **Karma accumulation**: Watching your karma number go up = same as watching follower count grow.
- **Streak mechanic**: "🔥 5-day streak! Complete 1 task today to keep it." (Borrowed from Snapchat/Duolingo)
- **Leaderboards**: Weekly top builders. Social proof + competition.

**Backend:**
```sql
-- Micro-tasks are regular tasks but filtered by estimated time
-- Add to existing tasks table:
alter table public.tasks add column est_minutes int default 15;
alter table public.tasks add column is_micro boolean default false;

-- Micro-task feed endpoint:
-- GET /api/tasks/micro?interests=health,education&limit=20
-- Returns tasks where est_minutes <= 10 AND is_micro = true
-- Ordered by: interest match score + karma reward + recency
```

**Streak System:**
```sql
create table public.streaks (
  user_id uuid references public.profiles(id) primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_contribution_date date,
  updated_at timestamptz default now()
);

-- Function: update streak on any contribution
create or replace function public.update_streak()
returns trigger as $$
begin
  -- If contributed today already, no change
  -- If contributed yesterday, increment streak
  -- If gap > 1 day, reset streak to 1
  -- Update longest_streak if current > longest
end;
$$ language plpgsql security definer;
```

---

## THE MASTER FEED (Combining All Three)

The home screen isn't just ONE of these modes. It's a smart combination:

```
APP OPENS → Full-screen Build Short auto-plays
         → User can:
            a) Keep swiping shorts (stay in Shorts mode)
            b) Tap bottom nav: "Swipe" → Enter Tinder-style swipe mode
            c) Tap bottom nav: "Quick" → Enter micro-task mode
            d) Tap bottom nav: "Build" → Enter deep build rooms
            e) Tap bottom nav: "Profile" → Karma, badges, streaks

BOTTOM NAVIGATION (5 items, like Instagram):
┌──────────────────────────────────────────┐
│  🏠 Feed  │  👆 Swipe  │  ➕  │  ⚡ Quick │  👤 Me  │
└──────────────────────────────────────────┘
```

**The "+" button (center):** Always accessible. Tap = start a new build. Same importance as Instagram's post button. This is how new builds enter the ecosystem.

---

## ENGAGEMENT LOOPS (The Retention Engine)

### Loop 1: The Daily Hook
```
Morning push notification:
"🔥 Your streak: 7 days! Complete 1 quick task to keep it."
or
"🚀 The NEET Bot you helped build just hit 200 users!"
or
"🔧 A build near you needs help: [title]"

These are personalized, not generic. They reference YOUR contributions.
```

### Loop 2: The Progress Investment
```
Once you've contributed to a build, you're INVESTED.
You want to see it succeed.
The app sends updates: "The medicine label app you helped test
is now being piloted in 3 pharmacies!"

This creates the same "relationship investment" that makes people
check Tinder for responses — but instead of checking for dates,
you're checking for IMPACT.
```

### Loop 3: The Social Proof Loop
```
"47 people joined this build today"
"Ravi (Builder ⚡ · 890 karma) just completed a task"
"This build is #3 trending in India right now"

Seeing others contribute makes you want to contribute.
Same mechanism as "X people liked this" on Instagram.
```

### Loop 4: The Karma Race
```
Weekly leaderboard: "Top 10 builders this week"
Monthly badges: "March Builder of the Month"
Milestone celebrations: "🎉 You hit 100 karma! You're now a Grower 🌳"

These create the same competitive dopamine as gaming leaderboards.
But instead of competing in a game, you're competing to BUILD MORE.
```

---

## TECHNICAL IMPLEMENTATION ORDER

```
STEP 1: Build Shorts table + auto-generation triggers
        (Every build activity creates a short automatically)

STEP 2: Shorts Feed API + algorithm
        (Interest-matched + trending + random mix)

STEP 3: Swipe Builds mode + swipe_history table
        (Tinder-style card deck + recommendation engine)

STEP 4: Micro-tasks feed + estimation system
        (Quick-complete tasks filtered and ranked)

STEP 5: Streak system + daily contribution tracking

STEP 6: Push notifications + daily hooks

STEP 7: Leaderboards + social proof elements

STEP 8: "IT'S A MATCH" animation for task-user pairing

STEP 9: Analytics: track swipe rates, watch times, completion rates
        to continuously improve the feed algorithm
```

---

## API ENDPOINTS (New)

```
GET  /api/swipe/deck          → 20 build cards for swiping
POST /api/swipe               → Record swipe + handle match logic
GET  /api/shorts/feed         → Infinite scroll of build updates
POST /api/shorts/engage       → Track views, taps, swipe-aways
GET  /api/tasks/micro         → Quick-complete tasks feed
POST /api/streaks/check       → Get/update user's streak
GET  /api/leaderboard/weekly  → Top builders this week
GET  /api/feed/combined       → Smart mix of all content types
```

---

## THE ETHICAL DIFFERENCE

Tinder/TikTok use these mechanics to waste your time.
We use THE EXACT SAME MECHANICS to make you build things.

Every swipe on Svyas either:
- Helps an algorithm show you better builds (learning)
- Connects you to something you can help with (building)
- Gives visibility to someone's work (amplifying)

Every "addictive" minute on Svyas = actual real-world impact.

**That's the revolution: taking the most powerful engagement 
technology ever created and pointing it at solving problems 
instead of selling ads.**
