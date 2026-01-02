/**
 * Serveur MCP - Claude
 * Port: 3002
 */

const MCPServer = require('./base-server');

class ClaudeServer extends MCPServer {
    constructor() {
        super('Claude', 3002);
    }

    async sendToAI(message) {
        if (!this.cookies || !this.cookies.value) {
            return `[Claude - Mode démo]\n\nVotre message: "${message}"\n\nPour utiliser le vrai Claude:\n1. Connectez-vous sur claude.ai\n2. Exécutez: node scripts/extract-sessions.js`;
        }

        // TODO: Implémenter l'appel réel à Claude via Puppeteer
        return `[Claude] Réponse simulée pour: "${message}"`;
    }
}

// Démarrer le serveur
const server = new ClaudeServer();
server.start();
