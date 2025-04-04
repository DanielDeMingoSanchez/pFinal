import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Person as PersonIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import BackButton from './ui/BackButton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Componente para los paneles de pestañas
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile: React.FC = () => {
  const currentUser = auth.currentUser;
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    photoURL: currentUser?.photoURL || '',
    bio: '',
    phone: '',
    location: ''
  });
  
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Referencias para la subida de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Cargar datos adicionales del usuario desde Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          setError(null);
          // Verificar si el documento del usuario existe, si no, crearlo
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileData(prev => ({
              ...prev,
              displayName: currentUser.displayName || prev.displayName,
              email: currentUser.email || prev.email,
              photoURL: currentUser.photoURL || prev.photoURL,
              bio: userData.bio || '',
              phone: userData.phone || '',
              location: userData.location || ''
            }));
          } else {
            // Si el documento no existe, crearlo con los datos básicos
            await setDoc(doc(db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Usuario',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              bio: '',
              phone: '',
              location: '',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            setProfileData(prev => ({
              ...prev,
              displayName: currentUser.displayName || 'Usuario',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || ''
            }));
          }
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
          setError('No se pudieron cargar los datos del perfil');
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Actualizar displayName en Firebase Auth
      await updateProfile(currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });

      // Obtener una referencia al documento del usuario
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Verificar si el documento existe
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Actualizar datos adicionales en Firestore
        await updateDoc(userDocRef, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
          bio: profileData.bio,
          phone: profileData.phone,
          location: profileData.location,
          updatedAt: new Date()
        });
      } else {
        // Si no existe, crearlo
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          displayName: profileData.displayName,
          email: currentUser.email || '',
          photoURL: profileData.photoURL,
          bio: profileData.bio,
          phone: profileData.phone,
          location: profileData.location,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Actualizar el estado local
      setSuccess('Perfil actualizado correctamente');
      toast.success('Perfil actualizado correctamente');
      setIsEditMode(false);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setError('Error al actualizar el perfil. Inténtalo de nuevo.');
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!currentUser || !currentUser.email) return;
    
    // Solo continuar si el email ha cambiado
    if (profileData.email === currentUser.email) {
      toast.info('El correo electrónico es el mismo que el actual');
      return;
    }

    setOpenDialog(true);
  };

  const handleReauthenticate = async () => {
    if (!currentUser || !currentUser.email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Reautenticar al usuario antes de cambiar el email
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Actualizar email
      await updateEmail(currentUser, profileData.email);
      
      setSuccess('Correo electrónico actualizado correctamente');
      toast.success('Correo electrónico actualizado correctamente');
      setOpenDialog(false);
      
      // Limpiar contraseña
      setSecurityData(prev => ({
        ...prev,
        currentPassword: ''
      }));
    } catch (error: any) {
      let errorMessage = 'Error al actualizar el correo electrónico';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentUser || !currentUser.email) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validar nueva contraseña
    if (securityData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }
    
    // Confirmar que las contraseñas coinciden
    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    
    try {
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Actualizar contraseña
      await updatePassword(currentUser, securityData.newPassword);
      
      setSuccess('Contraseña actualizada correctamente');
      toast.success('Contraseña actualizada correctamente');
      
      // Limpiar campos
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      let errorMessage = 'Error al actualizar la contraseña';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña actual incorrecta';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarText = () => {
    if (profileData.displayName) {
      return profileData.displayName.charAt(0).toUpperCase();
    } else if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Función para manejar la subida de la foto de perfil
  const handleAvatarClick = () => {
    if (isEditMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Añadimos logs para depuración
    console.log("Iniciando carga de imagen de perfil:", file.name, file.type, file.size);

    // Validar el archivo
    if (!file.type.includes('image')) {
      setError('Por favor, selecciona una imagen válida');
      toast.error('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    
    // Mostrar toast para indicar que la subida está en progreso
    const toastId = toast.loading('Subiendo imagen...');

    try {
      // Ruta para el archivo en Storage
      const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
      console.log("Referencia de almacenamiento creada:", `profile_images/${currentUser.uid}`);
      
      // Procesar la imagen para dispositivos móviles
      const compressedFile = await processImageForUpload(file);
      console.log("Imagen procesada para carga");
      
      // Subir el archivo
      const uploadTask = await uploadBytes(storageRef, compressedFile);
      console.log("Imagen subida correctamente", uploadTask);
      
      // Obtener la URL de descarga con cache buster para dispositivos móviles
      const timestamp = new Date().getTime();
      const downloadURL = await getDownloadURL(uploadTask.ref);
      const urlWithCacheBuster = `${downloadURL}?t=${timestamp}`;
      console.log("URL de descarga obtenida:", urlWithCacheBuster);
      
      // Actualizar el perfil de Firebase Auth
      await updateProfile(currentUser, {
        photoURL: urlWithCacheBuster
      });
      console.log("Perfil de Firebase Auth actualizado");
      
      // Actualizar el estado local
      setProfileData(prev => ({
        ...prev,
        photoURL: urlWithCacheBuster
      }));
      
      // Actualizar en Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        photoURL: urlWithCacheBuster,
        updatedAt: new Date()
      });
      console.log("Documento de Firestore actualizado");
      
      // Notificar al usuario
      toast.dismiss(toastId);
      toast.success('Foto de perfil actualizada correctamente');
      
      // Forzar actualización de la UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      setError('Error al subir la imagen. Inténtalo de nuevo.');
      toast.dismiss(toastId);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
      
      // Limpiar el input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Función auxiliar para procesar imágenes antes de subir
  const processImageForUpload = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Crear un elemento de imagen para cargar el archivo
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.onload = () => {
            // Crear un canvas para redimensionar si es necesario
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Reducir tamaño si la imagen es muy grande
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round(height * MAX_WIDTH / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round(width * MAX_HEIGHT / height);
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar la imagen redimensionada
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('No se pudo crear el contexto del canvas'));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a blob con calidad reducida para móviles
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Error al convertir canvas a blob'));
                }
              },
              'image/jpeg',
              0.85 // 85% de calidad, buen balance entre tamaño y calidad
            );
          };
          
          img.onerror = () => {
            reject(new Error('Error al cargar la imagen'));
          };
          
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => {
          reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error en el procesamiento de la imagen:', err);
        // Si hay un error, devolver el archivo original
        resolve(file);
      }
    });
  };

  return (
    <Box sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3, md: 4 }, maxWidth: 'lg', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Perfil de Usuario
        </Typography>
        <BackButton route="/documentos" label="Volver a Documentos" />
      </Box>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ 
          p: 3, 
          borderRadius: 2,
          background: theme => theme.palette.mode === 'dark' 
            ? 'rgba(31, 41, 55, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Cabecera del perfil */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: { xs: 'center', sm: 'flex-start' },
              mb: 4 
            }}
          >
            <Box sx={{ position: 'relative', mb: { xs: 2, sm: 0 }, mr: { sm: 3 } }}>
              <Avatar 
                sx={{ 
                  width: { xs: 100, sm: 120 }, 
                  height: { xs: 100, sm: 120 }, 
                  bgcolor: 'primary.main',
                  fontSize: { xs: '2.5rem', sm: '3rem' },
                  boxShadow: 3,
                  cursor: isEditMode ? 'pointer' : 'default',
                  border: isEditMode ? '2px dashed #1976d2' : 'none',
                  transition: 'all 0.3s ease'
                }}
                src={profileData.photoURL || undefined}
                onClick={handleAvatarClick}
                alt={`Foto de perfil de ${profileData.displayName || 'usuario'}`}
              >
                {getAvatarText()}
              </Avatar>
              {isEditMode && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                    capture="user"
                  />
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0, 
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                      color: 'white',
                      zIndex: 10,
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 }
                    }}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar propagación de eventos
                      handleAvatarClick();
                    }}
                    disabled={uploading}
                    aria-label="Cambiar foto de perfil"
                  >
                    {uploading ? <CircularProgress size={24} color="inherit" /> : <PhotoCameraIcon />}
                  </IconButton>
                </>
              )}
              {isEditMode && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    mt: 1, 
                    color: 'text.secondary' 
                  }}
                >
                  Toca para cambiar la foto
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                sx={{ color: theme => theme.palette.mode === 'dark' ? '#FFFFFF !important' : 'inherit' }}
              >
                {profileData.displayName || 'Usuario'}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                gutterBottom 
                className="profile-email"
                sx={{ color: theme => theme.palette.mode === 'dark' ? '#FFFFFF !important' : 'inherit' }}
              >
                {profileData.email}
              </Typography>
              {!isEditMode && profileData.bio && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1, 
                    fontStyle: 'italic',
                    color: theme => theme.palette.mode === 'dark' ? '#FFFFFF !important' : 'inherit'
                  }} 
                  className="profile-bio"
                >
                  {profileData.bio}
                </Typography>
              )}
              <Button 
                variant={isEditMode ? "contained" : "outlined"} 
                color={isEditMode ? "success" : "primary"}
                startIcon={isEditMode ? <SaveIcon /> : <EditIcon />}
                onClick={() => isEditMode ? handleSaveProfile() : setIsEditMode(true)}
                sx={{ mt: 2 }}
                disabled={loading}
              >
                {loading && isEditMode ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isEditMode ? (
                  'Guardar Cambios'
                ) : (
                  'Editar Perfil'
                )}
              </Button>
              {isEditMode && (
                <Button 
                  variant="outlined" 
                  color="error"
                  sx={{ mt: 2, ml: 2 }}
                  onClick={() => setIsEditMode(false)}
                >
                  Cancelar
                </Button>
              )}
            </Box>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="pestañas de perfil"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                label="Información Personal" 
                icon={<PersonIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="Seguridad" 
                icon={<SecurityIcon />} 
                iconPosition="start" 
              />
            </Tabs>
          </Box>

          {/* Pestaña de Información Personal */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre de Usuario"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  disabled={!isEditMode || loading}
                  required
                />
                <TextField
                  label="Correo Electrónico"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  disabled={!isEditMode || loading}
                  required
                  helperText={isEditMode && profileData.email !== currentUser?.email 
                    ? "Para cambiar el correo electrónico será necesario confirmar tu contraseña" 
                    : ""}
                />
                <TextField
                  label="Teléfono"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  disabled={!isEditMode || loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ubicación"
                  name="location"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  disabled={!isEditMode || loading}
                />
                <TextField
                  label="Biografía"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  disabled={!isEditMode || loading}
                  helperText="Breve descripción sobre ti"
                />
              </Grid>
              {isEditMode && profileData.email !== currentUser?.email && (
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleUpdateEmail}
                    disabled={loading}
                  >
                    Actualizar Correo Electrónico
                  </Button>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Pestaña de Seguridad */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Cambiar Contraseña
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contraseña Actual"
                  name="currentPassword"
                  type={showPassword.currentPassword ? 'text' : 'password'}
                  value={securityData.currentPassword}
                  onChange={handleSecurityChange}
                  fullWidth
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('currentPassword')}
                          edge="end"
                        >
                          {showPassword.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Nueva Contraseña"
                  name="newPassword"
                  type={showPassword.newPassword ? 'text' : 'password'}
                  value={securityData.newPassword}
                  onChange={handleSecurityChange}
                  fullWidth
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('newPassword')}
                          edge="end"
                        >
                          {showPassword.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirmar Nueva Contraseña"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  value={securityData.confirmPassword}
                  onChange={handleSecurityChange}
                  fullWidth
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          edge="end"
                        >
                          {showPassword.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleUpdatePassword}
                  disabled={loading || !securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Recomendaciones para una contraseña segura:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body2">
                      Usa al menos 8 caracteres
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Incluye letras mayúsculas y minúsculas
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Añade números y símbolos especiales
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Evita información personal fácilmente identificable
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      No utilices la misma contraseña en múltiples sitios
                    </Typography>
                  </li>
                </ul>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </motion.div>

      {/* Diálogo para reautenticar al cambiar el correo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirmar tu contraseña</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Para cambiar tu correo electrónico, necesitamos verificar tu identidad. Por favor, introduce tu contraseña actual.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="currentPassword"
            label="Contraseña actual"
            type={showPassword.currentPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={securityData.currentPassword}
            onChange={handleSecurityChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    edge="end"
                  >
                    {showPassword.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleReauthenticate} 
            color="primary" 
            variant="contained"
            disabled={loading || !securityData.currentPassword}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 