/**
 * Serveur MCP - Base commune
 * Gère la configuration et les requêtes HTTP
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

class MCPServer {
    constructor(name, port) {
        this.name = name;
        this.port = port;
        this.app = express();
        this.cookies = null;

        // Configuration Express
        this.app.use(cors());
        this.app.use(express.json());

        // Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Status
        this.app.get('/status', (req, res) => {
            res.json({
                name: this.name,
                status: 'running',
                port: this.port,
                hasCookies: this.cookies !== null
            });
        });

        // Chat endpoint
        this.app.post('/chat', async (req, res) => {
            try {
                const { message } = req.body;

                if (!message) {
                    return res.status(400).json({ error: 'Message requis' });
                }

                // Vérifier les cookies
                if (!this.cookies) {
                    return res.status(401).json({
                        error: 'Cookies non configurés',
                        help: 'Exécutez: node scripts/extract-sessions.js'
                    });
                }

                // Appeler l'IA
                const response = await this.sendToAI(message);
                res.json({ response });

            } catch (error) {
                console.error(`[${this.name}] Erreur:`, error.message);
                res.status(500).json({ error: error.message });
            }
        });
    }

    // À surcharger dans chaque serveur
    async sendToAI(message) {
        throw new Error('sendToAI doit être implémenté');
    }

    loadCookies() {
        const cookiesPath = path.join(__dirname, '../config/cookies.json');

        if (fs.existsSync(cookiesPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
                this.cookies = data[this.name.toLowerCase()];
                console.log(`[${this.name}] Cookies chargés`);
            } catch (error) {
                console.error(`[${this.name}] Erreur chargement cookies:`, error.message);
            }
        } else {
            console.log(`[${this.name}] Pas de fichier cookies.json`);
        }
    }

    start() {
        this.loadCookies();

        this.app.listen(this.port, () => {
            console.log(`[${this.name}] Serveur démarré sur http://localhost:${this.port}`);
        });
    }
}

module.exports = MCPServer;
