import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devcollab_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('devcollab_token');
      localStorage.removeItem('devcollab_user');
      localStorage.removeItem('devcollab_auth');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  create: (data) => api.post('/workspaces', data),
  get: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  getStats: (id) => api.get(`/workspaces/${id}/stats`),
  inviteMember: (id, data) => api.post(`/workspaces/${id}/invite`, data),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`),
};

export const projectAPI = {
  getAll: (workspaceId) => api.get(`/workspaces/${workspaceId}/projects`),
  create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/projects`, data),
  get: (workspaceId, id) => api.get(`/workspaces/${workspaceId}/projects/${id}`),
  update: (workspaceId, id, data) => api.put(`/workspaces/${workspaceId}/projects/${id}`, data),
  delete: (workspaceId, id) => api.delete(`/workspaces/${workspaceId}/projects/${id}`),
  getActivity: (workspaceId, id) => api.get(`/workspaces/${workspaceId}/projects/${id}/activity`),
};

export const taskAPI = {
  getAll: (workspaceId, projectId, params) => api.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, { params }),
  create: (workspaceId, projectId, data) => api.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, data),
  get: (workspaceId, projectId, id) => api.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}`),
  update: (workspaceId, projectId, id, data) => api.put(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}`, data),
  delete: (workspaceId, projectId, id) => api.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}`),
  addComment: (workspaceId, projectId, id, data) => api.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${id}/comments`, data),
  reorder: (workspaceId, projectId, data) => api.put(`/workspaces/${workspaceId}/projects/${projectId}/tasks/reorder`, data),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const snippetAPI = {
  getAll: (workspaceId, params) => api.get(`/workspaces/${workspaceId}/snippets`, { params }),
  create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/snippets`, data),
  get: (workspaceId, id) => api.get(`/workspaces/${workspaceId}/snippets/${id}`),
  update: (workspaceId, id, data) => api.put(`/workspaces/${workspaceId}/snippets/${id}`, data),
  delete: (workspaceId, id) => api.delete(`/workspaces/${workspaceId}/snippets/${id}`),
  copy: (workspaceId, id) => api.post(`/workspaces/${workspaceId}/snippets/${id}/copy`),
};

export const documentAPI = {
  getAll: (workspaceId, projectId) => api.get(`/workspaces/${workspaceId}/projects/${projectId}/documents`),
  create: (workspaceId, projectId, data) => api.post(`/workspaces/${workspaceId}/projects/${projectId}/documents`, data),
  get: (workspaceId, projectId, id) => api.get(`/workspaces/${workspaceId}/projects/${projectId}/documents/${id}`),
  update: (workspaceId, projectId, id, data) => api.put(`/workspaces/${workspaceId}/projects/${projectId}/documents/${id}`, data),
  delete: (workspaceId, projectId, id) => api.delete(`/workspaces/${workspaceId}/projects/${projectId}/documents/${id}`),
};

export const aiAPI = {
  breakdown: (data) => api.post('/ai/breakdown', data),
  standup: (data) => api.post('/ai/standup', data),
  summary: (projectId) => api.get(`/ai/summary/${projectId}`),
  codeReview: (data) => api.post('/ai/code-review', data),
  blockers: (projectId) => api.get(`/ai/blockers/${projectId}`),
  chat: (data) => api.post('/ai/chat', data),
};

export const analyticsAPI = {
  getWorkspace: (workspaceId) => api.get(`/analytics/${workspaceId}`),
  getContributions: (workspaceId) => api.get(`/analytics/${workspaceId}/contributions`),
};

export default api;
