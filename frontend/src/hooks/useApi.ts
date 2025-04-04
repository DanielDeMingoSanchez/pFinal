import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

// Definir la URL base de la API desde variables de entorno o configuración
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Crear una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos para el hook
interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (config?: AxiosRequestConfig) => Promise<AxiosResponse<T> | null>;
}

// Interceptor para agregar el token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores comunes
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // El servidor respondió con un código de estado diferente de 2xx
      switch (error.response.status) {
        case 401:
          // Redirigir al login si hay un error de autenticación
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
          break;
        case 403:
          toast.error('No tiene permisos para realizar esta acción.');
          break;
        case 500:
          toast.error('Error en el servidor. Intente nuevamente más tarde.');
          break;
        default:
          // Mostrar mensaje de error específico si está disponible
          const errorMessage = 
            error.response.data?.message || 
            'Ha ocurrido un error. Por favor intente nuevamente.';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      toast.error('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    } else {
      // Error en la configuración de la solicitud
      toast.error('Error al procesar la solicitud.');
    }
    return Promise.reject(error);
  }
);

/**
 * Hook personalizado para realizar peticiones HTTP
 * @param method Método HTTP (GET, POST, PUT, DELETE)
 * @param url Endpoint de la API
 * @param initialData Datos iniciales (opcional)
 * @param immediateExecute Si debe ejecutarse inmediatamente
 * @param initialConfig Configuración inicial de Axios (opcional)
 */
function useApi<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  initialData: T | null = null,
  immediateExecute = false,
  initialConfig: AxiosRequestConfig = {}
): ApiResponse<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediateExecute);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (config: AxiosRequestConfig = {}): Promise<AxiosResponse<T> | null> => {
      setLoading(true);
      setError(null);

      try {
        const mergedConfig = { ...initialConfig, ...config };
        let response: AxiosResponse<T>;

        switch (method) {
          case 'GET':
            response = await apiClient.get<T>(url, mergedConfig);
            break;
          case 'POST':
            response = await apiClient.post<T>(url, mergedConfig.data, mergedConfig);
            break;
          case 'PUT':
            response = await apiClient.put<T>(url, mergedConfig.data, mergedConfig);
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(url, mergedConfig);
            break;
          default:
            throw new Error(`Método HTTP no soportado: ${method}`);
        }

        setData(response.data);
        setLoading(false);
        return response;
      } catch (err) {
        setLoading(false);
        const apiError = err as Error;
        setError(apiError);
        return null;
      }
    },
    [method, url, initialConfig]
  );

  // Ejecutar inmediatamente si se solicita
  useState(() => {
    if (immediateExecute) {
      execute();
    }
  });

  return { data, loading, error, execute };
}

export default useApi;
export { apiClient }; 