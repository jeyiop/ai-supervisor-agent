#!/usr/bin/env node
// Script d'installation automatique - AI Supervisor Agent
const fs = require('fs');
const path = require('path');

console.log('🚀 Installation AI Supervisor Agent - MCP Architecture');
console.log('='.repeat(60));

// Créer la structure de dossiers
const dirs = [
  'scripts',
  'mcp-servers',
  'src',
  'src/renderer',
  'src/mcp',
  'config',
  'assets'
];

console.log('\n📁 Création de la structure de dossiers...');
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  ✓ ${dir}/`);
  }
});

console.log('\n✅ Installation terminée!');
console.log('\n📝 Prochaines étapes:');
console.log('  1. npm install');
console.log('  2. node scripts/extract-sessions.js');
console.log('  3. npm run start:mcp-servers');
console.log('  4. npm run dev');
