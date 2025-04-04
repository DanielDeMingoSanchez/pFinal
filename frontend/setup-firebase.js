// Este script debe ejecutarse con Firebase CLI instalado
// npm install -g firebase-tools

// Para ejecutar:
// 1. firebase login
// 2. node setup-firebase.js

const { exec } = require('child_process');

console.log('Configurando Firebase Storage...');

// Aplicar reglas de CORS
console.log('Aplicando reglas CORS...');
exec('firebase storage:cors set cors.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al aplicar reglas CORS: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  console.log(`Reglas CORS aplicadas correctamente: ${stdout}`);
  
  // Aplicar reglas de seguridad
  console.log('Aplicando reglas de seguridad...');
  exec('firebase deploy --only storage', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al aplicar reglas de seguridad: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(`Reglas de seguridad aplicadas correctamente: ${stdout}`);
    console.log('Configuración de Firebase Storage completada.');
  });
}); 