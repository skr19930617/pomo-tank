import { createTheme } from '@mui/material/styles';

// ── Custom palette type extensions ──
declare module '@mui/material/styles' {
  interface TypeBackground {
    panel: string;
  }
  interface TypeText {
    bright: string;
  }
  interface Palette {
    border: { main: string; dark: string };
    debug: { main: string; dark: string; light: string };
  }
  interface PaletteOptions {
    border?: { main: string; dark: string };
    debug?: { main: string; dark: string; light: string };
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#181825',
      paper: '#2a2a40',
      panel: '#222238',
    },
    text: {
      primary: '#ccccdd',
      secondary: '#aabbcc',
      bright: '#eeeeff',
    },
    success: {
      main: '#448844',
      dark: '#2a4a2a',
      light: '#aaddaa',
    },
    info: {
      main: '#4488cc',
      light: '#88aacc',
    },
    action: {
      disabledBackground: '#333',
      disabled: '#777',
    },
    border: {
      main: '#444466',
      dark: '#333355',
    },
    debug: {
      main: '#ff6633',
      dark: '#2a1a10',
      light: '#ffcc88',
    },
  },
  typography: {
    fontFamily: "'PixelFont', monospace",
    fontSize: 8,
    body1: { fontSize: '11px' },
    body2: { fontSize: '10px' },
    h6: { fontSize: '16px', fontWeight: 'bold' },
    subtitle1: { fontSize: '13px', fontWeight: 'bold' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#181825',
          color: '#ccccdd',
          overflow: 'hidden',
          padding: 0,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'auto',
          fontFamily: "'PixelFont', monospace",
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        square: true,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          '&:before': { display: 'none' },
          boxShadow: 'none',
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 'auto',
          padding: '6px 8px',
          '&.Mui-expanded': { minHeight: 'auto' },
        },
        content: {
          margin: 0,
          '&.Mui-expanded': { margin: 0 },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: "'PixelFont', monospace",
            fontSize: '11px',
          },
        },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000,
      },
    },
  },
});

export default theme;

// ── Shared Accordion Styles ──
export const accordionSx = {
  my: '4px',
  bgcolor: 'transparent',
} as const;

export const accordionSummarySx = {
  bgcolor: 'background.paper',
  borderRadius: '4px',
  border: '1px solid',
  borderColor: 'border.dark',
  color: 'text.secondary',
  fontSize: '11px',
  userSelect: 'none',
} as const;

export const accordionDetailsSx = {
  bgcolor: 'background.panel',
  borderRadius: '0 0 4px 4px',
} as const;
