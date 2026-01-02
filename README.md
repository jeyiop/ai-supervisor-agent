# AI Supervisor Agent

**Agent Desktop Unifié** - Une interface unique pour gérer ChatGPT, Claude, Perplexity, Gemini et Notion.

---

## Qu'est-ce que c'est ?

Un programme pour Windows qui vous permet de :
- Parler à **plusieurs IA en même temps** depuis une seule fenêtre
- **Comparer les réponses** des différents modèles
- **Sauvegarder automatiquement** vos conversations dans Notion
- **Automatiser des tâches** avec n8n

---

## Comment ça marche ?

```
┌─────────────────────────────────────────┐
│         VOTRE ORDINATEUR                │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │     AI Supervisor (Interface)   │   │
│   │    Fenêtre unique pour tout     │   │
│   └───────────────┬─────────────────┘   │
│                   │                     │
│   ┌───────────────┴─────────────────┐   │
│   │      Serveurs MCP (Locaux)      │   │
│   │  ChatGPT | Claude | Perplexity  │   │
│   │      Gemini | Notion            │   │
│   └───────────────┬─────────────────┘   │
│                   │                     │
│   ┌───────────────┴─────────────────┐   │
│   │   Vos Comptes Pro (Navigateur)  │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Installation Rapide

Voir le guide complet : **[INSTALL.md](./INSTALL.md)**

```powershell
# 1. Télécharger le projet
git clone https://github.com/jeyiop/ai-supervisor-agent.git
cd ai-supervisor-agent

# 2. Installer les dépendances
npm install

# 3. Configurer vos sessions
node scripts/extract-sessions.js

# 4. Lancer l'application
npm run dev
```

---

## Organisation du Projet

Voir le guide complet : **[STRUCTURE.md](./STRUCTURE.md)**

```
ai-supervisor-agent/
│
├── src/                  # Code de l'application
│   ├── main.js          # Point d'entrée
│   ├── renderer/        # Interface graphique
│   └── mcp/             # Client MCP
│
├── mcp-servers/         # Serveurs pour chaque IA
│
├── config/              # Configuration
│
├── scripts/             # Scripts utilitaires
│
├── assets/              # Images et icônes
│
├── docs/                # Documentation
│
└── workflows/           # Automatisations n8n
```

---

## Statut du Projet

| Composant | Statut |
|-----------|--------|
| Structure du projet | En cours |
| Interface Electron | A faire |
| Serveur MCP ChatGPT | A faire |
| Serveur MCP Claude | A faire |
| Serveur MCP Perplexity | A faire |
| Serveur MCP Gemini | A faire |
| Serveur MCP Notion | A faire |
| Workflows n8n | A faire |

---

## Besoin d'aide ?

- **Installation** : Voir [INSTALL.md](./INSTALL.md)
- **Structure** : Voir [STRUCTURE.md](./STRUCTURE.md)
- **Questions** : Ouvrir une Issue sur GitHub

---

## Licence

MIT - Voir [LICENSE](./LICENSE)
