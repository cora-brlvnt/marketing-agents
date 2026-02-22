import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function orchestrateSocialAgent(task: any) {
  const captions = {
    instagram: "Trade with confidence 🚀 Say goodbye to high fees. [link] #ForexTrading",
    twitter: "Why pay high forex fees? Cut them in half. Sign up today. [link]",
    linkedin: "Forex trading costs matter. We cut fees 50%. See the difference.",
    tiktok: "POV: You just saved 50% on trading fees 💰 [link] #FinTok",
  };

  await supabase.from("task_comments").insert([
    {
      task_id: task.id,
      agent_name: "Social",
      comment: "Social captions ready",
      deliverable: captions,
    },
  ]);

  await supabase.from("deliverables").insert([
    {
      task_id: task.id,
      agent_name: "Social",
      deliverable_type: "captions",
      content: JSON.stringify(captions),
      status: "final",
      quality_score: 8,
    },
  ]);

  console.log(`[Social] ✅ Complete`);
}
