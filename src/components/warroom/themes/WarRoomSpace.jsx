import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UNIVERSES } from '../../../data/universes';

// Starfield Component (Optimized CSS/Canvas alternative)
const Starfield = () => {
    // Generate static stars to avoid heavy runtime calculation
    const stars = useMemo(() => {
        return Array.from({ length: 100 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden z-0">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute rounded-full bg-white opacity-80"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                    animate={{
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}
            {/* Nebula Fog Layers */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent opacity-30" />
        </div>
    );
};

export default function WarRoomSpace({ gameState, lastScoringTeam, NEXUS_URL }) {
    const { teams: socketTeams, history, globalTimer } = gameState;
    const [serverTeams, setServerTeams] = useState(null);

    // Polling de secours pour récupérer les données brutes (contourne le filtre getPublicTeam)
    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await fetch('/api/state', {
                    headers: { 'x-api-key': 'multivers_secret_2026' }
                });
                console.log('🔄 Polling /api/state...', res.status);
                if (res.ok) {
                    const data = await res.json();
                    console.log('📦 Data received:', Object.keys(data.teams).length, 'teams');
                    setServerTeams(data.teams);
                }
            } catch (e) { console.error("Poll error", e); }
        };
        fetchState();
        const interval = setInterval(fetchState, 5000);
        return () => clearInterval(interval);
    }, []);

    const teams = serverTeams || socketTeams;

    // ACTIVITY CAROUSEL
    const activities = useMemo(() => Object.values(UNIVERSES.odyssee_spatiale.activities), []);
    const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentActivityIndex(prev => (prev + 1) % activities.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activities.length]);

    const currentActivity = activities[currentActivityIndex];

    const activitySortedTeams = useMemo(() => {
        return Object.values(teams).map(team => {
            // Retrieve specific activity score from history array
            const actData = (team.completedActivities || []).find(a => a.activityId === currentActivity.id);
            const actScore = actData ? actData.points : 0;
            return { ...team, actScore };
        }).sort((a, b) => b.actScore - a.actScore).slice(0, 5);
    }, [teams, currentActivity]);

    // Formatage Timer
    const formatTime = (s) => {
        const mins = Math.floor(s / 60).toString().padStart(2, '0');
        const secs = (s % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const isCriticalTime = globalTimer < 10 && globalTimer > 0;
    const isFinished = globalTimer === 0;

    return (
        <div className="relative w-full h-screen bg-[#0A0F1C] text-[#F5F7FA] overflow-hidden flex flex-col font-['Orbitron',_sans-serif] selection:bg-cyan-500/30">

            {/* BACKGROUND */}
            <Starfield />
            {/* Volumetric Light from Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-blue-500/10 blur-[100px] pointer-events-none z-0" />

            {/* 1️⃣ HEADER - 15% */}
            <header className="relative z-10 h-[15%] flex flex-col justify-center items-center">
                <h2 className="text-cyan-400 tracking-[0.3em] text-sm uppercase mb-1 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                    UNIVERS : POP CULTURE – SECTEUR SPATIAL
                </h2>
                <h1 className="text-3xl md:text-5xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    CONTRÔLE DE MISSION
                </h1>
                {/* Sweeping Line */}
                <div className="absolute bottom-4 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50">
                    <motion.div
                        className="h-[2px] w-[10%] bg-cyan-400 blur-[2px]"
                        animate={{ x: ['-100%', '1000%'] }} // 1000% ensures it goes off screen
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </header>

            {/* 2️⃣ CENTRAL TIMER - 35% */}
            <section className="relative z-10 h-[35%] flex flex-col items-center justify-center">
                <motion.div
                    className={`text-[12rem] leading-none font-bold tabular-nums tracking-tighter
                        ${isCriticalTime ? 'text-[#FF3B3B] drop-shadow-[0_0_30px_rgba(255,59,59,0.8)]' : 'text-white drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]'}
                    `}
                    animate={isCriticalTime ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    {formatTime(globalTimer)}
                </motion.div>
                {isCriticalTime && (
                    <motion.div
                        className="text-[#FF3B3B] tracking-[0.5em] text-xl font-bold mt-4 animate-pulse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        DÉFAILLANCE CRITIQUE IMMINENTE
                    </motion.div>
                )}
            </section>

            {/* 3️⃣ MISSION INFO - 15% */}
            <section className="relative z-10 h-[15%] flex justify-center items-start pt-4">
                <div className="
                    backdrop-blur-md bg-blue-900/10 border border-cyan-500/30
                    px-12 py-6 rounded-lg relative overflow-hidden
                    shadow-[0_0_30px_rgba(0,229,255,0.1)]
                    min-w-[40%] text-center
                ">
                    {/* Glass Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-150%] animate-shine" />

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-cyan-300 text-sm tracking-widest uppercase border-b border-cyan-500/20 pb-1">
                            <span>Objectif Actuel</span>
                            <span>Secteur 7G</span>
                        </div>
                        <div className="text-xl md:text-2xl font-light text-white tracking-wide font-sans">
                            Survivre à la Route de Kessel
                        </div>
                    </div>
                </div>
            </section>

            {/* 4️⃣ ACTIVITY CAROUSEL */}
            <section className="relative z-10 h-[25%] flex flex-col justify-center items-center px-8">
                <motion.div
                    key={currentActivity.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="mb-4 text-center z-20"
                >
                    <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm bg-black/40 px-4 py-1 rounded border border-cyan-500/30 backdrop-blur-sm inline-block">
                        DÉFI : {currentActivity.name}
                    </h3>
                    <div className="text-xs text-cyan-600 mt-1 font-mono uppercase">{currentActivity.film}</div>
                </motion.div>

                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-5 gap-4">
                    <AnimatePresence mode="popLayout">
                        {activitySortedTeams.map((team, index) => (
                            <motion.div
                                key={`${currentActivity.id}-${team.id}`}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                className={`
                                    relative flex flex-col items-center justify-center p-3 rounded-md
                                    border border-t-2
                                    ${index === 0
                                        ? 'bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.2)]'
                                        : 'bg-gradient-to-b from-cyan-900/20 to-transparent border-cyan-500/30'
                                    }
                                    ${lastScoringTeam === team.id ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0A0F1C]' : ''}
                                `}
                            >
                                {/* Rank */}
                                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${index === 0 ? 'text-yellow-400' : 'text-cyan-500'}`}>
                                    #{index + 1}
                                </div>
                                {/* Name */}
                                <div className="text-lg font-bold text-white truncate w-full text-center">
                                    {team.name}
                                </div>
                                {/* Score */}
                                <div className={`text-2xl font-mono mt-1 ${index === 0 ? 'text-yellow-300' : 'text-cyan-300'}`}>
                                    {team.actScore} pts
                                </div>

                                {/* Hologram Scanline */}
                                <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none opacity-20">
                                    <div className="w-full h-[2px] bg-white absolute top-0 animate-scan" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </section>

            {/* 5️⃣ FOOTER - 10% */}
            <footer className="relative z-10 h-[10%] bg-[#050810] border-t border-white/10 flex items-center overflow-hidden">
                <div className="flex items-center px-4 h-full border-r border-white/10 bg-cyan-900/10 z-20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                    <span className="text-xs text-cyan-400 tracking-widest font-bold">FLUX EN DIRECT</span>
                </div>

                <div className="flex-1 overflow-hidden relative flex items-center">
                    <motion.div
                        className="whitespace-nowrap text-lg text-cyan-200/80 font-mono tracking-wider flex gap-12"
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <span>Systèmes Nominaux...</span>
                        <span>Prochain Événement : CHAMP D'ASTÉROÏDES...</span>
                        {history.length > 0 && <span>Dernier : {history[0].message}</span>}
                        <span>Boucliers : 100%...</span>
                        <span>Coordonnées Hyperespace Verrouillées...</span>
                    </motion.div>
                </div>
            </footer>

            {/* DEBUGGER FORCE */}
            {teams && (
                <div className="fixed bottom-32 right-4 w-64 max-h-64 bg-black/90 text-green-400 p-2 overflow-auto z-50 text-[9px] font-mono border border-green-500 rounded opacity-90 pointer-events-auto">
                    <div className="border-b border-green-500 mb-1 font-bold">DEBUG MONITOR</div>
                    {Object.values(teams).map(t => (
                        <div key={t.id} className="mb-2 border-b border-gray-800 pb-1">
                            <div className="text-white font-bold">{t.name}</div>
                            <div>Sc:{t.score} | Act:{t.actScore}</div>
                            <div className="text-gray-400 break-all leading-tight">
                                {JSON.stringify(t.completedActivities?.map(a => `${a.activityId}:${a.points}`) || [])}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* GLOBAL ANIMATIONS */}
            <style>{`
                @keyframes shine {
                    0% { transform: translateX(-150%) skewX(-12deg); }
                    100% { transform: translateX(150%) skewX(-12deg); }
                }
                .animate-shine {
                    animation: shine 4s ease-in-out infinite;
                }
                @keyframes scan {
                    0% { top: 0%; opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
