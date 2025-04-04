import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import Navbar from './layout/Navbar';
import BackButton from './ui/BackButton';

// Estilos inline para asegurar el centrado
const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100%',
  margin: '0 auto',
  padding: '0',
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  background: 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)'
};

const formContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto'
};

// Estilos para los iconos
const userIconContainerStyle: React.CSSProperties = {
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#F97316' // orange-400
};

const lockIconContainerStyle: React.CSSProperties = {
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#FACC15' // yellow-400
};

// Estilo para el título
const titleStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #FF6B6B, #6B66FF)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  cursor: 'pointer'
};

// Estilo para el botón con margen superior moderado
const buttonContainerStyle: React.CSSProperties = {
  marginTop: '40px' // Margen superior moderado para el botón
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [titleHovered, setTitleHovered] = useState(false);
  const navigate = useNavigate();

  // Asegurarse de que el componente ocupe toda la pantalla
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    // Cargar la fuente Poppins de Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.head.removeChild(link);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Inicio de sesión exitoso! 🚀');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      {/* Navbar solo con el botón de tema */}
      <Navbar showLogout={false} />
      
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 mx-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            onHoverStart={() => setTitleHovered(true)}
            onHoverEnd={() => setTitleHovered(false)}
            className="text-center mb-8"
          >
            <h1 
              style={titleStyle} 
              className={`text-3xl font-bold ${titleHovered ? 'animate-pulse' : ''}`}
            >
              Bienvenido   :)
            </h1>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute left-3 top-3" style={{ color: '#F97316' }}>
                <FaUser />
              </div>
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white transition-all duration-300"
                required
              />
            </motion.div>
              <p></p>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute left-3 top-3" style={{ color: '#FACC15' }}>
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white transition-all duration-300"
                required
              />
            </motion.div>

            <div style={buttonContainerStyle}>
              <motion.button
                type="submit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03, backgroundColor: '#4CAF50' }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 shadow-lg disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>
                ) : (
                  <>
                    <div className="mr-2">
                      <FaSignInAlt />
                    </div>
                    Iniciar Sesión
                  </>
                )}
              </motion.button>
            </div>
            <p></p>
          </form>

          <motion.div 
            className="text-center mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-3">
              <Link
                to="/register"
                className="text-indigo-600 dark:text-indigo-400 hover:underline transition-all duration-300"
              >
                ¿No tienes cuenta? Regístrate <span style={{ color: '#DC2626', fontWeight: 'bold' }}>aquí</span>
              </Link>
              <p></p>
            </div>
            <div>
              <Link
                to="/recuperar-password"
                className="text-amber-600 dark:text-amber-400 hover:underline transition-all duration-300"
              >
                ¿Olvidaste tu contraseña? Recupérala <span style={{ color: '#DC2626', fontWeight: 'bold' }}>aquí</span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 