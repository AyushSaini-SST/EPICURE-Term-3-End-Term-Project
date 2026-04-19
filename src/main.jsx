import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initAuth } from './firebase';

// Initialize Firebase Anonymous Auth before rendering
initAuth().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}).catch(() => {
  // Render anyway even if auth fails (for local dev without Firebase)
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
