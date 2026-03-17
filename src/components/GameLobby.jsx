/**
 * 🎮 GameLobby - Salon d'attente style Kahoot
 * Affiché quand gameState.status === 'LOBBY'
 * Chaque joueur voit en temps réel les équipes qui rejoignent
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import TeamAvatar from './TeamAvatar';

// Couleurs de fond aléatoires par équipe (comme Kahoot)
const CARD_COLORS = [
    { bg: 'rgba(0,180,255,0.12)',  border: 'rgba(0,180,255,0.35)' },
    { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
    { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.35)' },
    { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)'  },
    { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)' },
    { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.35)' },
];

function getCardColor(teamId) {
    // Couleur stable et déterministe par teamId
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) hash = (hash * 31 + teamId.charCodeAt(i)) & 0xffffffff;
    return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export default function GameLobby({ team, onLogout }) {
    const { gameState } = useGame();
    const teams = Object.values(gameState.teams);
    const prevCountRef = useRef(teams.length);
    const [newArrival, setNewArrival] = useState(null);

    // Détecte les nouvelles équipes pour l'effet sonore / flash
    useEffect(() => {
        if (teams.length > prevCountRef.current) {
            const added = teams.filter(t => !prevCountRef.current || true).at(-1);
            setNewArrival(added?.id || null);
            setTimeout(() => setNewArrival(null), 1200);
        }
        prevCountRef.current = teams.length;
    }, [teams.length]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: '#07001a' }}>

            {/* ── Fond animé ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Glow blobs */}
                <motion.div className="absolute w-72 h-72 rounded-full blur-3xl"
                    style={{ background: 'rgba(0,100,255,0.15)', top: '-10%', left: '-5%' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity }} />
                <motion.div className="absolute w-64 h-64 rounded-full blur-3xl"
                    style={{ background: 'rgba(180,0,255,0.12)', bottom: '5%', right: '-5%' }}
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 7, repeat: Infinity }} />

                {/* Grille */}
                <div className="absolute inset-0 opacity-[0.025]" style={{
                    backgroundImage: `linear-gradient(rgba(0,255,255,1) 1px,transparent 1px),
                                      linear-gradient(90deg,rgba(0,255,255,1) 1px,transparent 1px)`,
                    backgroundSize: '50px 50px',
                }} />
            </div>

            {/* ── Header ── */}
            <div className="relative z-10 flex-shrink-0 pt-7 pb-3 px-5 text-center">
                <motion.img
                    src="/images/rocket-logo.png"
                    className="w-14 h-14 mx-auto mb-3"
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <h1 className="text-2xl font-black tracking-widest leading-none" style={{
                    fontFamily: 'Orbitron, sans-serif',
                    background: 'linear-gradient(135deg,#00d4ff 0%,#a855f7 55%,#ec4899 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    MULTIVERSE QUEST
                </h1>

                {/* Statut pulsé */}
                <motion.div
                    className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"
                        animate={{ scale: [1, 1.6, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }} />
                    <span className="text-cyan-300 font-mono text-[11px] tracking-widest uppercase">
                        En attente du Game Master
                    </span>
                </motion.div>
            </div>

            {/* ── Compteur équipes ── */}
            <div className="relative z-10 flex-shrink-0 mx-4 mb-3 px-4 py-2.5 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-gray-400 font-mono text-xs uppercase tracking-widest">
                    Équipes dans le salon
                </span>
                <motion.span
                    key={teams.length}
                    initial={{ scale: 1.8, color: '#00ffff' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.35 }}
                    className="font-black text-2xl font-mono"
                >
                    {teams.length}
                </motion.span>
            </div>

            {/* ── Grille des équipes ── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-3 pb-2">
                {teams.length === 0 ? (
                    <div className="text-center text-gray-600 font-mono text-sm pt-10">
                        Aucune équipe connectée...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <AnimatePresence>
                            {teams.map((t) => {
                                const isMe = t.id === team.teamId;
                                const isNew = t.id === newArrival;
                                const color = isMe
                                    ? { bg: 'rgba(0,212,255,0.18)', border: 'rgba(0,212,255,0.6)' }
                                    : getCardColor(t.id);

                                return (
                                    <motion.div
                                        key={t.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.6, y: 24 }}
                                        animate={{
                                            opacity: 1, scale: 1, y: 0,
                                            boxShadow: isNew
                                                ? ['0 0 0px rgba(0,255,200,0)', '0 0 20px rgba(0,255,200,0.6)', '0 0 0px rgba(0,255,200,0)']
                                                : isMe
                                                    ? '0 0 14px rgba(0,212,255,0.3)'
                                                    : '0 0 0px transparent',
                                        }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                                        className="relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 overflow-hidden"
                                        style={{ background: color.bg, border: `1px solid ${color.border}` }}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ${isMe ? 'ring-cyan-400' : 'ring-white/10'}`}>
                                            <TeamAvatar name={t.name} size={56} className="w-full h-full object-cover" />
                                        </div>

                                        {/* Nom */}
                                        <span className="text-sm font-bold text-center leading-tight break-all px-1"
                                            style={{ color: isMe ? '#00d4ff' : '#e2e8f0' }}>
                                            {t.name}
                                        </span>

                                        {/* Badge MOI */}
                                        {isMe && (
                                            <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-cyan-200 bg-cyan-900/60 border border-cyan-400/40 px-1.5 py-0.5 rounded-full leading-none">
                                                MOI
                                            </span>
                                        )}

                                        {/* Dot connexion */}
                                        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${t.connected ? 'bg-green-400' : 'bg-gray-600'}`} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Mon équipe (sticky bas) ── */}
            <div className="relative z-10 flex-shrink-0 mx-4 my-3 px-4 py-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-cyan-400/50 flex-shrink-0">
                    <TeamAvatar name={team.name} size={36} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Vous jouez en tant que</div>
                    <div className="text-white font-bold truncate">{team.name}</div>
                </div>
                <button onClick={onLogout} className="text-[10px] text-red-500/50 hover:text-red-400 font-mono underline flex-shrink-0">
                    Quitter
                </button>
            </div>
        </div>
    );
}
