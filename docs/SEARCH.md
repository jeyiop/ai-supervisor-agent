# Moteur de Recherche - Life OS

## Vue d'ensemble

Le moteur de recherche de Life OS permet de trouver instantanément n'importe quel fichier, document ou information dans toutes vos sources de données.

---

## Fonctionnalités

### Recherche Full-Text
- Recherche dans le contenu de tous vos documents
- Support des accents et caractères spéciaux
- Tolérance aux fautes de frappe
- Recherche en plusieurs langues

### Recherche Sémantique
- Comprend le sens de votre recherche
- Trouve des documents similaires
- Suggestions intelligentes
- "Trouve mes factures" → trouve tous les documents de type facture

### Filtres Avancés
- Par date (créé, modifié)
- Par type de fichier
- Par source (local, Drive, etc.)
- Par tags/catégories
- Par projet

### OCR Automatique
- Extraction de texte des images
- Extraction de texte des PDF scannés
- Recherche dans les captures d'écran

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Requête Utilisateur                   │
│                   "factures 2024 client"                 │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Query Parser                          │
│  → tokens: ["factures", "2024", "client"]               │
│  → filters: {year: 2024, type: "invoice"}               │
└─────────────────────────┬───────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│    MeiliSearch        │   │   Recherche Sémantique │
│   (Full-text rapide)  │   │   (Embeddings IA)      │
└───────────┬───────────┘   └───────────┬───────────┘
            │                           │
            └─────────────┬─────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Result Merger                          │
│  → Combine et classe les résultats                      │
│  → Score de pertinence                                  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Résultats Enrichis                     │
│  → Aperçu du contenu                                    │
│  → Mise en surbrillance                                 │
│  → Actions disponibles                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Technologies

### MeiliSearch

Moteur de recherche ultra-rapide et tolérant aux erreurs.

```javascript
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
    host: 'http://localhost:7700',
    apiKey: 'masterKey'
});

// Créer un index
const index = client.index('documents');

// Configurer la recherche
await index.updateSettings({
    searchableAttributes: [
        'title',
        'content',
        'tags',
        'path'
    ],
    filterableAttributes: [
        'type',
        'source',
        'createdAt',
        'modifiedAt',
        'tags',
        'project'
    ],
    sortableAttributes: [
        'createdAt',
        'modifiedAt',
        'relevance'
    ],
    typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
            oneTypo: 4,
            twoTypos: 8
        }
    }
});

// Indexer un document
await index.addDocuments([{
    id: 'doc-123',
    title: 'Facture Client ABC',
    content: 'Contenu extrait du document...',
    type: 'pdf',
    source: 'google-drive',
    path: '/Factures/2024/facture-abc.pdf',
    tags: ['facture', 'client', '2024'],
    createdAt: 1704067200,
    modifiedAt: 1704153600
}]);

// Rechercher
const results = await index.search('facture ABC', {
    filter: 'type = "pdf" AND createdAt > 1704067200',
    sort: ['modifiedAt:desc'],
    limit: 20,
    attributesToHighlight: ['title', 'content']
});
```

### Recherche Sémantique avec Ollama

Pour une recherche intelligente qui comprend le sens :

```javascript
const ollama = require('ollama');

class SemanticSearch {
    constructor() {
        this.model = 'nomic-embed-text'; // Modèle d'embeddings
    }

    // Générer un embedding pour un texte
    async embed(text) {
        const response = await ollama.embeddings({
            model: this.model,
            prompt: text
        });
        return response.embedding;
    }

    // Indexer un document avec son embedding
    async indexDocument(doc) {
        const embedding = await this.embed(doc.content);

        await db.insert('embeddings', {
            docId: doc.id,
            embedding: JSON.stringify(embedding)
        });
    }

    // Recherche sémantique
    async search(query, limit = 10) {
        const queryEmbedding = await this.embed(query);

        // Calculer la similarité cosinus avec tous les documents
        const results = await db.query(`
            SELECT docId, embedding
            FROM embeddings
        `);

        const scored = results.map(row => ({
            docId: row.docId,
            score: this.cosineSimilarity(queryEmbedding, JSON.parse(row.embedding))
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
```

