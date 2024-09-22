// projectManagement.js
import { AppState } from './appState.js';

export const ProjectManagement = {
    addProject(name, description) {
        const newProject = {
            id: Date.now().toString(),
            name,
            description,
            createdAt: new Date().toISOString()
        };
        AppState.addProject(newProject);
    },

    getProjects() {
        return AppState.projects;
    },

    updateProject(projectId, updates) {
        const projectIndex = AppState.projects.findIndex(project => project.id === projectId);
        if (projectIndex !== -1) {
            AppState.projects[projectIndex] = { ...AppState.projects[projectIndex], ...updates };
            AppState.setProjects(AppState.projects);
        }
    },

    deleteProject(projectId) {
        AppState.projects = AppState.projects.filter(project => project.id !== projectId);
        AppState.setProjects(AppState.projects);
    }
};