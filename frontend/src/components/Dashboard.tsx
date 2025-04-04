import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase/config';
import { IconType } from 'react-icons';
import { 
  FaSearch, 
  FaUpload, 
  FaBook, 
  FaGraduationCap, 
  FaBriefcase, 
  FaChartLine, 
  FaDownload, 
  FaEye, 
  FaRegStar,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaTrash,
  FaTimes,
  FaUser,
  FaCalendar
} from 'react-icons/fa';
import { MdSchool, MdCategory } from 'react-icons/md';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import IconWrapper from './ui/IconWrapper';
import SearchBar from './ui/SearchBar';
import StatCard from './ui/StatCard';
import { useNavigate } from 'react-router-dom';
import FloatingBackButton from './ui/FloatingBackButton';
import { Box, Typography } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import Card from './Card';
import Carousel from './Carousel';

// Interfaces
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
  nombreArchivo?: string;  // <--- Añade este campo si no lo tenías
  usuario: {
    nombre: string;
    id: string;
    email: string;
  };
}


interface Categoria {
  id: string;
  nombre: string;
  icono: IconType;
  color: string;
  documentos: number;
}

interface EstadisticaCard {
  titulo: string;
  valor: number;
  icono: IconType;
  color: string;
  bgColor: string;
}

// Añadimos las interfaces para los eventos
interface FormEvent extends React.FormEvent<HTMLFormElement> {}
interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {}
interface TextAreaChangeEvent extends React.ChangeEvent<HTMLTextAreaElement> {}
interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}

