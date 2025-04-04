import React, { useState, useEffect } from 'react';
import { MdSchool } from 'react-icons/md';
import { Grid, Card, CardContent, CardMedia, Typography, Button, Box, CircularProgress } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import EducationPageWrapper from './EducationPageWrapper';
import DocumentoCard from '../ui/DocumentoCard';

interface Documento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  fechaCreacion: string;
  descargas: number;
  vistas: number;
  destacado: boolean;
  url: string;
  usuario: {
    nombre: string;
    id: string;
    email: string;
  };
}

const Universidad: React.FC = () => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerDocumentos = async () => {
      try {
        setCargando(true);
        const q = query(collection(db, "documentos"), where("categoria", "==", "universidad"));
        const querySnapshot = await getDocs(q);
        
        const docsData: Documento[] = [];
        querySnapshot.forEach((doc) => {
          docsData.push({ id: doc.id, ...doc.data() } as Documento);
        });
        
        setDocumentos(docsData);
        setCargando(false);
      } catch (err) {
        console.error("Error al obtener documentos:", err);
        setError("No se pudieron cargar los documentos. Por favor, inténtalo de nuevo más tarde.");
        setCargando(false);
      }
    };

    obtenerDocumentos();
  }, []);

  return (
    <EducationPageWrapper
      title="Universidad"
      description="Encuentra y comparte documentos de nivel universitario. Recursos académicos, trabajos, apuntes y más material de calidad para estudiantes universitarios."
      icon={<MdSchool size={36} />}
      color="#4F46E5"
    >
      {cargando ? (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Box textAlign="center" my={6}>
          <Typography color="error" paragraph>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reintentar
          </Button>
        </Box>
      ) : documentos.length === 0 ? (
        <Box textAlign="center" my={6} p={4} bgcolor="rgba(255,255,255,0.8)" borderRadius={2}>
          <MdSchool size={48} color="#4F46E5" />
          <Typography variant="h6" mt={2} mb={1}>
            No hay documentos universitarios
          </Typography>
          <Typography color="text.secondary" paragraph>
            Sé el primero en compartir tus apuntes, trabajos o recursos universitarios.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            href="/documentos"
            sx={{ mt: 2 }}
          >
            Subir documento
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3} mt={1}>
          {documentos.map((documento) => (
            <Grid item xs={12} sm={6} md={4} key={documento.id}>
              <DocumentoCard documento={documento} />
            </Grid>
          ))}
        </Grid>
      )}
    </EducationPageWrapper>
  );
};

export default Universidad; 