import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import { initAppearance } from './lib/theme';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const SnippetsPage = lazy(() => import('./pages/SnippetsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AIPage = lazy(() => import('./pages/AIPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const MeetingRoomPage = lazy(() => import('./pages/MeetingRoomPage'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
    initAppearance();
  }, [initAuth]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workspace/:workspaceId" element={<WorkspacePage />} />
          <Route path="workspace/:workspaceId/project/:projectId" element={<ProjectPage />} />
          <Route path="workspace/:workspaceId/project/:projectId/board" element={<KanbanPage />} />
          <Route path="workspace/:workspaceId/project/:projectId/docs" element={<DocumentsPage />} />
          <Route path="workspace/:workspaceId/snippets" element={<SnippetsPage />} />
          <Route path="workspace/:workspaceId/analytics" element={<AnalyticsPage />} />
          <Route path="workspace/:workspaceId/ai" element={<AIPage />} />
          <Route path="workspace/:workspaceId/meetings" element={<MeetingsPage />} />
          <Route path="workspace/:workspaceId/meetings/:meetingId" element={<MeetingRoomPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
