import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple synth for primitive sounds
const playSound = (freq, type = 'square') => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
};

const SIGNS = [
    { id: 'fist', icon: '✊', sound: 150, color: 'bg-red-700' },   // Thump
    { id: 'palm', icon: '✋', sound: 220, color: 'bg-yellow-700' }, // Slap
    { id: 'point', icon: '👇', sound: 300, color: 'bg-blue-700' },  // Point
    { id: 'shout', icon: '👄', sound: 400, color: 'bg-green-700' }, // Shout
];

export default function PrimalCommunication({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, demo, input, success, fail, won
    const [sequence, setSequence] = useState([]);
    const [playerInput, setPlayerInput] = useState([]);
    const [round, setRound] = useState(1);
    const [activeSign, setActiveSign] = useState(null);

    // Game Logic
    useEffect(() => {
        if (gameState === 'demo') {
            playSequence();
        }
    }, [gameState, round]);

    const addToSequence = () => {
        const next = Math.floor(Math.random() * 4);
        setSequence(prev => [...prev, SIGNS[next]]);
    };

    const playSequence = async () => {
        // Add new step if starting round
        if (sequence.length < round) {
            addToSequence();
        }

        // Wait a bit before playing
        await new Promise(r => setTimeout(r, 1000));

        // Play loop
        for (let i = 0; i < sequence.length; i++) {
            await highlightSign(sequence[i]);
            await new Promise(r => setTimeout(r, 500));
        }

        setGameState('input');
        setPlayerInput([]);
    };

    const highlightSign = async (sign) => {
        setActiveSign(sign.id);
        playSound(sign.sound);
        await new Promise(r => setTimeout(r, 500));
        setActiveSign(null);
    };

    const handleInput = (sign) => {
        if (gameState !== 'input') return;

        highlightSign(sign); // Visual feedback
        const currentStep = playerInput.length;

        // Check correctness
        if (sign.id !== sequence[currentStep].id) {
            setGameState('fail');
            playSound(100, 'sawtooth'); // Error buzz
            return;
        }

        const newInput = [...playerInput, sign];
        setPlayerInput(newInput);

        if (newInput.length === sequence.length) {
            // Round Complete
            if (round >= 5) {
                setGameState('won');
                setTimeout(() => onComplete(round * 100), 2000);
            } else {
                setGameState('success');
                setTimeout(() => {
                    setRound(r => r + 1);
                    setGameState('demo');
                }, 1000);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-[#3e2723] text-[#d7ccc8] font-serif select-none flex flex-col items-center justify-center">

            {/* Background Texture */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/rocky-wall.png')]" />

            {/* Header */}
            <div className="z-10 text-center mb-12">
                <div className="text-sm opacity-50 uppercase tracking-widest mb-2">Cycle {round}/5</div>
                <h1 className="text-3xl font-bold flex items-center justify-center gap-4">
                    <span className="text-4xl">🔥</span>
                    COMMUNICATION
                    <span className="text-4xl">🔥</span>
                </h1>
            </div>

            {/* Game Board */}
            <div className="relative z-10 grid grid-cols-2 gap-6 w-full max-w-sm p-4">
                {SIGNS.map((sign) => (
                    <motion.button
                        key={sign.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleInput(sign)}
                        className={`
                            h-32 rounded-2xl border-4 border-[#5d4037] shadow-[0_5px_0_#3e2723]
                            flex items-center justify-center text-6xl
                            transition-all duration-200
                            ${activeSign === sign.id ? 'bg-white brightness-150 scale-105' : sign.color}
                            ${gameState !== 'input' ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:translate-y-1 active:shadow-none'}
                        `}
                    >
                        {sign.icon}
                    </motion.button>
                ))}
            </div>

            {/* Status Messages */}
            <div className="h-16 flex items-center justify-center z-10 mt-8">
                {gameState === 'demo' && <p className="animate-pulse text-xl">👀 OBSERVEZ</p>}
                {gameState === 'input' && <p className="text-green-400 text-xl">RÉPÉTEZ</p>}
                {gameState === 'fail' && <p className="text-red-500 font-bold text-2xl shake">ERREUR !</p>}
                {gameState === 'success' && <p className="text-yellow-400 font-bold text-2xl bounce">BIEN !</p>}
            </div>

            {/* Intro Overlay */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-8xl mb-6">🐵</div>
                    <h2 className="text-3xl font-bold text-amber-500 mb-4">PARLEZ SINGE</h2>
                    <p className="text-gray-300 mb-8 max-w-xs">
                        Le mâle Alpha communique.
                        <br />
                        Répétez ses gestes pour gagner sa confiance.
                    </p>
                    <button
                        onClick={() => { setGameState('demo'); setSequence([]); addToSequence(); }}
                        className="px-8 py-4 bg-amber-700 text-white font-bold rounded-xl border-b-4 border-amber-900 active:border-b-0 active:translate-y-1"
                    >
                        COMMENCER
                    </button>
                </div>
            )}

            {gameState === 'fail' && (
                <div className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center">
                    <div className="text-8xl mb-4">🙊</div>
                    <h2 className="text-4xl font-bold mb-4">INCOMPRIS</h2>
                    <button onClick={() => { setGameState('intro'); setRound(1); setSequence([]); }} className="px-6 py-3 bg-black rounded text-white">Réessayer</button>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center">
                    <div className="text-8xl mb-4">🤝</div>
                    <h2 className="text-4xl font-bold mb-4">CONFIANCE ACQUISE</h2>
                    <p>Vous faites partie du clan.</p>
                </div>
            )}

            <button onClick={onExit} className="absolute bottom-6 text-white/30 text-xs">ABANDONNER LE CLAN</button>
        </div>
    );
}

// Quick Shake Animation CSS
// .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
