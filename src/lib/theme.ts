'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00C896', // Actual Robinhood green (more muted)
      light: '#00D4AA', 
      dark: '#00B085',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF8A80',
      dark: '#F44336',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#00C896',
      light: '#00D4AA',
      dark: '#00B085',
    },
    error: {
      main: '#FF6B6B',
      light: '#FF8A80',
      dark: '#F44336',
    },
    warning: {
      main: '#FFB020',
      light: '#FFC952',
      dark: '#E09600',
    },
    background: {
      default: '#0B0B0B', // Very dark like Robinhood
      paper: '#1A1A1A',   // Subtle card backgrounds
    },
    text: {
      primary: '#FFFFFF', // Pure white text
      secondary: '#B3B3B3', // Muted gray for secondary text
    },
    divider: '#2A2A2A',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: '4rem',
      fontWeight: 700,
      lineHeight: 1.1,
      color: '#FFFFFF',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#FFFFFF',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#FFFFFF',
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#FFFFFF',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#FFFFFF',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#FFFFFF',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#FFFFFF',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#B3B3B3',
    },
  },
  shape: {
    borderRadius: 8, // More subtle than our previous 12px
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0B0B0B',
          color: '#FFFFFF',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease-out',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 24, // Robinhood uses more rounded buttons
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: '#00C896', // Solid green, not gradient
          color: '#000000',
          '&:hover': {
            background: '#00B085',
          },
        },
        outlined: {
          borderColor: '#2A2A2A',
          color: '#B3B3B3',
          '&:hover': {
            borderColor: '#00C896',
            backgroundColor: 'rgba(0, 200, 150, 0.08)',
            color: '#00C896',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 600,
          height: 'auto',
          padding: '6px 12px',
        },
        colorSuccess: {
          backgroundColor: '#00C896',
          color: '#000000',
        },
        colorError: {
          backgroundColor: '#FF6B6B',
          color: '#FFFFFF',
        },
        colorWarning: {
          backgroundColor: '#FFB020',
          color: '#000000',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#2A2A2A',
            '& fieldset': {
              borderColor: '#404040',
            },
            '&:hover fieldset': {
              borderColor: '#00C896',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00C896',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#FFFFFF',
          },
          '& .MuiInputLabel-root': {
            color: '#B3B3B3',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#00C896',
          '& .MuiSlider-thumb': {
            backgroundColor: '#00C896',
            border: '2px solid #FFFFFF',
            '&:hover': {
              boxShadow: '0 0 0 8px rgba(0, 200, 150, 0.16)',
            },
          },
          '& .MuiSlider-track': {
            backgroundColor: '#00C896',
          },
          '& .MuiSlider-rail': {
            backgroundColor: '#404040',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#B3B3B3',
          '&:hover': {
            backgroundColor: 'rgba(0, 200, 150, 0.08)',
            color: '#00C896',
          },
        },
      },
    },
  },
});

export default theme;
