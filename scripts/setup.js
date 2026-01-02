#!/usr/bin/env node
/**
 * Script de configuration - AI Supervisor Agent
 * Prépare l'environnement pour le premier lancement
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Configuration AI Supervisor Agent');
console.log('='.repeat(50));

// Structure des dossiers
const dirs = [
    'src/renderer',
    'src/mcp',
    'mcp-servers',
    'config',
    'assets/icons',
    'docs',
    'workflows'
];

console.log('\n📁 Vérification de la structure...');
dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   ✓ Créé: ${dir}/`);
    } else {
        console.log(`   ✓ Existe: ${dir}/`);
    }
});

// Créer les fichiers de config si nécessaires
const configFiles = [
    {
        path: 'config/cookies.json',
        template: 'config/cookies.example.json'
    },
    {
        path: 'config/sessions.json',
        template: 'config/sessions.example.json'
    }
];

console.log('\n⚙️  Fichiers de configuration...');
configFiles.forEach(({ path: filePath, template }) => {
    const fullPath = path.join(__dirname, '..', filePath);
    const templatePath = path.join(__dirname, '..', template);

    if (!fs.existsSync(fullPath) && fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, fullPath);
        console.log(`   ✓ Créé: ${filePath}`);
    } else if (fs.existsSync(fullPath)) {
        console.log(`   ✓ Existe: ${filePath}`);
    }
});

// Instructions finales
console.log('\n✅ Configuration terminée!');
console.log('\n📝 Prochaines étapes:');
console.log('-'.repeat(50));
console.log('1. Installer les dépendances:');
console.log('   npm install');
console.log('');
console.log('2. Extraire vos cookies de session:');
console.log('   npm run extract-cookies');
console.log('');
console.log('3. Démarrer les serveurs MCP:');
console.log('   npm run mcp:all');
console.log('');
console.log('4. Lancer l\'application:');
console.log('   npm run dev');
console.log('');
console.log('Pour plus d\'infos, consultez README.md');
console.log('');
