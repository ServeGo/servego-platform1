import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// FIX: Import index.css (which has @import "tailwindcss" + @theme custom colors) instead of stale tailwind-dist.css
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

