/**
 * Script para iniciar el emulador de Firebase Storage
 * 
 * Este script inicia el emulador de Firebase Storage para desarrollo local,
 * lo que permite evitar problemas de CORS durante el desarrollo.
 * 
 * Requisitos:
 * 1. Tener instalado Firebase CLI: npm install -g firebase-tools
 * 2. Estar autenticado en Firebase: firebase login
 * 
 * Uso:
 * node start-emulator.js
 */

const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.bright}${colors.cyan}=== Iniciando emulador de Firebase Storage ===${colors.reset}\n`);

try {
  // Verificar si Firebase CLI está instalado
  console.log(`${colors.blue}ℹ${colors.reset} Verificando si Firebase CLI está instalado...`);
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log(`${colors.green}✓${colors.reset} Firebase CLI versión ${version} encontrado`);
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Firebase CLI no está instalado.`);
    console.log(`${colors.yellow}!${colors.reset} Por favor, instálalo con: npm install -g firebase-tools`);
    process.exit(1);
  }

  // Iniciar el emulador
  console.log(`\n${colors.blue}ℹ${colors.reset} Iniciando emulador de Firebase Storage...`);
  console.log(`${colors.yellow}!${colors.reset} Presiona Ctrl+C para detener el emulador\n`);
  
  // Ejecutar el comando para iniciar el emulador
  execSync('firebase emulators:start --only storage', { stdio: 'inherit' });
} catch (error) {
  console.error(`\n${colors.red}${colors.bright}✗ Error al iniciar el emulador:${colors.reset}`, error.message);
  process.exit(1);
} 