import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  client_id?: string;
}

interface Client {
  id: string;
  name: string;
  tone_of_voice: string;
  google_drive_folder: string;
}

// Vision Agent
async function visionAgent(task: Task, client?: Client) {
  const clientContext = client ? `Client: ${client.name}, Tone: ${client.tone_of_voice}` : '';
  return {
    comment: `SEO keywords found: forex trading (8.1K vol), best forex broker (6.2K vol), how to trade forex (3.6K vol). Gaps: demo account (high opportunity). ${clientContext}`,
    deliverable: {
      agent: "Vision",
      type: "seo_analysis",
      client_id: client?.id,
      keywords: [
        { keyword: "forex trading", volume: 8100 },
        { keyword: "best forex broker", volume: 6200 },
      ],
    },
  };
}

// Apex Agent
async function apexAgent(task: Task, client?: Client) {
  const clientContext = client ? `Client: ${client.name}` : '';
  return {
    comment: `PPC budget: Meta $4K (CPA $25), Google $4K (CPC $1.20), Other $2K. Projected ROAS: 3.2x. ${clientContext}`,
    deliverable: {
      agent: "Apex",
      type: "ppc_strategy",
      client_id: client?.id,
      allocation: {
        meta: { budget: 4000, cpl: 8 },
        google: { budget: 4000, cpc: 1.2 },
      },
    },
  };
}

// Nova Agent
async function novaAgent(task: Task, client?: Client) {
  const clientContext = client ? `Client: ${client.name}` : '';
  return {
    comment: `Success metrics: ROAS 3.5x, CAC <$35, Conversion Rate >2.5%. Track purchases, leads, add-to-cart. ${clientContext}`,
    deliverable: {
      agent: "Nova",
      type: "analytics_framework",
      client_id: client?.id,
      success_metrics: { roas: 3.5, cac: 35 },
    },
  };
}

// Echo Agent
async function echoAgent(task: Task, client?: Client) {
  const tone = client?.tone_of_voice || 'professional';
  return {
    comment: `Copy variations: 5 headlines, 10 body options, 5 CTAs. Tone: ${tone}. Angles: pain point, opportunity, authority, differentiation, ease.`,
    deliverable: {
      agent: "Echo",
      type: "copy",
      client_id: client?.id,
      tone_of_voice: tone,
      headlines: [
        "Stop Losing Money on Bad Forex Trades",
        "Trade Forex Like a Pro in 30 Days",
        "The #1 Forex Platform for Beginners",
      ],
    },
  };
}

// Pixel Agent
async function pixelAgent(task: Task, client?: Client) {
  const clientContext = client ? `Client: ${client.name}` : '';
  return {
    comment: `Design specs: Blue/gold palette, professional-modern style. 3 layouts for Meta, Google, LinkedIn. ${clientContext}`,
    deliverable: {
      agent: "Pixel",
      type: "design_specs",
      client_id: client?.id,
      color_palette: { primary: "#0066FF", secondary: "#FFFFFF" },
    },
  };
}

// Reel Agent
async function reelAgent(task: Task, client?: Client) {
  const clientContext = client ? `Client: ${client.name}` : '';
  return {
    comment: `Video scripts: 15s, 30s, 60s. Hook-heavy, fast-paced, motivational tone. ${clientContext}`,
    deliverable: {
      agent: "Reel",
      type: "video_scripts",
      client_id: client?.id,
      scripts: {
        "15s": { hook: "I turned $100 into $5,000...", cta: "DM for guide" },
        "30s": { hook: "Everyone says forex is risky...", cta: "Start free trial" },
      },
    },
  };
}

// Social Agent
async function socialAgent(task: Task, client?: Client) {
  const clientContext = client ? `Client: ${client.name}` : '';
  return {
    comment: `Social posts: Instagram (emotional), Twitter (evidence), LinkedIn (thought leadership), TikTok (viral hook). ${clientContext}`,
    deliverable: {
      agent: "Social",
      type: "social_posts",
      client_id: client?.id,
      instagram: { caption: "Turned $100 into $5K in 30 days..." },
      twitter: ["i turned $100 into $5,000 trading forex. 🧵", "most traders fail..."],
    },
  };
}

// Run all agents
async function runAgents() {
  console.log(`[${new Date().toISOString()}] Agent runner started`);

  try {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "pending")
      .limit(1);

    if (!tasks || tasks.length === 0) {
      console.log("No pending tasks");
      return;
    }

    const task = tasks[0] as Task;
    console.log(`Processing: ${task.title}`);

    // Fetch client data if client_id exists
    let client: Client | undefined;
    if (task.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", task.client_id)
        .single();
      client = data;
      console.log(`Client: ${client?.name}`);
    }

    const agents = [
      { name: "Vision", fn: (t: Task) => visionAgent(t, client) },
      { name: "Apex", fn: (t: Task) => apexAgent(t, client) },
      { name: "Nova", fn: (t: Task) => novaAgent(t, client) },
      { name: "Echo", fn: (t: Task) => echoAgent(t, client) },
      { name: "Pixel", fn: (t: Task) => pixelAgent(t, client) },
      { name: "Reel", fn: (t: Task) => reelAgent(t, client) },
      { name: "Social", fn: (t: Task) => socialAgent(t, client) },
    ];

    for (const agent of agents) {
      try {
        const { comment, deliverable } = await agent.fn(task);

        await supabase.from("task_comments").insert({
          task_id: task.id,
          agent_name: agent.name,
          message: comment,
        });

        await supabase.from("deliverables").insert({
          task_id: task.id,
          agent_name: agent.name,
          type: agent.name.toLowerCase(),
          content: JSON.stringify(deliverable),
        });

        console.log(`✓ ${agent.name}`);
      } catch (error) {
        console.error(`✗ ${agent.name}:`, error);
      }
    }

    await supabase
      .from("tasks")
      .update({ status: "complete", approval_status: "in_review" })
      .eq("id", task.id);

    console.log(`✓ Task complete, awaiting approval`);
  } catch (error) {
    console.error("Error:", error);
  }
}

runAgents();
