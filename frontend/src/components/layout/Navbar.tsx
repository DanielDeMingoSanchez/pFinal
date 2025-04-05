import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  InputBase,
  alpha,
  Badge
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface NavbarProps {
  showLogout?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showLogout = true }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentUser = auth.currentUser;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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

  // Controlar drawer (menú hamburguesa)
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Manejar navegación desde el drawer
  const handleDrawerNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
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
    setDrawerOpen(false);
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

  // Contenido del menú lateral (solo para móvil)
  const drawerContent = (
    <Box
      sx={{ 
        width: 250,
        backgroundColor: darkMode ? '#1f2937' : 'white',
        color: darkMode ? 'white' : '#1f2937',
        height: '100%'
      }}
      role="presentation"
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: darkMode ? '#111827' : '#f3f4f6',
          borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
        }}
      >
        {/* {currentUser && (
          <>
            <Avatar
              sx={{ width: 60, height: 60, mb: 1, bgcolor: 'primary.main' }}
              src={currentUser?.photoURL || undefined}
            >
              {getAvatarText()}
            </Avatar>
            <Typography variant="subtitle1" fontWeight="bold">
              {currentUser?.displayName || currentUser?.email || 'Usuario'}
            </Typography>
            {currentUser?.email && (
              <Typography variant="caption" color={darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
                {currentUser.email}
              </Typography>
            )}
          </>
        )} */}
      </Box>
      
      <List>
        <p></p>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/')}>
            <ListItemIcon>
              <HomeIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Inicio" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/documentos')}>
            <ListItemIcon>
              <DescriptionIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Mis documentos" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/chat')}>
            <ListItemIcon>
              <ChatIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Chat global" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/profile')}>
            <ListItemIcon>
              <PersonIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Perfil" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={toggleDarkMode}>
            <ListItemIcon>
              {darkMode 
                ? <LightModeIcon sx={{ color: 'white' }} /> 
                : <DarkModeIcon sx={{ color: '#1f2937' }} />}
            </ListItemIcon>
            <ListItemText primary={darkMode ? "Modo claro" : "Modo oscuro"} />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/configuracion')}>
            <ListItemIcon>
              <SettingsIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Configuración" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/ayuda')}>
            <ListItemIcon>
              <HelpIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Ayuda" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleDrawerNavigation('/acerca-de')}>
            <ListItemIcon>
              <InfoIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
            </ListItemIcon>
            <ListItemText primary="Acerca de" />
          </ListItemButton>
        </ListItem>
        
        {showLogout && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: darkMode ? 'white' : '#1f2937' }} />
              </ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={1}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.97)' : 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 10px rgba(0,0,0,0.08)',
          height: '60px'
        }}
      >
        <Toolbar sx={{ minHeight: '60px', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: isMobile ? 1 : 0 }}>
            {/* Menú hamburguesa solo para versión móvil */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer}
                sx={{ 
                  mr: 1,
                  color: darkMode ? 'white' : '#1f2937'
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {/* Botón de volver atrás y texto solo para versión no móvil */}
            {!isMobile && (
              <>
                {showBackButton && (
                  <Tooltip title="Volver">
                    <IconButton 
                      onClick={handleGoBack}
                      edge="start"
                      aria-label="volver atrás"
                      sx={{ 
                        mr: 1,
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
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: darkMode ? 'white' : '#1f2937',
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                  onClick={() => navigate('/')}
                >
                  <SchoolIcon sx={{ mr: 1, color: darkMode ? 'white' : '#1f2937' }} /> 
                  D.Mingo
                </Typography>
              </>
            )}
            
            {/* Barra de búsqueda para versión móvil (reemplaza todo el espacio) */}
            {isMobile && currentUser && (
              <Box 
                component="form" 
                onSubmit={handleSearch}
                sx={{ 
                  display: 'flex',
                  flexGrow: 1,
                  position: 'relative',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  mx: 1,
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
                    p: '6px 12px',
                    backgroundColor: darkMode 
                      ? alpha(theme.palette.common.white, 0.08)
                      : alpha(theme.palette.common.white, 0.9),
                    borderRadius: '20px',
                    color: darkMode ? 'white' : '#1f2937',
                    '&::placeholder': {
                      color: darkMode ? alpha(theme.palette.common.white, 0.6) : alpha(theme.palette.common.black, 0.6),
                      fontSize: '0.85rem',
                    },
                    fontSize: '0.9rem',
                  }}
                />
                <IconButton 
                  type="submit" 
                  aria-label="buscar"
                  sx={{ 
                    p: '4px',
                    color: darkMode ? 'white' : '#1f2937',
                    backgroundColor: 'transparent',
                    borderRadius: '0 20px 20px 0',
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          
          {/* Navegación para pantallas no móviles */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
              {/* Botones de navegación */}
              <Button 
                color="inherit" 
                onClick={() => navigate('/')}
                sx={{ 
                  mx: 1, 
                  color: darkMode ? 'white' : '#1f2937',
                  fontWeight: location.pathname === '/' ? 'bold' : 'normal',
                }}
              >
                Inicio
              </Button>
              
              {/* Barra de búsqueda global para pantallas medianas y grandes */}
              {currentUser && (
                <Box 
                  component="form" 
                  onSubmit={handleSearch}
                  sx={{ 
                    display: 'flex',
                    width: { sm: '250px', md: '300px', lg: '400px' },
                    position: 'relative',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    mx: 2,
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
              
              <Button 
                color="inherit" 
                onClick={() => navigate('/documentos')}
                sx={{ 
                  mx: 1, 
                  color: darkMode ? 'white' : '#1f2937',
                  fontWeight: location.pathname === '/documentos' ? 'bold' : 'normal',
                }}
              >
                Documentos
              </Button>
              
              <Button 
                color="inherit" 
                onClick={() => navigate('/chat')}
                sx={{ 
                  mx: 1, 
                  color: darkMode ? 'white' : '#1f2937',
                  fontWeight: location.pathname === '/chat' ? 'bold' : 'normal',
                }}
              >
                Chat
              </Button>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Ya no necesitamos el icono de búsqueda para dispositivos pequeños */}
            
            {/* Botón de tema para pantallas no móviles */}
            {!isMobile && (
              <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
                <IconButton 
                  onClick={toggleDarkMode}
                  aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  sx={{ 
                    color: darkMode ? 'white' : '#1f2937',
                    mr: 1
                  }}
                >
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
            )}
            
            {/* Avatar de usuario: con menú en versión desktop, solo visual en móvil */}
            {showLogout && (
              <>
                {isMobile ? (
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      ml: 1
                    }}
                    src={currentUser?.photoURL || undefined}
                  >
                    {getAvatarText()}
                  </Avatar>
                ) : (
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{ ml: 1 }}
                    aria-label="Menú de usuario"
                  >
                    <Avatar 
                      sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                      src={currentUser?.photoURL || undefined}
                    >
                      {getAvatarText()}
                    </Avatar>
                  </IconButton>
                )}
              </>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { 
                  width: 180,
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
              {!isMobile && (
                <MenuItem onClick={() => { handleMenuClose(); navigate('/configuracion'); }} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body1">Configuración</Typography>
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body1">Cerrar sesión</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer - Menú lateral (solo para móvil) */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              backgroundColor: darkMode ? '#1f2937' : 'white',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Navbar; 