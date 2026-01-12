# Base de Données - Life OS

## Vue d'ensemble

Life OS utilise SQLite comme base de données principale pour sa simplicité, sa portabilité et ses performances. Toutes vos données restent locales et sous votre contrôle.

---

## Schéma de la Base de Données

```sql
-- =====================================================
-- FICHIERS ET DOCUMENTS
-- =====================================================

CREATE TABLE documents (
    id TEXT PRIMARY KEY,

    -- Informations de base
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL,           -- pdf, docx, image, email, etc.
    mimeType TEXT,
    size INTEGER,

    -- Source
    source TEXT NOT NULL,         -- local, google-drive, onedrive, etc.
    sourceId TEXT,                -- ID dans le service source
    sourceUrl TEXT,               -- Lien vers le fichier original

    -- Contenu extrait
    content TEXT,                 -- Texte extrait pour la recherche
    contentHash TEXT,             -- Hash pour détecter les changements

    -- Métadonnées
    title TEXT,
    description TEXT,
    author TEXT,
    language TEXT,
    pageCount INTEGER,

    -- Organisation
    projectId TEXT REFERENCES projects(id),
    folderId TEXT REFERENCES folders(id),

    -- Timestamps
    createdAt INTEGER NOT NULL,
    modifiedAt INTEGER NOT NULL,
    indexedAt INTEGER,
    syncedAt INTEGER,

    -- Index
    UNIQUE(source, sourceId)
);

CREATE INDEX idx_documents_source ON documents(source);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_project ON documents(projectId);
CREATE INDEX idx_documents_modified ON documents(modifiedAt);

-- =====================================================
-- TAGS
-- =====================================================

CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    icon TEXT,
    createdAt INTEGER NOT NULL
);

CREATE TABLE document_tags (
    documentId TEXT REFERENCES documents(id) ON DELETE CASCADE,
    tagId TEXT REFERENCES tags(id) ON DELETE CASCADE,
    createdAt INTEGER NOT NULL,
    PRIMARY KEY (documentId, tagId)
);

CREATE INDEX idx_document_tags_doc ON document_tags(documentId);
CREATE INDEX idx_document_tags_tag ON document_tags(tagId);

-- =====================================================
-- PROJETS
-- =====================================================

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    status TEXT DEFAULT 'active',  -- active, archived, completed
    parentId TEXT REFERENCES projects(id),
    createdAt INTEGER NOT NULL,
    modifiedAt INTEGER NOT NULL
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_parent ON projects(parentId);

-- =====================================================
-- DOSSIERS VIRTUELS
-- =====================================================

CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parentId TEXT REFERENCES folders(id),
    projectId TEXT REFERENCES projects(id),
    isSmartFolder BOOLEAN DEFAULT FALSE,
    smartQuery TEXT,              -- Requête pour les smart folders
    createdAt INTEGER NOT NULL,
    modifiedAt INTEGER NOT NULL
);

CREATE INDEX idx_folders_parent ON folders(parentId);
CREATE INDEX idx_folders_project ON folders(projectId);

-- =====================================================
-- SOURCES DE DONNÉES
-- =====================================================

CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,           -- local, google-drive, onedrive, etc.
    name TEXT NOT NULL,
    config TEXT,                  -- JSON config
    enabled BOOLEAN DEFAULT TRUE,
    lastSync INTEGER,
    syncToken TEXT,
    status TEXT DEFAULT 'disconnected',
    error TEXT,
    createdAt INTEGER NOT NULL,
    modifiedAt INTEGER NOT NULL
);

-- =====================================================
-- ACTIVITÉ / HISTORIQUE
-- =====================================================

CREATE TABLE activity (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,           -- view, edit, search, create, delete
    documentId TEXT REFERENCES documents(id),
    query TEXT,                   -- Pour les recherches
    metadata TEXT,                -- JSON données additionnelles
    createdAt INTEGER NOT NULL
);

CREATE INDEX idx_activity_type ON activity(type);
CREATE INDEX idx_activity_doc ON activity(documentId);
CREATE INDEX idx_activity_date ON activity(createdAt);

-- =====================================================
-- RECHERCHES SAUVEGARDÉES
-- =====================================================

CREATE TABLE saved_searches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    filters TEXT,                 -- JSON
    createdAt INTEGER NOT NULL,
    lastUsedAt INTEGER
);

-- =====================================================
-- PLUGINS
-- =====================================================

CREATE TABLE plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    config TEXT,                  -- JSON config
    installedAt INTEGER NOT NULL,
    updatedAt INTEGER
);

CREATE TABLE plugin_data (
    pluginId TEXT REFERENCES plugins(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (pluginId, key)
);

-- =====================================================
-- PARAMÈTRES
-- =====================================================

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updatedAt INTEGER NOT NULL
);

-- =====================================================
-- EMBEDDINGS (pour recherche sémantique)
-- =====================================================

CREATE TABLE embeddings (
    documentId TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    embedding BLOB NOT NULL,      -- Vecteur sérialisé
    model TEXT NOT NULL,          -- Modèle utilisé
    createdAt INTEGER NOT NULL
);

-- =====================================================
-- CACHE
-- =====================================================

CREATE TABLE cache (
    key TEXT PRIMARY KEY,
    value TEXT,
    expiresAt INTEGER
);

CREATE INDEX idx_cache_expires ON cache(expiresAt);

-- =====================================================
-- SYNCHRONISATION
-- =====================================================

CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    documentId TEXT REFERENCES documents(id),
    action TEXT NOT NULL,         -- index, update, delete
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    error TEXT,
    createdAt INTEGER NOT NULL,
    processedAt INTEGER
);

CREATE INDEX idx_sync_queue_priority ON sync_queue(priority DESC, createdAt);
```

