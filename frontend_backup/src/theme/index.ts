import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: 'var(--primary)',
      dark: 'var(--primary-dark)',
      light: 'var(--primary-light)',
      contrastText: '#fff',
    },
    secondary: {
      main: '#86868B',
      dark: '#6E6E73',
      light: '#A1A1A6',
      contrastText: '#fff',
    },
    error: {
      main: '#FF3B30',
    },
    background: {
      default: 'var(--background)',
      paper: 'var(--card-bg)',
    },
    text: {
      primary: 'var(--text)',
      secondary: 'var(--text-secondary)',
    },
  },
  typography: {
    fontFamily: 'var(--font-family-base)',
    h1: {
      fontSize: '56px',
      lineHeight: 1.07143,
      letterSpacing: '-0.009em',
      fontWeight: 600,
    },
    h2: {
      fontSize: '48px',
      lineHeight: 1.08349,
      letterSpacing: '-0.009em',
      fontWeight: 600,
    },
    h3: {
      fontSize: '40px',
      lineHeight: 1.1,
      letterSpacing: '-0.009em',
      fontWeight: 600,
    },
    h4: {
      fontSize: '32px',
      lineHeight: 1.125,
      letterSpacing: '-0.009em',
      fontWeight: 600,
    },
    h5: {
      fontSize: '24px',
      lineHeight: 1.16667,
      letterSpacing: '-0.009em',
      fontWeight: 600,
    },
    h6: {
      fontSize: '21px',
      lineHeight: 1.19048,
      letterSpacing: '-0.009em',
      fontWeight: 600,
    },
    body1: {
      fontSize: '17px',
      lineHeight: 1.47059,
      letterSpacing: '-0.022em',
    },
    body2: {
      fontSize: '14px',
      lineHeight: 1.42859,
      letterSpacing: '-0.016em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      letterSpacing: '-0.022em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '980px',
          padding: '12px 22px',
          fontSize: '17px',
          lineHeight: 1.47059,
          letterSpacing: '-0.022em',
          fontWeight: 400,
          boxShadow: 'none',
          textTransform: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'none',
          },
        },
        containedPrimary: {
          background: 'var(--primary)',
          '&:hover': {
            background: 'var(--primary-dark)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'var(--card-bg)',
          backdropFilter: 'saturate(180%) blur(20px)',
          borderRadius: '18px',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: 'none',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: 'transparent',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'transparent',
            },
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme; 
