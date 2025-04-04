import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { auth } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { setToken, setUser, clearAuth } from './store/slices/authSlice';

// Componentes
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VerifyEmail from './components/auth/VerifyEmail';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/auth/PrivateRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import Universidad from './components/educacion/Universidad';
import GradoSuperior from './components/educacion/GradoSuperior';
import Bachillerato from './components/educacion/Bachillerato';
import Profesional from './components/educacion/Profesional';
import Otros from './components/educacion/Otros';
import RecuperarPassword from './components/RecuperarPassword';
import Profile from './components/Profile';
import UserDocuments from './components/UserDocuments';
import FloatingBackButton from './components/ui/FloatingBackButton';
import ChatGlobal from './components/ChatGlobal';
import AdminPanel from './components/admin/AdminPanel';
import AdminAlert from './components/AdminAlert';
import BroadcastMessage from './components/BroadcastMessage';
import Search from './components/Search';
import './index.css';

// Definir theme
const theme = createTheme({
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 600,
    },
    h4: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 600,
    },
    h5: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 600,
    },
    body1: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    body2: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    button: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 28, // Botones redondeados
          textTransform: 'none',
          padding: '10px 24px',
          fontWeight: 500,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      },
    },
  },
});

// Componente para mostrar el botón flotante en las rutas apropiadas
const BackButtonWrapper = () => {
  const location = useLocation();
  
  // No mostrar el botón flotante en estas rutas
  const excludedRoutes = ['/', '/login', '/register'];
  
  if (excludedRoutes.includes(location.pathname)) {
    return null;
  }
  
  // Si estamos en /documentos, volvemos a la página principal
  // Si estamos en cualquier otra página, vamos a /documentos
  const targetRoute = location.pathname === '/documentos' ? '/' : '/documentos';
  const tooltipText = location.pathname === '/documentos' ? 'Volver a Inicio' : 'Ir a Documentos';
  
  return <FloatingBackButton route={targetRoute} position="bottom-right" tooltip={tooltipText} />;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Importante: recargar el usuario para obtener el estado actualizado de emailVerified
        user.reload().then(() => {
          if (user.emailVerified) {
            // Solo establecer el token si el email está verificado
            user.getIdToken().then(token => {
              dispatch(setToken(token));
              dispatch(setUser({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || ''
              }));
            });
          } else {
            // Si el email no está verificado, cerrar sesión
            console.log('Email no verificado, cerrando sesión...');
            signOut(auth).then(() => {
              dispatch(clearAuth());
            });
          }
        }).catch(error => {
          console.error('Error al recargar usuario:', error);
          dispatch(clearAuth());
        });
      } else {
        dispatch(clearAuth());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <Toaster position="top-right" />
        <AdminAlert />
        <BroadcastMessage />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Rutas protegidas */}
            <Route
              path="/documentos"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ChatGlobal />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/universidad"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Universidad />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/grado-superior"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <GradoSuperior />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bachillerato"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Bachillerato />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profesional"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Profesional />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/otros"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Otros />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <UserDocuments />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            
            {/* Ruta del panel de administración */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <AdminPanel />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            
            {/* Ruta de búsqueda global */}
            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Search />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            
            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <BackButtonWrapper />
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App; 