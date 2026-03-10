# PROJECT SVYAS — FULL PLATFORM BUILD
## Claude Code Implementation Prompts & Tasks

> Use this file as a step-by-step prompt guide in VS Code with Claude Code.
> Copy each TASK section as a prompt. Complete them in order.
> Repository: https://github.com/harsh147-github/Project_Svyas

---

## ARCHITECTURE OVERVIEW

```
Project_Svyas/
├── index.html                    # Landing page (existing - keep as is)
├── build.html                    # → REPLACE with new platform workspace
├── app/
│   ├── auth.html                 # Sign up / Sign in page
│   ├── dashboard.html            # User dashboard (my projects, my tasks)
│   ├── project.html              # Single project room (real-time collab)
│   └── profile.html              # User profile + reputation/karma
├── api/
│   ├── agent.js                  # Claude AI agents (existing - enhance)
│   ├── match.js                  # Matching engine endpoint
│   ├── project.js                # Project CRUD operations
│   ├── reputation.js             # Karma/badge system
│   └── notify.js                 # Notification dispatcher
├── lib/
│   ├── supabase.js               # Supabase client config
│   ├── embeddings.js             # Text → vector embeddings for matching
│   └── agents.js                 # Agent system prompts (extracted)
├── vercel.json                   # Routing config
├── package.json                  # Dependencies
└── README.md                     # Updated docs
```

### Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS + React via CDN (no build step)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL + Auth + Realtime + pgvector)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Notifications**: Resend (email) via Vercel functions
- **Hosting**: Vercel

---

## PREREQUISITE SETUP

### Task 0A: Create Supabase Project

```
PROMPT FOR CLAUDE CODE:

I need to set up a Supabase project for Project Svyas. Help me:

1. Guide me through creating a project at https://supabase.com
2. Once I have the project URL and anon key, create a file at lib/supabase.js:

```javascript
// lib/supabase.js
// Exports Supabase config for use in both frontend and API functions
export const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_PROJECT_URL';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // server-side only
```

3. Create the database schema by running this SQL in Supabase SQL Editor:

-- Enable pgvector for the matching engine
create extension if not exists vector;

-- Users profile (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  skills text[] default '{}',
  interests text[] default '{}',
  skill_embedding vector(384),  -- for matching engine
  karma_score int default 0,
  badges text[] default '{}',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  problem_statement text,
  stage text default 'idea' check (stage in ('idea','shaping','research','building','connecting','launching','live')),
  tags text[] default '{}',
  need_embedding vector(384),  -- for matching engine
  created_by uuid references public.profiles(id) not null,
  is_public boolean default true,
  max_members int default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project members
create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner','admin','member','ai_agent')),
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- Task cards (like Solvearn task cards)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'open' check (status in ('open','claimed','in_progress','review','done')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id) not null,
  agent_generated boolean default false,
  karma_reward int default 5,
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages / chat within projects
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id),
  agent_name text,  -- if sent by AI agent
  content text not null,
  message_type text default 'chat' check (message_type in ('chat','system','agent','task_update')),
  created_at timestamptz default now()
);

-- AI conversation context (persists agent conversations)
create table public.agent_conversations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  agent_type text not null,
  messages jsonb default '[]',
  context jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reputation events (karma ledger)
create table public.reputation_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,  -- 'task_completed', 'helpful_answer', 'project_launched', etc.
  points int not null,
  description text,
  project_id uuid references public.projects(id),
  created_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text,
  type text default 'info',
  read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- Row Level Security policies
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.reputation_events enable row level security;
alter table public.notifications enable row level security;

-- Profiles: anyone can read, users can update own
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Projects: public ones are viewable by all, members can edit
create policy "Public projects viewable" on public.projects for select using (is_public = true);
create policy "Creator can edit project" on public.projects for update using (auth.uid() = created_by);
create policy "Auth users can create projects" on public.projects for insert with check (auth.uid() = created_by);

-- Tasks: project members can view and update
create policy "Members can view tasks" on public.tasks for select using (
  exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
  or exists (select 1 from public.projects where id = tasks.project_id and is_public = true)
);
create policy "Members can create tasks" on public.tasks for insert with check (
  exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
);
create policy "Assignee or creator can update tasks" on public.tasks for update using (
  auth.uid() = assigned_to or auth.uid() = created_by
);

-- Messages: project members can read and write
create policy "Members can view messages" on public.messages for select using (
  exists (select 1 from public.project_members where project_id = messages.project_id and user_id = auth.uid())
);
create policy "Members can send messages" on public.messages for insert with check (
  auth.uid() = user_id
);

-- Notifications: users see only their own
create policy "Users see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System can create notifications" on public.notifications for insert with check (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update karma score
create or replace function public.update_karma()
returns trigger as $$
begin
  update public.profiles
  set karma_score = (select coalesce(sum(points), 0) from public.reputation_events where user_id = new.user_id)
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_reputation_event
  after insert on public.reputation_events
  for each row execute procedure public.update_karma();

-- Enable realtime for messages and tasks
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notifications;

Save my Supabase URL, anon key, and service role key. I'll need them as environment variables.
```

