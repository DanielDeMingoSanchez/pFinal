import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { FaTrash, FaEye, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Grid, Typography, Button, Box, CircularProgress } from '@mui/material';
import DocumentoCard from './ui/DocumentoCard';
import { useNavigate, useLocation } from 'react-router-dom';

interface Documento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  fechaCreacion: string;
  vistas: number;
  descargas: number;
  url: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

// Función para formatear la fecha en formato MM/DD/YYYY
const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return 'Fecha desconocida';
    
    // Primero intentar con el formato estándar
    const fecha = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (!isNaN(fecha.getTime())) {
      const mes = fecha.getMonth() + 1;
      const dia = fecha.getDate();
      const año = fecha.getFullYear();
      return `${mes}/${dia}/${año}`;
    }
    
    // Si la fecha incluye una marca de tiempo de Firestore (seconds, nanoseconds)
    if (typeof dateString === 'object' && 'seconds' in dateString) {
      const fecha = new Date((dateString as { seconds: number }).seconds * 1000);
      const mes = fecha.getMonth() + 1;
      const dia = fecha.getDate();
      const año = fecha.getFullYear();
      return `${mes}/${dia}/${año}`;
    }
    
    // Para fechas en formato ISO
    if (typeof dateString === 'string' && dateString.includes('T')) {
      const fechaParte = dateString.split('T')[0];
      const [año, mes, dia] = fechaParte.split('-').map(Number);
      if (año && mes && dia) {
        return `${mes}/${dia}/${año}`;
      }
    }
    
    // Último recurso: mostrar la fecha como string
    if (dateString) {
      return String(dateString).substring(0, 10);
    }
    
    return 'Fecha desconocida';
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    // Último intento: mostrar los primeros 10 caracteres de la cadena
    return dateString ? String(dateString).substring(0, 10) : 'Fecha desconocida';
  }
};

// Estilos del carrusel para reutilizar
const carouselStyles = {
  title: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '-0.009em',
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.15)'
  },
  description: {
    fontSize: '0.875rem',
    lineHeight: 1.25,
    letterSpacing: '-0.022em',
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
  },
  metadata: {
    fontSize: '0.75rem',
    color: 'rgba(107, 114, 128, 0.9)',
    letterSpacing: '0.01em'
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    letterSpacing: '0.25px',
    padding: '8px 20px',
    borderRadius: '25px',
    boxShadow: '0 2px 4px rgba(15, 108, 191, 0.15)'
  }
};

