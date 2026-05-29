import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Users, BarChart3, Settings, Search, Grid, List, Clock, CheckCircle2 } from 'lucide-react';
import useWorkspaceStore from '../store/workspaceStore';
import { workspaceAPI } from '../lib/api';
import Modal from '../components/ui/Modal';
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import { PriorityBadge } from '../components/ui/Badge';
import { formatDate, timeAgo } from '../lib/utils';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { joinWorkspace } from '../lib/socket';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { projects, fetchProjects, createProject, currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', emoji: '🚀', color: '#6366f1', priority: 'medium', dueDate: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });

  useEffect(() => {
    const init = async () => {
      try {
        const data = await workspaceAPI.get(workspaceId);
        setWorkspace(data.workspace);
        setCurrentWorkspace(data.workspace);
        await fetchProjects(workspaceId);
        joinWorkspace(workspaceId);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [workspaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(workspaceId, projectForm);
      setShowCreateProject(false);
      setProjectForm({ name: '', description: '', emoji: '🚀', color: '#6366f1', priority: 'medium', dueDate: '' });
      toast.success('Project created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await workspaceAPI.inviteMember(workspaceId, inviteForm);
      setShowInvite(false);
      toast.success('Member invited!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="p-6"><DashboardSkeleton /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-glow" style={{ background: workspace?.color || '#6366f1' }}>
            <Users size={22} className="text-white-fixed" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{workspace?.name}</h1>
            <p className="text-gray-400 text-sm">{workspace?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInvite(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Users size={15} /> Invite
          </button>
          <button onClick={() => setShowCreateProject(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> New Project
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      {workspace && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-indigo-400' },
            { label: 'Members', value: workspace.members?.length, icon: Users, color: 'text-purple-400' },
            { label: 'Tasks Done', value: projects.reduce((a, p) => a + (p.completedTaskCount || 0), 0), icon: CheckCircle2, color: 'text-green-400' },
            { label: 'Active', value: projects.filter(p => p.status === 'active').length, icon: BarChart3, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="glass-dark rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {workspace?.members && (
        <div className="glass-dark rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Team Members</h3>
            <span className="text-xs text-gray-500">{workspace.members.length} members</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {workspace.members.map(m => (
              <div key={m.user._id} className="flex items-center gap-2.5 px-3 py-2 glass rounded-xl border border-white/5">
                <Avatar user={m.user} size="xs" showOnline />
                <div>
                  <p className="text-sm font-medium text-gray-200">{m.user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Projects</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div className="flex gap-1 glass rounded-lg p-1 border border-white/10">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-indigo-500' : 'hover:bg-white/5'} text-sm transition-colors`}><Grid size={14} /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-500' : 'hover:bg-white/5'} text-sm transition-colors`}><List size={14} /></button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-dark rounded-2xl border border-white/[0.06] p-12 text-center">
            <FolderKanban size={36} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No projects found</h3>
            <button onClick={() => setShowCreateProject(true)} className="btn-primary mt-4">
              <Plus size={16} className="inline mr-1" /> Create Project
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filtered.map((project, i) => (
              <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/workspace/${workspaceId}/project/${project._id}`}>
                  <div className={`glass-dark border border-white/[0.06] card-hover cursor-pointer group ${viewMode === 'grid' ? 'rounded-2xl p-5' : 'rounded-xl p-4 flex items-center gap-4'}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: project.color + '20' }}>
                              {project.emoji}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{project.name}</h3>
                              <PriorityBadge priority={project.priority} />
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{project.description}</p>
                        <div className="mb-3">
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ background: project.color || '#6366f1', width: `${project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>{project.completedTaskCount || 0}/{project.taskCount || 0} tasks</span>
                            <span>{project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <AvatarGroup users={project.members?.map(m => m.user) || []} max={3} size="xs" />
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock size={11} />
                            {project.dueDate ? formatDate(project.dueDate) : 'No deadline'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: project.color + '20' }}>{project.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{project.name}</h3>
                            <PriorityBadge priority={project.priority} />
                          </div>
                          <p className="text-xs text-gray-500 truncate">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-shrink-0">
                          <span>{project.completedTaskCount || 0}/{project.taskCount || 0} tasks</span>
                          <AvatarGroup users={project.members?.map(m => m.user) || []} max={3} size="xs" />
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project" size="md">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-16">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Icon</label>
              <input value={projectForm.emoji} onChange={e => setProjectForm(p => ({ ...p, emoji: e.target.value }))} className="input-field text-center text-xl" maxLength={2} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
              <input value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Landing Page Redesign" className="input-field" required />
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Due Date</label>
              <input type="date" value={projectForm.dueDate} onChange={e => setProjectForm(p => ({ ...p, dueDate: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'].map(c => (
                <button key={c} type="button" onClick={() => setProjectForm(p => ({ ...p, color: c }))} className={`w-8 h-8 rounded-lg border-2 transition-all ${projectForm.color === c ? 'border-white-fixed scale-110' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateProject(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Project</button>
          </div>
        </form>
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Member" size="sm">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} placeholder="teammate@company.com" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))} className="input-field">
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Send Invite</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
