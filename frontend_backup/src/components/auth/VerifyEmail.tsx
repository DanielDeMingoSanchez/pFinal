import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Divider,
  TextField
} from '@mui/material';
import { auth } from '../../firebase/config';
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import LockOpenIcon from '@mui/icons-material/LockOpen';

interface LocationState {
  email?: string;
}

const VerifyEmail: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state as LocationState) || {};
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleResendEmail = async () => {
    if (!email) {
      setError('No se ha proporcionado un correo electrónico. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    setShowPasswordField(true);
  };
  
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Por favor, ingresa tu contraseña');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Iniciar sesión temporalmente para enviar el correo
      const userCredential = await signInWithEmailAndPassword(auth, email!, password);
      const user = userCredential.user;
      
      // Verificar si el correo ya fue verificado
      if (user.emailVerified) {
        setSuccess('¡Tu correo ya ha sido verificado! Redirigiendo al inicio de sesión...');
        toast.success('Correo verificado correctamente');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Enviar nuevo correo de verificación
        await sendEmailVerification(user);
        
        setSuccess('Se ha enviado un nuevo correo de verificación. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).');
        toast.success('Correo de verificación enviado');
        setCountdown(60); // Esperar 60 segundos antes de permitir reenviar
        setShowPasswordField(false);
      }
      
      // Cerrar sesión después de enviar el correo
      await signOut(auth);
    } catch (error: any) {
      console.error('Error:', error);
      
      if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta. No se pudo reenviar el correo de verificación.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No se encontró usuario con este correo electrónico.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckVerification = async () => {
    if (!email) {
      setError('No se ha proporcionado un correo electrónico. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    setShowPasswordField(true);
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <EmailIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Verificación de Correo
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            icon={<MarkEmailReadIcon />}
          >
            {success}
          </Alert>
        )}
        
        {!showPasswordField ? (
          <>
            <Box sx={{ my: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                ¡PARA CONTINUAR, VERIFIQUE SU EMAIL!
              </Typography>
              
              <Typography variant="body1" paragraph>
                Se ha enviado un correo de verificación a: <strong>{email || 'tu dirección de correo'}</strong>
              </Typography>
              
              <Typography variant="body1" paragraph>
                Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace de verificación.
              </Typography>
              
              <Typography variant="body1" paragraph>
                Una vez verificado tu correo, podrás iniciar sesión en la aplicación.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCheckVerification}
                startIcon={<MarkEmailReadIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                He verificado mi correo
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleResendEmail}
                startIcon={<EmailIcon />}
                disabled={countdown > 0}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {countdown > 0 ? `Reenviar correo (${countdown}s)` : 'Reenviar correo de verificación'}
              </Button>
              
              <Divider sx={{ my: 1 }}>o</Divider>
              
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                startIcon={<LockOpenIcon />}
                fullWidth
                sx={{ py: 1 }}
              >
                Volver al inicio de sesión
              </Button>
            </Box>
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmitPassword} sx={{ my: 3 }}>
            <Typography variant="body1" gutterBottom>
              Por favor, ingresa tu contraseña para {showPasswordField ? 'verificar tu estado o reenviar el correo de verificación' : ''}:
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirmar'}
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setShowPasswordField(false);
                  setPassword('');
                  setError('');
                }}
                sx={{ py: 1.5 }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmail; 