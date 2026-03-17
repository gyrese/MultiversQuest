import React, { useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import TeamAvatar from '../../../components/TeamAvatar';

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (Copied from original WarRoom)
// ═══════════════════════════════════════════════════════════════════════════

function Leaderboard({ teams, lastScoringTeam }) {
    const sortedTeams = useMemo(() =>
        Object.values(teams)
            .filter(t => t.connected) // Only show connected teams
            .sort((a, b) => b.score - a.score),
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

                                    {/* Avatar (Ellipse) */}
                                    <div className="flex-shrink-0 w-10 h-10 mx-2 relative">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-cyan-500 opacity-20 blur-md rounded-full" />
                                        <div className="w-full h-full rounded-full overflow-hidden border border-white/20 relative z-10 shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                                            <TeamAvatar name={team.name} size={40} className="w-full h-full object-cover" />
                                        </div>
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
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

function GiantTimer({ seconds }) {
    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isLow = seconds < 300;
    const isCritical = seconds < 60;

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
// MAIN DEFAULT THEME
// ═══════════════════════════════════════════════════════════════════════════

export default function WarRoomDefault({ gameState, lastScoringTeam, NEXUS_URL }) {
    const { teams, history, status, globalTimer, sessionNight } = gameState;

    // Detect if we are waiting for session start
    const isStandby = status === 'LOBBY' && (!sessionNight || sessionNight.status === 'DRAFT');

    // Pop Culture floating icons for background
    const POP_ICONS = [
        { icon: '⚔️', x: 5, y: 10, size: '4rem', delay: 0 },
        { icon: '🚀', x: 15, y: 75, size: '3.5rem', delay: 1.2 },
        { icon: '🦖', x: 25, y: 20, size: '5rem', delay: 0.5 },
        { icon: '💊', x: 35, y: 85, size: '3rem', delay: 2 },
        { icon: '🧙', x: 50, y: 5, size: '4rem', delay: 0.8 },
        { icon: '🤖', x: 60, y: 80, size: '4.5rem', delay: 1.5 },
        { icon: '👾', x: 70, y: 15, size: '3.5rem', delay: 0.3 },
        { icon: '🍄', x: 80, y: 70, size: '4rem', delay: 1.8 },
        { icon: '💀', x: 88, y: 30, size: '3rem', delay: 0.7 },
        { icon: '🌌', x: 92, y: 85, size: '4.5rem', delay: 2.2 },
        { icon: '🔫', x: 8, y: 50, size: '3rem', delay: 1.1 },
        { icon: '🐉', x: 45, y: 60, size: '5rem', delay: 0.4 },
        { icon: '🕷️', x: 75, y: 45, size: '3.5rem', delay: 1.6 },
        { icon: '⚡', x: 55, y: 40, size: '3rem', delay: 0.9 },
        { icon: '🎮', x: 20, y: 45, size: '3.5rem', delay: 1.4 },
    ];

    if (isStandby) {
        return (
            <div className="relative z-10 h-screen flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
                {/* Dark base */}
                <div className="absolute inset-0 bg-[#030712] z-0" />

                {/* Pop Culture Background - Floating Icons */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {POP_ICONS.map((item, i) => (
                        <motion.div
                            key={i}
                            className="absolute select-none pointer-events-none"
                            style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, opacity: 0.08 }}
                            animate={{ y: [0, -20, 0], opacity: [0.06, 0.14, 0.06] }}
                            transition={{ duration: 4 + item.delay, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}
                        >
                            {item.icon}
                        </motion.div>
                    ))}
                </div>

                {/* Neon grid */}
                <div className="absolute inset-0 z-0 opacity-15"
                    style={{ backgroundImage: 'linear-gradient(rgba(100,0,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,0,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                />

                {/* Radial glow center */}
                <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)' }} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="z-10 text-center max-w-4xl"
                >
                    <motion.div
                        className="text-9xl mb-6 inline-block"
                        animate={{
                            rotate: [0, 360],
                            filter: ['drop-shadow(0 0 20px rgba(168,85,247,0.4))', 'drop-shadow(0 0 50px rgba(168,85,247,0.8))', 'drop-shadow(0 0 20px rgba(168,85,247,0.4))']
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                        🌀
                    </motion.div>

                    <h1 className="font-orbitron text-7xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent mb-3">
                        MULTIVERS QUEST
                    </h1>

                    {/* TAGLINE */}
                    <motion.p
                        className="text-2xl font-bold mb-10"
                        style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <span className="text-yellow-400">Le bordel</span>{' '}
                        <span className="text-pink-400">cosmique</span>{' '}
                        <span className="text-cyan-400">commence ici</span>
                    </motion.p>

                    <div className="bg-black/50 backdrop-blur-xl border border-purple-500/30 p-8 rounded-3xl flex items-center gap-12 text-left shadow-[0_0_60px_rgba(168,85,247,0.2)]">
                        <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <QRCodeSVG value={NEXUS_URL} size={200} level="M" />
                        </div>
                        <div>
                            <h2 className="text-3xl text-white font-bold mb-2">REJOIGNEZ LA SESSION</h2>
                            <p className="text-purple-300 text-xl font-mono mb-6">{NEXUS_URL.replace('http://', '')}</p>

                            <div className="flex items-center gap-4">
                                <div className="px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-200 animate-pulse">
                                    📡 En attente du signal...
                                </div>
                                <div className="text-white/60">
                                    {Object.keys(teams).length} équipes connectées
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative z-10 h-screen flex flex-col p-6 font-sans overflow-hidden">
            {/* Pop Culture Background Icons */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {POP_ICONS.map((item, i) => (
                    <motion.div
                        key={i}
                        className="absolute select-none"
                        style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, opacity: 0.05 }}
                        animate={{ y: [0, -15, 0], opacity: [0.04, 0.09, 0.04] }}
                        transition={{ duration: 5 + item.delay, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}
                    >
                        {item.icon}
                    </motion.div>
                ))}
            </div>

            {/* ══════════════════ HEADER ══════════════════ */}
            <header className="flex items-center justify-between mb-6 relative z-10">
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
                        <div className="text-yellow-400/80 text-sm font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Le bordel cosmique commence ici
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
            <div className="flex-1 grid grid-cols-12 gap-6 relative z-10">

                {/* LEFT COLUMN - Leaderboard */}
                <div className="col-span-5">
                    <Leaderboard teams={teams} lastScoringTeam={lastScoringTeam} />
                </div>

                {/* CENTER COLUMN - Timer + Stats */}
                <div className="col-span-3 flex flex-col gap-6">
                    <GiantTimer seconds={sessionNight && sessionNight.status !== 'DRAFT' && sessionNight.tickRemainingSeconds !== null ? sessionNight.tickRemainingSeconds : globalTimer} />

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
    );
}
