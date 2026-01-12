# Historique des Conversations IA - Life OS

## Vue d'ensemble

Life OS capture et centralise automatiquement toutes vos conversations avec les différents assistants IA (ChatGPT, Claude, Perplexity, Gemini, etc.).

---

## Fonctionnalités

### Capture Automatique
- Sauvegarde automatique de chaque conversation
- Synchronisation depuis les interfaces web (via extension)
- Import des exports de chaque service
- Capture en temps réel depuis AI Supervisor

### Organisation
- Timeline chronologique
- Filtrage par assistant IA
- Recherche dans toutes les conversations
- Tags et catégories personnalisables

### Analyse
- Résumé automatique des conversations longues
- Extraction des points clés
- Détection des sujets récurrents
- Statistiques d'utilisation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HISTORIQUE IA UNIFIÉ                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ ChatGPT │ │ Claude  │ │Perplexity│ │ Gemini  │ │ Copilot │  │
│  │   Pro   │ │   Pro   │ │   Max   │ │ Advanced│ │         │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │          │          │          │          │           │
│       └──────────┴──────────┴──────────┴──────────┘           │
│                            │                                   │
│                            ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Base de Données Unifiée                    │  │
│  │                                                         │  │
│  │  • Toutes les conversations                             │  │
│  │  • Métadonnées (date, durée, tokens)                   │  │
│  │  • Résumés automatiques                                 │  │
│  │  • Tags et catégories                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                   │
│                            ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Interface de Consultation                  │  │
│  │                                                         │  │
│  │  • Timeline chronologique                               │  │
│  │  • Recherche full-text                                  │  │
│  │  • Filtres avancés                                      │  │
│  │  • Export et partage                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schéma de Base de Données

```sql
-- Conversations
CREATE TABLE ai_conversations (
    id TEXT PRIMARY KEY,

    -- Source
    provider TEXT NOT NULL,        -- chatgpt, claude, perplexity, gemini
    providerId TEXT,               -- ID dans le service source

    -- Métadonnées
    title TEXT,
    summary TEXT,                  -- Résumé auto-généré

    -- Timestamps
    startedAt INTEGER NOT NULL,
    lastMessageAt INTEGER,

    -- Stats
    messageCount INTEGER DEFAULT 0,
    userTokens INTEGER DEFAULT 0,
    assistantTokens INTEGER DEFAULT 0,

    -- Organisation
    projectId TEXT,
    folderId TEXT,
    archived BOOLEAN DEFAULT FALSE,
    starred BOOLEAN DEFAULT FALSE,

    -- Index
    UNIQUE(provider, providerId)
);

-- Messages
CREATE TABLE ai_messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT REFERENCES ai_conversations(id) ON DELETE CASCADE,

    -- Contenu
    role TEXT NOT NULL,            -- user, assistant, system
    content TEXT NOT NULL,

    -- Métadonnées
    timestamp INTEGER NOT NULL,
    tokens INTEGER,
    model TEXT,                    -- gpt-4, claude-3-opus, etc.

    -- Pièces jointes
    attachments TEXT,              -- JSON array

    INDEX idx_messages_conv (conversationId),
    INDEX idx_messages_time (timestamp)
);

-- Tags de conversation
CREATE TABLE ai_conversation_tags (
    conversationId TEXT REFERENCES ai_conversations(id),
    tagId TEXT REFERENCES tags(id),
    PRIMARY KEY (conversationId, tagId)
);
```

---

## Sources de Données

### 1. AI Supervisor (Capture Directe)

Toutes les conversations via AI Supervisor sont automatiquement sauvegardées.

```javascript
// Capture automatique dans AI Supervisor
async function saveMessage(conversation, message) {
    await db.insert('ai_messages', {
        id: generateId(),
        conversationId: conversation.id,
        role: message.role,
        content: message.content,
        timestamp: Date.now(),
        model: conversation.model
    });

    // Mettre à jour les stats
    await db.update('ai_conversations', {
        messageCount: conversation.messageCount + 1,
        lastMessageAt: Date.now()
    }, { id: conversation.id });
}
```

### 2. Extension Navigateur

Extension Chrome/Firefox pour capturer depuis les interfaces web officielles.

```javascript
// Extension - content script
if (window.location.hostname === 'chat.openai.com') {
    observeMessages('chatgpt');
}

if (window.location.hostname === 'claude.ai') {
    observeMessages('claude');
}

function observeMessages(provider) {
    const observer = new MutationObserver((mutations) => {
        // Détecter les nouveaux messages
        // Envoyer à Life OS via native messaging
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
```