---

## Extraction de Contenu

### PDF

```javascript
const pdf = require('pdf-parse');

async function extractPdfText(buffer) {
    const data = await pdf(buffer);
    return {
        text: data.text,
        pages: data.numpages,
        info: data.info
    };
}
```

### Images (OCR)

```javascript
const Tesseract = require('tesseract.js');

async function extractImageText(imagePath) {
    const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'fra+eng', // Français + Anglais
        { logger: m => console.log(m) }
    );
    return text;
}
```

### Documents Office

```javascript
const mammoth = require('mammoth'); // Word
const xlsx = require('xlsx'); // Excel

async function extractWordText(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

function extractExcelText(buffer) {
    const workbook = xlsx.read(buffer);
    let text = '';
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_txt(sheet) + '\n';
    });
    return text;
}
```

---

## Interface de Recherche

### Barre de Recherche

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Rechercher dans tous vos documents...          [⌘K] │
└─────────────────────────────────────────────────────────┘
```

### Résultats

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 factures 2024                              [Filtres] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📄 Facture_Client_ABC_2024.pdf                        │
│     Google Drive • Modifié il y a 2 jours              │
│     "...montant total de la **facture** : 1,500€..."   │
│     [Ouvrir] [Copier le lien] [Tags]                   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📄 Factures_Janvier_2024.xlsx                         │
│     OneDrive • Modifié il y a 1 semaine                │
│     "Récapitulatif des **factures** du mois..."        │
│     [Ouvrir] [Copier le lien] [Tags]                   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📧 Re: Facture en attente                             │
│     Gmail • Reçu il y a 3 jours                        │
│     "Bonjour, veuillez trouver la **facture**..."      │
│     [Ouvrir] [Répondre] [Archiver]                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Affichage 1-10 sur 45 résultats     [Charger plus]    │
└─────────────────────────────────────────────────────────┘
```

### Filtres

```
┌─────────────────────────────────────────────────────────┐
│                        Filtres                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Type de fichier                                        │
│  ☑️ PDF (23)  ☑️ Word (8)  ☐ Excel (5)  ☐ Images (12)  │
│                                                         │
│  Source                                                 │
│  ☑️ Local (15)  ☑️ Google Drive (20)  ☐ OneDrive (10)  │
│                                                         │
│  Date de modification                                   │
│  ○ Tout  ○ Aujourd'hui  ○ Cette semaine  ● Ce mois    │
│  ○ Cette année  ○ Personnalisé [____] - [____]        │
│                                                         │
│  Tags                                                   │
│  [facture ×] [client ×] [+ Ajouter]                    │
│                                                         │
│  [Appliquer]  [Réinitialiser]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+K` / `⌘K` | Ouvrir la recherche |
| `Entrée` | Ouvrir le premier résultat |
| `↑` / `↓` | Naviguer dans les résultats |
| `Ctrl+Entrée` | Ouvrir dans l'application native |
| `Ctrl+C` | Copier le chemin |
| `Esc` | Fermer la recherche |

---

## Requêtes Avancées

### Syntaxe de Recherche

```
# Recherche simple
facture client

# Phrase exacte
"facture client ABC"

# Exclusion
facture -brouillon

# Type de fichier
facture type:pdf

# Source spécifique
facture source:google-drive

# Date
facture date:2024
facture date:>2024-01-01

# Tags
facture tag:urgent

# Combinaisons
"facture client" type:pdf date:2024 -brouillon
```

---

## Performance

### Objectifs

| Métrique | Objectif |
|----------|----------|
| Temps de recherche | < 50ms |
| Indexation fichier texte | < 10ms |
| Indexation PDF | < 500ms |
| OCR image | < 2s |

### Optimisations

- Index en mémoire pour les recherches fréquentes
- Indexation en arrière-plan
- Cache des résultats récents
- Pagination des résultats
