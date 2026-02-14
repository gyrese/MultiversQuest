import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function Kamehameha({ onComplete, onExit }) {
    const [energy, setEnergy] = useState(50);
    const [gameStatus, setGameStatus] = useState('intro'); // intro, playing, won, lost
    const audioRef = useRef(null);

    // Difficulty ramp up
    useEffect(() => {
        if (gameStatus !== 'playing') return;

        const timer = setInterval(() => {
            setEnergy(prev => {
                const drop = 0.5 + (Math.random() * 0.5); // Random resistance
                const neo = prev - drop;
                if (neo <= 0) {
                    setGameStatus('lost');
                    return 0;
                }
                if (neo >= 100) {
                    setGameStatus('won');
                    return 100;
                }
                return neo;
            });
        }, 50);

        return () => clearInterval(timer);
    }, [gameStatus]);

    const handleTap = () => {
        if (gameStatus === 'playing') {
            setEnergy(prev => Math.min(100, prev + 3));
            // Trigger vibration if available
            if (navigator.vibrate) navigator.vibrate(20);
        }
    };

    const handleStart = () => {
        setEnergy(50);
        setGameStatus('playing');
    };

    useEffect(() => {
        if (gameStatus === 'won') {
            setTimeout(() => onComplete(400), 2000);
        }
    }, [gameStatus, onComplete]);

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex flex-col pointer-events-none">
            {/* Background Anime Lines */}
            <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/speed-lines.png')]" />

            {/* Beam Struggle Visual */}
            <div className="flex-1 relative flex items-center w-full">
                {/* Goku's Beam (Blue) */}
                <motion.div
                    className="h-32 bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 shadow-[0_0_50px_rgba(0,255,255,0.8)] relative z-10"
                    style={{ width: `${energy}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-40 bg-white blur-xl rounded-full opacity-80 animate-pulse" />
                </motion.div>

                {/* Enemy Beam (Red/Purple) */}
                <motion.div
                    className="h-32 bg-gradient-to-l from-red-500 via-pink-600 to-purple-600 shadow-[0_0_50px_rgba(255,0,0,0.8)] flex-1 relative z-10"
                >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-40 bg-white blur-xl rounded-full opacity-80 animate-pulse" />
                </motion.div>

                {/* Clash Point */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full blur-xl z-20 mix-blend-screen"
                    style={{ left: `calc(${energy}% - 4rem)` }}
                />
            </div>

            {/* UI Layer */}
            <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 pointer-events-auto">
                <div className="flex justify-between items-start">
                    <div className="text-cyan-400 font-bold text-xl drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">GOKU</div>
                    <button onClick={onExit} className="text-white/50 text-xs border border-white/20 px-2 py-1 rounded">ABANDON</button>
                    <div className="text-red-500 font-bold text-xl drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">CELL</div>
                </div>

                {gameStatus === 'intro' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <button
                            onClick={handleStart}
                            className="px-8 py-4 bg-yellow-400 text-black font-black text-2xl skew-x-[-10deg] border-4 border-white hover:scale-105 transition-transform"
                        >
                            TAPOTEZ POUR COMMENCER !!!
                        </button>
                    </div>
                )}

                {gameStatus === 'playing' && (
                    <div className="flex justify-center pb-12">
                        <button
                            onPointerDown={handleTap}
                            className="w-32 h-32 rounded-full bg-cyan-500/20 border-4 border-cyan-400 text-cyan-200 font-bold text-xl animate-bounce active:scale-95 transition-transform backdrop-blur-md shadow-[0_0_30px_rgba(0,255,255,0.4)] flex items-center justify-center"
                        >
                            TAP !!!
                        </button>
                    </div>
                )}

                {gameStatus === 'won' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-50 animate-fade-in">
                        <h1 className="text-6xl font-black text-blue-600 italic">VICTOIRE !</h1>
                    </div>
                )}

                {gameStatus === 'lost' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
                        <h1 className="text-4xl font-bold text-red-600 mb-4">DÉFAITE...</h1>
                        <button onClick={handleStart} className="px-6 py-2 border border-white text-white">RÉESSAYER</button>
                    </div>
                )}
            </div>
        </div>
    );
}
