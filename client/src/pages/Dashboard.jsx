import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Users, CheckCircle2, Zap, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useWorkspaceStore from '../store/workspaceStore';
import { workspaceAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { formatDate, timeAgo } from '../lib/utils';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    className="glass-dark rounded-2xl p-5 border border-white/[0.06] card-hover"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
        <Icon size={20} className="text-white-fixed" />
      </div>
      <TrendingUp size={14} className="text-green-400" />
    </div>
    <p className="text-2xl font-black text-white mb-0.5">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </motion.div>
);

const ProjectCard = ({ project, workspaceId }) => (
  <Link to={`/workspace/${workspaceId}/project/${project._id}`}>
    <motion.div
      className="glass-dark rounded-2xl p-5 border border-white/[0.06] card-hover cursor-pointer group"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: project.color + '20', border: `1px solid ${project.color}40` }}>
          {project.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{project.name}</h3>
          <p className="text-xs text-gray-500 truncate">{project.description}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {project.status}
        </span>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress</span>
          <span>{project.completedTaskCount || 0}/{project.taskCount || 0} tasks</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: project.color || '#6366f1' }}
            initial={{ width: 0 }}
            animate={{ width: `${project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          {project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No deadline'}
        </div>
        <div className="flex items-center gap-1">
          <Users size={11} />
          {project.members?.length || 0} members
        </div>
      </div>
    </motion.div>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const { workspaces, currentWorkspace, fetchWorkspaces, fetchProjects, projects, createWorkspace, createProject } = useWorkspaceStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [wsForm, setWsForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', emoji: '🚀', color: '#6366f1', priority: 'medium' });

  useEffect(() => {
    const init = async () => {
      try {
        await fetchWorkspaces();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects(currentWorkspace._id);
      loadStats();
    }
  }, [currentWorkspace]);

  const loadStats = async () => {
    try {
      const data = await workspaceAPI.getStats(currentWorkspace._id);
      setStats(data.stats);
    } catch (_) {}
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      await createWorkspace(wsForm);
      setShowCreateWs(false);
      setWsForm({ name: '', description: '', color: '#6366f1' });
      toast.success('Workspace created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!currentWorkspace) return toast.error('Select a workspace first');
    try {
      await createProject(currentWorkspace._id, projectForm);
      setShowCreateProject(false);
      setProjectForm({ name: '', description: '', emoji: '🚀', color: '#6366f1', priority: 'medium' });
      toast.success('Project created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <div className="p-6"><DashboardSkeleton /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-black text-white">
            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1">Here's what's happening across your workspaces today.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateWs(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Workspace
          </button>
          {currentWorkspace && (
            <button onClick={() => setShowCreateProject(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects} color="bg-gradient-to-br from-indigo-500 to-purple-600" delay={0} />
          <StatCard icon={CheckCircle2} label="Tasks Completed" value={stats.completedTasks} sub={`of ${stats.totalTasks} total`} color="bg-gradient-to-br from-green-500 to-emerald-600" delay={0.05} />
          <StatCard icon={Users} label="Team Members" value={stats.totalMembers} color="bg-gradient-to-br from-pink-500 to-rose-600" delay={0.1} />
          <StatCard icon={Zap} label="Active Projects" value={stats.activeProjects} color="bg-gradient-to-br from-yellow-500 to-orange-600" delay={0.15} />
        </div>
      )}

      {/* Workspaces quick switch */}
      {workspaces.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Your Workspaces</h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            {workspaces.map(ws => (
              <Link key={ws._id} to={`/workspace/${ws._id}`}>
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${currentWorkspace?._id === ws._id ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'glass-dark border-white/5 text-gray-400 hover:border-white/20 hover:text-white'}`}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: ws.color || '#6366f1' }}>
                    <Users size={12} className="text-white-fixed" />
                  </div>
                  <span className="text-sm font-medium">{ws.name}</span>
                  <span className="text-xs opacity-60">{ws.members?.length}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Projects */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {currentWorkspace ? `Projects in ${currentWorkspace.name}` : 'Recent Projects'}
          </h2>
          {currentWorkspace && <Link to={`/workspace/${currentWorkspace._id}`} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">View all <ArrowRight size={14} /></Link>}
        </div>

        {projects.length === 0 && currentWorkspace ? (
          <div className="glass-dark rounded-2xl border border-white/[0.06] p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FolderKanban size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first project to get started</p>
            <button onClick={() => setShowCreateProject(true)} className="btn-primary">
              <Plus size={16} className="inline mr-1" /> Create Project
            </button>
          </div>
        ) : !currentWorkspace ? (
          <div className="glass-dark rounded-2xl border border-white/[0.06] p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Users size={28} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Create your first workspace</h3>
            <p className="text-gray-400 text-sm mb-6">A workspace brings your team and projects together</p>
            <button onClick={() => setShowCreateWs(true)} className="btn-primary">
              <Plus size={16} className="inline mr-1" /> Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project, i) => (
              <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                <ProjectCard project={project} workspaceId={currentWorkspace._id} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Workspace Modal */}
      <Modal isOpen={showCreateWs} onClose={() => setShowCreateWs(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Workspace Name *</label>
            <input value={wsForm.name} onChange={e => setWsForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. My Team" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea value={wsForm.description} onChange={e => setWsForm(p => ({ ...p, description: e.target.value }))} placeholder="What's this workspace for?" rows={2} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(c => (
                <button key={c} type="button" onClick={() => setWsForm(p => ({ ...p, color: c }))} className={`w-8 h-8 rounded-lg border-2 transition-all ${wsForm.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateWs(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Workspace</button>
          </div>
        </form>
      </Modal>

      {/* Create Project Modal */}
      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-16">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Icon</label>
              <input value={projectForm.emoji} onChange={e => setProjectForm(p => ({ ...p, emoji: e.target.value }))} className="input-field text-center text-xl" maxLength={2} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
              <input value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mobile App MVP" className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} placeholder="What are you building?" rows={2} className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
              <select value={projectForm.priority} onChange={e => setProjectForm(p => ({ ...p, priority: e.target.value }))} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
              <div className="flex gap-2 mt-2">
                {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
                  <button key={c} type="button" onClick={() => setProjectForm(p => ({ ...p, color: c }))} className={`w-7 h-7 rounded-lg border-2 transition-all ${projectForm.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateProject(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Project</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
