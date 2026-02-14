import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SCENARIOS = [
    {
        q: "Un lapin blanc passe devant toi. Que fais-tu ?",
        a: "Je le suis dans le terrier",
        b: "Je l'ignore et continue ma route",
        type: "awakening"
    },
    {
        q: "Tu te réveilles avec un câble dans la nuque. Ta réaction ?",
        a: "Je panique et l'arrache",
        b: "J'attends calmement les instructions",
        type: "compliance"
    },
    {
        q: "Morpheus te propose deux pilules. Laquelle choisis-tu ?",
        a: "La Rouge (Vérité douloureuse)",
        b: "La Bleue (Ignorance heureuse)",
        type: "choice"
    },
    {
        q: "L'Oracle te dit que tu n'es pas l'Élu. Que penses-tu ?",
        a: "Elle se trompe, je vais lui prouver",
        b: "Elle a raison, je suis juste moi",
        type: "belief"
    },
    {
        q: "L'Agent Smith te propose un marché. Tu acceptes ?",
        a: "Jamais ! (Combat)",
        b: "Écoutons ce qu'il a à dire (Négociation)",
        type: "combat"
    }
];

export default function MatrixChoix({ onComplete, onExit }) {
    const [step, setStep] = useState(0); // 0: Intro, 1: Game, 2: Result
    const [currentScenario, setCurrentScenario] = useState(0);
    const [stats, setStats] = useState({ awakened: 0, asleep: 0 });

    const handleChoice = (choice) => {
        // Simple logic: Option A adds to 'awakened', B to 'asleep'
        if (choice === 'A') setStats(s => ({ ...s, awakened: s.awakened + 1 }));
        else setStats(s => ({ ...s, asleep: s.asleep + 1 }));

        if (currentScenario < SCENARIOS.length - 1) {
            setCurrentScenario(prev => prev + 1);
        } else {
            finishGame();
        }
    };

    const finishGame = () => {
        setStep(2);
    };

    const finalize = () => {
        // Score calculation: More awakened = higher score
        const score = Math.round((stats.awakened / SCENARIOS.length) * 300);
        onComplete(score);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black text-green-500 font-mono flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Matrix Rain Effect Background (simplified with CSS/SVG) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 0%, #0f0 50%, transparent 100%)',
                    backgroundSize: '20px 200px',
                    animation: 'rain 2s infinite linear'
                }}
            />
            <style>{`@keyframes rain { 0% { background-position: 0 0; } 100% { background-position: 0 1000px; } }`}</style>

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 border-b border-green-900 bg-black/80 backdrop-blur">
                <button onClick={onExit} className="text-xs hover:text-white">[ EXIT_SYSTEM ]</button>
                <div className="text-xs">SIMULATION_V2.4</div>
            </div>

            <AnimatePresence mode='wait'>
                {step === 0 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-md text-center space-y-8 z-10"
                    >
                        <div className="text-6xl mb-4">🕶️</div>
                        <h1 className="text-3xl font-bold glitch-text">LE CHOIX</h1>
                        <p className="text-sm md:text-base leading-relaxed typing-effect">
                            "Tu te crois libre ? Tu penses que l'air que tu respires est réel ?
                            Fais tes choix. Découvre la vérité."
                        </p>
                        <button
                            onClick={() => setStep(1)}
                            className="px-8 py-3 border border-green-500 hover:bg-green-500 hover:text-black transition-colors rounded-none uppercase tracking-widest text-sm"
                        >
                            > ENTRER DANS LA MATRICE
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="game"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full max-w-lg z-10"
                    >
                        <div className="mb-8 text-center">
                            <div className="text-xs text-green-700 mb-2">SEQUENCE {currentScenario + 1}/{SCENARIOS.length}</div>
                            <h2 className="text-xl md:text-2xl font-bold p-4 border-l-4 border-green-600 bg-green-900/10">
                                {SCENARIOS[currentScenario].q}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleChoice('A')}
                                className="p-6 border border-green-800 hover:border-green-400 hover:bg-green-900/20 transition-all text-left group"
                            >
                                <span className="block text-xs opacity-50 mb-1 group-hover:text-green-300">OPTION_01</span>
                                {SCENARIOS[currentScenario].a}
                            </button>
                            <button
                                onClick={() => handleChoice('B')}
                                className="p-6 border border-green-800 hover:border-green-400 hover:bg-green-900/20 transition-all text-left group"
                            >
                                <span className="block text-xs opacity-50 mb-1 group-hover:text-green-300">OPTION_02</span>
                                {SCENARIOS[currentScenario].b}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center max-w-md z-10"
                    >
                        <div className="text-6xl mb-6">
                            {stats.awakened > stats.asleep ? '🐇' : '🛌'}
                        </div>
                        <h2 className="text-2xl font-bold mb-4">
                            {stats.awakened > stats.asleep ? "TU ES RÉVEILLÉ" : "TU DORS ENCORE"}
                        </h2>
                        <p className="mb-8 text-green-400">
                            {stats.awakened > stats.asleep
                                ? "Tu as vu au-delà de l'illusion. Bienvenue dans le monde réel."
                                : "L'ignorance est une bénédiction. Fais de beaux rêves."}
                        </p>
                        <div className="text-4xl font-bold mb-8">
                            {Math.round((stats.awakened / SCENARIOS.length) * 300)} PTS
                        </div>
                        <button
                            onClick={finalize}
                            className="px-8 py-3 bg-green-600 text-black font-bold hover:bg-green-500 transition-colors uppercase"
                        >
                            Sortir de la simulation
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
