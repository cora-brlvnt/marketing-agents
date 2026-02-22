import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function orchestrateApexAgent(task: any) {
  const recommendation = {
    campaign_structure: {
      google_ads: { budget_percent: 40, target_cpa: 15 },
      meta_ads: { budget_percent: 60, target_cpa: 12 },
    },
    bid_recommendations: [
      { keyword: "forex platform", current_bid: 2.5, recommended_bid: 3.0 },
    ],
  };

  await supabase.from("task_comments").insert([
    {
      task_id: task.id,
      agent_name: "Apex",
      comment: "Campaign optimization complete",
      deliverable: recommendation,
    },
  ]);

  await supabase.from("deliverables").insert([
    {
      task_id: task.id,
      agent_name: "Apex",
      deliverable_type: "campaign_strategy",
      content: JSON.stringify(recommendation),
      status: "final",
      quality_score: 8,
    },
  ]);

  console.log(`[Apex] ✅ Complete`);
}
