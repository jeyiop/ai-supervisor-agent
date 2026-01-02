#!/usr/bin/env node
/**
 * Script d'extraction des cookies de session
 * Permet de récupérer vos cookies depuis le navigateur
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration des services
const services = {
    chatgpt: {
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        cookieName: '__Secure-next-auth.session-token'
    },
    claude: {
        name: 'Claude',
        url: 'https://claude.ai',
        cookieName: 'sessionKey'
    },
    perplexity: {
        name: 'Perplexity',
        url: 'https://www.perplexity.ai',
        cookieName: '__Secure-pplx-session'
    },
    gemini: {
        name: 'Gemini',
        url: 'https://gemini.google.com',
        cookieName: '__Secure-1PSID'
    }
};

// Chemin du fichier de cookies
const cookiesPath = path.join(__dirname, '../config/cookies.json');

// Interface readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function extractCookies() {
    console.log('\n🍪 Extraction des cookies de session');
    console.log('='.repeat(50));
    console.log('\nCe script va ouvrir un navigateur pour chaque service.');
    console.log('Connectez-vous à votre compte, puis appuyez sur Entrée.\n');

    // Charger les cookies existants
    let cookies = {};
    if (fs.existsSync(cookiesPath)) {
        try {
            cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
        } catch (e) {
            console.log('⚠️  Fichier cookies.json corrompu, création d\'un nouveau fichier');
        }
    }

    // Lancer le navigateur
    console.log('🚀 Lancement du navigateur...\n');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    for (const [key, service] of Object.entries(services)) {
        console.log(`\n📍 ${service.name}`);
        console.log('-'.repeat(30));

        try {
            // Naviguer vers le service
            console.log(`   Ouverture de ${service.url}...`);
            await page.goto(service.url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Attendre que l'utilisateur se connecte
            await question(`   ➤ Connectez-vous à ${service.name}, puis appuyez sur Entrée...`);

            // Extraire les cookies
            const allCookies = await page.cookies();
            const sessionCookie = allCookies.find(c => c.name === service.cookieName);

            if (sessionCookie) {
                cookies[key] = {
                    cookie_name: service.cookieName,
                    value: sessionCookie.value,
                    domain: sessionCookie.domain,
                    extracted_at: new Date().toISOString()
                };
                console.log(`   ✅ Cookie ${service.cookieName} extrait avec succès!`);
            } else {
                console.log(`   ⚠️  Cookie non trouvé. Êtes-vous bien connecté?`);
                console.log(`   Cookies disponibles: ${allCookies.map(c => c.name).join(', ')}`);
            }

        } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
        }
    }

    // Fermer le navigateur
    await browser.close();

    // Sauvegarder les cookies
    const configDir = path.dirname(cookiesPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log(`\n✅ Cookies sauvegardés dans ${cookiesPath}`);

    // Résumé
    console.log('\n📊 Résumé:');
    console.log('-'.repeat(30));
    for (const [key, service] of Object.entries(services)) {
        const status = cookies[key] ? '✅' : '❌';
        console.log(`   ${status} ${service.name}`);
    }

    rl.close();
    console.log('\n🎉 Extraction terminée!\n');
}

// Exécution
extractCookies().catch(error => {
    console.error('Erreur fatale:', error);
    rl.close();
    process.exit(1);
});
