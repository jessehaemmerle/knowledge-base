import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // Falls Du globale Styles definieren möchtest

// Ermitteln des Root-Containers
const container = document.getElementById('root');
const root = createRoot(container);

// Rendern der App in den Root-Container
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
