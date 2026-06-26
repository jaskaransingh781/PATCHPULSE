import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Search, Bell, CheckCircle2, Filter, ArrowUpDown, LogOut } from 'lucide-react';

const AdminDashboard = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
    const [message, setMessage] = useState('');
    
    const { issues, resolveIssue } = useStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                setToken(data.token);
                sessionStorage.setItem('adminToken', data.token);
                setMessage('Login successful!');
            } else {
                setMessage(data.message || 'Login failed');
            }
        } catch (error) {
            setMessage('Error connecting to server');
        }
    };

    const handleResolve = async (id) => {
        try {
            await resolveIssue(id, token);
            setMessage('Issue resolved successfully!');
        } catch (error) {
             setMessage('Error resolving issue');
        }
    };

    const handleLogout = () => {
        setToken('');
        sessionStorage.removeItem('adminToken');
        setUsername('');
        setPassword('');
        setMessage('');
    };

    if (!token) {
        return (
            <div className="w-full h-full flex justify-center items-center p-4">
                <div className="w-full max-w-md glass-panel relative p-8 rounded-3xl">
                    <h2 className="text-3xl font-extrabold text-white text-center mb-6 tracking-tight">Admin Login</h2>
                    {message && <p className="text-red-400 bg-red-500/20 border border-red-500/50 p-3 rounded-xl mb-4 font-body-md text-center">{message}</p>}
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div>
                            <label className="block mb-2 text-slate-400 font-bold text-sm">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-slate-400 font-bold text-sm">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <button type="submit" className="mt-2 w-full p-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-[0_4px_20px_rgba(79,70,229,0.4)] transition-all hover:bg-indigo-500 active:scale-95">
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const activeIssues = issues.filter(i => i.status !== 'Resolved');

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Desktop Top App Bar Area (Search/Profile) */}
            <div className="hidden md:flex justify-between items-center w-full px-margin-desktop py-4 sticky top-0 bg-[#0f131d]/80 backdrop-blur-md z-30 border-b border-white/5">
                <div className="font-headline-md text-headline-md text-on-surface">Admin Command View</div>
                <div className="flex items-center gap-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all" 
                            placeholder="Search incidents..." 
                            type="text"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-full hover:bg-white/10 transition-all text-slate-400"><Bell size={20}/></button>
                        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10 transition-all text-slate-400"><LogOut size={20}/></button>
                    </div>
                </div>
            </div>

            <div className="px-margin-mobile md:px-margin-desktop py-md md:py-lg flex flex-col gap-md max-w-5xl mx-auto w-full">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-sm gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Live Incident Feed</h2>
                        <p className="text-slate-400">Real-time triage and resolution queue for civic anomalies.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Filter size={14}/> Filter
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <ArrowUpDown size={14}/> Sort: Priority
                        </button>
                        <button className="md:hidden px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                {message && <p className="text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-xl mb-2 font-medium">{message}</p>}

                {/* Feed Container */}
                <div className="flex flex-col gap-sm pb-10">
                    {activeIssues.length === 0 ? (
                        <div className="text-center py-16 glass-panel relative rounded-3xl border-dashed border-white/20">
                            <p className="text-slate-400 font-medium text-lg">No active issues currently reported.</p>
                        </div>
                    ) : (
                        activeIssues.map(issue => {
                            const isCritical = issue.severity === 'Critical';
                            const isMedium = issue.severity === 'Medium';
                            return (
                                <div key={issue._id} className="issue-row group flex flex-col md:flex-row gap-md p-md rounded-xl bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                                    <img 
                                        className="w-full md:w-32 h-32 md:h-24 object-cover rounded-lg border border-white/10 shrink-0" 
                                        src={issue.mediaUrl?.startsWith('/') ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${issue.mediaUrl}` : (issue.mediaUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b')} 
                                        alt={issue.category} 
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{issue.category}</h3>
                                                <div className="flex gap-2 items-center flex-wrap">
                                                    {issue.wardOrDistrict && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10 bg-white/5 text-slate-300">
                                                            {issue.wardOrDistrict}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 ml-2 font-mono">
                                                        {new Date(issue.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border ${
                                                isCritical ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' : 
                                                isMedium ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                                                'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                            }`}>
                                                {issue.severity}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2 mt-2 md:mt-0">{issue.aiDescription}</p>
                                    </div>
                                    <div className="flex items-center justify-end md:justify-center md:pl-md border-t md:border-t-0 md:border-l border-white/10 mt-4 md:mt-0 pt-4 md:pt-0 shrink-0">
                                        <button 
                                            className="w-full md:w-auto px-6 py-3 rounded-lg bg-white/5 border border-white/20 text-xs font-bold uppercase tracking-widest text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-2" 
                                            onClick={() => handleResolve(issue._id)}
                                        >
                                            <CheckCircle2 size={16} /> Resolve
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
