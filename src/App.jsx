import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PlayerApp from './PlayerApp';
import { GameProvider } from './context/GameContext';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Dashboard pour l'affichage principal (TV/écran) - avec GameProvider pour sync */}
                <Route path="/" element={
                    <GameProvider>
                        <Dashboard />
                    </GameProvider>
                } />
                <Route path="/dashboard" element={
                    <GameProvider>
                        <Dashboard />
                    </GameProvider>
                } />

                {/* Nexus/Player pour les joueurs (mobile) - PlayerApp a son propre GameProvider */}
                <Route path="/nexus" element={<PlayerApp />} />
                <Route path="/join" element={<PlayerApp />} />
                <Route path="/play" element={<PlayerApp />} />
            </Routes>
        </BrowserRouter>
    );
}