### Task 0B: Initialize Package.json

```
PROMPT FOR CLAUDE CODE:

Create a package.json for Project Svyas with these dependencies:
- @supabase/supabase-js (database + auth + realtime)
- @anthropic-ai/sdk (Claude API - optional, we can use fetch too)
- resend (email notifications)

Keep it minimal. We're using Vercel serverless functions, not a full Node app.
```

---

## PHASE 1: AUTHENTICATION & USER PROFILES

### Task 1A: Auth Page

```
PROMPT FOR CLAUDE CODE:

Create app/auth.html — a sign-up/sign-in page for Project Svyas.

Design requirements:
- Same dark theme as build.html (DM Sans font, #060A07 background, #34D399 green accents)
- Particle background (reuse from build.html)
- Two modes: Sign Up and Sign In (toggle between them)
- Sign Up fields: email, password, username, display name
- Sign In fields: email, password
- Use Supabase Auth JS client (load from CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
- On successful auth, redirect to /app/dashboard.html
- Show errors inline (wrong password, email taken, etc.)
- Include "Back to home" link
- Store the Supabase URL and anon key as variables at top of script (I'll replace with env vars later)

Make it clean, minimal, professional. No emojis. Smooth animations on form transitions.
```

### Task 1B: Profile Page

```
PROMPT FOR CLAUDE CODE:

Create app/profile.html — user profile page.

Must show:
- User's display name, username, bio
- Skills (editable tags)
- Interests (editable tags)
- Karma score with visual progress ring
- Badges earned (visual grid)
- Projects they're part of (fetched from project_members)
- Edit mode: toggle to edit bio, skills, interests
- Uses Supabase client to fetch/update profiles table

Design: same dark theme, clean layout, smooth transitions.
User must be authenticated — redirect to auth.html if not.
```

---

## PHASE 2: DASHBOARD & PROJECT MANAGEMENT

### Task 2A: Dashboard

```
PROMPT FOR CLAUDE CODE:

Create app/dashboard.html — the main user dashboard.

Layout (3-column on desktop, stacks on mobile):
LEFT SIDEBAR:
- User avatar + name + karma score
- Navigation: Dashboard, My Projects, Explore, Notifications
- "New Project" button

CENTER:
- "My Projects" — grid of project cards the user owns or is a member of
  - Each card shows: title, stage badge, member count, task count, last activity
  - Click → goes to /app/project.html?id=PROJECT_ID
- "Recommended For You" — projects matched to user's skills (placeholder for now, will connect to matching engine later)

RIGHT SIDEBAR:
- Notifications panel (from notifications table, real-time via Supabase)
- "Quick Actions": Create Project, Browse Problems, Find Team

Supabase queries needed:
- Fetch user's profile
- Fetch projects where user is a member (join project_members + projects)
- Fetch notifications for user
- Subscribe to realtime notifications

Design: dark theme, clean cards, status badges with color coding per stage.
```

### Task 2B: Create Project Flow

```
PROMPT FOR CLAUDE CODE:

Add a "Create Project" modal/flow to the dashboard.

Steps:
1. Enter project title
2. Describe the problem you want to solve (textarea)
3. Select tags (predefined list + custom: health, education, finance, environment, tech, social, other)
4. Choose visibility: public or private
5. Submit → creates project in Supabase → adds user as owner in project_members → redirects to project page

When creating, also:
- Call the AI agent API (/api/agent) with the problem description using the "orchestrator" agent to get an initial analysis
- Store the AI response as the first message in the messages table with agent_name = "SUAS Guide"
- Auto-create 3 initial tasks via the "ideation" agent (e.g., "Define target audience", "Research existing solutions", "Draft MVP scope")

This makes every new project immediately feel alive with AI-generated structure.
```

### Task 2C: Project Room

