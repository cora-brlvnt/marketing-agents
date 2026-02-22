-- Mission Control Database Schema
-- Created: Feb 21, 2026

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, ready_for_review, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deadline TIMESTAMP,
  assigned_agents TEXT[] DEFAULT '{}',
  deliverables_required TEXT[] DEFAULT '{}',
  priority INT DEFAULT 3
);

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  comment TEXT,
  deliverable JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  deliverable_type TEXT, -- headline, body_copy, email, image, script, caption
  content TEXT,
  status TEXT DEFAULT 'draft', -- draft, approved, final
  quality_score INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT UNIQUE NOT NULL,
  last_poll TIMESTAMP,
  status TEXT DEFAULT 'idle', -- idle, working, error
  current_task_id UUID REFERENCES tasks(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_agent ON task_comments(agent_name);
CREATE INDEX idx_deliverables_task_id ON deliverables(task_id);
CREATE INDEX idx_deliverables_agent ON deliverables(agent_name);
CREATE INDEX idx_agent_status_name ON agent_status(agent_name);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for MVP)
CREATE POLICY "Allow all tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all comments" ON task_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deliverables" ON deliverables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all agent status" ON agent_status FOR ALL USING (true) WITH CHECK (true);
