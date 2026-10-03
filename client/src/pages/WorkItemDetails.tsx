import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckCircle, Search, MessageSquare, AlertTriangle } from 'lucide-react';

const priorityColors = {
  LOW: 'bg-slate-700 text-slate-300',
  NORMAL: 'bg-blue-900/50 text-blue-300',
  URGENT: 'bg-red-900/50 text-red-300'
};

const statusIcons: Record<string, React.ReactNode> = {
  OPEN: <AlertCircle size={20} className="text-yellow-400" />,
  IN_PROGRESS: <Clock size={20} className="text-blue-400" />,
  REVIEW: <Search size={20} className="text-purple-400" />,
  RESOLVED: <CheckCircle size={20} className="text-green-400" />
};

export default function WorkItemDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['workItem', id],
    queryFn: async () => {
      const res = await api.get(`/work-items/${id}`);
      return res.data;
    },
    refetchInterval: 3000 // Real-time feel
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updates: any) => api.put(`/work-items/${id}`, { ...updates, version: item.version }),
    onSuccess: () => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['workItem', id] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update work item');
    }
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/work-items/${id}/comments`, { comment }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['workItem', id] });
    }
  });

  if (isLoading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (!item) return <div className="text-red-400">Not found</div>;

  return (
    <div className="grid grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* Left Column - Details */}
      <div className="col-span-2 space-y-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#0f172a] p-1.5 rounded-lg border border-[#334155]">
                  {statusIcons[item.status as keyof typeof statusIcons]}
                </div>
                <span className="text-sm font-mono text-slate-500 bg-[#0f172a] px-2 py-1 rounded border border-[#334155]">
                  #{item.id.slice(0, 8)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                  {item.priority}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-100">{item.title}</h1>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <select 
                value={item.status}
                onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] text-slate-300 min-h-[100px] whitespace-pre-wrap">
              {item.description}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-400" />
            Comments & History
          </h2>
          
          <div className="space-y-4 mb-6">
            {item.events.map((event: any) => (
              <div key={event.id} className="flex gap-4 p-4 rounded-xl bg-[#0f172a] border border-[#334155]">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center shrink-0 font-medium border border-blue-800/50">
                  {event.user?.name.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-slate-200">{event.user?.name || 'System'}</span>
                    <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(event.createdAt))} ago</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {event.type === 'CREATED' && <span className="text-green-400 font-medium">Created the request</span>}
                    {event.type === 'UPDATED' && (
                      <div>
                        Updated fields: 
                        <pre className="mt-2 bg-[#1e293b] p-2 rounded text-xs overflow-x-auto border border-[#334155]">
                          {JSON.stringify(JSON.parse(event.payload), null, 2)}
                        </pre>
                      </div>
                    )}
                    {event.type === 'COMMENTED' && (
                      <span className="text-slate-300">{JSON.parse(event.payload).comment}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <input 
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              onKeyDown={e => e.key === 'Enter' && commentMutation.mutate()}
            />
            <button 
              onClick={() => commentMutation.mutate()}
              disabled={!comment || commentMutation.isPending}
              className="px-6 py-2 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Meta */}
      <div className="space-y-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Assignment</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assigned To</label>
              <select
                value={item.assignedToId || ''}
                onChange={e => updateMutation.mutate({ assignedToId: e.target.value || null })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {users?.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.team?.name})</option>
                ))}
              </select>
            </div>

            {item.assignedTo && (
              <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-800 text-blue-200 flex items-center justify-center font-bold">
                  {item.assignedTo.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-slate-200 text-sm">{item.assignedTo.name}</div>
                  <div className="text-xs text-slate-400">{item.assignedTo.team?.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Meta</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#334155] pb-2">
              <span className="text-slate-500">Created</span>
              <span className="text-slate-300">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-[#334155] pb-2">
              <span className="text-slate-500">Updated</span>
              <span className="text-slate-300">{formatDistanceToNow(new Date(item.updatedAt))} ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Version</span>
              <span className="text-slate-300 font-mono text-xs bg-[#0f172a] px-2 py-0.5 rounded">v{item.version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
