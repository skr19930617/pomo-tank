import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../tank-panel/theme';
import { App } from './App';
import { SpriteUriMapProvider } from '../tank-panel/contexts/sprite-context';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SpriteUriMapProvider>
        <App />
      </SpriteUriMapProvider>
    </ThemeProvider>,
  );
}