```
PROMPT FOR CLAUDE CODE:

Create app/project.html?id=PROJECT_ID — the real-time project collaboration room.

This is the CORE of the platform. Layout:

TOP BAR:
- Project title + stage badge
- Member avatars (small circles)
- Settings gear icon

LEFT PANEL (expandable sidebar):
- Pipeline stages (same visual as build.html: Describe → Shape → Research → Build → Connect → Launch)
- Click a stage to filter tasks and switch AI agent context
- Current stage highlighted

CENTER (main area, tabbed):
Tab 1: "Chat" — real-time messaging
  - Messages from team members AND AI agents
  - Input bar at bottom
  - "@agent" command to invoke a specific AI agent (e.g., @research "find competitors in this space")
  - Messages saved to Supabase messages table
  - Real-time via Supabase Realtime subscription

Tab 2: "Tasks" — kanban-style task board
  - Columns: Open → Claimed → In Progress → Review → Done
  - Drag-and-drop (or click to move)
  - Each card shows: title, assignee avatar, priority dot, karma reward
  - Click card → expand to see description, comments, claim/complete buttons
  - "AI Generate Tasks" button → calls ideation agent to suggest new tasks based on project context
  - Tasks saved to Supabase tasks table

Tab 3: "Files" — placeholder for future file uploads

RIGHT PANEL:
- "AI Agents" — list of available agents, click to open direct chat with that agent in context of this project
- "Members" — list with roles, invite button
- "Project Context" — auto-generated summary that updates as the project evolves

Supabase operations:
- Fetch project details, members, tasks, messages
- Subscribe to realtime updates on messages and tasks
- Insert new messages and tasks
- Update task status and assignments

When a task is completed:
- Add karma_reward points to the user's reputation_events
- The trigger auto-updates their karma_score
- Send a notification to the project owner
```

---

## PHASE 3: AI AGENTS (ENHANCED)

### Task 3A: Extract Agent Prompts

```
PROMPT FOR CLAUDE CODE:

Refactor api/agent.js:

1. Extract all agent system prompts into lib/agents.js as a shared module
2. Update the prompts to be PROJECT-AWARE — they should reference the project's title, description, current stage, existing tasks, and team members when available
3. Add a new "project context builder" that fetches project data from Supabase and includes it in the system prompt

Updated agent.js should:
- Accept project_id in the request body
- Fetch project details + recent messages + tasks from Supabase
- Build a rich context string and inject it into the system prompt
- Support a new "@agent" command format: { command: "@research", query: "find competitors" }
- Return structured responses that can include:
  - text (normal response)
  - tasks (array of suggested tasks to auto-create)
  - stage_suggestion (recommend moving to next pipeline stage)
```

### Task 3B: Agent-Generated Tasks

```
PROMPT FOR CLAUDE CODE:

Create a system where AI agents can generate actionable tasks.

When the Builder agent is asked to help with implementation:
- It should return a structured response with a "tasks" array
- Each task has: title, description, priority, estimated_karma_reward
- The frontend should display these as "Suggested Tasks" cards
- User can click "Add to Board" to create them in the tasks table
- Tasks created by AI have agent_generated = true

When the Research agent is asked to investigate:
- It should break its research into discrete findings
- Each finding becomes a task card: "Validate finding: [X]"
- This turns research into trackable, completable work

Modify api/agent.js to include a JSON instruction in the system prompt:
"When you identify actionable next steps, include them in your response as a JSON block wrapped in ```tasks ... ``` with format: [{"title": "...", "description": "...", "priority": "medium", "karma_reward": 5}]"

The frontend parses this out and renders task suggestion cards.
```

---

## PHASE 4: MATCHING ENGINE

### Task 4A: Embedding Generator

```
PROMPT FOR CLAUDE CODE:

Create lib/embeddings.js — a module that converts text into vector embeddings for the matching engine.

Options (pick the simplest that works):

Option A (preferred — no external API needed):
- Use a lightweight TF-IDF or bag-of-words approach
- Compute similarity using cosine distance in Supabase pgvector
- Store 384-dimension vectors (Supabase pgvector supports this)

Option B (better quality, needs API):
- Use Anthropic's or OpenAI's embedding API
- Convert user skills + project descriptions into embeddings
- Store in the skill_embedding / need_embedding columns

For MVP, Option A is fine. We can upgrade later.

Create a function: generateEmbedding(text) → vector(384)
Create a function: computeSimilarity(vectorA, vectorB) → float (0-1)
```

### Task 4B: Matching API Endpoint

