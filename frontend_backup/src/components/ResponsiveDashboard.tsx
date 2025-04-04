import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Button, Card, CardContent, IconButton, Chip, useMediaQuery, useTheme, Fab, CircularProgress, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, Container, Tooltip } from '@mui/material';
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

const ResponsiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  // Estados para filtros y otros controles
  const [loading, setLoading] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recientes' | 'populares'>('recientes');
  
  // Simulación de datos para mostrar (reemplazar con datos reales de tu aplicación)
  const [documents, setDocuments] = useState([
    { 
      id: '1', 
      title: 'Guía de Estudio Historia', 
      category: 'Universidad',
      downloads: 124,
      views: 356,
      date: '2023-12-15',
      userName: 'María García'
    },
    { 
      id: '2', 
      title: 'Ejercicios Matemáticas Avanzadas', 
      category: 'Bachillerato',
      downloads: 87,
      views: 215,
      date: '2023-11-28',
      userName: 'Juan López'
    },
    { 
      id: '3', 
      title: 'Manual Técnico Redes', 
      category: 'Grado Superior',
      downloads: 192,
      views: 430,
      date: '2024-01-03',
      userName: 'Carlos Martínez'
    },
    { 
      id: '4', 
      title: 'Apuntes Psicología Social', 
      category: 'Universidad',
      downloads: 103,
      views: 289,
      date: '2023-12-20',
      userName: 'Ana Ruiz'
    },
    { 
      id: '5', 
      title: 'Proyecto Final Programación', 
      category: 'Grado Superior',
      downloads: 156,
      views: 310,
      date: '2024-02-15',
      userName: 'Pablo Sánchez'
    },
    { 
      id: '6', 
      title: 'CV Profesional Modelo', 
      category: 'Profesional',
      downloads: 198,
      views: 412,
      date: '2024-01-25',
      userName: 'Elena Domínguez'
    }
  ]);
  
  // Categorías disponibles
  const categories = [
    { id: 'universidad', name: 'Universidad', icon: <SchoolIcon /> },
    { id: 'grado-superior', name: 'Grado Superior', icon: <BookIcon /> },
    { id: 'bachillerato', name: 'Bachillerato', icon: <BookIcon /> },
    { id: 'profesional', name: 'Profesional', icon: <WorkIcon /> },
    { id: 'otros', name: 'Otros', icon: <CategoryIcon /> }
  ];
  
  // Estadísticas para mostrar
  const stats = [
    { title: 'Documentos', value: documents.length, icon: <DocsIcon color="primary" /> },
    { title: 'Descargas', value: documents.reduce((acc, doc) => acc + doc.downloads, 0), icon: <DownloadIcon color="secondary" /> },
    { title: 'Vistas', value: documents.reduce((acc, doc) => acc + doc.views, 0), icon: <ViewIcon style={{ color: '#10B981' }} /> },
    { title: 'Usuarios', value: new Set(documents.map(doc => doc.userName)).size, icon: <UserIcon style={{ color: '#8B5CF6' }} /> }
  ];
  
  // Simulamos la carga de documentos
  useEffect(() => {
    setLoading(true);
    // Simular carga
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filtrar documentos por categoría
  const filteredDocuments = selectedCategory
    ? documents.filter(doc => doc.category.toLowerCase() === selectedCategory.toLowerCase())
    : documents;
  
  // Ordenar documentos
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'recientes') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return b.downloads - a.downloads;
    }
  });
  
  // Función para abrir un documento
  const openDocument = (id: string) => {
    navigate(`/view/${id}`);
  };
  
  // Función para cambiar la categoría seleccionada
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
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
        
        {categories.map((category) => (
          <ListItem 
            key={category.id}
            button 
            selected={selectedCategory === category.id} 
            onClick={() => handleCategoryChange(category.id)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {category.icon}
            </ListItemIcon>
            <ListItemText primary={category.name} />
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
        {stats.map((stat, index) => (
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
                {stat.icon}
                <Typography variant={isMobile ? "h6" : "h5"} component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {stat.value.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
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
                label={categories.find(c => c.id === selectedCategory)?.name || selectedCategory} 
                onDelete={() => setSelectedCategory(null)}
                size="small"
              />
            </Box>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : sortedDocuments.length === 0 ? (
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
              <Button variant="contained" startIcon={<AddIcon />}>
                Añadir documento
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {sortedDocuments.map((doc) => (
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
                  }} onClick={() => openDocument(doc.id)}>
                    <CardContent sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: isMobile ? 2 : 3
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={doc.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(doc.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" component="h2" gutterBottom>
                        {doc.title}
                      </Typography>
                      
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {doc.userName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Tooltip title="Vistas">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ViewIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {doc.views}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Descargas">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <DownloadIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {doc.downloads}
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