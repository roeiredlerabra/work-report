// appState.js
import { DateTime } from 'luxon';
import { StorageManager } from './storageManager.js';

export const AppState = {
    workLogs: [],
    currentDate: DateTime.now(),
    loggedInUser: null,
    projects: [],
    clients: [],
    
    setWorkLogs(logs) {
        this.workLogs = logs;
        StorageManager.setItem('workLogs', logs);
    },
    
    addWorkLog(log) {
        this.workLogs.push(log);
        this.setWorkLogs(this.workLogs);
    },
    
    updateWorkLog(id, updatedLog) {
        const index = this.workLogs.findIndex(log => log.id === id);
        if (index !== -1) {
            this.workLogs[index] = { ...this.workLogs[index], ...updatedLog };
            this.setWorkLogs(this.workLogs);
        }
    },
    
    deleteWorkLog(id) {
        this.workLogs = this.workLogs.filter(log => log.id !== id);
        this.setWorkLogs(this.workLogs);
    },
    
    setCurrentDate(date) {
        this.currentDate = date;
    },
    
    setLoggedInUser(user) {
        this.loggedInUser = user;
        StorageManager.setItem('loggedInUser', user);
    },
    
    clearLoggedInUser() {
        this.loggedInUser = null;
        StorageManager.removeItem('loggedInUser');
    },

    setProjects(projects) {
        this.projects = projects;
        StorageManager.setItem('projects', projects);
    },

    addProject(project) {
        this.projects.push(project);
        this.setProjects(this.projects);
    },

    setClients(clients) {
        this.clients = clients;
        StorageManager.setItem('clients', clients);
    },

    addClient(client) {
        this.clients.push(client);
        this.setClients(this.clients);
    }
};