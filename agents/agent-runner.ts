// Agent Runner - Main polling loop for all agents

import { createClient } from "@supabase/supabase-js";
import { orchestrateVisionAgent } from "./vision-agent";
import { orchestrateApexAgent } from "./apex-agent";
import { orchestrateNovaAgent } from "./nova-agent";
import { orchestrateEchoAgent } from "./echo-agent";
import { orchestratePixelAgent } from "./pixel-agent";
import { orchestrateReelAgent } from "./reel-agent";
import { orchestrateSocialAgent } from "./social-agent";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const agents = [
  { name: "Vision", fn: orchestrateVisionAgent },
  { name: "Apex", fn: orchestrateApexAgent },
  { name: "Nova", fn: orchestrateNovaAgent },
  { name: "Echo", fn: orchestrateEchoAgent },
  { name: "Pixel", fn: orchestratePixelAgent },
  { name: "Reel", fn: orchestrateReelAgent },
  { name: "Social", fn: orchestrateSocialAgent },
];

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

async function pollAgents() {
  console.log(`🔄 [${new Date().toISOString()}] Polling agents...`);

  for (const agent of agents) {
    try {
      // Update agent status to working
      await supabase
        .from("agent_status")
        .upsert(
          {
            agent_name: agent.name,
            status: "working",
            last_poll: new Date().toISOString(),
          },
          { onConflict: "agent_name" }
        );

      // Get tasks for this agent
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .contains("assigned_agents", [agent.name])
        .eq("status", "open");

      if (tasks && tasks.length > 0) {
        console.log(`👁️ ${agent.name}: Found ${tasks.length} task(s)`);

        for (const task of tasks) {
          try {
            // Run agent-specific logic
            await agent.fn(task);
            console.log(`✅ ${agent.name}: Completed task ${task.id}`);
          } catch (error) {
            console.error(`❌ ${agent.name}: Error on task ${task.id}:`, error);

            // Update agent status to error
            await supabase
              .from("agent_status")
              .update({ status: "error" })
              .eq("agent_name", agent.name);
          }
        }
      } else {
        console.log(`⏳ ${agent.name}: No tasks`);
      }

      // Update agent status to idle
      await supabase
        .from("agent_status")
        .update({ status: "idle", last_poll: new Date().toISOString() })
        .eq("agent_name", agent.name);
    } catch (error) {
      console.error(`❌ ${agent.name}: Fatal error:`, error);
    }
  }

  console.log(`✅ Poll cycle complete\n`);
}

// Start polling
export function startAgentPolling() {
  console.log("🚀 Agent polling started (15 min intervals)");

  // First poll immediately
  pollAgents();

  // Then every 15 minutes
  setInterval(pollAgents, POLL_INTERVAL);
}

// For local testing
if (require.main === module) {
  startAgentPolling();
}
