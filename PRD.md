# Mission Control — Product Requirements Document

## 1. What Is This

Mission Control is Berelvant's internal marketing automation platform. It replaces the manual process of briefing, coordinating, and executing marketing campaigns across multiple disciplines.

Instead of a team of 7 specialists spending 3-4 days on a campaign brief, 7 AI agents do it in 30-60 minutes — using real data, real tools, and producing ready-to-use deliverables in Google Drive.

## 2. What Problem It Solves

**Today's workflow (manual):**
1. Renzo or team writes a campaign brief
2. SEO person researches keywords (hours)
3. PPC person builds budget/targeting (hours)
4. Analytics person defines KPIs (hours)
5. Copywriter writes variations (hours-days)
6. Designer creates assets (hours-days)
7. Video person writes scripts (hours)
8. Social media person creates posts (hours)
9. Someone consolidates everything (hours)
10. Review, revisions, back and forth (days)

**Total: 3-5 days, $2K-5K in labor per campaign**

**Mission Control workflow:**
1. Create task with campaign brief on dashboard
2. 7 agents run in parallel (30-60 min)
3. All deliverables appear in Google Drive
4. Review and approve
5. Execute

**Total: 1 hour, ~$0.05 in API costs per campaign**

## 3. Users

Internal Berelvant team only. Not client-facing.

- **Renzo** — Creates tasks, reviews output, approves
- **Team members** — Create tasks, use deliverables for execution
- **Cora** — Orchestrates agent execution

## 4. System Architecture

```
┌─────────────────────────────────────────────────┐
│                   VERCEL (UI)                    │
│                                                  │
│  Dashboard · Tasks · Clients · Team · Settings   │
│  Auth (Google OAuth, @berelvant.com only)        │
│                                                  │
│  READ/WRITE → Supabase                           │
│  DISPLAY → Links to Google Drive files           │
└──────────────────────┬──────────────────────────┘
                       │
                 ┌─────┴─────┐
                 │  SUPABASE  │
                 │            │
                 │  tasks     │
                 │  clients   │
                 │  deliverables │
                 │  agent_runs│
                 └─────┬─────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              MAC MINI (Execution)                 │
│                                                  │
│  OpenClaw cron polls Supabase for pending tasks  │
│  Cora orchestrates 7 agents                      │
│                                                  │
│  Tools available:                                │
│  · gog CLI (Google Docs, Sheets, Drive)          │
│  · Data4SEO API (keyword research)               │
│  · GSC MCP (search console data)                 │
│  · GA4 MCP (analytics data)                      │
│  · SA360 / Google Ads (PPC data)                 │
│  · Gemini API (image generation)                 │
│  · GPT-4o-mini (analysis, writing)               │
│  · OpenAI API (embeddings, completions)          │
│                                                  │
│  Agents write output to:                         │
│  · Google Drive (docs, sheets, images)           │
│  · Supabase (status, links, metadata)            │
└──────────────────────────────────────────────────┘
```

## 5. Google Drive Output Structure

All output goes to one shared Drive folder. Each task gets a subfolder. Each agent gets a subfolder within that.

```
Mission Control Output/
└── {Task Name} - {YYYY-MM-DD}/
    ├── Vision/
    │   ├── Keyword Research.gsheet
    │   ├── SEO Strategy.gdoc
    │   └── Content Gap Analysis.gsheet
    ├── Apex/
    │   ├── Budget Allocation.gsheet
    │   ├── PPC Strategy.gdoc
    │   └── Audience Targeting.gsheet
    ├── Nova/
    │   ├── KPI Dashboard.gsheet
    │   └── Measurement Framework.gdoc
    ├── Echo/
    │   ├── Ad Copy Variations.gdoc
    │   └── Headlines & CTAs.gsheet
    ├── Pixel/
    │   ├── Creative Brief.gdoc
    │   ├── Ad Specs.gsheet
    │   └── ad-creative-1.png, ad-creative-2.png...
    ├── Reel/
    │   └── Video Scripts.gdoc
    └── Social/
        ├── Content Calendar.gsheet
        └── Social Posts.gdoc
```

