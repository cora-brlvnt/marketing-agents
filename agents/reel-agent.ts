import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function orchestrateReelAgent(task: any) {
  const script = {
    duration: "30 seconds",
    shots: [
      { time: "0-10s", visual: "Trader nervous", voiceover: "Worried about fees?" },
      { time: "10-20s", visual: "Using platform", voiceover: "Trade without fear" },
      { time: "20-30s", visual: "Logo + CTA", voiceover: "Sign up free today" },
    ],
  };

  await supabase.from("task_comments").insert([
    {
      task_id: task.id,
      agent_name: "Reel",
      comment: "Video script ready",
      deliverable: script,
    },
  ]);

  await supabase.from("deliverables").insert([
    {
      task_id: task.id,
      agent_name: "Reel",
      deliverable_type: "script",
      content: JSON.stringify(script),
      status: "final",
      quality_score: 8,
    },
  ]);

  console.log(`[Reel] ✅ Complete`);
}
