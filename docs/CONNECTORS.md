# Connecteurs Cloud - Life OS

## Vue d'ensemble

Les connecteurs permettent à Life OS de se synchroniser avec tous vos services cloud. Chaque connecteur est un plugin spécialisé qui gère l'authentification et la synchronisation.

---

## Connecteurs Prévus

### Stockage Cloud

| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Fichiers Locaux** | Priorité 1 | Surveillance, indexation complète |
| **Google Drive** | Priorité 1 | Sync bidirectionnelle, partages |
| **OneDrive** | Priorité 1 | Sync bidirectionnelle, Office |
| **Dropbox** | Priorité 2 | Sync bidirectionnelle |
| **iCloud** | Priorité 3 | Lecture seule (limité) |
| **NAS/SMB** | Priorité 2 | Connexion réseau local |
| **S3/Minio** | Priorité 3 | Stockage objet |

### Email

| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Gmail** | Priorité 1 | Indexation, recherche, labels |
| **Outlook** | Priorité 1 | Indexation, recherche, dossiers |
| **IMAP générique** | Priorité 2 | Tout fournisseur email |

### Productivité

| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Notion** | Priorité 2 | Sync pages, bases de données |
| **Obsidian** | Priorité 2 | Sync vault (via fichiers) |
| **Evernote** | Priorité 3 | Import notes |
| **OneNote** | Priorité 3 | Import notes |
| **Todoist** | Priorité 3 | Sync tâches |
| **Trello** | Priorité 3 | Sync cartes |

### Communication

| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Slack** | Priorité 3 | Historique messages |
| **Discord** | Priorité 3 | Historique messages |
| **Teams** | Priorité 3 | Historique messages |
| **WhatsApp** | Priorité 4 | Export uniquement |
| **Telegram** | Priorité 4 | Historique messages |

### Calendrier

| Service | Statut | Fonctionnalités |
|---------|--------|-----------------|
| **Google Calendar** | Priorité 2 | Sync événements |
| **Outlook Calendar** | Priorité 2 | Sync événements |
| **CalDAV** | Priorité 3 | Standard ouvert |

---

## Architecture d'un Connecteur

```javascript
// connectors/google-drive/index.js
const { google } = require('googleapis');

class GoogleDriveConnector {
    constructor(config) {
        this.config = config;
        this.drive = null;
    }

    // === AUTHENTIFICATION ===

    async authenticate() {
        const oauth2Client = new google.auth.OAuth2(
            this.config.clientId,
            this.config.clientSecret,
            this.config.redirectUri
        );

        // Obtenir le token
        if (this.config.tokens) {
            oauth2Client.setCredentials(this.config.tokens);
        } else {
            // Démarrer le flow OAuth
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/drive.readonly']
            });
            // Ouvrir le navigateur...
        }

        this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    }

    // === LISTING ===

    async listFiles(folderId = 'root', pageToken = null) {
        const response = await this.drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            pageSize: 100,
            pageToken,
            fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents)'
        });

        return {
            files: response.data.files,
            nextPageToken: response.data.nextPageToken
        };
    }

    // === TÉLÉCHARGEMENT ===

    async downloadFile(fileId) {
        const response = await this.drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );
        return response.data;
    }

    // === SURVEILLANCE ===

    async watchChanges(startPageToken) {
        const response = await this.drive.changes.list({
            pageToken: startPageToken,
            fields: 'nextPageToken, newStartPageToken, changes(fileId, file, removed)'
        });

        return {
            changes: response.data.changes,
            newStartPageToken: response.data.newStartPageToken
        };
    }

    // === MÉTADONNÉES ===

    async getFileMetadata(fileId) {
        const response = await this.drive.files.get({
            fileId,
            fields: 'id, name, mimeType, modifiedTime, size, parents, webViewLink'
        });
        return response.data;
    }
}

module.exports = GoogleDriveConnector;
```

---

## Flow d'Authentification

### OAuth 2.0 (Google, Microsoft, Dropbox)

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Life OS │────▶│ Browser │────▶│ Service │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │  1. Open URL  │               │
     │──────────────▶│               │
     │               │  2. Login     │
     │               │──────────────▶│
     │               │               │
     │               │  3. Consent   │
     │               │◀──────────────│
     │               │               │
     │               │  4. Approve   │
     │               │──────────────▶│
     │               │               │
     │  5. Callback  │  6. Code      │
     │◀──────────────│◀──────────────│
     │               │               │
     │  7. Exchange code for tokens  │
     │──────────────────────────────▶│
     │                               │
     │  8. Access + Refresh tokens   │
     │◀──────────────────────────────│