Agents decide what files to create based on the task brief. The structure above is an example — not a rigid template. An agent might create 1 file or 5, depending on what the task needs.

## 6. Database Schema

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Campaign/task name |
| description | TEXT | Full brief |
| status | TEXT | `pending` → `processing` → `complete` → `approved` |
| client_id | UUID | FK to clients (optional) |
| drive_folder_url | TEXT | Link to task's Drive folder |
| created_by | TEXT | Email of creator |
| created_at | TIMESTAMP | |

### clients
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Client name |
| email | TEXT | Contact email |
| company | TEXT | Company name |
| industry | TEXT | Industry vertical |
| domain | TEXT | Website domain (for GSC/GA4 lookups) |
| tone_of_voice | TEXT | Brand voice guidelines |
| status | TEXT | `active` / `inactive` |
| drive_folder_id | TEXT | Client's Drive folder ID (optional) |
| created_at | TIMESTAMP | |

### agent_runs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| task_id | UUID | FK to tasks |
| agent_name | TEXT | Vision, Apex, Nova, Echo, Pixel, Reel, Social |
| wave | INT | 1 or 2 |
| status | TEXT | `pending` → `running` → `complete` → `error` |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | |
| output_summary | TEXT | Brief description of what was produced |
| output_data | JSONB | Structured data for other agents to consume (Wave 1 → Wave 2 handoff) |
| output_files | JSONB | Array of {name, type, url} for Drive files |
| error | TEXT | Error message if failed |

### authorized_users
Already exists. No changes needed.

### Tables to REMOVE (unused)
- `task_comments` — replaced by agent_runs
- `deliverables` — replaced by agent_runs.output_files
- `agent_status` — replaced by agent_runs

## 7. The 7 Agents

