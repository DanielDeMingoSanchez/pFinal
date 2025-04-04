import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Paper,
    Alert,
    Card,
    CardContent,
    Chip,
    Stack
} from '@mui/material';
import { Delete, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';

interface Documento {
    id: string;
    nombre: string;
    url: string;
    fechaSubida: string;
    userId: string;
}

const DocumentList: React.FC = () => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        const q = query(
            collection(db, 'documentos'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs: Documento[] = [];
            snapshot.forEach((doc) => {
                docs.push({ id: doc.id, ...doc.data() } as Documento);
            });
            setDocumentos(docs);
        }, (err) => {
            setError('Error al cargar los documentos');
            console.error(err);
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleDelete = async (id: string, nombre: string) => {
        try {
            // Eliminar el documento de Firestore
            await deleteDoc(doc(db, 'documentos', id));
            
            // Eliminar el archivo de Storage
            const fileRef = ref(storage, `documentos/${auth.currentUser?.uid}/${nombre}`);
            await deleteObject(fileRef);
        } catch (err) {
            setError('Error al eliminar el documento');
            console.error(err);
        }
    };

    const handleDownload = async (url: string) => {
        try {
            window.open(url, '_blank');
        } catch (err) {
            setError('Error al descargar el documento');
            console.error(err);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Mis Documentos
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/documentos/subir')}
                    sx={{ mb: 3 }}
                >
                    Subir Nuevo Documento
                </Button>
                <Paper>
                    <List>
                        {documentos.map((doc) => (
                            <ListItem key={doc.id}>
                                <ListItemText
                                    primary={doc.nombre}
                                    secondary={doc.fechaSubida 
                                      ? new Date(doc.fechaSubida).toLocaleDateString() || 'Fecha desconocida'
                                      : 'Fecha desconocida'
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        aria-label="download"
                                        onClick={() => handleDownload(doc.url)}
                                        sx={{ mr: 1 }}
                                    >
                                        <Download />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDelete(doc.id, doc.nombre)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
};

export default DocumentList; 