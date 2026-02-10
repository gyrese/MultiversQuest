import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityScore } from '../hooks/useActivityScore';
import ActivityShell from '../components/activity/ActivityShell';

// --- CONFIGURATION ---
const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const SYMBOLS = {
    UP: '⬆️',
    DOWN: '⬇️',
    LEFT: '⬅️',
    RIGHT: '➡️'
};
const OPPOSITE = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT'
};

export default function TenetInversion({ universeId = 'realites_alterees', onComplete, onExit }) {
    // --- STATE ---
    const [points, setPoints] = useState(0);
    const [round, setRound] = useState(1);
    const [sequence, setSequence] = useState([]); // La séquence à mémoriser
    const [playerInput, setPlayerInput] = useState([]); // Les entrées du joueur
    const [phase, setPhase] = useState('INTRO'); // INTRO, WATCH, PLAY, SUCCESS, FAIL
    const [message, setMessage] = useState('ENTROPIE STABLE');
    const [touchStart, setTouchStart] = useState(null);

    // --- HOOK ACTIVITY ---
    const {
        isPlaying,
        isCompleted,
        // score est géré manuellement pour afficher le score cumulé
        score: engineScore,
        startActivity,
        recordAction,
        finalizeActivity
    } = useActivityScore(universeId, 'tenet_inversion', {
        maxPoints: 450,
        activityType: 'standard', // Custom logic
        onComplete
    });

    // --- INITIALISATION ---
    useEffect(() => {
        if (!isPlaying && !isCompleted && phase === 'INTRO') {
            startActivity();
            setTimeout(() => startRound(1), 1500);
        }
    }, [isPlaying, isCompleted, phase, startActivity]);

    // --- GAME LOGIC ---
    const startRound = (currentRound) => {
        setPhase('WATCH');
        setRound(currentRound);
        setMessage(`OBSERVEZ LE FLUX TEMPOREL (NIVEAU ${currentRound})`);
        setPlayerInput([]);

        // Générer séquence
        const length = 3 + Math.floor((currentRound - 1) / 2); // 3, 3, 4, 4, 5...
        const newSequence = [];
        for (let i = 0; i < length; i++) {
            newSequence.push(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]);
        }
        setSequence(newSequence);
    };

    // Animation de la séquence (useEffect déclenché par le changement de phase/sequence)
    useEffect(() => {
        if (phase === 'WATCH' && sequence.length > 0) {
            let i = 0;
            const interval = setInterval(() => {
                // Flash l'instruction
                // Ici on pourrait utiliser un state pour afficher l'icône active
                // Mais on va le faire visuellement dans le render via une variable temporaire ?
                // Non, on va utiliser un state 'activeInstructionIndex'
                setActiveInstruction(i);

                // Son
                playTone(400 + i * 50, 'square');

                i++;
                if (i >= sequence.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setActiveInstruction(null);
                        setPhase('PLAY');
                        setMessage('INVERSEZ LE FLUX ! (Du DERNIER au PREMIER)');
                        // Vibration pour signaler le début
                        if (navigator.vibrate) navigator.vibrate(200);
                    }, 1000);
                }
            }, 1000); // 1 seconde par instruction

            return () => clearInterval(interval);
        }
    }, [phase, sequence]);

    const [activeInstruction, setActiveInstruction] = useState(null);

    // --- GESTION DES GESTES (SWIPE) ---
    const handleTouchStart = (e) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e) => {
        if (phase !== 'PLAY' || !touchStart) return;

        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Seuil minimum pour un swipe
        if (Math.max(absDx, absDy) < 30) return;

        let gesture = '';
        if (absDx > absDy) {
            gesture = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
            gesture = dy > 0 ? 'DOWN' : 'UP';
        }

        handleInput(gesture);
        setTouchStart(null);
    };

    // Gestion souris pour debug PC
    const handleMouseDown = (e) => {
        setTouchStart({ x: e.clientX, y: e.clientY });
    }
    const handleMouseUp = (e) => {
        if (phase !== 'PLAY' || !touchStart) return;
        const dx = e.clientX - touchStart.x;
        const dy = e.clientY - touchStart.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
        const gesture = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP');
        handleInput(gesture);
        setTouchStart(null);
    }

    const handleInput = (gesture) => {
        // Logique TENET : Le joueur doit entrer la séquence du DERNIER au PREMIER
        // Exemple : Séquence = [HAUT, BAS, GAUCHE]
        // Input attendu 1 : GAUCHE (Index 2)
        // Input attendu 2 : BAS (Index 1)
        // Input attendu 3 : HAUT (Index 0)

        const expectedIndex = sequence.length - 1 - playerInput.length;
        const expectedGesture = sequence[expectedIndex];

        // Feedback visuel immédiat
        setActiveInstruction(expectedIndex); // On "éclaire" l'instruction qu'il est en train de valider (à l'envers)

        if (gesture === expectedGesture) {
            // Correct
            playTone(600 + playerInput.length * 100, 'sine');
            const newInput = [...playerInput, gesture];
            setPlayerInput(newInput);

            if (newInput.length === sequence.length) {
                // Round gagné
                handleRoundSuccess();
            }
        } else {
            // Erreur
            handleFail();
        }
    };

    const handleRoundSuccess = () => {
        setMessage('CAUSALITÉ RESTAURÉE');
        playTone(800, 'triangle');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        setTimeout(() => {
            setActiveInstruction(null);
            if (round < 5) {
                // Next round
                startRound(round + 1);
            } else {
                // Full Win
                setPhase('SUCCESS');
                finalizeActivity(true, 100); // +100 bonus
            }
        }, 1000);
    };

    const handleFail = () => {
        setMessage('PARADOXE TEMPOREL DÉTECTÉ !');
        recordAction(true); // Erreur
        if (navigator.vibrate) navigator.vibrate(500);

        // Reset input pour réessayer le MÊME round
        setPlayerInput([]);
        setActiveInstruction(null);

        setTimeout(() => {
            setMessage('RÉESSAYEZ (Inversez le temps)');
            // On ne change pas de phase, on laisse le joueur réessayer la séquence affichée
            // On pourrait vouloir remontrer la séquence ?
            // Allons-y :
            setPhase('WATCH'); // Relance la démo
        }, 1500);
    };

    // --- AUDIO ---
    const playTone = (freq, type) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    };

    return (
        <ActivityShell
            title="Inversion Temporelle"
            subtitle="Opération Tenet"
            universeColor="#ef4444" // Rouge Tenet
            isCompleted={isCompleted}
            score={engineScore}
            onExit={onExit}
            background={
                <div className="absolute inset-0 bg-black overflow-hidden">
                    {/* Effet Tenet Rouge/Bleu */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-blue-900/40" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-[200%] h-[20px] bg-white rotate-45 animate-pulse" />
                    </div>
                </div>
            }
        >
            <div
                className="flex flex-col items-center justify-center h-full w-full relative touch-none select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            >
                {/* Zone d'affichage Séquence */}
                <div className="flex gap-4 mb-12 flex-wrap justify-center max-w-sm">
                    {sequence.map((dir, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: activeInstruction === index ? 1 : 0.3,
                                scale: activeInstruction === index ? 1.2 : 1,
                                color: activeInstruction === index ? '#ef4444' : '#ffffff'
                            }}
                            className="text-4xl bg-black/50 p-4 rounded-lg border border-white/20"
                        >
                            {SYMBOLS[dir]}
                        </motion.div>
                    ))}
                </div>

                {/* Instructions / Feedback */}
                <div className="text-center mb-12 z-10 px-4">
                    <h2 className="text-2xl font-bold font-mono glitch-text mb-2 text-blue-400">
                        {message}
                    </h2>
                    <p className="text-sm text-gray-400 font-mono">
                        {phase === 'PLAY' ? 'SWIPEZ POUR INVERSER LE TEMPS' : 'MÉMORISEZ'}
                    </p>

                    {phase === 'PLAY' && (
                        <div className="mt-4 text-xs text-red-500 animate-pulse">
                            ◀◀ REWIND ◀◀
                        </div>
                    )}
                </div>

                {/* Zone tactile indicative */}
                {phase === 'PLAY' && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-64 h-64 border-4 border-dashed border-white rounded-full animate-spin-slow" />
                    </div>
                )}

                {phase === 'INTRO' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center p-6 bg-black/80 border border-red-500 rounded-lg max-w-xs"
                    >
                        <h3 className="text-xl font-bold text-red-500 mb-2">MISSION TENET</h3>
                        <p className="text-sm">Le temps s'écoule à l'envers. Reproduisez la séquence en commençant par la FIN.</p>
                        <div className="mt-4 text-xs text-gray-400">Exemple: ⬆️ ⬇️ ➡️ <br />Action: ➡️ puis ⬇️ puis ⬆️</div>
                    </motion.div>
                )}

            </div>
        </ActivityShell>
    );
}

// TODO: Ajouter styles glitch dans index.css si non existants
