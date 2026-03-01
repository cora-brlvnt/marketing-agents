#!/usr/bin/env node
/**
 * Mission Control — Agent Orchestrator
 * 
 * Polls Supabase for pending tasks, creates Drive folder structure,
 * runs agents in waves (Wave 1: data/strategy → Wave 2: creative),
 * writes results back to Supabase.
 * 
 * Runs as OpenClaw cron on Mac mini.
 */

import { createClient } from '@supabase/supabase-js';
import { execSync, exec } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from orchestrator directory
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch {}

// ── Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const DRIVE_PARENT_FOLDER_ID = '1k4134SCmsvXu29RoVf0JK-GpfFJbbUyy'; // "Mission Control Output"

const WAVE_1_AGENTS = ['Vision', 'Apex', 'Nova'];
const WAVE_2_AGENTS = ['Echo', 'Pixel', 'Reel', 'Social'];

const AGENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 min per agent

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Google Drive helpers (via gog CLI) ──────────────────────────────

function gogExec(cmd) {
  try {
    return execSync(`gog ${cmd}`, { encoding: 'utf-8', timeout: 30000 }).trim();
  } catch (e) {
    console.error(`gog error: ${cmd}`, e.message);
    return null;
  }
}

function createDriveFolder(name, parentId) {
  const result = gogExec(`drive mkdir "${name}" --parent ${parentId} --json`);
  if (!result) return null;
  try {
    const parsed = JSON.parse(result);
    // gog drive mkdir returns { folder: { id, name, webViewLink } }
    return parsed.folder?.id || parsed.id || parsed.Id || null;
  } catch {
    const idMatch = result.match(/[a-zA-Z0-9_-]{20,}/);
    return idMatch ? idMatch[0] : null;
  }
}

function getDriveFolderUrl(folderId) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

// ── Supabase helpers ────────────────────────────────────────────────

async function getPendingTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, clients(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1); // Process one at a time
  if (error) { console.error('Error fetching tasks:', error.message); return []; }
  return data || [];
}

async function updateTaskStatus(taskId, status, extras = {}) {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString(), ...extras })
    .eq('id', taskId);
  if (error) console.error(`Error updating task ${taskId}:`, error.message);
}

async function createAgentRun(taskId, agentName, wave) {
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      task_id: taskId,
      agent_name: agentName,
      wave,
      status: 'pending',
    })
    .select()
    .single();
  if (error) { console.error(`Error creating agent_run for ${agentName}:`, error.message); return null; }
  return data;
}

async function updateAgentRun(runId, updates) {
  const { error } = await supabase
    .from('agent_runs')
    .update(updates)
    .eq('id', runId);
  if (error) console.error(`Error updating agent_run ${runId}:`, error.message);
}

async function getWaveOutputs(taskId, wave) {
  const { data } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('task_id', taskId)
    .eq('wave', wave)
    .eq('status', 'complete');
  return data || [];
}

// ── Agent execution ─────────────────────────────────────────────────

function buildAgentPrompt(agentName, task, client, driveFolderId, waveOneOutputs = null) {
  const clientContext = client
    ? `\nClient: ${client.name}${client.company ? ` (${client.company})` : ''}${client.domain ? `\nDomain: ${client.domain}` : ''}${client.industry ? `\nIndustry: ${client.industry}` : ''}${client.tone_of_voice ? `\nTone of voice: ${client.tone_of_voice}` : ''}`
    : '';

  const waveOneContext = waveOneOutputs
    ? `\n\n## Wave 1 Agent Outputs (use these as foundation)\n${waveOneOutputs.map(o =>
        `### ${o.agent_name}\n**Summary:** ${o.output_summary || 'No summary'}\n**Structured data:** ${o.output_data ? JSON.stringify(o.output_data) : 'None'}\n**Files:** ${o.output_files ? JSON.stringify(o.output_files) : 'None'}`
      ).join('\n\n')}`
    : '';

  return `You are ${agentName}, a marketing agent in Berelvant's Mission Control system.

## Task Brief
Title: ${task.title}
Description: ${task.description}
${clientContext}
${waveOneContext}

## Your Mission
Based on the task brief above, produce your deliverables. You decide what files to create based on what the task needs.

## Output Instructions
You CANNOT create files directly. Instead, output a JSON block describing what files to create. The orchestrator will create them for you.

For each file, provide the full content. Supported types: "doc" (Google Doc) and "sheet" (Google Sheet).

For docs, provide markdown content. For sheets, provide a 2D array of values.

Output ONLY a single JSON block (no other text):
\`\`\`json
{
  "summary": "Brief description of what you produced",
  "output_data": { /* structured key data other agents can consume — keywords, audiences, KPIs, etc. */ },
  "files": [
    { "name": "File Title", "type": "doc", "content": "# Markdown content here\\n\\nFull document..." },
    { "name": "Data Sheet", "type": "sheet", "content": [["Header1","Header2"],["row1col1","row1col2"]] }
  ]
}
\`\`\`

IMPORTANT: output_data should contain the key structured data (keywords with volumes, audience segments, KPI targets, etc.) so Wave 2 agents can build on it programmatically. Keep it concise but complete.`;
}

