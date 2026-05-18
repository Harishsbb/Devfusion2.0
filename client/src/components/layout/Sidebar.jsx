import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Zap, Code2, FileText, BarChart3,
  Settings, ChevronLeft, ChevronRight, Plus, Bell, Users, Sparkles,
  LogOut, ChevronDown,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useWorkspaceStore from '../../store/workspaceStore';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon: Icon, label, badge, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

  return (
    <Link to={to}>
      <motion.div
        className={cn('sidebar-item', isActive && 'active')}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon size={18} className={cn('flex-shrink-0', isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300')} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className="font-medium text-sm truncate flex-1"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {badge && !isCollapsed && (
          <span className="ml-auto bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {badge}
          </span>
        )}
      </motion.div>
    </Link>
  );
};

export default function Sidebar({ notificationCount = 0 }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { workspaceId } = useParams();
  const wid = workspaceId || currentWorkspace?._id;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const navItems = wid ? [
    { to: `/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `/workspace/${wid}`, icon: FolderKanban, label: 'Projects' },
    { to: `/workspace/${wid}/analytics`, icon: BarChart3, label: 'Analytics' },
    { to: `/workspace/${wid}/snippets`, icon: Code2, label: 'Snippets' },
    { to: `/workspace/${wid}/ai`, icon: Sparkles, label: 'AI Assistant' },
  ] : [
    { to: `/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
  ];

  return (
    <motion.aside
      className={cn('flex flex-col h-full bg-gray-900/95 border-r border-white/[0.06] relative transition-all duration-300', isCollapsed ? 'w-16' : 'w-64')}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]', isCollapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-glow border border-indigo-500/30">
          <img src="/logo.png" alt="DevCollab Logo" className="w-full h-full object-cover" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="font-bold text-white text-lg">DevCollab</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Workspace Switcher */}
      {!isCollapsed && currentWorkspace && (
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: currentWorkspace.color || '#6366f1' }}>
              <Users size={13} className="text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{currentWorkspace.name}</p>
              <p className="text-xs text-gray-500">{currentWorkspace.members?.length || 0} members</p>
            </div>
            <ChevronDown size={14} className={cn('text-gray-500 transition-transform', showWorkspaceMenu && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {showWorkspaceMenu && (
              <motion.div
                className="mt-1 space-y-0.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {workspaces.map(ws => (
                  <button
                    key={ws._id}
                    onClick={() => { setCurrentWorkspace(ws); setShowWorkspaceMenu(false); }}
                    className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors', ws._id === currentWorkspace._id ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-gray-400')}
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: ws.color || '#6366f1' }}>
                      <Users size={10} className="text-white" />
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} badge={item.to.includes('notifications') ? notificationCount : null} isCollapsed={isCollapsed} />
        ))}
        <div className="pt-2 border-t border-white/[0.06] mt-2">
          <NavItem to="/settings" icon={Settings} label="Settings" isCollapsed={isCollapsed} />
        </div>
      </nav>

      {/* User profile */}
      <div className={cn('px-3 py-4 border-t border-white/[0.06]', isCollapsed && 'px-2')}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 group cursor-pointer">
            <Avatar user={user} size="sm" showOnline />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-10 shadow-lg"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
