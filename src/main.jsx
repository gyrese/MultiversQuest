import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import ErrorBoundary from './components/ErrorBoundary';
import GameProvider from './context/GameContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <App />
      </GameProvider>
    </ErrorBoundary>
  </StrictMode>,
)
