import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
const createAdmin = async () => {
    try {
        const email = 'admin@admin.com';
        const password = 'D12345!admin';
        const displayName = 'Administrador';
        // Crear usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Actualizar perfil
        await updateProfile(user, {
            displayName: displayName
        });
        // Crear documento en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            displayName: displayName,
            isAdmin: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Usuario administrador creado exitosamente');
    }
    catch (error) {
        console.error('Error al crear usuario administrador:', error);
    }
};
createAdmin();
