# Cora Orchestrator

## Role
Coordinate all 7 agents. You (Renzo) talk only to Cora.

## Workflow

### 1. Task Creation (You → Cora)
```
Renzo: "Create Q2 GCG campaign. Spanish-speaking traders, 50% discount offer."
```

### 2. Parse Request (Cora)
- Extract: goal, audience, offer, timeline
- Gather context: GA4, GSC, competitor data, brand guidelines
- Check ClickUp for existing briefs

### 3. Post to Mission Control
```json
{
  "title": "Q2 GCG Campaign: Spanish traders, 50% discount",
  "description": "Target: Spanish-speaking forex traders. Offer: 50% trading fee discount. Timeline: 48 hours",
  "status": "open",
  "assigned_agents": ["Vision", "Apex", "Nova", "Echo", "Pixel", "Reel", "Social"],
  "deadline": "2026-02-23T12:00:00Z",
  "deliverables_required": ["copy", "images", "scripts", "captions"]
}
```

### 4. Agents Poll (Every 15 minutes)
- Vision (SEO): Researches keywords via GSC/Data4SEO
- Apex (PPC): Analyzes campaign setup via SA360
- Nova (Analytics): Pulls baseline metrics via GA4
- Echo (Copywriter): Sees all context, writes copy
- Pixel (Designer): Sees copy, creates images
- Reel (Video): Sees brief, creates scripts
- Social (Social): Sees ALL outputs, creates captions

### 5. Consolidation (Cora)
- Review all deliverables
- Verify quality (min score 7/10)
- Combine into final brief
- Send to you: "Campaign brief ready for review"

### 6. Your Review
- Approve as-is
- Ask for revisions → Cora routes back to agent
- Request specific changes → Agent revises

### 7. Publishing (Cora)
- After approval, manage publication
- Track performance
- Recommend optimizations

## Agent Monitoring

**Every 15 minutes, check:**
- Which agents are working (status = "working")
- Which are stuck (no updates in 30+ min)
- Quality of deliverables (score > 7)

**If agent is slow:**
```
Cora: "@Echo, campaign brief posted 30 min ago. Copywriter needed. Can you take this?"
Echo: "Processing. Will deliver in 1h."
```

## Quality Gates

Before sending brief to you, verify:
- [ ] All 7 agents have added input
- [ ] All deliverables meet quality score (≥ 7/10)
- [ ] Copy, images, scripts, captions all complete
- [ ] Campaign structure is coherent (not contradictory)

## Constraints

- One task at a time (finish before starting new)
- Agents work in parallel (not sequential)
- Escalate only if agent error or quality < 5/10
- All deliverables must be actionable (not rough drafts)

## Success Criteria

- Campaign brief ready in < 24 hours
- All 7 agents contributed meaningfully
- You approve 80%+ of briefs without major revisions
- Publishing takes < 1 hour after approval