---

## Requêtes Courantes

### Rechercher des Documents

```sql
-- Recherche par nom
SELECT * FROM documents
WHERE name LIKE '%facture%'
ORDER BY modifiedAt DESC
LIMIT 20;

-- Recherche avec filtres
SELECT d.*, GROUP_CONCAT(t.name) as tags
FROM documents d
LEFT JOIN document_tags dt ON d.id = dt.documentId
LEFT JOIN tags t ON dt.tagId = t.id
WHERE d.source = 'google-drive'
  AND d.type = 'pdf'
  AND d.modifiedAt > ?
GROUP BY d.id
ORDER BY d.modifiedAt DESC;

-- Documents par projet
SELECT * FROM documents
WHERE projectId = ?
ORDER BY name;
```

### Statistiques

```sql
-- Nombre de documents par source
SELECT source, COUNT(*) as count, SUM(size) as totalSize
FROM documents
GROUP BY source;

-- Documents récents
SELECT * FROM documents
ORDER BY modifiedAt DESC
LIMIT 10;

-- Tags les plus utilisés
SELECT t.name, COUNT(dt.documentId) as usage
FROM tags t
JOIN document_tags dt ON t.id = dt.tagId
GROUP BY t.id
ORDER BY usage DESC
LIMIT 20;
```

### Activité

```sql
-- Historique récent
SELECT a.*, d.name as documentName
FROM activity a
LEFT JOIN documents d ON a.documentId = d.id
ORDER BY a.createdAt DESC
LIMIT 50;

-- Recherches fréquentes
SELECT query, COUNT(*) as count
FROM activity
WHERE type = 'search'
GROUP BY query
ORDER BY count DESC
LIMIT 10;
```

---

## Migrations

### Système de Migration

```javascript
// migrations/001_initial.js
module.exports = {
    version: 1,
    up: async (db) => {
        await db.exec(`
            CREATE TABLE documents (...)
            CREATE TABLE tags (...)
            ...
        `);
    },
    down: async (db) => {
        await db.exec(`
            DROP TABLE documents;
            DROP TABLE tags;
            ...
        `);
    }
};

// migrations/002_add_embeddings.js
module.exports = {
    version: 2,
    up: async (db) => {
        await db.exec(`
            CREATE TABLE embeddings (...)
        `);
    },
    down: async (db) => {
        await db.exec(`DROP TABLE embeddings`);
    }
};
```

### Exécution des Migrations

```javascript
class MigrationRunner {
    async run() {
        const currentVersion = await this.getCurrentVersion();
        const migrations = await this.loadMigrations();

        for (const migration of migrations) {
            if (migration.version > currentVersion) {
                console.log(`Running migration ${migration.version}...`);
                await migration.up(this.db);
                await this.setVersion(migration.version);
            }
        }
    }
}
```

---

## Backup et Restauration

### Backup Automatique

```javascript
const fs = require('fs');
const path = require('path');

async function backup(dbPath, backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `lifeos-${timestamp}.db`);

    // Copie à chaud avec SQLite backup API
    const db = new Database(dbPath);
    await db.backup(backupPath);

    // Garder les 10 derniers backups
    const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('lifeos-'))
        .sort()
        .reverse();

    for (const old of backups.slice(10)) {
        fs.unlinkSync(path.join(backupDir, old));
    }

    return backupPath;
}
```

### Export des Données

```javascript
async function exportToJson(db) {
    const data = {
        documents: await db.all('SELECT * FROM documents'),
        tags: await db.all('SELECT * FROM tags'),
        projects: await db.all('SELECT * FROM projects'),
        // ...
        exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
}
```

---

## Optimisations

### Index

Les index sont créés automatiquement pour :
- Recherches fréquentes (source, type, project)
- Tris (modifiedAt, createdAt)
- Relations (foreign keys)

### Vacuum

```javascript
// Maintenance périodique
async function optimize(db) {
    // Reconstruire les index
    await db.exec('REINDEX');

    // Récupérer l'espace libre
    await db.exec('VACUUM');

    // Analyser pour optimiser les requêtes
    await db.exec('ANALYZE');
}
```

### Cache

```javascript
class QueryCache {
    constructor(db, ttl = 60000) {
        this.db = db;
        this.ttl = ttl;
        this.cache = new Map();
    }

    async query(sql, params, key) {
        const cached = this.cache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        const data = await this.db.all(sql, params);
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.ttl
        });

        return data;
    }

    invalidate(key) {
        this.cache.delete(key);
    }
}
```

---

## Sécurité

### Chiffrement (optionnel)

```javascript
const Database = require('better-sqlite3');
const sqlcipher = require('better-sqlite3-sqlcipher');

// Base de données chiffrée
const db = new Database('lifeos.db', {
    // Utiliser SQLCipher pour le chiffrement
});
db.pragma(`key = '${encryptionKey}'`);
```

### Permissions

Les fichiers de base de données ont des permissions restrictives :
- `lifeos.db` - 600 (lecture/écriture propriétaire uniquement)
- `backups/` - 700 (accès propriétaire uniquement)
