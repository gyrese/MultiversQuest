// ... imports conservés ...
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityScore } from '../hooks/useActivityScore';
import ActivityShell from '../components/activity/ActivityShell';
import { UNIVERSES } from '../data/universes';

// ... (Garder GRID_NOTES, ORIGINAL_SEQUENCE, audioContext, playNote, initAudio, UFO, ShootingStar inchangés) ...
// Pour simplifier l'appel à l'outil, je vais supposer que les fonctions helper sont conservées en dehors du composant exporté
// Cependant, comme je remplace tout le fichier, je dois réinclure les helpers s'ils ne sont pas importés. 
// Je vais supposer que l'implémentation précédente des helpers est correcte et je les réécris ici pour être sûr.
// Note: Dans un vrai IDE, j'aurais gardé les lignes inchangées. Ici je remplace tout le composant.

// ... (Je vais réécrire tout le fichier pour être propre et sûr)

// Configuration des 16 notes sur la grille (4x4)
const GRID_NOTES = [
    // Ligne 1 - Octave basse
    { id: 'C3', frequency: 130.81, color: '#ff6b6b', glow: '#ff6b6b' },
    { id: 'D3', frequency: 146.83, color: '#ffa502', glow: '#ffa502' },
    { id: 'E3', frequency: 164.81, color: '#ffd93d', glow: '#ffd93d' },
    { id: 'F3', frequency: 174.61, color: '#a8e6cf', glow: '#a8e6cf' },
    // Ligne 2
    { id: 'G3', frequency: 196.00, color: '#6bcb77', glow: '#6bcb77' },
    { id: 'A3', frequency: 220.00, color: '#4d96ff', glow: '#4d96ff' },
    { id: 'B3', frequency: 246.94, color: '#6c5ce7', glow: '#6c5ce7' },
    { id: 'C4', frequency: 261.63, color: '#a855f7', glow: '#a855f7' },
    // Ligne 3
    { id: 'D4', frequency: 293.66, color: '#ec4899', glow: '#ec4899' },
    { id: 'E4', frequency: 329.63, color: '#f472b6', glow: '#f472b6' },
    { id: 'F4', frequency: 349.23, color: '#06b6d4', glow: '#06b6d4' },
    { id: 'G4', frequency: 392.00, color: '#14b8a6', glow: '#14b8a6' },
    // Ligne 4
    { id: 'A4', frequency: 440.00, color: '#10b981', glow: '#10b981' },
    { id: 'B4', frequency: 493.88, color: '#84cc16', glow: '#84cc16' },
    { id: 'C5', frequency: 523.25, color: '#eab308', glow: '#eab308' },
    { id: 'D5', frequency: 587.33, color: '#f59e0b', glow: '#f59e0b' },
];

const ORIGINAL_SEQUENCE = ['G4', 'A4', 'F4', 'F3', 'C4'];
const SEQUENCE_POSITIONS = [11, 12, 10, 3, 7];

let audioContext = null;

async function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.001);
}

function playNote(frequency, duration = 0.6) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
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
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
        >
            🛸
        </motion.div>
    );
}

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
            animate={{ opacity: [0, 1, 0], x: 200, y: 200 }}
            transition={{ duration: 1, delay, repeat: Infinity, repeatDelay: Math.random() * 10 + 5 }}
        />
    );
}

