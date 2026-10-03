import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckCircle, Search, User } from 'lucide-react';
import { useState } from 'react';

const priorityColors = {
  LOW: 'bg-slate-700 text-slate-300',
  NORMAL: 'bg-blue-900/50 text-blue-300 border border-blue-800/50',
  URGENT: 'bg-red-900/50 text-red-300 border border-red-800/50 animate-pulse'
};

const statusIcons = {
  OPEN: <AlertCircle size={16} className="text-yellow-400" />,
  IN_PROGRESS: <Clock size={16} className="text-blue-400" />,
  REVIEW: <Search size={16} className="text-purple-400" />,
  RESOLVED: <CheckCircle size={16} className="text-green-400" />
};

export default function Dashboard() {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['workItems'],
    queryFn: async () => {
      const res = await api.get('/work-items');
      return res.data;
    },
    refetchInterval: 5000 // Poll every 5s for real-time feel
  });

  const [filter, setFilter] = useState('ALL');

  if (isLoading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">Failed to load work items. Ensure the server is running.</div>;

  const filteredItems = items?.filter((item: any) => filter === 'ALL' || item.status === filter) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-xl border border-[#334155] backdrop-blur-sm">
        <h1 className="text-2xl font-semibold">Active Work</h1>
        <div className="flex gap-2">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === status 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'bg-[#0f172a] text-slate-400 hover:text-slate-200 border border-[#334155] hover:border-slate-500'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <div className="text-center text-slate-500 py-12 bg-[#1e293b]/30 rounded-xl border border-[#334155] border-dashed">
            No work items found.
          </div>
        ) : (
          filteredItems.map((item: any) => (
            <Link 
              to={`/items/${item.id}`} 
              key={item.id}
              className="block bg-[#1e293b] p-5 rounded-xl border border-[#334155] hover:border-blue-500/50 hover:bg-[#1e293b]/80 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-[#0f172a] p-2 rounded-lg border border-[#334155]">
                    {statusIcons[item.status as keyof typeof statusIcons]}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <span>#{item.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>Updated {formatDistanceToNow(new Date(item.updatedAt))} ago</span>
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                  {item.priority}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm mt-4 pt-4 border-t border-[#334155]/50 relative z-10">
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={16} />
                  <span>{item.assignedTo ? item.assignedTo.name : <span className="italic">Unassigned</span>}</span>
                </div>
                {item.assignedTo?.team && (
                  <span className="text-slate-500 bg-[#0f172a] px-2 py-0.5 rounded text-xs border border-[#334155]">
                    {item.assignedTo.team.name}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
