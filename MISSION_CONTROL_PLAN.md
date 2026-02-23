# Mission Control — Complete Build Plan

## What This Is
One internal app for Berelvant team. You create a campaign task → 7 AI agents produce real deliverables → you review and approve.

**URL:** marketing-agents-liard.vercel.app
**Stack:** Next.js + Supabase + Vercel + GPT-4o-mini + Gemini (images)

---

## Current State (Honest Audit)

### ✅ Working
- Vercel deployment with auto-deploy from GitHub
- Google OAuth (@berelvant.com)
- Sidebar navigation (Dashboard, Tasks, Clients, Workflows, Team, Settings, Admin)
- 15-min cron job on Vercel Pro

### ⚠️ Built But Untested
- 7 agent runner (real AI calls) — never actually run against real Supabase tables
- Pixel image generation (Gemini API) — storage bucket doesn't exist yet
- Clients page — `clients` table doesn't exist in Supabase
- Workflows page — `workflows` table doesn't exist in Supabase
- Team page — references non-existent table

### ❌ Not Built
- `clients` table in Supabase (code expects: name, email, company, industry, status)
- `workflows` table in Supabase
- Supabase Storage bucket for images
- Task → Client link (client_id foreign key on tasks)
- Approval workflow UI
- Export/download deliverables
- Real brand data flowing to agents

### ❌ Schema Mismatch
The SQL migration has different columns than what the code expects:
- **tasks table:** Migration has `assigned_agents`, `deliverables_required`, `priority`. Code uses `client_id`, `status` values differ (`open` vs `pending`).
- **task_comments:** Migration has `comment` column. Code writes to `message` column.
- **deliverables:** Migration has `deliverable_type`, `quality_score`. Code uses `type`, `content`.
- **clients table:** Doesn't exist in migration at all.

---

## Build Phases

### Phase 1: Foundation (Database + Schema)
**Goal:** All tables exist, code matches schema, basic CRUD works.
**Time:** 2 hours

1. Write correct SQL migration matching what the code expects
2. Create tables in Supabase:
   - `tasks` (id, title, description, status, client_id, created_at)
   - `task_comments` (id, task_id, agent_name, message, created_at)
   - `deliverables` (id, task_id, agent_name, type, content, created_at)
   - `clients` (id, name, email, company, industry, status, tone_of_voice, created_at)
   - `workflows` (id, name, description, status, created_at)
   - `authorized_users` (already exists)
   - `agent_status` (id, agent_name, status, last_poll, current_task_id)
3. Create `deliverables` storage bucket (public)
4. Set RLS policies (allow all for MVP — @berelvant.com only anyway)
5. Test: create a client, create a task — verify data saves

### Phase 2: Agent Pipeline (End-to-End)
**Goal:** Create task → agents run → deliverables appear in UI.
**Time:** 3 hours

Test each agent individually. Here's what each does:

---

## Agent-by-Agent Breakdown

### 1. Vision (SEO Strategist)
**Input:** Campaign title + description + client data
**Tools:** GPT-4o-mini
**Process:**
1. Receives task brief
2. Analyzes for target keywords, search volume, competition
3. Identifies content gaps and opportunities
4. Recommends content strategy

**Output:**
- Keyword list with volume/difficulty estimates
- Content gap analysis
- Blog topic recommendations
- Technical SEO notes

**Deliverable format:** Text (markdown-like)
**Where it shows:** Task detail → Deliverables tab → "vision" type
**Presented as:** Scrollable text block

---

### 2. Apex (PPC Strategist)
**Input:** Campaign title + description + client data
**Tools:** GPT-4o-mini
**Process:**
1. Receives task brief
2. Recommends budget allocation across platforms
3. Defines audience targeting
4. Projects CPA/ROAS

**Output:**
- Budget breakdown (Google, Meta, LinkedIn, etc.)
- Audience targeting strategy
- Bidding recommendations
- A/B test plan

**Deliverable format:** Text (markdown-like)
**Where it shows:** Task detail → Deliverables tab → "apex" type
**Presented as:** Scrollable text block

---

### 3. Nova (Analytics Strategist)
**Input:** Campaign title + description + client data
**Tools:** GPT-4o-mini
**Process:**
1. Receives task brief
2. Defines KPIs and success metrics
3. Designs measurement framework
4. Recommends attribution model

**Output:**
- KPI targets with specific numbers
- Tracking plan (what to measure, how)
- Dashboard requirements
- Reporting cadence

**Deliverable format:** Text (markdown-like)
**Where it shows:** Task detail → Deliverables tab → "nova" type
**Presented as:** Scrollable text block

