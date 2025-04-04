import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Grid, 
  Typography, 
  Box, 
  CircularProgress, 
  Container, 
  Paper, 
  Divider, 
  Chip,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import DocumentoCard from './ui/DocumentoCard';
import SearchBar from './ui/SearchBar';
import { BiSearch } from 'react-icons/bi';
import { FiFilter, FiBookmark } from 'react-icons/fi';
import { RiFileListLine } from 'react-icons/ri';

interface Documento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
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

const Search: React.FC = () => {
  const [results, setResults] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [totalResults, setTotalResults] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Extraer el término de búsqueda de la URL cuando se carga el componente
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
      searchDocuments(queryParam);
    } else {
      fetchRecentDocuments();
    }
  }, [location.search]);

  // Función para obtener documentos recientes si no hay búsqueda
  const fetchRecentDocuments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'documentos'),
        orderBy('fechaCreacion', 'desc'),
        limit(12)
      );
      
      const querySnapshot = await getDocs(q);
      const docs: Documento[] = [];
      const uniqueCategories = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Documento, 'id'>;
        docs.push({
          id: doc.id,
          ...data
        });
        
        // Acumular categorías únicas
        if (data.categoria) {
          uniqueCategories.add(data.categoria);
        }
      });
      
      setResults(docs);
      setTotalResults(docs.length);
      setCategories(Array.from(uniqueCategories));
    } catch (error) {
      console.error('Error al obtener documentos recientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para realizar la búsqueda
  const searchDocuments = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    try {
      // Consulta a Firestore para buscar documentos que coincidan con el término
      const q = query(
        collection(db, 'documentos'),
        orderBy('fechaCreacion', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const docs: Documento[] = [];
      const uniqueCategories = new Set<string>();
      
      // Filtrado manual para buscar coincidencias en varios campos
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Documento, 'id'>;
        const lowerTerm = term.toLowerCase();
        
        // Verificar si el término de búsqueda coincide con alguno de los campos
        if (
          data.titulo?.toLowerCase().includes(lowerTerm) ||
          data.descripcion?.toLowerCase().includes(lowerTerm) ||
          data.categoria?.toLowerCase().includes(lowerTerm) ||
          data.subcategoria?.toLowerCase().includes(lowerTerm) ||
          data.usuario?.nombre?.toLowerCase().includes(lowerTerm)
        ) {
          docs.push({
            id: doc.id,
            ...data
          });
          
          // Acumular categorías únicas de los resultados
          if (data.categoria) {
            uniqueCategories.add(data.categoria);
          }
        }
      });

      setResults(docs);
      setTotalResults(docs.length);
      setCategories(Array.from(uniqueCategories));
    } catch (error) {
      console.error('Error al buscar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar nueva búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Actualizar la URL con el nuevo término de búsqueda
    navigate(`/search?q=${encodeURIComponent(term)}`);
    // Realizar la búsqueda
    searchDocuments(term);
    // Limpiar filtros de categoría al hacer una nueva búsqueda
    setSelectedCategories([]);
  };

  // Filtrar resultados por categoría seleccionada
  const getFilteredResults = () => {
    if (selectedCategories.length === 0) {
      return results;
    }
    return results.filter(doc => selectedCategories.includes(doc.categoria));
  };

  // Manejar selección de categoría
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const filteredResults = getFilteredResults();

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)', 
        backgroundColor: 'transparent',
        pt: 3, 
        pb: 8,
        position: 'relative'
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '250px',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(180deg, rgba(22,28,36,0.6) 0%, rgba(22,28,36,0) 100%)' 
            : 'linear-gradient(180deg, rgba(232,244,253,0.5) 0%, rgba(232,244,253,0) 100%)',
          zIndex: -1
        }}
      />
      
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700, 
              mt: 2,
              color: theme.palette.mode === 'dark' ? 'white' : 'text.primary' 
            }}
          >
            Busca entre miles de documentos
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Encuentra rápidamente documentos por título, descripción, categoría o autor
          </Typography>

          {/* Barra de búsqueda */}
          <Box sx={{ maxWidth: 700, mx: 'auto', mb: 2 }}>
            <SearchBar 
              placeholder="Búsqueda global de documentos..."
              onSearch={handleSearch}
              initialQuery={searchTerm}
              className="w-full shadow-md"
            />
          </Box>

          {/* Sugerencias de búsqueda populares */}
          {!searchTerm && (
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {['Apuntes', 'Universidad', 'Grado Superior', 'Bachillerato', 'Profesional'].map((tag) => (
                <Chip 
                  key={tag}
                  label={tag}
                  onClick={() => handleSearch(tag)}
                  sx={{ 
                    borderRadius: '16px',
                    '&:hover': { opacity: 0.8 },
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Contenido principal */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Sidebar con filtros */}
          {(categories.length > 0 && !loading) && (
            <Box 
              component={Paper} 
              elevation={0}
              sx={{ 
                width: { xs: '100%', md: 260 },
                height: 'fit-content',
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)'
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <FiFilter style={{ marginRight: 8 }} /> Filtrar por categoría
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map(category => (
                  <Chip
                    key={category}
                    label={category}
                    color={selectedCategories.includes(category) ? 'primary' : 'default'}
                    onClick={() => handleCategoryToggle(category)}
                    variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                    sx={{ 
                      justifyContent: 'flex-start',
                      borderRadius: '12px'
                    }}
                  />
                ))}
              </Box>
              
              {selectedCategories.length > 0 && (
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => setSelectedCategories([])}
                  sx={{ mt: 2, fontSize: '0.8rem' }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Box>
          )}

          {/* Resultados */}
          <Box sx={{ flexGrow: 1 }}>
            {/* Resultados de la búsqueda */}
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
              </Box>
            ) : searchTerm ? (
              <>
                <Box 
                  sx={{ 
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1
                  }}
                >
                  <Typography variant="h6">
                    {totalResults} resultado{totalResults !== 1 ? 's' : ''} para "{searchTerm}"
                    {selectedCategories.length > 0 && ` (${filteredResults.length} filtrados)`}
                  </Typography>
                  
                  {/* Acciones adicionales */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => navigate('/documentos')}
                      startIcon={<RiFileListLine />}
                      sx={{ 
                        borderRadius: '20px',
                        textTransform: 'none'
                      }}
                    >
                      Mis documentos
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {filteredResults.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredResults.map((documento) => (
                      <Grid item xs={12} sm={6} md={4} key={documento.id}>
                        <DocumentoCard documento={documento} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      borderRadius: 2
                    }}
                  >
                    <BiSearch size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <Typography variant="h6">
                      No se encontraron documentos que coincidan con "{searchTerm}"
                      {selectedCategories.length > 0 && " y los filtros seleccionados"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Intenta con otros términos o navega por las categorías disponibles
                    </Typography>
                    {selectedCategories.length > 0 && (
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => setSelectedCategories([])}
                        sx={{ mt: 2 }}
                      >
                        Quitar filtros
                      </Button>
                    )}
                  </Paper>
                )}
              </>
            ) : (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <FiBookmark style={{ marginRight: 8 }} /> Documentos recientes
                  </Typography>
                  <Divider sx={{ mt: 1, mb: 3 }} />
                </Box>

                <Grid container spacing={3}>
                  {results.map((documento) => (
                    <Grid item xs={12} sm={6} md={4} key={documento.id}>
                      <DocumentoCard documento={documento} />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Search;