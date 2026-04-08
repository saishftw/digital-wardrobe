import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent pinch zoom on iOS
document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
document.addEventListener('gestureend', function(e) { e.preventDefault(); });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
