import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// --- Gemini Image Generation ---
async function generateImage(prompt: string, taskId: string, name: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart) return null;

    // Upload to Supabase Storage
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const filename = `${taskId}/${name}.png`;

    const { error } = await supabase.storage
      .from('deliverables')
      .upload(filename, imageBuffer, { contentType: 'image/png', upsert: true });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('deliverables').getPublicUrl(filename);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Gemini image error:', err);
    return null;
  }
}

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

// --- AI Call Helper ---
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || 'No response generated';
}

// --- Agent Definitions ---

const AGENT_PROMPTS: Record<string, { system: string; buildPrompt: (task: Task, client?: Client) => string }> = {
  Vision: {
    system: `You are Vision, an expert SEO strategist. Analyze the campaign brief and provide:
1. Top 10 target keywords with estimated search volume and difficulty
2. Content gaps and opportunities
3. Competitor keyword analysis
4. Recommended content strategy (blog topics, landing pages)
5. Technical SEO recommendations

Be specific with numbers. Use real-world knowledge of search trends.`,
    buildPrompt: (task, client) => {
      const ctx = client ? `\nClient: ${client.name}\nTone: ${client.tone_of_voice}` : '';
      return `Campaign: ${task.title}\nBrief: ${task.description}${ctx}\n\nProvide your complete SEO analysis.`;
    },
  },

  Apex: {
    system: `You are Apex, an expert PPC/paid media strategist. Analyze the campaign brief and provide:
1. Recommended budget allocation across platforms (Google Ads, Meta, LinkedIn, etc.)
2. Target CPA/ROAS projections
3. Audience targeting strategy (demographics, interests, custom audiences)
4. Ad format recommendations (search, display, video, shopping)
5. Bidding strategy recommendations
6. A/B test plan

Be specific with budget numbers and projections.`,
    buildPrompt: (task, client) => {
      const ctx = client ? `\nClient: ${client.name}` : '';
      return `Campaign: ${task.title}\nBrief: ${task.description}${ctx}\n\nProvide your complete PPC strategy.`;
    },
  },

  Nova: {
    system: `You are Nova, an expert marketing analytics strategist. Analyze the campaign brief and provide:
1. KPIs and success metrics with specific targets
2. Measurement framework (what to track, how to track it)
3. Attribution model recommendation
4. Dashboard requirements (key charts and reports)
5. Reporting cadence and format
6. Conversion funnel analysis with expected drop-off rates

Be specific with numbers and benchmarks.`,
    buildPrompt: (task, client) => {
      const ctx = client ? `\nClient: ${client.name}` : '';
      return `Campaign: ${task.title}\nBrief: ${task.description}${ctx}\n\nProvide your complete analytics framework.`;
    },
  },

  Echo: {
    system: `You are Echo, an expert marketing copywriter. Create actual ready-to-use copy:
1. 5 headline variations (different angles: pain point, benefit, curiosity, social proof, urgency)
2. 3 primary ad copy variations (short, medium, long)
3. 5 CTA variations
4. Email subject lines (5 variations)
5. Landing page hero copy (headline + subheadline + body)
6. Social media captions (Instagram, LinkedIn, Twitter)

Write the actual copy — not descriptions of what to write. Make it compelling and on-brand.`,
    buildPrompt: (task, client) => {
      const tone = client?.tone_of_voice || 'professional and authoritative';
      return `Campaign: ${task.title}\nBrief: ${task.description}\nTone of voice: ${tone}\n\nWrite all the copy variations now.`;
    },
  },

  Pixel: {
    system: `You are Pixel, an expert marketing designer and art director. Provide:
1. Visual concept direction
2. Color palette (hex codes)
3. Typography recommendations
4. Detailed image generation prompts for ad creatives (3 variations)
   - Each prompt should be a detailed description suitable for AI image generation
   - Include: style, colors, composition, text overlay, mood
5. Platform specs (Meta 1080x1080, Google 300x250, LinkedIn 1200x627)

Format your image prompts clearly with "IMAGE_PROMPT_1:", "IMAGE_PROMPT_2:", "IMAGE_PROMPT_3:" prefixes.`,
    buildPrompt: (task, client) => {
      const ctx = client ? `\nClient: ${client.name}\nTone: ${client.tone_of_voice}` : '';
      return `Campaign: ${task.title}\nBrief: ${task.description}${ctx}\n\nProvide your creative direction and 3 image generation prompts.`;
    },
  },

  Reel: {
    system: `You are Reel, an expert video script writer. Create complete, ready-to-produce scripts:
1. 15-second script (TikTok/Reels hook)
2. 30-second script (YouTube pre-roll / paid social)
3. 60-second script (full story / testimonial format)
4. Each script includes: HOOK (first 3 sec), BODY, CTA
5. Visual directions (what's on screen for each line)
6. Music/sound recommendations
7. Talent/casting notes

Write the actual scripts with dialogue, not summaries.`,
    buildPrompt: (task, client) => {
      const ctx = client ? `\nClient: ${client.name}\nTone: ${client.tone_of_voice}` : '';
      return `Campaign: ${task.title}\nBrief: ${task.description}${ctx}\n\nWrite the complete video scripts.`;
    },
  },

  Social: {
    system: `You are Social, an expert organic social media strategist. Create a complete content plan:
1. Platform-specific posts (Instagram, LinkedIn, Twitter/X, TikTok)
2. Each post includes: caption, hashtags, best posting time, format (carousel, single, reel)
3. Content calendar (7-day plan)
4. Engagement strategy (comment responses, community building)
5. Influencer/UGC recommendations
6. Trending hooks and formats to leverage

Write the actual posts and captions, not descriptions.`,
    buildPrompt: (task, client) => {
      const ctx = client ? `\nClient: ${client.name}\nTone: ${client.tone_of_voice}` : '';
      return `Campaign: ${task.title}\nBrief: ${task.description}${ctx}\n\nCreate the complete social media plan with actual posts.`;
    },
  },
};

