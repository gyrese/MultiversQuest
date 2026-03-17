import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS = [
    { type: 'pupil', label: 'Observez la réaction : DILATÉ ?', correct: true, duration: 4000 },
    { type: 'heart', label: 'Rythme cardiaque : ACCÉLÉRÉ ?', correct: true, duration: 4000 },
    { type: 'blush', label: 'Température joue : ROUGISSANTE ?', correct: false, duration: 3000 },
];

export default function VoightKampff({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, test, result
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(100);
    const [reaction, setReaction] = useState(0); // 0-1 float for eye animation

    useEffect(() => {
        if (gameState !== 'test') return;

        const q = QUESTIONS[qIndex];
        // Simulate reaction
        const interval = setInterval(() => {
            setReaction(r => Math.min(1, r + (Math.random() * 0.05)));
            setTimer(t => Math.max(0, t - 1));
        }, 50);

        if (timer <= 0) {
            handleAnswer(false); // Timeout = Fail
        }

        return () => clearInterval(interval);
    }, [gameState, qIndex, timer]);

    const handleAnswer = (isHuman) => {
        const q = QUESTIONS[qIndex];
        // For MVP, simplistic logic: Always assume "Replicant" behavior is visible?
        // Let's make it interactive: Reaction > 0.8 is "Human"? No, other way around.
        // If question asks "Dilated?", and Reaction is High, answer YES.

        let success = false;
        if (reaction > 0.5 && q.correct) success = true;
        if (reaction < 0.5 && !q.correct) success = true; // Inverse logic

        if (success) {
            setScore(s => s + 1);
            if (qIndex < QUESTIONS.length - 1) {
                setQIndex(q => q + 1);
                setReaction(0);
                setTimer(100);
            } else {
                setGameState('result');
                setTimeout(() => onComplete(score * 100), 2000);
            }
        } else {
            // Shake screen, maybe retry?
            // For now, allow proceed but lower score
            setQIndex(q => q + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-amber-500 font-mono select-none flex flex-col items-center justify-center p-4">

            {/* Scanlines / CRT Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: '100% 2px, 3px 100%' }} />

            {gameState === 'intro' && (
                <div className="text-center z-10">
                    <h1 className="text-3xl font-bold mb-4 tracking-widest border-b border-amber-900 pb-2">VOIGHT-KAMPFF</h1>
                    <p className="mb-8 text-sm opacity-70">
                        ANALYSE DES RÉPONSES ÉMOTIONNELLES.<br />
                        IDENTIFIEZ LES RÉPLICANTS.
                    </p>
                    <button onClick={() => setGameState('test')} className="px-8 py-3 bg-amber-900/20 border border-amber-600 hover:bg-amber-900/40 text-amber-500 font-bold uppercase">
                        INITIALISER LE TEST
                    </button>
                    <button onClick={onExit} className="block mt-8 mx-auto text-xs opacity-50 hover:opacity-100">ANNULER</button>
                </div>
            )}

            {gameState === 'test' && (
                <div className="w-full max-w-md relative z-10 flex flex-col items-center">

                    {/* EYE MONITOR */}
                    <div className="w-64 h-40 bg-black border-2 border-amber-800 rounded-lg overflow-hidden relative mb-8 shadow-[0_0_20px_rgba(255,191,0,0.2)]">
                        {/* Eye Graphic (CSS) */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 bg-gray-900 rounded-full overflow-hidden flex items-center justify-center">
                            <motion.div
                                className="w-20 h-20 bg-blue-300 rounded-full relative flex items-center justify-center shadow-inner"
                                animate={{ scale: 1 + (reaction * 0.5) }} // Dilation
                            >
                                <div className="w-8 h-8 bg-black rounded-full" />
                                <div className="absolute top-2 left-4 w-4 h-4 bg-white/50 rounded-full" />
                            </motion.div>
                        </div>

                        {/* Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,rgba(255,191,0,0.2)_95%)] bg-[size:20px_20px]" />
                        <div className="absolute bottom-2 left-2 text-xs text-amber-700">CAM-01 [REC]</div>
                    </div>

                    {/* Question / Data */}
                    <div className="bg-amber-900/10 border border-amber-900/50 p-4 w-full mb-8 text-center">
                        <p className="text-xs text-amber-700 mb-2">SUJET #684-B // QUESTION {qIndex + 1}</p>
                        <h2 className="text-xl font-bold mb-2">{QUESTIONS[qIndex].label}</h2>
                        <div className="w-full h-2 bg-amber-900/30 overflow-hidden">
                            <motion.div className="h-full bg-amber-500" animate={{ width: `${reaction * 100}%` }} />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => handleAnswer(false)}
                            className="flex-1 py-4 border border-amber-600 bg-black hover:bg-amber-900/20 text-amber-500 font-bold uppercase tracking-wider transition-colors"
                        >
                            NÉGATIF
                        </button>
                        <button
                            onClick={() => handleAnswer(true)}
                            className="flex-1 py-4 border border-amber-600 bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(255,191,0,0.3)]"
                        >
                            POSITIF
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-amber-800 font-mono">
                        TEMPS RESTANT: {timer.toFixed(0)} CYCLES
                    </div>

                </div>
            )}

            {gameState === 'result' && (
                <div className="text-center z-10 animate-pulse">
                    <h1 className="text-4xl text-amber-500 font-bold mb-2">ANALYSE TERMINÉE</h1>
                    <p className="text-xl mb-4 text-amber-300">
                        {score > 1 ? "HUMAIN CONFIRMÉ" : "RÉPLICANT DÉTECTÉ"}
                    </p>
                    <div className="text-xs text-amber-800">
                        ENVOI DU RAPPORT AU BLADE RUNNER...
                    </div>
                </div>
            )}

        </div>
    );
}
