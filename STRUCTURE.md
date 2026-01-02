# Structure du Projet AI Supervisor

Ce document explique l'organisation du projet pour vous aider à vous repérer.

---

## Vue d'ensemble

```
ai-supervisor-agent/
│
├── README.md              <- Présentation du projet
├── INSTALL.md            <- Guide d'installation
├── STRUCTURE.md          <- Ce fichier (guide de navigation)
├── package.json          <- Configuration npm
├── .gitignore            <- Fichiers à ne pas partager
│
├── src/                  <- CODE DE L'APPLICATION
│   ├── main.js          <- Démarrage de l'app
│   ├── renderer/        <- Interface utilisateur
│   │   ├── index.html   <- Page principale
│   │   ├── styles.css   <- Design
│   │   └── dashboard.js <- Logique interface
│   └── mcp/             <- Communication avec les IA
│       └── client.js    <- Client unifié
│
├── mcp-servers/          <- SERVEURS POUR CHAQUE IA
│   ├── chatgpt.js       <- Serveur ChatGPT (port 3001)
│   ├── claude.js        <- Serveur Claude (port 3002)
│   ├── perplexity.js    <- Serveur Perplexity (port 3003)
│   ├── gemini.js        <- Serveur Gemini (port 3004)
│   └── notion.js        <- Serveur Notion (port 3005)
│
├── config/               <- CONFIGURATION
│   ├── .env.example     <- Variables d'environnement (modèle)
│   ├── sessions.example.json <- Config sessions (modèle)
│   └── cookies.example.json  <- Cookies (modèle - NE PAS PARTAGER)
│
├── scripts/              <- SCRIPTS UTILITAIRES
│   └── setup.js         <- Installation automatique
│
├── assets/               <- IMAGES ET ICONES
│   └── icons/           <- Icônes de l'application
│
├── docs/                 <- DOCUMENTATION SUPPLEMENTAIRE
│
└── workflows/            <- AUTOMATISATIONS N8N
    └── example-workflow.json <- Exemple de workflow
```

---

## Explications par dossier

### `src/` - Code de l'application
C'est ici que se trouve le code principal de l'application Electron.

| Fichier | Rôle |
|---------|------|
| `main.js` | Point d'entrée - lance l'application |
| `renderer/index.html` | Page HTML de l'interface |
| `renderer/styles.css` | Design et apparence |
| `renderer/dashboard.js` | Logique de l'interface |
| `mcp/client.js` | Communication avec les serveurs MCP |

### `mcp-servers/` - Serveurs MCP
Chaque fichier est un serveur qui communique avec une IA.

| Fichier | Port | Service |
|---------|------|---------|
| `chatgpt.js` | 3001 | ChatGPT |
| `claude.js` | 3002 | Claude |
| `perplexity.js` | 3003 | Perplexity |
| `gemini.js` | 3004 | Gemini |
| `notion.js` | 3005 | Notion |

### `config/` - Configuration
Fichiers de configuration. Les fichiers `.example` sont des modèles à copier.

**IMPORTANT**: Ne jamais partager `cookies.json` ou `.env.local` !

### `scripts/` - Scripts utilitaires
Scripts pour automatiser l'installation et la configuration.

### `assets/` - Images et icônes
Ressources visuelles de l'application.

### `docs/` - Documentation
Documentation supplémentaire si nécessaire.

### `workflows/` - Automatisations n8n
Workflows à importer dans n8n pour l'automatisation.

---

## Fichiers importants à la racine

| Fichier | Rôle |
|---------|------|
| `README.md` | Présentation du projet |
| `INSTALL.md` | Guide d'installation détaillé |
| `STRUCTURE.md` | Ce fichier - guide de navigation |
| `package.json` | Dépendances et scripts npm |
| `.gitignore` | Fichiers à ne pas envoyer sur GitHub |

---

## Où commencer ?

1. **Pour comprendre le projet** : Lisez `README.md`
2. **Pour installer** : Suivez `INSTALL.md`
3. **Pour naviguer** : Utilisez ce fichier (`STRUCTURE.md`)
4. **Pour développer** : Commencez par `src/main.js`

---

## Questions fréquentes

**Q: Où sont mes cookies de session ?**
R: Dans `config/cookies.json` (à créer à partir de `cookies.example.json`)

**Q: Comment ajouter une nouvelle IA ?**
R: Créer un nouveau fichier dans `mcp-servers/` et l'ajouter au client dans `src/mcp/client.js`

**Q: Où modifier l'interface ?**
R: Dans `src/renderer/` (HTML, CSS, JS)
