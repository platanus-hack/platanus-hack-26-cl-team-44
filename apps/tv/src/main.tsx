import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/base.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/os-colores.css';
import './styles/magnetic-pointer.css';
import './styles/v2.css';

// En producción la TV vive en /v2/. El toki-config.js de la TV actual queda en la carpeta de arriba.
// En el escenario, el monitor MyoWare sirve su propia versión con window.TOKI_ENV (remoto y token).
function loadTokiConfig(): Promise<void> {
  if (!import.meta.env.PROD) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = '../toki-config.js';
    s.onload = s.onerror = () => resolve();
    document.head.append(s);
  });
}

void loadTokiConfig().then(() => {
  window.TOKI_ENV ??= {};
  const root = document.getElementById('root');
  if (!root) throw new Error('Falta #root');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
