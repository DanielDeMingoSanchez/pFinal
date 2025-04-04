import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const WelcomeAlert: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          // Si el usuario es nuevo, mostrar el mensaje
          setOpen(true);
        } else {
          const userData = userDoc.data();
          // Mostrar el mensaje si nunca lo ha visto o si eligió verlo de nuevo
          if (!userData.hasSeenWelcome || userData.showWelcomeAgain) {
            setOpen(true);
          }
        }
      }
    };
    checkWelcomeStatus();
  }, [user]);

  const handleAccept = async () => {
    setOpen(false);
    setShowConfirmDialog(true);
  };

  const handleDecline = () => {
    setOpen(false);
    setShowBanDialog(true);
  };

  const handleConfirmShowAgain = async (showAgain: boolean) => {
    if (user?.uid) {
      await setDoc(doc(db, 'users', user.uid), {
        hasSeenWelcome: true,
        showWelcomeAgain: showAgain,
        lastWelcomeShown: new Date()
      }, { merge: true });
    }
    setShowConfirmDialog(false);
  };

  const handleConfirmBan = async () => {
    if (user?.uid) {
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + 1);
      
      await setDoc(doc(db, 'users', user.uid), {
        isBanned: true,
        banUntil: banUntil,
      }, { merge: true });

      toast.error('Has sido baneado por 24 horas por no aceptar las condiciones');
      navigate('/login');
    }
    setShowBanDialog(false);
  };

  return (
    <>
      <Dialog
        open={open}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#000',
            color: '#ff0000',
            borderRadius: 2,
            '& .MuiDialogTitle-root': {
              borderBottom: '1px solid #ff0000',
            },
            '& .MuiTypography-root': {
              color: '#ff0000 !important',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h5" 
            component="div" 
            id="welcome-title"
            className="welcome-title"
            sx={{ 
              fontWeight: 'bold', 
              color: '#ff0000 !important',
              textShadow: 'none !important'
            }}
            style={{ color: 'red' }}
          >
            Bienvenido a esta comunidad
          </Typography>
          <Tooltip title="No puedes cerrar hasta aceptar">
            <IconButton edge="end" color="inherit" disabled>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ color: 'red !important' }} className="welcome-message">
            <Typography variant="body1" paragraph>
              Antes de continuar, tendrás que aceptar las siguientes condiciones:
            </Typography>
            
            <Typography variant="body1" paragraph>
              Gracias por registrarte y por querer compartir tu experiencia. Para que esto funcione como una comunidad positiva, te agradecería que subas archivos con títulos claros: si son exámenes, que se entienda; si son apuntes, también. Ayudémonos entre todos.
            </Typography>

            <Typography variant="body1" paragraph>
              Ahora bien… si lo tuyo es el salseo, subir .zip, .rar u otro tipo de archivos random, vete directo al chat y siéntete libre. Se aceptan bromas, algún que otro insulto con gracia, pero todo con un límite razonable. No queremos dramas.
            </Typography>

            <Typography variant="body1" paragraph>
              Si tienes cualquier duda, puedes escribirme directamente:
              <br />
              📧 rnyme123@gmail.com
            </Typography>

            <Typography variant="body1" paragraph>
              ¿Aceptas?
              <br />
              ¿O... quieres un ban de 1 día por no aceptar? 😈😈😈
            </Typography>

            <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic' }}>
              PD: No me hago responsable de ningún acto delictivo que se pueda cocinar por aquí.
              <br />
              Un saludo, estoy bajo los efectos del alcohol.
              <br />
              — Daniel 🍻
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleDecline}
            sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
          >
            Quiero el ban 😈
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAccept}
            sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
          >
            Acepto las condiciones
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#000',
            color: '#ff0000',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            ¿Quieres que se vuelva a mostrar el mensaje de nuevo?
          </Typography>
        </DialogTitle>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleConfirmShowAgain(false)}
            sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
          >
            No, no volver a mostrar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleConfirmShowAgain(true)}
            sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
          >
            Sí, mostrar de nuevo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showBanDialog}
        onClose={() => setShowBanDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#000',
            color: '#ff0000',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            ¿Estás seguro que quieres recibir el castigo del mazo? 😈
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Si confirmas, serás baneado por 24 horas. ¿Realmente quieres esto?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmBan}
            sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
          >
            Sí, baneame 😈
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowBanDialog(false)}
            sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
          >
            No, me arrepiento
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WelcomeAlert; 