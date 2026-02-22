import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function orchestrateEchoAgent(task: any) {
  const copy = {
    headlines: [
      { variant: "Trade with confidence. Save 50% on fees." },
      { variant: "Start trading smarter. Limited-time 50% discount." },
    ],
    body_copy: "Trade forex without fear. Cut your fees in half.",
    ctas: [{ text: "Start free trial" }, { text: "Claim 50% discount" }],
  };

  await supabase.from("task_comments").insert([
    {
      task_id: task.id,
      agent_name: "Echo",
      comment: "Copy written",
      deliverable: copy,
    },
  ]);

  await supabase.from("deliverables").insert([
    {
      task_id: task.id,
      agent_name: "Echo",
      deliverable_type: "copy",
      content: JSON.stringify(copy),
      status: "final",
      quality_score: 8,
    },
  ]);

  console.log(`[Echo] ✅ Complete`);
}
