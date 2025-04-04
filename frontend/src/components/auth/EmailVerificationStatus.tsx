import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Tooltip } from '@mui/material';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaEnvelope } from 'react-icons/fa';

interface EmailVerificationStatusProps {
  onVerificationChange?: (isVerified: boolean) => void;
}

const EmailVerificationStatus: React.FC<EmailVerificationStatusProps> = ({ 
  onVerificationChange 
}) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const checkVerificationStatus = async () => {
      setLoading(true);
      try {
        if (currentUser) {
          // Recargar el usuario para obtener el estado más reciente
          await reload(currentUser);
          setIsVerified(currentUser.emailVerified);
          if (onVerificationChange) {
            onVerificationChange(currentUser.emailVerified);
          }
        }
      } catch (error) {
        console.error('Error al verificar el estado del correo:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();

    // Verificar el estado cada 30 segundos
    const interval = setInterval(checkVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, [currentUser, onVerificationChange]);

  const handleResendVerification = async () => {
    if (!currentUser) return;
    
    setSendingEmail(true);
    try {
      await sendEmailVerification(currentUser);
      toast.success('Correo de verificación enviado. Por favor, revisa tu bandeja de entrada y la carpeta de spam.');
    } catch (error: any) {
      let errorMessage = 'Error al enviar el correo de verificación.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Has enviado demasiadas solicitudes. Por favor, intenta más tarde.';
      }
      
      toast.error(errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2">Verificando estado...</Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Typography variant="body2" color="text.secondary">
        Debes iniciar sesión para ver el estado de verificación.
      </Typography>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        bgcolor: isVerified ? 'success.light' : 'warning.light',
        color: isVerified ? 'success.contrastText' : 'warning.contrastText',
        mb: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {isVerified ? (
          <FaCheckCircle size={20} style={{ marginRight: '8px' }} />
        ) : (
          <FaTimesCircle size={20} style={{ marginRight: '8px' }} />
        )}
        <Typography variant="subtitle1" fontWeight="medium">
          {isVerified 
            ? 'Correo electrónico verificado' 
            : 'Correo electrónico no verificado'}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        {isVerified 
          ? 'Tu cuenta está completamente activada y puedes acceder a todas las funciones.' 
          : 'Por favor, verifica tu correo electrónico para acceder a todas las funciones de la plataforma.'}
      </Typography>
      
      {!isVerified && (
        <Tooltip title="Te enviaremos un correo con un enlace para verificar tu cuenta">
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={handleResendVerification}
            disabled={sendingEmail}
            startIcon={sendingEmail ? <CircularProgress size={16} color="inherit" /> : <FaEnvelope />}
          >
            {sendingEmail ? 'Enviando...' : 'Reenviar correo de verificación'}
          </Button>
        </Tooltip>
      )}
    </Paper>
  );
};

export default EmailVerificationStatus; 