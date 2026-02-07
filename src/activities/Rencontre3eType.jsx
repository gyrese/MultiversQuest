/**
 * RENCONTRE DU 3ᵉ TYPE - Mini-jeu de séquence musicale
 * 
 * Grille 4x4 de 16 boutons avec 16 tons différents.
 * Le joueur doit reproduire la séquence de 5 notes du film.
 * Un bouton d'aide joue les 3 premières notes.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/PlayerContext';
import { UNIVERSES } from '../data/universes';

// Configuration des 16 notes sur la grille (4x4)
// Grille réorganisée pour inclure toutes les notes de la mélodie
const GRID_NOTES = [
    // Ligne 1 - Octave basse
    { id: 'C3', frequency: 130.81, color: '#ff6b6b', glow: '#ff6b6b' },
    { id: 'D3', frequency: 146.83, color: '#ffa502', glow: '#ffa502' },
    { id: 'E3', frequency: 164.81, color: '#ffd93d', glow: '#ffd93d' },
    { id: 'F3', frequency: 174.61, color: '#a8e6cf', glow: '#a8e6cf' },  // Fa grave (4ème note)
    // Ligne 2
    { id: 'G3', frequency: 196.00, color: '#6bcb77', glow: '#6bcb77' },
    { id: 'A3', frequency: 220.00, color: '#4d96ff', glow: '#4d96ff' },
    { id: 'B3', frequency: 246.94, color: '#6c5ce7', glow: '#6c5ce7' },
    { id: 'C4', frequency: 261.63, color: '#a855f7', glow: '#a855f7' },  // Do (5ème note)
    // Ligne 3
    { id: 'D4', frequency: 293.66, color: '#ec4899', glow: '#ec4899' },
    { id: 'E4', frequency: 329.63, color: '#f472b6', glow: '#f472b6' },
    { id: 'F4', frequency: 349.23, color: '#06b6d4', glow: '#06b6d4' },  // Fa (3ème note)
    { id: 'G4', frequency: 392.00, color: '#14b8a6', glow: '#14b8a6' },  // Sol (1ère note)
    // Ligne 4
    { id: 'A4', frequency: 440.00, color: '#10b981', glow: '#10b981' },  // La (2ème note)
    { id: 'B4', frequency: 493.88, color: '#84cc16', glow: '#84cc16' },
    { id: 'C5', frequency: 523.25, color: '#eab308', glow: '#eab308' },
    { id: 'D5', frequency: 587.33, color: '#f59e0b', glow: '#f59e0b' },
];

// La séquence du film: Sol – La – Fa – Fa (octave en-dessous) – Do
// G4 - A4 - F4 - F3 - C4
const ORIGINAL_SEQUENCE = ['G4', 'A4', 'F4', 'F3', 'C4'];
const SEQUENCE_POSITIONS = [11, 12, 10, 3, 7]; // Positions dans la grille

// Audio Context
let audioContext = null;

function playNote(frequency, duration = 0.6) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Composant UFO animé
function UFO({ delay = 0, duration = 15, startX = -10, endX = 110, y = 20, size = 40 }) {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ top: `${y}%`, fontSize: size }}
            initial={{ x: `${startX}vw`, opacity: 0 }}
            animate={{
                x: `${endX}vw`,
                opacity: [0, 1, 1, 0],
                y: [0, -20, 10, -15, 0],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'linear',
            }}
        >
            🛸
        </motion.div>
    );
}

// Composant étoile filante
function ShootingStar({ delay = 0 }) {
    const startX = Math.random() * 50;
    const startY = Math.random() * 30;

    return (
        <motion.div
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
                left: `${startX}%`,
                top: `${startY}%`,
                boxShadow: '0 0 4px #fff, 0 0 8px #fff',
            }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
                opacity: [0, 1, 0],
                x: 200,
                y: 200,
            }}
            transition={{
                duration: 1,
                delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 10 + 5,
            }}
        />
    );
}

export default function Rencontre3eType({ universeId = 'odyssee_spatiale', onComplete, onExit }) {
    const { actions } = useGame();
    const [phase, setPhase] = useState('intro');
    const [playerSequence, setPlayerSequence] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [totalClicks, setTotalClicks] = useState(0);
    const [score, setScore] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [isPlayingHint, setIsPlayingHint] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);

    const activityConfig = UNIVERSES[universeId]?.activities?.rencontre_3e_type;
    const basePoints = activityConfig?.maxPoints || 300;

    // Générer les étoiles une seule fois
    const stars = useMemo(() =>
        [...Array(80)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
        })), []
    );

    const playHint = useCallback(async () => {
        if (isPlayingHint) return;
        setIsPlayingHint(true);
        setHintUsed(true);

        for (let i = 0; i < 3; i++) {
            const noteId = ORIGINAL_SEQUENCE[i];
            const note = GRID_NOTES.find(n => n.id === noteId);
            if (note) {
                setActiveNote(SEQUENCE_POSITIONS[i]);
                playNote(note.frequency, 0.7);
                await new Promise(resolve => setTimeout(resolve, 700));
            }
        }

        setActiveNote(null);
        setIsPlayingHint(false);
    }, [isPlayingHint]);

    const handleNoteClick = (index) => {
        if (phase !== 'play' || isPlayingHint) return;

        const note = GRID_NOTES[index];
        playNote(note.frequency, 0.5);
        setActiveNote(index);

        const newTotalClicks = totalClicks + 1;
        setTotalClicks(newTotalClicks);

        setTimeout(() => setActiveNote(null), 200);

        const currentPosition = playerSequence.length;
        const expectedNote = ORIGINAL_SEQUENCE[currentPosition];

        if (note.id === expectedNote) {
            const newSequence = [...playerSequence, note.id];
            setPlayerSequence(newSequence);

            if (newSequence.length === ORIGINAL_SEQUENCE.length) {
                setPhase('success');

                let clickBonus = 0;
                if (newTotalClicks <= 10) {
                    clickBonus = 100;
                } else if (newTotalClicks <= 15) {
                    clickBonus = 50;
                } else if (newTotalClicks <= 20) {
                    clickBonus = 25;
                }

                setBonus(clickBonus);
                setScore(basePoints + clickBonus);
            }
        } else {
            setPlayerSequence([]);
            if (note.id === ORIGINAL_SEQUENCE[0]) {
                setPlayerSequence([note.id]);
            }
        }
    };

    const handleStart = () => {
        setPhase('play');
        setPlayerSequence([]);
        setTotalClicks(0);
    };

    const handleComplete = () => {
        actions.completeActivity(universeId, 'rencontre_3e_type', score);
        if (onComplete) onComplete(score);
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#020817]">
            {/* Fond IA généré */}
            <div className="absolute inset-0">
                {/* Image de fond */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/backgrounds/rencontre3etype.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                {/* Overlay pour lisibilité */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                    }}
                />

                {/* Étoiles */}
                {stars.map(star => (
                    <motion.div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: star.size,
                            height: star.size,
                        }}
                        animate={{
                            opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: star.duration,
                            repeat: Infinity,
                            delay: star.delay,
                        }}
                    />
                ))}

                {/* Étoiles filantes */}
                <ShootingStar delay={2} />
                <ShootingStar delay={7} />
                <ShootingStar delay={12} />

                {/* UFOs en arrière-plan */}
                <UFO delay={0} duration={20} startX={-5} endX={105} y={15} size={24} />
                <UFO delay={5} duration={25} startX={105} endX={-5} y={35} size={18} />
                <UFO delay={10} duration={18} startX={-5} endX={105} y={70} size={20} />
                <UFO delay={15} duration={22} startX={105} endX={-5} y={85} size={16} />

                {/* Planète lointaine */}
                <motion.div
                    className="absolute right-10 top-20 w-16 h-16 rounded-full opacity-40"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #818cf8, #4338ca, #1e1b4b)',
                        boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
                    }}
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />

                {/* Lune */}
                <motion.div
                    className="absolute left-8 bottom-32 w-8 h-8 rounded-full opacity-60"
                    style={{
                        background: 'radial-gradient(circle at 40% 40%, #f1f5f9, #94a3b8, #475569)',
                        boxShadow: '0 0 20px rgba(241, 245, 249, 0.2)',
                    }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10 p-4 border-b border-indigo-500/20 bg-black/40 backdrop-blur-md">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExit}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all"
                    >
                        ← Retour
                    </motion.button>
                    <div className="text-center">
                        <h1 className="font-orbitron text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Rencontre du 3ᵉ Type
                        </h1>
                        <p className="text-xs text-indigo-300/70">Communication Extraterrestre</p>
                    </div>
                    <div className="text-right min-w-[60px]">
                        <p className="text-xs text-indigo-300/50">Clics</p>
                        <motion.p
                            key={totalClicks}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            className={`font-mono font-bold text-lg ${totalClicks <= 10 ? 'text-emerald-400' :
                                totalClicks <= 15 ? 'text-yellow-400' :
                                    totalClicks <= 20 ? 'text-orange-400' : 'text-slate-400'
                                }`}
                        >
                            {totalClicks}
                        </motion.p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {/* INTRO */}
                    {phase === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center max-w-md px-4"
                        >
                            {/* Grand vaisseau central */}
                            <motion.div
                                className="relative mb-8"
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <motion.div
                                    className="text-8xl"
                                    animate={{
                                        filter: [
                                            'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))',
                                            'drop-shadow(0 0 40px rgba(168, 85, 247, 0.7))',
                                            'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))',
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    🛸
                                </motion.div>
                                {/* Faisceau lumineux */}
                                <motion.div
                                    className="absolute left-1/2 -translate-x-1/2 top-full w-16 h-32"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.6) 0%, transparent 100%)',
                                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                                    }}
                                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>

                            <motion.h2
                                className="font-orbitron text-3xl font-bold text-white mb-4"
                                style={{ textShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
                            >
                                Signal Détecté
                            </motion.h2>
                            <p className="text-indigo-200/80 mb-4 leading-relaxed">
                                Un vaisseau extraterrestre tente de communiquer à travers une
                                séquence de <span className="text-purple-400 font-bold">5 notes musicales</span>.
                            </p>
                            <p className="text-indigo-300/50 text-sm mb-8">
                                Trouvez les bonnes notes sur la grille et reproduisez la séquence.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(139, 92, 246, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="px-10 py-5 rounded-2xl font-bold text-lg text-white relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
                                }}
                            >
                                <span className="relative z-10">🎵 Initier le Contact</span>
                                <motion.div
                                    className="absolute inset-0 bg-white"
                                    initial={{ x: '-100%', opacity: 0 }}
                                    whileHover={{ x: '100%', opacity: 0.2 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PLAY */}
                    {phase === 'play' && (
                        <motion.div
                            key="play"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md px-4"
                        >
                            {/* Indicateur de progression */}
                            <div className="text-center mb-6">
                                <div className="flex gap-3 justify-center mb-2">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-5 h-5 rounded-full border-2 transition-all ${i < playerSequence.length
                                                ? 'bg-purple-500 border-purple-400'
                                                : 'bg-transparent border-indigo-500/30'
                                                }`}
                                            animate={i < playerSequence.length ? {
                                                scale: [1, 1.3, 1],
                                                boxShadow: ['0 0 10px #a855f7', '0 0 25px #a855f7', '0 0 10px #a855f7'],
                                            } : {}}
                                            transition={{ duration: 0.3 }}
                                        />
                                    ))}
                                </div>
                                <p className="text-indigo-300/70 text-sm font-mono">
                                    Note {playerSequence.length + 1} / 5
                                </p>
                            </div>

                            {/* Bouton Indice */}
                            <div className="text-center mb-6">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={playHint}
                                    disabled={isPlayingHint}
                                    className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all border ${isPlayingHint
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 cursor-wait'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                        }`}
                                >
                                    {isPlayingHint ? (
                                        <span className="flex items-center gap-2">
                                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                                                🔊
                                            </motion.span>
                                            Transmission...
                                        </span>
                                    ) : (
                                        <>🔊 Écouter les 3 premières notes</>
                                    )}
                                </motion.button>
                            </div>

                            {/* Grille 4x4 */}
                            <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl bg-black/30 border border-indigo-500/20 backdrop-blur-sm">
                                {GRID_NOTES.map((note, index) => {
                                    const isActive = activeNote === index;

                                    return (
                                        <motion.button
                                            key={note.id}
                                            whileHover={{ scale: 1.08, y: -2 }}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => handleNoteClick(index)}
                                            className="aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
                                            style={{
                                                background: isActive
                                                    ? `radial-gradient(circle, white 0%, ${note.color} 70%)`
                                                    : `linear-gradient(145deg, ${note.color}dd 0%, ${note.color}88 100%)`,
                                                boxShadow: isActive
                                                    ? `0 0 40px ${note.glow}, 0 0 80px ${note.glow}60, inset 0 0 20px rgba(255,255,255,0.3)`
                                                    : `0 4px 20px ${note.color}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
                                                border: `2px solid ${isActive ? 'white' : note.color}`,
                                            }}
                                            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <motion.span
                                                className="text-3xl"
                                                style={{
                                                    filter: isActive ? 'brightness(2)' : 'brightness(1)',
                                                    textShadow: isActive ? '0 0 20px white' : 'none',
                                                }}
                                            >
                                                ♪
                                            </motion.span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <p className="text-center text-indigo-400/40 text-xs mt-4">
                                Explorez les sons et reproduisez la séquence extraterrestre
                            </p>
                        </motion.div>
                    )}

                    {/* SUCCESS */}
                    {phase === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center max-w-md px-4"
                        >
                            {/* Célébration */}
                            <motion.div
                                className="relative mb-6"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <motion.div
                                    className="text-8xl"
                                    animate={{
                                        rotate: [0, 5, -5, 0],
                                        filter: [
                                            'drop-shadow(0 0 30px rgba(34, 197, 94, 0.6))',
                                            'drop-shadow(0 0 60px rgba(34, 197, 94, 0.9))',
                                            'drop-shadow(0 0 30px rgba(34, 197, 94, 0.6))',
                                        ]
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    🛸✨
                                </motion.div>
                            </motion.div>

                            <motion.h2
                                className="font-orbitron text-3xl font-bold text-emerald-400 mb-3"
                                animate={{
                                    textShadow: [
                                        '0 0 20px rgba(52, 211, 153, 0.5)',
                                        '0 0 40px rgba(52, 211, 153, 0.8)',
                                        '0 0 20px rgba(52, 211, 153, 0.5)',
                                    ],
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                Contact Établi !
                            </motion.h2>
                            <p className="text-emerald-200/70 mb-6">
                                Communication réussie avec les extraterrestres !
                            </p>

                            {/* Score Card */}
                            <motion.div
                                className="rounded-2xl p-6 mb-6 border border-emerald-500/30"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(4, 47, 46, 0.4) 100%)',
                                    boxShadow: '0 0 40px rgba(52, 211, 153, 0.1)',
                                }}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-emerald-300/60 text-sm mb-1">Points gagnés</p>
                                <motion.p
                                    className="font-orbitron text-5xl font-bold text-emerald-400"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.4 }}
                                >
                                    +{score}
                                </motion.p>

                                {bonus > 0 && (
                                    <motion.div
                                        className="mt-3 inline-block px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <span className="text-emerald-300 text-sm font-semibold">
                                            🎯 Bonus rapidité: +{bonus} pts
                                        </span>
                                    </motion.div>
                                )}

                                <p className="text-emerald-400/40 text-xs mt-3">
                                    Réussi en {totalClicks} clics
                                </p>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(52, 211, 153, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleComplete}
                                className="px-10 py-4 rounded-2xl font-bold text-lg text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    boxShadow: '0 0 30px rgba(52, 211, 153, 0.4)',
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                ✓ Continuer
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
