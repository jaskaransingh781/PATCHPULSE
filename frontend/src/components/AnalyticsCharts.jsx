import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PieChart as PieChartIcon, BarChart as BarChartIcon, Activity, TrendingUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f43f5e'];

const AnalyticsCharts = () => {
  const { issues, isLoading } = useStore();

  const data = useMemo(() => {
    if (!issues || issues.length === 0) return null;

    const byCategory = {};
    const bySeverity = {};
    const byStatus = {};

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let recentOpen = 0;
    let oldOpen = 0;
    
    let recentResolved = 0;
    let oldResolved = 0;

    let totalResolutionTimeMs = 0;
    let resolvedIssuesWithDates = 0;
    let totalOpen = 0;
    let totalResolved = 0;
    let criticalCount = 0;

    issues.forEach(issue => {
      const cat = issue.category || 'Uncategorized';
      const sev = issue.severity || 'Unknown';
      const stat = issue.status || 'Pending';

      byCategory[cat] = (byCategory[cat] || 0) + 1;
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      byStatus[stat] = (byStatus[stat] || 0) + 1;

      const createdAt = new Date(issue.createdAt);
      const isOpen = issue.status !== 'Resolved';

      if (isOpen) {
        totalOpen++;
        if (sev === 'Critical') criticalCount++;
        if (createdAt >= sevenDaysAgo) recentOpen++;
        else if (createdAt >= fourteenDaysAgo) oldOpen++;
      } else {
        totalResolved++;
        if (issue.resolvedAt || issue.updatedAt) {
          const resolvedAt = new Date(issue.resolvedAt || issue.updatedAt);
          totalResolutionTimeMs += (resolvedAt.getTime() - createdAt.getTime());
          resolvedIssuesWithDates++;
          
          if (resolvedAt >= sevenDaysAgo) recentResolved++;
          else if (resolvedAt >= fourteenDaysAgo) oldResolved++;
        }
      }
    });

    const formatData = (obj) => Object.entries(obj).map(([name, value]) => ({ name, value }));

    // Calculate trends
    const calcTrend = (recent, old) => {
      if (old === 0) return recent > 0 ? 100 : 0;
      return Math.round(((recent - old) / old) * 100);
    };

    const openTrend = calcTrend(recentOpen, oldOpen);
    const resolvedTrend = calcTrend(recentResolved, oldResolved);

    // Calculate average resolution time in days
    const avgResTimeDays = resolvedIssuesWithDates > 0 
      ? (totalResolutionTimeMs / resolvedIssuesWithDates) / (1000 * 60 * 60 * 24)
      : 0;

    return {
      totalIssues: issues.length,
      openIssues: totalOpen,
      criticalCount: criticalCount,
      resolvedIssues: totalResolved,
      avgResolutionDays: avgResTimeDays.toFixed(1),
      openTrend,
      resolvedTrend,
      byCategory: formatData(byCategory),
      bySeverity: formatData(bySeverity),
      byStatus: formatData(byStatus),
    };
  }, [issues]);

  if (isLoading && !data) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-slate-400 py-10">No analytics data available.</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="p-6 md:p-12 md:pl-24 max-w-7xl mx-auto space-y-10 w-full animate-in fade-in duration-700 pb-28 md:pb-12">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Command Analytics</h1>
          <p className="text-slate-400 mt-2 text-lg">Real-time civic infrastructure performance metrics.</p>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            label="Active Critical Alerts" 
            value={data.criticalCount} 
            change={`${data.openTrend >= 0 ? '+' : ''}${data.openTrend}%`} 
            trend={data.openTrend <= 0 ? 'up' : 'down'} 
            icon={<AlertCircle className="text-rose-400" />} 
            color="rose"
          />
          <MetricCard 
            label="Avg. Resolution Time" 
            value={`${data.avgResolutionDays} days`} 
            change="-8%" 
            trend="up" 
            icon={<Clock className="text-indigo-400" />} 
            color="indigo"
          />
          <MetricCard 
            label="Total Resolved" 
            value={data.resolvedIssues} 
            change={`${data.resolvedTrend >= 0 ? '+' : ''}${data.resolvedTrend}%`} 
            trend={data.resolvedTrend >= 0 ? 'up' : 'down'} 
            icon={<CheckCircle2 className="text-emerald-400" />} 
            color="emerald"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Issues by Category */}
          <ChartContainer title="Issues by Category" icon={<PieChartIcon size={20} />}>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={data.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: '#fff' }} 
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* System Resolution Efficiency */}
          <ChartContainer title="Volume by Severity" icon={<BarChartIcon size={20} />}>
            <div className="h-[300px] w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.bySeverity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: '#fff' }} 
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" name="Issues" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                    {data.bySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#4f46e5'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-6 border-t border-white/5">
              <Activity size={16} className="text-indigo-400" />
              <span className="text-xs text-slate-400 leading-relaxed">
                Detection rates are up <span className="text-indigo-300 font-bold">14%</span> this week due to increased AI sweep frequency.
              </span>
            </div>
          </ChartContainer>

        </div>
      </div>
    </div>
  );
};

// Extracted from the mockup
const MetricCard = ({ label, value, change, trend, icon, color }) => (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:bg-white/10 transition-colors group">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend === 'up' ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
        {change}
      </div>
    </div>
    <div className="mt-6">
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold mt-1 tracking-tight text-white">{value}</p>
    </div>
  </div>
);

const ChartContainer = ({ title, icon, children }) => (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] flex flex-col">
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2 bg-white/5 rounded-xl text-slate-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

export default AnalyticsCharts;
