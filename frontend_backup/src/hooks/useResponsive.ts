import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveOptions {
  initialBreakpoint?: Breakpoint;
  debounceDelay?: number;
}

const breakpoints = {
  xs: 375, // Extra small devices (phones)
  sm: 640, // Small devices (large phones)
  md: 768, // Medium devices (tablets)
  lg: 1024, // Large devices (desktops)
  xl: 1280, // Extra large devices (large desktops)
  '2xl': 1536, // Extra extra large devices
};

/**
 * Hook para manejar la responsividad en la aplicación
 * Proporciona información sobre el tamaño de pantalla actual y la orientación
 */
function useResponsive(options: ResponsiveOptions = {}) {
  const {
    initialBreakpoint = 'md',
    debounceDelay = 200,
  } = options;

  // Estados para el tamaño actual de la ventana
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : breakpoints[initialBreakpoint],
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Estado para el debounce de resize
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Orientación
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    windowSize.width > windowSize.height ? 'landscape' : 'portrait'
  );

  // Breakpoint actual
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(
    Object.entries(breakpoints)
      .reverse()
      .find(([_, width]) => windowSize.width >= width)?.[0] as Breakpoint || initialBreakpoint
  );

  // Detección de dispositivo móvil
  const [isMobile, setIsMobile] = useState(windowSize.width < breakpoints.md);
  const [isTablet, setIsTablet] = useState(
    windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg
  );
  const [isDesktop, setIsDesktop] = useState(windowSize.width >= breakpoints.lg);

  // Escuchar cambios en el tamaño de ventana
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Limpiar cualquier timeout existente
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Establecer un nuevo timeout para debounce
      setDebounceTimeout(
        setTimeout(() => {
          const width = window.innerWidth;
          const height = window.innerHeight;

          // Actualizar tamaño de ventana
          setWindowSize({ width, height });

          // Actualizar orientación
          setOrientation(width > height ? 'landscape' : 'portrait');

          // Actualizar breakpoint actual
          const newBreakpoint = Object.entries(breakpoints)
            .reverse()
            .find(([_, breakpointWidth]) => width >= breakpointWidth)?.[0] as Breakpoint || 'xs';
          setCurrentBreakpoint(newBreakpoint);

          // Actualizar flags de dispositivo
          setIsMobile(width < breakpoints.md);
          setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
          setIsDesktop(width >= breakpoints.lg);
        }, debounceDelay)
      );
    };

    // Añadir event listener
    window.addEventListener('resize', handleResize);

    // Ejecutar una vez para establecer valores iniciales
    handleResize();

    // Limpiar event listener al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceDelay]);

  // Helpers para comprobar breakpoints
  const isBreakpoint = (bp: Breakpoint) => currentBreakpoint === bp;
  const isGreaterThan = (bp: Breakpoint) => windowSize.width >= breakpoints[bp];
  const isLessThan = (bp: Breakpoint) => windowSize.width < breakpoints[bp];

  return {
    windowSize,
    orientation,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isBreakpoint,
    isGreaterThan,
    isLessThan,
    breakpoints,
  };
}

export default useResponsive; 