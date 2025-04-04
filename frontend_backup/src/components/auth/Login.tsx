import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Link, 
  Alert, 
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { setToken, setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EmailIcon from '@mui/icons-material/Email';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // CRÍTICO: Verificar si el correo está verificado
      if (!user.emailVerified) {
        // Enviar nuevo correo de verificación
        await sendEmailVerification(user);
        
        // Cerrar sesión inmediatamente
        await signOut(auth);
        
        // Mostrar mensaje de error claro
        setError('PARA CONTINUAR, VERIFIQUE SU EMAIL. Se ha enviado un nuevo correo de verificación a tu dirección. Por favor, verifica tu correo antes de iniciar sesión.');
        
        // Redirigir a la página de verificación
        setTimeout(() => {
          navigate('/verify-email', { state: { email } });
        }, 3000);
        
        setLoading(false);
        return;
      }
      
      // Si el correo está verificado, continuar con el inicio de sesión
      const token = await user.getIdToken();
      dispatch(setToken(token));
      dispatch(setUser({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || ''
      }));
      
      toast.success('Inicio de sesión exitoso ');
      navigate('/documentos');
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      
      // Manejar errores específicos
      if (error.code === 'auth/user-not-found') {
        setError('No existe ningún usuario con este correo electrónico');
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Error de red. Comprueba tu conexión a internet');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos');
      } else {
        setError('Ha ocurrido un error inesperado. Intenta de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mb: 3 }}>
          <LockOpenIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Iniciar Sesión
          </Typography>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            icon={error.includes('VERIFIQUE SU EMAIL') ? <EmailIcon /> : undefined}
          >
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
          </Button>
          
          <Divider sx={{ my: 2 }}>o</Divider>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/register')}
              sx={{ textDecoration: 'none' }}
            >
              ¿No tienes una cuenta? Regístrate
            </Link>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/forgot-password')}
              sx={{ textDecoration: 'none' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 