### 3. Import d'Exports

Importer les exports officiels de chaque service.

```javascript
// Import ChatGPT export (conversations.json)
async function importChatGPT(exportFile) {
    const data = JSON.parse(await fs.readFile(exportFile));

    for (const conv of data) {
        await db.insert('ai_conversations', {
            id: generateId(),
            provider: 'chatgpt',
            providerId: conv.id,
            title: conv.title,
            startedAt: new Date(conv.create_time * 1000).getTime()
        });

        for (const [nodeId, node] of Object.entries(conv.mapping)) {
            if (node.message) {
                await db.insert('ai_messages', {
                    conversationId: conv.id,
                    role: node.message.author.role,
                    content: node.message.content.parts.join('\n'),
                    timestamp: new Date(node.message.create_time * 1000).getTime()
                });
            }
        }
    }
}
```

---

## Interface Utilisateur

### Timeline des Conversations

```
┌─────────────────────────────────────────────────────────────────┐
│  Historique IA                              🔍 Rechercher...   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filtres: [Tous ▼] [Ce mois ▼] [Tous projets ▼]               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📅 Aujourd'hui                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟢 ChatGPT                           Il y a 2 heures    │   │
│  │ Optimisation du code Python                              │   │
│  │ "Comment améliorer la performance de cette fonction..."  │   │
│  │ 12 messages • ⭐ Favori                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟠 Claude                            Il y a 5 heures    │   │
│  │ Rédaction article blog                                   │   │
│  │ "Aide-moi à rédiger un article sur l'IA..."             │   │
│  │ 8 messages • 📁 Projet Blog                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📅 Hier                                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔵 Perplexity                        Hier, 18:30        │   │
│  │ Recherche sur les LLMs                                   │   │
│  │ "Quelles sont les différences entre GPT-4 et Claude?" │   │
│  │ 5 messages                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Vue Détaillée d'une Conversation

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Retour    Optimisation du code Python         ⭐ 📁 🗑️ ⋮   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🟢 ChatGPT • GPT-4 • 12 messages • 2,340 tokens              │
│  Commencée il y a 2 heures                                     │
│                                                                 │
│  📝 Résumé automatique:                                        │
│  Discussion sur l'optimisation d'une fonction Python qui       │
│  traite de grands fichiers CSV. Solutions proposées:           │
│  utilisation de pandas avec chunks, multiprocessing.           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  👤 Vous                                    14:30              │
│  Comment améliorer la performance de cette fonction qui        │
│  traite un fichier CSV de 2Go ?                                │
│                                                                 │
│  🤖 ChatGPT                                 14:31              │
│  Pour traiter efficacement un fichier CSV de 2Go, je           │
│  recommande plusieurs approches...                              │
│  [Voir plus]                                                    │
│                                                                 │
│  👤 Vous                                    14:35              │
│  Et si j'utilisais pandas avec chunks ?                        │
│                                                                 │
│  ...                                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Tags: [python] [performance] [+ Ajouter]                      │
│  Projet: [Aucun ▼]                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Statistiques

### Dashboard IA

```
┌─────────────────────────────────────────────────────────────────┐
│                    Statistiques IA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ce mois                                                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     127      │  │   45,230     │  │    18h 30    │          │
│  │ Conversations│  │    Tokens    │  │    Temps     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  Utilisation par assistant                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ChatGPT    ████████████████████░░░░░░░░░░░░  52%        │   │
│  │ Claude     █████████████░░░░░░░░░░░░░░░░░░░  28%        │   │
│  │ Perplexity ██████░░░░░░░░░░░░░░░░░░░░░░░░░░  12%        │   │
│  │ Gemini     ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   8%        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Sujets les plus discutés                                       │
│  1. Programmation Python (23 conversations)                     │
│  2. Rédaction de contenu (18 conversations)                     │
│  3. Analyse de données (12 conversations)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Export et Partage

### Formats d'Export

- **Markdown** - Pour documentation
- **PDF** - Pour archivage
- **JSON** - Pour backup/migration
- **HTML** - Pour partage web

```javascript
async function exportConversation(convId, format) {
    const conv = await db.get('ai_conversations', convId);
    const messages = await db.getAll('ai_messages', { conversationId: convId });

    switch (format) {
        case 'markdown':
            return formatAsMarkdown(conv, messages);
        case 'pdf':
            return generatePDF(conv, messages);
        case 'json':
            return JSON.stringify({ conversation: conv, messages });
        case 'html':
            return renderHTML(conv, messages);
    }
}
```
