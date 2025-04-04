import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, IconButton, Snackbar, Alert } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface BroadcastMessage {
  id: string;
  text: string;
  userName: string;
  createdAt: Date;
  displayType: string;
  messageType: string;
  recipientId?: string;
}

const BroadcastMessage: React.FC = () => {
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([]);
  const [notificaciones, setNotificaciones] = useState<BroadcastMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Cargar mensajes iniciales
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        console.log('BroadcastMessage: Cargando mensajes iniciales');
        
        // Obtener la marca de tiempo de hace 2 minutos
        const twoMinutesAgo = new Date();
        twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
        
        // Consulta para buscar mensajes recientes de broadcast
        const messagesQuery = query(
          collection(db, 'broadcastMessages'),
          where('createdAt', '>', Timestamp.fromDate(twoMinutesAgo)),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(messagesQuery);
        console.log(`BroadcastMessage: Encontrados ${snapshot.size} mensajes iniciales`);
        
        const initialMessages: BroadcastMessage[] = [];
        const initialNotifications: BroadcastMessage[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt: Date;
          
          // Intentar obtener la fecha
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.timestamp) {
            createdAt = new Date(data.timestamp);
          } else {
            createdAt = new Date();
          }
          
          // Verificar si el mensaje es para todos o para este usuario específico
          const isForCurrentUser = 
            data.messageType === 'all' || 
            (data.messageType === 'user' && data.recipientId === user?.uid);
          
          if (!isForCurrentUser) {
            return; // No es para este usuario
          }
          
          // Verificar que sea reciente
          const messageAge = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);
          if (messageAge <= 2) {
            const message = {
              id: doc.id,
              text: data.text,
              userName: data.userName || 'Administrador',
              createdAt: createdAt,
              displayType: data.displayType || 'alert',
              messageType: data.messageType || 'all',
              recipientId: data.recipientId
            };
            
            if (data.displayType === 'alert') {
              initialMessages.push(message);
            } else {
              initialNotifications.push(message);
            }
            
            console.log('BroadcastMessage: Mensaje inicial cargado:', {
              id: doc.id,
              text: data.text.substring(0, 30) + '...',
              type: data.displayType,
              age: `${messageAge.toFixed(1)} minutos`
            });
          }
        });
        
        if (initialMessages.length > 0) {
          setBroadcastMessages(initialMessages);
        }
        
        if (initialNotifications.length > 0) {
          setNotificaciones(initialNotifications);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error al cargar mensajes iniciales de broadcast:', error);
        setInitialized(true);
      }
    };
    
    if (user) {
      loadInitialMessages();
    } else {
      setInitialized(true);
    }
  }, [user]);

  // Comprobar localStorage y escuchar eventos
  useEffect(() => {
    console.log('BroadcastMessage: Comprobando localStorage y escuchando eventos');
    
    // Comprobar localStorage para mensajes de broadcast
    const checkLocalStorage = () => {
      try {
        const storedMessageString = localStorage.getItem('broadcast_message');
        if (!storedMessageString) return;
        
        const storedMessage = JSON.parse(storedMessageString);
        
        // Verificar si ha expirado
        const now = new Date().getTime();
        if (storedMessage.expiresAt < now) {
          console.log('BroadcastMessage: Mensaje en localStorage expirado');
          localStorage.removeItem('broadcast_message');
          return;
        }
        
        // Verificar si es para este usuario
        const isForCurrentUser = 
          storedMessage.messageType === 'all' || 
          (storedMessage.messageType === 'user' && storedMessage.recipientId === user?.uid);
        
        if (!isForCurrentUser) {
          return; // No es para este usuario
        }
        
        // Crear objeto de mensaje
        const createdAt = new Date(storedMessage.createdAt);
        const message = {
          id: storedMessage.id || `local-${Date.now()}`,
          text: storedMessage.text,
          userName: storedMessage.userName || 'Administrador',
          createdAt: createdAt,
          displayType: storedMessage.displayType || 'alert',
          messageType: storedMessage.messageType || 'all',
          recipientId: storedMessage.recipientId
        };
        
        console.log('BroadcastMessage: Mensaje encontrado en localStorage:', message);
        
        // Añadir según tipo
        if (message.displayType === 'alert') {
          setBroadcastMessages(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        } else {
          setNotificaciones(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      } catch (error) {
        console.error('Error al procesar mensaje de localStorage:', error);
      }
    };
    
    // Comprobar al inicio
    checkLocalStorage();
    
    // Configurar escucha de eventos
    const handleBroadcastEvent = (event: any) => {
      console.log('BroadcastMessage: Evento de broadcast recibido:', event.detail);
      try {
        const messageData = event.detail;
        if (!messageData) return;
        
        // Verificar si es para este usuario
        const isForCurrentUser = 
          messageData.messageType === 'all' || 
          (messageData.messageType === 'user' && messageData.recipientId === user?.uid);
        
        if (!isForCurrentUser) {
          return; // No es para este usuario
        }
        
        // Crear objeto de mensaje
        const createdAt = typeof messageData.createdAt === 'number' 
          ? new Date(messageData.createdAt) 
          : messageData.createdAt;
        
        const message = {
          id: messageData.id || `event-${Date.now()}`,
          text: messageData.text,
          userName: messageData.userName || 'Administrador',
          createdAt: createdAt,
          displayType: messageData.displayType || 'alert',
          messageType: messageData.messageType || 'all',
          recipientId: messageData.recipientId
        };
        
        // Añadir según tipo
        if (message.displayType === 'alert') {
          setBroadcastMessages(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        } else {
          setNotificaciones(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      } catch (error) {
        console.error('Error al procesar evento de broadcast:', error);
      }
    };
    
    // Configurar escucha de mensajes directos
    const handleDirectMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'broadcast_message') return;
      
      console.log('BroadcastMessage: Mensaje directo recibido:', event.data);
      
      try {
        const messageData = event.data.payload;
        if (!messageData) return;
        
        // Verificar si es para este usuario
        const isForCurrentUser = 
          messageData.messageType === 'all' || 
          (messageData.messageType === 'user' && messageData.recipientId === user?.uid);
        
        if (!isForCurrentUser) {
          return; // No es para este usuario
        }
        
        // Crear objeto de mensaje
        const createdAt = new Date(messageData.createdAt);
        const message = {
          id: messageData.id || `direct-${Date.now()}`,
          text: messageData.text,
          userName: messageData.userName || 'Administrador',
          createdAt: createdAt,
          displayType: messageData.displayType || 'alert',
          messageType: messageData.messageType || 'all',
          recipientId: messageData.recipientId
        };
        
        // Añadir según tipo
        if (message.displayType === 'alert') {
          setBroadcastMessages(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        } else {
          setNotificaciones(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      } catch (error) {
        console.error('Error al procesar mensaje directo:', error);
      }
    };
    
    // Suscribirse a eventos
    window.addEventListener('new-broadcast-message', handleBroadcastEvent);
    window.addEventListener('message', handleDirectMessage);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('new-broadcast-message', handleBroadcastEvent);
      window.removeEventListener('message', handleDirectMessage);
    };
  }, [user]);

  // Escuchar en tiempo real
  useEffect(() => {
    if (!initialized || !user) return;
    
    console.log('BroadcastMessage: Iniciando escucha en tiempo real');
    
    // Consulta para mensajes de broadcast
    const broadcastQuery = query(
      collection(db, 'broadcastMessages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(broadcastQuery, (snapshot) => {
      console.log(`BroadcastMessage: Procesando ${snapshot.size} mensajes en tiempo real`);
      
      const alertMessages: BroadcastMessage[] = [];
      const notificationMessages: BroadcastMessage[] = [];
      
      // Tiempo límite (2 minutos atrás)
      const twoMinutesAgo = new Date();
      twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt: Date;
        
        // Intentar obtener la fecha
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (data.timestamp) {
          createdAt = new Date(data.timestamp);
        } else {
          createdAt = new Date();
        }
        
        // Verificar si es para todos o para este usuario específico
        const isForCurrentUser = 
          data.messageType === 'all' || 
          (data.messageType === 'user' && data.recipientId === user?.uid);
        
        if (!isForCurrentUser) {
          return; // No es para este usuario
        }
        
        // Verificar que sea reciente
        const messageAge = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);
        if (messageAge <= 2) {
          const message = {
            id: doc.id,
            text: data.text,
            userName: data.userName || 'Administrador',
            createdAt: createdAt,
            displayType: data.displayType || 'alert',
            messageType: data.messageType || 'all',
            recipientId: data.recipientId
          };
          
          // Clasificar según tipo
          if (data.displayType === 'alert') {
            alertMessages.push(message);
          } else {
            notificationMessages.push(message);
          }
          
          console.log('BroadcastMessage: Nuevo mensaje en tiempo real:', {
            id: doc.id,
            text: data.text.substring(0, 30) + '...',
            type: data.displayType,
            age: `${messageAge.toFixed(1)} minutos`
          });
        }
      });
      
      // Actualizar estado si hay mensajes nuevos
      if (alertMessages.length > 0) {
        setBroadcastMessages(prev => {
          const combinedMessages = [...prev];
          alertMessages.forEach(newMsg => {
            if (!combinedMessages.some(msg => msg.id === newMsg.id)) {
              combinedMessages.push(newMsg);
            }
          });
          return combinedMessages;
        });
      }
      
      if (notificationMessages.length > 0) {
        setNotificaciones(prev => {
          const combinedMessages = [...prev];
          notificationMessages.forEach(newMsg => {
            if (!combinedMessages.some(msg => msg.id === newMsg.id)) {
              combinedMessages.push(newMsg);
            }
          });
          return combinedMessages;
        });
      }
    }, (error) => {
      console.error('Error al escuchar mensajes de broadcast:', error);
    });
    
    // Limpiar al desmontar
    return () => unsubscribe();
  }, [initialized, user]);

  // Eliminar mensajes caducados
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Filtrar alertas
      setBroadcastMessages(prev => {
        const filtered = prev.filter(msg => {
          const messageAge = (now.getTime() - msg.createdAt.getTime()) / (1000 * 60);
          return messageAge <= 2;
        });
        
        if (filtered.length < prev.length) {
          console.log(`BroadcastMessage: Eliminadas ${prev.length - filtered.length} alertas caducadas`);
        }
        
        return filtered;
      });
      
      // Filtrar notificaciones
      setNotificaciones(prev => {
        const filtered = prev.filter(msg => {
          const messageAge = (now.getTime() - msg.createdAt.getTime()) / (1000 * 60);
          return messageAge <= 2;
        });
        
        if (filtered.length < prev.length) {
          console.log(`BroadcastMessage: Eliminadas ${prev.length - filtered.length} notificaciones caducadas`);
        }
        
        return filtered;
      });
    }, 10000); // Cada 10 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Cerrar mensaje
  const handleDismiss = (id: string, isAlert: boolean) => {
    console.log(`BroadcastMessage: Cerrando mensaje ${id}`);
    
    if (isAlert) {
      setBroadcastMessages(prev => prev.filter(msg => msg.id !== id));
    } else {
      setNotificaciones(prev => prev.filter(msg => msg.id !== id));
    }
  };

  return (
    <>
      {/* Renderizar alertas modales */}
      {broadcastMessages.map((message) => (
        <Box
          key={message.id}
          className="modal-overlay"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Paper
            className="modal-content"
            elevation={24}
            sx={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: 4,
              maxWidth: '600px',
              width: { xs: '90%', sm: '70%', md: '50%' },
              border: '2px solid #FF0000',
              textAlign: 'center',
              boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)'
            }}
          >
            <IconButton
              aria-label="close"
              onClick={() => handleDismiss(message.id, true)}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                color: '#FF0000'
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 2, 
                color: '#FF0000',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              Anuncio Importante
            </Typography>
            
            <Typography 
              variant="body1" 
              id="modalMessage"
              sx={{ 
                fontSize: '1.2rem',
                my: 4,
                px: 2,
                color: '#FF0000',
                fontWeight: 'medium'
              }}
            >
              {message.text}
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                Enviado por: {message.userName}
              </Typography>
              <Typography variant="caption">
                Hace {formatDistanceToNow(message.createdAt, { locale: es, addSuffix: false })}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              onClick={() => handleDismiss(message.id, true)}
              sx={{
                mt: 3,
                backgroundColor: '#FF0000',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#B30000',
                },
                minWidth: '120px'
              }}
            >
              Entendido
            </Button>
            
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
              Este mensaje desaparecerá automáticamente en {Math.ceil(2 - ((new Date().getTime() - message.createdAt.getTime()) / (1000 * 60)))} minutos
            </Typography>
          </Paper>
        </Box>
      ))}
      
      {/* Renderizar notificaciones */}
      {notificaciones.map((message) => (
        <Snackbar
          key={message.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: notificaciones.indexOf(message) * 8 + 2 }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => handleDismiss(message.id, false)}
            sx={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FF0000',
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
          >
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              Mensaje del Administrador
            </Typography>
            <Typography variant="body2">
              {message.text}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
              Enviado hace {formatDistanceToNow(message.createdAt, { locale: es, addSuffix: false })}
            </Typography>
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default BroadcastMessage; 