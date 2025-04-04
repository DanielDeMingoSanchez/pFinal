import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { auth, storage, db } from '../../firebase/config';

const UploadDocument: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) {
      setError('Por favor, selecciona un archivo');
      return;
    }

    setLoading(true);
    try {
      // Subir archivo a Firebase Storage
      const storageRef = ref(storage, `documentos/${auth.currentUser.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Guardar referencia en Firestore
      await addDoc(collection(db, 'documentos'), {
        nombre: file.name,
        url: downloadURL,
        fechaSubida: new Date().toISOString(),
        userId: auth.currentUser.uid
      });

      navigate('/documentos');
    } catch (err) {
      setError('Error al subir el documento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Subir Documento
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <TextField
            margin="normal"
            fullWidth
            value={file ? file.name : ''}
            label="Archivo seleccionado"
            InputProps={{ readOnly: true }}
          />
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar Archivo
          </Button>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !file}
          >
            {loading ? <CircularProgress size={24} /> : 'Subir Documento'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/documentos')}
          >
            Volver a la lista
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default UploadDocument; 