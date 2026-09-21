// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// ESTA ES LA LÍNEA CRÍTICA QUE FALTA O ESTÁ DESCONECTADA:
// @ts-expect-error CSS is resolved by the bundler at runtime.
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);