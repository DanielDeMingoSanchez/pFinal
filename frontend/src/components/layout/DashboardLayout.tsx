import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, Typography } from '@mui/material';
import { 
  FaHome, 
  FaGraduationCap, 
  FaBook, 
  FaBriefcase, 
  FaHardHat, 
  FaEllipsisH, 
  FaBars,
  FaChevronLeft 
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_WIDTH = 280;

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <MdDashboard size={22} />, path: '/documentos' },
    { name: 'Universidad', icon: <FaGraduationCap size={22} />, path: '/universidad' },
    { name: 'Grado Superior', icon: <FaBook size={22} />, path: '/grado-superior' },
    { name: 'Bachillerato', icon: <FaBook size={22} />, path: '/bachillerato' },
    { name: 'Profesional', icon: <FaBriefcase size={22} />, path: '/profesional' },
    { name: 'Otros', icon: <FaEllipsisH size={22} />, path: '/otros' }
  ];

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Drawer para pantallas pequeñas */}
      <Drawer
        variant="temporary"
        open={isDrawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{ 
          '& .MuiDrawer-paper': {
            width: NAV_WIDTH,
            borderRadius: '0 16px 16px 0',
            border: 'none',
            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
            background: theme => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
          },
          display: { xs: 'block', md: 'none' }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Navegación
          </Typography>
          <IconButton onClick={toggleDrawer}>
            <FaChevronLeft />
          </IconButton>
        </Box>
        <Box sx={{ p: 2 }}>
          <NavList items={navItems} location={location} navigate={navigate} toggleDrawer={toggleDrawer} />
        </Box>
      </Drawer>
      
      {/* Drawer para pantallas medianas y grandes */}
      <Drawer
        variant="permanent"
        sx={{
          width: NAV_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: NAV_WIDTH,
            borderRadius: '0 16px 16px 0',
            border: 'none',
            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
            background: theme => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
          },
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Documentos Compartidos
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <NavList items={navItems} location={location} navigate={navigate} />
        </Box>
      </Drawer>
      
      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          width: { xs: '100%', md: `calc(100% - ${NAV_WIDTH}px)` },
          minHeight: '100vh',
          background: theme => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
          transition: 'all 0.3s'
        }}
      >
        {/* Botón de menú para móviles */}
        <IconButton
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1100,
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid',
            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={toggleDrawer}
        >
          <FaBars />
        </IconButton>
        
        {/* Contenido del Dashboard */}
        {children}
      </Box>
    </Box>
  );
};

// Componente de lista de navegación
interface NavListProps {
  items: Array<{ name: string; icon: React.ReactNode; path: string }>;
  location: { pathname: string };
  navigate: (path: string) => void;
  toggleDrawer?: () => void;
}

const NavList: React.FC<NavListProps> = ({ items, location, navigate, toggleDrawer }) => {
  return (
    <List>
      {items.map((item, index) => {
        const isActive = location.pathname === item.path;
        
        return (
          <React.Fragment key={item.name}>
            <ListItem
              button
              onClick={() => {
                navigate(item.path);
                if (toggleDrawer) toggleDrawer();
              }}
              sx={{
                borderRadius: '12px',
                mb: 1,
                backgroundColor: isActive 
                  ? theme => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                color: isActive 
                  ? theme => theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb'
                  : theme => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1e293b',
                '&:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(59, 130, 246, 0.05)',
                },
                transition: 'all 0.2s'
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive 
                    ? theme => theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb'
                    : theme => theme.palette.mode === 'dark' ? '#e5e7eb' : '#64748b',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.name} 
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItem>
            {index === 0 && (
              <Divider 
                sx={{ 
                  my: 2,
                  borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }} 
              />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Botón de inicio como última opción */}
      <ListItem
        button
        onClick={() => {
          navigate('/');
          if (toggleDrawer) toggleDrawer();
        }}
        sx={{
          borderRadius: '12px',
          mt: 2,
          backgroundColor: 'transparent',
          color: theme => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1e293b',
          '&:hover': {
            backgroundColor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(59, 130, 246, 0.05)',
          },
          transition: 'all 0.2s'
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: theme => theme.palette.mode === 'dark' ? '#e5e7eb' : '#64748b',
          }}
        >
          <FaHome size={22} />
        </ListItemIcon>
        <ListItemText primary="Inicio" />
      </ListItem>
    </List>
  );
};

export default DashboardLayout; 