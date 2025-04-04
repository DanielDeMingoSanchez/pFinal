import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  IconButton, 
  CircularProgress,
  Divider,
  Container,
  Grid,
  useTheme,
  useMediaQuery,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Send as SendIcon, 
  InsertEmoticon as EmojiIcon,
  ArrowBack as ArrowBackIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  FormatListBulleted as ListIcon,
  Close as CloseIcon,
  Forum as ForumIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  updateDoc,
  doc,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail?: string;
  photoURL?: string;
  createdAt: Date;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  isAdmin?: boolean;
  recipientId?: string; // ID del destinatario específico (si es null, es para todos)
  recipientName?: string; // Nombre del destinatario para mostrar
}

// Lista de emojis para el selector
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '😘', '😗', '😚', '😙', '😋',
  '😛', '😜', '😝', '🤑', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
  '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱',
  '😴', '🤤', '😪', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
];

const ChatGlobal: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para mensajes de administrador
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [users, setUsers] = useState<{id: string, name: string, email: string}[]>([]);
  
  // Estado para el menú de emojis
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [formatAnchorEl, setFormatAnchorEl] = useState<null | HTMLElement>(null);
  const openEmojiMenu = Boolean(emojiAnchorEl);
  const openFormatMenu = Boolean(formatAnchorEl);
  
  // Estado para diálogos
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  // Estado para subida de archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Añadir clase chat-page al body cuando se monta el componente
  useEffect(() => {
    document.body.classList.add('chat-page');
    console.log('ChatGlobal montado - clase chat-page añadida');
    
    // Forzar repintado para asegurar que los estilos se apliquen
    const forceRepaint = () => {
      const adminMessages = document.querySelectorAll('.admin-message, [data-admin="true"]');
      adminMessages.forEach(el => {
        el.classList.remove('admin-message');
        // @ts-ignore - Ignoramos el error para forzar un repintado
        void el.offsetWidth; // Trigger reflow
        el.classList.add('admin-message');
      });
      console.log(`Forzado repintado de ${adminMessages.length} mensajes de admin`);
    };
    
    // Ejecutar después de que los mensajes se carguen
    setTimeout(forceRepaint, 500);
    
    // Limpiar cuando el componente se desmonte
    return () => {
      document.body.classList.remove('chat-page');
      console.log('ChatGlobal desmontado - clase chat-page eliminada');
    };
  }, []);

  // Función auxiliar para identificar administradores consistentemente
  const isAdminUser = (email?: string, name?: string, uid?: string): boolean => {
    const adminEmails = ['dgg53235@jioso.com', 'admin@masanz.com', 'root@root.com'];
    const normalizedEmail = email?.toLowerCase() || '';
    return adminEmails.includes(normalizedEmail) || 
           name === 'Administrador' || 
           uid === 'admin';
  };

  // Verificar si el usuario actual es administrador
  useEffect(() => {
    if (user) {
      const isAdmin = isAdminUser(user.email || '', user.displayName || '', user.uid);
      setShowAdminControls(isAdmin);
      
      console.log('Usuario actual:', {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid,
        isAdmin: isAdmin
      });
    }
  }, [user]);

  // Cargar lista de usuarios para selector de destinatario (solo para admins)
  useEffect(() => {
    if (!showAdminControls) return;

    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        const usersList: {id: string, name: string, email: string}[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          usersList.push({
            id: doc.id,
            name: userData.displayName || userData.email.split('@')[0],
            email: userData.email
          });
        });
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error al obtener la lista de usuarios:', error);
      }
    };

    fetchUsers();
  }, [showAdminControls]);

  // Cargar mensajes y suscribirse a actualizaciones
  useEffect(() => {
    if (!user) {
      toast.error('Debes iniciar sesión para acceder al chat');
      navigate('/login');
      return;
    }

    setLoading(true);
    const messagesQuery = query(
      collection(db, 'chatMensajes'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        
        // Determinar si el mensaje es de un administrador
        const isFromAdmin = data.isAdmin === true || 
                           (data.userEmail && isAdminUser(data.userEmail, data.userName, data.userId));
        
        // Verificar si el mensaje es una alerta o anuncio global (no debe mostrarse en el chat)
        const isGlobalAlert = data.isGlobalAlert === true;
        const isAdminAnnouncement = isFromAdmin && data.isAnnouncement === true;
        const isAdminPrivateMessage = isFromAdmin && data.recipientId !== undefined && data.recipientId !== null;
        
        // Si es una alerta global, anuncio del administrador o mensaje privado del admin, no lo incluimos en el chat
        if (isGlobalAlert || isAdminAnnouncement || isAdminPrivateMessage) {
          console.log('Mensaje de admin filtrado:', {
            id: doc.id,
            text: data.text.substring(0, 20) + '...',
            isGlobalAlert: isGlobalAlert,
            isAdminAnnouncement: isAdminAnnouncement,
            isAdminPrivateMessage: isAdminPrivateMessage
          });
          return; // Saltar este mensaje
        }
        
        // Filtrar mensajes: 
        // - Mostrar mensajes globales (sin recipientId)
        // - Mensajes enviados por el usuario actual
        // - Si el usuario actual es admin, mostrar todos los mensajes (excepto alertas/anuncios/mensajes privados)
        const isGlobalMessage = !data.recipientId;
        const isFromCurrentUser = data.userId === user.uid;
        
        if (isGlobalMessage || isFromCurrentUser || showAdminControls) {
          const messageData: Message = {
            id: doc.id,
            text: data.text,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail || '',
            photoURL: data.photoURL,
            createdAt: data.createdAt?.toDate() || new Date(),
            imageUrl: data.imageUrl,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            isAdmin: isFromAdmin, // Asegurar que el campo isAdmin esté correctamente establecido
            recipientId: data.recipientId || null,
            recipientName: data.recipientName || null
          };
          
          // Log para depuración
          if (isFromAdmin) {
            console.log('Mensaje de admin cargado:', {
              id: messageData.id,
              text: messageData.text.substring(0, 20) + '...',
              isAdmin: messageData.isAdmin,
              userName: messageData.userName,
              userEmail: messageData.userEmail,
              global: isGlobalMessage
            });
          }
          
          loadedMessages.push(messageData);
        }
      });
      
      // Invertir para mostrar en orden cronológico (más antiguos primero)
      setMessages(loadedMessages.reverse());
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error("Error al cargar mensajes:", error);
      toast.error('Error al cargar mensajes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, user, showAdminControls]);

  // Desplazar al último mensaje
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Manejadores para el menú de selección de destinatario
  const handleOpenRecipientMenu = (event: React.MouseEvent<HTMLElement>) => {
    setRecipientMenuAnchorEl(event.currentTarget);
  };

  const handleCloseRecipientMenu = () => {
    setRecipientMenuAnchorEl(null);
  };

  const handleSelectRecipient = (user: {id: string, name: string} | null) => {
    setSelectedRecipient(user);
    handleCloseRecipientMenu();
  };

  // Manejar el envío de mensajes
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile && !selectedImage) || !user) return;

    try {
      setSending(true);
      let fileUrl = '';
      let fileName = '';
      let imageUrl = '';
      
      // Detectar si el mensaje lo envía un administrador
      const isAdmin = isAdminUser(user.email || '', user.displayName || '', user.uid);
      
      // Log para depuración
      console.log('Enviando mensaje como:', {
        email: user.email,
        displayName: user.displayName,
        isAdmin: isAdmin
      });
      
      // Datos comunes para todos los mensajes
      const messageCommonData = {
        userId: user.uid,
        userName: user.displayName || 'Usuario anónimo',
        userEmail: user.email || '',
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        isAdmin: isAdmin, // Asegurar que esto se establezca correctamente
        isAnnouncement: isAdmin // Marcar si es un anuncio
      };
      
      // Subir imagen si existe
      if (selectedImage) {
        setIsUploading(true);
        setUploadDialogOpen(true);
        const storageRef = ref(storage, `chat-images/${Date.now()}_${selectedImage.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedImage);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Error al subir imagen:", error);
            toast.error('Error al subir imagen');
            setIsUploading(false);
            setUploadDialogOpen(false);
          },
          async () => {
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setSelectedImage(null);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadDialogOpen(false);
            
            // Enviar mensaje con imagen
            await addDoc(collection(db, 'chatMensajes'), {
              ...messageCommonData,
              text: newMessage.trim(),
              imageUrl
            });
            
            setNewMessage('');
            setSending(false);
          }
        );
        return;
      }
      
      // Subir archivo si existe
      if (selectedFile) {
        setIsUploading(true);
        setUploadDialogOpen(true);
        const storageRef = ref(storage, `chat-files/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Error al subir archivo:", error);
            toast.error('Error al subir archivo');
            setIsUploading(false);
            setUploadDialogOpen(false);
          },
          async () => {
            fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            fileName = selectedFile.name;
            setSelectedFile(null);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadDialogOpen(false);
            
            // Enviar mensaje con archivo
            await addDoc(collection(db, 'chatMensajes'), {
              ...messageCommonData,
              text: newMessage.trim() || `Ha compartido un archivo: ${fileName}`,
              fileUrl,
              fileName
            });
            
            setNewMessage('');
            setSending(false);
          }
        );
        return;
      }
      
      // Mensaje de texto normal
      await addDoc(collection(db, 'chatMensajes'), {
        ...messageCommonData,
        text: newMessage.trim()
      });
      
      setNewMessage('');
      setSending(false);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error('Error al enviar mensaje');
      setSending(false);
    }
  };

  // Formatear hora para mensajes (HH:MM)
  const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Manejadores para menús
  const handleOpenEmojiMenu = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleCloseEmojiMenu = () => {
    setEmojiAnchorEl(null);
  };

  const handleOpenFormatMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFormatAnchorEl(event.currentTarget);
  };

  const handleCloseFormatMenu = () => {
    setFormatAnchorEl(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prevMessage => prevMessage + emoji);
    handleCloseEmojiMenu();
  };
  
  // Manejadores para formateo de texto
  const handleBoldClick = () => {
    const textField = document.querySelector('input[type="text"]') as HTMLInputElement;
    const start = textField.selectionStart || 0;
    const end = textField.selectionEnd || 0;
    
    if (start === end) {
      // No hay texto seleccionado
      setNewMessage(prev => prev + '**texto en negrita**');
      setTimeout(() => textField.focus(), 10);
    } else {
      // Hay texto seleccionado
      const selectedText = newMessage.substring(start, end);
      const newValue = newMessage.substring(0, start) + `**${selectedText}**` + newMessage.substring(end);
      setNewMessage(newValue);
      setTimeout(() => {
        textField.focus();
        textField.setSelectionRange(start + 2, end + 2);
      }, 10);
    }
    handleCloseFormatMenu();
  };
  
  const handleItalicClick = () => {
    const textField = document.querySelector('input[type="text"]') as HTMLInputElement;
    const start = textField.selectionStart || 0;
    const end = textField.selectionEnd || 0;
    
    if (start === end) {
      // No hay texto seleccionado
      setNewMessage(prev => prev + '*texto en cursiva*');
      setTimeout(() => textField.focus(), 10);
    } else {
      // Hay texto seleccionado
      const selectedText = newMessage.substring(start, end);
      const newValue = newMessage.substring(0, start) + `*${selectedText}*` + newMessage.substring(end);
      setNewMessage(newValue);
      setTimeout(() => {
        textField.focus();
        textField.setSelectionRange(start + 1, end + 1);
      }, 10);
    }
    handleCloseFormatMenu();
  };
  
  const handleCodeClick = () => {
    const textField = document.querySelector('input[type="text"]') as HTMLInputElement;
    const start = textField.selectionStart || 0;
    const end = textField.selectionEnd || 0;
    
    if (start === end) {
      // No hay texto seleccionado
      setNewMessage(prev => prev + '`código`');
      setTimeout(() => textField.focus(), 10);
    } else {
      // Hay texto seleccionado
      const selectedText = newMessage.substring(start, end);
      const newValue = newMessage.substring(0, start) + `\`${selectedText}\`` + newMessage.substring(end);
      setNewMessage(newValue);
      setTimeout(() => {
        textField.focus();
        textField.setSelectionRange(start + 1, end + 1);
      }, 10);
    }
    handleCloseFormatMenu();
  };
  
  const handleListClick = () => {
    setNewMessage(prev => prev + '\n- Elemento 1\n- Elemento 2\n- Elemento 3');
    setTimeout(() => {
      const textField = document.querySelector('input[type="text"]') as HTMLInputElement;
      textField.focus();
    }, 10);
    handleCloseFormatMenu();
  };
  
  // Manejador para enlaces
  const handleLinkDialogOpen = () => {
    setLinkUrl('');
    setLinkText('');
    setLinkDialogOpen(true);
    handleCloseFormatMenu();
  };
  
  const handleLinkInsert = () => {
    if (linkUrl) {
      const linkMarkdown = linkText ? `[${linkText}](${linkUrl})` : linkUrl;
      setNewMessage(prev => prev + ' ' + linkMarkdown);
      setLinkDialogOpen(false);
    }
  };
  
  // Manejadores para archivos e imágenes
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      toast.success(`Archivo seleccionado: ${files[0].name}`);
    }
  };
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedImage(files[0]);
      toast.success(`Imagen seleccionada: ${files[0].name}`);
    }
  };
  
  // Renderizar el contenido del mensaje con formato
  const renderMessageText = (text: string): React.ReactNode => {
    // Expresiones regulares para encontrar patrones de formato
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    const codeRegex = /`(.*?)`/g;
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    
    // Expresión regular para detectar enlaces de YouTube
    const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/g;
    
    // Verificar si es un enlace de YouTube
    const youtubeMatches = [...text.matchAll(youtubeRegex)];
    
    // Si hay un enlace de YouTube, mostrar la vista previa
    if (youtubeMatches.length > 0) {
      const parts = [];
      let lastIndex = 0;
      
      for (const match of youtubeMatches) {
        const fullMatch = match[0];
        const videoId = match[4]; // El ID del video está en el 4º grupo de captura
        const matchIndex = match.index || 0;
        
        // Añadir el texto antes del enlace de YouTube
        if (matchIndex > lastIndex) {
          const textBeforeYoutube = text.substring(lastIndex, matchIndex);
          parts.push(
            <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ 
              __html: formatTextWithRegex(textBeforeYoutube, boldRegex, italicRegex, codeRegex, linkRegex) 
            }} />
          );
        }
        
        // Añadir la vista previa de YouTube
        parts.push(
          <Box key={`youtube-${matchIndex}`} mt={1} mb={1} sx={{ 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}>
            <Box sx={{ 
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              width: { xs: '100%', sm: '80%', md: '70%' },
              maxWidth: '450px',
              pb: { xs: '56.25%', sm: '40%', md: '35%' }, // Relación de aspecto reducida en pantallas más grandes
            }}>
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px'
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              <a 
                href={fullMatch} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'inherit', 
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                {fullMatch}
              </a>
            </Typography>
          </Box>
        );
        
        lastIndex = matchIndex + fullMatch.length;
      }
      
      // Añadir el texto después del último enlace de YouTube
      if (lastIndex < text.length) {
        const textAfterYoutube = text.substring(lastIndex);
        parts.push(
          <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ 
            __html: formatTextWithRegex(textAfterYoutube, boldRegex, italicRegex, codeRegex, linkRegex) 
          }} />
        );
      }
      
      return <>{parts}</>;
    }
    
    // Si no hay enlaces de YouTube, procesar el texto normalmente
    return <span dangerouslySetInnerHTML={{ 
      __html: formatTextWithRegex(text, boldRegex, italicRegex, codeRegex, linkRegex) 
    }} />;
  };
  
  // Formatear texto con expresiones regulares
  const formatTextWithRegex = (
    text: string,
    boldRegex: RegExp,
    italicRegex: RegExp,
    codeRegex: RegExp,
    linkRegex: RegExp
  ): string => {
    // Procesar texto usando replace simple
    let formattedText = text;
    
    // Aplicar formato de negrita
    formattedText = formattedText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, (match, g1, g2) => {
      const content = g1 || g2;
      return `<strong>${content}</strong>`;
    });
    
    // Aplicar formato de cursiva
    formattedText = formattedText.replace(/\*(.*?)\*|_(.*?)_/g, (match, g1, g2) => {
      const content = g1 || g2;
      return `<em>${content}</em>`;
    });
    
    // Aplicar formato de código
    formattedText = formattedText.replace(/`(.*?)`/g, (match, content) => {
      return `<code style="background-color: rgba(0,0,0,0.08); padding: 2px 4px; border-radius: 4px;">${content}</code>`;
    });
    
    // Aplicar enlaces
    formattedText = formattedText.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${url}</a>`;
    });
    
    return formattedText;
  };
  
  // Detectar enlaces de YouTube y convertirlos en vista previa en el mensaje de entrada
  const handleChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
  };

  // Renderizar mensaje con estilo de administrador si es necesario
  const renderMessage = (message: Message) => {
    // Verificar si es administrador
    const isAdminByFunction = isAdminUser(message.userEmail, message.userName, message.userId);
    const isAdmin = isAdminByFunction || message.isAdmin === true;
    
    // Log para depuración
    console.log('Renderizando mensaje:', {
      id: message.id,
      text: message.text.substring(0, 20) + '...',
      isAdmin: isAdmin,
      isAdminByField: message.isAdmin,
      isAdminByFunction: isAdminByFunction,
      userName: message.userName,
      userEmail: message.userEmail,
      userId: message.userId
    });
    
    const isCurrentUser = message.userId === user?.uid;
    const isPrivateMessage = message.recipientId !== undefined && message.recipientId !== null;

    // Añadir estilos inline para reforzar los estilos de administrador
    const adminBubbleStyle = isAdmin ? {
      backgroundColor: '#000000',
      color: '#ff0000',
      border: '4px solid #ff0000',
      boxShadow: '0 0 30px rgba(255, 0, 0, 0.8)',
      textAlign: 'center' as const,
      margin: '20px auto',
      padding: '20px',
      borderRadius: '10px',
      width: isPrivateMessage ? '90%' : '100%',
      maxWidth: '600px',
      zIndex: 9999,
      display: 'block'
    } : {};

    const adminTextStyle = isAdmin ? {
      color: '#ff0000',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      textShadow: '0 0 5px rgba(255, 0, 0, 0.3)'
    } : {};

    return (
      <Grid item key={message.id} sx={{ width: '100%' }}>
        {isAdmin ? (
          // Renderizado especial para mensajes de administrador
          <Box 
            className="admin-message-container"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              my: 3
            }}
          >
            {/* Avatar y nombre del administrador arriba */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              gap: 1
            }}>
              <Avatar 
                className="admin-avatar"
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: '#ff0000',
                  border: '2px solid #ff0000',
                  boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
                }}
              >
                👑
              </Avatar>
              <Typography 
                variant="subtitle2"
                className="admin-name"
                sx={{ 
                  color: '#ff0000',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Administrador
              </Typography>
            </Box>
            
            {/* Burbuja del mensaje */}
            <Box
              className="admin-message"
              data-admin="true"
              sx={{
                backgroundColor: '#000000',
                color: '#ff0000',
                border: '4px solid #ff0000',
                boxShadow: '0 0 30px rgba(255, 0, 0, 0.8)',
                textAlign: 'center',
                padding: { xs: '15px', sm: '20px' },
                borderRadius: '10px',
                width: { xs: '95%', sm: '90%', md: '85%' },
                maxWidth: '600px',
                position: 'relative'
              }}
            >
              {/* Indicador de mensaje privado si existe */}
              {isPrivateMessage && (
                <Typography 
                  variant="caption" 
                  component="div"
                  className="admin-text"
                  sx={{ 
                    display: 'block',
                    mb: 1,
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    color: '#ff0000',
                    textDecoration: 'underline',
                  }}
                >
                  Mensaje privado para: {message.recipientName || 'Usuario'}
                </Typography>
              )}
            
              {/* Texto del mensaje con formato */}
              <Box 
                className="admin-text"
                sx={{ 
                  color: '#ff0000',
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.5,
                  my: 1
                }}
              >
                {renderMessageText(message.text)}
              </Box>
              
              {/* Imagen adjunta si existe */}
              {message.imageUrl && (
                <Box mt={2} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                  <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={message.imageUrl} 
                      alt="Imagen adjunta" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '2px solid #ff0000'
                      }}
                    />
                  </a>
                </Box>
              )}
              
              {/* Archivo adjunto si existe */}
              {message.fileUrl && (
                <Box 
                  mt={2} 
                  sx={{
                    p: 1.5,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    border: '1px solid rgba(255, 0, 0, 0.3)',
                    mx: 'auto',
                    maxWidth: '80%',
                    ':hover': {
                      backgroundColor: 'rgba(255, 0, 0, 0.15)',
                    }
                  }}
                >
                  <AttachIcon 
                    fontSize="small"
                    className="admin-icon"
                    sx={{ color: '#ff0000' }} 
                  />
                  <a 
                    href={message.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#ff0000',
                      textDecoration: 'none'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      className="admin-text"
                      sx={{ 
                        fontWeight: 'medium',
                        color: '#ff0000'
                      }}
                    >
                      {message.fileName || 'Archivo adjunto'}
                    </Typography>
                  </a>
                </Box>
              )}
              
              {/* Timestamp en la parte inferior */}
              <Typography 
                variant="caption" 
                component="div"
                className="admin-text"
                sx={{ 
                  fontSize: '0.7rem',
                  color: '#ff0000',
                  opacity: 0.9,
                  mt: 2
                }}
              >
                {formatMessageTime(message.createdAt)}
              </Typography>
            </Box>
          </Box>
        ) : (
          // Renderizado normal para mensajes que no son de administrador
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 0.5
            }}
          >
            {/* Avatar y nombre de usuario (siempre a la izquierda) */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              mr: 1.5,
              minWidth: '40px'
            }}>
              <Avatar 
                src={message.photoURL || undefined} 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main',
                  border: '2px solid',
                  borderColor: isCurrentUser ? 'primary.light' : 'secondary.light'
                }}
              >
                {message.userName ? message.userName[0].toUpperCase() : 'U'}
              </Avatar>
              <Typography 
                variant="caption"
                sx={{ 
                  fontSize: '0.7rem', 
                  mt: 0.5,
                  color: 'text.secondary',
                  maxWidth: '60px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
              >
                {message.userName}
              </Typography>
            </Box>
            
            {/* Contenido del mensaje */}
            <Box sx={{ flexGrow: 1, maxWidth: 'calc(100% - 60px)' }}>
              {/* Burbuja del mensaje */}
              <Box
                sx={{
                  backgroundColor: isCurrentUser 
                    ? 'primary.main' 
                    : theme => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.9)',
                  color: isCurrentUser ? 'white' : 'text.primary',
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  wordBreak: 'break-word'
                }}
              >
                {/* Indicador de mensaje privado si existe */}
                {isPrivateMessage && (
                  <Typography 
                    variant="caption" 
                    component="div"
                    sx={{ 
                      display: 'block',
                      mb: 0.5,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Mensaje privado del administrador
                  </Typography>
                )}
              
                {/* Texto del mensaje con formato */}
                <Box>
                  {renderMessageText(message.text)}
                </Box>
                
                {/* Imagen adjunta si existe */}
                {message.imageUrl && (
                  <Box mt={1} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                    <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={message.imageUrl} 
                        alt="Imagen adjunta" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </a>
                  </Box>
                )}
                
                {/* Archivo adjunto si existe */}
                {message.fileUrl && (
                  <Box 
                    mt={1} 
                    sx={{
                      p: 1,
                      backgroundColor: isCurrentUser 
                          ? 'rgba(0,0,0,0.1)' 
                          : 'rgba(0,0,0,0.05)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      ':hover': {
                        backgroundColor: isCurrentUser 
                            ? 'rgba(0,0,0,0.15)' 
                            : 'rgba(0,0,0,0.08)',
                      }
                    }}
                  >
                    <AttachIcon 
                      fontSize="small" 
                    />
                    <a 
                      href={message.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: isCurrentUser ? 'white' : 'inherit',
                        textDecoration: 'none'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'medium'
                        }}
                      >
                        {message.fileName || 'Archivo adjunto'}
                      </Typography>
                    </a>
                  </Box>
                )}
                
                {/* Timestamp en la esquina inferior derecha */}
                <Typography 
                  variant="caption" 
                  component="div"
                  sx={{ 
                    position: 'absolute',
                    right: 8,
                    bottom: 4,
                    fontSize: '0.65rem',
                    opacity: 0.75,
                    color: isCurrentUser ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary'
                  }}
                >
                  {formatMessageTime(message.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 10, pb: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        {/* Encabezado del chat */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {isMobile && (
            <IconButton color="inherit" onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div">
            Chat Global
          </Typography>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Ir a documentos">
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/documentos')}
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                <DocumentIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {messages.length} mensajes
            </Typography>
          </Box>
        </Box>
        
        <Divider />
        
        {/* Área de mensajes */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: 2,
            backgroundColor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.05)' 
              : 'rgba(238, 240, 244, 0.5)'
          }}
          className="messages-container"
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box textAlign="center" mt={4}>
              <Typography color="text.secondary">
                No hay mensajes aún. ¡Sé el primero en escribir algo!
              </Typography>
            </Box>
          ) : (
            <Grid container direction="column" spacing={1.5}>
              {messages.map((message) => renderMessage(message))}
              <div ref={messagesEndRef} />
            </Grid>
          )}
        </Box>
        
        <Divider />
        
        {/* Barra de formato */}
        <Box sx={{ 
          display: 'flex', 
          p: 1,
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.04)'
        }}>
          <IconButton 
            color="primary" 
            onClick={handleBoldClick}
            size="small" 
            title="Negrita"
          >
            <BoldIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="primary" 
            size="small"
            onClick={handleItalicClick}
            title="Cursiva"
          >
            <ItalicIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="primary" 
            size="small"
            onClick={handleCodeClick}
            title="Código"
          >
            <CodeIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="primary" 
            size="small"
            onClick={handleLinkDialogOpen}
            title="Enlace"
          >
            <LinkIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="primary" 
            size="small"
            onClick={handleListClick}
            title="Lista"
          >
            <ListIcon fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <IconButton 
            color="primary" 
            onClick={handleOpenEmojiMenu}
            size="small"
            aria-controls={openEmojiMenu ? 'emoji-menu' : undefined}
            aria-expanded={openEmojiMenu ? 'true' : undefined}
            title="Emoticonos"
          >
            <EmojiIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="primary" 
            size="small"
            onClick={() => imageInputRef.current?.click()}
            title="Imagen"
          >
            <ImageIcon fontSize="small" />
            <input 
              type="file" 
              ref={imageInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageSelect}
            />
          </IconButton>
          <IconButton 
            color="primary" 
            size="small"
            onClick={() => fileInputRef.current?.click()}
            title="Archivo"
          >
            <AttachIcon fontSize="small" />
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </IconButton>
          
          {/* Menú de emojis */}
          <Menu
            id="emoji-menu"
            anchorEl={emojiAnchorEl}
            open={openEmojiMenu}
            onClose={handleCloseEmojiMenu}
            PaperProps={{
              style: {
                maxHeight: 220,
                width: 240,
                padding: '8px'
              },
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {emojis.map((emoji, index) => (
                <IconButton 
                  key={index} 
                  onClick={() => handleEmojiClick(emoji)}
                  size="small"
                  sx={{ margin: '2px', fontSize: '1.2rem' }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Menu>
        </Box>
        
        {/* Área de entrada de mensaje */}
        <Box 
          component="form" 
          onSubmit={handleSendMessage}
          className="message-input-container"
          sx={{ 
            p: 2, 
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Escribe un mensaje..."
              size="small"
              value={newMessage}
              onChange={handleChangeMessage}
              sx={{ 
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '24px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                }
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              disabled={(!newMessage.trim() && !selectedFile && !selectedImage) || !user || sending}
              type="submit"
              sx={{
                borderRadius: '24px',
                minWidth: '100px'
              }}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Diálogo para insertar enlaces */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Insertar enlace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL del enlace"
            type="url"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://ejemplo.com"
            required
          />
          <TextField
            margin="dense"
            label="Texto a mostrar (opcional)"
            type="text"
            fullWidth
            variant="outlined"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Texto descriptivo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleLinkInsert} variant="contained" disabled={!linkUrl}>
            Insertar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de progreso de carga */}
      <Dialog open={uploadDialogOpen} onClose={() => {}}>
        <DialogTitle>Subiendo archivo</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <CircularProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(uploadProgress)}% completado
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ChatGlobal; 