const Dashboard: React.FC = () => {
  // Estados
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentosDestacados, setDocumentosDestacados] = useState<Documento[]>([]);
  const [documentosRecientes, setDocumentosRecientes] = useState<Documento[]>([]);
  const [documentosFiltrados, setDocumentosFiltrados] = useState<Documento[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState({
    totalDocumentos: 0,
    totalDescargas: 0,
    totalVistas: 0,
    totalUsuarios: 0
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Documento[]>([]);
  const [mostrandoResultados, setMostrandoResultados] = useState(false);
  
  // Estados para el formulario de subida
  const [tituloDocumento, setTituloDocumento] = useState('');
  const [descripcionDocumento, setDescripcionDocumento] = useState('');
  const [categoriaDocumento, setCategoriaDocumento] = useState('');
  const [archivoDocumento, setArchivoDocumento] = useState<File | null>(null);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para las categorías
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: 'universidad', nombre: 'Universidad', icono: MdSchool, color: '#4F46E5', documentos: 0 },
    { id: 'grado-superior', nombre: 'G. Superior', icono: FaGraduationCap, color: '#10B981', documentos: 0 },
    { id: 'bachillerato', nombre: 'Bachillerato', icono: FaBook, color: '#F59E0B', documentos: 0 },
    { id: 'profesional', nombre: 'Profesional', icono: FaBriefcase, color: '#EC4899', documentos: 0 },
    { id: 'otros', nombre: 'Otros', icono: MdCategory, color: '#6B7280', documentos: 0 }
  ]);

  // Configuración de tarjetas de estadísticas
  const estadisticasCards: EstadisticaCard[] = [
    {
      titulo: 'Total Documentos',
      valor: estadisticas.totalDocumentos,
      icono: FaBook,
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      titulo: 'Total Descargas',
      valor: estadisticas.totalDescargas,
      icono: FaDownload,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      titulo: 'Total Vistas',
      valor: estadisticas.totalVistas,
      icono: FaEye,
      color: '#7c3aed',
      bgColor: '#ede9fe'
    },
    {
      titulo: 'Total Usuarios',
      valor: estadisticas.totalUsuarios,
      icono: FaChartLine,
      color: '#4f46e5',
      bgColor: '#e0e7ff'
    }
  ];

  // Datos para gráficos
  const pieChartData = categorias.map(cat => ({
    name: cat.nombre,
    value: cat.documentos || 1, // Valor mínimo de 1 para visualización
    color: cat.color
  }));

  const barChartData = [
    { name: 'Documentos', value: estadisticas.totalDocumentos, color: '#3b82f6' },
    { name: 'Descargas', value: estadisticas.totalDescargas, color: '#10b981' },
    { name: 'Vistas', value: estadisticas.totalVistas, color: '#7c3aed' }
  ];

  // Añadir estados para los filtros
  const [ordenarPor, setOrdenarPor] = useState<'recientes' | 'antiguos' | 'descargas' | 'vistas'>('recientes');
  const [mostrar, setMostrar] = useState<'todos' | 'destacados'>('todos');
  const [showFilters, setShowFilters] = useState(false);

  // Efectos y carga de datos
  useEffect(() => {
    console.log('Configurando intervalo para recarga automática de datos...');
    
    // Cargar datos inicialmente
    cargarDatos();
    
    // Configurar intervalo para recargar datos cada 5 segundos
    const interval = setInterval(() => {
      console.log('Recargando datos automáticamente...');
      cargarDatos();
    }, 5000); // Se ejecutará cada 5 segundos

    return () => {
      console.log('Limpiando intervalo de recarga automática');
      clearInterval(interval); // Limpiar el intervalo al desmontar el componente
    }
  }, []);

  // Efecto para el carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      if (documentosRecientes.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % documentosRecientes.length);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documentosRecientes]);

  // Efecto para escuchar cambios en tiempo real en Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'documentos'), snapshot => {
      // Procesar los cambios en tiempo real
      console.log('Cambios detectados en la colección de documentos');
      
      // Obtener los documentos actualizados directamente del snapshot
      const docsData: Documento[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || 'Sin título',
          descripcion: data.descripcion || 'Sin descripción',
          categoria: data.categoria || 'otros',
          fechaCreacion: data.fechaCreacion ? new Date(data.fechaCreacion.toDate()).toISOString() : new Date().toISOString(),
          descargas: typeof data.descargas === 'number' ? data.descargas : 0,
          vistas: typeof data.vistas === 'number' ? data.vistas : 0,
          destacado: Boolean(data.destacado),
          url: data.url || '#',
          usuario: {
            nombre: data.usuario?.nombre || 'Usuario anónimo',
            id: data.usuario?.id || `anon_${Math.random().toString(36).substr(2, 9)}`,
            email: data.usuario?.email || 'sin-email@ejemplo.com'
          }
        };
      });
      
      // Actualizar el estado con los nuevos documentos
      setDocumentos(docsData);
      
      // Actualizar estadísticas
      const stats = {
        totalDocumentos: docsData.length,
        totalDescargas: docsData.reduce((acc, doc) => acc + doc.descargas, 0),
        totalVistas: docsData.reduce((acc, doc) => acc + doc.vistas, 0),
        totalUsuarios: new Set(docsData.map(doc => doc.usuario.id)).size
      };
      setEstadisticas(stats);
      
      // Actualizar documentos destacados y recientes
      setDocumentosDestacados(
        docsData.filter(doc => doc.destacado).slice(0, 5)
      );
      
      setDocumentosRecientes(
        [...docsData]
          .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
          .slice(0, 5) // Limitamos a 5 documentos
      );
      
      // Actualizar conteo de documentos por categoría
      const conteoCategoria: Record<string, number> = {};
      docsData.forEach(doc => {
        const categoria = doc.categoria;
        conteoCategoria[categoria] = (conteoCategoria[categoria] || 0) + 1;
      });
      
      // Actualizar el conteo en las categorías
      setCategorias(prevCategorias => {
        return prevCategorias.map(cat => ({
          ...cat,
          documentos: conteoCategoria[cat.id] || 0
        }));
      });
      
      // Indicar que la carga ha terminado
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  const cargarDatos = async () => {
    try {
      console.log('Iniciando carga de datos desde Firestore...');
      setCargando(true);
      setError(null);
      
      // Verificar que la base de datos esté configurada
      if (!db) {
        console.error('Error: La base de datos de Firestore no está configurada');
        setError('Error: La base de datos no está configurada');
        setCargando(false);
        return;
      }
      
      // Obtener la colección de documentos
      console.log('Obteniendo colección de documentos...');
      const docsRef = collection(db, 'documentos');
      
      // Crear una consulta ordenada por fecha de creación (más recientes primero)
      const q = query(docsRef);
      
      // Ejecutar la consulta
      console.log('Ejecutando consulta...');
      const docsSnap = await getDocs(q);
      
      console.log(`Documentos encontrados: ${docsSnap.size}`);
      
      // Si no hay documentos, actualizar el estado y salir
      if (docsSnap.empty) {
        console.log('No se encontraron documentos en Firestore');
        setDocumentos([]);
        setDocumentosRecientes([]);
        setDocumentosDestacados([]);
        setEstadisticas({
          totalDocumentos: 0,
          totalDescargas: 0,
          totalVistas: 0,
          totalUsuarios: 0
        });
        setCargando(false);
        return;
      }
      
      // Procesar los documentos
      console.log('Procesando documentos...');
      const docsData: Documento[] = [];
      
      docsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`Procesando documento: ${doc.id}, título: ${data.titulo || 'Sin título'}`);
        
        // Manejar fechaCreacion de manera más robusta
        let fechaCreacion = new Date().toISOString();
        if (data.fechaCreacion) {
          try {
            // Si es un timestamp de Firestore
            if (data.fechaCreacion.toDate) {
              fechaCreacion = data.fechaCreacion.toDate().toISOString();
              console.log(`Fecha convertida desde Timestamp: ${fechaCreacion}`);
            } 
            // Si es una cadena ISO
            else if (typeof data.fechaCreacion === 'string') {
              fechaCreacion = new Date(data.fechaCreacion).toISOString();
              console.log(`Fecha convertida desde string: ${fechaCreacion}`);
            }
            // Si es un objeto Date
            else if (data.fechaCreacion instanceof Date) {
              fechaCreacion = data.fechaCreacion.toISOString();
              console.log(`Fecha convertida desde Date: ${fechaCreacion}`);
            }
          } catch (error) {
            console.error('Error al procesar fechaCreacion:', error);
            fechaCreacion = new Date().toISOString();
            console.log(`Usando fecha actual por error: ${fechaCreacion}`);
          }
        } else {
          console.log(`No hay fechaCreacion, usando fecha actual: ${fechaCreacion}`);
        }
        
        // Manejar usuario de manera más robusta
        let nombreUsuario = 'Usuario anónimo';
        
        // Intentar obtener el nombre del usuario
        if (data.usuario && data.usuario.nombre) {
          nombreUsuario = data.usuario.nombre;
        } 
        // Si no hay nombre pero hay email, usar la parte antes del @
        else if (data.usuario && data.usuario.email && data.usuario.email !== 'sin-email@ejemplo.com') {
          const emailParts = data.usuario.email.split('@');
          if (emailParts.length > 0) {
            nombreUsuario = emailParts[0];
          }
        }
        // Si hay ID de usuario pero no hay nombre ni email, usar un nombre genérico con parte del ID
        else if (data.usuario && data.usuario.id) {
          nombreUsuario = 'Usuario ' + data.usuario.id.substring(0, 5);
        }
        
        const usuario = {
          nombre: nombreUsuario,
          id: data.usuario?.id || `anon_${Math.random().toString(36).substr(2, 9)}`,
          email: data.usuario?.email || 'sin-email@ejemplo.com'
        };
        
        // Crear objeto de documento
        const documento: Documento = {
          id: doc.id,
          titulo: data.titulo || 'Sin título',
          descripcion: data.descripcion || 'Sin descripción',
          categoria: data.categoria || 'otros',
          fechaCreacion,
          descargas: typeof data.descargas === 'number' ? data.descargas : 0,
          vistas: typeof data.vistas === 'number' ? data.vistas : 0,
          destacado: Boolean(data.destacado),
          url: data.url || '#',
          usuario: usuario
        };
        
        // Añadir documento al array
        docsData.push(documento);
      });
      
      console.log(`Total de documentos procesados: ${docsData.length}`);
      
      // Ordenar documentos por fecha de creación (más recientes primero)
      docsData.sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion);
        const fechaB = new Date(b.fechaCreacion);
        return fechaB.getTime() - fechaA.getTime();
      });
      
      // Actualizar el estado con los nuevos documentos
      console.log('Actualizando estado con los documentos procesados...');
      setDocumentos(docsData);
      
      // Actualizar estadísticas
      const stats = {
        totalDocumentos: docsData.length,
        totalDescargas: docsData.reduce((acc, doc) => acc + doc.descargas, 0),
        totalVistas: docsData.reduce((acc, doc) => acc + doc.vistas, 0),
        totalUsuarios: new Set(docsData.map(doc => doc.usuario.id)).size
      };
      
      console.log('Actualizando estadísticas:', stats);
      setEstadisticas(stats);
      
      // Actualizar documentos destacados
      const destacados = docsData.filter(doc => doc.destacado).slice(0, 5);
      console.log(`Documentos destacados: ${destacados.length}`);
      setDocumentosDestacados(destacados);
      
      // Actualizar documentos recientes (ya están ordenados)
      const recientes = docsData.slice(0, 5);
      console.log(`Documentos recientes: ${recientes.length}`);
      console.log('Títulos de documentos recientes:', recientes.map(doc => doc.titulo).join(', '));
      setDocumentosRecientes(recientes);
      
      // Actualizar conteo de documentos por categoría
      const conteoCategoria: Record<string, number> = {};
      docsData.forEach(doc => {
        const categoria = doc.categoria;
        conteoCategoria[categoria] = (conteoCategoria[categoria] || 0) + 1;
      });
      
      // Actualizar el conteo en las categorías
      setCategorias(prevCategorias => {
        return prevCategorias.map(cat => ({
          ...cat,
          documentos: conteoCategoria[cat.id] || 0
        }));
      });
      
      console.log('Carga de datos completada con éxito');
      
    } catch (error) {
      console.error('Error al cargar datos desde Firestore:', error);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      toast.error('Error al cargar los datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  };

  // Función para navegar el carrusel
  const navigateCarousel = (direction: 'prev' | 'next') => {
    const maxSlide = documentosRecientes.length - 1; // Ajustamos para mostrar un documento a la vez
    
    if (direction === 'prev') {
      setCurrentSlide((prev) => (prev === 0 ? maxSlide : prev - 1));
    } else {
      setCurrentSlide((prev) => (prev === maxSlide ? 0 : prev + 1));
    }
  };

  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setResultadosBusqueda(documentos); // 🔥 Si no hay búsqueda, mostrar todos
      setMostrandoResultados(false);
      return;
    }
  
    // 🔍 Filtrar documentos por título o descripción
    const documentosFiltrados = documentos.filter((doc) => 
      doc.titulo.toLowerCase().includes(query.toLowerCase()) ||
      doc.descripcion.toLowerCase().includes(query.toLowerCase())
    );
  
    setResultadosBusqueda(documentosFiltrados);
    setMostrandoResultados(true);
    setPaginaActual(1); // 🔄 Reiniciar paginación
  };

  const navigate = useNavigate();

  // Variable para controlar si estamos navegando
  const [isNavigating, setIsNavigating] = useState(false);

  // Modificamos handleCategoriaClick para indicar que estamos navegando
  const handleCategoriaClick = (categoria: string) => {
    // Indicamos que estamos navegando para evitar que se quite el desenfoque
    setIsNavigating(true);
    
    // Pero quitamos el desenfoque después de un breve retraso
    setTimeout(() => {
      document.body.classList.remove('blur-background');
      setIsNavigating(false);
    }, 300);
    
    console.log('Categoría seleccionada:', categoria);
    switch (categoria) {
      case 'universidad':
        navigate('/universidad');
        break;
      case 'grado-superior':
        navigate('/grado-superior');
        break;
      case 'bachillerato':
        navigate('/bachillerato');
        break;
      case 'profesional':
        navigate('/profesional');
        break;
      case 'otros':
        navigate('/otros');
        break;
      default:
        setCategoriaSeleccionada(categoria);
        aplicarFiltros();
    }
  };

  const handleFileChange = (e: InputChangeEvent) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoDocumento(e.target.files[0]);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArchivoDocumento(e.dataTransfer.files[0]);
    }
  };

  const handleSubmitDocumento = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!tituloDocumento || !descripcionDocumento || !categoriaDocumento || !archivoDocumento) {
      toast.error('Por favor completa todos los campos y sube un archivo');
      return;
    }

    setSubiendoDocumento(true);
    const toastId = toast.loading('Subiendo documento...', { id: 'upload-toast' });

    try {
      // 1. Verificar usuario autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Debes iniciar sesión para subir documentos');
        setSubiendoDocumento(false);
        return;
      }

      // Obtener el nombre del usuario actual
      let nombreUsuario = currentUser.displayName;
      
      // Si no hay displayName, intentar usar el email o un nombre por defecto
      if (!nombreUsuario) {
        if (currentUser.email) {
          // Usar la parte del email antes del @ como nombre de usuario
          nombreUsuario = currentUser.email.split('@')[0];
        } else {
          nombreUsuario = 'Usuario ' + currentUser.uid.substring(0, 5);
        }
      }

      // 2. Validar el tamaño y tipo del archivo
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (archivoDocumento.size > MAX_FILE_SIZE) {
        toast.error('El archivo es demasiado grande. El tamaño máximo es 10MB.');
        setSubiendoDocumento(false);
        return;
      }

      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(archivoDocumento.type)) {
        toast.error('Tipo de archivo no permitido. Por favor, sube un documento en formato PDF, Word, Excel, PowerPoint o texto.');
        setSubiendoDocumento(false);
        return;
      }

      // 3. Crear una referencia al archivo en Storage con la URL correcta
      const fileName = `${Date.now()}_${archivoDocumento.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Usar la URL correcta del bucket
      const storageRef = ref(storage, `documentos/${currentUser.uid}/${fileName}`);
      
// 4. Configurar metadatos para el archivo
const metadata = {
  contentType: archivoDocumento.type,
  contentDisposition: `inline; filename="${archivoDocumento.name}"`, // <-- AÑADE ESTA LÍNEA
  customMetadata: {
    'uploadedBy': currentUser.uid,
    'fileName': archivoDocumento.name,
    'fileSize': archivoDocumento.size.toString(),
    'uploadDate': new Date().toISOString(),
    'categoria': categoriaDocumento
  }
};


      // 5. Subir el archivo directamente sin conversión a ArrayBuffer
      console.log('Iniciando subida del archivo...');
      await uploadBytes(storageRef, archivoDocumento, metadata);
      console.log('Archivo subido correctamente');
      
      // 6. Obtener la URL de descarga
      console.log('Obteniendo URL de descarga...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('URL de descarga obtenida:', downloadURL);

      // 7. Guardar los metadatos en Firestore
      const docData = {
        titulo: tituloDocumento,
        descripcion: descripcionDocumento,
        categoria: categoriaDocumento,
        fechaCreacion: serverTimestamp(),
        descargas: 0,
        vistas: 0,
        destacado: false,
        url: downloadURL,
        nombreArchivo: archivoDocumento.name,
        tipoArchivo: archivoDocumento.type,
        tamanoArchivo: archivoDocumento.size,
        usuario: {
          nombre: nombreUsuario,
          id: currentUser.uid,
          email: currentUser.email || 'sin-email@ejemplo.com'
        }
      };

      console.log('Guardando metadatos en Firestore...');
      await addDoc(collection(db, 'documentos'), docData);
      console.log('Metadatos guardados correctamente');

      // 8. Actualizar la UI
      toast.dismiss(toastId);
      toast.success('¡Documento subido correctamente!');
      setMostrarFormulario(false);
      
      // 9. Limpiar el formulario
      setTituloDocumento('');
      setDescripcionDocumento('');
      setCategoriaDocumento('');
      setArchivoDocumento(null);
      
      // 10. Actualizar las categorías (esto se hará automáticamente gracias al listener de Firestore)
      // Forzar una recarga inmediata de los datos para actualizar el carrusel
      cargarDatos();
      
    } catch (error) {
      console.error('Error al subir documento:', error);
      toast.dismiss(toastId);
      
      // Mostrar mensaje de error más específico
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          toast.error('Error de permisos CORS. Verifica la configuración del bucket de Firebase Storage.');
          console.error('Solución CORS: Verifica que estás usando la URL correcta del bucket y que las reglas CORS están configuradas correctamente.');
        } else if (error.message.includes('storage/unauthorized')) {
          toast.error('No tienes permisos para subir archivos. Verifica las reglas de seguridad de Firebase Storage.');
        } else if (error.message.includes('storage/quota-exceeded')) {
          toast.error('Se ha excedido la cuota de almacenamiento.');
        } else if (error.message.includes('storage/retry-limit-exceeded')) {
          toast.error('Se ha excedido el límite de intentos. Comprueba tu conexión a internet.');
        } else if (error.message.includes('storage/invalid-argument')) {
          toast.error('Argumento inválido. Verifica el archivo que estás subiendo.');
        } else {
          toast.error(`Error: ${error.message}`);
        }
      } else {
        toast.error('Error desconocido al subir el documento. Verifica la consola para más detalles.');
      }
    } finally {
      setSubiendoDocumento(false);
    }
  };

  // Corregir los errores de linter para los manejadores de eventos
  const handleTituloChange = (e: InputChangeEvent) => {
    setTituloDocumento(e.target.value);
  };

  const handleDescripcionChange = (e: TextAreaChangeEvent) => {
    setDescripcionDocumento(e.target.value);
  };

  const handleCategoriaChange = (e: SelectChangeEvent) => {
    setCategoriaDocumento(e.target.value);
  };

  // Función para manejar la búsqueda
  const handleBusqueda = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lógica de búsqueda
  };

  // Función para manejar el cambio en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lógica de cambio en la búsqueda
  };

  const [paginaActual, setPaginaActual] = useState(1);
  const documentosPorPagina = 5; // Número de documentos a mostrar por página

  const indiceInicial = (paginaActual - 1) * documentosPorPagina;
  const documentosPaginados = resultadosBusqueda.slice(indiceInicial, indiceInicial + documentosPorPagina);

  const totalPaginas = Math.ceil(resultadosBusqueda.length / documentosPorPagina);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina > 0 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Función para borrar un documento
  const borrarDocumento = async (documento: Documento) => {
    try {
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, 'documentos', documento.id));
      // Eliminar el archivo de Firebase Storage
      const fileRef = ref(storage, `documentos/${documento.usuario.id}/${documento.nombreArchivo}`);
      await deleteObject(fileRef);
      toast.success('Documento borrado correctamente');
      // Recargar los datos
      cargarDatos();
    } catch (error) {
      console.error('Error al borrar el documento:', error);
      toast.error('Error al borrar el documento');
    }
  };

  // Función para abrir un documento y actualizar las vistas
  const abrirDocumento = async (docOrId: Documento | string) => {
    try {
      let documento: Documento | undefined;
      
      // Comprobar si el parámetro es un objeto o un ID
      if (typeof docOrId === 'string') {
        documento = documentos.find(doc => doc.id === docOrId);
      } else {
        documento = docOrId;
      }
      
      if (!documento) {
        toast.error('Documento no encontrado');
        return;
      }

      if (!documento.url) {
        toast.error('La URL del documento no está disponible');
        return;
      }
  
      const docRef = doc(db, 'documentos', documento.id);
      const nuevasVistas = (documento.vistas || 0) + 1;
  
      await updateDoc(docRef, { vistas: nuevasVistas });
  
      setDocumentos(prev => prev.map(d => d.id === documento?.id ? { ...d, vistas: nuevasVistas } : d));
  
      const urlVisualizacion = `${documento.url}?alt=media&response-content-disposition=inline`;
      window.open(urlVisualizacion, '_blank');
  
      toast.success('Documento abierto en una nueva pestaña');
    } catch (error) {
      console.error('Error al abrir documento:', error);
      toast.error('Error al visualizar el documento');
    }
  };
  


  // Mapea algunos content-types comunes a extensiones
const EXTENSION_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  // ... puedes ampliar con más tipos según tus necesidades ...
};

// Función robusta para descargar
const descargarDocumento = async (docOrId: Documento | string) => {
  try {
    let documento: Documento | undefined;
    
    // Comprobar si el parámetro es un objeto o un ID
    if (typeof docOrId === 'string') {
      documento = documentos.find(doc => doc.id === docOrId);
    } else {
      documento = docOrId;
    }
    
    if (!documento) {
      toast.error('Documento no encontrado');
      return;
    }

    if (!documento.url) {
      toast.error('No se encontró la URL del archivo');
      return;
    }

    const loadingToast = toast.loading('Descargando archivo...');

    const response = await fetch(documento.url);
    if (!response.ok) throw new Error('Fallo al obtener el archivo');

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || '';
    const EXTENSION_MAP: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
    };

    let extension = EXTENSION_MAP[contentType] || '';
    if (!extension && documento.nombreArchivo?.includes('.')) {
      extension = documento.nombreArchivo.split('.').pop() || 'bin';
    }

    const nombreBase = documento.titulo.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 50);
    const nombreFinal = `${nombreBase || 'documento'}.${extension || 'bin'}`;

    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = nombreFinal;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);

    await updateDoc(doc(db, 'documentos', documento.id), {
      descargas: (documento.descargas || 0) + 1
    });

    // Actualizar el estado local para reflejar el incremento de descargas
    setDocumentos(prevDocs => 
      prevDocs.map(d => d.id === documento?.id ? { ...d, descargas: (d.descargas || 0) + 1 } : d)
    );

    toast.dismiss(loadingToast);
    toast.success('Descarga completada');
  } catch (err) {
    console.error('Error al descargar:', err);
    toast.error('Error al forzar la descarga');
  }
};


  
  
  // Añadir función para aplicar filtros desde el panel de filtros
  const aplicarFiltros = () => {
    let documentosFiltrados = [...documentos];
    
    // Filtrar por categoría si hay una seleccionada
    if (categoriaSeleccionada) {
      documentosFiltrados = documentosFiltrados.filter(doc => doc.categoria === categoriaSeleccionada);
      console.log('Documentos filtrados por categoría:', documentosFiltrados);
    }
    
    // Ordenar según el criterio seleccionado
    switch (ordenarPor) {
      case 'recientes':
        documentosFiltrados.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
        break;
      case 'antiguos':
        documentosFiltrados.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
        break;
      case 'descargas':
        documentosFiltrados.sort((a, b) => b.descargas - a.descargas);
        break;
      case 'vistas':
        documentosFiltrados.sort((a, b) => b.vistas - a.vistas);
        break;
    }
    
    setResultadosBusqueda(documentosFiltrados);
    setMostrandoResultados(true);
    setPaginaActual(1); // Resetear a la primera página cuando se aplican filtros
  };

  // Modificar la función applyFilters para usar la nueva función aplicarFiltros
  const applyFilters = () => {
    aplicarFiltros();
  };

  // Función para activar el desenfoque del fondo
  const handleCategoryMouseEnter = () => {
    document.body.classList.add('blur-background');
  };

  // Función para desactivar el desenfoque del fondo
  const handleCategoryMouseLeave = () => {
    // Solo quitamos la clase si no se ha hecho clic en el botón
    if (!isNavigating) {
      document.body.classList.remove('blur-background');
    }
  };

  // Efecto para añadir un listener global para eliminar el blur al hacer clic
  useEffect(() => {
    const handleGlobalClick = () => {
      document.body.classList.remove('blur-background');
    };

    const handleBeforeUnload = () => {
      document.body.classList.remove('blur-background');
    };

    // Agregar listeners
    document.addEventListener('click', handleGlobalClick);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Limpiar al desmontar
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Limpiar la clase al desmontar el componente
      document.body.classList.remove('blur-background');
    };
  }, []);

  return (
    <div
    className="dashboard-container min-h-screen dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 centrado-principal"
    style={{
      border: 'none !important',
      boxShadow: 'none !important',
      backgroundColor: 'transparent !important',
      outline: 'none !important',
      margin: '0 !important',
      padding: '0 !important'
    }}
  >
      {/* Eliminar el botón flotante individual, ya que ahora usamos uno global */}
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6"
        style={{ 
          border: 'none !important', 
          boxShadow: 'none !important', 
          outline: 'none !important',
          backgroundColor: 'transparent !important'
        }}
      >
        {/* Barra de búsqueda mejorada */}
        <div className="flex justify-center items-center w-full">
          <SearchBar 
            placeholder="Buscar por título..." 
            onSearch={handleSearch}
            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl"
          />
        </div>

        {/* Resultados de búsqueda */}
        {mostrandoResultados && (
  <motion.div 
    initial={{ opacity: 0, y: -10 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.3 }}
    className="mt-6"
  >
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resultados de búsqueda</h2>
    {resultadosBusqueda.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resultadosBusqueda.map((doc) => (
          <div key={doc.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{doc.titulo.length > 10 ? doc.titulo.substring(0, 10) + '...' : doc.titulo}</h3>
            <p className="text-gray-600 dark:text-gray-400">{doc.descripcion.length > 10 ? doc.descripcion.substring(0, 10) + '...' : doc.descripcion}</p>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => abrirDocumento(doc)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
              >
                Ver
              </button>&nbsp;
              <button
                onClick={() => descargarDocumento(doc)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
              >
                Descargar
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        No se encontraron resultados.
      </p>
    )}
  </motion.div>
)}

        {/* Categorías mejoradas */}
        <motion.div 
          className="mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Botón de subir documento centrado - Separado de las categorías */}
          <div className="flex justify-center w-full mb-12">
            {!mostrarFormulario ? (
              <motion.button
                onClick={() => setMostrarFormulario(true)}
                className="mx-auto bg-blue-600 text-white rounded-lg px-5 py-2.5 shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center active:bg-blue-800"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <IconWrapper icon={FaUpload} size={18} className="mr-2" color="#ffffff" />
                <span className="font-medium">Subir documento</span>
              </motion.button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
              >
                {subiendoDocumento ? (
                  <div className="p-4 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                      Subiendo documento...
                    </p>
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={handleSubmitDocumento}>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:bg-gray-700 dark:text-white"
                        placeholder="Título del documento"
                        value={tituloDocumento}
                        onChange={handleTituloChange}
                        maxLength={20}
                        required
                      />
                    </div>
                    <p></p>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:bg-gray-700 dark:text-white"
                        placeholder="Descripción breve"
                        rows={2}
                        value={descripcionDocumento}
                        onChange={handleDescripcionChange}
                        required
                        maxLength={100}
                      />
                    </div>
                    <p></p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoría
                      </label>
                      <select 
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:bg-gray-700 dark:text-white"
                        value={categoriaDocumento}
                        onChange={handleCategoriaChange}
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
               
                      <div 
                        className={`border-2 border-dashed ${archivoDocumento ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-3 text-center hover:border-blue-500 transition-colors cursor-pointer`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                      >
                        {archivoDocumento ? (
                          <div className="text-center">

                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {archivoDocumento.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(archivoDocumento.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button
                              type="button"
                              className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchivoDocumento(null);
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="py-1">
                            <IconWrapper icon={FaUpload} size={16} className="mx-auto text-gray-400 dark:text-gray-500 mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Haz clic</span> o arrastra un archivo
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              PDF, Word, Excel (Máx. 10MB)
                            </p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={handleFileChange}
                           accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                    <p></p>
                    <div className="flex justify-end space-x-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                      >
                        Subir documento
                      </button>
                      
                    </div>
                    <p></p>
                    
                  </form>
                  
                )}
              </motion.div>
            )}
          </div>
          
          {/* Grid de categorías centrado - Separado del botón */}
          <div className="flex justify-center mx-auto px-4 w-full mt-6" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-4 max-w-6xl mx-auto" style={{ margin: '0 auto', width: '100%', maxWidth: '1200px', justifyContent: 'center' }}>
              {categorias.map((categoria) => {
                const Icon = categoria.icono;
                return (
                  <motion.button
                    key={categoria.id}
                    onClick={() => handleCategoriaClick(categoria.id)}
                    onMouseEnter={handleCategoryMouseEnter}
                    onMouseLeave={handleCategoryMouseLeave}
                    className={`p-6 rounded-lg shadow-sm hover:shadow-md flex flex-col items-center text-center transition-all duration-300 ${
                      categoriaSeleccionada === categoria.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 transform scale-105'
                        : 'bg-transparent dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border dark:border-gray-700'
                    }`}
                    style={{ 
                      width: '100%', 
                      height: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 auto'
                    }}
                    data-categoria={categoria.id}
                    aria-label={`Categoría ${categoria.nombre} - ${categoria.documentos} documentos`}
                    role="button"
                    whileHover={{ 
                      scale: categoriaSeleccionada === categoria.id ? 1.05 : 1.03,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300"
                      style={{ backgroundColor: `${categoria.color}20` }}
                      whileHover={{ rotate: 5 }}
                    >
                      <Icon size={28} color={categoria.color} />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-1">{categoria.nombre}</h3>
                    <motion.p 
                      className="text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mt-2 px-3 py-1 rounded-full"
                      whileHover={{ scale: 1.05 }}
                    >
                      {categoria.documentos} documentos
                    </motion.p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Estadísticas con gráficos */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          variants={containerVariants}
        >
          {/* Gráfico de barras */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Gráfico circular */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          
          </motion.div>
        </motion.div>

        {/* Documentos recientes - Carrusel infinito perfecto */}
        <motion.div 
          className="mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="w-full flex justify-center mb-6">
            <h2 className="text-2xl font-bold mb-6 py-2 text-center text-gray-800 dark:text-white" style={{
              borderBottom: '2px solid #3b82f6',
              borderTop: '2px solid #3b82f6',
              padding: '0.75rem 1rem',
              display: 'inline-block',
              borderRadius: '4px',
              textAlign: 'center',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.2)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))'
            }}>
              Documentos Recientes
            </h2>
          </div>
          
          {documentosRecientes && documentosRecientes.length > 0 ? (
            <>
              <div className="carousel-container-3d bg-transparent dark:bg-transparent shadow-lg rounded-lg w-full">
                <Carousel
                  cards={documentosRecientes.map(doc => ({
                    key: uuidv4(),
                    content: (
                      <Card 
                        documento={doc} 
                        onVerClick={() => abrirDocumento(doc)} 
                        onDescargarClick={() => descargarDocumento(doc)}
                        
                      />
                    )
                    
                  }))}
                  height="400px"
                  width="100%"
                  margin="0 auto"
                  offset={2}
                  
                  showArrows={true}
                />
               
              </div>
              
            </>
             
          ) : (
            <Box textAlign="center" my={6} p={4} bgcolor="rgba(255,255,255,0.8)" borderRadius={2}>
              <Typography variant="h6" mt={2} mb={1}>
                No hay documentos recientes disponibles.
              </Typography>
            </Box>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;