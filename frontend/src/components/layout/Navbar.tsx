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
  ListItemIcon,
  Badge,
  InputBase,
  alpha,
  Paper
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface NavbarProps {
  showLogout?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showLogout = true }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
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

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navegamos a la página de documentos con el término de búsqueda
      navigate(`/documentos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Manejar cambio en el texto de búsqueda (búsqueda en tiempo real)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    
    // Si estamos en la página de documentos, aplicar la búsqueda en tiempo real
    if (location.pathname === '/documentos') {
      // Actualizar la URL sin recargar la página
      const searchParams = new URLSearchParams(location.search);
      if (newTerm.trim()) {
        searchParams.set('search', newTerm.trim());
      } else {
        searchParams.delete('search');
      }
      
      const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      
      // Disparar un evento personalizado para que el Dashboard lo capture
      const searchEvent = new CustomEvent('navbarSearch', { detail: { term: newTerm } });
      window.dispatchEvent(searchEvent);
    } else if (newTerm.trim()) {
      // Si no estamos en la página de documentos y hay texto, navegar a la página de documentos
      if (newTerm.length >= 2) { // Solo navegar cuando haya al menos 2 caracteres
        navigate(`/documentos?search=${encodeURIComponent(newTerm.trim())}`);
      }
    }
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
            flexGrow: 0, 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            color: darkMode ? 'white' : '#1f2937',
            fontWeight: 'bold',
            textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            mr: { xs: 1, md: 2 }
          }}
          onClick={() => navigate('/')}
        >
          <SchoolIcon sx={{ mr: 1, color: darkMode ? 'white' : '#1f2937' }} /> 
          D.Mingo - Compartidos
        </Typography>
        
        {/* Espacio flexible antes de la barra de búsqueda para centrarla */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
        
        {/* Barra de búsqueda global */}
        {currentUser && !isSmallScreen && (
          <Box 
            component="form" 
            onSubmit={handleSearch}
            sx={{ 
              flexGrow: 0,
              display: 'flex',
              width: { sm: '250px', md: '300px', lg: '400px' },
              position: 'relative',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              borderRadius: '20px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
              }
            }}
          >
            <InputBase
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{
                flex: 1,
                p: '8px 16px',
                pl: '16px',
                backgroundColor: darkMode 
                  ? alpha(theme.palette.common.white, 0.08)
                  : alpha(theme.palette.common.white, 0.9),
                borderRadius: '20px',
                color: darkMode ? 'white' : '#1f2937',
                '&::placeholder': {
                  color: darkMode ? alpha(theme.palette.common.white, 0.6) : alpha(theme.palette.common.black, 0.6),
                },
              }}
            />
            <IconButton 
              type="submit" 
              aria-label="buscar"
              sx={{ 
                p: '8px',
                color: darkMode ? 'white' : '#1f2937',
                backgroundColor: 'transparent',
                borderRadius: '0 20px 20px 0',
              }}
            >
              <SearchIcon />
            </IconButton>
          </Box>
        )}

        {/* Espacio flexible después de la barra de búsqueda para centrarla */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        {/* Icono de búsqueda para dispositivos pequeños */}
        {currentUser && isSmallScreen && (
          <Tooltip title="Buscar">
            <IconButton
              onClick={() => navigate('/documentos')}
              aria-label="Buscar documentos"
              sx={{ 
                color: darkMode ? 'white' : '#1f2937',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Botón de Chat */}
          <Tooltip title="Chat global">
            <IconButton
              onClick={() => navigate('/chat')}
              aria-label="Chat global"
              sx={{ 
                color: darkMode ? 'white' : '#1f2937',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <Badge color="secondary" variant="dot">
                <ChatIcon />
              </Badge>
            </IconButton>
          </Tooltip>

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
                <MenuItem onClick={() => { handleMenuClose(); navigate('/documentos'); }} sx={{ py: 1.5 }}>
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