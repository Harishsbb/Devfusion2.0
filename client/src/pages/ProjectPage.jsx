import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trello, FileText, Code2, Activity, Settings, ArrowLeft, CheckCircle2, Clock, Users, Zap, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { projectAPI, taskAPI } from '../lib/api';
import useWorkspaceStore from '../store/workspaceStore';
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { formatDate, timeAgo, statusConfig } from '../lib/utils';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { joinProject } from '../lib/socket';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'board', label: 'Board', icon: Trello, link: 'board' },
  { id: 'docs', label: 'Docs', icon: FileText, link: 'docs' },
];

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const deleteProjectStore = useWorkspaceStore(state => state.deleteProject);

  useEffect(() => {
    const init = async () => {
      try {
        const [pData, tData] = await Promise.all([
          projectAPI.get(workspaceId, projectId),
          taskAPI.getAll(workspaceId, projectId),
        ]);
        setProject(pData.project);
        setTasks(tData.tasks);
        joinProject(projectId);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [workspaceId, projectId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this project and all of its tasks? This action cannot be undone.")) {
      try {
        setIsLoading(true);
        await deleteProjectStore(workspaceId, projectId);
        toast.success("Project deleted successfully");
        navigate(`/workspace/${workspaceId}`);
      } catch (err) {
        toast.error(err.message || "Failed to delete project");
        setIsLoading(false);
      }
    }
  };

  if (isLoading) return <div className="p-6"><DashboardSkeleton /></div>;
  if (!project) return <div className="p-6 text-center text-gray-400">Project not found</div>;

  const statuses = ['todo', 'inprogress', 'inreview', 'done'];
  const tasksByStatus = statuses.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s).length }), {});
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb + header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to={`/workspace/${workspaceId}`} className="hover:text-gray-300 flex items-center gap-1">
            <ArrowLeft size={14} /> Workspace
          </Link>
          <span>/</span>
          <span className="text-gray-300">{project.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0" style={{ background: project.color + '20', border: `1px solid ${project.color}40` }}>
              {project.emoji}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white">{project.name}</h1>
                <PriorityBadge priority={project.priority} />
                <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{project.status}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{project.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {project.dueDate && <span className="flex items-center gap-1"><Clock size={11} /> Due {formatDate(project.dueDate)}</span>}
                <span className="flex items-center gap-1"><Users size={11} /> {project.members?.length} members</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="px-4 py-2 border border-red-500/30 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium rounded-xl text-sm transition-all flex items-center gap-2">
              <Trash2 size={15} /> Delete Project
            </button>
            <Link to={`/workspace/${workspaceId}/project/${projectId}/board`} className="btn-primary flex items-center gap-2 text-sm">
              <Trello size={15} /> Open Board
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {[
          { label: 'Total Tasks', value: totalTasks, icon: '📋', color: 'text-blue-400' },
          { label: 'Completed', value: tasksByStatus.done, icon: '✅', color: 'text-green-400' },
          { label: 'In Progress', value: tasksByStatus.inprogress, icon: '⚡', color: 'text-yellow-400' },
          { label: 'Overdue', value: overdue, icon: '⚠️', color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-dark rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.icon}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Progress */}
      <motion.div className="glass-dark rounded-2xl p-5 border border-white/[0.06]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Project Progress</h3>
          <span className="text-indigo-400 font-bold text-lg">{progress}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {statuses.map(s => {
            const config = statusConfig[s];
            return (
              <div key={s} className={`text-center p-2 rounded-xl border ${config.bg} ${config.border}`}>
                <p className={`text-xl font-bold ${config.color}`}>{tasksByStatus[s]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{config.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Team + Recent tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team */}
        <motion.div className="glass-dark rounded-2xl p-5 border border-white/[0.06]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold text-white mb-4">Team</h3>
          <div className="space-y-3">
            {project.members?.map(m => (
              <div key={m.user._id} className="flex items-center gap-3">
                <Avatar user={m.user} size="sm" showOnline />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{m.user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{m.role}</p>
                </div>
                {m.user.isOnline && <span className="w-2 h-2 rounded-full bg-green-400" />}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <Link to={`/workspace/${workspaceId}/project/${projectId}/board`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Zap size={11} /> Quick actions <ExternalLink size={10} />
            </Link>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div className="glass-dark rounded-2xl p-5 border border-white/[0.06] lg:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Tasks</h3>
            <Link to={`/workspace/${workspaceId}/project/${projectId}/board`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View Board <ExternalLink size={10} />
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 6).map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 glass rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-green-400' : task.status === 'inprogress' ? 'bg-blue-400' : task.status === 'inreview' ? 'bg-purple-400' : 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
                {task.assignee && <Avatar user={task.assignee} size="xs" />}
              </div>
            ))}
          </div>
          {tasks.length > 6 && (
            <Link to={`/workspace/${workspaceId}/project/${projectId}/board`} className="block text-center text-xs text-indigo-400 hover:text-indigo-300 mt-3 pt-3 border-t border-white/5">
              View all {tasks.length} tasks
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