async function runAgent(agentName, task, client, agentFolderId, run, waveOneOutputs = null) {
  console.log(`  🚀 Starting ${agentName}...`);
  
  await updateAgentRun(run.id, {
    status: 'running',
    started_at: new Date().toISOString(),
  });

  const prompt = buildAgentPrompt(agentName, task, client, agentFolderId, waveOneOutputs);

  try {
    // Run agent via OpenClaw sessions_spawn (sub-agent)
    const result = await runAgentViaSubprocess(agentName, prompt);
    
    // Parse the JSON output block from agent response
    const parsed = parseAgentOutput(result);
    
    // Create Drive files from agent output
    const driveFiles = createDriveFiles(parsed.files, agentFolderId);
    console.log(`  📁 ${agentName}: created ${driveFiles.length} file(s) in Drive`);
    
    await updateAgentRun(run.id, {
      status: 'complete',
      completed_at: new Date().toISOString(),
      output_summary: parsed.summary || `${agentName} completed`,
      output_data: parsed.output_data || null,
      output_files: driveFiles.length > 0 ? driveFiles : (parsed.files || null),
    });
    
    console.log(`  ✅ ${agentName} complete`);
    return true;
  } catch (e) {
    console.error(`  ❌ ${agentName} failed:`, e.message);
    await updateAgentRun(run.id, {
      status: 'error',
      completed_at: new Date().toISOString(),
      error: e.message.substring(0, 500),
    });
    return false;
  }
}

