import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Plus, Briefcase, User as UserIcon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import WorkItemDetails from './pages/WorkItemDetails';
import NewWorkItem from './pages/NewWorkItem';
import { useState, useEffect } from 'react';
import { api } from './api';

export default function App() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        let res = await api.get('/users');
        // If DB is empty, seed it first
        if (res.data.length === 0) {
          await api.post('/seed');
          res = await api.get('/users');
        }
        setUsers(res.data);
        if (res.data.length > 0 && !userId) {
          setUserId(res.data[0].id);
          localStorage.setItem('userId', res.data[0].id);
        }
      } catch (e) {
        console.error('Failed to bootstrap users', e);
      }
    };
    bootstrap();
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setUserId(newId);
    localStorage.setItem('userId', newId);
    window.location.reload(); // Reload to fetch as new user
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex bg-[#0f172a] text-slate-200">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1e293b] border-r border-[#334155] flex flex-col shadow-xl z-10">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Newtonite
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#334155] transition-colors">
              <LayoutDashboard size={20} className="text-blue-400" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link to="/new" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#334155] transition-colors">
              <Plus size={20} className="text-green-400" />
              <span className="font-medium">New Request</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-[#334155]">
            <div className="flex items-center gap-2 mb-2 px-2 text-sm text-slate-400">
              <UserIcon size={16} />
              <span>Simulate User</span>
            </div>
            <select 
              value={userId || ''} 
              onChange={handleUserChange}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.team?.name})</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none" />
          <header className="h-16 border-b border-[#334155] bg-[#1e293b]/80 backdrop-blur-md flex items-center px-8 z-10">
            <h2 className="text-lg font-medium">Operations Center</h2>
          </header>
          
          <div className="flex-1 overflow-auto p-8 relative z-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items/:id" element={<WorkItemDetails />} />
              <Route path="/new" element={<NewWorkItem />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
