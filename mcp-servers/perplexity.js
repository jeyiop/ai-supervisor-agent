/**
 * Serveur MCP - Perplexity
 * Port: 3003
 */

const MCPServer = require('./base-server');

class PerplexityServer extends MCPServer {
    constructor() {
        super('Perplexity', 3003);
    }

    async sendToAI(message) {
        if (!this.cookies || !this.cookies.value) {
            return `[Perplexity - Mode démo]\n\nVotre message: "${message}"\n\nPour utiliser le vrai Perplexity:\n1. Connectez-vous sur perplexity.ai\n2. Exécutez: node scripts/extract-sessions.js`;
        }

        // TODO: Implémenter l'appel réel à Perplexity via Puppeteer
        return `[Perplexity] Réponse simulée pour: "${message}"`;
    }
}

// Démarrer le serveur
const server = new PerplexityServer();
server.start();