Every agent follows the same pattern:
1. **Read** the task brief + client data from Supabase
2. **Decide** what to do based on the ask (operational, strategic, or both)
3. **Pull real data** when available (APIs, MCP servers)
4. **Generate output** (analysis, copy, images — whatever the task needs)
5. **Create files** in Google Drive (agent's subfolder)
6. **Write back** to Supabase (status, file links, summary)

Agents are not templates. They are digital employees. The task brief tells them what to do. They figure out the rest.

---

### Agent 1: Vision (SEO Strategist) — WAVE 1

**Expertise:** Search engine optimization, keyword research, content strategy, technical SEO, competitive analysis.

**Available tools:**
- Data4SEO API — keyword volumes, difficulty, CPC, SERP features, competitor keywords
- GSC MCP — client's actual search performance (impressions, clicks, CTR, positions by query and page)
- GA4 MCP — organic traffic, top landing pages, conversion data
- GPT-4o-mini — analysis, strategy writing, recommendations
- gog CLI — create Google Sheets (data) and Docs (strategy)

**When to use which tool:**
- Task mentions "keywords" or "SEO research" → Data4SEO for keyword data
- Task mentions a specific client with a domain → GSC + GA4 for real performance data
- Task asks for "strategy" or "recommendations" → GPT-4o-mini to analyze data and write
- Always outputs to Google Drive via gog

**Example outputs:**
- Keyword research sheet (keyword, volume, difficulty, CPC, current ranking)
- Content gap analysis sheet (competitor keywords we don't rank for)
- SEO strategy doc (prioritized recommendations, content calendar)
- Quick wins sheet (keywords ranking #4-20 — easy to push higher)

---

### Agent 2: Apex (PPC Strategist) — WAVE 1

**Expertise:** Paid media strategy, budget allocation, audience targeting, bidding strategy, ad platform management, campaign structure.

**Available tools:**
- SA360 skill — cross-platform PPC data, campaign performance, bid strategies
- Data4SEO API — CPC data, keyword competition for paid
- GPT-4o-mini — strategy, recommendations, budget modeling
- gog CLI — create Sheets (budgets, projections) and Docs (strategy)

**When to use which tool:**
- Task mentions existing campaigns → SA360 for performance data
- Task asks for "budget" or "allocation" → GPT-4o-mini + data for projections
- Task mentions "audiences" or "targeting" → GPT-4o-mini for strategy
- Task asks for "campaign structure" → Sheet with campaign/ad group/keyword hierarchy

**Example outputs:**
- Budget allocation sheet (platform, campaign, budget, projected CPA/ROAS)
- Audience targeting sheet (segment, demographics, interests, custom audiences)
- PPC strategy doc (bidding approach, A/B test plan, scaling plan)
- Campaign structure sheet (campaign names, ad groups, keywords, match types)

---

### Agent 3: Nova (Analytics Strategist) — WAVE 1

**Expertise:** Marketing analytics, measurement frameworks, attribution, KPIs, dashboards, reporting, conversion optimization.

**Available tools:**
- GA4 MCP — traffic, conversions, events, user behavior, funnel data
- GSC MCP — search performance correlation with traffic
- GPT-4o-mini — framework design, KPI selection, analysis
- gog CLI — create Sheets (KPI targets, tracking plans) and Docs (frameworks)

**When to use which tool:**
- Task mentions "KPIs" or "metrics" → GPT-4o-mini for framework + GA4 for baselines
- Task mentions "tracking" or "measurement" → tracking plan with GA4 events
- Task asks for "reporting" → Sheet template with metrics + Doc explaining cadence
- Task mentions a client domain → GA4 for current performance baselines

**Example outputs:**
- KPI dashboard sheet (metric, target, current baseline, source, cadence)
- Measurement framework doc (what to track, how, attribution model)
- Conversion funnel sheet (stage, expected drop-off, optimization notes)
- Reporting template sheet (weekly/monthly report structure)

---

### Agent 4: Echo (Copywriter) — WAVE 2

**Expertise:** Ad copy, headlines, CTAs, email marketing, landing pages, brand voice, persuasion, A/B test copy.

**Available tools:**
- GPT-4o-mini — all copy generation and variation
- gog CLI — create Docs (long-form copy) and Sheets (variation tables)

**Reads from Wave 1:**
- **Vision's keywords** → SEO-optimized headlines, naturally incorporate high-volume terms
- **Apex's audience segments** → tailor copy angles to each audience persona
- **Nova's KPIs** → write CTAs that drive the metrics that matter (conversions, signups, calls)

**When to use which format:**
- Headlines, CTAs, subject lines → Sheet (easy to compare variations side by side)
- Ad copy, landing page, email sequences → Doc (prose needs formatting)
- Mix of both is common

**Example outputs:**
- Headlines & CTAs sheet (5+ headline variations, 5+ CTAs, angle labels)
- Ad copy doc (short/medium/long variations for each platform)
- Email sequence doc (subject lines + body copy for 3-5 email series)
- Landing page copy doc (hero, features, testimonials, CTA sections)

---

### Agent 5: Pixel (Designer / Art Director) — WAVE 2

**Expertise:** Visual design, brand identity, ad creative, layout, color theory, typography, platform-specific specs, image generation.

**Available tools:**
- GPT-4o-mini — creative direction, briefs, specs
- Gemini API (nano-banana-pro) — actual image generation
- gog CLI — create Docs (creative brief) and Sheets (specs)
- Google Drive — store generated images

**Reads from Wave 1:**
- **Vision's keywords** → visual themes aligned with search intent
- **Apex's platform list** → correct ad dimensions for each platform
- **Echo's headlines** (Wave 2 peer) → text overlays for ad creatives

**When to use which tool:**
- Task asks for "creative direction" or "brand" → Doc with visual strategy
- Task asks for "ad creatives" or "images" → Gemini generates actual images
- Task mentions platform specs → Sheet with dimensions, formats, requirements
- Always creates creative brief doc + generates images when task involves visuals

**Example outputs:**
- Creative brief doc (concept, mood, colors hex codes, typography, imagery style)
- Ad specs sheet (platform, dimension, format, file type, max file size)
- Generated ad images (PNG files in Drive — 3+ variations)
- Design system doc (if brand work is requested)

---

### Agent 6: Reel (Video Script Writer) — WAVE 2

**Expertise:** Video scripts, hooks, storytelling, visual direction, music/sound design, talent notes, platform-specific formats.

**Available tools:**
- GPT-4o-mini — script writing, creative direction
- gog CLI — create Docs (scripts)

**Reads from Wave 1:**
- **Vision's keywords** → scripts mention key terms naturally
- **Apex's audience personas** → scripts speak to the right people
- **Echo's copy angles** (Wave 2 peer) → consistent messaging across video + ads

**Example outputs:**
- Video scripts doc (15s, 30s, 60s versions — each with hook, body, CTA)
- Each script includes: dialogue/VO, visual directions per line, music notes
- Storyboard doc (shot-by-shot descriptions for production team)
- Talent/casting notes (if applicable)

---

### Agent 7: Social (Organic Social Strategist) — WAVE 2

**Expertise:** Social media strategy, platform-specific content, community management, content calendars, hashtag strategy, trending formats.

**Available tools:**
- GPT-4o-mini — content creation, strategy, trend analysis
- gog CLI — create Docs (posts, strategy) and Sheets (calendars)

**Reads from Wave 1:**
- **Vision's keywords** → hashtag strategy, SEO-aligned captions
- **Apex's platform recommendations** → focus on the platforms that matter for paid+organic alignment
- **Echo's copy** (Wave 2 peer) → consistent messaging, repurpose ad copy into organic posts
- **Reel's video hooks** (Wave 2 peer) → social captions that tee up the video content

**Example outputs:**
- Social posts doc (platform-specific captions — Instagram, LinkedIn, X, TikTok)
- Content calendar sheet (7-30 day plan with dates, platforms, formats, captions, hashtags)
- Engagement strategy doc (comment templates, community building tactics)
- Hashtag research sheet (hashtags, estimated reach, relevance)

---

## 8. Agent Collaboration Model

Agents don't work in isolation. They work in **waves** — later agents build on earlier agents' output.

### Wave 1: Data & Strategy (run in parallel)
| Agent | Role | Produces |
|-------|------|----------|
| Vision | SEO data + strategy | Keywords, content gaps, search landscape |
| Apex | PPC data + strategy | Budget model, audience segments, platform recommendations |
| Nova | Analytics framework | KPIs, baselines, measurement plan |

Wave 1 agents work from the **task brief + client data only**. They gather real data and set the strategic foundation.

### Wave 2: Creative & Execution (run in parallel, after Wave 1 completes)
| Agent | Role | Uses from Wave 1 |
|-------|------|-------------------|
| Echo | Copywriting | Vision's keywords (for SEO-optimized headlines), Apex's audience (for targeting angles), Nova's KPIs (for performance-driven CTAs) |
| Pixel | Design + images | Echo's headlines (for ad text overlays), Vision's keywords (for visual themes), Apex's platform list (for size specs) |
| Reel | Video scripts | Echo's copy angles, Vision's keywords, Apex's audience personas |
| Social | Social media | Echo's copy, Pixel's visual direction, Reel's video hooks, Vision's keywords (for hashtags) |

### How It Works

```
Task Created (brief + client)
        │
        ▼
┌───────────────────────────┐
│  WAVE 1 (parallel)        │
│  Vision + Apex + Nova     │
│  ~10-15 min               │
└───────────┬───────────────┘
            │
   Wave 1 outputs collected
   (keyword data, budgets, KPIs)
            │
            ▼
┌───────────────────────────┐
│  WAVE 2 (parallel)        │
│  Echo + Pixel + Reel +    │
│  Social                   │
│                           │
│  Each agent receives:     │
│  · Original task brief    │
│  · Client data            │
│  · ALL Wave 1 outputs     │
│  ~15-30 min               │
└───────────┬───────────────┘
            │
            ▼
   All deliverables in Drive
   Status → complete
   Dashboard shows everything
```

### Agent Visibility Rules
- Every agent can **read** every other agent's output for the same task
- Wave 2 agents **must** read Wave 1 outputs before starting (passed as context)
- Agents **reference** each other's work explicitly: "Based on Vision's keyword data, targeting 'forex trading' (8.1K monthly volume)..."
- The dashboard shows all outputs in one view — humans and agents see the same workspace

### Why Waves Matter
Without waves, Echo writes generic headlines. With waves, Echo writes "Stop Losing Money on Bad Forex Trades" because Vision found "forex trading" has 8.1K monthly searches and the client ranks #14 for it (from GSC data). That's the difference between AI-generated filler and useful output.

---

## 9. Build Phases

### Phase 1: Foundation
**Goal:** Database correct, Drive folder structure works, basic task flow works.
**Deliverables:**
- [ ] New SQL migration matching schema in Section 6
- [ ] Run migration in Supabase
- [ ] Create "Mission Control Output" folder in Google Drive
- [ ] Test: create client + create task via dashboard → data saves correctly
- [ ] Update Vercel dashboard to show new schema (agent_runs instead of deliverables/comments)

**Time:** 1 day

---

### Phase 2: Agent Orchestrator (Wave System)
**Goal:** Cora (Mac mini) picks up tasks from Supabase and runs agents in waves.
**Deliverables:**
- [ ] OpenClaw cron job that polls Supabase for `pending` tasks every 5 min
- [ ] Orchestrator script with wave execution:
  1. Read task + client data from Supabase
  2. Create Drive folder structure (`Task Name - Date / Agent Name /`)
  3. **Wave 1:** Spawn Vision + Apex + Nova in parallel
  4. Wait for all Wave 1 agents to complete
  5. Collect Wave 1 outputs (read their Drive files + summaries)
  6. **Wave 2:** Spawn Echo + Pixel + Reel + Social in parallel, passing Wave 1 outputs as context
  7. Wait for Wave 2 to complete
  8. Update task status → `complete`
  9. Send notification (Telegram)
- [ ] Each agent is a separate script/function with its own system prompt
- [ ] Agents use gog CLI to create Google Docs/Sheets in their subfolder
- [ ] Agents write status + file links + output summary back to Supabase (agent_runs table)
- [ ] Output summary is structured so other agents can consume it (not just free text)
- [ ] Remove Vercel `/api/run-agents` route and vercel.json cron

**Time:** 2 days

---

### Phase 3: Vision Agent (First Real Agent)
**Goal:** Vision agent fully working end-to-end with real data.
**Deliverables:**
- [ ] Vision pulls keywords from Data4SEO
- [ ] Vision pulls GSC data for client domain (if available)
- [ ] Vision pulls GA4 data for client domain (if available)
- [ ] GPT-4o-mini analyzes combined data
- [ ] Creates Google Sheet(s) + Doc(s) in Vision subfolder
- [ ] Links appear in dashboard
- [ ] Test with real campaign brief

**Time:** 1 day

---

### Phase 4: Remaining Agents (6 agents)
**Goal:** All agents working end-to-end.

Build in order of complexity (simplest first):
1. **Echo** (copywriter) — GPT-4o-mini only, no APIs → 2 hours
2. **Reel** (video scripts) — GPT-4o-mini only → 2 hours
3. **Social** (social media) — GPT-4o-mini only → 2 hours
4. **Nova** (analytics) — GPT-4o-mini + GA4/GSC data → 3 hours
5. **Apex** (PPC) — GPT-4o-mini + SA360 + Data4SEO → 3 hours
6. **Pixel** (design + images) — GPT-4o-mini + Gemini image gen → 3 hours

**Time:** 2 days

---

### Phase 5: Dashboard Updates
**Goal:** Dashboard properly shows agent progress and deliverable links.
**Deliverables:**
- [ ] Task detail page shows agent_runs with status per agent
- [ ] Clickable links to Google Drive files
- [ ] Progress bar (X of 7 agents complete)
- [ ] Approval buttons (approve task / request revision)
- [ ] Mobile responsive

**Time:** 1 day

---

### Phase 6: Polish & Production
**Goal:** Reliable daily use.
**Deliverables:**
- [ ] Error handling + retry failed agents
- [ ] Agent timeout handling (kill after 5 min)
- [ ] Notification when task is complete (Telegram message)
- [ ] Clients page: add `domain` field for GSC/GA4 lookups
- [ ] Better task creation form (templates for common campaign types)
- [ ] Daily log: what agents ran, success/failure, cost tracking

**Time:** 1 day

---

## 9. Success Criteria

- [ ] Create a task → all 7 agents produce real output in Google Drive within 60 min
- [ ] Vision uses real keyword data (not AI-generated guesses)
- [ ] Echo produces copy you'd actually use (not generic)
- [ ] Pixel generates real ad images
- [ ] All deliverables accessible via links in dashboard
- [ ] Works reliably 5 days/week without manual intervention

## 10. Cost Estimate

**Per task (7 agents):**
- GPT-4o-mini: ~7 calls × $0.002 = $0.014
- Data4SEO: ~$0.01 per keyword batch
- Gemini image gen: ~$0.03 for 3 images
- Google API: free
- **Total: ~$0.05-0.10 per task**

**Monthly (20 tasks/month):**
- API costs: ~$1-2/month
- Vercel Pro: $20/month
- Supabase: free tier
- **Total: ~$22/month**

## 11. Timeline

| Phase | What | Time | Depends On |
|-------|------|------|------------|
| 1 | Foundation (DB + Drive) | 1 day | Nothing |
| 2 | Agent Orchestrator | 2 days | Phase 1 |
| 3 | Vision (first agent) | 1 day | Phase 2 |
| 4 | Remaining 6 agents | 2 days | Phase 3 |
| 5 | Dashboard updates | 1 day | Phase 4 |
| 6 | Polish | 1 day | Phase 5 |
| **Total** | **End-to-end working system** | **8 days** | |

## 12. Skills Integration

Agents don't make raw GPT calls for everything. They leverage existing battle-tested skills when available. Skills are added incrementally — not all at once.

### Phase 3-4 (Core skills — use from day one)
| Agent | Skill | What It Gives |
|-------|-------|---------------|
| Vision | Data4SEO cron script | Real keyword volumes, difficulty, CPC |
| Vision | GSC MCP | Real search console data per domain |
| Vision | GA4 MCP | Real traffic + conversion data |
| Apex | google-ads-strategy | Campaign structure frameworks |
| Apex | sa360-ppc-manager | Cross-platform PPC management |
| Echo | ogilvy-marketing-system | Copy psychology + frameworks |
| Echo | rsa-ad-writer | Google Ads RSA best practices |
| Pixel | nano-banana-pro | Image generation (Gemini) |
| Pixel | marketing-asset-generator | Platform-specific creatives with brand files |
| ALL | Brand management system (`~/workspace/brands/`) | Client logos, colors, tone, guidelines |

### Phase 6+ (Add later — don't overload)
| Agent | Skill | What It Adds |
|-------|-------|--------------|
| Echo | meta-ads-copy-generator | Meta-specific ad copy + reel scripts |
| Echo | display-ads-copy-generator | Display ad copy variations |
| Echo | landing-page-copy-generator | Full landing page copy |
| Apex | Data4SEO | CPC data for paid keyword strategy |
| Reel | Video tools (TBD) | Beyond script writing — production aids |
| Social | Trend analysis tools (TBD) | Real social data when available |
| Nova | GTM MCP | Tracking audit + tag management |

Skills are additive. Each phase we can plug in more without rebuilding.

## 13. Structured Output (Wave 1 → Wave 2 Handoff)

Wave 1 agents produce two outputs:
1. **Human-readable files** in Google Drive (Sheets, Docs)
2. **Machine-readable JSON summary** in Supabase (`agent_runs.output_data`)

This lets Wave 2 agents consume Wave 1 data programmatically.

### Example: Vision's output_data
```json
{
  "keywords": [
    {"term": "forex trading", "volume": 8100, "difficulty": 72, "cpc": 3.20, "current_rank": 14},
    {"term": "best forex broker", "volume": 6200, "difficulty": 65, "cpc": 5.80, "current_rank": null}
  ],
  "content_gaps": ["demo account guide", "forex for beginners tutorial"],
  "quick_wins": [{"term": "forex trading", "current_rank": 14, "opportunity": "high"}],
  "top_competitors": ["investopedia.com", "babypips.com"]
}
```

Echo reads this and writes headlines targeting "forex trading" (8.1K volume, currently #14).

### Example: Apex's output_data
```json
{
  "total_budget": 10000,
  "platforms": [
    {"name": "Google Ads", "budget": 4000, "cpc": 1.20, "projected_cpa": 25},
    {"name": "Meta", "budget": 4000, "cpl": 8, "audience_size": 2400000},
    {"name": "LinkedIn", "budget": 2000, "cpc": 5.50}
  ],
  "audiences": [
    {"name": "Active traders", "demographics": "25-45, male-skew", "interests": ["investing", "trading"]},
    {"name": "Beginners", "demographics": "22-35", "interests": ["personal finance", "side hustle"]}
  ]
}
```

Echo reads audiences → writes copy angles for "active traders" vs "beginners."
Pixel reads platforms → creates ads at correct dimensions.

## 14. Task Creation from Telegram

Users shouldn't have to open the dashboard for every task.

**Telegram flow:**
1. Renzo sends: "Create campaign: Q2 GCG Forex — target new traders, $10K budget, focus on demo signups"
2. Cora creates task in Supabase (status: pending)
3. Cora confirms: "Task created: Q2 GCG Forex. Agents starting in ~5 min."
4. Agents run
5. Cora sends notification when complete with links to Drive folder

Dashboard is for **viewing, managing, and approving** — not the only way to create tasks.

## 15. Partial Failure Handling

If a Wave 1 agent fails, Wave 2 still runs with whatever data is available.

| Scenario | What Happens |
|----------|-------------|
| Vision fails, Apex + Nova succeed | Wave 2 runs without keyword data. Echo writes copy based on brief only. |
| All Wave 1 fails | Wave 2 runs with task brief + client data only (still useful, just not data-enriched). |
| A Wave 2 agent fails | Other Wave 2 agents unaffected. Failed agent marked as `error` in dashboard. |
| All agents fail | Task marked `error`. Notification sent. Manual retry available. |

Failed agents show error in dashboard with retry button. Never blocks the whole pipeline.

## 16. Build Philosophy

**Phases are additive.** Each phase produces a working system. If we stop at any phase, what's built still works.

- Phase 1: Dashboard + DB work → you can manage tasks and clients
- Phase 2: Orchestrator works → tasks get picked up automatically
- Phase 3: Vision works → you get real SEO data on every task
- Phase 4: All agents work → full campaign output
- Phase 5: Dashboard shows everything → clean review experience
- Phase 6: Polish → daily reliable use

**Don't overload the system.** Add skills and capabilities one at a time. Test each agent thoroughly before adding the next. Quality over speed.

---

## 17. What's NOT in Scope (v1)

- Client-facing portal
- Automated publishing (posting to Meta/Google/social)
- Real-time collaboration (comments between agents)
- Version control on deliverables
- Integration with ClickUp or other PM tools
- GHL integration
- Multi-language support

These are Phase 7+ features. Ship v1 first.

---

*Last updated: Feb 23, 2026*
*Author: Cora*
*Status: DRAFT — Awaiting Renzo's approval*
