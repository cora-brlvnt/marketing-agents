# Marketing Agent Team — Phase 1 Build

**Status:** IN BUILD (Feb 21, 2026)  
**Deadline:** Production by Feb 28, 2026  
**Orchestrator:** Cora  
**Agents:** 7 specialists

## What's Built

### ✅ Supabase Schema
- `tasks` table (campaign briefs)
- `task_comments` table (agent responses)
- `deliverables` table (outputs)
- `agent_status` table (polling tracking)
- RLS policies + indexes

### ✅ 7 Agent Prompts (Complete)
1. **Vision** (SEO) — Keyword research, gap analysis, quick wins
2. **Apex** (PPC) — Bid strategy, budget allocation, audience targeting
3. **Nova** (Analytics) — Performance tracking, ROI, insights
4. **Echo** (Copywriter) — Headlines, body copy, CTAs, sequences
5. **Pixel** (Designer) — Images, thumbnails, layouts
6. **Reel** (Video) — Scripts, production notes, thumbnails
7. **Social** (Organic) — Platform-specific captions (IG, Twitter, LinkedIn, TikTok)

### ✅ Cora Orchestrator Role
- Task creation (from you → Cora)
- Task posting to Mission Control
- Agent polling coordination
- Quality gate management
- Consolidation & briefing
- Publishing oversight

### ✅ Orchestration Logic (TypeScript)
- createTask()
- updateAgentStatus()
- getTasksForAgent()
- addComment()
- checkTaskCompletion()
- orchestrateTask() (main loop)

## What's Next

### Phase 1 Build (Feb 21-28)

**Feb 21-22 (Tonight):**
- [ ] Deploy Supabase migrations
- [ ] Verify schema created
- [ ] Set up authentication

**Feb 23-25 (Mon-Wed, post-Rome):**
- [ ] Build Mission Control Dashboard (React)
- [ ] Wire agents to Supabase
- [ ] Implement agent polling logic

**Feb 26-27 (Thu-Fri):**
- [ ] Test with GCG Q2 campaign (internal test)
- [ ] Verify all 7 agents responding
- [ ] Quality gate testing

**Feb 28:**
- [ ] Production deployment
- [ ] Ready for first live campaign

## Architecture

```
YOU → CORA (Orchestrator)
         ↓
   Mission Control Dashboard (Supabase + React)
         ↓
   AGENTS (Parallel polling every 15 min)
   ├─ Vision (SEO)
   ├─ Apex (PPC)
   ├─ Nova (Analytics)
   ├─ Echo (Copywriter)
   ├─ Pixel (Designer)
   ├─ Reel (Video)
   └─ Social (Social)
         ↓
   CORA (Consolidation)
         ↓
   Final Brief → You → Approval → Publishing
```

## How It Works (Example)

**You:** "Create Q2 GCG campaign"

**Cora:** 
1. Posts to Mission Control
2. Notifies all 7 agents
3. Agents poll every 15 min
4. Vision analyzes keywords → adds comment
5. Apex analyzes campaigns → adds comment
6. Nova pulls metrics → adds comment
7. Echo sees all context → writes copy
8. Pixel creates images
9. Reel creates scripts
10. Social creates captions

**All in parallel (not sequential)**

**Cora:** "Campaign brief ready"

**You:** Approve → Publish

## Files

```
/supabase/migrations/001_create_mission_control.sql — Schema
/agents/
  ├─ vision-seo-agent.md
  ├─ apex-ppc-agent.md
  ├─ nova-analytics-agent.md
  ├─ echo-copywriter-agent.md
  ├─ pixel-designer-agent.md
  ├─ reel-video-agent.md
  └─ social-organic-agent.md
/orchestrator/
  ├─ cora-orchestrator.md — Role definition
  └─ orchestration-logic.ts — Core functions
/README.md — This file
```

## Timeline

- **Feb 21:** ✅ Complete (schema, agents, orchestrator)
- **Feb 23-25:** Build dashboard + agent logic
- **Feb 26-27:** Test with GCG campaign
- **Feb 28:** 🚀 Production deployment

## Next Steps

1. Deploy Supabase schema
2. Build Mission Control dashboard (React)
3. Integrate agents with Supabase
4. Run first test campaign
5. Go live

---

**Status:** Phase 1 build in progress. Ready to deploy schema and start dashboard build.
