import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Box, CircularProgress, Typography } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import WelcomeAlert from './WelcomeAlert';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isBanned, setIsBanned] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const isAdminRoute = location.pathname === '/admin';
    const isAdminUser = user?.email === 'dgg53235@jioso.com';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsVerified(user.emailVerified);
                
                // Verificar si el usuario está baneado
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.isBanned) {
                        // Revisar si la fecha de ban existe y si es permanent o ya expiró
                        if (!userData.banEndTime) {
                            // Ban permanente
                            setIsBanned(true);
                        } else {
                            const banEndTime = userData.banEndTime?.toDate();
                            if (banEndTime && banEndTime > new Date()) {
                                setIsBanned(true);
                            } else {
                                // Si el ban ya expiró, actualizar el estado
                                await updateDoc(doc(db, 'users', user.uid), {
                                    isBanned: false,
                                    banEndTime: null
                                });
                            }
                        }
                    }
                }
            } else {
                setIsVerified(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh' 
            }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1">
                    Verificando autenticación...
                </Typography>
            </Box>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!isVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    if (isBanned) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                textAlign: 'center',
                p: 3,
                bgcolor: '#000',
                color: '#ff0000'
            }}>
                <Typography variant="h4" sx={{ 
                    fontWeight: 'bold',
                    mb: 2,
                    color: '#ff0000'
                }}>
                    🚫 Acceso Bloqueado
                </Typography>
                <Typography variant="h6" sx={{ 
                    mb: 2,
                    color: '#ff0000'
                }}>
                    Has sido baneado temporalmente por no cumplir con las normas de la comunidad.
                </Typography>
                <Typography variant="body1" sx={{ 
                    color: '#ff0000'
                }}>
                    Por favor, contacta con el administrador para más información.
                </Typography>
            </Box>
        );
    }

    // Verificar si es una ruta de administrador y si el usuario tiene permisos
    if (isAdminRoute && !isAdminUser) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                textAlign: 'center',
                p: 3,
                bgcolor: '#000',
                color: '#ff0000'
            }}>
                <Typography variant="h4" sx={{ 
                    fontWeight: 'bold',
                    mb: 2,
                    color: '#ff0000'
                }}>
                    ⛔ Acceso Denegado
                </Typography>
                <Typography variant="h6" sx={{ 
                    mb: 2,
                    color: '#ff0000'
                }}>
                    No tienes permisos para acceder al panel de administración.
                </Typography>
                <Typography variant="body1" sx={{ 
                    color: '#ff0000'
                }}>
                    Esta sección está reservada únicamente para administradores.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <WelcomeAlert />
            {children}
        </>
    );
};

export default PrivateRoute; 