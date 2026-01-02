/**
 * AI Supervisor Agent - Preload Script
 * Pont sécurisé entre l'interface et le système
 */

const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées à l'interface
contextBridge.exposeInMainWorld('electronAPI', {
    // Paramètres
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // Conversations
    getConversations: () => ipcRenderer.invoke('get-conversations'),
    saveConversation: (conv) => ipcRenderer.invoke('save-conversation', conv),

    // Écouter les événements du main process
    onSwitchModel: (callback) => {
        ipcRenderer.on('switch-model', (event, model) => callback(model));
    },

    // Notifications
    showNotification: (title, body) => {
        new Notification(title, { body });
    }
});

// Exposer les infos de la plateforme
contextBridge.exposeInMainWorld('platform', {
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux'
});

console.log('Preload chargé');
