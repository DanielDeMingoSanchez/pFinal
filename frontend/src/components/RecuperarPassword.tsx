import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
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
  marginTop: '40px'
};

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
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

  const handleRecuperarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, introduce tu correo electrónico');
      return;
    }
    
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Se ha enviado un correo para restablecer tu contraseña');
      setEnviado(true);
    } catch (error: any) {
      console.error('Error al enviar el correo de recuperación:', error);
      let errorMessage = 'Error al enviar el correo de recuperación';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe ninguna cuenta con este correo electrónico';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Inténtalo más tarde';
      }
      
      toast.error(errorMessage);
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
              Recuperar Contraseña
            </h1>
          </motion.div>

          {!enviado ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleRecuperarPassword} className="space-y-4">
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="absolute left-3 top-3" style={{ color: '#F97316' }}>
                    <FaEnvelope />
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

                <div style={buttonContainerStyle}>
                  <motion.button
                    type="submit"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.03, backgroundColor: '#4CAF50' }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>
                    ) : (
                      'Enviar Correo de Recuperación'
                    )}
                  </motion.button>
                </div>
                <p></p>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-6">
                <p className="text-green-800 dark:text-green-200">
                  ¡Correo enviado! Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                </p>
              </div>
              
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md flex items-center justify-center mx-auto"
              >
                <FaArrowLeft className="mr-2" />
                Volver al Inicio de Sesión
              </motion.button>
            </motion.div>
          )}

          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <BackButton 
              route="/login" 
              label="Volver al Inicio de Sesión" 
              variant="text" 
              color="primary"
              size="large"
              className="mx-auto"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RecuperarPassword; 