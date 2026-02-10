import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import WarRoom from './pages/WarRoom';
import PlayerApp from './PlayerApp';
// GameProvider est fourni par main.jsx

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Dashboard pour l'affichage principal (TV/écran) */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* 🎮 War Room - Quartiers Généraux du Multivers */}
                <Route path="/warroom" element={<WarRoom />} />

                {/* 👑 Panel Admin - Game Master Interface */}
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/gm" element={<AdminPanel />} />

                {/* Nexus/Player pour les joueurs (mobile) */}
                <Route path="/nexus" element={<PlayerApp />} />
                <Route path="/join" element={<PlayerApp />} />
                <Route path="/play" element={<PlayerApp />} />
            </Routes>
        </BrowserRouter>
    );
}
