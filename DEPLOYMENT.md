# Phase 1 Deployment Guide

## Status: READY FOR DEPLOYMENT ✅

All 7 agents implemented and tested locally.

## Quick Start

### 1. Deploy Supabase Schema

```bash
# Connect to Supabase and run:
psql "postgresql://postgres@db.oucpashabmqeninqghhv.supabase.co/postgres"

# Copy and paste the contents of:
cat supabase/migrations/001_create_mission_control.sql
```

### 2. Run E2E Test (Local)

```bash
npm install
SUPABASE_URL=https://oucpashabmqeninqghhv.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<your-key> \
npm test
```

Expected output:
```
✅ E2E TEST PASSED
   - Task: [uuid]
   - Agents: 7/7 responded
   - Status: Ready for production
```

### 3. Deploy Dashboard to Railway

```bash
# Install Railway CLI: https://railway.app/cli

# Deploy
railway up --name marketing-agents-dashboard
```

### 4. Deploy Agent Runner to Railway

```bash
# Set environment variables
railway link
railway variables

# Add:
SUPABASE_URL=https://oucpashabmqeninqghhv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-key>

# Deploy
railway up --name marketing-agents-runner
```

## What's Deployed

✅ **Supabase Schema** (4 tables)
- tasks
- task_comments
- deliverables
- agent_status

✅ **7 Agents** (All implemented)
- Vision (SEO)
- Apex (PPC)
- Nova (Analytics)
- Echo (Copywriter)
- Pixel (Designer)
- Reel (Video)
- Social (Organic)

✅ **Mission Control Dashboard** (React)
- Create campaigns
- View agent status
- Monitor deliverables

✅ **Agent Runner** (Polling loop)
- Runs every 15 minutes
- Executes all agents in parallel
- Creates deliverables automatically

## Testing

### Local Test
```bash
npm test
```

### Production Test (after deployment)
1. Go to Mission Control dashboard
2. Click "Create Campaign"
3. Enter: "Production Test Campaign"
4. Click "Create"
5. Wait 1 minute
6. Verify all 7 agents responded with deliverables

## Monitoring

Check agent status:
```
SELECT agent_name, status, last_poll FROM agent_status;
```

Check task progress:
```
SELECT id, title, status, (SELECT COUNT(*) FROM deliverables WHERE task_id = tasks.id) as deliverable_count FROM tasks;
```

## Rollback

If needed, drop all tables:
```sql
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS agent_status CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
```

---

**Timeline:**
- Schema: 10 minutes
- Dashboard deploy: 5 minutes
- Agent runner deploy: 5 minutes
- E2E test: 2 minutes
- **Total: ~22 minutes**

**Status:** Ready to ship. 🚀
