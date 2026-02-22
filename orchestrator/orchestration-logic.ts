// Cora Orchestrator - Core Logic

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

interface Task {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "ready_for_review" | "completed";
  assigned_agents: string[];
  deliverables_required: string[];
  deadline: string;
  created_at: string;
}

interface TaskComment {
  id: string;
  task_id: string;
  agent_name: string;
  comment: string;
  deliverable: any;
  created_at: string;
}

// 1. Create Task
export async function createTask(
  title: string,
  description: string,
  assigned_agents: string[],
  deliverables_required: string[],
  deadline: string
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        title,
        description,
        assigned_agents,
        deliverables_required,
        deadline,
        status: "open",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 2. Update Agent Status
export async function updateAgentStatus(
  agent_name: string,
  status: "idle" | "working" | "error",
  current_task_id?: string
) {
  const { data, error } = await supabase
    .from("agent_status")
    .upsert(
      {
        agent_name,
        status,
        current_task_id,
        last_poll: new Date().toISOString(),
      },
      { onConflict: "agent_name" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 3. Get Tasks for Agent
export async function getTasksForAgent(agent_name: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .contains("assigned_agents", [agent_name])
    .eq("status", "open");

  if (error) throw error;
  return data || [];
}

// 4. Add Comment (Agent Response)
export async function addComment(
  task_id: string,
  agent_name: string,
  comment: string,
  deliverable?: any
) {
  const { data, error } = await supabase
    .from("task_comments")
    .insert([{ task_id, agent_name, comment, deliverable }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 5. Check Task Completion
export async function checkTaskCompletion(task_id: string): Promise<{
  all_agents_responded: boolean;
  quality_ok: boolean;
  missing_agents: string[];
}> {
  // Get task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", task_id)
    .single();

  if (taskError) throw taskError;

  // Get all comments for this task
  const { data: comments, error: commentsError } = await supabase
    .from("task_comments")
    .select("agent_name")
    .eq("task_id", task_id);

  if (commentsError) throw commentsError;

  // Check which agents responded
  const responding_agents = new Set(comments?.map((c) => c.agent_name) || []);
  const missing_agents = task.assigned_agents.filter(
    (a: string) => !responding_agents.has(a)
  );

  // Check deliverable quality
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("quality_score")
    .eq("task_id", task_id);

  const quality_ok =
    (deliverables?.length || 0) > 0 &&
    deliverables!.every((d) => d.quality_score >= 7);

  return {
    all_agents_responded: missing_agents.length === 0,
    quality_ok,
    missing_agents,
  };
}

// 6. Get Task Comments (for consolidation)
export async function getTaskComments(task_id: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", task_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// 7. Get Deliverables
export async function getDeliverables(task_id: string) {
  const { data, error } = await supabase
    .from("deliverables")
    .select("*")
    .eq("task_id", task_id)
    .order("agent_name");

  if (error) throw error;
  return data || [];
}

// 8. Update Task Status
export async function updateTaskStatus(
  task_id: string,
  status: "open" | "in_progress" | "ready_for_review" | "completed"
) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", task_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 9. Main Orchestration Loop (Cora runs this)
export async function orchestrateTask(task_id: string) {
  console.log(`🎯 Orchestrating task ${task_id}`);

  // 1. Mark as in_progress
  await updateTaskStatus(task_id, "in_progress");

  // 2. Get task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", task_id)
    .single();

  // 3. Loop: Check every 15 min until all agents respond
  let polling = true;
  let poll_count = 0;
  const max_polls = 96; // 24 hours

  while (polling && poll_count < max_polls) {
    poll_count++;
    console.log(`📋 Poll #${poll_count}: Checking agent responses...`);

    const completion = await checkTaskCompletion(task_id);

    if (completion.all_agents_responded && completion.quality_ok) {
      console.log("✅ All agents responded, quality approved!");
      polling = false;
    } else {
      console.log(
        `⏳ Waiting for: ${completion.missing_agents.join(", ")}`
      );
      // Wait 15 minutes
      await new Promise((resolve) => setTimeout(resolve, 15 * 60 * 1000));
    }
  }

  // 4. Consolidate deliverables
  const comments = await getTaskComments(task_id);
  const deliverables = await getDeliverables(task_id);

  // 5. Mark as ready_for_review
  await updateTaskStatus(task_id, "ready_for_review");

  console.log("✅ Task ready for review");
  return {
    task,
    comments,
    deliverables,
    status: "ready_for_review",
  };
}

// Agent Template (what each agent runs)
export async function agentPollLoop(agent_name: string) {
  console.log(`👁️ ${agent_name} agent polling...`);

  const tasks = await getTasksForAgent(agent_name);

  for (const task of tasks) {
    console.log(`📝 Working on: ${task.title}`);

    // TODO: Each agent implements their specific logic here
    // Vision: fetch GSC/GA4 data
    // Apex: fetch SA360 data
    // etc.

    // For now, just add a placeholder comment
    await addComment(task.id, agent_name, `${agent_name} processed this task`);
    await updateAgentStatus(agent_name, "idle");
  }
}
