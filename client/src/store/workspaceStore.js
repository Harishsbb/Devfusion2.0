import { create } from 'zustand';
import { workspaceAPI, projectAPI } from '../lib/api';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const data = await workspaceAPI.getAll();
      set({ workspaces: data.workspaces, isLoading: false });
      if (data.workspaces.length > 0 && !get().currentWorkspace) {
        set({ currentWorkspace: data.workspaces[0] });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createWorkspace: async (workspaceData) => {
    const data = await workspaceAPI.create(workspaceData);
    set(state => ({ workspaces: [data.workspace, ...state.workspaces] }));
    return data.workspace;
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace, projects: [] });
  },

  fetchProjects: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const data = await projectAPI.getAll(workspaceId);
      set({ projects: data.projects, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createProject: async (workspaceId, projectData) => {
    const data = await projectAPI.create(workspaceId, projectData);
    set(state => ({ projects: [data.project, ...state.projects] }));
    return data.project;
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  updateProject: async (workspaceId, projectId, updates) => {
    const data = await projectAPI.update(workspaceId, projectId, updates);
    set(state => ({
      projects: state.projects.map(p => p._id === projectId ? data.project : p),
      currentProject: state.currentProject?._id === projectId ? data.project : state.currentProject,
    }));
    return data.project;
  },

  deleteProject: async (workspaceId, projectId) => {
    await projectAPI.delete(workspaceId, projectId);
    set(state => ({
      projects: state.projects.filter(p => p._id !== projectId),
      currentProject: state.currentProject?._id === projectId ? null : state.currentProject,
    }));
  },
}));

export default useWorkspaceStore;
