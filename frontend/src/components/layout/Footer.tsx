import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const FooterComponent: React.FC = () => {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const email = 'rnyme123@gmail.com';
  const phone = '+34 680 332 449';

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        mt: 'auto',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'divider',
        backgroundColor: isDarkMode 
          ? '#000000' 
          : 'rgba(255, 255, 255, 0.95)',
        position: 'relative',
        zIndex: 1,
        color: isDarkMode ? '#FFFFFF' : 'inherit'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Contacto */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FaEnvelope className="text-gray-600 dark:text-white mr-2" />
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowEmail(true)}
                    onMouseLeave={() => setShowEmail(false)}
                    onClick={handleEmailClick}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {showEmail ? email : 'Correo electrónico'}
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-gray-600 dark:text-white mr-2" />
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowPhone(true)}
                    onMouseLeave={() => setShowPhone(false)}
                    onClick={handlePhoneClick}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {showPhone ? phone : 'Teléfono de contacto'}
                  </button>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-2">Síguenos</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                  <FaFacebook size={20} />
                </a>
                <a href="#" className="text-gray-600 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="text-gray-600 dark:text-white hover:text-pink-600 dark:hover:text-pink-400">
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="text-gray-600 dark:text-white hover:text-blue-700 dark:hover:text-blue-500">
                  <FaLinkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-900 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-white">
            &copy; {new Date().getFullYear()} Daniel De Mingo Sanchez. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </Box>
  );
};

export default FooterComponent; 