```

---

## Synchronisation

### Stratégie de Sync

```javascript
class SyncEngine {
    constructor(connector, db, indexer) {
        this.connector = connector;
        this.db = db;
        this.indexer = indexer;
    }

    // Sync complète initiale
    async fullSync() {
        console.log('Démarrage sync complète...');

        // Lister tous les fichiers
        let pageToken = null;
        do {
            const { files, nextPageToken } = await this.connector.listFiles('root', pageToken);

            for (const file of files) {
                await this.processFile(file);
            }

            pageToken = nextPageToken;
        } while (pageToken);

        console.log('Sync complète terminée');
    }

    // Sync incrémentale
    async incrementalSync() {
        const startToken = await this.db.get('sync_token');
        const { changes, newStartPageToken } = await this.connector.watchChanges(startToken);

        for (const change of changes) {
            if (change.removed) {
                await this.removeFile(change.fileId);
            } else {
                await this.processFile(change.file);
            }
        }

        await this.db.set('sync_token', newStartPageToken);
    }

    // Traiter un fichier
    async processFile(file) {
        // Vérifier si mise à jour nécessaire
        const existing = await this.db.get(`file:${file.id}`);
        if (existing && existing.modifiedTime === file.modifiedTime) {
            return; // Pas de changement
        }

        // Télécharger si nécessaire pour l'indexation
        if (this.shouldDownload(file)) {
            const content = await this.connector.downloadFile(file.id);
            await this.indexer.index(file, content);
        }

        // Sauvegarder les métadonnées
        await this.db.set(`file:${file.id}`, {
            ...file,
            source: this.connector.name,
            syncedAt: Date.now()
        });
    }

    shouldDownload(file) {
        const indexableTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument',
            'text/',
            'image/'
        ];
        return indexableTypes.some(type => file.mimeType.startsWith(type));
    }
}
```

---

## Configuration des Connecteurs

### Interface Utilisateur

```
┌─────────────────────────────────────────────────────────┐
│                    Sources de Données                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  📁 Local       │  │  ☁️ Google Drive │              │
│  │  ✅ Connecté    │  │  ✅ Connecté     │              │
│  │  15,234 fichiers│  │  3,456 fichiers  │              │
│  │  [Configurer]   │  │  [Configurer]    │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  ☁️ OneDrive    │  │  ☁️ Dropbox     │              │
│  │  ⚪ Non connecté│  │  ⚪ Non connecté │              │
│  │                 │  │                  │              │
│  │  [Connecter]    │  │  [Connecter]     │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  [+ Ajouter une source]                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Fichier de Configuration

```json
{
  "connectors": {
    "local-files": {
      "enabled": true,
      "paths": [
        "C:\\Users\\jerem_07fes6p\\Documents",
        "C:\\Users\\jerem_07fes6p\\Desktop",
        "D:\\Projects"
      ],
      "exclude": [
        "**/node_modules/**",
        "**/.git/**",
        "**/.*"
      ],
      "watchChanges": true
    },
    "google-drive": {
      "enabled": true,
      "syncFolders": ["root"],
      "excludeFolders": ["Trash"],
      "syncInterval": 300000
    },
    "onedrive": {
      "enabled": false
    }
  }
}
```

---

## Gestion des Conflits

Quand un fichier existe dans plusieurs sources :

```javascript
const conflictStrategy = {
    // Garder le plus récent
    'newest': (files) => {
        return files.sort((a, b) => b.modifiedTime - a.modifiedTime)[0];
    },

    // Garder tous (avec suffixes)
    'keep-all': (files) => {
        return files.map((f, i) => ({
            ...f,
            name: i === 0 ? f.name : `${f.name} (${f.source})`
        }));
    },

    // Demander à l'utilisateur
    'ask': (files) => {
        // Afficher une boîte de dialogue
    }
};
```

---

## Sécurité

### Stockage des Credentials

```javascript
// Utilisation du keychain système
const keytar = require('keytar');

async function saveTokens(service, tokens) {
    await keytar.setPassword('lifeos', service, JSON.stringify(tokens));
}

async function getTokens(service) {
    const tokens = await keytar.getPassword('lifeos', service);
    return tokens ? JSON.parse(tokens) : null;
}
```

### Chiffrement Local

Les fichiers téléchargés peuvent être chiffrés au repos :

```javascript
const crypto = require('crypto');

function encrypt(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
}
```