// --- API Route Handler ---

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .limit(5);

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'No pending tasks', duration: Date.now() - startTime });
    }

    const allResults: Array<{ task: string; agents: string[] }> = [];

    for (const task of tasks as Task[]) {
      // Fetch client data if client_id exists
      let client: Client | undefined;
      if (task.client_id) {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('id', task.client_id)
          .single();
        if (data) client = data;
      }

      // Update task status to processing
      await supabase.from('tasks').update({ status: 'processing' }).eq('id', task.id);

      const results: string[] = [];

      // Run all agents in parallel
      await Promise.all(
        Object.entries(AGENT_PROMPTS).map(async ([agentName, config]) => {
          try {
            const userPrompt = config.buildPrompt(task, client);
            const aiResponse = await callAI(config.system, userPrompt);

            // Save comment (summary)
            const summaryLine = aiResponse.split('\n').find(l => l.trim().length > 20) || aiResponse.substring(0, 200);
            await supabase.from('task_comments').insert({
              task_id: task.id,
              agent_name: agentName,
              message: summaryLine.substring(0, 500),
            });

            // Save full deliverable
            await supabase.from('deliverables').insert({
              task_id: task.id,
              agent_name: agentName,
              type: agentName.toLowerCase(),
              content: aiResponse,
            });

            // Pixel agent: also generate images from the prompts
            if (agentName === 'Pixel') {
              const imagePrompts = aiResponse.split(/IMAGE_PROMPT_\d+:\s*/).filter(s => s.trim().length > 10);
              let imageIndex = 0;
              for (const rawPrompt of imagePrompts.slice(0, 3)) {
                imageIndex++;
                const cleanPrompt = rawPrompt.trim().split('\n')[0].trim();
                if (cleanPrompt.length > 10) {
                  const imageUrl = await generateImage(cleanPrompt, task.id, `ad-creative-${imageIndex}`);
                  if (imageUrl) {
                    await supabase.from('deliverables').insert({
                      task_id: task.id,
                      agent_name: 'Pixel',
                      type: 'image',
                      content: JSON.stringify({ url: imageUrl, prompt: cleanPrompt, index: imageIndex }),
                    });
                  }
                }
              }
            }

            results.push(`✓ ${agentName}`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            results.push(`✗ ${agentName}: ${errorMsg}`);

            // Save error as comment so it's visible in UI
            await supabase.from('task_comments').insert({
              task_id: task.id,
              agent_name: agentName,
              message: `⚠️ Agent error: ${errorMsg.substring(0, 200)}`,
            });
          }
        })
      );

      // Mark task complete
      await supabase
        .from('tasks')
        .update({ status: 'complete' })
        .eq('id', task.id);

      allResults.push({ task: task.title, agents: results });
    }

    return NextResponse.json({
      processed: allResults.length,
      results: allResults,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
