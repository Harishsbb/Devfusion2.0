import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import useWorkspaceStore from '../../store/workspaceStore';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your workspaces' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account' },
};

export default function AppLayout() {
  const { fetchWorkspaces } = useWorkspaceStore();
  const location = useLocation();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNotif = (notif) => {
      toast(notif.message, { icon: '🔔', duration: 4000 });
    };
    socket.on('notification:new', handleNotif);
    return () => socket.off('notification:new', handleNotif);
  }, []);

  const pathInfo = Object.entries(pageTitles).find(([path]) => location.pathname === path);
  const { title = 'DevCollab', subtitle = '' } = pathInfo?.[1] || {};

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob w-96 h-96 bg-indigo-600 -top-32 -left-32" />
        <div className="blob w-80 h-80 bg-purple-600 top-1/2 -right-20 animation-delay-400" />
        <div className="blob w-64 h-64 bg-pink-600 bottom-0 left-1/4 animation-delay-600" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            className="h-full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
