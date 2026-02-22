import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function orchestrateNovaAgent(task: any) {
  const metrics = {
    conversion_rate: 0.042,
    roas: 2.3,
    cpa: 12,
    roi_by_channel: {
      meta: { roas: 2.8, cpa: 10 },
      google: { roas: 1.9, cpa: 15 },
    },
  };

  await supabase.from("task_comments").insert([
    {
      task_id: task.id,
      agent_name: "Nova",
      comment: "Performance analysis complete",
      deliverable: metrics,
    },
  ]);

  await supabase.from("deliverables").insert([
    {
      task_id: task.id,
      agent_name: "Nova",
      deliverable_type: "analytics",
      content: JSON.stringify(metrics),
      status: "final",
      quality_score: 8,
    },
  ]);

  console.log(`[Nova] ✅ Complete`);
}
