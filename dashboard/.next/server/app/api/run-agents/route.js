"use strict";(()=>{var e={};e.id=115,e.ids=[115],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2053:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>h,originalPathname:()=>v,requestAsyncStorage:()=>u,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>g,staticGenerationBailout:()=>y});var i={};a.r(i),a.d(i,{GET:()=>GET});var r=a(884),n=a(6132),o=a(6170),s=a(5798),l=a(8614);let c=(0,o.eI)(process.env.SUPABASE_URL||"https://ieirkjgfompuevwalzga.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllawfqa2pnZm9tcHVldndhbHpnYSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcxNTQ1MzE2LCJleHAiOjIwODcxMjEzMTZ9.test"),p=new l.ZP({apiKey:process.env.OPENAI_API_KEY||""});async function generateImage(e,t,a){let i=process.env.GEMINI_API_KEY;if(!i)return null;try{let r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${i}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{responseModalities:["TEXT","IMAGE"]}})}),n=await r.json(),o=n?.candidates?.[0]?.content?.parts||[],s=o.find(e=>e.inlineData?.mimeType?.startsWith("image/"));if(!s)return null;let l=Buffer.from(s.inlineData.data,"base64"),p=`${t}/${a}.png`,{error:d}=await c.storage.from("deliverables").upload(p,l,{contentType:"image/png",upsert:!0});if(d)return console.error("Storage upload error:",d),null;let{data:m}=c.storage.from("deliverables").getPublicUrl(p);return m?.publicUrl||null}catch(e){return console.error("Gemini image error:",e),null}}async function callAI(e,t){let a=await p.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:e},{role:"user",content:t}],max_tokens:1500,temperature:.7});return a.choices[0]?.message?.content||"No response generated"}let d={Vision:{system:`You are Vision, an expert SEO strategist. Analyze the campaign brief and provide:
1. Top 10 target keywords with estimated search volume and difficulty
2. Content gaps and opportunities
3. Competitor keyword analysis
4. Recommended content strategy (blog topics, landing pages)
5. Technical SEO recommendations

Be specific with numbers. Use real-world knowledge of search trends.`,buildPrompt:(e,t)=>{let a=t?`
Client: ${t.name}
Tone: ${t.tone_of_voice}`:"";return`Campaign: ${e.title}
Brief: ${e.description}${a}

Provide your complete SEO analysis.`}},Apex:{system:`You are Apex, an expert PPC/paid media strategist. Analyze the campaign brief and provide:
1. Recommended budget allocation across platforms (Google Ads, Meta, LinkedIn, etc.)
2. Target CPA/ROAS projections
3. Audience targeting strategy (demographics, interests, custom audiences)
4. Ad format recommendations (search, display, video, shopping)
5. Bidding strategy recommendations
6. A/B test plan

Be specific with budget numbers and projections.`,buildPrompt:(e,t)=>{let a=t?`
Client: ${t.name}`:"";return`Campaign: ${e.title}
Brief: ${e.description}${a}

Provide your complete PPC strategy.`}},Nova:{system:`You are Nova, an expert marketing analytics strategist. Analyze the campaign brief and provide:
1. KPIs and success metrics with specific targets
2. Measurement framework (what to track, how to track it)
3. Attribution model recommendation
4. Dashboard requirements (key charts and reports)
5. Reporting cadence and format
6. Conversion funnel analysis with expected drop-off rates

Be specific with numbers and benchmarks.`,buildPrompt:(e,t)=>{let a=t?`
Client: ${t.name}`:"";return`Campaign: ${e.title}
Brief: ${e.description}${a}

Provide your complete analytics framework.`}},Echo:{system:`You are Echo, an expert marketing copywriter. Create actual ready-to-use copy:
1. 5 headline variations (different angles: pain point, benefit, curiosity, social proof, urgency)
2. 3 primary ad copy variations (short, medium, long)
3. 5 CTA variations
4. Email subject lines (5 variations)
5. Landing page hero copy (headline + subheadline + body)
6. Social media captions (Instagram, LinkedIn, Twitter)

Write the actual copy — not descriptions of what to write. Make it compelling and on-brand.`,buildPrompt:(e,t)=>{let a=t?.tone_of_voice||"professional and authoritative";return`Campaign: ${e.title}
Brief: ${e.description}
Tone of voice: ${a}

Write all the copy variations now.`}},Pixel:{system:`You are Pixel, an expert marketing designer and art director. Provide:
1. Visual concept direction
2. Color palette (hex codes)
3. Typography recommendations
4. Detailed image generation prompts for ad creatives (3 variations)
   - Each prompt should be a detailed description suitable for AI image generation
   - Include: style, colors, composition, text overlay, mood
5. Platform specs (Meta 1080x1080, Google 300x250, LinkedIn 1200x627)

Format your image prompts clearly with "IMAGE_PROMPT_1:", "IMAGE_PROMPT_2:", "IMAGE_PROMPT_3:" prefixes.`,buildPrompt:(e,t)=>{let a=t?`
Client: ${t.name}
Tone: ${t.tone_of_voice}`:"";return`Campaign: ${e.title}
Brief: ${e.description}${a}

Provide your creative direction and 3 image generation prompts.`}},Reel:{system:`You are Reel, an expert video script writer. Create complete, ready-to-produce scripts:
1. 15-second script (TikTok/Reels hook)
2. 30-second script (YouTube pre-roll / paid social)
3. 60-second script (full story / testimonial format)
4. Each script includes: HOOK (first 3 sec), BODY, CTA
5. Visual directions (what's on screen for each line)
6. Music/sound recommendations
7. Talent/casting notes

Write the actual scripts with dialogue, not summaries.`,buildPrompt:(e,t)=>{let a=t?`
Client: ${t.name}
Tone: ${t.tone_of_voice}`:"";return`Campaign: ${e.title}
Brief: ${e.description}${a}

Write the complete video scripts.`}},Social:{system:`You are Social, an expert organic social media strategist. Create a complete content plan:
1. Platform-specific posts (Instagram, LinkedIn, Twitter/X, TikTok)
2. Each post includes: caption, hashtags, best posting time, format (carousel, single, reel)
3. Content calendar (7-day plan)
4. Engagement strategy (comment responses, community building)
5. Influencer/UGC recommendations
6. Trending hooks and formats to leverage

Write the actual posts and captions, not descriptions.`,buildPrompt:(e,t)=>{let a=t?`
Client: ${t.name}
Tone: ${t.tone_of_voice}`:"";return`Campaign: ${e.title}
Brief: ${e.description}${a}

Create the complete social media plan with actual posts.`}}};async function GET(e){let t=e.headers.get("authorization");if(process.env.CRON_SECRET&&t!==`Bearer ${process.env.CRON_SECRET}`)return s.Z.json({error:"Unauthorized"},{status:401});let a=Date.now();try{let{data:e}=await c.from("tasks").select("*").eq("status","pending").limit(5);if(!e||0===e.length)return s.Z.json({message:"No pending tasks",duration:Date.now()-a});let t=[];for(let a of e){let e;if(a.client_id){let{data:t}=await c.from("clients").select("*").eq("id",a.client_id).single();t&&(e=t)}await c.from("tasks").update({status:"processing"}).eq("id",a.id);let i=[];await Promise.all(Object.entries(d).map(async([t,r])=>{try{let n=r.buildPrompt(a,e),o=await callAI(r.system,n),s=o.split("\n").find(e=>e.trim().length>20)||o.substring(0,200);if(await c.from("task_comments").insert({task_id:a.id,agent_name:t,message:s.substring(0,500)}),await c.from("deliverables").insert({task_id:a.id,agent_name:t,type:t.toLowerCase(),content:o}),"Pixel"===t){let e=o.split(/IMAGE_PROMPT_\d+:\s*/).filter(e=>e.trim().length>10),t=0;for(let i of e.slice(0,3)){t++;let e=i.trim().split("\n")[0].trim();if(e.length>10){let i=await generateImage(e,a.id,`ad-creative-${t}`);i&&await c.from("deliverables").insert({task_id:a.id,agent_name:"Pixel",type:"image",content:JSON.stringify({url:i,prompt:e,index:t})})}}}i.push(`✓ ${t}`)}catch(r){let e=r instanceof Error?r.message:String(r);i.push(`✗ ${t}: ${e}`),await c.from("task_comments").insert({task_id:a.id,agent_name:t,message:`⚠️ Agent error: ${e.substring(0,200)}`})}})),await c.from("tasks").update({status:"complete"}).eq("id",a.id),t.push({task:a.title,agents:i})}return s.Z.json({processed:t.length,results:t,duration:Date.now()-a})}catch(e){return s.Z.json({error:String(e)},{status:500})}}let m=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/run-agents/route",pathname:"/api/run-agents",filename:"route",bundlePath:"app/api/run-agents/route"},resolvedPagePath:"/Users/cora/.openclaw/workspace/projects/marketing-agents/dashboard/src/app/api/run-agents/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:u,staticGenerationAsyncStorage:g,serverHooks:f,headerHooks:h,staticGenerationBailout:y}=m,v="/api/run-agents/route"}};var t=require("../../../webpack-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),a=t.X(0,[804],()=>__webpack_exec__(2053));module.exports=a})();