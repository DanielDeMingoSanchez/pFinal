import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminMessage {
  id: string;
  text: string;
  userName: string;
  createdAt: Date;
  isAdmin: boolean;
}

const AdminAlert: React.FC = () => {
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Cargar mensajes iniciales al montar el componente
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        console.log('AdminAlert: Cargando mensajes iniciales');
        
        // Obtenemos la marca de tiempo de hace 2 minutos
        const twoMinutesAgo = new Date();
        twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
        
        // Consulta para buscar mensajes recientes de administrador
        const messagesQuery = query(
          collection(db, 'chatMensajes'),
          where('isAdmin', '==', true),
          where('createdAt', '>', Timestamp.fromDate(twoMinutesAgo)),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(messagesQuery);
        console.log(`AdminAlert: Encontrados ${snapshot.size} mensajes iniciales`);
        
        const initialMessages: AdminMessage[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt: Date;
          
          // Intentamos obtener la fecha
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.timestamp) {
            createdAt = new Date(data.timestamp);
          } else {
            createdAt = new Date();
          }
          
          // Verificamos que sea reciente
          const messageAge = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);
          if (messageAge <= 2) {
            initialMessages.push({
              id: doc.id,
              text: data.text,
              userName: data.userName || 'Administrador',
              createdAt: createdAt,
              isAdmin: true
            });
            
            console.log('AdminAlert: Mensaje inicial cargado:', {
              id: doc.id,
              text: data.text.substring(0, 30) + '...',
              age: `${messageAge.toFixed(1)} minutos`
            });
          }
        });
        
        if (initialMessages.length > 0) {
          setAdminMessages(initialMessages);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error al cargar mensajes iniciales:', error);
        setInitialized(true);
      }
    };
    
    loadInitialMessages();
  }, []);

  // Comprobar localStorage al inicio y escuchar eventos de nuevas alertas
  useEffect(() => {
    console.log('AdminAlert: Comprobando localStorage para alertas');
    
    // Función para comprobar si hay alertas en localStorage
    const checkLocalStorageForAlerts = () => {
      try {
        const storedAlertString = localStorage.getItem('global_alert');
        if (!storedAlertString) return;
        
        const storedAlert = JSON.parse(storedAlertString);
        
        // Verificar si la alerta ha expirado
        const now = new Date().getTime();
        if (storedAlert.expiresAt < now) {
          console.log('AdminAlert: Alerta en localStorage expirada, eliminando');
          localStorage.removeItem('global_alert');
          return;
        }
        
        // Convertir el timestamp a objeto Date
        const createdAt = new Date(storedAlert.createdAt);
        
        // Crear el objeto de mensaje
        const newMessage: AdminMessage = {
          id: storedAlert.id || `local-${Date.now()}`,
          text: storedAlert.text,
          userName: storedAlert.userName || 'Administrador',
          createdAt: createdAt,
          isAdmin: true
        };
        
        console.log('AdminAlert: Alerta válida encontrada en localStorage:', newMessage);
        
        // Añadir la alerta al estado si no existe ya
        setAdminMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev; // Evitar duplicados
          }
          return [...prev, newMessage];
        });
      } catch (error) {
        console.error('AdminAlert: Error al procesar alerta de localStorage:', error);
      }
    };
    
    // Comprobar localStorage al inicio
    checkLocalStorageForAlerts();
    
    // Escuchar el evento 'new-global-alert'
    const handleNewAlert = (event: any) => {
      console.log('AdminAlert: Evento de nueva alerta recibido', event.detail);
      try {
        const alertData = event.detail;
        if (!alertData) return;
        
        // Convertir el timestamp a objeto Date si es necesario
        const createdAt = typeof alertData.createdAt === 'number' 
          ? new Date(alertData.createdAt) 
          : alertData.createdAt;
        
        // Crear el objeto de mensaje
        const newMessage: AdminMessage = {
          id: alertData.id || `event-${Date.now()}`,
          text: alertData.text,
          userName: alertData.userName || 'Administrador',
          createdAt: createdAt,
          isAdmin: true
        };
        
        console.log('AdminAlert: Procesando alerta desde evento:', newMessage);
        
        // Añadir la alerta al estado si no existe ya
        setAdminMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev; // Evitar duplicados
          }
          return [...prev, newMessage];
        });
      } catch (error) {
        console.error('AdminAlert: Error al procesar alerta de evento:', error);
      }
    };
    
    // Suscribirse al evento
    window.addEventListener('new-global-alert', handleNewAlert);
    
    // Limpiar
    return () => {
      window.removeEventListener('new-global-alert', handleNewAlert);
    };
  }, []);

  // Escuchar mensajes de administrador en tiempo real
  useEffect(() => {
    if (!initialized) return;
    
    console.log('AdminAlert: Iniciando escucha en tiempo real de mensajes de administrador');
    
    // Primera consulta - mensajes marcados como isAdmin
    const adminQuery = query(
      collection(db, 'chatMensajes'),
      where('isAdmin', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    // Segunda consulta - mensajes marcados como isGlobalAlert
    const alertQuery = query(
      collection(db, 'chatMensajes'),
      where('isGlobalAlert', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    // Función para procesar los mensajes
    const processMessages = (snapshot, source) => {
      console.log(`AdminAlert: Procesando mensajes en tiempo real de ${source}, encontrados:`, snapshot.size);
      
      const newAdminMessages: AdminMessage[] = [];
      
      // Obtenemos la marca de tiempo de hace 2 minutos
      const twoMinutesAgo = new Date();
      twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt: Date;
        
        // Intentamos obtener la fecha de diferentes maneras
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (data.timestamp) {
          createdAt = new Date(data.timestamp);
        } else {
          createdAt = new Date();
          console.log('AdminAlert: Usando fecha actual como fallback');
        }
        
        // Solo mostrar mensajes de menos de 2 minutos
        const messageAge = (new Date().getTime() - createdAt.getTime()) / (1000 * 60);
        if (messageAge <= 2) {
          const message = {
            id: doc.id,
            text: data.text,
            userName: data.userName || 'Administrador',
            createdAt: createdAt,
            isAdmin: true
          };
          
          // Evitar duplicados
          if (!newAdminMessages.some(msg => msg.id === message.id)) {
            newAdminMessages.push(message);
          }
          
          console.log('AdminAlert: Nuevo mensaje en tiempo real encontrado:', { 
            id: doc.id, 
            text: data.text.substring(0, 30),
            createdAt: createdAt.toLocaleString(),
            age: `${messageAge.toFixed(1)} minutos`,
            source: source
          });
        } else {
          console.log('AdminAlert: Mensaje ignorado (demasiado antiguo):', { 
            id: doc.id, 
            createdAt: createdAt.toLocaleString(),
            age: `${messageAge.toFixed(1)} minutos`,
            source: source
          });
        }
      });
      
      // Actualizar estado solo si hay mensajes nuevos
      if (newAdminMessages.length > 0) {
        setAdminMessages(prev => {
          // Combinar mensajes antiguos y nuevos, evitando duplicados
          const combinedMessages = [...prev];
          
          newAdminMessages.forEach(newMsg => {
            if (!combinedMessages.some(msg => msg.id === newMsg.id)) {
              combinedMessages.push(newMsg);
            }
          });
          
          return combinedMessages;
        });
      }
    };
    
    // Suscribirse a ambas consultas
    const unsubscribeAdmin = onSnapshot(adminQuery, 
      snapshot => processMessages(snapshot, 'isAdmin'),
      error => console.error('Error al escuchar mensajes de admin:', error)
    );
    
    const unsubscribeAlert = onSnapshot(alertQuery,
      snapshot => processMessages(snapshot, 'isGlobalAlert'),
      error => console.error('Error al escuchar alertas globales:', error)
    );
    
    // Limpiar suscripciones
    return () => {
      console.log('AdminAlert: Limpiando suscripciones de Firestore');
      unsubscribeAdmin();
      unsubscribeAlert();
    };
  }, [initialized]);

  // Eliminar mensajes después de 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setAdminMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => {
          const messageAge = (new Date().getTime() - msg.createdAt.getTime()) / (1000 * 60);
          return messageAge <= 2;
        });
        
        // Si se eliminaron mensajes, mostrar log
        if (filteredMessages.length < prevMessages.length) {
          console.log(`AdminAlert: Se eliminaron ${prevMessages.length - filteredMessages.length} mensajes antiguos`);
        }
        
        return filteredMessages;
      });
    }, 10000); // Comprobar cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // Escuchar mensajes directos a través de postMessage
  useEffect(() => {
    console.log('AdminAlert: Configurando escucha para mensajes directos (postMessage)');
    
    const handleMessage = (event: MessageEvent) => {
      // Verificar origen del mensaje (seguridad)
      if (event.origin !== window.location.origin) return;
      
      // Verificar si es un mensaje de tipo global_alert
      if (!event.data || event.data.type !== 'global_alert') return;
      
      console.log('AdminAlert: Recibido mensaje directo:', event.data);
      
      try {
        const alertData = event.data.payload;
        if (!alertData || !alertData.text) {
          console.log('AdminAlert: Mensaje directo inválido, ignorando');
          return;
        }
        
        // Convertir el timestamp a objeto Date
        const createdAt = new Date(alertData.createdAt);
        
        // Crear el objeto de mensaje
        const newMessage: AdminMessage = {
          id: alertData.id || `direct-${Date.now()}`,
          text: alertData.text,
          userName: alertData.userName || 'Administrador',
          createdAt: createdAt,
          isAdmin: true
        };
        
        console.log('AdminAlert: Procesando alerta de mensaje directo:', newMessage);
        
        // Añadir la alerta al estado si no existe ya
        setAdminMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev; // Evitar duplicados
          }
          return [...prev, newMessage];
        });
      } catch (error) {
        console.error('AdminAlert: Error al procesar mensaje directo:', error);
      }
    };
    
    // Añadir el listener
    window.addEventListener('message', handleMessage);
    
    // Limpiar
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Cuando no hay mensajes, no renderizar nada
  if (adminMessages.length === 0) {
    return null;
  }

  // Función para eliminar un mensaje manualmente
  const handleDismiss = (id: string) => {
    console.log('AdminAlert: Usuario cerró manualmente el mensaje:', id);
    setAdminMessages(prevMessages => prevMessages.filter(msg => msg.id !== id));
  };

  return (
    <>
      {adminMessages.map((message) => (
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
              backgroundColor: '#000',
              borderRadius: '12px',
              padding: { xs: 2, sm: 4 },
              maxWidth: '600px',
              width: { xs: '92%', sm: '80%', md: '60%' },
              border: '2px solid #FF0000',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(255, 0, 0, 0.7)',
              position: 'relative',
              animation: 'scaleIn 0.3s ease-out forwards'
            }}
          >
            <IconButton
              aria-label="close"
              onClick={() => handleDismiss(message.id)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#FF0000',
                backgroundColor: 'rgba(0,0,0,0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255,0,0,0.1)',
                }
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
                textAlign: 'center',
                fontSize: { xs: '1.6rem', sm: '2rem' },
                textShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                letterSpacing: '1px',
                pt: 1
              }}
            >
              Anuncio Importante
            </Typography>
            
            <Box
              sx={{
                my: 4,
                px: { xs: 1, sm: 2 },
                backgroundColor: 'rgba(255, 0, 0, 0.05)',
                borderRadius: '8px',
                py: 2,
                border: '1px solid rgba(255, 0, 0, 0.2)'
              }}
            >
              <Typography 
                variant="body1" 
                id="modalMessage"
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  color: '#FF0000',
                  fontWeight: 'medium',
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}
              >
                {message.text}
              </Typography>
            </Box>
            
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              color: 'rgba(255, 255, 255, 0.7)',
              px: 1,
              fontSize: '0.75rem'
            }}>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                Enviado por: {message.userName}
              </Typography>
              <Typography variant="caption">
                Hace {formatDistanceToNow(message.createdAt, { locale: es, addSuffix: false })}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              onClick={() => handleDismiss(message.id)}
              sx={{
                mt: 3,
                backgroundColor: '#FF0000',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                padding: '8px 24px',
                '&:hover': {
                  backgroundColor: '#B30000',
                },
                minWidth: '120px',
                boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)'
              }}
            >
              Entendido
            </Button>
            
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 2, 
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem'
              }}
            >
              Este mensaje desaparecerá automáticamente en {Math.ceil(2 - ((new Date().getTime() - message.createdAt.getTime()) / (1000 * 60)))} minutos
            </Typography>
          </Paper>
        </Box>
      ))}
    </>
  );
};

export default AdminAlert; 