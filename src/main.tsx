import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safely suppress benign Vite dev-server HMR WebSocket disconnection notices
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event?.reason?.message || event?.reason || '');
    if (reasonStr.includes('WebSocket') || reasonStr.includes('closed without')) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const errorStr = String(event?.message || event?.error || '');
    if (errorStr.includes('WebSocket') || errorStr.includes('closed without')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
