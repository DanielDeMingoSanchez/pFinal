/**
 * Funciones de optimización para experiencia táctil en móviles
 * Mejora el comportamiento de scroll en dispositivos táctiles
 */

// Función principal para aplicar optimizaciones táctiles
export const applyTouchOptimizations = () => {
  // Solo aplicar en dispositivos móviles
  if (window.innerWidth <= 1075) {
    applyTouchStyles();
    enableSmoothScrolling();
    optimizeCarousels();
    enhanceTouchResponsiveness();
    console.log('🔄 Optimizaciones táctiles aplicadas');
  }
};

// Aplicar estilos CSS directamente desde JavaScript
const applyTouchStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Estilos para mejorar el desplazamiento táctil */
    html, body {
      -webkit-overflow-scrolling: touch !important;
      touch-action: pan-y !important;
      overscroll-behavior-y: contain !important;
    }
    
    /* Optimizaciones para desplazamiento suave en carruseles y contenedores horizontales */
    .carousel-container,
    .carousel-cards,
    .mobile-carousel,
    .mobile-carousel-inner,
    [class*="slider"],
    [class*="swiper"],
    [class*="scroll-container"],
    div[style*="overflow-x: auto"],
    div[style*="overflow-x:auto"] {
      -webkit-overflow-scrolling: touch !important;
      scroll-snap-type: x mandatory !important;
      scroll-behavior: smooth !important;
      scrollbar-width: none !important;
      touch-action: pan-x !important;
      cursor: grab !important;
    }
    
    /* Ocultar scrollbar en estos elementos */
    .carousel-container::-webkit-scrollbar,
    .carousel-cards::-webkit-scrollbar,
    .mobile-carousel::-webkit-scrollbar,
    .mobile-carousel-inner::-webkit-scrollbar,
    [class*="slider"]::-webkit-scrollbar,
    [class*="swiper"]::-webkit-scrollbar,
    [class*="scroll-container"]::-webkit-scrollbar,
    div[style*="overflow-x: auto"]::-webkit-scrollbar,
    div[style*="overflow-x:auto"]::-webkit-scrollbar {
      display: none !important;
    }
    
    /* Habilitar snap points en elementos de carrusel */
    .carousel-card,
    .mobile-card,
    [class*="slider-item"],
    [class*="swiper-slide"],
    [class*="carousel-item"] {
      scroll-snap-align: center !important;
      flex-shrink: 0 !important;
    }
    
    /* Mejorar experiencia táctil en la aplicación completa */
    input, 
    button, 
    a, 
    .MuiButtonBase-root {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation !important;
    }
    
    /* Asegurar que los botones tienen suficiente tamaño para tocar en móvil */
    button,
    .MuiButton-root,
    .MuiIconButton-root,
    a[role="button"],
    .btn-ver,
    .btn-descargar,
    .btn-borrar {
      min-height: 44px !important;
      min-width: 44px !important;
    }
  `;
  document.head.appendChild(styleElement);
};

// Habilitar desplazamiento suave en toda la aplicación
const enableSmoothScrolling = () => {
  // Aplicar -webkit-overflow-scrolling: touch a todos los elementos que puedan tener scroll
  const scrollableElements = document.querySelectorAll(
    'div, section, main, aside, nav, [class*="MuiContainer"], [class*="MuiBox"]'
  );
  
  scrollableElements.forEach((element) => {
    const style = window.getComputedStyle(element);
    if (style.overflow === 'auto' || style.overflowY === 'auto' || 
        style.overflow === 'scroll' || style.overflowY === 'scroll') {
      element.style.WebkitOverflowScrolling = 'touch';
      element.style.overscrollBehaviorY = 'contain';
    }
  });
  
  // Prevenir el efecto de rebote en iOS
  document.body.style.overscrollBehaviorY = 'none';
  document.documentElement.style.overscrollBehaviorY = 'none';
};

// Optimizar carruseles y elementos con desplazamiento horizontal
const optimizeCarousels = () => {
  const carousels = document.querySelectorAll(
    '.carousel-container, .carousel-cards, .mobile-carousel, .mobile-carousel-inner, ' +
    '[class*="slider"], [class*="swiper"], [class*="scroll-container"], ' +
    'div[style*="overflow-x: auto"]'
  );
  
  carousels.forEach((carousel) => {
    // Aplicar propiedades para mejorar el deslizamiento horizontal
    carousel.style.WebkitOverflowScrolling = 'touch';
    carousel.style.scrollSnapType = 'x mandatory';
    carousel.style.scrollBehavior = 'smooth';
    carousel.style.touchAction = 'pan-x';
    
    // Ocultar scrollbar
    carousel.style.scrollbarWidth = 'none';
    carousel.style.msOverflowStyle = 'none';
    
    // Efectos de cursor al arrastrar
    carousel.addEventListener('mousedown', () => {
      carousel.style.cursor = 'grabbing';
    });
    
    carousel.addEventListener('mouseup', () => {
      carousel.style.cursor = 'grab';
    });
    
    // Aplicar scroll-snap-align a los elementos hijos
    const items = carousel.querySelectorAll(
      '.carousel-card, .mobile-card, [class*="slider-item"], ' +
      '[class*="swiper-slide"], [class*="carousel-item"]'
    );
    
    items.forEach((item) => {
      item.style.scrollSnapAlign = 'center';
      item.style.flexShrink = '0';
    });
  });
};

// Mejorar la respuesta táctil general
const enhanceTouchResponsiveness = () => {
  // Eliminar el resaltado táctil en elementos interactivos
  const interactiveElements = document.querySelectorAll(
    'button, a, input, .MuiButtonBase-root, [role="button"]'
  );
  
  interactiveElements.forEach((element) => {
    element.style.WebkitTapHighlightColor = 'transparent';
    element.style.touchAction = 'manipulation';
  });
  
  // Asegurar tamaño mínimo para elementos táctiles
  const touchTargets = document.querySelectorAll(
    'button, .MuiButton-root, .MuiIconButton-root, a[role="button"], ' +
    '.btn-ver, .btn-descargar, .btn-borrar'
  );
  
  touchTargets.forEach((target) => {
    const style = window.getComputedStyle(target);
    const minHeight = parseInt(style.minHeight) || 0;
    const minWidth = parseInt(style.minWidth) || 0;
    
    if (minHeight < 44) {
      target.style.minHeight = '44px';
    }
    
    if (minWidth < 44) {
      target.style.minWidth = '44px';
    }
  });
};

// Aplicar optimizaciones al cargar la página
document.addEventListener('DOMContentLoaded', applyTouchOptimizations);

// Actualizar optimizaciones al cambiar el tamaño de la ventana
window.addEventListener('resize', applyTouchOptimizations);

export default applyTouchOptimizations; 