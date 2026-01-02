/**
 * Serveur MCP - ChatGPT
 * Port: 3001
 */

const MCPServer = require('./base-server');

class ChatGPTServer extends MCPServer {
    constructor() {
        super('ChatGPT', 3001);
    }

    async sendToAI(message) {
        if (!this.cookies || !this.cookies.value) {
            return `[ChatGPT - Mode démo]\n\nVotre message: "${message}"\n\nPour utiliser le vrai ChatGPT:\n1. Connectez-vous sur chat.openai.com\n2. Exécutez: node scripts/extract-sessions.js`;
        }

        // TODO: Implémenter l'appel réel à ChatGPT via Puppeteer
        // L'implémentation complète nécessite de gérer les sessions web
        return `[ChatGPT] Réponse simulée pour: "${message}"`;
    }
}

// Démarrer le serveur
const server = new ChatGPTServer();
server.start();
