import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import FooterComponent from './Footer';

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
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: darkMode ? 'var(--dark-bg)' : 'var(--light-bg)',
        color: darkMode ? 'var(--dark-text)' : 'var(--light-text)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Navbar en la parte superior */}
      <Navbar />
      
      {/* Contenido principal con margen superior para el navbar */}
      <Box
        component="main"
        sx={{
          flex: 1,
          pt: { xs: 8, sm: 9 }, // Padding top para compensar la altura del navbar
          px: { xs: 2, sm: 3, md: 4 },
          pb: 4,
        }}
      >
        {children}
      </Box>
      
      {/* Footer en la parte inferior */}
      <FooterComponent />
    </Box>
  );
};

export default MainLayout; 