# Architecture Technique - Life OS

## Vue d'Ensemble

Life OS est une application desktop cross-platform construite avec Electron, utilisant une architecture modulaire et extensible.

---

## Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              LIFE OS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     INTERFACE UTILISATEUR                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │   React     │  │  TailwindCSS │  │  Electron  │               │  │
│  │  │ Components  │  │   Styling    │  │   Window   │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                     │
│                                   │ IPC                                 │
│                                   ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         CORE ENGINE                               │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │   Search    │  │    Sync     │  │   Plugin    │               │  │
│  │  │   Engine    │  │   Manager   │  │   System    │               │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │  │
│  │         │                │                │                       │  │
│  │  ┌──────┴────────────────┴────────────────┴──────┐               │  │
│  │  │                  Event Bus                     │               │  │
│  │  └──────┬────────────────┬────────────────┬──────┘               │  │
│  │         │                │                │                       │  │
│  │  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐               │  │
│  │  │  Indexer    │  │  Watcher    │  │   Queue     │               │  │
│  │  │  Worker     │  │  Service    │  │   Manager   │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                     │
│                                   ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │   SQLite    │  │ MeiliSearch │  │    File     │               │  │
│  │  │  Database   │  │    Index    │  │   Storage   │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                     │
│                                   ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        CONNECTORS                                 │  │
│  │                                                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │  Local  │ │ Google  │ │OneDrive │ │ Dropbox │ │  Gmail  │    │  │
│  │  │  Files  │ │  Drive  │ │         │ │         │ │         │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Structure des Dossiers

```
life-os/
├── package.json
├── electron.config.js
│
├── src/
│   ├── main/                    # Process Electron principal
│   │   ├── index.js            # Point d'entrée
│   │   ├── window.js           # Gestion fenêtres
│   │   ├── ipc.js              # Communication IPC
│   │   ├── tray.js             # System tray
│   │   └── updater.js          # Auto-update
│   │
│   ├── preload/                 # Scripts preload
│   │   └── index.js
│   │
│   ├── renderer/                # Interface React
│   │   ├── index.html
│   │   ├── index.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Search/
│   │   │   ├── FileList/
│   │   │   ├── Sidebar/
│   │   │   ├── Settings/
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── stores/              # État global (Zustand)
│   │   └── styles/
│   │
│   └── core/                    # Logique métier
│       ├── database/
│       │   ├── index.js
│       │   ├── schema.js
│       │   └── migrations/
│       │
│       ├── search/
│       │   ├── index.js
│       │   ├── meilisearch.js
│       │   └── semantic.js
│       │
│       ├── sync/
│       │   ├── index.js
│       │   ├── watcher.js
│       │   └── queue.js
│       │
│       ├── indexer/
│       │   ├── index.js
│       │   ├── extractors/
│       │   │   ├── pdf.js
│       │   │   ├── office.js
│       │   │   ├── image.js
│       │   │   └── text.js
│       │   └── ocr.js
│       │
│       ├── connectors/
│       │   ├── base.js
│       │   ├── local.js
│       │   ├── google-drive.js
│       │   ├── onedrive.js
│       │   └── dropbox.js
│       │
│       └── plugins/
│           ├── loader.js
│           ├── api.js
│           └── manager.js
│
├── plugins/                     # Plugins installés
│   ├── core/
│   └── community/
│
├── data/                        # Données utilisateur
│   ├── lifeos.db               # Base SQLite
│   ├── meilisearch/            # Index de recherche
│   ├── cache/                  # Cache fichiers
│   └── backups/                # Sauvegardes
│
└── resources/                   # Assets
    ├── icons/
    └── locales/
```

---

## Composants Principaux

### 1. Main Process (Electron)

Le process principal gère :
- Création des fenêtres
- Communication IPC
- Accès au système de fichiers
- Intégration système (tray, notifications)

```javascript
// src/main/index.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { initDatabase } = require('../core/database');
const { initSearch } = require('../core/search');
const { initSync } = require('../core/sync');
const { initPlugins } = require('../core/plugins');

app.whenReady().then(async () => {
    // Initialiser les services
    await initDatabase();
    await initSearch();
    await initSync();
    await initPlugins();

    // Créer la fenêtre
    createMainWindow();
});
```

### 2. Renderer Process (React)

L'interface utilisateur en React avec :
- Composants modulaires
- État global avec Zustand
- Styling avec TailwindCSS

