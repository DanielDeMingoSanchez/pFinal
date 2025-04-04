import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, Avatar, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { FaDownload, FaEye, FaRegStar, FaStar, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import { doc, updateDoc, increment, getDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import { deleteObject, ref } from 'firebase/storage';
import { styled } from '@mui/material/styles';
import toast from 'react-hot-toast';
import { auth } from '../../firebase/config';

interface DocumentoProps {
  documento: {
    id: string;
    titulo: string;
    descripcion: string;
    categoria: string;
    fechaCreacion: string | { seconds: number; nanoseconds: number };
    descargas: number;
    vistas: number;
    destacado?: boolean;
    url: string;
    usuario: {
      nombre: string;
      id: string;
      email: string;
    };
  };
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 10,
}));

const DocumentoCard: React.FC<DocumentoProps> = ({ documento }) => {
  const { id, titulo, descripcion, categoria, fechaCreacion, descargas, vistas, destacado, url, usuario } = documento;
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const currentUser = auth.currentUser;
  const isOwner = currentUser && currentUser.uid === usuario.id;
  
  // Obtener foto de perfil del usuario
  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        if (usuario?.id) {
          const userDocRef = doc(db, 'users', usuario.id);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.photoURL) {
              setPhotoURL(userData.photoURL);
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener foto de perfil:', error);
      }
    };

    fetchUserPhoto();
  }, [usuario?.id]);

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'universidad': return '#4F46E5';
      case 'grado-superior': return '#10B981';
      case 'bachillerato': return '#F59E0B';
      case 'profesional': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'universidad': return 'Universidad';
      case 'grado-superior': return 'Grado Superior';
      case 'bachillerato': return 'Bachillerato';
      case 'profesional': return 'Profesional';
      default: return 'Otros';
    }
  };

  const handleDownload = async () => {
    if (!url) {
      toast.error('No se encontró la URL del archivo');
      return;
    }
  
    try {
      const toastId = toast.loading('Descargando archivo...');
  
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo obtener el archivo');
  
      const blob = await response.blob();
  
      const contentType = response.headers.get('content-type') || '';
      const EXTENSION_MAP: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'text/plain': 'txt',
      };
  
      let extension = EXTENSION_MAP[contentType] || '';
      // Intentar obtener la extensión del nombre del archivo si está disponible
      if (!extension && url.includes('.')) {
        extension = url.split('.').pop()?.split('?')[0] || 'bin';
      }
  
      const nombreBase = titulo.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 50);
      const nombreFinal = `${nombreBase || 'documento'}.${extension || 'bin'}`;
  
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = nombreFinal;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
  
      // Actualizar contador de descargas
      await updateDoc(doc(db, 'documentos', id), {
        descargas: increment(1)
      });
  
      toast.dismiss(toastId);
      toast.success('Descarga completada');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al forzar la descarga');
    }
  };

  const handleView = async () => {
    try {
      console.log('Abriendo documento para visualización:', id);
      
      // Incrementar contador de vistas en Firestore
      await updateDoc(doc(db, 'documentos', id), {
        vistas: increment(1)
      });

      // Verificar si la URL ya tiene el formato correcto para acceder al contenido
      if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
        window.open(url, '_blank');
        toast.success('Abriendo documento para visualización...');
        return;
      }

      // Para Firebase Storage URLs que requieren transformación
      // Construir la URL directa usando el siguiente formato:
      // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[ENCODED_OBJECT_PATH]?alt=media
      const urlObj = new URL(url);
      const bucket = urlObj.hostname;
      let objectPath = url.split('/').slice(3).join('/'); // Obtener la ruta después del dominio
      
      // Verificar si estamos con una URL con formato incorrecto
      if (objectPath.includes('?')) {
        objectPath = objectPath.split('?')[0]; // Eliminar parámetros de consulta
      }
      
      // Codificar la ruta del objeto para la URL
      const encodedObjectPath = encodeURIComponent(objectPath);
      
      // Construir la URL directa al contenido con alt=media
      const directUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedObjectPath}?alt=media`;
      
      toast.success('Abriendo documento para visualización...');
      window.open(directUrl, '_blank');
    } catch (error) {
      console.error('Error al visualizar documento:', error);
      toast.error('Error al abrir el documento');
      
      // Intentar abrir el documento directamente como último recurso
      try {
        window.open(url, '_blank');
      } catch (e) {
        console.error('Error al abrir URL:', e);
      }
    }
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleCloseDeleteDialog = () => {
    setConfirmDelete(false);
  };

  const handleDelete = async () => {
    try {
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, 'documentos', id));

      // Si tiene URL, intentar eliminar el archivo del Storage
      if (url) {
        try {
          // Extraer la ruta del archivo de la URL
          const fileUrl = new URL(url);
          const pathname = fileUrl.pathname;
          const storageRef = pathname.split('/o/')[1];
          
          if (storageRef) {
            // Decodificar la ruta del archivo
            const decodedPath = decodeURIComponent(storageRef.split('?')[0]);
            const fileRef = ref(storage, decodedPath);
            
            // Eliminar el archivo
            await deleteObject(fileRef);
          }
        } catch (storageError) {
          console.error('Error al eliminar archivo de Storage:', storageError);
          // Continuamos con la operación aunque falle la eliminación del storage
        }
      }

      setConfirmDelete(false);
      toast.success('Documento eliminado correctamente');
      
      // Recargar la página para actualizar la lista
      window.location.reload();
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar el documento');
      setConfirmDelete(false);
    }
  };

  // Truncar la descripción si es demasiado larga
  const truncatedDescription = descripcion.length > 120 
    ? `${descripcion.substring(0, 120)}...` 
    : descripcion;

  return (
    <StyledCard>
      <Box position="relative">
        <CategoryChip 
          label={getCategoryName(categoria)}
          size="small"
          sx={{ 
            bgcolor: `${getCategoryColor(categoria)}20`, 
            color: getCategoryColor(categoria),
            fontWeight: 500
          }} 
        />
        {destacado && (
          <Tooltip title="Documento destacado">
            <IconButton 
              size="small" 
              sx={{ 
                position: 'absolute', 
                top: 12, 
                left: 12, 
                bgcolor: 'rgba(245, 158, 11, 0.1)', 
                color: '#F59E0B' 
              }}
            >
              <FaStar />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
          {truncatedDescription}
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ width: 32, height: 32, bgcolor: getCategoryColor(categoria), mr: 1, fontSize: '0.75rem' }}
              src={photoURL || undefined}
            >
              {usuario.nombre.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {usuario.nombre.length > 12 
                ? `${usuario.nombre.substring(0, 12)}...` 
                : usuario.nombre}
            </Typography>
          </Box>
          <div className="flex space-x-1 text-xs text-gray-500">
            <span className="inline-flex items-center">
              <FaCalendarAlt className="mr-1" />
              {fechaCreacion ? formatDate(fechaCreacion) : 'Fecha desconocida'}
            </span>
          </div>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box display="flex" gap={1}>
          <Chip 
            icon={<FaDownload size={12} />} 
            label={descargas} 
            size="small" 
            variant="outlined"
          />
          <Chip 
            icon={<FaEye size={12} />} 
            label={vistas} 
            size="small" 
            variant="outlined"
          />
        </Box>
        <Box>
          <Button 
            size="small" 
            variant="contained"
            color="primary" 
            onClick={handleView}
            sx={{ mr: 1 }}
          >
            Ver
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
            onClick={handleDownload}
            sx={{ mr: isOwner ? 1 : 0 }}
          >
            Descargar
          </Button>
          {isOwner && (
            <Button 
              size="small" 
              variant="contained" 
              color="error"
              startIcon={<FaTrash />}
              onClick={handleDeleteClick}
            >
              Borrar
            </Button>
          )}
        </Box>
      </CardActions>

      {/* Dialog de confirmación para borrar */}
      <Dialog
        open={confirmDelete}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¿Estás seguro que deseas borrar este documento?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Esta acción no se puede deshacer. El documento "{titulo}" será eliminado permanentemente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Borrar
          </Button>
        </DialogActions>
      </Dialog>
    </StyledCard>
  );
};

// Función para formatear la fecha en formato MM/DD/YYYY
const formatDate = (dateString: string | { seconds: number; nanoseconds: number }): string => {
  try {
    if (!dateString) return 'Fecha desconocida';
    
    // Primero intentar con el formato estándar
    if (typeof dateString === 'string') {
      const fecha = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (!isNaN(fecha.getTime())) {
        const mes = fecha.getMonth() + 1;
        const dia = fecha.getDate();
        const año = fecha.getFullYear();
        return `${mes}/${dia}/${año}`;
      }
      
      // Para fechas en formato ISO
      if (dateString.includes('T')) {
        const fechaParte = dateString.split('T')[0];
        const [año, mes, dia] = fechaParte.split('-').map(Number);
        if (año && mes && dia) {
          return `${mes}/${dia}/${año}`;
        }
      }
      
      // Último recurso: mostrar la fecha como string
      return dateString.substring(0, 10);
    }
    
    // Si la fecha incluye una marca de tiempo de Firestore (seconds, nanoseconds)
    if (typeof dateString === 'object' && 'seconds' in dateString) {
      const fecha = new Date(dateString.seconds * 1000);
      const mes = fecha.getMonth() + 1;
      const dia = fecha.getDate();
      const año = fecha.getFullYear();
      return `${mes}/${dia}/${año}`;
    }
    
    return 'Fecha desconocida';
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    // Último intento: mostrar los primeros 10 caracteres de la cadena si es string
    if (typeof dateString === 'string') {
      return dateString.substring(0, 10);
    }
    return 'Fecha desconocida';
  }
};

export default DocumentoCard; 