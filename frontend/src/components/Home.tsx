import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Grid 
} from '@mui/material';
import MainLayout from './layout/MainLayout';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                backgroundImage: 'linear-gradient(to right, #e0f7fa, #bbdefb)',
                borderRadius: '16px'
              }}
            >
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom
                sx={{ fontWeight: 'bold', color: '#1565c0' }}
              >
                Documentos Compartidos
              </Typography>
              <Typography variant="h6" paragraph color="text.secondary">
                Plataforma para compartir documentos educativos organizados por nivel académico
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Registrarse
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: '16px' }}>
              <Typography variant="h5" component="h2" gutterBottom color="primary">
                Universidad
              </Typography>
              <Typography variant="body1" paragraph>
                Accede a documentos universitarios organizados por facultades y carreras.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/universidad')}
              >
                Explorar
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: '16px' }}>
              <Typography variant="h5" component="h2" gutterBottom color="primary">
                Grado Superior
              </Typography>
              <Typography variant="body1" paragraph>
                Documentos para ciclos formativos de grado superior por especialidades.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/grado-superior')}
              >
                Explorar
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: '16px' }}>
              <Typography variant="h5" component="h2" gutterBottom color="primary">
                Bachillerato
              </Typography>
              <Typography variant="body1" paragraph>
                Material de estudio para todas las modalidades de bachillerato.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/bachillerato')}
              >
                Explorar
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default Home; 