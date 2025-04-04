import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fab, Tooltip, useTheme } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface FloatingBackButtonProps {
  route?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
  tooltip?: string;
  zIndex?: number;
}

/**
 * Botón flotante para volver atrás
 */
const FloatingBackButton: React.FC<FloatingBackButtonProps> = ({
  route,
  position = 'bottom-left',
  color = 'primary',
  tooltip = 'Volver',
  zIndex = 50,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoBack = () => {
    if (route) {
      navigate(route);
    } else {
      navigate(-1); // Volver a la página anterior
    }
  };

  // Determinar la posición
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'bottom-right':
        return { bottom: 16, right: 16 };
      default:
        return { bottom: 16, left: 16 };
    }
  };

  const positionStyles = getPositionStyles();

  return (
    <Tooltip title={tooltip} placement="right">
      <Fab
        color={color}
        size="medium"
        aria-label={tooltip}
        onClick={handleGoBack}
        sx={{
          position: 'fixed',
          ...positionStyles,
          zIndex: zIndex,
          boxShadow: theme.shadows[4],
        }}
      >
        <ArrowBackIcon />
      </Fab>
    </Tooltip>
  );
};

export default FloatingBackButton; 