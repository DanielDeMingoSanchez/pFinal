import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente que captura errores de JavaScript en cualquier componente hijo
 * y muestra una UI de fallback en lugar de colapsar toda la aplicación.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Puedes registrar el error en un servicio de reporte de errores
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    // Aquí podrías enviar el error a un servicio como Sentry, LogRocket, etc.
    // Si tienes configurado algún servicio de monitoreo de errores
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI personalizada de fallback
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-red-700 mb-4">
              Algo salió mal
            </h2>
            <p className="text-gray-700 mb-4">
              Ha ocurrido un error inesperado en la aplicación.
            </p>
            <div className="bg-white p-3 rounded border border-red-100 text-left overflow-auto max-h-[150px] mb-4">
              <pre className="text-xs text-red-800">
                {this.state.error?.message || 'Error desconocido'}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 