export default function Rencontre3eType({ universeId = 'odyssee_spatiale', onComplete, onExit }) {
    const [phase, setPhase] = useState('intro');
    const [playerSequence, setPlayerSequence] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [totalClicks, setTotalClicks] = useState(0);
    const [isPlayingHint, setIsPlayingHint] = useState(false);

    // Initialisation du hook Activity Engine
    const {
        isPlaying,
        isCompleted,
        score,
        bonus,
        startActivity,
        recordAction,
        finalizeActivity
    } = useActivityScore(
        universeId,
        'rencontre_3e_type',
        {
            maxPoints: 300,
            activityType: 'sequence',
            onComplete
        }
    );

    // Initialisation des étoiles (inchangé)
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
        if (!isPlaying || isPlayingHint || isCompleted) return;

        const note = GRID_NOTES[index];
        playNote(note.frequency, 0.5);
        setActiveNote(index);

        // Enregistrer l'action (clic)
        recordAction(false);

        const newTotalClicks = totalClicks + 1;
        setTotalClicks(newTotalClicks);

        setTimeout(() => setActiveNote(null), 200);

        const currentPosition = playerSequence.length;
        const expectedNote = ORIGINAL_SEQUENCE[currentPosition];

        if (note.id === expectedNote) {
            const newSequence = [...playerSequence, note.id];
            setPlayerSequence(newSequence);

            if (newSequence.length === ORIGINAL_SEQUENCE.length) {
                // VICTOIRE !
                let clickBonus = 0;
                // Bonus de vitesse basé sur le nombre de clics (moins d'erreurs = plus de points)
                if (newTotalClicks <= 10) clickBonus = 100;
                else if (newTotalClicks <= 15) clickBonus = 50;
                else if (newTotalClicks <= 20) clickBonus = 25;

                finalizeActivity(true, clickBonus);
            }
        } else {
            // ERREUR
            recordAction(true); // Enregistrer l'erreur dans les stats
            setPlayerSequence([]);

            // Reset silencieux : si c'était la première note, on la garde comme nouvelle tentative
            if (note.id === ORIGINAL_SEQUENCE[0]) {
                setPlayerSequence([note.id]);
            }
        }
    };

    const handleStart = async () => {
        await initAudio();
        startActivity();
        setPhase('play'); // On garde phase pour la transition UI, mais isPlaying gère la logique
        setPlayerSequence([]);
        setTotalClicks(0);
    };

    // Construction du décor de fond
    const Background = (
        <div className="absolute inset-0">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'url(/backgrounds/rencontre3etype.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
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
                    animate={{ opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5] }}
                    transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
                />
            ))}
            <ShootingStar delay={2} />
            <ShootingStar delay={7} />
            <UFO delay={0} duration={20} startX={-5} endX={105} y={15} size={24} />
            <UFO delay={10} duration={18} startX={-5} endX={105} y={70} size={20} />
        </div>
    );

    // Contenu personnalisé de succès (pour garder le style original)
    const SuccessScreen = (
        <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-6 w-full backdrop-blur-md shadow-2xl">
            <motion.div
                className="text-8xl mb-4 inline-block"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                🛸✨
            </motion.div>

            <h2 className="text-3xl font-orbitron font-bold text-emerald-400 mb-2">Contact Établi !</h2>
            <p className="text-emerald-200/70 mb-6">Communication réussie avec les extraterrestres.</p>

            <div className="bg-emerald-900/20 rounded-xl p-4 mb-8 border border-emerald-500/20">
                <p className="text-sm text-emerald-400/60 uppercase tracking-widest mb-1">Score Final</p>
                <p className="text-5xl font-mono font-bold text-emerald-400">
                    {score} <span className="text-lg text-emerald-400/50">pts</span>
                </p>
                {bonus > 0 && (
                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-xs text-emerald-300 border border-emerald-400/30">
                        Bonus rapidité: +{bonus} pts
                    </div>
                )}
                <p className="text-emerald-400/40 text-xs mt-3">
                    Réussi en {totalClicks} clics
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExit}
                className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
            >
                Continuer
            </motion.button>
        </div>
    );

    return (
        <ActivityShell
            title="Rencontre du 3ᵉ Type"
            subtitle="Communication Extraterrestre"
            universeColor="#a855f7" // Violet
            onExit={onExit}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            background={Background}
            successContent={SuccessScreen}
        >
            {/* INTRO */}
            {phase === 'intro' && !isCompleted && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <motion.div
                        className="text-8xl mb-6 relative"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        🛸
                        <motion.div
                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-purple-500/50 blur-lg rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </motion.div>

                    <h2 className="font-orbitron text-2xl font-bold text-white mb-4">Signal Détecté</h2>
                    <p className="text-indigo-200/80 mb-8 max-w-xs mx-auto">
                        Un vaisseau tente de communiquer via une séquence de <span className="text-purple-400 font-bold">5 notes</span>.
                    </p>

                    <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-200 text-left w-full max-w-xs">
                        ⚠️ <strong>iPhone :</strong> Désactivez le mode silencieux pour entendre le son.
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        onTouchStart={handleStart}
                        className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-purple-900/40 relative overflow-hidden"
                    >
                        <span className="relative z-10">🎵 Initier le Contact</span>
                    </motion.button>
                </div>
            )}

            {/* PLAY */}
            {phase === 'play' && !isCompleted && (
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
                    {/* Indicateur de progression */}
                    <div className="flex gap-4 mb-8 sm:mb-12">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${i < playerSequence.length
                                    ? 'bg-purple-500 border-purple-400 shadow-[0_0_20px_#a855f7]'
                                    : 'bg-black/40 border-white/20'
                                    }`}
                                animate={i < playerSequence.length ? { scale: [1, 1.3, 1] } : {}}
                            />
                        ))}
                    </div>

                    {/* Bouton Indice */}
                    <motion.button
                        onClick={playHint}
                        disabled={isPlayingHint}
                        className="mb-8 px-6 py-3 rounded-full bg-black/40 border border-white/20 hover:bg-white/10 text-sm sm:text-base text-indigo-300 transition-colors flex items-center gap-3 backdrop-blur-md shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isPlayingHint ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="text-xl">🔄</motion.span>
                        ) : <span className="text-xl">🔊</span>}
                        {isPlayingHint ? 'Transmission en cours...' : 'Écouter la séquence'}
                    </motion.button>

                    {/* Grille 4x4 */}
                    <div className="grid grid-cols-4 gap-3 sm:gap-6 p-4 sm:p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl w-full aspect-square max-w-[500px]">
                        {GRID_NOTES.map((note, index) => {
                            const isActive = activeNote === index;

                            return (
                                <motion.button
                                    key={note.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleNoteClick(index)}
                                    className="w-full h-full rounded-2xl flex items-center justify-center relative shadow-lg transition-all duration-200"
                                    style={{
                                        background: isActive
                                            ? `radial-gradient(circle, white 0%, ${note.color} 70%)`
                                            : `linear-gradient(135deg, ${note.color}40 0%, ${note.color}10 100%)`,
                                        boxShadow: isActive
                                            ? `0 0 50px ${note.glow}, inset 0 0 20px white`
                                            : `0 0 15px ${note.color}20, inset 0 0 10px ${note.color}10`,
                                        border: `2px solid ${isActive ? 'white' : note.color}`,
                                        opacity: 1
                                    }}
                                >
                                    <span
                                        className={`text-2xl sm:text-5xl font-bold transition-all duration-100 ${isActive
                                            ? 'text-black drop-shadow-none'
                                            : 'text-white/80 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]'
                                            }`}
                                    >
                                        ♪
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}    </ActivityShell>
    );
}
