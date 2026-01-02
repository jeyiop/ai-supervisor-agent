/**
 * AI Supervisor Agent - Application Electron
 * Point d'entrée principal
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Configuration persistante
const store = new Store();

// Variables globales
let mainWindow;
let tray;

// Créer la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'AI Supervisor',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        // Style moderne
        backgroundColor: '#1a1a2e',
        show: false
    });

    // Charger l'interface
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    // Afficher quand c'est prêt
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Gérer la fermeture (minimiser dans le tray)
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// Créer l'icône dans la barre système
function createTray() {
    try {
        const iconPath = path.join(__dirname, '../assets/icon.png');
        tray = new Tray(iconPath);
    } catch (e) {
        // Si pas d'icône, créer un tray sans icône
        console.log('Icône non trouvée, tray simplifié');
        return;
    }

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Ouvrir AI Supervisor', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'ChatGPT', click: () => sendToRenderer('switch-model', 'chatgpt') },
        { label: 'Claude', click: () => sendToRenderer('switch-model', 'claude') },
        { label: 'Perplexity', click: () => sendToRenderer('switch-model', 'perplexity') },
        { label: 'Gemini', click: () => sendToRenderer('switch-model', 'gemini') },
        { type: 'separator' },
        { label: 'Quitter', click: () => {
            app.isQuitting = true;
            app.quit();
        }}
    ]);

    tray.setToolTip('AI Supervisor');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow.show());
}

// Envoyer un message à l'interface
function sendToRenderer(channel, data) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(channel, data);
    }
}

// === Communication avec l'interface ===

// Paramètres
ipcMain.handle('get-settings', () => {
    return store.get('settings', {
        theme: 'dark',
        defaultModel: 'chatgpt',
        autoSaveToNotion: false
    });
});

ipcMain.handle('save-settings', (event, settings) => {
    store.set('settings', settings);
    return true;
});

// Conversations
ipcMain.handle('get-conversations', () => {
    return store.get('conversations', []);
});

ipcMain.handle('save-conversation', (event, conversation) => {
    const conversations = store.get('conversations', []);
    conversations.unshift(conversation);
    store.set('conversations', conversations.slice(0, 100));
    return true;
});

// === Démarrage ===

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

console.log('AI Supervisor Agent - Démarré');