```jsx
// src/renderer/App.jsx
import { useStore } from './stores';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/Search';
import { FileList } from './components/FileList';

export function App() {
    const { documents, search } = useStore();

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1">
                <SearchBar onSearch={search} />
                <FileList documents={documents} />
            </main>
        </div>
    );
}
```

### 3. Core Engine

La logique métier partagée :

```javascript
// src/core/index.js
class LifeOS {
    constructor() {
        this.db = new Database();
        this.search = new SearchEngine();
        this.sync = new SyncManager();
        this.indexer = new Indexer();
        this.plugins = new PluginManager();
        this.events = new EventEmitter();
    }

    async init() {
        await this.db.init();
        await this.search.init();
        await this.sync.init();
        await this.plugins.loadAll();

        // Démarrer la surveillance des fichiers
        this.sync.startWatching();
    }
}
```

---

## Communication IPC

### Renderer → Main

```javascript
// Renderer
const results = await window.api.search('facture 2024');

// Preload
contextBridge.exposeInMainWorld('api', {
    search: (query) => ipcRenderer.invoke('search', query),
    getDocument: (id) => ipcRenderer.invoke('get-document', id),
    // ...
});

// Main
ipcMain.handle('search', async (event, query) => {
    return await lifeos.search.query(query);
});
```

### Main → Renderer

```javascript
// Main
mainWindow.webContents.send('sync-progress', { current: 50, total: 100 });

// Preload
contextBridge.exposeInMainWorld('api', {
    onSyncProgress: (callback) => ipcRenderer.on('sync-progress', callback),
});

// Renderer
useEffect(() => {
    window.api.onSyncProgress((event, data) => {
        setProgress(data);
    });
}, []);
```

---

## Event Bus

Communication entre les services :

```javascript
class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
    }
}

// Usage
events.on('document:indexed', async (doc) => {
    // Mettre à jour l'index de recherche
    await search.index(doc);

    // Notifier l'interface
    mainWindow.webContents.send('document:indexed', doc);
});

events.on('document:deleted', async (docId) => {
    await search.remove(docId);
    await db.delete('documents', docId);
});
```

---

## Workers

Tâches lourdes en arrière-plan :

```javascript
// src/core/workers/indexer.worker.js
const { parentPort, workerData } = require('worker_threads');
const { extractText } = require('../indexer/extractors');

parentPort.on('message', async (file) => {
    try {
        const text = await extractText(file);
        parentPort.postMessage({ success: true, text });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
});
```

---

## Configuration

```javascript
// config/default.js
module.exports = {
    database: {
        path: './data/lifeos.db'
    },
    search: {
        host: 'http://localhost:7700',
        apiKey: null
    },
    sync: {
        watchDebounce: 1000,
        batchSize: 100
    },
    indexer: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        supportedTypes: ['pdf', 'docx', 'txt', 'md', 'jpg', 'png']
    },
    plugins: {
        directory: './plugins'
    }
};
```

---

## Sécurité

### Isolation des Processus

- Context Isolation activé
- Node Integration désactivé dans le renderer
- Preload script pour API sécurisée

```javascript
// electron.config.js
webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js'),
    sandbox: true
}
```

### Stockage Sécurisé

- Credentials dans le keychain système
- Base de données chiffrée (optionnel)
- Pas de données sensibles en clair

---

## Performance

### Optimisations

1. **Lazy Loading** - Chargement des composants à la demande
2. **Virtual Lists** - Listes virtualisées pour grands datasets
3. **Web Workers** - Tâches lourdes hors du main thread
4. **Caching** - Cache mémoire et disque
5. **Debouncing** - Limitation des appels fréquents

### Métriques Cibles

| Métrique | Objectif |
|----------|----------|
| Démarrage app | < 2s |
| Recherche | < 100ms |
| Indexation fichier | < 500ms |
| Mémoire au repos | < 200MB |

---

## Tests

```javascript
// tests/search.test.js
describe('SearchEngine', () => {
    it('should find documents by content', async () => {
        await search.index({ id: '1', content: 'facture client' });
        const results = await search.query('facture');
        expect(results).toHaveLength(1);
    });

    it('should handle typos', async () => {
        await search.index({ id: '1', content: 'document' });
        const results = await search.query('docuemnt');
        expect(results).toHaveLength(1);
    });
});
```

---

## Déploiement

### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Auto-Update

```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-ready');
});
```
