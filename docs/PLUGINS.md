# Système de Plugins - Life OS

## Concept

Le système de plugins permet d'étendre Life OS avec n'importe quelle fonctionnalité. Chaque plugin est un module indépendant qui peut :

- Ajouter de nouveaux connecteurs (services, APIs)
- Créer des automatisations
- Étendre l'interface
- Traiter des types de fichiers spécifiques

---

## Architecture des Plugins

```
plugins/
├── core/                    # Plugins intégrés
│   ├── local-files/        # Fichiers locaux
│   ├── google-drive/       # Google Drive
│   ├── onedrive/           # OneDrive
│   └── dropbox/            # Dropbox
│
├── community/              # Plugins communautaires
│   ├── philips-hue/        # Contrôle Philips Hue
│   ├── spotify/            # Historique Spotify
│   ├── notion-sync/        # Sync Notion
│   └── ...
│
└── custom/                 # Vos plugins personnels
```

---

## Structure d'un Plugin

```javascript
// plugins/mon-plugin/index.js
module.exports = {
    // Métadonnées
    name: 'mon-plugin',
    version: '1.0.0',
    description: 'Description du plugin',
    author: 'Votre nom',

    // Hooks disponibles
    hooks: {
        // Au démarrage de l'app
        onInit: async (context) => {
            console.log('Plugin initialisé');
        },

        // Quand un fichier est indexé
        onFileIndexed: async (file, context) => {
            // Traitement personnalisé
        },

        // Quand une recherche est effectuée
        onSearch: async (query, results, context) => {
            // Modifier ou enrichir les résultats
        },

        // Interface utilisateur
        renderPanel: (context) => {
            return '<div>Mon panneau personnalisé</div>';
        }
    },

    // Commandes ajoutées
    commands: {
        'mon-commande': async (args, context) => {
            // Exécuter une action
        }
    },

    // Configuration
    defaultConfig: {
        enabled: true,
        option1: 'valeur'
    }
};
```

---

## Exemples de Plugins

### Plugin Philips Hue

```javascript
// plugins/philips-hue/index.js
const hue = require('node-hue-api');

module.exports = {
    name: 'philips-hue',
    version: '1.0.0',
    description: 'Contrôle vos lampes Philips Hue',

    hooks: {
        onInit: async (context) => {
            // Découvrir le bridge Hue
            const bridges = await hue.discovery.nupnpSearch();
            context.store.set('hueBridge', bridges[0]);
        }
    },

    commands: {
        'hue:on': async (args, context) => {
            // Allumer les lumières
        },
        'hue:off': async (args, context) => {
            // Éteindre les lumières
        },
        'hue:scene': async (args, context) => {
            // Appliquer une scène
        },
        'hue:color': async (args, context) => {
            // Changer la couleur
        }
    },

    // Automatisations
    automations: {
        // Allumer les lumières quand vous ouvrez un projet
        'project-opened': async (project, context) => {
            const color = project.category === 'work' ? 'focus' : 'relax';
            await context.commands.run('hue:scene', { scene: color });
        }
    }
};
```

### Plugin Capture d'Écran

```javascript
// plugins/screenshot-capture/index.js
const screenshot = require('screenshot-desktop');

module.exports = {
    name: 'screenshot-capture',
    version: '1.0.0',
    description: 'Capture automatique d\'écran',

    hooks: {
        onInit: async (context) => {
            // Démarrer la capture périodique si activée
            if (context.config.autoCapture) {
                setInterval(() => this.capture(context), context.config.interval);
            }
        }
    },

    commands: {
        'screenshot:capture': async (args, context) => {
            const img = await screenshot();
            const path = `screenshots/${Date.now()}.png`;
            await context.fs.write(path, img);
            await context.indexer.index(path);
            return { success: true, path };
        }
    },

    defaultConfig: {
        autoCapture: false,
        interval: 300000 // 5 minutes
    }
};
```

### Plugin Historique Navigateur

```javascript
// plugins/browser-history/index.js
module.exports = {
    name: 'browser-history',
    version: '1.0.0',
    description: 'Indexe votre historique de navigation',

    hooks: {
        onInit: async (context) => {
            // Surveiller les changements dans l'historique
            await this.watchBrowserHistory(context);
        }
    },

    methods: {
        async watchBrowserHistory(context) {
            // Chrome
            const chromePath = process.env.LOCALAPPDATA +
                '/Google/Chrome/User Data/Default/History';

            // Firefox
            const firefoxPath = process.env.APPDATA +
                '/Mozilla/Firefox/Profiles/*/places.sqlite';

            // Indexer l'historique
        },

        async indexHistory(entries, context) {
            for (const entry of entries) {
                await context.db.insert('browser_history', {
                    url: entry.url,
                    title: entry.title,
                    visitTime: entry.visitTime,
                    browser: entry.browser
                });
            }
        }
    }
};
```

---

## API pour les Plugins

### Context Object

Chaque plugin reçoit un objet `context` avec :

```javascript
context = {
    // Base de données
    db: {
        query: (sql, params) => {},
        insert: (table, data) => {},
        update: (table, data, where) => {},
        delete: (table, where) => {}
    },

    // Système de fichiers
    fs: {
        read: (path) => {},
        write: (path, content) => {},
        exists: (path) => {},
        list: (path) => {}
    },

    // Indexeur
    indexer: {
        index: (path) => {},
        search: (query) => {},
        remove: (path) => {}
    },

    // Configuration
    config: {},

    // Store persistant
    store: {
        get: (key) => {},
        set: (key, value) => {}
    },

    // Notifications
    notify: (title, body) => {},

    // Exécuter d'autres commandes
    commands: {
        run: (command, args) => {},
        list: () => {}
    },

    // Logger
    log: {
        info: (msg) => {},
        warn: (msg) => {},
        error: (msg) => {}
    }
};
```

---

## Installation de Plugins

### Via l'interface

1. Ouvrir Life OS
2. Aller dans Paramètres > Plugins
3. Cliquer "Installer un plugin"
4. Chercher ou glisser-déposer

### Via la ligne de commande

```bash
# Installer un plugin communautaire
lifeos plugin install philips-hue

# Installer depuis un fichier
lifeos plugin install ./mon-plugin.zip

# Lister les plugins
lifeos plugin list

# Désactiver un plugin
lifeos plugin disable philips-hue
```

---

## Créer votre propre Plugin

### 1. Créer la structure

```bash
mkdir plugins/custom/mon-plugin
cd plugins/custom/mon-plugin
npm init -y
```

### 2. Créer le fichier principal

```javascript
// index.js
module.exports = {
    name: 'mon-plugin',
    version: '1.0.0',
    // ... voir structure ci-dessus
};
```

### 3. Tester

```bash
lifeos plugin dev ./plugins/custom/mon-plugin
```

### 4. Publier (optionnel)

```bash
lifeos plugin publish
```

---

## Plugins Prévus

| Plugin | Description | Priorité |
|--------|-------------|----------|
| local-files | Indexation fichiers locaux | Haute |
| google-drive | Sync Google Drive | Haute |
| onedrive | Sync OneDrive | Haute |
| dropbox | Sync Dropbox | Moyenne |
| gmail | Indexation emails Gmail | Moyenne |
| outlook | Indexation emails Outlook | Moyenne |
| notion | Sync bidirectionnelle Notion | Moyenne |
| philips-hue | Contrôle lumières | Basse |
| spotify | Historique musique | Basse |
| browser-history | Historique navigation | Basse |
| screenshot | Captures d'écran | Basse |
| clipboard | Historique presse-papier | Basse |
