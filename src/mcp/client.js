/**
 * Client MCP unifié - AI Supervisor
 *
 * Ce fichier gère la communication avec tous les serveurs MCP.
 *
 * A FAIRE:
 * - Connexion aux serveurs MCP locaux
 * - Envoi de requêtes
 * - Réception des réponses
 * - Gestion des erreurs
 */

class MCPClient {
    constructor() {
        this.servers = {
            chatgpt: 'http://localhost:3001',
            claude: 'http://localhost:3002',
            perplexity: 'http://localhost:3003',
            gemini: 'http://localhost:3004',
            notion: 'http://localhost:3005'
        };
    }

    // TODO: Implémenter les méthodes de communication
}

module.exports = MCPClient;
