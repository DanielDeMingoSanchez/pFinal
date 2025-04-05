import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
  ListItemIcon
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface NavbarProps {
  showLogout?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showLogout = true }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = auth.currentUser;

  // Determinar si mostrar el botón de volver (no mostrarlo en la página principal)
  const showBackButton = location.pathname !== '/' && location.pathname !== '/login';

  // Inicializar tema desde localStorage al cargar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
  }, []);

  // Controlar el menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Manejar cambio de tema
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Actualizar localStorage y clases CSS
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  // Manejar logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(clearAuth());
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
    handleMenuClose();
  };

  // Manejar volver atrás
  const handleGoBack = () => {
    navigate(-1); // Navega a la página anterior en el historial
  };

  // Obtener las iniciales para el avatar
  const getAvatarText = () => {
    if (currentUser?.displayName) {
      const nameParts = currentUser.displayName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return currentUser.displayName[0].toUpperCase();
    } else if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={1}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.97)' : 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 1px 10px rgba(0,0,0,0.08)'
      }}
    >
      
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ 
              mr: 2,
              color: darkMode ? 'white' : '#1f2937' 
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Botón de volver atrás */}
        {showBackButton && (
          <Tooltip title="Volver">
            <IconButton 
              onClick={handleGoBack}
              edge="start"
              aria-label="volver atrás"
              sx={{ 
                mr: 2,
                color: darkMode ? 'white' : '#1f2937'
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            color: darkMode ? 'white' : '#1f2937',
            fontWeight: 'bold',
            textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
          }}
          onClick={() => navigate('/')}
        >
          <SchoolIcon sx={{ mr: 1, color: darkMode ? 'white' : '#1f2937' }} /> 
          D.Mingo - Compartidos
        </Typography>
        
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Botón de modo oscuro */}
          <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
            <IconButton 
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              sx={{ 
                color: darkMode ? 'white' : '#1f2937',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Botón de perfil y logout (solo si showLogout es true) */}
          {showLogout && (
            <>
              <Button
                onClick={handleMenuOpen}
                startIcon={
                  <Avatar 
                    sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                    src={currentUser?.photoURL || undefined}
                  >
                    {getAvatarText()}
                  </Avatar>
                }
                sx={{ 
                  textTransform: 'none',
                  color: darkMode ? 'white' : '#1f2937',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  },
                  fontWeight: 'medium'
                }}
              >
                {currentUser?.displayName || 'Usuario'}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: { 
                    width: 200,
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body1">Perfil</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body1">Mis documentos</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body1">Cerrar sesión</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  
  );
  
};


                
             

export default Navbar; 