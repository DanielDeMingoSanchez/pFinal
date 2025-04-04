import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface AdminMessageComponentProps {
  onClose?: () => void;
}

interface IAdminMessage {
  id: string;
  text: string;
  type: 'all' | 'user';
  userId?: string;
  createdAt: Timestamp;
  read?: Record<string, boolean>;
  expireAt?: Timestamp;
}

const AdminMessageComponent: React.FC<AdminMessageComponentProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<IAdminMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<IAdminMessage | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Consulta para obtener mensajes dirigidos a todos los usuarios o a este usuario específico
    // y que no hayan expirado
    const now = Timestamp.fromDate(new Date());
    
    const messagesQuery = query(
      collection(db, 'adminMessages'),
      where('type', 'in', ['all', 'user']),
      // Filtrar mensajes que no han expirado o que no tienen fecha de expiración
      where(
        'expireAt', 
        '>', 
        now
      )
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const userMessages: IAdminMessage[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as IAdminMessage;
        data.id = doc.id;
        
        // Verificar si el mensaje ha expirado
        const hasExpired = data.expireAt && data.expireAt.toDate() < new Date();
        
        // Incluir mensajes para todos o específicamente para este usuario
        // que no hayan expirado y que el usuario no haya leído
        if (!hasExpired && 
            (data.type === 'all' || (data.type === 'user' && data.userId === user.uid))) {
          // Verificar si el usuario ya leyó este mensaje
          const userRead = data.read && data.read[user.uid];
          if (!userRead) {
            userMessages.push(data);
          }
        }
      });

      setMessages(userMessages);
      
      // Mostrar el mensaje más reciente si hay alguno
      if (userMessages.length > 0) {
        // Ordenar por fecha, más reciente primero
        userMessages.sort((a, b) => 
          b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()
        );
        setCurrentMessage(userMessages[0]);
        setShowDialog(true);

        // Configurar un temporizador para eliminar el mensaje después de 2 minutos
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
          handleCloseMessage();
        }, 120000); // 2 minutos en milisegundos
      }
    });

    return () => {
      unsubscribe();
      // Limpiar el temporizador cuando el componente se desmonta
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user]);

  const handleCloseMessage = async () => {
    if (!currentMessage || !user) return;
    
    try {
      // Marcar el mensaje como leído por este usuario
      const messageRef = doc(db, 'adminMessages', currentMessage.id);
      await updateDoc(messageRef, {
        [`read.${user.uid}`]: true
      });
      
      // Limpiar el temporizador
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // Pasar al siguiente mensaje o cerrar
      const remainingMessages = messages.filter(m => m.id !== currentMessage.id);
      if (remainingMessages.length > 0) {
        setCurrentMessage(remainingMessages[0]);
        
        // Configurar un nuevo temporizador para el siguiente mensaje
        timerRef.current = setTimeout(() => {
          handleCloseMessage();
        }, 120000); // 2 minutos en milisegundos
      } else {
        setShowDialog(false);
        setCurrentMessage(null);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
    }
  };

  if (!currentMessage) return null;

  return (
    <Dialog 
      open={showDialog} 
      onClose={() => {}} // No permitir cerrar haciendo clic fuera
      maxWidth="sm"
      fullWidth
      fullScreen={false} // Cambiar a false para evitar pantalla completa
      PaperProps={{
        sx: {
          backgroundColor: '#000000',
          color: '#ff0000',
          border: '1px solid #ff0000',
          borderRadius: 1,
          boxShadow: '0 0 10px rgba(255, 0, 0, 0.4)',
          position: 'absolute',
          top: isMobile ? '50%' : '50%',
          left: isMobile ? '0%' : '50%',
          transform: isMobile ? 'translate(0%, -50%)' : 'translate(-50%, -50%)',
          width: isMobile ? '55%' : undefined,
          m: 0,
          overflowX: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#000000', 
        color: '#ff0000',
        borderBottom: '1px solid #ff0000',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: isMobile ? 0.75 : 2,
        minHeight: isMobile ? '32px' : '48px'
      }}>
        <AdminIcon sx={{ 
          color: '#ff0000',
          fontSize: isMobile ? '1rem' : '1.5rem'
        }} />
        <Typography variant={isMobile ? "body2" : "h6"} component="div" sx={{ 
          flexGrow: 1, 
          color: '#ff0000', 
          fontWeight: 'bold',
          textShadow: '0 0 3px rgba(255, 0, 0, 0.5)',
          fontSize: isMobile ? '0.8rem' : undefined
        }}>
          Admin
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: isMobile ? 1 : 2,
        backgroundColor: '#000000',
        maxHeight: isMobile ? '150px' : undefined,
        overflow: 'auto'
      }}>
        <Box sx={{ whiteSpace: 'pre-wrap' }}>
          <Typography variant="body2" sx={{ 
            mb: isMobile ? 0.5 : 2, 
            color: '#ff0000', 
            fontSize: isMobile ? '0.75rem' : '1.2rem',
            fontWeight: '500',
            letterSpacing: '0.01em',
            textShadow: '0 0 3px rgba(255, 0, 0, 0.5)'
          }}>
            {currentMessage.text}
          </Typography>
          <Typography variant="caption" sx={{ 
            display: 'block', 
            textAlign: 'right', 
            mt: isMobile ? 0.5 : 2, 
            color: '#ff0000',
            fontSize: isMobile ? '0.65rem' : '0.9rem'
          }}>
            {currentMessage.createdAt?.toDate().toLocaleString()}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        backgroundColor: '#000000', 
        borderTop: '1px solid #ff0000',
        p: isMobile ? 0.75 : 2,
        minHeight: isMobile ? '32px' : '48px'
      }}>
        <Button 
          onClick={handleCloseMessage} 
          variant="contained"
          size={isMobile ? "small" : "medium"}
          sx={{ 
            backgroundColor: '#ff0000',
            color: 'white',
            fontWeight: 'bold',
            fontSize: isMobile ? '0.7rem' : undefined,
            py: isMobile ? 0.5 : 1,
            px: isMobile ? 1 : 2,
            minWidth: isMobile ? '60px' : '88px',
            '&:hover': {
              backgroundColor: '#cc0000',
            }
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminMessageComponent; 