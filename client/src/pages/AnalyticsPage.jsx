import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Users, CheckCircle2, Target, Zap } from 'lucide-react';
import { analyticsAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-dark rounded-xl p-3 border border-white/10 shadow-xl text-sm">
      <p className="text-gray-300 font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>{entry.name}: <span className="font-bold">{entry.value}</span></p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { workspaceId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aData, cData] = await Promise.all([
          analyticsAPI.getWorkspace(workspaceId),
          analyticsAPI.getContributions(workspaceId),
        ]);
        setAnalytics(aData.analytics);
        setContributions(cData.contributions);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [workspaceId]);

  if (isLoading) return <div className="p-6"><DashboardSkeleton /></div>;
  if (!analytics) return null;

  const { overview, tasksByStatus, tasksByPriority, productivity } = analytics;

  const statusData = Object.entries(tasksByStatus || {}).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(tasksByPriority || {}).map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: 'Total Projects', value: overview.totalProjects, icon: Target, color: 'from-indigo-500 to-purple-600', change: '+2 this month' },
    { label: 'Completed Tasks', value: overview.completedTasks, icon: CheckCircle2, color: 'from-green-500 to-emerald-600', change: `${overview.completionRate}% rate` },
    { label: 'Total Tasks', value: overview.totalTasks, icon: BarChart3, color: 'from-yellow-500 to-orange-600', change: 'Across all projects' },
    { label: 'Team Velocity', value: `${Math.round(overview.completionRate)}%`, icon: Zap, color: 'from-pink-500 to-rose-600', change: '↑ 12% vs last week' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <BarChart3 className="text-indigo-400" /> Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track your team's productivity and project health</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="glass-dark rounded-2xl p-5 border border-white/[0.06]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-black text-white">{card.value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-600 mt-1">{card.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity */}
        <motion.div className="lg:col-span-2 glass-dark rounded-2xl p-5 border border-white/[0.06]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold text-white mb-4">Weekly Productivity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={productivity}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={2} fill="url(#colorCompleted)" />
              <Area type="monotone" dataKey="created" name="Created" stroke="#10b981" strokeWidth={2} fill="url(#colorCreated)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status pie */}
        <motion.div className="glass-dark rounded-2xl p-5 border border-white/[0.06]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold text-white mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-400 capitalize">{s.name}</span>
                </div>
                <span className="text-gray-300 font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Priority + Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority chart */}
        <motion.div className="glass-dark rounded-2xl p-5 border border-white/[0.06]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-semibold text-white mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Leaderboard */}
        <motion.div className="glass-dark rounded-2xl p-5 border border-white/[0.06]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-indigo-400" /> Team Leaderboard
          </h3>
          <div className="space-y-3">
            {contributions.map((c, i) => (
              <div key={c.user._id} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                  #{i + 1}
                </span>
                <Avatar user={c.user} size="sm" showOnline />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{c.user.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="text-green-400">{c.completedTasks} done</span>
                    <span className="text-blue-400">{c.inProgressTasks} in progress</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold gradient-text">{c.score} pts</div>
                </div>
              </div>
            ))}
            {contributions.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No contributions yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
