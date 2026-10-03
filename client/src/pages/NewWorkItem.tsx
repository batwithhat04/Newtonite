import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

export default function NewWorkItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'NORMAL'
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/work-items', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      navigate(`/items/${res.data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create work item');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Title and description are required.');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#1e293b] p-8 rounded-2xl border border-[#334155] shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-slate-100">Create New Request</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Title</label>
            <input 
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              placeholder="E.g., Production database latency spike"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[150px] placeholder:text-slate-600"
              placeholder="Provide details about the issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
            <div className="flex gap-4">
              {['LOW', 'NORMAL', 'URGENT'].map(p => (
                <label key={p} className={`flex-1 cursor-pointer`}>
                  <input 
                    type="radio" 
                    name="priority" 
                    value={p}
                    checked={formData.priority === p}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="hidden"
                  />
                  <div className={`text-center py-3 rounded-xl border transition-all ${
                    formData.priority === p 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-semibold' 
                      : 'border-[#334155] bg-[#0f172a] text-slate-400 hover:border-slate-500'
                  }`}>
                    {p}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#334155] flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-[#334155]/50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
