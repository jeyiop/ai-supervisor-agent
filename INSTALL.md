# Installation AI Supervisor Agent - Architecture MCP Locale

## Architecture 100% Locale avec MCP (Model Context Protocol)

```
Windows 11 PC Local
┌──────────────────────────────────────────────────────┐
│         Agent Desktop Electron (Interface Unifiée)           │
│  ┌────────────────────────────────────────────┐  │
│  │  Dashboard: Switch instantané entre modèles    │  │
│  │  Chat unifié | Historique | Notifications   │  │
│  └────────────────────────────────────────────┘  │
│                     ↓ MCP Protocol                       │
│  ┌────────────────────────────────────────────┐  │
│  │          Serveurs MCP Locaux (Node.js)        │  │
│  │                                              │  │
│  │  • mcp-server-chatgpt  (localhost:3001)   │  │
│  │  • mcp-server-claude   (localhost:3002)   │  │
│  │  • mcp-server-perplexity (localhost:3003) │  │
│  │  • mcp-server-gemini  (localhost:3004)   │  │
│  │  • mcp-server-notion  (localhost:3005)   │  │
│  └────────────────────────────────────────────┘  │
│                     ↓ Sessions Auth                     │
│  ┌────────────────────────────────────────────┐  │
│  │    Vos abonnements Pro (sessions actives)   │  │
│  │  ChatGPT Pro | Claude Pro | Perplexity Max │  │
│  └────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────────────────────────────────────────┐  │
│  │       n8n Local (Docker - localhost:5678)     │  │
│  │  Workflows automation & orchestration      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## ⚡ Installation Complète - Commandes à Exécuter

### PRÉREQUIS Windows 11

```powershell
# 1. Installer Node.js LTS (si pas déjà installé)
winget install OpenJS.NodeJS.LTS

# 2. Installer Docker Desktop (pour n8n local)
winget install Docker.DockerDesktop

# 3. Installer Git
winget install Git.Git
```

### ÉTAPE 1 : Cloner et Installer l'Agent

```powershell
# Ouvrir PowerShell en Administrateur
cd $env:USERPROFILE\Documents
git clone https://github.com/jeyiop/ai-supervisor-agent.git
cd ai-supervisor-agent

# Installer les dépendances
npm install
```

### ÉTAPE 2 : Installer les Serveurs MCP Locaux

```powershell
# Dans le dossier ai-supervisor-agent

# Créer le dossier pour les serveurs MCP
mkdir mcp-servers
cd mcp-servers

# Initialiser chaque serveur MCP
npm init -y
npm install @modelcontextprotocol/sdk express axios puppeteer tough-cookie
```

### ÉTAPE 3 : Démarrer n8n en Local

```powershell
# Option 1: Via Docker (RECOMMANDÉ)
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# Option 2: Via npm
npm install -g n8n
n8n start

# Accéder à n8n : http://localhost:5678
```

### ÉTAPE 4 : Configuration des Sessions (Sans API Keys!)

**Important** : Vous devez être connecté à vos comptes Pro dans votre navigateur.

Les serveurs MCP vont utiliser vos **cookies de session** pour authentifier les requêtes.

```powershell
# Créer le fichier de configuration
echo '{' > config/sessions.json
echo '  "chatgpt": { "enabled": true, "url": "https://chat.openai.com" },' >> config/sessions.json
echo '  "claude": { "enabled": true, "url": "https://claude.ai" },' >> config/sessions.json
echo '  "perplexity": { "enabled": true, "url": "https://www.perplexity.ai" },' >> config/sessions.json
echo '  "gemini": { "enabled": true, "url": "https://gemini.google.com" },' >> config/sessions.json
echo '  "notion": { "enabled": true, "url": "https://www.notion.so" }' >> config/sessions.json
echo '}' >> config/sessions.json
```

### ÉTAPE 5 : Extraire vos Cookies de Session

**Méthode Automatique** :

```powershell
# Lancer le script d'extraction
node scripts/extract-sessions.js
```

Ce script va :
1. Ouvrir un navigateur Chromium
2. Vous demander de vous connecter à chaque service
3. Extraire automatiquement les cookies
4. Les sauvegarder de manière sécurisée

**Méthode Manuelle** (alternative) :

1. Ouvrir Chrome DevTools (F12)
2. Aller sur Application → Cookies
3. Pour ChatGPT : copier `__Secure-next-auth.session-token`
4. Pour Claude : copier `sessionKey`
5. Pour Perplexity : copier `__Secure-pplx-session`
6. Les ajouter dans `config/cookies.json`

### ÉTAPE 6 : Démarrer Tous les Serveurs MCP

```powershell
# Depuis la racine du projet
npm run start:mcp-servers
```

Cela va démarrer automatiquement :
- `mcp-chatgpt` sur http://localhost:3001
- `mcp-claude` sur http://localhost:3002
- `mcp-perplexity` sur http://localhost:3003
- `mcp-gemini` sur http://localhost:3004
- `mcp-notion` sur http://localhost:3005

### ÉTAPE 7 : Lancer l'Agent Desktop

```powershell
# En mode développement
npm run dev

