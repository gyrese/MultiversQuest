import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NODES = [
    { id: 0, x: 50, y: 10, color: '#fcd34d' }, // Top
    { id: 1, x: 80, y: 35, color: '#f472b6' }, // Top Right
    { id: 2, x: 70, y: 80, color: '#60a5fa' }, // Bottom Right
    { id: 3, x: 30, y: 80, color: '#a78bfa' }, // Bottom Left
    { id: 4, x: 20, y: 35, color: '#34d399' }, // Top Left
];

const LEVELS = [
    [0, 2, 4, 1, 3], // Simple star
    [0, 3, 1, 4, 2], // Cross
    [0, 1, 2, 3, 4, 0] // Circle
];

export default function SailorMoon({ onComplete, onExit }) {
    const [level, setLevel] = useState(0);
    const [step, setStep] = useState(0); // Current interactive step
    const [isPlaying, setIsPlaying] = useState(false); // is showing sequence?
    const [userSequence, setUserSequence] = useState([]);
    const [showHint, setShowHint] = useState(null);

    // Play sequence
    useEffect(() => {
        if (level >= LEVELS.length) {
            onComplete(500);
            return;
        }

        const sequence = LEVELS[level];
        setIsPlaying(true);
        setUserSequence([]);
        setStep(0);

        let i = 0;
        const interval = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(interval);
                setIsPlaying(false);
                setShowHint(null);
                return;
            }
            setShowHint(sequence[i]);
            setTimeout(() => setShowHint(null), 600);
            i++;
        }, 1000);

        return () => clearInterval(interval);
    }, [level, onComplete]);

    const handleTap = (id) => {
        if (isPlaying || level >= LEVELS.length) return;

        const expected = LEVELS[level][step];
        if (id === expected) {
            // Good
            const nextStep = step + 1;
            setStep(nextStep);

            // Visual feedback
            setShowHint(id);
            setTimeout(() => setShowHint(null), 300);

            if (nextStep >= LEVELS[level].length) {
                setTimeout(() => setLevel(l => l + 1), 1000);
            }
        } else {
            // Bad - Reset level
            // Shake effect or sound?
            // For now just reset sequence replay
            alert("Raté ! Regarde bien la séquence.");
            const currentLevel = level;
            setLevel(-1); // Trick to force re-render/re-effect
            setTimeout(() => setLevel(currentLevel), 100);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#1e1b4b] overflow-hidden flex flex-col items-center justify-center pointer-events-none touch-none select-none">
            {/* Background Spacy */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-900 via-[#1e1b4b] to-black opacity-80" />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-50 pointer-events-auto">
                <button onClick={onExit} className="text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    QUITTER
                </button>
                <div className="text-pink-400 font-bold drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                    NIVEAU {level + 1}/{LEVELS.length}
                </div>
            </div>

            {/* Main Game Area */}
            <div className="relative w-full max-w-sm aspect-square p-8 pointer-events-auto">
                {/* SVG Connections (optional) */}
                <svg className="absolute inset-0 w-full h-full p-8 pointer-events-none z-0 opacity-30">
                    <polygon points="50,10 80,35 70,80 30,80 20,35" fill="none" stroke="#f472b6" strokeWidth="2" />
                </svg>

                {NODES.map((node) => (
                    <motion.button
                        key={node.id}
                        initial={false}
                        animate={{
                            scale: showHint === node.id ? 1.5 : 1,
                            backgroundColor: showHint === node.id ? '#fff' : node.color,
                            boxShadow: showHint === node.id ? `0 0 30px ${node.color}, 0 0 60px #fff` : `0 0 10px ${node.color}`
                        }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleTap(node.id)}
                        className="absolute w-16 h-16 rounded-full border-4 border-white/20 backdrop-blur-md flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                        }}
                    >
                        {/* Inner Star Icon */}
                        <span className="text-2xl opacity-50">✨</span>
                    </motion.button>
                ))}

                {/* Center Feedback */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isPlaying && (
                        <div className="text-pink-300 animate-pulse font-bold text-xl bg-black/50 px-4 py-2 rounded-xl backdrop-blur">
                            OBSERVEZ...
                        </div>
                    )}
                    {!isPlaying && level < LEVELS.length && (
                        <div className="text-white/50 text-sm mt-32">
                            A VOUS !
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
