'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

interface Task {
  id: string;
  title: string;
  status: string;
  deadline: string;
  assigned_agents: string[];
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data);
    setLoading(false);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    
    const { error } = await supabase.from('tasks').insert([
      {
        title: newTask.title,
        description: newTask.description,
        assigned_agents: ['Vision', 'Apex', 'Nova', 'Echo', 'Pixel', 'Reel', 'Social'],
        status: 'open',
      },
    ]);

    if (!error) {
      setNewTask({ title: '', description: '' });
      fetchTasks();
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Mission Control</h1>

        {/* Create Task */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">New Campaign</h2>
          <form onSubmit={createTask} className="space-y-4">
            <input
              type="text"
              placeholder="Campaign title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              rows={3}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
            >
              Create Campaign
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-gray-400">No campaigns yet</p>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{task.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Status: <span className="text-blue-400">{task.status}</span>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Agents: {task.assigned_agents.join(', ')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-800 rounded text-sm">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
