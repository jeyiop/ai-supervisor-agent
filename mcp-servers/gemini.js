/**
 * Serveur MCP - Gemini
 * Port: 3004
 */

const MCPServer = require('./base-server');

class GeminiServer extends MCPServer {
    constructor() {
        super('Gemini', 3004);
    }

    async sendToAI(message) {
        if (!this.cookies || !this.cookies.value) {
            return `[Gemini - Mode démo]\n\nVotre message: "${message}"\n\nPour utiliser le vrai Gemini:\n1. Connectez-vous sur gemini.google.com\n2. Exécutez: node scripts/extract-sessions.js`;
        }

        // TODO: Implémenter l'appel réel à Gemini via Puppeteer
        return `[Gemini] Réponse simulée pour: "${message}"`;
    }
}

// Démarrer le serveur
const server = new GeminiServer();
server.start();
