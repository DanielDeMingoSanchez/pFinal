/**
 * Script para configurar CORS en Firebase Storage
 * 
 * Este script configura las reglas CORS para Firebase Storage para permitir
 * solicitudes desde cualquier origen. Esto es necesario para que la aplicación
 * pueda subir y descargar archivos desde el navegador.
 * 
 * Instrucciones de uso:
 * 1. Instala Firebase CLI: npm install -g firebase-tools
 * 2. Inicia sesión en Firebase: firebase login
 * 3. Ejecuta este script: node setup-cors.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Función para imprimir mensajes con formato
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '';
  
  switch (type) {
    case 'success':
      prefix = `${colors.green}✓${colors.reset} `;
      break;
    case 'error':
      prefix = `${colors.red}✗${colors.reset} `;
      break;
    case 'warning':
      prefix = `${colors.yellow}!${colors.reset} `;
      break;
    case 'info':
      prefix = `${colors.blue}ℹ${colors.reset} `;
      break;
    case 'step':
      prefix = `${colors.cyan}→${colors.reset} `;
      break;
  }
  
  console.log(`[${timestamp}] ${prefix}${message}`);
}

// Función para ejecutar comandos
function executeCommand(command) {
  try {
    log(`Ejecutando: ${colors.bright}${command}${colors.reset}`, 'step');
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout
    };
  }
}

// Verificar si Firebase CLI está instalado
function checkFirebaseCLI() {
  log('Verificando si Firebase CLI está instalado...', 'step');
  
  const result = executeCommand('firebase --version');
  if (!result.success) {
    log('Firebase CLI no está instalado. Por favor, instálalo con: npm install -g firebase-tools', 'error');
    process.exit(1);
  }
  
  log(`Firebase CLI versión ${result.output.trim()} encontrado`, 'success');
}

// Verificar si el usuario está autenticado en Firebase
function checkFirebaseAuth() {
  log('Verificando si el usuario está autenticado en Firebase...', 'step');
  
  const result = executeCommand('firebase projects:list');
  if (!result.success) {
    log('No estás autenticado en Firebase. Por favor, ejecuta: firebase login', 'error');
    process.exit(1);
  }
  
  log('Usuario autenticado en Firebase', 'success');
}

// Crear archivo de configuración CORS
function createCorsFile() {
  log('Creando archivo de configuración CORS...', 'step');
  
  const corsConfig = [
    {
      "origin": ["*"],
      "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
      "maxAgeSeconds": 3600,
      "responseHeader": [
        "Content-Type", 
        "Content-Disposition", 
        "Content-Length", 
        "Content-Range",
        "Content-Encoding",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
        "Access-Control-Max-Age",
        "Access-Control-Allow-Credentials",
        "Authorization",
        "X-Firebase-Storage-Version",
        "X-Goog-Upload-Protocol",
        "X-Goog-Upload-Command",
        "X-Goog-Upload-Offset",
        "X-Goog-Upload-URL"
      ]
    }
  ];
  
  fs.writeFileSync(path.join(__dirname, 'cors.json'), JSON.stringify(corsConfig, null, 2));
  log('Archivo cors.json creado correctamente', 'success');
}

// Aplicar configuración CORS a Firebase Storage
function applyCorsConfig() {
  log('Aplicando configuración CORS a Firebase Storage...', 'step');
  
  // Usar el nombre correcto del bucket
  const projectId = "documentos-compartidos-cf6bd";
  const bucketName = "documentos-compartidos-cf6bd.firebasestorage.app";
  
  log(`Usando proyecto: ${colors.bright}${projectId}${colors.reset}`, 'info');
  log(`Usando bucket: ${colors.bright}${bucketName}${colors.reset}`, 'info');
  
  // Aplicar configuración CORS
  const result = executeCommand(`gsutil cors set cors.json gs://${bucketName}`);
  if (!result.success) {
    log('Error al aplicar configuración CORS:', 'error');
    log(result.error, 'error');
    
    // Intentar con firebase storage:cors
    log('Intentando método alternativo...', 'warning');
    const altResult = executeCommand('firebase storage:cors set cors.json');
    if (!altResult.success) {
      log('Error al aplicar configuración CORS con método alternativo:', 'error');
      log(altResult.error, 'error');
      
      // Intentar con gcloud
      log('Intentando con gcloud...', 'warning');
      const gcloudResult = executeCommand(`gcloud storage buckets update gs://${bucketName} --cors-file=cors.json`);
      if (!gcloudResult.success) {
        log('Error al aplicar configuración CORS con gcloud:', 'error');
        log(gcloudResult.error, 'error');
        
        log('Todos los métodos fallaron. Por favor, configura CORS manualmente desde la consola de Firebase.', 'error');
        log('Instrucciones:', 'info');
        log('1. Ve a https://console.firebase.google.com/project/' + projectId + '/storage', 'info');
        log('2. Haz clic en "Reglas"', 'info');
        log('3. Configura las reglas CORS según la documentación: https://firebase.google.com/docs/storage/web/download-files#cors_configuration', 'info');
        
        // Instrucciones adicionales para configuración manual
        log('\nConfiguración manual de CORS:', 'info');
        log('1. Abre la consola de Google Cloud: https://console.cloud.google.com/storage/browser', 'info');
        log('2. Selecciona el bucket: ' + bucketName, 'info');
        log('3. Ve a la pestaña "Permisos" y luego a "CORS"', 'info');
        log('4. Haz clic en "Agregar elemento" y configura los siguientes valores:', 'info');
        log('   - Origin: *', 'info');
        log('   - Method: GET,POST,PUT,DELETE,HEAD,OPTIONS', 'info');
        log('   - Response Header: Content-Type,Content-Disposition,Content-Length,Content-Range,Content-Encoding,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Headers,Access-Control-Max-Age,Access-Control-Allow-Credentials,Authorization,X-Firebase-Storage-Version,X-Goog-Upload-Protocol,X-Goog-Upload-Command,X-Goog-Upload-Offset,X-Goog-Upload-URL', 'info');
        log('   - Max Age: 3600', 'info');
        log('5. Haz clic en "Guardar"', 'info');
        
        process.exit(1);
      }
      
      log('Configuración CORS aplicada correctamente con gcloud', 'success');
      return;
    }
    
    log('Configuración CORS aplicada correctamente con método alternativo', 'success');
    return;
  }
  
  log('Configuración CORS aplicada correctamente', 'success');
}

// Aplicar reglas de seguridad a Firebase Storage
function applySecurityRules() {
  log('Aplicando reglas de seguridad a Firebase Storage...', 'step');
  
  // Verificar si existe el archivo storage.rules
  if (!fs.existsSync(path.join(__dirname, 'storage.rules'))) {
    log('No se encontró el archivo storage.rules. Creando uno...', 'warning');
    
    const rules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Permitir lectura a todos los usuarios
      allow read;
      
      // Permitir escritura solo a usuarios autenticados
      allow write: if request.auth != null;
    }
  }
}`;
    
    fs.writeFileSync(path.join(__dirname, 'storage.rules'), rules);
    log('Archivo storage.rules creado correctamente', 'success');
  }
  
  // Verificar si existe el archivo firebase.json
  if (!fs.existsSync(path.join(__dirname, 'firebase.json'))) {
    log('No se encontró el archivo firebase.json. Creando uno...', 'warning');
    
    const firebaseConfig = {
      "storage": {
        "rules": "storage.rules"
      }
    };
    
    fs.writeFileSync(path.join(__dirname, 'firebase.json'), JSON.stringify(firebaseConfig, null, 2));
    log('Archivo firebase.json creado correctamente', 'success');
  }
  
  // Aplicar reglas de seguridad
  const result = executeCommand('firebase deploy --only storage');
  if (!result.success) {
    log('Error al aplicar reglas de seguridad:', 'error');
    log(result.error, 'error');
    
    log('Por favor, configura las reglas de seguridad manualmente desde la consola de Firebase.', 'warning');
    log('Instrucciones:', 'info');
    log('1. Ve a https://console.firebase.google.com/project/documentos-compartidos-cf6bd/storage', 'info');
    log('2. Haz clic en "Reglas"', 'info');
    log('3. Configura las reglas según la documentación: https://firebase.google.com/docs/storage/security', 'info');
  } else {
    log('Reglas de seguridad aplicadas correctamente', 'success');
  }
}

// Función principal
function main() {
  console.log(`\n${colors.bright}${colors.cyan}=== Configuración de CORS para Firebase Storage ===${colors.reset}\n`);
  
  try {
    checkFirebaseCLI();
    checkFirebaseAuth();
    createCorsFile();
    applyCorsConfig();
    applySecurityRules();
    
    console.log(`\n${colors.green}${colors.bright}✓ Configuración completada con éxito${colors.reset}`);
    console.log(`\n${colors.cyan}Ahora deberías poder subir y descargar archivos desde tu aplicación.${colors.reset}`);
    console.log(`${colors.cyan}Si sigues teniendo problemas, verifica la consola del navegador para más detalles.${colors.reset}\n`);
    
    // Instrucciones adicionales
    console.log(`${colors.yellow}${colors.bright}Instrucciones adicionales:${colors.reset}`);
    console.log(`${colors.yellow}1. Si sigues teniendo problemas, intenta habilitar el emulador de Firebase Storage:${colors.reset}`);
    console.log(`   - Asegúrate de que la línea "connectStorageEmulator" en el archivo firebase/config.ts está habilitada`);
    console.log(`   - Ejecuta: firebase emulators:start --only storage`);
    console.log(`${colors.yellow}2. Asegúrate de que tu bucket de Firebase Storage existe y está correctamente configurado:${colors.reset}`);
    console.log(`   - Ve a https://console.firebase.google.com/project/documentos-compartidos-cf6bd/storage`);
    console.log(`   - Si no existe, crea un nuevo bucket`);
    console.log(`${colors.yellow}3. Verifica que el dominio de tu aplicación está permitido en Firebase:${colors.reset}`);
    console.log(`   - Ve a https://console.firebase.google.com/project/documentos-compartidos-cf6bd/authentication/settings`);
    console.log(`   - Añade tu dominio (o localhost) a los dominios autorizados`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Error durante la configuración:${colors.reset}`, error);
    process.exit(1);
  }
}

// Ejecutar función principal
main(); 