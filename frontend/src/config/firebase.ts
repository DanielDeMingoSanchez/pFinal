import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  storageBucket: 'documentos-compartidos-cf6bd.firebasestorage.app'
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app); 