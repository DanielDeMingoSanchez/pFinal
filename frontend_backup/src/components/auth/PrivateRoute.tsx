import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsVerified(user.emailVerified);
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
        return <Navigate to="/verificar-email" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute; 