import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_TYPES = [
    { type: 'bad', label: '🦹', points: 50 },
    { type: 'bad', label: '🔫', points: 50 },
    { type: 'civ', label: '👩', points: -100 },
    { type: 'civ', label: '👶', points: -100 },
];

export default function NickyLarson({ onComplete, onExit }) {
    const [score, setScore] = useState(0);
    const [targets, setTargets] = useState([]);
    const [gameOver, setGameOver] = useState(false);

    // Spawner
    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            if (targets.length < 5) {
                const id = Date.now();
                const type = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];
                const x = Math.random() * 80 + 10; // 10% to 90%
                const y = Math.random() * 80 + 10;

                setTargets(prev => [...prev, { id, ...type, x, y }]);

                // Despawn after 2s
                setTimeout(() => {
                    setTargets(prev => prev.filter(t => t.id !== id));
                }, 2000);
            }
        }, 800);

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
        <div className="fixed inset-0 bg-slate-900 overflow-hidden cursor-crosshair select-none touch-none">
            {/* Background City */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/city-lights.png')] bg-cover" />

            {/* UI */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-50 pointer-events-none">
                <div className="text-white font-mono text-xl bg-black/50 px-3 rounded">
                    SCORE: <span className={score < 0 ? 'text-red-500' : 'text-green-500'}>{score}</span>/500
                </div>
                <button onClick={onExit} className="pointer-events-auto bg-red-600 text-white px-3 py-1 rounded">QUITTER</button>
            </div>

            {/* Targets */}
            <AnimatePresence>
                {targets.map(target => (
                    <motion.button
                        key={target.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => handleHit(target)}
                        className={`absolute text-4xl w-16 h-16 flex items-center justify-center bg-white/10 rounded-full border-2 
                            ${target.type === 'bad' ? 'border-red-500 hover:bg-red-500/20' : 'border-blue-500 hover:bg-blue-500/20'}
                        `}
                        style={{ left: `${target.x}%`, top: `${target.y}%` }}
                        whileTap={{ scale: 1.2 }}
                    >
                        {target.label}
                    </motion.button>
                ))}
            </AnimatePresence>

            {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                    <h1 className="text-4xl text-green-500 font-bold animate-bounce">
                        CIBLE ÉLIMINÉE !
                    </h1>
                </div>
            )}
        </div>
    );
}
