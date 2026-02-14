import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import WarRoom3DScene from '../components/warroom/WarRoom3DScene';

// THEMES
import WarRoomDefault from '../components/warroom/themes/WarRoomDefault';
import WarRoomJurassic from '../components/warroom/themes/WarRoomJurassic';
import WarRoomPostApo from '../components/warroom/themes/WarRoomPostApo';
import WarRoomMario from '../components/warroom/themes/WarRoomMario';
import WarRoomFantasy from '../components/warroom/themes/WarRoomFantasy';
import WarRoomSpace from '../components/warroom/themes/WarRoomSpace';

// CONFIGURATION
const NEXUS_URL = 'http://192.168.1.14:5174/nexus';

// THEME MAPPING
const THEME_MAP = {
    // 🌀 DEFAULT / SCI-FI (Clean futuristic)
    'default': WarRoomDefault,
    'odyssee_spatiale': WarRoomSpace, // UPDATED: Dedicated Space Theme
    'mecanique_futur': WarRoomSpace,  // Also fits space vibe well
    'realites_alterees': WarRoomDefault,

    // 🦖 JURASSIC (Green CRT)
    'jurassic': WarRoomJurassic,
    'eres_perdues': WarRoomJurassic,
    'island': WarRoomJurassic,

    // ☢️ POST-APO (Amber CRT / Grungy)
    'post_apo': WarRoomPostApo,
    'tenebres_eternelles': WarRoomPostApo, // Fits the dark/gritty vibe
    'fallout': WarRoomPostApo,

    // 🍄 MARIO / RETRO (8-bit Colorful)
    'mario': WarRoomMario,
    'club_dorothee': WarRoomMario,
    'animation_world': WarRoomMario, // Playful style
    'retro': WarRoomMario,

    // ⚔️ FANTASY (Parchment / Serif)
    'fantasy': WarRoomFantasy,
    'royaumes_legendaires': WarRoomFantasy,
    'harry_potter': WarRoomFantasy,
    'lotr': WarRoomFantasy,
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO OVERLAYS (Keeping these global for now)
// ═══════════════════════════════════════════════════════════════════════════

function AlertOverlay({ active, message = "ALERTE MULTIVERS" }) {
    if (!active) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="absolute inset-0 bg-red-600/30"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
            />
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(220,38,38,0.8)]" />
            <div className="absolute top-0 left-0 right-0 h-16 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#dc2626_20px,#dc2626_40px)]" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#dc2626_20px,#dc2626_40px)]" />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="text-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    <div className="text-red-500 text-8xl font-black font-orbitron tracking-wider"
                        style={{ textShadow: '0 0 50px rgba(220,38,38,0.8)' }}>
                        ⚠ {message} ⚠
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function GlitchOverlay({ active }) {
    if (!active) return null;
    return (
        <motion.div className="fixed inset-0 z-50 pointer-events-none mix-blend-screen bg-transparent">
            {/* Simplified Glitch for performance */}
            <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay animate-pulse" />
        </motion.div>
    );
}

function UniverseUnlockPopup({ universe, team, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-black/90 border-2 border-purple-500 rounded-3xl p-12 text-center max-w-2xl"
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.5, y: -100 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                <motion.div
                    className="text-8xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                >
                    🌌
                </motion.div>
                <div className="text-purple-400 text-sm uppercase tracking-widest mb-2">
                    Nouvel Univers Débloqué !
                </div>
                <div className="text-4xl font-orbitron font-bold text-white mb-4">
                    {universe}
                </div>
                <div className="text-white/60">
                    Découvert par l'équipe <span className="text-purple-400 font-bold">{team}</span>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN WAR ROOM COMPONENT (CONTAINER)
// ═══════════════════════════════════════════════════════════════════════════

export default function WarRoom() {
    const { gameState, identify, socket } = useGame();
    const { history } = gameState;

    // Local State for Effects
    const [alertMode, setAlertMode] = useState(false);
    const [alertMessage, setAlertMessage] = useState("ALERTE MULTIVERS");
    const [glitchMode, setGlitchMode] = useState(false);
    const [unlockPopup, setUnlockPopup] = useState(null);
    const [lastScoringTeam, setLastScoringTeam] = useState(null);

    // DEBUG: Local Theme Switcher
    const [localTheme, setLocalTheme] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    const scene3DRef = useRef();

    useEffect(() => {
        identify('WARROOM');
    }, [identify]);

    // Command Handling
    const handleWarRoomCommand = useCallback((command) => {
        const { type, payload } = command;
        console.log('📺 WarRoom commande reçue:', type, payload);

        if (scene3DRef.current && scene3DRef.current.triggerCue) {
            scene3DRef.current.triggerCue(type, payload);
        }

        switch (type) {
            case 'TRIGGER_ALERT':
                setAlertMessage(payload?.message || "ALERTE MULTIVERS");
                setAlertMode(true);
                setTimeout(() => setAlertMode(false), 5000);
                break;
            case 'TRIGGER_GLITCH':
                setGlitchMode(true);
                setTimeout(() => setGlitchMode(false), payload?.duration || 3000);
                break;
            case 'SHOW_UNLOCK':
                setUnlockPopup({
                    universe: payload?.universe || 'Univers Mystère',
                    team: payload?.team || 'Équipe Inconnue'
                });
                break;
            default:
                break;
        }
    }, []);

    // Listeners
    useEffect(() => {
        const channel = new BroadcastChannel('warroom_controls');
        channel.onmessage = (event) => handleWarRoomCommand(event.data);
        return () => channel.close();
    }, [handleWarRoomCommand]);

    useEffect(() => {
        if (!socket) return;
        socket.on('warroom:command', handleWarRoomCommand);
        return () => socket.off('warroom:command', handleWarRoomCommand);
    }, [socket, handleWarRoomCommand]);

    // Scoring & Events
    useEffect(() => {
        if (history.length > 0) {
            const lastEvent = history[0];
            if (lastEvent.teamId && lastEvent.message?.includes('pts')) {
                setLastScoringTeam(lastEvent.teamId);
                setTimeout(() => setLastScoringTeam(null), 3000);
            }
            if (lastEvent.message?.includes('débloqué') || lastEvent.message?.includes('découvert')) {
                setUnlockPopup({
                    universe: lastEvent.universe || 'Univers Mystère',
                    team: lastEvent.teamName || 'Équipe Inconnue'
                });
            }
        }
    }, [history]);

    // THEME SELECTION
    const ActiveTheme = useMemo(() => {
        const themeKey = localTheme || gameState.themeUniverse || 'default';
        return THEME_MAP[themeKey] || WarRoomDefault;
    }, [gameState.themeUniverse, localTheme]);

    return (
        <div className="w-full h-full relative overflow-hidden text-white font-sans bg-[#030712]">
            {/* Global Overlays */}
            <AnimatePresence>
                {alertMode && <AlertOverlay active={alertMode} message={alertMessage} />}
                {glitchMode && <GlitchOverlay active={glitchMode} />}
                {unlockPopup && (
                    <UniverseUnlockPopup
                        universe={unlockPopup.universe}
                        team={unlockPopup.team}
                        onClose={() => setUnlockPopup(null)}
                    />
                )}
            </AnimatePresence>

            {/* 3D Scene (Background) - Only visible if theme allows transparency or uses it */}
            <div className="absolute inset-0 z-0">
                <WarRoom3DScene onCueRef={scene3DRef} />
            </div>

            {/* Active Theme Component */}
            <ActiveTheme
                gameState={gameState}
                lastScoringTeam={lastScoringTeam}
                NEXUS_URL={NEXUS_URL}
            />

            {/* DEBUG PANEL */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-auto">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="bg-gray-800/80 text-white px-3 py-1 text-xs rounded border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-md"
                >
                    {showDebug ? 'Hide Controls' : '🎨 Theme Controls'}
                </button>

                {showDebug && (
                    <div className="bg-black/90 border border-white/20 p-4 rounded-lg flex flex-col gap-2 min-w-[200px] shadow-xl backdrop-blur-md">
                        <div className="text-xs uppercase text-gray-400 font-bold mb-1 border-b border-gray-700 pb-1">Select Theme</div>
                        <button onClick={() => setLocalTheme(null)} className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${!localTheme ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10'}`}>
                            🔄 Sync with Admin
                        </button>
                        {[
                            { key: 'default', label: '🌀 Default' },
                            { key: 'odyssee_spatiale', label: '🚀 Space Mission' },
                            { key: 'jurassic', label: '🦖 Jurassic' },
                            { key: 'post_apo', label: '☢️ Post-Apo' },
                            { key: 'mario', label: '🍄 Mario' },
                            { key: 'fantasy', label: '⚔️ Fantasy' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setLocalTheme(key)}
                                className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${localTheme === key ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
