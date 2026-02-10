import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityScore } from '../hooks/useActivityScore';
import ActivityShell from '../components/activity/ActivityShell';

// Configuration du jeu
const SEQUENCE_LENGTH = 5;
const BUTTONS = [
    { id: 1, label: 'SECURITÉ', color: '#ef4444' }, // Rouge
    { id: 2, label: 'ENCLOS', color: '#f59e0b' },   // Orange
    { id: 3, label: 'SYSTÈME', color: '#10b981' },  // Vert
    { id: 4, label: 'ACCÈS', color: '#3b82f6' },    // Bleu
];

export default function JurassicHack({ universeId = 'jurassic_park', onComplete, onExit }) {
    // État local du jeu
    const [gameSequence, setGameSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [activeButton, setActiveButton] = useState(null);
    const [message, setMessage] = useState('SYSTÈME VERROUILLÉ');
    const [round, setRound] = useState(0); // 0 = start, 1..SEQUENCE_LENGTH

    // Hook Activity Engine
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
        'jurassic_hack',
        {
            maxPoints: 400,
            activityType: 'sequence',
            onComplete
        }
    );

    // Démarrer le jeu
    const handleStart = () => {
        startActivity();
        setRound(1);
        setMessage('INITIALISATION...');
        generateSequence(1);
    };

    // Générer une nouvelle séquence pour le round actuel
    const generateSequence = (level) => {
        const newStep = BUTTONS[Math.floor(Math.random() * BUTTONS.length)].id;

        // On conserve la séquence précédente et on ajoute une étape
        // Note: Dans un vrai Simon, la séquence grandit. Ici on va faire grandir la séquence.
        setGameSequence(prev => {
            // Si c'est le premier round, on reset, sinon on garde (mais ici on veut une nouvelle étape à chaque fois ?)
            // Pour simplifier : on regénère tout ou on ajoute ?
            // Simon classique : sequence[N] = sequence[N-1] + newStep
            // Mais ici on n'a pas accès au state précédent de manière synchrone fiable dans ce contexte async.
            // On va utiliser un ref ou simplement ajouter à l'état.

            // Approche simple : On ajoute à la séquence existante si > 1, sinon nouvelle.
            if (level === 1) return [newStep];
            return [...prev, newStep];
        });

        setPlayerSequence([]);
        setIsShowingSequence(true);
    };

    // Effet pour jouer la séquence quand elle change ou quand on lance le round
    useEffect(() => {
        if (isPlaying && isShowingSequence && gameSequence.length > 0) {
            playSequence();
        }
    }, [gameSequence, isShowingSequence, isPlaying]);

    const playSequence = async () => {
        setMessage(`SÉQUENCE ${round}/${SEQUENCE_LENGTH}`);
        // Petite pause avant de commencer
        await new Promise(r => setTimeout(r, 1000));

        for (let id of gameSequence) {
            setActiveButton(id);
            playSound(id);
            await new Promise(r => setTimeout(r, 600)); // Durée allumage
            setActiveButton(null);
            await new Promise(r => setTimeout(r, 200)); // Pause entre notes
        }

        setIsShowingSequence(false);
        setMessage('REPRODUISEZ LA SÉQUENCE');
    };

    const handleButtonClick = (id) => {
        if (!isPlaying || isShowingSequence || isCompleted) return;

        playSound(id);
        setActiveButton(id);
        recordAction(false); // Clic
        setTimeout(() => setActiveButton(null), 200);

        const expectedId = gameSequence[playerSequence.length];

        if (id === expectedId) {
            // Correct
            const newPlayerSequence = [...playerSequence, id];
            setPlayerSequence(newPlayerSequence);

            if (newPlayerSequence.length === gameSequence.length) {
                // Round gagné
                if (round === SEQUENCE_LENGTH) {
                    // VICTOIRE FINALE
                    finalizeActivity(true, 100); // 100 pts bonus réussite du premier coup (calculé ailleurs si besoin)
                    setMessage('ACCÈS ACCORDÉ');
                } else {
                    // Round suivant
                    setMessage('CORRECT. ANALYSE SUIVANTE...');
                    setRound(r => r + 1);
                    setTimeout(() => generateSequence(round + 1), 1000);
                }
            }
        } else {
            // Erreur
            recordAction(true);
            setMessage('ERREUR DE SÉCURITÉ !');
            flashScreen();

            // Rejouer la séquence actuelle après un délai
            setIsShowingSequence(true);
            setPlayerSequence([]);
        }
    };

    // Sons synthétiques simples
    const playSound = (id) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // Fréquences type sci-fi
        const freqs = [300, 400, 500, 600];
        osc.frequency.value = freqs[id - 1] || 440;
        osc.type = 'square';

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    };

    return (
        <ActivityShell
            title="Système de Sécurité"
            subtitle="Piratage du parc"
            universeColor="#10b981" // Vert Jurassic
            onExit={onExit}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            // Background type terminal
            background={
                <div className="absolute inset-0 bg-black font-mono">
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .3) 25%, rgba(32, 255, 77, .3) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .3) 75%, rgba(32, 255, 77, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .3) 25%, rgba(32, 255, 77, .3) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .3) 75%, rgba(32, 255, 77, .3) 76%, transparent 77%, transparent)',
                            backgroundSize: '50px 50px'
                        }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_120%)]" />
                </div>
            }
        >
            {/* Écran Terminal */}
            <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">

                {/* Moniteur */}
                <div className="w-full bg-black border-4 border-gray-800 rounded-lg p-6 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden">
                    {/* Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />

                    <div className="relative z-20 font-mono text-green-500 text-center">
                        <div className="text-xs mb-2 opacity-70">NEDRY_LAND_SECURITY_PROTOCAL_V2.0</div>
                        <div className="text-2xl font-bold mb-4 glitch-text animate-pulse">
                            {message}
                        </div>

                        {/* Indicateur de progression */}
                        {isPlaying && !isCompleted && (
                            <div className="flex justify-center gap-1 mt-4">
                                {[...Array(SEQUENCE_LENGTH)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 w-8 rounded-full ${i < round ? 'bg-green-500' : 'bg-green-900/30'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Boutons de contrôle */}
                {!isPlaying && !isCompleted ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className="px-8 py-4 bg-green-700 hover:bg-green-600 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(21,128,61,0.6)] border-2 border-green-400"
                    >
                        &gt; EXECUTER HACK.EXE
                    </motion.button>
                ) : !isCompleted && (
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {BUTTONS.map((btn) => (
                            <motion.button
                                key={btn.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleButtonClick(btn.id)}
                                disabled={isShowingSequence}
                                className={`
                                    h-24 rounded-lg border-2 font-mono text-xl font-bold transition-all duration-100
                                    flex items-center justify-center shadow-lg
                                `}
                                style={{
                                    borderColor: activeButton === btn.id ? '#fff' : btn.color,
                                    backgroundColor: activeButton === btn.id ? btn.color : `${btn.color}20`,
                                    color: activeButton === btn.id ? '#000' : btn.color,
                                    boxShadow: activeButton === btn.id ? `0 0 30px ${btn.color}` : 'none',
                                    opacity: isShowingSequence && activeButton !== btn.id ? 0.3 : 1
                                }}
                            >
                                {btn.label}
                            </motion.button>
                        ))}
                    </div>
                )}

            </div>
        </ActivityShell>
    );
}

// Helper pour effet visuel d'erreur
function flashScreen() {
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-red-500/30 z-50 pointer-events-none';
    document.body.appendChild(flash);
    setTimeout(() => document.body.removeChild(flash), 100);
}
