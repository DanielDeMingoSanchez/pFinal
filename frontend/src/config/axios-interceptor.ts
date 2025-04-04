import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Crear una instancia de axios con configuración base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor de solicitudes
axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Obtener el token desde localStorage
    const token = localStorage.getItem('authToken');
    
    // Si existe un token, agregarlo a los headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Puedes agregar lógica adicional aquí (como añadir timestamps, IDs de correlación, etc.)
    
    return config;
  },
  (error: AxiosError) => {
    // Manejar errores en la solicitud
    console.error('Error en la solicitud HTTP:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Puedes procesar todas las respuestas exitosas aquí
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // La solicitud fue realizada y el servidor respondió con un código de estado
      // que cae fuera del rango 2xx
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 401:
          // No autorizado - Redirigir al login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Solo redirigir si no estamos ya en la página de login
          if (window.location.pathname !== '/login') {
            toast.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Prohibido - No tiene permisos
          toast.error('No tiene permisos para realizar esta acción.');
          break;
          
        case 404:
          // No encontrado
          toast.error('El recurso solicitado no existe.');
          break;
          
        case 422:
          // Error de validación
          if (data.message) {
            toast.error(data.message);
          } else {
            toast.error('Error en los datos enviados.');
          }
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Errores del servidor
          toast.error('Error en el servidor. Por favor, intente más tarde.');
          break;
          
        default:
          // Otros errores
          if (data.message) {
            toast.error(data.message);
          } else {
            toast.error('Ha ocurrido un error en la aplicación.');
          }
      }
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      toast.error('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    } else {
      // Algo sucedió en el proceso de configuración de la solicitud que desencadenó un error
      toast.error('Error al procesar la solicitud.');
    }
    
    // Logging del error para depuración
    console.error('Error en API:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Rechazar la promesa para propagar el error
    return Promise.reject(error);
  }
);

export default axiosInstance; 