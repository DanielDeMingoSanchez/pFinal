import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Button, Card, CardContent, IconButton, Chip, useTheme, Fab, CircularProgress, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, Container, Tooltip } from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  LibraryBooks as DocsIcon,
  CloudDownload as DownloadIcon,
  Visibility as ViewIcon,
  Person as UserIcon,
  Add as AddIcon,
  School as SchoolIcon,
  BusinessCenter as WorkIcon,
  MenuBook as BookIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import useResponsive from '../hooks/useResponsive';

// Interfaces para los datos
interface Documento {
  id: string;
  titulo: string;
  categoria: string;
  descargas: number;
  vistas: number;
  fecha: string;
  usuario: string;
}

interface Categoria {
  id: string;
  nombre: string;
  icono: React.ReactNode;
}

interface Estadistica {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
}

const ResponsiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  // Estados para filtros y otros controles
  const [loading, setLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recientes' | 'populares'>('recientes');
  
  // Estados para almacenar datos de la API
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadistica[]>([]);
  
  // Cargar datos desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Ejemplo de llamadas a API que deberías implementar
        // const respDocumentos = await fetch('tu-api/documentos');
        // const documentosData = await respDocumentos.json();
        // setDocumentos(documentosData);
        
        // const respCategorias = await fetch('tu-api/categorias');
        // const categoriasData = await respCategorias.json();
        // Mapear categorías con sus iconos
        // const categoriasConIconos = categoriasData.map(cat => ({
        //   ...cat,
        //   icono: obtenerIconoPorCategoria(cat.id)
        // }));
        // setCategorias(categoriasConIconos);
        
        // Calcular estadísticas desde los datos
        // const estadisticasCalculadas = [
        //   { titulo: 'Documentos', valor: documentosData.length, icono: <DocsIcon color="primary" /> },
        //   { titulo: 'Descargas', valor: documentosData.reduce((acc, doc) => acc + doc.descargas, 0), icono: <DownloadIcon color="secondary" /> },
        //   ...otras estadísticas
        // ];
        // setEstadisticas(estadisticasCalculadas);
        
        // Simulación temporal de carga - REEMPLAZAR con datos reales
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);
  
  // Función auxiliar para obtener icono según categoría
  const obtenerIconoPorCategoria = (categoriaId: string): React.ReactNode => {
    switch (categoriaId) {
      case 'universidad':
        return <SchoolIcon />;
      case 'grado-superior':
      case 'bachillerato':
        return <BookIcon />;
      case 'profesional':
        return <WorkIcon />;
      default:
        return <CategoryIcon />;
    }
  };
  
  // Filtrar documentos por categoría
  const documentosFiltrados = selectedCategory
    ? documentos.filter(doc => doc.categoria.toLowerCase() === selectedCategory.toLowerCase())
    : documentos;
  
  // Ordenar documentos
  const documentosOrdenados = [...documentosFiltrados].sort((a, b) => {
    if (sortBy === 'recientes') {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    } else {
      return b.descargas - a.descargas;
    }
  });
  
  // Función para abrir un documento
  const abrirDocumento = (id: string) => {
    navigate(`/view/${id}`);
  };
  
  // Función para cambiar la categoría seleccionada
  const handleCategoryChange = (categoriaId: string | null) => {
    setSelectedCategory(categoriaId);
    if (isMobile) {
      setFilterDrawerOpen(false);
    }
  };
  
  // Renderizar el panel de filtros
  const renderFilterPanel = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">Filtros</Typography>
        {isMobile && (
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>Categorías</Typography>
      <List dense>
        <ListItem 
          button 
          selected={selectedCategory === null} 
          onClick={() => handleCategoryChange(null)}
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DocsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Todos" />
        </ListItem>
        
        {categorias.map((categoria) => (
          <ListItem 
            key={categoria.id}
            button 
            selected={selectedCategory === categoria.id} 
            onClick={() => handleCategoryChange(categoria.id)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {categoria.icono}
            </ListItemIcon>
            <ListItemText primary={categoria.nombre} />
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>Ordenar por</Typography>
      <List dense>
        <ListItem 
          button 
          selected={sortBy === 'recientes'} 
          onClick={() => setSortBy('recientes')}
          sx={{ borderRadius: 1 }}
        >
          <ListItemText primary="Más recientes" />
        </ListItem>
        <ListItem 
          button 
          selected={sortBy === 'populares'} 
          onClick={() => setSortBy('populares')}
          sx={{ borderRadius: 1 }}
        >
          <ListItemText primary="Más populares" />
        </ListItem>
      </List>
    </Box>
  );
  
  return (
    <Container maxWidth="xl" sx={{ pt: 2 }}>
      {/* Título y controles superiores */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Documentos
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: 1 
        }}>
          <Button 
            variant="outlined" 
            startIcon={<SearchIcon />}
            fullWidth={isMobile}
            onClick={() => navigate('/search')}
          >
            Buscar
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            fullWidth={isMobile}
            onClick={() => setFilterDrawerOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            Filtros
          </Button>
        </Box>
      </Box>
      
      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {estadisticas.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Card elevation={0} sx={{ 
              bgcolor: 'background.paper', 
              border: '1px solid', 
              borderColor: 'divider',
              height: '100%'
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                py: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                {stat.icono}
                <Typography variant={isMobile ? "h6" : "h5"} component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {stat.valor.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.titulo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Contenido principal con grid responsivo */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Panel de filtros en desktop (oculto en móvil y tablet) */}
        {!isMobile && !isTablet && (
          <Box sx={{ 
            width: 240, 
            flexShrink: 0, 
            display: { xs: 'none', md: 'block' },
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            height: 'fit-content',
            position: 'sticky',
            top: 88 // Navbar height + padding
          }}>
            {renderFilterPanel()}
          </Box>
        )}
        
        {/* Lista de documentos */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Chip de filtro seleccionado (solo visible si hay un filtro) */}
          {selectedCategory && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">Filtro:</Typography>
              <Chip 
                label={categorias.find(c => c.id === selectedCategory)?.nombre || selectedCategory} 
                onDelete={() => setSelectedCategory(null)}
                size="small"
              />
            </Box>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : documentosOrdenados.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8, 
              px: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h6" gutterBottom>
                No se encontraron documentos
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Intenta cambiar los filtros de búsqueda o añade nuevos documentos.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/add-document')}>
                Añadir documento
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {documentosOrdenados.map((doc) => (
                <Grid item xs={12} sm={6} md={4} lg={4} key={doc.id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    },
                    border: '1px solid',
                    borderColor: 'divider'
                  }} onClick={() => abrirDocumento(doc.id)}>
                    <CardContent sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: isMobile ? 2 : 3
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={doc.categoria} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(doc.fecha).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" component="h2" gutterBottom>
                        {doc.titulo}
                      </Typography>
                      
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {doc.usuario}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Tooltip title="Vistas">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ViewIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {doc.vistas}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Descargas">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <DownloadIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {doc.descargas}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
      
      {/* Botón flotante para añadir documentos (visible en todas las pantallas) */}
      <Fab
        color="primary"
        aria-label="añadir"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
        }}
        onClick={() => navigate('/add-document')}
      >
        <AddIcon />
      </Fab>
      
      {/* Drawer de filtros para móvil y tablet */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{
          display: { md: 'none' },
          '& .MuiDrawer-paper': { width: { xs: '80%', sm: 320 } },
        }}
      >
        {renderFilterPanel()}
      </Drawer>
    </Container>
  );
};

export default ResponsiveDashboard; 