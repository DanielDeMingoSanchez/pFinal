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
import StickHero from './StickHero';
import './Home.scss';

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
          <Grid item xs={12} className="game-section">
            <Paper 
              elevation={3} 
              sx={{ 
                height: '300px',
                width: '660px',
                overflow: 'hidden',
                borderRadius: '16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                margin: '0 auto'
              }}
            >
              <StickHero />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default Home; 