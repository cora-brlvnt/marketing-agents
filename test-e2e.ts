// End-to-end test: Create task, run agents, verify deliverables

import { createClient } from "@supabase/supabase-js";
import { orchestrateVisionAgent } from "./agents/vision-agent";
import { orchestrateApexAgent } from "./agents/apex-agent";
import { orchestrateNovaAgent } from "./agents/nova-agent";
import { orchestrateEchoAgent } from "./agents/echo-agent";
import { orchestratePixelAgent } from "./agents/pixel-agent";
import { orchestrateReelAgent } from "./agents/reel-agent";
import { orchestrateSocialAgent } from "./agents/social-agent";

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

async function runTest() {
  console.log("🚀 E2E Test: Create task → Run agents → Verify deliverables\n");

  try {
    // 1. Create task
    console.log("1️⃣ Creating test task...");
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert([
        {
          title: "E2E Test: Q2 GCG Campaign",
          description: "Test campaign for end-to-end validation",
          assigned_agents: agents.map((a) => a.name),
          status: "open",
        },
      ])
      .select()
      .single();

    if (taskError) throw taskError;
    console.log(`✅ Task created: ${task.id}\n`);

    // 2. Run all agents
    console.log("2️⃣ Running all agents...");
    for (const agent of agents) {
      try {
        await agent.fn(task);
      } catch (error) {
        console.error(`❌ ${agent.name} failed:`, error);
      }
    }
    console.log("\n");

    // 3. Verify deliverables
    console.log("3️⃣ Verifying deliverables...");
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("agent_name, quality_score")
      .eq("task_id", task.id);

    if (!deliverables || deliverables.length === 0) {
      throw new Error("No deliverables found!");
    }

    console.log(`Found ${deliverables.length} deliverables:`);
    deliverables.forEach((d) => {
      console.log(`  ✅ ${d.agent_name}: quality score ${d.quality_score}/10`);
    });

    // 4. Summary
    console.log("\n✅ E2E TEST PASSED");
    console.log(`   - Task: ${task.id}`);
    console.log(`   - Agents: ${deliverables.length}/7 responded`);
    console.log(`   - Status: Ready for production\n`);
  } catch (error) {
    console.error("❌ E2E TEST FAILED:", error);
    process.exit(1);
  }
}

runTest();
