import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SawEscape({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, playing, won, lost
    const [currentLock, setCurrentLock] = useState(0);
    const [pinPosition, setPinPosition] = useState(0);
    const [targetZone, setTargetZone] = useState({ start: 70, end: 90 }); // Percentage
    const [direction, setDirection] = useState(1);
    const [speed, setSpeed] = useState(1);
    const [lives, setLives] = useState(3);

    const LOCKS = 3;

    useEffect(() => {
        let interval;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                setPinPosition((prev) => {
                    let next = prev + (direction * speed);
                    if (next >= 100 || next <= 0) {
                        setDirection(-direction);
                        next = prev + (-direction * speed);
                    }
                    return next;
                });
            }, 10);
        }
        return () => clearInterval(interval);
    }, [gameState, direction, speed]);

    const handleUnlock = () => {
        if (gameState !== 'playing') return;

        if (pinPosition >= targetZone.start && pinPosition <= targetZone.end) {
            // Success
            if (currentLock < LOCKS - 1) {
                setCurrentLock(prev => prev + 1);
                setSpeed(s => s + 0.5); // Increase difficulty
                // Randomize next target
                const newStart = Math.random() * 80;
                setTargetZone({ start: newStart, end: newStart + 15 });
            } else {
                setGameState('won');
                setTimeout(() => onComplete(400), 2000);
            }
        } else {
            // Fail
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameState('lost');
                }
                return newLives;
            });
            // Screen shake
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0a0505] text-red-700 font-mono select-none flex flex-col items-center justify-center">
            {/* Grunge Overlay */}
            <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]" />
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-gradient-radial from-transparent to-black" />

            <div className="z-10 w-full max-w-md p-8 bg-[#1a0f0f] border-4 border-[#3a1f1f] rounded shadow-[0_0_50px_rgba(255,0,0,0.1)] relative">

                {/* Jigsaw Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-red-900 tracking-wider" style={{ textShadow: '2px 2px 0px #000' }}>
                        JIGSAW
                    </h1>
                    <p className="text-sm font-bold text-red-800 uppercase">
                        Vivre ou mourir. À vous de choisir.
                    </p>
                </div>

                {gameState === 'intro' && (
                    <div className="text-center">
                        <div className="text-6xl mb-4 animate-pulse">⚙️</div>
                        <p className="mb-6 text-gray-500">
                            Arrêtez le mécanisme dans la zone rouge pour déverrouiller le piège à ours.
                            <br /><br />
                            3 Verrous. 3 Vies.
                        </p>
                        <button
                            onClick={() => setGameState('playing')}
                            className="bg-red-900 text-white px-8 py-3 font-bold hover:bg-red-800 border border-red-700 shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                        >
                            COMMENCER LE JEU
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="relative h-64 flex flex-col items-center justify-center">
                        {/* Lives */}
                        <div className="absolute top-0 right-0 flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <span key={i} className={`text-2xl ${i < lives ? 'text-red-500' : 'text-gray-800'}`}>♥</span>
                            ))}
                        </div>

                        {/* Lock Progress */}
                        <div className="absolute top-0 left-0 text-gray-500">
                            VERROU {currentLock + 1}/{LOCKS}
                        </div>

                        {/* The Mechanism */}
                        <div className="w-full h-12 bg-gray-900 border border-gray-700 rounded-full relative overflow-hidden mt-8">
                            {/* Target Zone */}
                            <div
                                className="absolute top-0 bottom-0 bg-red-900/50 border-x border-red-500"
                                style={{
                                    left: `${targetZone.start}%`,
                                    width: `${targetZone.end - targetZone.start}%`
                                }}
                            />

                            {/* Pin */}
                            <motion.div
                                className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_10px_white]"
                                style={{ left: `${pinPosition}%` }}
                            />
                        </div>

                        <button
                            onPointerDown={handleUnlock}
                            className="mt-12 w-32 h-32 rounded-full bg-[#1a0f0f] border-4 border-red-900 flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] active:scale-95 transition-transform"
                        >
                            <span className="text-red-500 font-bold text-xl pointer-events-none">STOP</span>
                        </button>
                    </div>
                )}

                {gameState === 'lost' && (
                    <div className="absolute inset-0 bg-red-900/95 flex flex-col items-center justify-center z-50 text-white">
                        <h2 className="text-5xl font-bold mb-4">GAME OVER</h2>
                        <p className="text-xl">Le piège s'est refermé.</p>
                        <button onClick={() => { setGameState('intro'); setLives(3); setCurrentLock(0); setSpeed(1); }} className="mt-8 underline opacity-70 hover:opacity-100">
                            Réessayer (si vous l'osez)
                        </button>
                    </div>
                )}

                {gameState === 'won' && (
                    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 text-green-500">
                        <h2 className="text-4xl font-bold mb-4">LIBERTÉ</h2>
                        <p>Vous appréciez votre vie.</p>
                    </div>
                )}

            </div>

            <button onClick={onExit} className="absolute bottom-4 text-red-900/50 hover:text-red-900">
                ABANDONNER
            </button>
        </div>
    );
}
