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
const NEXUS_URL = `${window.location.protocol}//${window.location.hostname}:5174/nexus`;

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
                className="bg-black/90 border-2 border-purple-500 rounded-3xl p-12 text-center max-w-2xl shadow-[0_0_50px_rgba(168,85,247,0.5)]"
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
                <div className="text-white/60 text-lg">
                    Découvert par l'équipe <span className="text-purple-400 font-bold">{team}</span>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FIREWORKS CANVAS
// ═══════════════════════════════════════════════════════════════════════════

function FireworksCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const COLORS = ['#ff0', '#f0f', '#0ff', '#f80', '#0f8', '#80f', '#fff'];

        function createFirework(x, y) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            for (let i = 0; i < 80; i++) {
                const angle = (Math.PI * 2 * i) / 80;
                const speed = 2 + Math.random() * 5;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color,
                    size: 2 + Math.random() * 3,
                    decay: 0.012 + Math.random() * 0.01,
                    gravity: 0.08,
                });
            }
        }

        const launchInterval = setInterval(() => {
            const x = 100 + Math.random() * (canvas.width - 200);
            const y = 50 + Math.random() * (canvas.height * 0.6);
            createFirework(x, y);
        }, 600);

        setTimeout(() => createFirework(canvas.width * 0.25, canvas.height * 0.3), 100);
        setTimeout(() => createFirework(canvas.width * 0.75, canvas.height * 0.3), 400);
        setTimeout(() => createFirework(canvas.width * 0.5, canvas.height * 0.2), 700);

        let animId;
        function animate() {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy;
                p.vy += p.gravity; p.vx *= 0.98;
                p.alpha -= p.decay;
                if (p.alpha <= 0) { particles.splice(i, 1); continue; }
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            animId = requestAnimationFrame(animate);
        }
        animate();

        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        return () => { clearInterval(launchInterval); cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

// ═══════════════════════════════════════════════════════════════════════════
// PODIUM OVERLAY — Phase 1: Top 3 Univers | Phase 2: Classement Général
// ═══════════════════════════════════════════════════════════════════════════

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = ['h-40', 'h-28', 'h-20'];
const PODIUM_COLORS = [
    { bg: 'from-yellow-500 to-amber-600', border: 'border-yellow-400', text: 'text-yellow-300', glow: 'rgba(251,191,36,0.6)' },
    { bg: 'from-slate-400 to-slate-500', border: 'border-slate-300', text: 'text-slate-200', glow: 'rgba(148,163,184,0.5)' },
    { bg: 'from-amber-700 to-amber-800', border: 'border-amber-600', text: 'text-amber-400', glow: 'rgba(180,83,9,0.5)' },
];
const PODIUM_ORDER = [1, 0, 2]; // Affichage: 2e, 1er, 3e

function PodiumOverlay({ data }) {
    const [phase, setPhase] = useState('podium');

    useEffect(() => {
        const t = setTimeout(() => setPhase('ranking'), 10000);
        return () => clearTimeout(t);
    }, []);

    const top3 = data?.top3 || [];
    const ranking = data?.generalRanking || [];
    const universeName = data?.universeName || data?.universeId || 'UNIVERS';

    return (
        <motion.div
            className="fixed inset-0 z-[300] overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a0020 0%, #000 60%)' }}
        >
            <FireworksCanvas />

            {/* Stars */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(60)].map((_, i) => (
                    <motion.div key={i} className="absolute rounded-full bg-white"
                        style={{ width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* PHASE 1 : PODIUM */}
                {phase === 'podium' && (
                    <motion.div key="podium"
                        className="relative z-10 flex flex-col items-center justify-center h-full px-8"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -80 }}
                    >
                        <motion.div className="text-center mb-10"
                            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                        >
                            <div className="text-cyan-400 text-sm font-mono tracking-[0.5em] uppercase mb-2">Fin de l'Univers</div>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-wider"
                                style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {universeName}
                            </h1>
                            <motion.div className="mt-3 text-4xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏆</motion.div>
                        </motion.div>

                        {/* Podium */}
                        <div className="flex items-end justify-center gap-4 w-full max-w-3xl">
                            {PODIUM_ORDER.map((rank, displayIdx) => {
                                const team = top3[rank];
                                if (!team) return <div key={displayIdx} className="w-40" />;
                                const style = PODIUM_COLORS[rank];
                                const isFirst = rank === 0;
                                return (
                                    <motion.div key={rank} className="flex flex-col items-center"
                                        initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 + displayIdx * 0.2, type: 'spring', stiffness: 120 }}
                                    >
                                        <motion.div
                                            className={`relative mb-2 px-4 py-3 rounded-2xl border-2 ${style.border} text-center min-w-[130px]`}
                                            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))', boxShadow: `0 0 30px ${style.glow}` }}
                                            animate={isFirst ? { boxShadow: [`0 0 20px ${style.glow}`, `0 0 50px ${style.glow}`, `0 0 20px ${style.glow}`] } : {}}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <div className="text-3xl mb-1">{MEDAL[rank]}</div>
                                            <div className={`font-black text-sm uppercase ${style.text}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>{team.teamName}</div>
                                            <div className="text-white/60 text-xs mt-1 font-mono">{team.points.toLocaleString()} pts</div>
                                        </motion.div>
                                        <div className={`w-36 ${PODIUM_HEIGHTS[rank]} rounded-t-xl bg-gradient-to-t ${style.bg} border-t-2 border-x-2 ${style.border} flex items-start justify-center pt-2`}>
                                            <span className="text-white/40 font-black text-2xl" style={{ fontFamily: 'Orbitron' }}>{rank + 1}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <motion.div className="mt-10 text-white/30 text-xs font-mono tracking-widest"
                            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
                            CLASSEMENT GÉNÉRAL DANS QUELQUES SECONDES...
                        </motion.div>
                    </motion.div>
                )}

                {/* PHASE 2 : CLASSEMENT GÉNÉRAL */}
                {phase === 'ranking' && (
                    <motion.div key="ranking"
                        className="relative z-10 flex flex-col items-center justify-center h-full px-8"
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    >
                        <motion.div className="text-center mb-8"
                            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        >
                            <div className="text-purple-400 text-sm font-mono tracking-[0.5em] uppercase mb-2">Session Night</div>
                            <h1 className="text-5xl font-black uppercase tracking-wider"
                                style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Classement Général
                            </h1>
                        </motion.div>

                        <div className="w-full max-w-2xl space-y-3">
                            {ranking.slice(0, 8).map((team, i) => (
                                <motion.div key={team.teamId}
                                    className="flex items-center gap-4 px-5 py-3 rounded-xl"
                                    style={{
                                        background: i === 0 ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(0,0,0,0.5))' : 'rgba(255,255,255,0.04)',
                                        border: i === 0 ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: i === 0 ? '0 0 20px rgba(251,191,36,0.2)' : 'none',
                                    }}
                                    initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 + i * 0.08, type: 'spring' }}
                                >
                                    <div className="text-2xl w-8 text-center">{i < 3 ? MEDAL[i] : `${i + 1}.`}</div>
                                    <div className="flex-1 font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{team.teamName}</div>
                                    <div className="font-mono text-cyan-400 font-bold text-lg">
                                        {(team.score || 0).toLocaleString()} <span className="text-xs text-white/40">pts</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div className="mt-8 text-white/20 text-xs font-mono tracking-widest"
                            animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }}>
                            EN ATTENTE DU GAME MASTER...
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase toggle */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                <button onClick={() => setPhase('podium')}
                    className={`px-4 py-2 rounded-full text-xs font-mono transition-all ${phase === 'podium' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                    🏆 Podium
                </button>
                <button onClick={() => setPhase('ranking')}
                    className={`px-4 py-2 rounded-full text-xs font-mono transition-all ${phase === 'ranking' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                    📊 Classement
                </button>
            </div>
        </motion.div>
    );
}


function UniverseSwitchOverlay({ universeName, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-[#030712]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
                <motion.div
                    className="absolute inset-0 border-[20px] border-cyan-500/20"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>

            <motion.div
                className="relative z-10 text-center"
                initial={{ letterSpacing: '2em', opacity: 0, scale: 0.8 }}
                animate={{ letterSpacing: '0.5em', opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            >
                <div className="text-cyan-500 text-sm mb-4 font-mono tracking-[1em]">TRANSITION QUANTIQUE EN COURS...</div>
                <h1 className="text-7xl font-bold font-orbitron bg-gradient-to-r from-purple-400 via-white to-cyan-400 bg-clip-text text-transparent italic">
                    {universeName || 'UNIVERS SUIVANT'}
                </h1>
                <div className="mt-8 h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            </motion.div>

            {/* Scanning lines */}
            <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_cyan]"
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 0.5, repeat: 4 }}
            />
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 HAPPENING OVERLAY — Transmission Cinématique
// ═══════════════════════════════════════════════════════════════════════════

function HappeningOverlay({ data, onClose }) {
    // data = { videoUrl, title, subtitle, description, effectType, effectDuration, bonusLabel, color }
    const [countdown, setCountdown] = useState(data.effectDuration || 300);
    const [phase, setPhase] = useState('intro'); // intro → video → bonus
    const videoRef = useRef(null);
    const color = data.color || '#00d4ff';

    // Phase intro (3s) → video → bonus
    useEffect(() => {
        const t1 = setTimeout(() => setPhase('video'), 3000);
        return () => clearTimeout(t1);
    }, []);

    // Countdown du bonus
    useEffect(() => {
        if (phase !== 'bonus') return;
        if (countdown <= 0) { onClose(); return; }
        const t = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [phase, countdown, onClose]);

    const handleVideoEnd = () => setPhase('bonus');
    const handleVideoError = () => setPhase('bonus'); // Fallback si pas de vidéo

    const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <motion.div
            className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.95)' }}
        >
            {/* Scanlines TV effect */}
            <div className="absolute inset-0 pointer-events-none z-10"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                    backgroundSize: '100% 4px'
                }}
            />

            {/* Color glow corners */}
            <div className="absolute inset-0 pointer-events-none z-0" style={{
                boxShadow: `inset 0 0 150px ${color}44`
            }} />

            {/* Animated border */}
            <motion.div
                className="absolute inset-4 border-2 rounded-lg pointer-events-none z-10"
                style={{ borderColor: color }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* PHASE: INTRO */}
            <AnimatePresence mode="wait">
                {phase === 'intro' && (
                    <motion.div key="intro" className="relative z-20 text-center px-8"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Transmission header */}
                        <motion.div
                            className="text-xs font-mono tracking-[0.5em] mb-6 uppercase"
                            style={{ color }}
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.5, repeat: 6 }}
                        >
                            ●●● TRANSMISSION ENTRANTE ●●●
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-7xl font-black mb-4"
                            style={{ fontFamily: 'Orbitron, sans-serif', color, textShadow: `0 0 40px ${color}` }}
                            initial={{ letterSpacing: '0.5em' }}
                            animate={{ letterSpacing: '0.05em' }}
                            transition={{ duration: 1 }}
                        >
                            {data.title}
                        </motion.h1>

                        <motion.p
                            className="text-xl text-white/70 font-mono"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            {data.subtitle}
                        </motion.p>

                        {/* Static noise bars */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div key={i}
                                className="absolute left-0 right-0 h-8 opacity-20"
                                style={{ top: `${20 + i * 30}%`, background: `repeating-linear-gradient(90deg, ${color}22, transparent 3px, ${color}11 6px)` }}
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 0.3 + i * 0.1, repeat: Infinity, ease: 'linear' }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* PHASE: VIDEO */}
                {phase === 'video' && (
                    <motion.div key="video" className="relative z-20 w-full max-w-4xl px-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Video frame */}
                        <div className="relative rounded-lg overflow-hidden" style={{ border: `3px solid ${color}`, boxShadow: `0 0 60px ${color}66` }}>
                            {/* VHS header bar */}
                            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-2"
                                style={{ background: 'rgba(0,0,0,0.8)' }}>
                                <motion.div className="w-2 h-2 rounded-full" style={{ background: color }}
                                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                                <span className="text-xs font-mono" style={{ color }}>LIVE ● REC</span>
                                <span className="text-xs font-mono text-white/40 ml-auto">CH.07 — TRANSMISSION SÉCURISÉE</span>
                            </div>

                            <video
                                ref={videoRef}
                                src={data.videoUrl}
                                autoPlay
                                playsInline
                                onEnded={handleVideoEnd}
                                onError={handleVideoError}
                                className="w-full aspect-video object-cover"
                                style={{ filter: 'contrast(1.1) saturate(0.9)' }}
                            />

                            {/* CRT overlay */}
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: `radial-gradient(ellipse at center, transparent 60%, ${color}22 100%)` }} />
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-white/60 font-mono text-sm">{data.description}</p>
                        </div>
                    </motion.div>
                )}

                {/* PHASE: BONUS ACTIF */}
                {phase === 'bonus' && (
                    <motion.div key="bonus" className="relative z-20 text-center px-8"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {/* Big x2 */}
                        <motion.div
                            className="text-[12rem] font-black leading-none"
                            style={{ fontFamily: 'Orbitron, sans-serif', color, textShadow: `0 0 80px ${color}, 0 0 160px ${color}88` }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        >
                            x2
                        </motion.div>

                        <motion.div
                            className="text-2xl font-bold text-white mb-4"
                            style={{ fontFamily: 'Orbitron, sans-serif' }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {data.bonusLabel}
                        </motion.div>

                        {/* Countdown */}
                        <motion.div
                            className="text-6xl font-mono font-bold"
                            style={{ color: countdown < 60 ? '#ef4444' : color }}
                            animate={{ opacity: countdown < 30 ? [1, 0.3, 1] : 1 }}
                            transition={{ duration: 0.5, repeat: countdown < 30 ? Infinity : 0 }}
                        >
                            {formatCountdown(countdown)}
                        </motion.div>
                        <div className="text-white/30 text-xs font-mono mt-2 tracking-widest">TEMPS RESTANT</div>

                        {/* Particle burst */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div key={i}
                                className="absolute w-3 h-3 rounded-full"
                                style={{ background: color, left: '50%', top: '50%' }}
                                animate={{
                                    x: Math.cos(i * 30 * Math.PI / 180) * (150 + Math.random() * 100),
                                    y: Math.sin(i * 30 * Math.PI / 180) * (150 + Math.random() * 100),
                                    opacity: [1, 0],
                                    scale: [1, 0]
                                }}
                                transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity, repeatDelay: 2 }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close button (phase bonus only) */}
            {phase === 'bonus' && (
                <button
                    onClick={onClose}
                    className="absolute bottom-8 right-8 z-30 px-4 py-2 rounded-lg text-xs font-mono text-white/30 hover:text-white/70 border border-white/10 hover:border-white/30 transition-all"
                >
                    Fermer
                </button>
            )}
        </motion.div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════
// 🎬 VIDEO OVERLAY — Vidéo plein écran déclenchée par l'admin
// ═══════════════════════════════════════════════════════════════════════════

function VideoOverlay({ url, onClose }) {
    return (
        <motion.div
            className="fixed inset-0 z-[600] bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            <video
                src={url}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onEnded={onClose}
                onError={onClose}
            />
            <button
                onClick={onClose}
                className="absolute bottom-6 right-6 z-10 text-white/20 hover:text-white/60 text-xs font-mono border border-white/10 hover:border-white/30 px-4 py-2 rounded transition-all"
            >
                ■ Fermer
            </button>
        </motion.div>
    );
}

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

    // Debug / Theme override
    const [showDebug, setShowDebug] = useState(false);
    const [localTheme, setLocalTheme] = useState(null);


    // Session Night Overlays
    const [podiumData, setPodiumData] = useState(null);
    const [universeSwitchName, setUniverseSwitchName] = useState(null);
    const [happeningData, setHappeningData] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);

    // Handlers stables pour éviter le reset des timers dans les enfants
    const handleCloseAlert = useCallback(() => setAlertMode(false), []);
    const handleCloseGlitch = useCallback(() => setGlitchMode(false), []);
    const handleCloseUnlock = useCallback(() => setUnlockPopup(null), []);
    const handleClosePodium = useCallback(() => setPodiumData(null), []);
    const handleCloseUniverseSwitch = useCallback(() => setUniverseSwitchName(null), []);

    // Tracking for transitions
    const prevStatusRef = useRef();
    const prevUniverseIndexRef = useRef();

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
            case 'TRIGGER_HAPPENING':
                setHappeningData(payload);
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

        // --- Session Night Special Listeners ---
        socket.on('sessionNight:universeWinner', (data) => {
            console.log('🏆 Podium data received:', data);
            setPodiumData(data); // { universeId, universeName, top3, generalRanking }
        });

        // --- Video Overlay ---
        socket.on('warroom:video', ({ url }) => {
            setVideoUrl(url || null);
        });

        return () => {
            socket.off('warroom:command', handleWarRoomCommand);
            socket.off('sessionNight:universeWinner');
            socket.off('warroom:video');
        };
    }, [socket, handleWarRoomCommand, gameState.teams]);

    // Session Night Transitions Monitor
    useEffect(() => {
        if (!gameState.sessionNight) return;
        const sn = gameState.sessionNight;

        // 1. Detect New Universe Switch → close podium + show transition
        if (sn.status === 'UNIVERSE_ACTIVE' && prevStatusRef.current !== 'UNIVERSE_ACTIVE') {
            const currentUniv = sn.universes[sn.currentUniverseIndex];
            if (currentUniv) {
                setUniverseSwitchName(currentUniv.universeId.toUpperCase().replace('_', ' '));
            }
            // Fermer le podium si on passe à un nouvel univers
            setPodiumData(null);
        }

        prevStatusRef.current = sn.status;
        prevUniverseIndexRef.current = sn.currentUniverseIndex;
    }, [gameState.sessionNight]);

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
                        onClose={handleCloseUnlock}
                    />
                )}
                {podiumData && (
                    <PodiumOverlay
                        data={podiumData}
                    />
                )}
                {universeSwitchName && (
                    <UniverseSwitchOverlay
                        universeName={universeSwitchName}
                        onClose={handleCloseUniverseSwitch}
                    />
                )}
                {happeningData && (
                    <HappeningOverlay
                        data={happeningData}
                        onClose={() => setHappeningData(null)}
                    />
                )}
                {videoUrl && (
                    <VideoOverlay
                        url={videoUrl}
                        onClose={() => setVideoUrl(null)}
                    />
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════════════════
                 SESSION NIGHT VIDEO OVERLAY
            ═══════════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {gameState.sessionNight && (['INTRO', 'UNIVERSE_INTRO'].includes(gameState.sessionNight.status)) && (
                    <motion.div
                        className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* THE CINEMATIC EXPERIENCE */}
                        <video
                            src={gameState.sessionNight.introVideoUrl || '/video/intro.mp4'} // Default fallback
                            className="w-full h-full object-cover"
                            autoPlay
                            muted={false} // Ensure audio is on (might need user interaction policy check on some browsers)
                            controls={false} // Hide controls for cinematic feel
                            onEnded={() => {
                                console.log("🎬 Intro Video Ended. Signaling server...");
                                if (gameState.sessionNight.status === 'INTRO') {
                                    socket.emit('admin:action', { type: 'SESSION_INTRO_END' });
                                }
                            }}
                        />

                        {/* Overlay text for context if needed */}
                        <div className="absolute bottom-10 right-10 flex items-center gap-4 opacity-50">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white font-mono text-xs tracking-[0.3em]">INCOMING TRANSMISSION</span>
                        </div>
                    </motion.div>
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
        </div >
    );
}
