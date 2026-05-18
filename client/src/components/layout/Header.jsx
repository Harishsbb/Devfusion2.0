import { useState, useRef, useEffect } from 'react';
import { applyTheme } from '../../lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Sun, Moon, Plus, X, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { notificationAPI } from '../../lib/api';
import Avatar from '../ui/Avatar';
import { timeAgo } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const notifIcons = {
  task_assigned: '📋',
  task_completed: '✅',
  task_commented: '💬',
  mention: '@',
  task_moved: '🔀',
  workspace_invite: '🤝',
  ai_suggestion: '🤖',
};

export default function Header({ title, subtitle }) {
  const { user } = useAuthStore();
  const [theme, setTheme] = useState(() => localStorage.getItem('devcollab_theme') || 'dark');
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem('devcollab_theme') || 'dark');
    };
    syncTheme();
    window.addEventListener('storage', syncTheme);
    const interval = setInterval(syncTheme, 800);
    return () => {
      window.removeEventListener('storage', syncTheme);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-white/[0.06] bg-gray-900/50 backdrop-blur-xl sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Quick search..."
            className="w-52 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <motion.span
                className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] h-[18px] px-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                className="absolute right-0 top-12 w-80 glass-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-none">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => handleMarkRead(n._id)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                      >
                        <span className="text-lg flex-shrink-0">{notifIcons[n.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <button onClick={() => navigate('/settings')}>
          <Avatar user={user} size="sm" showOnline className="cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all" />
        </button>
      </div>
    </header>
  );
}