function runAgentViaSubprocess(agentName, prompt) {
  return new Promise((resolve, reject) => {
    // Use claude CLI with the prompt piped in
    const escaped = prompt.replace(/'/g, "'\\''");
    const child = exec(
      `echo '${escaped}' | claude --print --model haiku`,
      {
        timeout: AGENT_TIMEOUT_MS,
        maxBuffer: 1024 * 1024, // 1MB
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed) reject(new Error(`Timeout after ${AGENT_TIMEOUT_MS / 1000}s`));
          else reject(new Error(error.message));
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

function parseAgentOutput(rawOutput) {
  try {
    // Look for JSON block in agent output
    const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try first JSON object anywhere in output (common when model adds preamble)
    const objMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch {}
    }

    // Try parsing the whole thing as JSON
    const trimmed = rawOutput.trim();
    if (trimmed.startsWith('{')) return JSON.parse(trimmed);
    return {
      summary: rawOutput.substring(0, 500),
      output_data: null,
      files: null,
    };
  } catch {
    return {
      summary: rawOutput.substring(0, 500),
      output_data: null,
      files: null,
    };
  }
}

function createDriveDoc(title, content, parentFolderId) {
  // Create doc
  const createResult = gogExec(`docs create "${title}" --parent ${parentFolderId} --json`);
  if (!createResult) return null;
  let docId;
  try {
    const parsed = JSON.parse(createResult);
    docId = parsed.documentId || parsed.id || parsed.file?.id;
  } catch {
    const m = createResult.match(/[a-zA-Z0-9_-]{20,}/);
    docId = m ? m[0] : null;
  }
  if (!docId) return null;
  
  // Write content via stdin
  try {
    execSync(`gog docs write ${docId}`, { input: content, encoding: 'utf-8', timeout: 30000 });
  } catch (e) {
    console.error(`  Warning: could not write to doc ${docId}:`, e.message);
  }
  return { name: title, type: 'doc', url: `https://docs.google.com/document/d/${docId}` };
}

function createDriveSheet(title, data, parentFolderId) {
  // Create sheet
  const createResult = gogExec(`sheets create "${title}" --json`);
  if (!createResult) return null;
  let sheetId;
  try {
    const parsed = JSON.parse(createResult);
    sheetId = parsed.spreadsheetId || parsed.id;
  } catch {
    const m = createResult.match(/[a-zA-Z0-9_-]{20,}/);
    sheetId = m ? m[0] : null;
  }
  if (!sheetId) return null;

  // Move to folder
  gogExec(`drive move ${sheetId} --parent ${parentFolderId}`);

  // Write data if provided (format: comma-separated rows, pipe-separated cells)
  if (Array.isArray(data) && data.length > 0) {
    try {
      // gog sheets update <id> <range> <values...>
      // values format: "cell1|cell2|cell3" "cell4|cell5|cell6" (each arg is a row)
      const rows = data.map(row => 
        Array.isArray(row) ? row.map(c => String(c).replace(/\|/g, '\\|').replace(/"/g, '\\"')).join('|') : String(row)
      );
      // Write in batches to avoid arg length limits
      const batchSize = 20;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const startRow = i + 1;
        const range = `Sheet1!A${startRow}`;
        const args = batch.map(r => `"${r}"`).join(' ');
        execSync(`gog sheets update ${sheetId} "${range}" ${args} --force`, 
          { encoding: 'utf-8', timeout: 30000 });
      }
    } catch (e) {
      console.error(`  Warning: could not write to sheet ${sheetId}:`, e.message);
    }
  }
  return { name: title, type: 'sheet', url: `https://docs.google.com/spreadsheets/d/${sheetId}` };
}

function createDriveFiles(files, parentFolderId) {
  const created = [];
  if (!Array.isArray(files)) return created;
  for (const f of files) {
    let result;
    if (f.type === 'doc') {
      result = createDriveDoc(f.name, f.content || '', parentFolderId);
    } else if (f.type === 'sheet') {
      result = createDriveSheet(f.name, f.content || [], parentFolderId);
    }
    if (result) created.push(result);
  }
  return created;
}

// ── Wave execution ──────────────────────────────────────────────────

async function runWave(waveNum, agents, task, client, taskFolderId, waveOneOutputs = null) {
  console.log(`\n🌊 Wave ${waveNum}: ${agents.join(', ')}`);
  
  // Create agent subfolders + agent_run records
  const agentJobs = [];
  for (const agent of agents) {
    const agentFolderId = createDriveFolder(agent, taskFolderId);
    if (!agentFolderId) {
      console.error(`  Failed to create Drive folder for ${agent}`);
      continue;
    }
    const run = await createAgentRun(task.id, agent, waveNum);
    if (!run) continue;
    agentJobs.push({ agent, agentFolderId, run });
  }

  // Run all agents in parallel
  const results = await Promise.allSettled(
    agentJobs.map(({ agent, agentFolderId, run }) =>
      runAgent(agent, task, client, agentFolderId, run, waveOneOutputs)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === false)).length;
  
  console.log(`  Wave ${waveNum} done: ${succeeded} succeeded, ${failed} failed`);
  return { succeeded, failed };
}

// ── Main orchestration loop ─────────────────────────────────────────

async function processTask(task) {
  const client = task.clients || null; // Joined from select
  const taskLabel = `${task.title} - ${new Date().toISOString().split('T')[0]}`;
  
  console.log(`\n📋 Processing task: ${taskLabel}`);

  // 1. Set task to processing
  await updateTaskStatus(task.id, 'processing');

  // 2. Create Drive folder for task
  const taskFolderId = createDriveFolder(taskLabel, DRIVE_PARENT_FOLDER_ID);
  if (!taskFolderId) {
    console.error('Failed to create Drive folder');
    await updateTaskStatus(task.id, 'error');
    return;
  }
  const driveFolderUrl = getDriveFolderUrl(taskFolderId);
  await updateTaskStatus(task.id, 'processing', { drive_folder_url: driveFolderUrl });
  console.log(`📁 Drive folder: ${driveFolderUrl}`);

  // 3. Wave 1: Data & Strategy
  const wave1 = await runWave(1, WAVE_1_AGENTS, task, client, taskFolderId);

  // 4. Collect Wave 1 outputs for Wave 2
  const waveOneOutputs = await getWaveOutputs(task.id, 1);

  // 5. Wave 2: Creative & Execution (even if Wave 1 had partial failures)
  const wave2 = await runWave(2, WAVE_2_AGENTS, task, client, taskFolderId, waveOneOutputs);

  // 6. Set final status
  const totalFailed = wave1.failed + wave2.failed;
  const finalStatus = totalFailed === 0 ? 'complete' : totalFailed === 7 ? 'error' : 'complete';
  await updateTaskStatus(task.id, finalStatus);

  console.log(`\n✅ Task "${task.title}" → ${finalStatus}`);
  console.log(`   Drive: ${driveFolderUrl}`);
  
  return { task, driveFolderUrl, finalStatus, totalFailed };
}

// ── Entry point ─────────────────────────────────────────────────────

async function main() {
  console.log('🎯 Mission Control Orchestrator starting...');
  
  const tasks = await getPendingTasks();
  
  if (tasks.length === 0) {
    console.log('No pending tasks. Done.');
    return;
  }

  for (const task of tasks) {
    const result = await processTask(task);
    if (result) {
      // Notify via stdout (OpenClaw cron will capture and announce)
      console.log(`\n📣 Task complete: "${result.task.title}"`);
      console.log(`   Status: ${result.finalStatus}`);
      console.log(`   Drive: ${result.driveFolderUrl}`);
      if (result.totalFailed > 0) {
        console.log(`   ⚠️ ${result.totalFailed} agent(s) failed`);
      }
    }
  }
}

main().catch(e => {
  console.error('Orchestrator error:', e);
  process.exit(1);
});
