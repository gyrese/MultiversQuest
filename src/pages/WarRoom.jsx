/**
 * WAR ROOM - Quartiers Généraux du Multivers
 * 
 * Dashboard spectaculaire pour affichage sur grand écran (TV/Projecteur).
 * Inclut : Leaderboard animé, Activity Feed, Timer, Effets scénaristiques.
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import WarRoom3DScene from '../components/warroom/WarRoom3DScene';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const NEXUS_URL = 'http://192.168.1.14:5174/nexus';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND - Grilles et Radars
// ═══════════════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD COMPONENT - Animated Rankings
// ═══════════════════════════════════════════════════════════════════════════

function Leaderboard({ teams, lastScoringTeam }) {
    const sortedTeams = useMemo(() =>
        Object.values(teams).sort((a, b) => b.score - a.score),
        [teams]);

    return (
        <div className="bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 h-full">
            <h2 className="text-xl font-orbitron font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                CLASSEMENT EN DIRECT
            </h2>

            <LayoutGroup>
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {sortedTeams.map((team, index) => {
                            const isScoring = lastScoringTeam === team.id;
                            const medals = ['🥇', '🥈', '🥉'];

                            return (
                                <motion.div
                                    key={team.id}
                                    layout
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: isScoring ? 1.02 : 1,
                                    }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{
                                        layout: { type: 'spring', stiffness: 300, damping: 30 },
                                        duration: 0.3
                                    }}
                                    className={`
                                        relative flex items-center gap-4 p-4 rounded-xl
                                        ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30' : ''}
                                        ${index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border border-gray-400/30' : ''}
                                        ${index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/10 border border-orange-500/30' : ''}
                                        ${index > 2 ? 'bg-white/5 border border-white/10' : ''}
                                        ${isScoring ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-black' : ''}
                                    `}
                                >
                                    {/* Highlight Animation */}
                                    {isScoring && (
                                        <motion.div
                                            className="absolute inset-0 bg-green-500/20 rounded-xl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.5, 0] }}
                                            transition={{ duration: 1.5, repeat: 3 }}
                                        />
                                    )}

                                    {/* Rank */}
                                    <div className="w-12 text-center">
                                        {index < 3 ? (
                                            <span className="text-3xl">{medals[index]}</span>
                                        ) : (
                                            <span className="text-2xl font-bold text-white/50">#{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Team Name */}
                                    <div className="flex-1">
                                        <div className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                            {team.name}
                                        </div>
                                        {team.currentUniverse && (
                                            <div className="text-xs text-white/50">
                                                📍 {team.currentUniverse}
                                            </div>
                                        )}
                                    </div>

                                    {/* Score */}
                                    <motion.div
                                        className="text-right"
                                        key={team.score}
                                        initial={{ scale: 1.5, color: '#22c55e' }}
                                        animate={{ scale: 1, color: index === 0 ? '#facc15' : '#ffffff' }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <div className={`text-3xl font-mono font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                            {(team.score || 0).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-white/40">pts</div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </LayoutGroup>

            {sortedTeams.length === 0 && (
                <div className="text-center text-white/30 py-8">
                    En attente des équipes...
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED - Live Event Stream
// ═══════════════════════════════════════════════════════════════════════════

function ActivityFeed({ history }) {
    return (
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-orbitron font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <span className="text-2xl">📡</span>
                TRANSMISSIONS
            </h2>

            <div className="flex-1 overflow-hidden relative">
                <div className="space-y-3 max-h-full overflow-y-auto scrollbar-hide">
                    <AnimatePresence initial={false}>
                        {history.slice(0, 10).map((log, i) => (
                            <motion.div
                                key={`${log.time}-${i}`}
                                initial={{ opacity: 0, x: -30, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 30, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`
                                    p-3 rounded-lg border-l-4 
                                    ${i === 0 ? 'bg-cyan-500/10 border-cyan-500' : 'bg-white/5 border-white/20'}
                                `}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-cyan-400/60 font-mono whitespace-nowrap">
                                        {new Date(log.time).toLocaleTimeString()}
                                    </span>
                                    <span className={`text-sm ${i === 0 ? 'text-white' : 'text-white/70'}`}>
                                        {log.message}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Fade out gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// GIANT TIMER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function GiantTimer({ seconds }) {
    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isLow = seconds < 300; // Moins de 5 min
    const isCritical = seconds < 60; // Moins de 1 min

    return (
        <motion.div
            className={`
                text-center p-6 rounded-2xl border backdrop-blur-md
                ${isCritical ? 'bg-red-500/20 border-red-500/50' :
                    isLow ? 'bg-orange-500/20 border-orange-500/30' :
                        'bg-black/60 border-purple-500/30'}
            `}
            animate={isCritical ? {
                boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.6)', '0 0 20px rgba(239,68,68,0.3)']
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
        >
            <div className="text-sm text-white/50 uppercase tracking-widest mb-2">
                ⏱ Temps Restant
            </div>
            <motion.div
                className={`font-mono font-black tracking-wider
                    ${isCritical ? 'text-red-500 text-7xl' :
                        isLow ? 'text-orange-400 text-6xl' :
                            'text-white text-6xl'}
                `}
                style={{
                    textShadow: isCritical ? '0 0 30px rgba(239,68,68,0.8)' :
                        isLow ? '0 0 20px rgba(251,146,60,0.5)' :
                            '0 0 20px rgba(139,92,246,0.5)'
                }}
                key={seconds}
                initial={isCritical ? { scale: 1.1 } : {}}
                animate={{ scale: 1 }}
            >
                {formatTime(seconds)}
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO OVERLAYS - Alerte Rouge, Glitch
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
            {/* Red pulsing overlay */}
            <motion.div
                className="absolute inset-0 bg-red-600/30"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(220,38,38,0.8)]" />

            {/* Warning stripes */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#dc2626_20px,#dc2626_40px)]" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#dc2626_20px,#dc2626_40px)]" />

            {/* Central message */}
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
        <motion.div
            className="fixed inset-0 z-50 pointer-events-none mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* RGB Shift */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,0,0,0.1) 0%, transparent 50%, rgba(0,255,255,0.1) 100%)'
                }}
                animate={{
                    x: [0, 5, -5, 0],
                    skewX: [0, 2, -2, 0]
                }}
                transition={{ duration: 0.1, repeat: Infinity }}
            />

            {/* Scanlines */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
                }}
            />

            {/* Random glitch blocks */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-cyan-500/20"
                    style={{
                        width: `${Math.random() * 30 + 10}%`,
                        height: `${Math.random() * 5 + 2}%`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        x: [0, Math.random() * 20 - 10, 0]
                    }}
                    transition={{
                        duration: 0.1,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 0.5
                    }}
                />
            ))}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSE UNLOCK POPUP
// ═══════════════════════════════════════════════════════════════════════════

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
// MAIN WAR ROOM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function WarRoom() {
    const { gameState, identify, socket } = useGame();
    const { teams, history, status, globalTimer } = gameState;

    // États pour les effets scénaristiques
    const [alertMode, setAlertMode] = useState(false);
    const [alertMessage, setAlertMessage] = useState("ALERTE MULTIVERS");
    const [glitchMode, setGlitchMode] = useState(false);
    const [unlockPopup, setUnlockPopup] = useState(null);
    const [lastScoringTeam, setLastScoringTeam] = useState(null);

    // Ref vers la Scène 3D pour les effets
    const scene3DRef = useRef();

    useEffect(() => {
        identify('WARROOM');
    }, [identify]);

    // Fonction commune pour traiter les commandes WarRoom
    const handleWarRoomCommand = useCallback((command) => {
        const { type, payload } = command;
        console.log('📺 WarRoom commande reçue:', type, payload);

        // Déclencher l'effet 3D si la scène est prête
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
                console.log('WarRoom: commande inconnue', type);
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉCOUTE DES COMMANDES - DUAL CHANNEL
    // ═══════════════════════════════════════════════════════════════════════════

    // 1. BroadcastChannel (même PC, entre onglets)
    useEffect(() => {
        const channel = new BroadcastChannel('warroom_controls');

        channel.onmessage = (event) => {
            handleWarRoomCommand(event.data);
        };

        console.log('🎬 WarRoom: BroadcastChannel connecté (même PC)');

        return () => {
            channel.close();
        };
    }, [handleWarRoomCommand]);

    // 2. Socket.IO (appareils distants via serveur)
    useEffect(() => {
        if (!socket) return;

        const onWarRoomCommand = (command) => {
            handleWarRoomCommand(command);
        };

        socket.on('warroom:command', onWarRoomCommand);
        console.log('🎬 WarRoom: Socket.IO connecté (appareils distants)');

        return () => {
            socket.off('warroom:command', onWarRoomCommand);
        };
    }, [socket, handleWarRoomCommand]);

    // Écouter les changements de score pour highlight
    useEffect(() => {
        if (history.length > 0) {
            const lastEvent = history[0];
            // Détecter si c'est un événement de score
            if (lastEvent.teamId && lastEvent.message?.includes('pts')) {
                setLastScoringTeam(lastEvent.teamId);
                setTimeout(() => setLastScoringTeam(null), 3000);
            }
            // Détecter si c'est un déverrouillage d'univers
            if (lastEvent.message?.includes('débloqué') || lastEvent.message?.includes('découvert')) {
                setUnlockPopup({
                    universe: lastEvent.universe || 'Univers Mystère',
                    team: lastEvent.teamName || 'Équipe Inconnue'
                });
            }
        }
    }, [history]);

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans overflow-hidden relative">


            {/* Scenario Overlays */}
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

            {/* 3D Scene - Remplace l'AnimatedBackground 2D */}
            <WarRoom3DScene onCueRef={scene3DRef} />

            {/* Main Content */}
            <div className="relative z-10 h-screen flex flex-col p-6">

                {/* ══════════════════ HEADER ══════════════════ */}
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="text-5xl"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            🌀
                        </motion.div>
                        <div>
                            <h1 className="font-orbitron text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                MULTIVERS QUEST
                            </h1>
                            <div className="text-white/40 text-sm tracking-widest">
                                QUARTIERS GÉNÉRAUX • CONTRÔLE EN DIRECT
                            </div>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-white/40 text-xs uppercase tracking-widest">Rejoindre</div>
                            <div className="text-purple-400 text-sm font-mono">{NEXUS_URL.replace('http://', '')}</div>
                        </div>
                        <div className="bg-white p-2 rounded-xl shadow-lg shadow-purple-500/20">
                            <QRCodeSVG value={NEXUS_URL} size={80} level="M" />
                        </div>
                    </div>
                </header>

                {/* ══════════════════ MAIN GRID ══════════════════ */}
                <div className="flex-1 grid grid-cols-12 gap-6">

                    {/* LEFT COLUMN - Leaderboard */}
                    <div className="col-span-5">
                        <Leaderboard teams={teams} lastScoringTeam={lastScoringTeam} />
                    </div>

                    {/* CENTER COLUMN - Timer + Stats */}
                    <div className="col-span-3 flex flex-col gap-6">
                        <GiantTimer seconds={globalTimer} />

                        {/* Stats rapides */}
                        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1">
                            <h3 className="text-white/50 text-sm uppercase tracking-widest mb-4">Statistiques</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60">Équipes actives</span>
                                    <span className="text-2xl font-bold text-purple-400">{Object.keys(teams).length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60">Total des points</span>
                                    <span className="text-2xl font-bold text-cyan-400">
                                        {Object.values(teams).reduce((sum, t) => sum + t.score, 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60">Événements</span>
                                    <span className="text-2xl font-bold text-pink-400">{history.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Activity Feed */}
                    <div className="col-span-4">
                        <ActivityFeed history={history} />
                    </div>
                </div>

                {/* ══════════════════ FOOTER ══════════════════ */}
                <footer className="mt-6 text-center text-white/20 text-xs tracking-widest">
                    SYSTÈME DE CONTRÔLE MULTIVERS • v2.0 • SIGNAL: STABLE
                </footer>
            </div>

            {/* Styles globaux pour scrollbar */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
