import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OracleSmaug({ onComplete, onExit }) {
    const [goldStolen, setGoldStolen] = useState(0);
    const [dragonStatus, setDragonStatus] = useState('sleeping'); // sleeping, waking, awake, angry
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState("Volez l'or pendant qu'il dort...");

    const tapRef = useRef(false);

    // State Machine for Smaug
    useEffect(() => {
        if (gameOver || dragonStatus === 'angry') return;

        let timer;
        const nextState = () => {
            const rand = Math.random();
            if (dragonStatus === 'sleeping') {
                // 80% chance to wake up eventually
                if (rand > 0.2) {
                    setDragonStatus('waking');
                    setMessage("Il bouge...");
                    timer = setTimeout(() => {
                        setDragonStatus('awake');
                        setMessage("FIGEZ-VOUS !");
                    }, 1500); // Warning duration
                } else {
                    // Stay asleep longer
                    timer = setTimeout(nextState, 2000);
                }
            } else if (dragonStatus === 'awake') {
                // Look for movement (user tapping)
                // This check happens in handleTap mostly, but we need to transition back to sleep
                timer = setTimeout(() => {
                    setDragonStatus('sleeping');
                    setMessage("Il se rendort...");
                    nextState();
                }, 3000 + Math.random() * 2000);
            }
        };

        if (dragonStatus === 'sleeping') {
            timer = setTimeout(nextState, 2000 + Math.random() * 3000);
        }

        return () => clearTimeout(timer);
    }, [dragonStatus, gameOver]);

    const handleTap = () => {
        if (gameOver) return;

        if (dragonStatus === 'awake') {
            // YOU MOVED!
            setDragonStatus('angry');
            setGameOver(true);
            setMessage("VOUS ÊTES MORT !");
            // Shake screen effect
        } else if (dragonStatus === 'waking') {
            // Risky!
            if (Math.random() > 0.7) {
                setDragonStatus('angry');
                setGameOver(true);
            } else {
                setGoldStolen(g => g + 1);
            }
        } else {
            // Safe
            setGoldStolen(g => {
                const newGold = g + 1;
                if (newGold >= 50) {
                    setGameOver(true); // Win
                    setTimeout(() => onComplete(500), 2000);
                }
                return newGold;
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-[#facc15] font-serif select-none touch-none overflow-hidden flex flex-col items-center">
            {/* Background Cave */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a120b] to-[#4a3419]" />

            {/* Smaug Visual */}
            <div className="flex-1 w-full flex items-center justify-center relative z-10 transition-colors duration-500"
                style={{ backgroundColor: dragonStatus === 'angry' ? '#ef4444' : 'transparent' }}
            >
                <div className="text-9xl transition-transform duration-300 transform scale-150">
                    {dragonStatus === 'sleeping' && '😴'}
                    {dragonStatus === 'waking' && '🥱'}
                    {dragonStatus === 'awake' && '👁️'}
                    {dragonStatus === 'angry' && '🔥'}
                </div>
            </div>

            {/* UI Layer */}
            <div className="absolute top-0 w-full p-6 flex justify-between z-20 pointer-events-none text-[#facc15] drop-shadow-md">
                <div className="text-2xl font-bold">{goldStolen}/50 💰</div>
                <div className="text-sm opacity-70 uppercase tracking-widest animate-pulse">{message}</div>
            </div>

            {/* Tap Area */}
            <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col items-center justify-end z-30">
                <button
                    onPointerDown={handleTap}
                    disabled={gameOver && dragonStatus !== 'angry'} // Disable if won, but allow fail feedback
                    className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(250,204,21,0.3)] transition-all active:scale-95 touch-manipulation
                        ${dragonStatus === 'awake' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-[#facc15]/20 border-[#facc15] text-[#facc15] hover:bg-[#facc15]/40'}
                    `}
                >
                    💎
                </button>
                <p className="mt-4 text-xs opacity-50 uppercase tracking-widest text-center">
                    TAPOTEZ POUR VOLER<br />ARRÊTEZ QUAND IL REGARDE
                </p>
                <button onClick={onExit} className="mt-4 text-xs opacity-50 border-b border-transparent hover:border-[#facc15]">
                    S'ENFUIR (Quitter)
                </button>
            </div>

            {gameOver && dragonStatus === 'angry' && (
                <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-50 animate-bounce">
                    <h1 className="text-6xl font-black text-black">ROÂÂÂR !!!</h1>
                    <p className="mt-4 text-white font-bold">Vous avez fini en méchoui.</p>
                    <button onClick={() => { setGameOver(false); setDragonStatus('sleeping'); setGoldStolen(0); }} className="mt-8 px-6 py-3 bg-black text-white rounded shadow-lg uppercase font-bold">
                        Réessayer
                    </button>
                </div>
            )}
        </div>
    );
}
