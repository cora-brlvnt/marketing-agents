import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function orchestratePixelAgent(task: any) {
  const design = {
    images: [
      { concept: "Trader at desk with upward chart", dimensions: "1200x628" },
      { concept: "Mobile phone showing gains", dimensions: "1200x628" },
    ],
  };

  await supabase.from("task_comments").insert([
    {
      task_id: task.id,
      agent_name: "Pixel",
      comment: "Design concepts ready",
      deliverable: design,
    },
  ]);

  await supabase.from("deliverables").insert([
    {
      task_id: task.id,
      agent_name: "Pixel",
      deliverable_type: "images",
      content: JSON.stringify(design),
      status: "final",
      quality_score: 8,
    },
  ]);

  console.log(`[Pixel] ✅ Complete`);
}
