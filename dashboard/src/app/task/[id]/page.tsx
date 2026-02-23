'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

const supabase = getSupabase();

const WAVE_1_AGENTS = ['Vision', 'Apex', 'Nova'];
const WAVE_2_AGENTS = ['Echo', 'Pixel', 'Reel', 'Social'];
const ALL_AGENTS = [...WAVE_1_AGENTS, ...WAVE_2_AGENTS];

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  client_id?: string;
  drive_folder_url?: string;
  created_by?: string;
  created_at: string;
}

interface AgentRun {
  id: string;
  task_id: string;
  agent_name: string;
  wave: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  output_summary?: string;
  output_data?: any;
  output_files?: Array<{ name: string; type: string; url: string }>;
  error?: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
  domain?: string;
}

export default function TaskDetail() {
  const params = useParams();
  const id = (params?.id || '') as string;
  const [task, setTask] = useState<Task | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();

    const subscription = supabase
      .channel(`agent_runs:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_runs', filter: `task_id=eq.${id}` }, () => {
        fetchAgentRuns();
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [id]);

  const fetchData = async () => {
    const { data: taskData } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (taskData) {
      setTask(taskData);
      if (taskData.client_id) {
        const { data: clientData } = await supabase.from('clients').select('*').eq('id', taskData.client_id).single();
        if (clientData) setClient(clientData);
      }
    }
    await fetchAgentRuns();
    setLoading(false);
  };

  const fetchAgentRuns = async () => {
    const { data } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('task_id', id)
      .order('wave', { ascending: true })
      .order('agent_name', { ascending: true });
    if (data) setAgentRuns(data);
  };

  const getRunForAgent = (name: string) => agentRuns.find(r => r.agent_name === name);

  const statusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#22c55e';
      case 'running': return '#3b82f6';
      case 'error': return '#ef4444';
      default: return '#64748b';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'complete': return '✓ Complete';
      case 'running': return '⟳ Running';
      case 'error': return '✗ Error';
      default: return '○ Pending';
    }
  };

  const completedCount = agentRuns.filter(r => r.status === 'complete').length;
  const selectedRun = selectedAgent ? getRunForAgent(selectedAgent) : null;

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 40, height: 40, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Task not found</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {/* Header */}
        <Link href="/tasks" style={{ color: '#60a5fa', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Back to Tasks
        </Link>

        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{task.title}</h1>
              <p style={{ color: '#94a3b8', margin: '0 0 16px', maxWidth: 700 }}>{task.description}</p>
              {client && (
                <span style={{ background: '#334155', color: '#e2e8f0', padding: '4px 12px', borderRadius: 6, fontSize: 13 }}>
                  Client: {client.name}{client.domain ? ` (${client.domain})` : ''}
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                background: task.status === 'complete' ? '#166534' : task.status === 'processing' ? '#1e3a5f' : '#334155',
                color: '#fff', padding: '6px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              }}>
                {task.status.toUpperCase()}
              </div>
              {task.drive_folder_url && (
                <a href={task.drive_folder_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#60a5fa', fontSize: 13, display: 'block', marginTop: 8 }}>
                  📁 Open Drive Folder
                </a>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{completedCount} of {ALL_AGENTS.length} agents complete</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                {agentRuns.some(r => r.wave === 1 && r.status !== 'complete') ? 'Wave 1' :
                 agentRuns.some(r => r.wave === 2 && r.status === 'running') ? 'Wave 2' :
                 completedCount === 7 ? 'Done' : 'Waiting'}
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#334155', borderRadius: 3 }}>
              <div style={{
                width: `${(completedCount / ALL_AGENTS.length) * 100}%`,
                height: '100%', background: '#3b82f6', borderRadius: 3, transition: 'width 0.5s',
              }} />
            </div>
          </div>
        </div>

        {/* Agent Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
          {/* Wave 1 */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Wave 1 — Data & Strategy
            </h3>
          </div>
          {WAVE_1_AGENTS.map(agent => {
            const run = getRunForAgent(agent);
            const isSelected = selectedAgent === agent;
            return (
              <div key={agent} onClick={() => setSelectedAgent(isSelected ? null : agent)} style={{
                background: isSelected ? '#1e3a5f' : '#1e293b',
                border: `1px solid ${isSelected ? '#3b82f6' : '#334155'}`,
                borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{agent}</span>
                  <span style={{ color: statusColor(run?.status || 'pending'), fontSize: 13 }}>
                    {statusLabel(run?.status || 'pending')}
                  </span>
                </div>
                {run?.output_summary && (
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
                    {run.output_summary.substring(0, 120)}{run.output_summary.length > 120 ? '...' : ''}
                  </p>
                )}
                {run?.output_files && run.output_files.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {run.output_files.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        style={{ background: '#334155', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11, textDecoration: 'none' }}>
                        {f.type === 'sheet' ? '📊' : f.type === 'doc' ? '📝' : f.type === 'image' ? '🖼️' : '📄'} {f.name}
                      </a>
                    ))}
                  </div>
                )}
                {run?.error && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>Error: {run.error.substring(0, 100)}</p>
                )}
              </div>
            );
          })}

          {/* Wave 2 */}
          <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
            <h3 style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Wave 2 — Creative & Execution
            </h3>
          </div>
          {WAVE_2_AGENTS.map(agent => {
            const run = getRunForAgent(agent);
            const isSelected = selectedAgent === agent;
            return (
              <div key={agent} onClick={() => setSelectedAgent(isSelected ? null : agent)} style={{
                background: isSelected ? '#1e3a5f' : '#1e293b',
                border: `1px solid ${isSelected ? '#3b82f6' : '#334155'}`,
                borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{agent}</span>
                  <span style={{ color: statusColor(run?.status || 'pending'), fontSize: 13 }}>
                    {statusLabel(run?.status || 'pending')}
                  </span>
                </div>
                {run?.output_summary && (
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
                    {run.output_summary.substring(0, 120)}{run.output_summary.length > 120 ? '...' : ''}
                  </p>
                )}
                {run?.output_files && run.output_files.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {run.output_files.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        style={{ background: '#334155', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11, textDecoration: 'none' }}>
                        {f.type === 'sheet' ? '📊' : f.type === 'doc' ? '📝' : f.type === 'image' ? '🖼️' : '📄'} {f.name}
                      </a>
                    ))}
                  </div>
                )}
                {run?.error && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>Error: {run.error.substring(0, 100)}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Agent Detail */}
        {selectedRun && (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #3b82f6', padding: 24 }}>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
              {selectedRun.agent_name} — Wave {selectedRun.wave}
            </h2>
            <span style={{ color: statusColor(selectedRun.status), fontSize: 14 }}>
              {statusLabel(selectedRun.status)}
            </span>

            {selectedRun.output_summary && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Summary</h4>
                <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedRun.output_summary}
                </p>
              </div>
            )}

            {selectedRun.output_files && selectedRun.output_files.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Files</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedRun.output_files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#0f172a', padding: '10px 16px', borderRadius: 8, textDecoration: 'none',
                    }}>
                      <span style={{ fontSize: 20 }}>
                        {f.type === 'sheet' ? '📊' : f.type === 'doc' ? '📝' : f.type === 'image' ? '🖼️' : '📄'}
                      </span>
                      <div>
                        <div style={{ color: '#60a5fa', fontSize: 14, fontWeight: 500 }}>{f.name}</div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>Google {f.type === 'sheet' ? 'Sheet' : f.type === 'doc' ? 'Doc' : f.type}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedRun.error && (
              <div style={{ marginTop: 16, background: '#450a0a', borderRadius: 8, padding: 12 }}>
                <h4 style={{ color: '#ef4444', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>Error</h4>
                <p style={{ color: '#fca5a5', fontSize: 13 }}>{selectedRun.error}</p>
              </div>
            )}

            {selectedRun.output_data && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Structured Data</h4>
                <pre style={{
                  background: '#0f172a', padding: 16, borderRadius: 8, overflow: 'auto', maxHeight: 300,
                  color: '#94a3b8', fontSize: 12, lineHeight: 1.5,
                }}>
                  {JSON.stringify(selectedRun.output_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
