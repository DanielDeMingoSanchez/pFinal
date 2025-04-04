import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCakb6bXjlSEseQFafaITwHtPeKztHDhIc",
    authDomain: "documentos-compartidos-cf6bd.firebaseapp.com",
    projectId: "documentos-compartidos-cf6bd",
    storageBucket: "documentos-compartidos-cf6bd.firebasestorage.app",
    messagingSenderId: "894188959960",
    appId: "1:894188959960:web:d8f5a9b89e4e3c5f0a1234"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);
// Exportar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
// Configuración correcta para Storage
export const storage = getStorage(app);
// Desactivar el emulador y usar directamente Firebase Storage
// El emulador está causando problemas de CORS, así que es mejor usar directamente Firebase Storage
// if (window.location.hostname === 'localhost') {
//   // Conectar al emulador de Storage
//   connectStorageEmulator(storage, 'localhost', 9199);
//   console.log('Conectado al emulador de Firebase Storage en localhost:9199');
// }
export default app;