---

### 4. Echo (Copywriter)
**Input:** Campaign title + description + client tone of voice
**Tools:** GPT-4o-mini
**Process:**
1. Receives task brief + client tone
2. Writes actual copy — not descriptions of copy
3. Multiple variations per format

**Output:**
- 5 headline variations
- 3 ad copy variations (short/medium/long)
- 5 CTAs
- 5 email subject lines
- Landing page hero copy
- Social media captions

**Deliverable format:** Text (ready-to-use copy)
**Where it shows:** Task detail → Deliverables tab → "echo" type
**Presented as:** Scrollable text block with copy you can select/copy

---

### 5. Pixel (Designer / Art Director)
**Input:** Campaign title + description + client brand data
**Tools:** GPT-4o-mini (creative brief) + Gemini API (image generation)
**Process:**
1. Receives task brief
2. GPT-4o-mini generates creative direction + 3 image prompts
3. Gemini API generates actual images from those prompts
4. Images uploaded to Supabase Storage

**Output:**
- Creative brief (colors, typography, layout direction)
- 3 generated ad creative images (stored in Supabase Storage)
- Platform specs

**Deliverable format:** Text (brief) + Images (PNG in storage)
**Where it shows:** Task detail → Deliverables tab → "pixel" type (text) + "image" types (rendered inline)
**Presented as:** Images rendered inline + text brief below
**Storage:** Supabase Storage → `deliverables/{task_id}/ad-creative-{n}.png`

---

### 6. Reel (Video Script Writer)
**Input:** Campaign title + description + client tone
**Tools:** GPT-4o-mini
**Process:**
1. Receives task brief
2. Writes complete scripts with dialogue
3. Includes visual directions per line

**Output:**
- 15-second script (TikTok/Reels)
- 30-second script (YouTube pre-roll)
- 60-second script (full story)
- Each with: hook, body, CTA, visual directions, music notes

**Deliverable format:** Text (full scripts)
**Where it shows:** Task detail → Deliverables tab → "reel" type
**Presented as:** Scrollable text block

---

### 7. Social (Organic Social Strategist)
**Input:** Campaign title + description + client tone
**Tools:** GPT-4o-mini
**Process:**
1. Receives task brief
2. Creates platform-specific posts
3. Builds 7-day content calendar

**Output:**
- Platform posts (Instagram, LinkedIn, Twitter/X, TikTok)
- Each with: caption, hashtags, posting time, format
- 7-day calendar
- Engagement strategy

**Deliverable format:** Text (actual posts + calendar)
**Where it shows:** Task detail → Deliverables tab → "social" type
**Presented as:** Scrollable text block

---

## Phase 3: Approval Workflow
**Goal:** Review deliverables, approve/reject per agent, mark task done.
**Time:** 2 hours

- Task statuses: `pending` → `processing` → `complete` → `approved`
- Per-agent approve/reject buttons on deliverables
- "Approve All" button on task
- Approved deliverables get visual indicator (green badge)

---

## Phase 4: Polish
**Goal:** Production-ready for daily use.
**Time:** 3 hours

- Export deliverables (copy all text / download images as zip)
- Better deliverable rendering (sections, headings, not raw text)
- Client brand data flows to agents (logo, colors, tone — stored on clients table)
- Supabase Realtime for live dashboard updates
- Mobile responsive sidebar (collapse on small screens)
- Error handling + retry failed agents

---

## Phase 5: Advanced (Later)
- Template library (common campaign types pre-fill the brief)
- Email notifications when deliverables ready
- Version history on deliverables
- ROI reporting
- GHL integration (leads → tasks)
- Real API integrations (GA4, GSC, SA360 for Vision/Apex/Nova)

---

## Dependency Map

```
Phase 1 (Database)
  └── Phase 2 (Agent Pipeline) 
        ├── Phase 3 (Approval)
        └── Phase 4 (Polish)
              └── Phase 5 (Advanced)
```

**Cannot skip Phase 1.** Everything breaks without correct tables.

---

## Cost Estimate (per task)
- 7 agents × GPT-4o-mini call (~1500 tokens out) = ~$0.01
- 3 Gemini image generations = ~$0.03
- Supabase Storage = negligible
- **Total per campaign task: ~$0.04**
- At 5 tasks/week = ~$0.80/month

---

## Next Step
**Phase 1: Fix the database.** I need Renzo to confirm:
1. Have the SQL migrations been run in Supabase? (If not, tables don't exist)
2. If tables exist, do columns match what the code expects?
3. Approve this plan → I build Phase 1 + 2 together
