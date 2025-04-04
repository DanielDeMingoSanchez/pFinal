import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Block as BlockIcon,
  Message as MessageIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, addDoc, where, Timestamp, serverTimestamp, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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

const AdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteFileDialog, setShowDeleteFileDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState('5');
  const [messageType, setMessageType] = useState<'all' | 'user'>('all');
  const [message, setMessage] = useState('');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
  const [deleteChatDate, setDeleteChatDate] = useState<string>('');
  const [deleteChatMessage, setDeleteChatMessage] = useState('');
  const [showDeleteChatConfirmDialog, setShowDeleteChatConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);
  const [messageDisplayType, setMessageDisplayType] = useState('alert');
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.email === 'dgg53235@jioso.com';

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acceso no autorizado');
      return;
    }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Log para depuración - inicio
      console.log('AdminPanel: Iniciando carga de datos...');
      
      // CORREGIR: Cambiamos 'archivos' por 'documentos' que es la colección correcta
      const archivosRef = collection(db, 'documentos');
      const filesSnapshot = await getDocs(archivosRef);
      
      // Obtenemos los usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'));

      // Log para depuración - después de obtener los snapshots
      console.log(`AdminPanel: Documentos recuperados - Archivos: ${filesSnapshot.docs.length}, Usuarios: ${usersSnapshot.docs.length}`);
      
      if (filesSnapshot.empty) {
        console.log('AdminPanel: No se encontraron documentos en la colección');
      } else {
        // Listamos los IDs de los documentos encontrados para depuración
        console.log('AdminPanel: IDs de documentos encontrados:', 
          filesSnapshot.docs.map(doc => doc.id).join(', '));
      }

      const filesData = filesSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`AdminPanel: Datos del documento ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data,
          // Mapear los campos de la colección 'documentos' a los campos esperados
          titulo: data.titulo || data.nombre || 'Sin título',
          userName: data.usuario?.nombre || 'Usuario desconocido',
          userEmail: data.usuario?.email || data.userEmail || 'Email no disponible',
          fecha: data.fechaCreacion || data.fechaSubida || serverTimestamp()
        };
      });

      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Log detallado de los archivos para depuración
      console.log('AdminPanel: Datos de documentos procesados:', filesData);

      // Actualiza el estado con los datos obtenidos
      setFiles(filesData);
      setUsers(usersData);
      
      // Notificación apropiada según los resultados
      if (filesData.length === 0) {
        toast.info('No se encontraron documentos en la base de datos');
        console.log('AdminPanel: No hay documentos para mostrar');
      } else {
        toast.success(`Se cargaron ${filesData.length} documentos y ${usersData.length} usuarios`);
        console.log(`AdminPanel: Se cargaron ${filesData.length} documentos`);
      }
    } catch (error) {
      console.error('AdminPanel: Error al cargar datos:', error);
      toast.error('Error al cargar datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async () => {
    try {
      setLoadingMessages(true);
      const messagesQuery = query(
        collection(db, 'chatMensajes'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setChatMessages(messagesData);
    } catch (error) {
      console.error('Error al cargar mensajes del chat:', error);
      toast.error('Error al cargar mensajes del chat');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (tabValue === 4 && isAdmin) {
      loadChatMessages();
    }
  }, [tabValue, isAdmin]);

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Cambiar la colección de 'archivos' a 'documentos'
      await deleteDoc(doc(db, 'documentos', fileId));
      setFiles(files.filter(file => file.id !== fileId));
      toast.success('Documento eliminado correctamente');
      setShowDeleteFileDialog(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser);
      const banEndTime = banDuration === 'permanent' 
        ? null 
        : new Date(Date.now() + parseInt(banDuration) * 60 * 1000);

      await updateDoc(userRef, {
        isBanned: true,
        banEndTime: banEndTime ? Timestamp.fromDate(banEndTime) : null
      });

      setUsers(users.map(u => 
        u.id === selectedUser 
          ? { ...u, isBanned: true, banEndTime } 
          : u
      ));

      setShowBanDialog(false);
      toast.success('Usuario baneado correctamente');
    } catch (error) {
      console.error('Error al banear usuario:', error);
      toast.error('Error al banear usuario');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        isBanned: false,
        banEndTime: null
      });

      // Actualizar el estado local
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, isBanned: false, banEndTime: null } 
          : u
      ));

      toast.success('Ban eliminado correctamente');
    } catch (error) {
      console.error('Error al quitar baneo del usuario:', error);
      toast.error('Error al quitar el ban del usuario');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || (messageType === 'user' && !selectedUser)) return;

    try {
      setShowMessageDialog(false);
      // Mostrar indicador de progreso
      const loadingToast = toast.loading('Enviando mensaje...');
      
      // Crear un mensaje con formato específico 
      const now = new Date();
      const currentTimestamp = now.getTime();
      
      const recipientData = messageType === 'user' ? {
        recipientId: selectedUser,
        // Encontrar el email del usuario para mostrarlo en el mensaje
        recipientEmail: users.find(u => u.id === selectedUser)?.email || 'Usuario seleccionado'
      } : {};
      
      const messageData = {
        text: message,
        userId: 'admin',
        userName: 'ADMINISTRADOR', 
        userEmail: 'admin@masanz.com',
        photoURL: null,
        createdAt: serverTimestamp(),
        isAdmin: true,
        isBroadcast: true,
        isAnnouncement: messageType === 'all',
        timestamp: currentTimestamp,
        displayType: messageDisplayType, // 'alert' o 'notification'
        messageType: messageType, // 'all' o 'user'
        ...recipientData,
        // Añadir un valor aleatorio para evitar cachés
        random: Math.random().toString(),
        // Añadir la hora de creación en formato legible
        createdAtString: now.toLocaleString()
      };
      
      console.log('AdminPanel: Enviando mensaje broadcast:', messageData);
      
      // Guardar en la colección broadcastMessages para crear un lugar dedicado para estos mensajes
      const broadcastCollection = collection(db, 'broadcastMessages');
      const docRef = await addDoc(broadcastCollection, messageData);
      
      // También guardar en chatMensajes para mantener compatibilidad con el sistema existente
      await addDoc(collection(db, 'chatMensajes'), {
        ...messageData,
        broadcastId: docRef.id // Referencia al mensaje original
      });
      
      console.log('AdminPanel: Mensaje broadcast enviado con ID:', docRef.id);
      
      // Crear copia local y almacenar en localStorage
      const localCopy = {
        ...messageData,
        id: docRef.id,
        createdAt: now
      };
      
      // Usar el mismo mecanismo que las alertas para mayor compatibilidad
      try {
        // Convertir a formato serializable
        const storableMessage = {
          ...localCopy,
          createdAt: localCopy.createdAt.getTime(),
          expiresAt: localCopy.createdAt.getTime() + (2 * 60 * 1000) // 2 minutos
        };
        
        // Guardar en localStorage
        localStorage.setItem('broadcast_message', JSON.stringify(storableMessage));
        
        // Eventos para notificar a otras ventanas
        const broadcastEvent = new CustomEvent('new-broadcast-message', { detail: storableMessage });
        window.dispatchEvent(broadcastEvent);
        
        // También usar postMessage para mayor compatibilidad
        window.postMessage({
          type: 'broadcast_message',
          payload: storableMessage
        }, window.location.origin);
        
        console.log('AdminPanel: Evento de broadcast enviado');
      } catch (error) {
        console.error('AdminPanel: Error en eventos locales:', error);
      }
      
      // Eliminar indicador de progreso y mostrar éxito
      toast.dismiss(loadingToast);
      toast.success(`Mensaje ${messageType === 'all' ? 'global' : 'dirigido'} enviado correctamente`);
      
      // Limpiar formulario
      setMessage('');
      setSelectedUser('');
    } catch (error) {
      console.error('AdminPanel: Error al enviar mensaje broadcast:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'chatMensajes', messageId));
      setChatMessages(chatMessages.filter(msg => msg.id !== messageId));
      toast.success('Mensaje eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      toast.error('Error al eliminar mensaje');
    }
  };

  const handleScheduleChatDeletion = async () => {
    if (!deleteChatMessage.trim() || !deleteChatDate) {
      toast.error('Debes especificar un mensaje y una fecha');
      return;
    }

    try {
      // Calcular la fecha de expiración (2 minutos a partir de ahora)
      const now = new Date();
      const expireAt = new Date(now.getTime() + 120000); // 2 minutos en milisegundos

      // Crear un documento con la programación de eliminación
      await addDoc(collection(db, 'chatDeletionSchedule'), {
        scheduledDate: new Date(deleteChatDate),
        message: deleteChatMessage,
        createdAt: serverTimestamp(),
        createdBy: user?.email
      });

      // Crear mensaje global para todos los usuarios
      await addDoc(collection(db, 'adminMessages'), {
        text: `AVISO IMPORTANTE: Todos los mensajes del chat serán eliminados el ${new Date(deleteChatDate).toLocaleDateString()}. Motivo: ${deleteChatMessage}`,
        type: 'all',
        createdAt: serverTimestamp(),
        expireAt: Timestamp.fromDate(expireAt), // Agregar fecha de expiración
        isAdminMessage: true,
        isSystemMessage: true
      });

      setDeleteChatDate('');
      setDeleteChatMessage('');
      setShowDeleteChatDialog(false);
      toast.success('Eliminación de chat programada correctamente');
    } catch (error) {
      console.error('Error al programar eliminación:', error);
      toast.error('Error al programar eliminación');
    }
  };

  const handleDeleteAllChatMessages = async () => {
    try {
      setShowDeleteChatConfirmDialog(false);
      setLoading(true);
      
      // Calcular la fecha de expiración (2 minutos a partir de ahora)
      const now = new Date();
      const expireAt = new Date(now.getTime() + 120000); // 2 minutos en milisegundos
      
      // Obtener todos los mensajes del chat
      const messagesQuery = query(collection(db, 'chatMensajes'));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Eliminar cada mensaje
      const batch = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(batch);
      
      // Notificar a los usuarios
      await addDoc(collection(db, 'adminMessages'), {
        text: 'AVISO: Todos los mensajes del chat han sido eliminados por el administrador.',
        type: 'all',
        createdAt: serverTimestamp(),
        expireAt: Timestamp.fromDate(expireAt), // Agregar fecha de expiración
        isAdminMessage: true,
        isSystemMessage: true
      });
      
      toast.success('Todos los mensajes del chat han sido eliminados');
      setChatMessages([]);
    } catch (error) {
      console.error('Error al eliminar todos los mensajes:', error);
      toast.error('Error al eliminar todos los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSendGlobalAlert = async () => {
    if (!alertMessage.trim()) return;

    try {
      setSendingAlert(true);
      
      console.log('AdminPanel: Preparando envío de alerta global');
      
      // Crear un mensaje con formato específico para alertas
      const now = new Date();
      
      // El timestamp actual en milisegundos será útil para filtrado por tiempo
      const currentTimestamp = now.getTime();
      
      const messageData = {
        text: alertMessage,
        userId: 'admin',
        userName: 'ADMINISTRADOR', 
        userEmail: 'admin@masanz.com',
        photoURL: null,
        createdAt: serverTimestamp(),
        isAdmin: true,
        isGlobalAlert: true,
        isAnnouncement: true,
        timestamp: currentTimestamp,
        type: 'alert',
        // Añadir un valor aleatorio para evitar cachés
        random: Math.random().toString(),
        // Añadir la hora de creación en formato legible
        createdAtString: now.toLocaleString()
      };
      
      console.log('AdminPanel: Datos de alerta a enviar:', messageData);
      
      // Guardar mensaje en Firestore como alerta
      const docRef = await addDoc(collection(db, 'chatMensajes'), messageData);
      
      console.log('AdminPanel: Alerta global enviada con ID:', docRef.id);
      
      // Crear una copia local de la alerta que acabamos de enviar
      const localCopy = {
        ...messageData,
        id: docRef.id,
        // Si serverTimestamp() no es inmediato, usamos Date actual
        createdAt: now
      };
      
      // Mostrar datos exactos que se enviaron para depuración
      console.log('AdminPanel: Datos exactos de la alerta enviada:', JSON.stringify(localCopy, null, 2));
      
      // MECANISMO DE RESPALDO 1: Guardar la alerta en localStorage
      try {
        // Convertir la fecha a formato compatible con localStorage
        const storableAlert = {
          ...localCopy,
          createdAt: localCopy.createdAt.getTime(), // Convertir a timestamp
          expiresAt: localCopy.createdAt.getTime() + (2 * 60 * 1000) // 2 minutos desde ahora
        };
        
        // Guardar en localStorage
        localStorage.setItem('global_alert', JSON.stringify(storableAlert));
        console.log('AdminPanel: Alerta guardada en localStorage como respaldo');
        
        // Disparar un evento para que otras páginas sepan que hay una nueva alerta
        const alertEvent = new CustomEvent('new-global-alert', { detail: storableAlert });
        window.dispatchEvent(alertEvent);
        console.log('AdminPanel: Evento de nueva alerta disparado');
      } catch (localStorageError) {
        console.error('AdminPanel: Error al guardar en localStorage:', localStorageError);
        // No es crítico, continuamos
      }
      
      // MECANISMO DE RESPALDO 2: Comunicación directa con postMessage
      try {
        // Enviar mensaje a todas las ventanas/pestañas
        window.postMessage({
          type: 'global_alert',
          payload: {
            ...localCopy,
            createdAt: localCopy.createdAt.getTime() // Convertir a timestamp para serialización
          }
        }, window.location.origin);
        
        console.log('AdminPanel: Mensaje directo enviado via postMessage');
      } catch (postMessageError) {
        console.error('AdminPanel: Error al enviar vía postMessage:', postMessageError);
        // No es crítico, continuamos
      }
      
      setAlertMessage('');
      setShowAlertDialog(false);
      toast.success('Alerta enviada correctamente a todos los usuarios');
    } catch (error) {
      console.error('AdminPanel: Error al enviar alerta global:', error);
      toast.error('Error al enviar alerta global');
    } finally {
      setSendingAlert(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: '#121212',
          color: '#ff0000'
        }}
      >
        <Typography variant="h4">
          Acceso no autorizado
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', backgroundColor: '#121212', minHeight: '100vh' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          backgroundColor: '#1a1a1a',
          color: '#ff0000',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #ff0000'
        }}
      >
        {/* Encabezado */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: '#000000',
            borderBottom: '2px solid #ff0000',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <AdminIcon sx={{ color: '#ff0000', fontSize: 32 }} />
          <Typography variant="h5" component="h1" sx={{ color: '#ff0000', fontWeight: 'bold' }}>
            Panel de Administración
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: '1px solid #ff0000',
            '& .MuiTab-root': {
              color: '#ff0000',
              '&.Mui-selected': {
                color: '#ff0000',
                fontWeight: 'bold',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ff0000',
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<DeleteIcon />} label="Documentos" />
          <Tab icon={<BlockIcon />} label="Usuarios" />
          <Tab icon={<MessageIcon />} label="Mensajes" />
          <Tab icon={<SecurityIcon />} label="Sistema" />
          <Tab icon={<ChatIcon />} label="Chat Global" />
        </Tabs>

        {/* Contenido */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff0000' }}>
            Gestión de Documentos
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 5 }}>
              <CircularProgress sx={{ color: '#ff0000', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#ff0000' }}>
                Cargando documentos...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ color: '#ff0000', fontWeight: 'bold' }}>
                  Total: {files.length} documentos
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      console.log('AdminPanel: Forzando recarga de documentos...');
                      loadData();
                    }}
                    sx={{ 
                      color: '#ff0000',
                      borderColor: '#ff0000',
                      '&:hover': {
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      }
                    }}
                  >
                    Actualizar Lista
                  </Button>
                </Box>
              </Box>
            
              {files.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center', border: '1px dashed #ff0000', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ff0000', mb: 2 }}>
                    No se encontraron documentos
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ff0000', mb: 4, maxWidth: '600px', mx: 'auto' }}>
                    No hay documentos disponibles en la base de datos. Esto puede deberse a que:
                  </Typography>
                  <Box sx={{ mb: 3, textAlign: 'left', maxWidth: '500px', mx: 'auto' }}>
                    <ul style={{ color: '#ff0000' }}>
                      <li>Ningún usuario ha subido documentos todavía</li>
                      <li>Existe un problema de permisos en la base de datos</li>
                      <li>La conexión con la base de datos falló</li>
                    </ul>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      console.log('AdminPanel: Intentando cargar documentos nuevamente...');
                      loadData();
                    }}
                    sx={{ 
                      backgroundColor: '#ff0000',
                      '&:hover': {
                        backgroundColor: '#cc0000',
                      }
                    }}
                  >
                    Intentar Nuevamente
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Nombre</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Subido por</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Fecha</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id} sx={{ 
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.05)'
                          }
                        }}>
                          <TableCell sx={{ color: '#ff0000' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {file.titulo}
                              {file.url && (
                                <Button
                                  size="small"
                                  variant="text"
                                  sx={{ color: '#ff0000', minWidth: 'auto' }}
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  Ver
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#ff0000' }}>{file.userName || 'Usuario desconocido'}</TableCell>
                          <TableCell sx={{ color: '#ff0000' }}>{file.userEmail || 'No disponible'}</TableCell>
                          <TableCell sx={{ color: '#ff0000' }}>
                            {file.fecha?.toDate?.() ? file.fecha.toDate().toLocaleString() : 'Fecha no disponible'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Eliminar documento">
                              <IconButton 
                                color="error" 
                                onClick={() => {
                                  setFileToDelete(file);
                                  setShowDeleteFileDialog(true);
                                }}
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: 'rgba(255, 0, 0, 0.1)' 
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff0000' }}>
            Gestión de Usuarios
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress sx={{ color: '#ff0000' }} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Estado</TableCell>
                    <TableCell sx={{ color: '#ff0000', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} sx={{ 
                      '&:hover': {
                        backgroundColor: 'rgba(255, 0, 0, 0.05)'
                      }
                    }}>
                      <TableCell sx={{ color: '#ff0000' }}>{user.email}</TableCell>
                      <TableCell sx={{ color: '#ff0000' }}>{user.displayName || user.nombre || user.name || 'Sin nombre'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isBanned ? 'Baneado' : 'Activo'} 
                          color={user.isBanned ? 'error' : 'success'}
                          sx={{ 
                            backgroundColor: user.isBanned ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                            color: user.isBanned ? '#ff0000' : '#00ff00'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Tooltip title="Quitar ban">
                            <IconButton 
                              color="success" 
                              onClick={() => handleUnbanUser(user.id)}
                              sx={{ 
                                color: '#00ff00',
                                '&:hover': { 
                                  backgroundColor: 'rgba(0, 255, 0, 0.1)' 
                                }
                              }}
                            >
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Banear usuario">
                            <IconButton 
                              color="error" 
                              onClick={() => {
                                setSelectedUser(user.id);
                                setShowBanDialog(true);
                              }}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'rgba(255, 0, 0, 0.1)' 
                                }
                              }}
                            >
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff0000' }}>
            Sistema de Mensajes y Alertas
          </Typography>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#ff0000' }}>Tipo de Mensaje</InputLabel>
              <Select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as 'all' | 'user')}
                label="Tipo de Mensaje"
                sx={{ 
                  color: '#ff0000',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ff0000',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ff0000',
                  }
                }}
              >
                <MenuItem value="all">Todos los usuarios (Broadcast)</MenuItem>
                <MenuItem value="user">Usuario específico</MenuItem>
              </Select>
            </FormControl>

            {messageType === 'user' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#ff0000' }}>Seleccionar Usuario</InputLabel>
                <Select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value as string)}
                  label="Seleccionar Usuario"
                  sx={{ 
                    color: '#ff0000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ff0000',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ff0000',
                    }
                  }}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#ff0000' }}>Formato de presentación</InputLabel>
              <Select
                value={messageDisplayType}
                onChange={(e) => setMessageDisplayType(e.target.value as string)}
                label="Formato de presentación"
                sx={{ 
                  color: '#ff0000',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ff0000',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ff0000',
                  }
                }}
              >
                <MenuItem value="alert">Alerta modal en pantalla completa</MenuItem>
                <MenuItem value="notification">Notificación normal</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Mensaje"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ff0000',
                  '& fieldset': {
                    borderColor: '#ff0000',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff0000',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ff0000',
                }
              }}
            />

            <Button 
              variant="contained" 
              onClick={() => setShowMessageDialog(true)}
              disabled={!message || (messageType === 'user' && !selectedUser)}
              startIcon={<SendIcon />}
              sx={{ 
                backgroundColor: '#ff0000',
                '&:hover': {
                  backgroundColor: '#cc0000',
                }
              }}
            >
              Enviar Mensaje de Broadcast
            </Button>

            <Box sx={{ mt: 4, backgroundColor: '#1a1a1a', p: 2, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#ff0000', mb: 2 }}>
                Información sobre sistema de mensajes
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff0000', mb: 1 }}>
                • Los mensajes aparecerán en todas las ventanas abiertas de la aplicación (Broadcast)
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff0000', mb: 1 }}>
                • Para alerta modal: se mostrará un modal en el centro de la pantalla que bloquea la interacción
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff0000', mb: 1 }}>
                • Para notificación: se mostrará una notificación menos intrusiva
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff0000' }}>
                • Los mensajes expirarán automáticamente después de 2 minutos
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ff0000' }}>
            Estado del Sistema
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  backgroundColor: '#000000',
                  border: '1px solid #ff0000'
                }}
              >
                <Typography variant="h4" sx={{ color: '#ff0000' }}>
                  {users.length}
                </Typography>
                <Typography sx={{ color: '#ff0000' }}>
                  Usuarios Totales
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  backgroundColor: '#000000',
                  border: '1px solid #ff0000'
                }}
              >
                <Typography variant="h4" sx={{ color: '#ff0000' }}>
                  {files.length}
                </Typography>
                <Typography sx={{ color: '#ff0000' }}>
                  Documentos Totales
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  backgroundColor: '#000000',
                  border: '1px solid #ff0000'
                }}
              >
                <Typography variant="h4" sx={{ color: '#ff0000' }}>
                  {users.filter(u => u.isBanned).length}
                </Typography>
                <Typography sx={{ color: '#ff0000' }}>
                  Usuarios Baneados
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  backgroundColor: '#000000',
                  border: '1px solid #ff0000'
                }}
              >
                <Typography variant="h4" sx={{ color: '#ff0000' }}>
                  {new Date().toLocaleString()}
                </Typography>
                <Typography sx={{ color: '#ff0000' }}>
                  Última Actualización
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              sx={{ 
                color: '#ff0000',
                borderColor: '#ff0000',
                '&:hover': {
                  borderColor: '#cc0000',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                }
              }}
            >
              Actualizar Datos
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">Gestión de Mensajes del Chat</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<SendIcon />}
                onClick={() => setShowAlertDialog(true)}
              >
                Enviar Alerta Global
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={loadChatMessages}
                disabled={loadingMessages}
              >
                {loadingMessages ? 'Cargando...' : 'Refrescar'}
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteSweepIcon />}
                onClick={() => setShowDeleteChatDialog(true)}
              >
                Eliminar Conversación
              </Button>
            </Box>
          </Box>
          
          {loadingMessages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress sx={{ color: '#ff0000' }} />
            </Box>
          ) : (
            <>
              {chatMessages.length > 0 ? (
                <TableContainer sx={{ maxHeight: '600px' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold', backgroundColor: '#1a1a1a' }}>Usuario</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold', backgroundColor: '#1a1a1a' }}>Mensaje</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold', backgroundColor: '#1a1a1a' }}>Fecha</TableCell>
                        <TableCell sx={{ color: '#ff0000', fontWeight: 'bold', backgroundColor: '#1a1a1a' }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {chatMessages.map((msg) => (
                        <TableRow key={msg.id} sx={{ 
                          backgroundColor: msg.userEmail === 'dgg53235@jioso.com' ? 'rgba(255, 0, 0, 0.1)' : 'inherit'
                        }}>
                          <TableCell sx={{ color: '#ff0000' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {msg.userEmail === 'dgg53235@jioso.com' && <span>👑</span>}
                              {msg.userName || 'Usuario anónimo'}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            color: '#ff0000',
                            maxWidth: '400px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <Typography variant="body2" sx={{ 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '400px'
                            }}>
                              {msg.text}
                            </Typography>
                            {msg.imageUrl && <Typography variant="caption">[Imagen adjunta]</Typography>}
                            {msg.fileUrl && <Typography variant="caption">[Archivo adjunto: {msg.fileName}]</Typography>}
                          </TableCell>
                          <TableCell sx={{ color: '#ff0000' }}>
                            {msg.createdAt.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Eliminar mensaje">
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteChatMessage(msg.id)}
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: 'rgba(255, 0, 0, 0.1)' 
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: '#ff0000' }}>
                    No hay mensajes en el chat
                  </Typography>
                </Box>
              )}
            </>
          )}
        </TabPanel>
      </Paper>

      {/* Diálogos de confirmación */}
      <Dialog 
        open={showBanDialog} 
        onClose={() => setShowBanDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ff0000',
            '& .MuiDialogTitle-root': {
              color: '#ff0000',
            },
            '& .MuiDialogContent-root': {
              color: '#ff0000',
            }
          }
        }}
      >
        <DialogTitle>Banear Usuario</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: '#ff0000' }}>Duración del Ban</InputLabel>
            <Select
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              label="Duración del Ban"
              sx={{ 
                color: '#ff0000',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ff0000',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ff0000',
                }
              }}
            >
              <MenuItem value="5">5 minutos</MenuItem>
              <MenuItem value="15">15 minutos</MenuItem>
              <MenuItem value="30">30 minutos</MenuItem>
              <MenuItem value="60">1 hora</MenuItem>
              <MenuItem value="180">3 horas</MenuItem>
              <MenuItem value="360">6 horas</MenuItem>
              <MenuItem value="720">12 horas</MenuItem>
              <MenuItem value="1440">24 horas</MenuItem>
              <MenuItem value="permanent">Ban permanente</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowBanDialog(false)}
            sx={{ color: '#ff0000' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleBanUser}
            variant="contained"
            sx={{ 
              backgroundColor: '#ff0000',
              '&:hover': {
                backgroundColor: '#cc0000',
              }
            }}
          >
            Confirmar Ban
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showMessageDialog} 
        onClose={() => setShowMessageDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ff0000',
            '& .MuiDialogTitle-root': {
              color: '#ff0000',
              borderBottom: '1px solid #ff0000',
            },
            '& .MuiDialogContent-root': {
              color: '#ff0000',
            }
          }
        }}
      >
        <DialogTitle>
          Confirmar Envío de Mensaje Broadcast
          <IconButton
            onClick={() => setShowMessageDialog(false)}
            sx={{ 
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#ff0000',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ my: 2, fontWeight: 'bold', color: '#ff0000' }}>
            ¿Estás seguro de que deseas enviar este mensaje broadcast?
          </Typography>
          
          <Box sx={{ mb: 2, p: 2, border: '1px solid #ff0000', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#ff0000', mb: 1 }}>
              <strong>Tipo:</strong> {messageType === 'all' ? 'Todos los usuarios' : 'Usuario específico'}
            </Typography>
            {messageType === 'user' && (
              <Typography variant="body2" sx={{ color: '#ff0000', mb: 1 }}>
                <strong>Destinatario:</strong> {users.find(u => u.id === selectedUser)?.email || 'Usuario seleccionado'}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: '#ff0000', mb: 1 }}>
              <strong>Formato:</strong> {messageDisplayType === 'alert' ? 'Alerta modal en pantalla completa' : 'Notificación'}
            </Typography>
          </Box>

          <Paper 
            sx={{ 
              p: 3, 
              backgroundColor: messageDisplayType === 'alert' ? '#000000' : '#1a1a1a',
              border: '2px solid #ff0000',
              borderRadius: 2,
              mb: 2
            }}
          >
            <Typography variant="h6" sx={{ color: '#ff0000', mb: 2, textAlign: 'center' }}>
              Vista previa del mensaje
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#ff0000', 
              p: 2,
              whiteSpace: 'pre-wrap',
              textAlign: messageDisplayType === 'alert' ? 'center' : 'left',
              fontWeight: messageDisplayType === 'alert' ? 'bold' : 'normal'
            }}>
              {message}
            </Typography>
          </Paper>
          
          <Typography variant="body2" sx={{ color: '#ff0000', fontStyle: 'italic' }}>
            Este mensaje aparecerá en tiempo real para todos los usuarios conectados y caducará automáticamente después de 2 minutos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowMessageDialog(false)}
            sx={{ color: '#ff0000' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSendMessage}
            variant="contained"
            sx={{ 
              backgroundColor: '#ff0000',
              '&:hover': {
                backgroundColor: '#cc0000',
              }
            }}
          >
            Enviar Broadcast
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showDeleteChatDialog} 
        onClose={() => setShowDeleteChatDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ff0000',
            '& .MuiDialogTitle-root': {
              color: '#ff0000',
            },
            '& .MuiDialogContent-root': {
              color: '#ff0000',
            }
          }
        }}
      >
        <DialogTitle>Programar Eliminación del Chat</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Selecciona la fecha de eliminación y escribe un mensaje que será mostrado a todos los usuarios como advertencia.
            </Typography>
            
            <TextField
              fullWidth
              label="Fecha de eliminación"
              type="date"
              value={deleteChatDate}
              onChange={(e) => setDeleteChatDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ff0000',
                  '& fieldset': {
                    borderColor: '#ff0000',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff0000',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ff0000',
                }
              }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mensaje de notificación"
              value={deleteChatMessage}
              onChange={(e) => setDeleteChatMessage(e.target.value)}
              placeholder="Ej: Mantenimiento del sistema, limpieza periódica, etc."
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  color: '#ff0000',
                  '& fieldset': {
                    borderColor: '#ff0000',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff0000',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ff0000',
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteChatDialog(false)}
            sx={{ color: '#ff0000' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleScheduleChatDeletion}
            variant="contained"
            disabled={!deleteChatDate || !deleteChatMessage.trim()}
            sx={{ 
              backgroundColor: '#ff0000',
              '&:hover': {
                backgroundColor: '#cc0000',
              }
            }}
          >
            Programar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showDeleteChatConfirmDialog} 
        onClose={() => setShowDeleteChatConfirmDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ff0000',
            '& .MuiDialogTitle-root': {
              color: '#ff0000',
            },
            '& .MuiDialogContent-root': {
              color: '#ff0000',
            }
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteSweepIcon /> Eliminar Todo el Chat
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ my: 1 }}>
            ¿Estás seguro de que deseas eliminar <strong>TODOS</strong> los mensajes del chat?
          </Typography>
          <Typography variant="body2" sx={{ my: 1, color: '#ff6666' }}>
            Esta acción no se puede deshacer y eliminará permanentemente toda la historia de conversaciones.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteChatConfirmDialog(false)}
            sx={{ color: '#ff0000' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAllChatMessages}
            variant="contained"
            sx={{ 
              backgroundColor: '#ff0000',
              '&:hover': {
                backgroundColor: '#cc0000',
              }
            }}
          >
            Sí, Eliminar Todo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAlertDialog} onClose={() => setShowAlertDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Enviar Alerta Global
          <IconButton
            aria-label="close"
            onClick={() => setShowAlertDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph sx={{ mb: 3 }}>
            Esta alerta aparecerá como un mensaje emergente en el centro de la pantalla para todos los usuarios
            conectados. Desaparecerá automáticamente después de 2 minutos.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            id="alert-message"
            label="Mensaje de alerta"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            placeholder="Escribe el mensaje de alerta que verán todos los usuarios..."
            sx={{ mb: 2 }}
          />
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mt: 2, 
              bgcolor: 'white', 
              color: '#FF0000',
              border: '2px solid #FF0000',
              borderRadius: '10px',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)'
            }}
          >
            <Typography variant="h5" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: '#FF0000'
            }}>
              Anuncio Importante
            </Typography>
            <Typography variant="body1" sx={{ 
              mb: 2, 
              fontWeight: 'medium',
              fontSize: '1.2rem',
              color: '#FF0000'
            }}>
              {alertMessage || "Mensaje de ejemplo que verá el usuario"}
            </Typography>
            <Button
              variant="contained"
              disabled
              sx={{
                mt: 2,
                mb: 2,
                backgroundColor: '#FF0000',
                color: 'white',
                minWidth: '120px'
              }}
            >
              Entendido
            </Button>
            <Typography variant="caption" sx={{ 
              display: 'block',
              color: 'text.secondary'
            }}>
              Este mensaje desaparecerá automáticamente en 2 minutos
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleSendGlobalAlert} 
            color="primary" 
            variant="contained"
            disabled={sendingAlert || !alertMessage.trim()}
            startIcon={sendingAlert ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sendingAlert ? 'Enviando...' : 'Enviar Alerta Global'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar documentos */}
      <Dialog 
        open={showDeleteFileDialog} 
        onClose={() => setShowDeleteFileDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ff0000',
            '& .MuiDialogTitle-root': {
              color: '#ff0000',
            },
            '& .MuiDialogContent-root': {
              color: '#ff0000',
            }
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon /> Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent>
          {fileToDelete && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Estás seguro de que deseas eliminar este documento?
              </Typography>
              
              <Box sx={{ p: 2, border: '1px solid #ff0000', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Nombre:</strong> {fileToDelete.titulo}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Subido por:</strong> {fileToDelete.userName || 'Usuario desconocido'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {fileToDelete.userEmail || 'No disponible'}
                </Typography>
                <Typography variant="body2">
                  <strong>Fecha:</strong> {fileToDelete.fecha?.toDate?.() ? fileToDelete.fecha.toDate().toLocaleString() : 'Fecha no disponible'}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#ff6666' }}>
                Esta acción no se puede deshacer y el documento será eliminado permanentemente.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteFileDialog(false)}
            sx={{ color: '#ff0000' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => fileToDelete && handleDeleteFile(fileToDelete.id)}
            variant="contained"
            sx={{ 
              backgroundColor: '#ff0000',
              '&:hover': {
                backgroundColor: '#cc0000',
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel; 