```
PROMPT FOR CLAUDE CODE:

Create api/match.js — a Vercel serverless function for the matching engine.

Endpoints (using query params to differentiate):

GET /api/match?type=people&project_id=XXX
  → Returns top 10 users whose skill_embedding is closest to the project's need_embedding
  → Uses Supabase pgvector: select *, skill_embedding <=> $1 as distance from profiles order by distance limit 10

GET /api/match?type=projects&user_id=XXX
  → Returns top 10 projects whose need_embedding is closest to the user's skill_embedding
  → This powers the "Recommended For You" section on the dashboard

POST /api/match
  → Body: { text: "description of what I need" }
  → Generates embedding from text
  → Returns matched users AND projects

When a user updates their skills or a project updates its description:
- Auto-generate new embeddings
- Store in the respective embedding columns
- This keeps matches fresh

Security:
- Requires authentication (check Supabase JWT)
- Rate limit: 10 requests per minute per user
```

---

## PHASE 5: REPUTATION SYSTEM

### Task 5A: Karma & Badges

```
PROMPT FOR CLAUDE CODE:

Create api/reputation.js — manages the karma/badge system.

Karma events and their point values:
- project_created: +10
- task_completed: +5 per task
- task_completed_on_time: +3 bonus
- helpful_answer: +2 (when message is marked helpful)
- project_launched: +25
- first_contribution: +5 (badge: "First Step")
- streak_7_days: +15 (badge: "On Fire")
- invited_member: +3
- received_match: +1 (someone was matched to you)

Badge tiers based on total karma:
- 0-25: "Seed" 🌱
- 26-100: "Sprout" 🌿
- 101-500: "Grower" 🌳
- 501-2000: "Builder" ⚡
- 2001+: "Architect" 👑

API endpoints:
POST /api/reputation — { user_id, event_type, points, description, project_id }
GET /api/reputation?user_id=XXX — returns karma score + badges + recent events

The badges are computed on read (not stored) based on karma thresholds and event history.
Badge check function examines reputation_events for specific patterns.

Security: reputation events can only be created by the server (service role key), never by client directly. This prevents manipulation.
```

---

## PHASE 6: NOTIFICATIONS

### Task 6A: Notification System

```
PROMPT FOR CLAUDE CODE:

Create api/notify.js — handles in-app and email notifications.

In-app notifications:
- Created by inserting into the notifications table
- Frontend subscribes via Supabase Realtime
- Types: task_assigned, task_completed, new_member, project_update, match_found, karma_earned

Email notifications (via Resend):
- Only for high-priority events: task_assigned, match_found, project_launched
- Uses Resend API (npm package: resend)
- Template: clean, minimal HTML email with SUAS branding
- Env var: RESEND_API_KEY

Notification triggers (called from other API endpoints):
- When a task is assigned → notify the assignee (in-app + email)
- When a task is completed → notify the project owner (in-app)
- When matching engine finds a match → notify both parties (in-app + email)
- When karma milestone reached → notify the user (in-app)
- When new member joins project → notify all existing members (in-app)

Function: sendNotification({ user_id, title, body, type, link, send_email: bool })
```

---

## PHASE 7: VERCEL DEPLOYMENT CONFIG

### Task 7A: Vercel Configuration

```
PROMPT FOR CLAUDE CODE:

Update vercel.json with routes for all API endpoints and app pages:

{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/app/:path*", "destination": "/app/:path*" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}

Environment variables needed in Vercel:
- ANTHROPIC_API_KEY (Claude API)
- SUPABASE_URL (database)
- SUPABASE_ANON_KEY (client-side operations)
- SUPABASE_SERVICE_KEY (server-side operations, bypasses RLS)
- RESEND_API_KEY (email notifications)

Create a .env.example file listing all required variables.
```

---

## PHASE 8: INTEGRATION & POLISH

### Task 8A: Update Landing Page CTAs

```
PROMPT FOR CLAUDE CODE:

Update index.html:
- "Start Building" button → links to /app/auth.html (sign up first)
- Add "Sign In" link in navbar
- Update the "How It Works" section to reflect the full platform flow:
  1. Sign up (free, 30 seconds)
  2. Describe your problem
  3. AI agents shape your idea + generate tasks
  4. Get matched with collaborators
  5. Build together in real-time project rooms
  6. Launch with AI-generated pitch + strategy

Keep the existing manifesto and philosophy sections unchanged.
```

### Task 8B: Build Space → Platform Workspace

```
PROMPT FOR CLAUDE CODE:

Update build.html to serve as the NEW project workspace entry point.

If user is NOT authenticated:
  → Show the pipeline view with the "What will you build?" prompt
  → When they type and hit enter, redirect to /app/auth.html with the problem text as a URL param
  → After auth, auto-create a project with that problem statement

If user IS authenticated:
  → Show their current active project's workspace
  → Or if no active project, show "Create your first project" flow

This makes build.html a smart router that works for both new visitors and existing users.
```

### Task 8C: n8n Webhook Integration (Future)

