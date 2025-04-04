import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import { MdError } from 'react-icons/md';
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

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [titleHovered, setTitleHovered] = useState(false);
  const [errors, setErrors] = useState<{nombre?: string; email?: string; password?: string}>({});
  const [touched, setTouched] = useState<{nombre: boolean; email: boolean; password: boolean}>({
    nombre: false, 
    email: false, 
    password: false
  });
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

  // Función para validar el nombre
  const validateNombre = (nombre: string): string | undefined => {
    const soloLetrasYNumeros = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/;
    if (!nombre) {
      return 'El nombre es obligatorio';
    } else if (nombre.length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    } else if (!soloLetrasYNumeros.test(nombre)) {
      return 'El nombre solo puede contener letras y números';
    }
    return undefined;
  };

  // Función para validar el email
  const validateEmail = (email: string): string | undefined => {
    // Expresión regular para validar correos electrónicos
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      return 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(email)) {
      return 'Ingresa un formato de correo electrónico válido (ejemplo@dominio.com)';
    }
    return undefined;
  };

  // Función para validar la contraseña
  const validatePassword = (password: string): string | undefined => {
    // Expresiones regulares para validar requisitos de contraseña
    const mayusculaRegex = /[A-Z]/;
    const caracterEspecialRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    
    if (!password) {
      return 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    } else if (!mayusculaRegex.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula';
    } else if (!caracterEspecialRegex.test(password)) {
      return 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)';
    }
    return undefined;
  };

  // Validar al cambiar los campos
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNombre(value);
    if (touched.nombre) {
      setErrors(prev => ({...prev, nombre: validateNombre(value)}));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({...prev, email: validateEmail(value)}));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({...prev, password: validatePassword(value)}));
    }
  };

  // Marcar campo como tocado cuando pierde el foco
  const handleBlur = (field: 'nombre' | 'email' | 'password') => {
    setTouched(prev => ({...prev, [field]: true}));
    if (field === 'nombre') {
      setErrors(prev => ({...prev, nombre: validateNombre(nombre)}));
    } else if (field === 'email') {
      setErrors(prev => ({...prev, email: validateEmail(email)}));
    } else {
      setErrors(prev => ({...prev, password: validatePassword(password)}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos antes de enviar
    const nombreError = validateNombre(nombre);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      nombre: nombreError,
      email: emailError,
      password: passwordError
    });
    
    setTouched({nombre: true, email: true, password: true});
    
    // Si hay errores, no continuar
    if (nombreError || emailError || passwordError) {
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email,
        nombre,
        createdAt: new Date().toISOString()
      });
      toast.success('¡Registro exitoso! 🚀');
      navigate('/');
    } catch (err: any) {
      // Mensajes de error más específicos basados en el código de error de Firebase
      if (err.code === 'auth/email-already-in-use') {
        toast.error('Este correo electrónico ya está registrado');
      } else if (err.code === 'auth/invalid-email') {
        toast.error('El formato del correo electrónico no es válido');
      } else if (err.code === 'auth/weak-password') {
        toast.error('La contraseña es demasiado débil');
      } else {
        toast.error('Error al registrarse. Por favor, inténtalo de nuevo.');
      }
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
              Nuevo Usuario
            </h1>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div 
              className="relative mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute left-3 top-3" style={{ color: '#3B82F6' }}>
                <FaUser />
              </div>
              <input
                type="text"
                placeholder="Nombre Completo"
                value={nombre}
                onChange={handleNombreChange}
                onBlur={() => handleBlur('nombre')}
                className={`w-full p-3 pl-10 border ${errors.nombre && touched.nombre ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white transition-all duration-300`}
                required
              />
              <p></p>
              {errors.nombre && touched.nombre && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 flex items-center"
                >
                  <span style={{ color: '#DC2626', marginRight: '4px' }}><MdError /></span>
                  {errors.nombre}
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="relative mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              
              <div className="absolute left-3 top-3" style={{ color: '#F97316' }}>
                <FaEnvelope />
              </div>
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                className={`w-full p-3 pl-10 border ${errors.email && touched.email ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white transition-all duration-300`}
                required
              />
              {errors.email && touched.email && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 flex items-center"
                >
                  <span style={{ color: '#DC2626', marginRight: '4px' }}><MdError /></span>
                  {errors.email}
                </motion.div>
              )}
            </motion.div>
            <p></p>
            <motion.div 
              className="relative mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="absolute left-3 top-3" style={{ color: '#FACC15' }}>
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                className={`w-full p-3 pl-10 border ${errors.password && touched.password ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white transition-all duration-300`}
                required
              />
              {errors.password && touched.password && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 flex items-center"
                >
                  <span style={{ color: '#DC2626', marginRight: '4px' }}><MdError /></span>
                  {errors.password}
                </motion.div>
              )}
            </motion.div>

            <div style={buttonContainerStyle}>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span className="mr-2"><FaUserPlus /></span> Registrarse
                  </>
                )}
              </motion.button>
            </div>
          </form>
                  <p></p>
          <motion.div 
            className="text-center mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <BackButton 
              route="/login" 
              label="¿Ya tienes cuenta? Inicia sesión aquí" 
              variant="text" 
              color="primary"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register; 