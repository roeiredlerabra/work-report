// clientManagement.js
import { AppState } from './appState.js';

export const ClientManagement = {
    addClient(name, contactInfo) {
        const newClient = {
            id: Date.now().toString(),
            name,
            contactInfo,
            createdAt: new Date().toISOString()
        };
        AppState.addClient(newClient);
    },

    getClients() {
        return AppState.clients;
    },

    updateClient(clientId, updates) {
        const clientIndex = AppState.clients.findIndex(client => client.id === clientId);
        if (clientIndex !== -1) {
            AppState.clients[clientIndex] = { ...AppState.clients[clientIndex], ...updates };
            AppState.setClients(AppState.clients);
        }
    },

    deleteClient(clientId) {
        AppState.clients = AppState.clients.filter(client => client.id !== clientId);
        AppState.setClients(AppState.clients);
    }
};