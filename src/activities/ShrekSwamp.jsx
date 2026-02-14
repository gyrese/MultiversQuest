import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_TYPES = [
    { type: 'bad', label: '🛡️', points: 50 }, // Knight
    { type: 'bad', label: '🧑‍🌾', points: 50 }, // Villager
    { type: 'good', label: '🦓', points: -100 }, // Donkey
    { type: 'good', label: '🐱', points: -100 }, // Puss
    { type: 'good', label: '🍪', points: -100 }, // Ginger
];

export default function ShrekSwamp({ onComplete, onExit }) {
    const [score, setScore] = useState(0);
    const [targets, setTargets] = useState([]);
    const [gameOver, setGameOver] = useState(false);

    // Spawner
    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            if (targets.length < 6) {
                const id = Date.now();
                const type = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];
                const x = Math.random() * 80 + 10;
                const y = Math.random() * 80 + 10;

                setTargets(prev => [...prev, { id, ...type, x, y }]);

                setTimeout(() => {
                    setTargets(prev => prev.filter(t => t.id !== id));
                }, 1800); // Slightly faster
            }
        }, 700);

        return () => clearInterval(interval);
    }, [targets, gameOver]);

    const handleHit = (target) => {
        if (gameOver) return;

        setScore(prev => prev + target.points);
        setTargets(prev => prev.filter(t => t.id !== target.id));

        if (score + target.points >= 500) {
            setGameOver(true);
            setTimeout(() => onComplete(500), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#3f6212] overflow-hidden cursor-crosshair select-none touch-none font-serif">
            {/* Background Swamp */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1a2e05] to-transparent pointer-events-none" />

            {/* UI */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-50 pointer-events-none text-[#ecfccb]">
                <div className="bg-[#1a2e05] px-4 py-2 rounded-xl border border-[#84cc16]">
                    SCORE: <span className={score < 0 ? 'text-red-400' : 'text-[#a3e635]'}>{score}</span>/500
                </div>
                <button onClick={onExit} className="pointer-events-auto bg-[#1a2e05] hover:bg-[#365314] px-4 py-2 rounded-xl border border-[#84cc16]">
                    QUITTER LE MARAIS
                </button>
            </div>

            {/* Targets */}
            <AnimatePresence>
                {targets.map(target => (
                    <motion.button
                        key={target.id}
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => handleHit(target)}
                        whileTap={{ scale: 1.2, rotate: 20 }}
                        className={`absolute text-5xl w-20 h-20 flex items-center justify-center bg-[#fef3c7]/20 rounded-full border-4 shadow-lg active:bg-red-500/50 transition-colors
                            ${target.type === 'bad' ? 'border-red-800' : 'border-green-400'}
                        `}
                        style={{ left: `${target.x}%`, top: `${target.y}%` }}
                    >
                        {target.label}
                    </motion.button>
                ))}
            </AnimatePresence>

            {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                    <h1 className="text-5xl text-[#bef264] font-bold animate-bounce drop-shadow-[0_5px_5px_rgba(0,0,0,1)] text-center">
                        MARAIS SÉCURISÉ !<br />
                        <span className="text-2xl text-white font-normal mt-4 block">Les oignons sont saufs.</span>
                    </h1>
                </div>
            )}
        </div>
    );
}
