'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

const supabase = getSupabase();

const AGENTS = ['Vision', 'Apex', 'Nova', 'Echo', 'Pixel', 'Reel', 'Social'];

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface Comment {
  id: string;
  agent_name: string;
  message: string;
  created_at: string;
}

interface Deliverable {
  id: string;
  agent_name: string;
  type: string;
  content: string;
  created_at: string;
}

export default function TaskDetail() {
  const params = useParams();
  const id = (params?.id || '') as string;
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'deliverables'>('comments');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetchTaskData();

    const commentsSubscription = supabase
      .channel(`comments:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${id}` }, () => {
        fetchComments();
      })
      .subscribe();

    const deliverablesSubscription = supabase
      .channel(`deliverables:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: `task_id=eq.${id}` }, () => {
        fetchDeliverables();
      })
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
      deliverablesSubscription.unsubscribe();
    };
  }, [id]);

  const fetchTaskData = async () => {
    const { data: taskData } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (taskData) setTask(taskData);
    fetchComments();
    fetchDeliverables();
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const fetchDeliverables = async () => {
    const { data } = await supabase
      .from('deliverables')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });
    if (data) setDeliverables(data);
  };

  const agentProgress = AGENTS.map((agent) => ({
    agent,
    hasComment: comments.some((c) => c.agent_name === agent),
    hasDeliverable: deliverables.some((d) => d.agent_name === agent),
  }));

  const completedAgents = agentProgress.filter((a) => a.hasDeliverable).length;

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
            width: '40px',
            height: '40px',
            border: '2px solid transparent',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Task not found</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <Link href="/tasks" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Tasks
        </Link>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{task.title}</h1>
          <p className="text-slate-400 mb-6">{task.description}</p>

          <div className="flex items-center gap-4">
            <div className="bg-slate-700 rounded-lg px-4 py-2">
              <span className="text-slate-300 text-sm">
                {completedAgents} of {AGENTS.length} agents complete
              </span>
              <div className="w-48 h-2 bg-slate-600 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(completedAgents / AGENTS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-8">
          {agentProgress.map((ap) => (
            <div
              key={ap.agent}
              className="bg-slate-800 rounded-lg border border-slate-700 p-3 text-center"
            >
              <p className="text-sm font-medium text-white mb-2">{ap.agent}</p>
              <div className="flex justify-center gap-1">
                {ap.hasComment && <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-white">💬</span>}
                {ap.hasDeliverable && <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">✓</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'comments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('deliverables')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'deliverables'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Deliverables ({deliverables.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-slate-400">Waiting for agent feedback...</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-400">{comment.agent_name}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{comment.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'deliverables' && (
              <div className="space-y-4">
                {deliverables.length === 0 ? (
                  <p className="text-slate-400">Waiting for deliverables...</p>
                ) : (
                  deliverables.map((deliverable) => (
                    <div key={deliverable.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-blue-400">{deliverable.agent_name}</span>
                          <span className="ml-3 text-xs bg-slate-600 px-2 py-1 rounded text-slate-300">
                            {deliverable.type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(deliverable.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-3 bg-slate-800 rounded p-3 max-h-40 overflow-y-auto">
                        <p className="text-slate-300 whitespace-pre-wrap text-sm">{deliverable.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
