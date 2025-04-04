import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Alert, 
  Paper,
  CircularProgress,
  Link,
  Divider
} from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import LockResetIcon from '@mui/icons-material/LockReset';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Se ha enviado un correo de recuperación a tu dirección de correo. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.');
      toast.success('Correo de recuperación enviado');
      
      // Limpiar formulario
      setEmail('');
      
      // Redirigir después de 5 segundos
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (error: any) {
      console.error('Error al enviar correo de recuperación:', error);
      
      // Manejar errores específicos
      if (error.code === 'auth/user-not-found') {
        setError('No existe ningún usuario con este correo electrónico');
      } else if (error.code === 'auth/invalid-email') {
        setError('Formato de correo electrónico inválido');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Error de red. Comprueba tu conexión a internet');
      } else {
        setError(`Error al enviar correo: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mb: 3 }}>
          <LockResetIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Recuperar Contraseña
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Typography variant="body1" paragraph align="center">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </Typography>
        
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
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar Correo de Recuperación'}
          </Button>
          
          <Divider sx={{ my: 2 }}>o</Divider>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/login')}
              sx={{ textDecoration: 'none' }}
            >
              Volver al inicio de sesión
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 