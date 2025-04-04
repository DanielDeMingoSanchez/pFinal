import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';
import FooterComponent from './Footer';
import AdminMessageComponent from '../admin/AdminMessage';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Inicializar tema desde localStorage al cargar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
  }, []);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: darkMode ? 'var(--dark-bg)' : 'var(--light-bg)',
        color: darkMode ? 'var(--dark-text)' : 'var(--light-text)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Componente para mostrar mensajes del administrador */}
      <AdminMessageComponent />
      
      {/* Navbar en la parte superior */}
      <Navbar />
      
      {/* Contenido principal con margen superior para el navbar */}
      <Container
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, sm: 9 }, // Padding top para compensar la altura del navbar
          pb: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>
      
      {/* Footer en la parte inferior */}
      <FooterComponent />
    </Box>
  );
};

export default MainLayout; 