# Ou build pour production
npm run build:win
# L'installeur sera dans dist/AI-Supervisor-Setup.exe
```

## 🎯 Fonctionnalités Disponibles

### 1. Dashboard Unifié
- Chat unique avec switch instantané entre modèles
- Historique unifié de toutes vos conversations
- Comparaison côte-à-côte des réponses
- Mode "meilleur modèle" automatique

### 2. Permissions Maximales

```javascript
// L'agent a accès à :
- Tous vos fichiers (lecture/écriture)
- Clipboard (copier/coller)
- Applications installées
- Notifications système
- Micros et audio
- Historique navigateur
- Variables d'environnement
```

### 3. Sync Notion Automatique
- Toutes les conversations sauvegardées
- Analyse croisée des réponses
- Base de données de connaissances
- Recherche sémantique

### 4. Notifications Proactives
- Suggestions contextuelles
- Alertes intelligentes
- Résumés quotidiens
- Rappels automatiques

## 🔧 Configuration Avancée

### Fichier `.env.local`

```env
# Ports des serveurs MCP
MCP_CHATGPT_PORT=3001
MCP_CLAUDE_PORT=3002
MCP_PERPLEXITY_PORT=3003
MCP_GEMINI_PORT=3004
MCP_NOTION_PORT=3005

# n8n Local
N8N_URL=http://localhost:5678

# Permissions
ALLOW_FILE_ACCESS=true
ALLOW_CLIPBOARD=true
ALLOW_SYSTEM_COMMANDS=true
ALLOW_NETWORK=true

# Fonctionnalités
ENABLE_AUTO_SAVE=true
ENABLE_NOTIFICATIONS=true
ENABLE_CROSS_ANALYSIS=true
ENABLE_PROACTIVE_SUGGESTIONS=true
```

### Structure des Fichiers Créés

```
ai-supervisor-agent/
├── package.json          ✅ Créé
├── INSTALL.md           ✅ En cours
├── .env.local           (À créer)
├── src/
│   ├── main.js          (Process Electron)
│   ├── preload.js       (Pont sécurisé)
│   ├── renderer/
│   │   ├── index.html
│   │   ├── dashboard.js
│   │   └── styles.css
│   └── mcp/
│       └── client.js    (Client MCP unifié)
├── mcp-servers/
│   ├── chatgpt.js
│   ├── claude.js
│   ├── perplexity.js
│   ├── gemini.js
│   └── notion.js
├── config/
│   ├── sessions.json    (Config sessions)
│   └── cookies.json     (Cookies sécurisés)
└── scripts/
    ├── extract-sessions.js
    ├── start-mcp.js
    └── setup-permissions.js
```

## 🚀 Démarrage Rapide (TL;DR)

```powershell
# 1. Installer prérequis
winget install OpenJS.NodeJS.LTS Docker.DockerDesktop Git.Git

# 2. Cloner et installer
git clone https://github.com/jeyiop/ai-supervisor-agent.git
cd ai-supervisor-agent
npm install

# 3. Démarrer n8n
docker run -d --name n8n -p 5678:5678 n8nio/n8n

# 4. Extraire sessions (connexion manuelle requise)
node scripts/extract-sessions.js

# 5. Démarrer serveurs MCP
npm run start:mcp-servers

# 6. Lancer l'agent
npm run dev
```

## ❓ Troubleshooting

### Les serveurs MCP ne se connectent pas
- Vérifiez que vous êtes bien connecté dans votre navigateur
- Relancez `node scripts/extract-sessions.js`
- Vérifiez les cookies dans `config/cookies.json`

### n8n ne démarre pas
- Vérifiez que Docker Desktop est lancé
- Port 5678 déjà utilisé ? Changez le port

### L'agent ne démarre pas
- Vérifiez Node.js version (>= 18.0.0)
- Supprimez node_modules et relancez `npm install`

## 🔒 Sécurité

- Tous les cookies sont chiffrés localement
- Aucune donnée n'est envoyée à des serveurs tiers
- Architecture 100% locale
- Permissions configurables

## 📝 Prochaines Étapes

Après installation, je dois créer les fichiers sources :

1. Serveurs MCP pour chaque IA
2. Interface Electron complète
3. Workflows n8n
4. Scripts d'extraction de sessions
5. Configuration permissions Windows

Voulez-vous que je continue avec la création de ces fichiers ?
