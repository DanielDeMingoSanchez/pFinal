import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface BackButtonProps {
  label?: string;
  route?: string;
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  iconOnly?: boolean;
  tooltip?: string;
}

/**
 * Componente de botón para volver a la página anterior o a una ruta específica
 */
const BackButton: React.FC<BackButtonProps> = ({
  label = 'Volver',
  route,
  variant = 'outlined',
  color = 'primary',
  size = 'medium',
  className = '',
  style,
  iconOnly = false,
  tooltip = 'Volver a la página anterior'
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleGoBack = () => {
    if (route) {
      navigate(route);
    } else {
      navigate(-1); // Volver a la página anterior
    }
  };

  // En móviles, mostrar sólo el icono si iconOnly es true
  const showIconOnly = iconOnly || isMobile;

  return showIconOnly ? (
    <Tooltip title={tooltip}>
      <IconButton
        onClick={handleGoBack}
        color={color}
        size={size}
        aria-label={label}
        className={className}
        style={style}
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={handleGoBack}
      startIcon={<ArrowBackIcon />}
      className={className}
      style={style}
    >
      {label}
    </Button>
  );
};

export default BackButton; 