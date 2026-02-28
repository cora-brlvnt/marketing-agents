#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SHARED_DRIVE_ID = process.env.CLIENT_SHARED_DRIVE_ID || '0AC9KcnMnimRbUk9PVA';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function gog(cmd) {
  return execSync(`gog ${cmd}`, { encoding: 'utf-8' }).trim();
}

function mkdir(name, parentId) {
  const out = gog(`drive mkdir "${name.replace(/"/g, '')}" --parent ${parentId} --json --no-input`);
  return JSON.parse(out).folder.id;
}

function ensureDriveStructure(clientName) {
  const date = new Date().toISOString().slice(0, 10);
  const rootName = `${clientName.replace(/\s+/g, '_')}_${date}`;
  const rootId = mkdir(rootName, SHARED_DRIVE_ID);

  const f01 = mkdir('01_Onboarding', rootId);
  mkdir('02_Contracts_SOW', rootId);
  const f03 = mkdir('03_Brand_Assets', rootId);
  mkdir('04_Creative_Production', rootId);
  mkdir('05_Reports', rootId);
  mkdir('06_Digital_Channels', rootId);

  const logos = mkdir('Logos', f03);
  mkdir('Primary', logos);
  mkdir('Isotype', logos);
  mkdir('Monochrome', logos);
  mkdir('Legacy', logos);
  mkdir('Guidelines', f03);
  mkdir('Templates', f03);
  mkdir('Approved_Assets', f03);

  const logDoc = JSON.parse(gog(`docs create "CHANGELOG" --parent ${f01} --json --no-input`)).file.id;

  return {
    root_id: rootId,
    root_url: `https://drive.google.com/drive/folders/${rootId}`,
    changelog_doc_id: logDoc,
  };
}

function writeChangeLog(docId, message) {
  const content = `# Client Update\n\n- Time: ${new Date().toISOString()}\n- ${message}\n`;
  gog(`docs write ${docId} ${JSON.stringify(content)} --no-input`);
}

async function processEvent(evt) {
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', evt.client_id)
    .single();

  if (error || !client) throw new Error('Client not found');

  let visual = client.visual_style || {};

  if (!client.drive_folder_id) {
    const drive = ensureDriveStructure(client.name || 'Client');
    visual = {
      ...visual,
      brand_assets_hub: drive.root_url,
      drive_structure: {
        root_id: drive.root_id,
        root_url: drive.root_url,
        changelog_doc_id: drive.changelog_doc_id,
        template: 'MASTER_CLIENT_TEMPLATE_v1',
        created_at: new Date().toISOString(),
      },
    };

    await supabase
      .from('clients')
      .update({ drive_folder_id: drive.root_id, visual_style: visual })
      .eq('id', client.id);
  }

  const docId = visual?.drive_structure?.changelog_doc_id;
  if (docId) {
    const changed = Array.isArray(evt.changed_fields) ? evt.changed_fields.join(', ') : 'fields updated';
    writeChangeLog(docId, `${evt.event_type.toUpperCase()} — ${changed}`);
  }

  await supabase
    .from('client_sync_events')
    .update({ status: 'done', processed_at: new Date().toISOString(), error: null })
    .eq('id', evt.id);
}

async function runOnce() {
  const { data, error } = await supabase
    .from('client_sync_events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(25);

  if (error) throw error;
  if (!data?.length) return 0;

  for (const evt of data) {
    try {
      await supabase.from('client_sync_events').update({ status: 'processing' }).eq('id', evt.id);
      await processEvent(evt);
      console.log(`✅ processed ${evt.id}`);
    } catch (e) {
      await supabase
        .from('client_sync_events')
        .update({ status: 'failed', error: String(e).slice(0, 500) })
        .eq('id', evt.id);
      console.error(`❌ failed ${evt.id}:`, e.message);
    }
  }

  return data.length;
}

(async () => {
  const count = await runOnce();
  console.log(`done: ${count}`);
})();