const UserDocuments: React.FC = () => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('fechaCreacion');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    // Extraer el término de búsqueda de la URL si existe
    const searchParams = new URLSearchParams(location.search);
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setDocumentos([]);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'documentos'),
          where('usuario.id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const docs: Documento[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Documento, 'id'>;
          docs.push({
            id: doc.id,
            ...data
          });
        });

        // Ordenar por fecha de creación, más reciente primero
        docs.sort((a, b) => {
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        });

        setDocumentos(docs);
      } catch (error) {
        console.error('Error al obtener documentos:', error);
        toast.error('Error al cargar los documentos');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentos();
  }, []);

  const verDocumento = (url: string) => {
    window.open(url, '_blank');
  };

  const descargarDocumento = async (documento: Documento) => {
    try {
      // Mostrar mensaje de carga
      const toastId = toast.loading('Preparando descarga...', { id: 'download-toast' });

      console.log('Actualizando contador de descargas para documento:', documento.id);
      console.log('Valor actual de descargas:', documento.descargas);

      // Incrementar contador de descargas en Firestore
      const docRef = doc(db, 'documentos', documento.id);
      const nuevoValorDescargas = (documento.descargas || 0) + 1;
      
      // Preparar nombre del archivo basado en el título
      const sanitizedTitulo = documento.titulo.replace(/[\\/:*?"<>|]/g, '');
      
      // Si la URL tiene una extensión, la usamos
      let extension = '';
      if (documento.url) {
        const urlParts = documento.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName.includes('.')) {
          const fileNameParts = fileName.split('.');
          extension = fileNameParts[fileNameParts.length - 1].split('?')[0];
        }
      }
      
      // Si no se encontró extensión, usar 'pdf' por defecto
      if (!extension) {
        extension = 'pdf';
      }
      
      const filename = `${sanitizedTitulo}.${extension}`;

      // Crear URL con parámetro de descarga forzada
      const downloadUrl = documento.url + (documento.url.includes('?') ? '&' : '?') + 'response-content-disposition=attachment';

      // Método directo de descarga - crear un enlace y hacer clic
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar después de un corto retraso
      setTimeout(() => {
        document.body.removeChild(a);
        toast.dismiss(toastId);
        toast.success('Documento descargado correctamente');
      }, 100);
      
    } catch (error) {
      console.error('Error al descargar documento:', error);
      toast.error('Error al descargar el documento');
      
      // Intento de respaldo - abrir en nueva pestaña
      const downloadUrl = documento.url + (documento.url.includes('?') ? '&' : '?') + 'response-content-disposition=attachment';
      window.open(downloadUrl, '_blank');
    }
  };

  const eliminarDocumento = async (id: string) => {
    try {
      // Buscar el documento a eliminar
      const documento = documentos.find(doc => doc.id === id);
      if (!documento) {
        toast.error('Documento no encontrado');
        return;
      }

      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, 'documentos', id));

      // Si tiene URL, intentar eliminar el archivo del Storage
      if (documento.url) {
        try {
          // Extraer la ruta del archivo de la URL
          const fileUrl = new URL(documento.url);
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

      // Actualizar la lista de documentos
      setDocumentos(prevDocs => prevDocs.filter(doc => doc.id !== id));
      
      toast.success('Documento eliminado correctamente');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambia la dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un nuevo campo, establece el campo y la dirección (desc por defecto)
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedDocuments = () => {
    // Primero filtramos por término de búsqueda
    let filtered = documentos;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = documentos.filter(doc => 
        doc.titulo.toLowerCase().includes(term) ||
        doc.descripcion.toLowerCase().includes(term) ||
        doc.categoria.toLowerCase().includes(term) ||
        doc.subcategoria.toLowerCase().includes(term)
      );
    }

    // Creamos una copia del array para ordenar
    return [...filtered].sort((a, b) => {
      if (sortField === 'titulo') {
        // Ordenar alfabéticamente por título
        const compareTitulos = a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase());
        return sortDirection === 'asc' ? compareTitulos : -compareTitulos;
      } 
      
      else if (sortField === 'fechaCreacion') {
        // Convertir las fechas a objetos Date correctamente, independientemente del formato
        let dateA, dateB;
        
        try {
          // Intentar interpretar la fecha como timestamp (número)
          if (!isNaN(Number(a.fechaCreacion))) {
            dateA = Number(a.fechaCreacion);
          } else {
            // Si no es un número, tratar como string de fecha
            dateA = new Date(a.fechaCreacion).getTime();
          }
          
          if (!isNaN(Number(b.fechaCreacion))) {
            dateB = Number(b.fechaCreacion);
          } else {
            dateB = new Date(b.fechaCreacion).getTime();
          }
          
          // Si alguno de los valores no es una fecha válida, usar 0
          if (isNaN(dateA)) dateA = 0;
          if (isNaN(dateB)) dateB = 0;
          
          // Mostrar para depuración
          console.log(`Fecha original A: ${a.fechaCreacion}, Convertida: ${new Date(dateA).toISOString()}`);
          console.log(`Fecha original B: ${b.fechaCreacion}, Convertida: ${new Date(dateB).toISOString()}`);
          
          // Realizar la comparación según la dirección
          if (sortDirection === 'asc') {
            return dateA - dateB; // Más antiguos primero
          } else {
            return dateB - dateA; // Más recientes primero
          }
        } catch (error) {
          console.error("Error al comparar fechas:", error);
          return 0; // En caso de error, no cambiar el orden
        }
      } 
      
      else if (sortField === 'vistas' || sortField === 'descargas') {
        // Ordenar por número (vistas o descargas)
        const valueA = a[sortField] || 0;
        const valueB = b[sortField] || 0;
        
        if (sortDirection === 'asc') {
          return valueA - valueB; // Menor a mayor
        } else {
          return valueB - valueA; // Mayor a menor
        }
      }
      
      else if (sortField === 'categoria' || sortField === 'subcategoria') {
        // Ordenar alfabéticamente por categoría o subcategoría
        const compareValues = a[sortField].toLowerCase().localeCompare(b[sortField].toLowerCase());
        return sortDirection === 'asc' ? compareValues : -compareValues;
      }
      
      // Por defecto, sin ordenamiento específico
      return 0;
    });
  };

  const sortedDocuments = getSortedDocuments();

  return (
    <div className="min-h-screen py-10 user-documents-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full flex justify-center mb-6">
          <h2 className="text-2xl font-bold relative inline-block px-8 py-2" style={{
            borderBottom: '2px solid #3b82f6',
            borderTop: '2px solid #3b82f6',
            borderRadius: '4px',
            textAlign: 'center',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.2)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))'
          }}>
            Mis Documentos {searchTerm && `- Resultados para "${searchTerm}"`}
          </h2>
        </div>

        {/* La barra de búsqueda se ha movido al Navbar global */}

        {loading ? (
          <Box display="flex" justifyContent="center" my={6}>
            <CircularProgress />
          </Box>
        ) : documentos.length === 0 ? (
          <Box textAlign="center" my={6} p={4} bgcolor="rgba(255,255,255,0.8)" borderRadius={2}>
            <Typography variant="h6" mt={2} mb={1}>
              No has subido ningún documento todavía.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.location.href = '/upload-document'}
              sx={{ mt: 2 }}
            >
              Subir mi primer documento
            </Button>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              {searchTerm && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    setSearchTerm('');
                    // Eliminar el parámetro de búsqueda de la URL sin recargar la página
                    const searchParams = new URLSearchParams(location.search);
                    searchParams.delete('search');
                    window.history.replaceState(
                      {},
                      '',
                      location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
                    );
                  }}
                  sx={{
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    textTransform: 'none'
                  }}
                >
                  Limpiar búsqueda
                </Button>
              )}
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 text-sm dark:text-blue-300"
                style={{
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginLeft: 'auto'
                }}
              >
                <option value="fechaCreacion-desc">Más recientes primero</option>
                <option value="fechaCreacion-asc">Más antiguos primero</option>
                <option value="titulo-asc">Título (A-Z)</option>
                <option value="titulo-desc">Título (Z-A)</option>
                <option value="vistas-desc">Más vistas</option>
                <option value="descargas-desc">Más descargas</option>
              </select>
            </Box>

            <Grid container spacing={3} mt={1}>
              {sortedDocuments.map((documento) => (
                <Grid item xs={12} sm={6} md={4} key={documento.id}>
                  <DocumentoCard documento={documento} />
                </Grid>
              ))}
            </Grid>
            
            {sortedDocuments.length === 0 && searchTerm && (
              <Box textAlign="center" my={6} p={4} bgcolor="rgba(255,255,255,0.8)" borderRadius={2}>
                <Typography variant="h6" mt={2} mb={1}>
                  No se encontraron documentos que coincidan con "{searchTerm}"
                </Typography>
              </Box>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDocuments; 