import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Plus, LogIn, Calendar, Clock, Users, BarChart2,
  Copy, Check, X, Search, ChevronRight, Mic, MicOff,
  Play, CalendarDays, Activity, Zap, Globe, Lock,
  Bell, MoreVertical, Trash2, Edit2, ExternalLink, Filter,
} from 'lucide-react';
import { meetingAPI, workspaceAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import useWorkspaceStore from '../store/workspaceStore';
import { getSocket } from '../lib/socket';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const now = new Date();
  const diff = date - now;
  if (Math.abs(diff) < 60000) return 'just now';
  if (diff > 0 && diff < 86400000) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diff > 0 && diff < 172800000) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (min) => {
  if (!min) return '—';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </motion.div>
  );
}

function MeetingCard({ meeting, onJoin, onDelete, currentUserId }) {
  const [showMenu, setShowMenu] = useState(false);
  const isOrganizer = meeting.organizer?._id === currentUserId;
  const isActive = meeting.status === 'active';
  const isScheduled = meeting.status === 'waiting' && meeting.type === 'scheduled';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 p-4"
    >
      {isActive && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? 'bg-green-500/20' : isScheduled ? 'bg-indigo-500/20' : 'bg-gray-500/20'
        }`}>
          <Video size={18} className={isActive ? 'text-green-400' : isScheduled ? 'text-indigo-400' : 'text-gray-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-100 truncate text-sm">{meeting.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[meeting.status] || statusColors.ended}`}>
              {isScheduled ? 'scheduled' : meeting.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {isActive ? 'In progress' : isScheduled ? formatDate(meeting.scheduledAt) : `Ended ${formatDate(meeting.endedAt)}`}
            {meeting.duration > 0 && ` · ${formatDuration(meeting.duration)}`}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {meeting.attendees?.slice(0, 4).map((a, i) => (
                <Avatar key={i} user={a.user} size="xs" className="ring-1 ring-gray-900" />
              ))}
              {meeting.attendees?.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[10px] text-gray-400">
                  +{meeting.attendees.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">{meeting.attendees?.length || 0} participants</span>
            {meeting.project && (
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {meeting.project.emoji} {meeting.project.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
        <span className="text-xs text-gray-600 font-mono flex-1">{meeting.meetingId}</span>
        {(isActive || isScheduled) && (
          <button
            onClick={() => onJoin(meeting)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
            }`}
          >
            <Play size={11} />
            {isActive ? 'Join' : 'Start'}
          </button>
        )}
        {isOrganizer && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 bottom-8 bg-gray-800 border border-white/10 rounded-xl shadow-xl p-1 min-w-[140px] z-20"
                >
                  <button
                    onClick={() => { onDelete(meeting._id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 text-xs text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ScheduleModal({ onClose, onSubmit, workspaceMembers, projects }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'scheduled',
    scheduledAt: '', invitees: [], project: '',
  });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Meeting title is required');
    if (form.type === 'scheduled' && !form.scheduledAt) return toast.error('Scheduled time is required');
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleInvitee = (userId) => {
    setForm(f => ({
      ...f,
      invitees: f.invitees.includes(userId)
        ? f.invitees.filter(id => id !== userId)
        : [...f.invitees, userId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-gray-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <div>
            <h2 className="font-semibold text-white">Schedule Meeting</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set up a meeting for your team</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handle} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Meeting Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Sprint Planning, Design Review..."
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What's this meeting about?"
              rows={2}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Scheduled Time *</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors [color-scheme:dark]"
            />
          </div>

          {projects?.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Link to Project</label>
              <select
                value={form.project}
                onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
              >
                <option value="">No project</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.emoji} {p.name}</option>
                ))}
              </select>
            </div>
          )}

          {workspaceMembers?.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                Invite Members ({form.invitees.length} selected)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {workspaceMembers.map(m => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => toggleInvitee(m._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${
                      form.invitees.includes(m._id)
                        ? 'bg-indigo-500/20 border border-indigo-500/30'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07]'
                    }`}
                  >
                    <Avatar user={m} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                    </div>
                    {form.invitees.includes(m._id) && <Check size={13} className="text-indigo-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-sm text-gray-400 hover:bg-white/[0.05] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function JoinModal({ onClose, onJoin }) {
  const [meetingCode, setMeetingCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    const code = meetingCode.trim().toUpperCase();
    if (!code) return toast.error('Enter a meeting ID');
    setLoading(true);
    try {
      await onJoin(code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-gray-900 border border-white/[0.1] rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Join Meeting</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Meeting ID</label>
            <input
              value={meetingCode}
              onChange={e => setMeetingCode(e.target.value.toUpperCase())}
              placeholder="e.g. DCM-A1B2C3"
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors tracking-wider"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-sm text-gray-400 hover:bg-white/[0.05] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function MeetingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useWorkspaceStore();

  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, scheduled: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [newMeetingLink, setNewMeetingLink] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mData, sData, wsData] = await Promise.all([
        meetingAPI.getAll(workspaceId),
        meetingAPI.getStats(workspaceId),
        workspaceAPI.get(workspaceId),
        projects.length === 0 ? fetchProjects(workspaceId) : Promise.resolve(),
      ]);
      setMeetings(mData.meetings || []);
      setStats(sData.stats || { total: 0, active: 0, scheduled: 0, completed: 0 });
      const members = wsData.workspace?.members?.map(m => m.user).filter(u => u?._id !== user?._id) || [];
      setWorkspaceMembers(members);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, user?._id, fetchProjects]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onCreated = ({ meeting }) => setMeetings(prev => [meeting, ...prev]);
    socket.on('meeting:created', onCreated);
    return () => socket.off('meeting:created', onCreated);
  }, []);

  const handleStartInstant = async () => {
    try {
      const data = await meetingAPI.create(workspaceId, {
        title: `${user.name}'s Meeting`,
        type: 'instant',
      });
      const link = `${window.location.origin}/workspace/${workspaceId}/meetings/${data.meeting._id}`;
      setNewMeetingLink(link);
      setMeetings(prev => [data.meeting, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1, active: prev.active + 1 }));
      toast.success('Meeting started!');
      navigate(`/workspace/${workspaceId}/meetings/${data.meeting._id}`);
    } catch {
      toast.error('Failed to start meeting');
    }
  };

  const handleSchedule = async (form) => {
    try {
      const data = await meetingAPI.create(workspaceId, {
        ...form,
        type: 'scheduled',
        invitees: form.invitees,
      });
      setMeetings(prev => [data.meeting, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1, scheduled: prev.scheduled + 1 }));
      toast.success('Meeting scheduled!');
    } catch {
      toast.error('Failed to schedule meeting');
      throw new Error();
    }
  };

  const handleJoinByCode = async (code) => {
    try {
      const data = await meetingAPI.getByMeetingId(workspaceId, code);
      if (!data.meeting) return toast.error('Meeting not found');
      navigate(`/workspace/${workspaceId}/meetings/${data.meeting._id}`);
      setShowJoin(false);
    } catch {
      toast.error('Meeting not found. Check the ID and try again.');
    }
  };

  const handleJoinMeeting = (meeting) => {
    navigate(`/workspace/${workspaceId}/meetings/${meeting._id}`);
  };

  const handleDelete = async (id) => {
    try {
      await meetingAPI.delete(workspaceId, id);
      setMeetings(prev => prev.filter(m => m._id !== id));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      toast.success('Meeting deleted');
    } catch {
      toast.error('Failed to delete meeting');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(newMeetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const filtered = meetings.filter(m => {
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.meetingId?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && m.status === 'active') ||
      (filter === 'scheduled' && m.status === 'waiting') ||
      (filter === 'ended' && m.status === 'ended') ||
      (filter === 'mine' && m.organizer?._id === user?._id);
    return matchSearch && matchFilter;
  });

  const upcoming = filtered.filter(m => m.status === 'waiting' || m.status === 'active').sort((a, b) => {
    if (a.status === 'active') return -1;
    if (b.status === 'active') return 1;
    return new Date(a.scheduledAt) - new Date(b.scheduledAt);
  });
  const recent = filtered.filter(m => m.status === 'ended').slice(0, 8);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Video size={18} className="text-indigo-400" />
            </div>
            Meetings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Video conferencing & collaboration hub</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-sm text-gray-300 hover:bg-white/[0.05] transition-colors"
          >
            <LogIn size={15} />
            Join
          </button>
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/40 text-sm text-indigo-300 hover:bg-indigo-500/10 transition-colors"
          >
            <Calendar size={15} />
            Schedule
          </button>
          <button
            onClick={handleStartInstant}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Video size={15} />
            New Meeting
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart2} label="Total Meetings" value={stats.total} color="bg-indigo-500/20 text-indigo-400" />
        <StatCard icon={Activity} label="Active Now" value={stats.active} color="bg-green-500/20 text-green-400" sub={stats.active > 0 ? 'Live' : 'None running'} />
        <StatCard icon={CalendarDays} label="Scheduled" value={stats.scheduled} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Check} label="Completed" value={stats.completed} color="bg-purple-500/20 text-purple-400" />
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          onClick={handleStartInstant}
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/50 text-left transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors">
            <Zap size={20} className="text-indigo-300" />
          </div>
          <div>
            <p className="font-semibold text-white">Start Instant Meeting</p>
            <p className="text-xs text-indigo-300/70 mt-0.5">Create and share link immediately</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowJoin(true)}
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-green-600/20 to-teal-600/10 border border-green-500/30 hover:border-green-500/50 text-left transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
            <LogIn size={20} className="text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Join with Meeting ID</p>
            <p className="text-xs text-green-300/70 mt-0.5">Enter a DCM code to join</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowSchedule(true)}
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 hover:border-blue-500/50 text-left transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
            <Calendar size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Schedule Meeting</p>
            <p className="text-xs text-blue-300/70 mt-0.5">Plan a future meeting with team</p>
          </div>
        </motion.button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {['all', 'active', 'scheduled', 'ended', 'mine'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming / Active */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Activity size={14} className="text-green-400" />
                Upcoming & Active
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">{upcoming.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {upcoming.map(m => (
                    <MeetingCard key={m._id} meeting={m} onJoin={handleJoinMeeting} onDelete={handleDelete} currentUserId={user?._id} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Clock size={14} />
                Recent Meetings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {recent.map(m => (
                    <MeetingCard key={m._id} meeting={m} onJoin={handleJoinMeeting} onDelete={handleDelete} currentUserId={user?._id} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Video size={28} className="text-indigo-400" />
              </div>
              <p className="text-gray-400 font-medium">No meetings found</p>
              <p className="text-gray-600 text-sm mt-1">Start a new meeting or schedule one for your team</p>
              <button
                onClick={handleStartInstant}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                <Plus size={15} /> Start Meeting
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showSchedule && (
          <ScheduleModal
            onClose={() => setShowSchedule(false)}
            onSubmit={handleSchedule}
            workspaceMembers={workspaceMembers}
            projects={projects}
          />
        )}
        {showJoin && (
          <JoinModal onClose={() => setShowJoin(false)} onJoin={handleJoinByCode} />
        )}
      </AnimatePresence>
    </div>
  );
}