```
PROMPT FOR CLAUDE CODE:

Create a webhook-compatible endpoint at api/webhook.js that n8n can call.

This endpoint accepts POST requests with an action type:
- action: "run_matching" → triggers matching engine for a specific project
- action: "generate_tasks" → calls AI agent to generate tasks for a project
- action: "send_digest" → sends daily email digest to all active users
- action: "update_embeddings" → regenerates embeddings for all projects/users

Security: webhook must include a secret token (WEBHOOK_SECRET env var)

This allows n8n (self-hosted or cloud) to orchestrate automated workflows:
- Every hour: re-run matching for new projects
- Every day: send activity digests
- On project creation: auto-run matching + task generation
- On task completion: check for badge milestones

For MVP, these can be triggered manually or via Vercel cron jobs.
We'll connect n8n later when the platform has users.
```

---

## EXECUTION ORDER (RECOMMENDED)

```
STEP 1: Run Task 0A (Supabase setup — do this manually in browser)
STEP 2: Run Task 0B (package.json)
STEP 3: Run Task 1A (Auth page — this unblocks everything)
STEP 4: Run Task 2A (Dashboard — the home screen)
STEP 5: Run Task 2B (Create Project — so users can actually do something)
STEP 6: Run Task 3A (Enhanced agents — project-aware AI)
STEP 7: Run Task 2C (Project Room — the core experience)
STEP 8: Run Task 3B (Agent-generated tasks)
STEP 9: Run Task 5A (Reputation system)
STEP 10: Run Task 4A + 4B (Matching engine)
STEP 11: Run Task 6A (Notifications)
STEP 12: Run Task 7A (Vercel config)
STEP 13: Run Task 8A + 8B (Integration + polish)
STEP 14: Run Task 8C (Webhook for future n8n)
STEP 15: Run Task 1B (Profile page — polish)
```

---

## ENVIRONMENT VARIABLES CHECKLIST

```
# Anthropic (AI agents)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (database + auth + realtime)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_KEY=eyJhbGciOi...

# Resend (email notifications)
RESEND_API_KEY=re_...

# Webhook security
WEBHOOK_SECRET=your-random-secret-here
```

---

## DESIGN SYSTEM (USE ACROSS ALL PAGES)

```css
/* Colors */
--bg: #060A07;
--surface: #0C1510;
--surface2: #111E17;
--border: #1A2D22;
--green: #34D399;
--green-dim: rgba(52,211,153,0.06);
--amber: #FBBF24;
--blue: #60A5FA;
--violet: #A78BFA;
--rose: #FB7185;
--text: #E6F0EA;
--text2: #94AFA0;
--text3: #4A6A56;
--text4: #2A4233;

/* Typography */
Font: 'DM Sans', -apple-system, sans-serif
Mono: 'DM Mono', monospace
Headings: 300-600 weight, -0.03em tracking
Body: 14-15px, 1.6-1.75 line height

/* Spacing */
Base unit: 4px
Common: 8, 12, 16, 20, 24, 32, 40, 48

/* Radius */
Small: 6-8px
Medium: 10-12px
Large: 14-16px
Cards: 16px

/* Animations */
Default: 0.2s ease
Smooth: 0.4s cubic-bezier(0.16, 1, 0.3, 1)
Spring: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)

/* Shadows */
Card hover: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(52,211,153,0.04)
Input focus: 0 0 0 3px rgba(52,211,153,0.06), 0 12px 40px rgba(0,0,0,0.3)
```

---

## NOTES FOR CLAUDE CODE

- Always use Supabase JS client v2 (CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
- Frontend pages are static HTML with inline React via Babel standalone (same pattern as existing index.html and build.html)
- API functions are Vercel serverless (export default async function handler(req, res))
- Never expose SUPABASE_SERVICE_KEY or ANTHROPIC_API_KEY on the frontend
- Use Supabase anon key on frontend (RLS protects data)
- Use Supabase service key in API functions (bypasses RLS for server operations)
- All dates in UTC
- All IDs are UUIDs
- Test each task independently before moving to the next

---

## THE VISION

When complete, a user's journey looks like:

1. Land on svyas.vercel.app → see the manifesto → click "Start Building"
2. Sign up (30 sec) → land on dashboard
3. Click "New Project" → describe their problem → AI instantly shapes it + generates tasks
4. Get matched with people who have complementary skills
5. Work together in a real-time project room with AI agents assisting
6. Complete tasks → earn karma → unlock badges
7. Launch agent writes their pitch → they ship it
8. The platform did the work alongside them. Not just a place to chat.

That's Project Svyas. That's SUAS. Shut Up And Solve.
