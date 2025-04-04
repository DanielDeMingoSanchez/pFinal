import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Definir la interfaz para un documento
export interface Documento {
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

// Definir el estado para los documentos
interface DocumentsState {
  documentos: Documento[];
  documentosFiltrados: Documento[];
  documentosDestacados: Documento[];
  cargando: boolean;
  error: string | null;
  filtroCategoria: string | null;
  filtroTexto: string;
}

// Estado inicial
const initialState: DocumentsState = {
  documentos: [],
  documentosFiltrados: [],
  documentosDestacados: [],
  cargando: false,
  error: null,
  filtroCategoria: null,
  filtroTexto: ''
};

// Crear el slice
const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocumentos: (state, action: PayloadAction<Documento[]>) => {
      state.documentos = action.payload;
      state.documentosFiltrados = action.payload;
      state.documentosDestacados = action.payload.filter(doc => doc.destacado);
      state.cargando = false;
      state.error = null;
    },
    setCargando: (state, action: PayloadAction<boolean>) => {
      state.cargando = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.cargando = false;
    },
    filtrarPorCategoria: (state, action: PayloadAction<string | null>) => {
      state.filtroCategoria = action.payload;
      
      // Aplicar ambos filtros (categoría y texto)
      if (action.payload) {
        state.documentosFiltrados = state.documentos.filter(doc => 
          doc.categoria === action.payload && 
          (state.filtroTexto ? 
            doc.titulo.toLowerCase().includes(state.filtroTexto.toLowerCase()) || 
            doc.descripcion.toLowerCase().includes(state.filtroTexto.toLowerCase()) 
            : true)
        );
      } else {
        state.documentosFiltrados = state.documentos.filter(doc => 
          state.filtroTexto ? 
            doc.titulo.toLowerCase().includes(state.filtroTexto.toLowerCase()) || 
            doc.descripcion.toLowerCase().includes(state.filtroTexto.toLowerCase()) 
            : true
        );
      }
    },
    filtrarPorTexto: (state, action: PayloadAction<string>) => {
      state.filtroTexto = action.payload;
      
      // Si no hay texto de búsqueda, filtrar solo por categoría
      if (!action.payload) {
        if (state.filtroCategoria) {
          state.documentosFiltrados = state.documentos.filter(doc => 
            doc.categoria === state.filtroCategoria
          );
        } else {
          state.documentosFiltrados = state.documentos;
        }
        return;
      }
      
      // Aplicar ambos filtros (categoría y texto)
      const textoLower = action.payload.toLowerCase();
      state.documentosFiltrados = state.documentos.filter(doc => 
        (state.filtroCategoria ? doc.categoria === state.filtroCategoria : true) &&
        (doc.titulo.toLowerCase().includes(textoLower) || 
         doc.descripcion.toLowerCase().includes(textoLower))
      );
    },
    limpiarFiltros: (state) => {
      state.filtroCategoria = null;
      state.filtroTexto = '';
      state.documentosFiltrados = state.documentos;
    }
  },
});

// Exportar las acciones
export const { 
  setDocumentos, 
  setCargando, 
  setError, 
  filtrarPorCategoria,
  filtrarPorTexto,
  limpiarFiltros
} = documentsSlice.actions;

// Exportar el reducer
export default documentsSlice.reducer; 