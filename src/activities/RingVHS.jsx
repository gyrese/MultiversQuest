import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ASSETS & STYLES ---
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E`;

const MINIGAMES = [
    { id: 'rewind', instruction: 'REBOBINE !', duration: 4000 },
    { id: 'dont_look', instruction: 'NE REGARDE PAS !', duration: 3000 },
    { id: 'answer', instruction: 'DÉCROCHE !', duration: 3000 },
];

export default function RingVHS({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, playing, intermission, gameover, won
    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [glitchIntensity, setGlitchIntensity] = useState(0);

    // Game Specific States
    const [rotation, setRotation] = useState(0); // Rewind
    const [phoneShaking, setPhoneShaking] = useState(false); // Answer
    const [eyesOpen, setEyesOpen] = useState(true); // Don't Look (Simulated by touching screen to cover eyes?) -> Let's say "TOUCH TO HIDE EYES"

    const timerRef = useRef(null);

    // --- GAME LOOP ---

    const startGame = () => {
        setGameState('playing');
        startMiniGame(0);
    };

    const startMiniGame = (index) => {
        if (index >= MINIGAMES.length * 2) { // Play 2 rounds of games
            endGame(true);
            return;
        }

        const gameType = MINIGAMES[index % MINIGAMES.length];
        setCurrentGameIndex(index);
        setTimeLeft(gameType.duration);
        setGlitchIntensity(0.2);

        // Reset game states
        setRotation(0);
        setPhoneShaking(true);
        setEyesOpen(true);

        // Timer
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, gameType.duration - elapsed);
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timerRef.current);
                checkWinCondition(gameType.id);
            }
        }, 50);
    };

    const checkWinCondition = (type) => {
        let wonLength = false;

        if (type === 'rewind') {
            if (rotation > 1000) wonLength = true; // Spun enough
        } else if (type === 'dont_look') {
            if (!eyesOpen) wonLength = true; // Hidden successfully
        } else if (type === 'answer') {
            // Already handled by click event
            if (!phoneShaking) wonLength = true;
        }

        if (wonLength) {
            handleSuccess();
        } else {
            handleFailure();
        }
    };

    const handleSuccess = () => {
        clearInterval(timerRef.current);
        setScore(s => s + 1);
        setGameState('intermission');
        setGlitchIntensity(0);
        setTimeout(() => startMiniGame(currentGameIndex + 1), 1500);
    };

    const handleFailure = () => {
        clearInterval(timerRef.current);
        setGameState('gameover');
        setGlitchIntensity(1);
    };

    const endGame = (win) => {
        if (win) {
            setGameState('won');
            setTimeout(() => onComplete(400), 3000);
        } else {
            setGameState('gameover');
        }
    };

    // --- INTERACTION HANDLERS ---

    const handleRewind = () => {
        if (gameState !== 'playing') return;
        const type = MINIGAMES[currentGameIndex % MINIGAMES.length].id;
        if (type === 'rewind') {
            setRotation(r => r + 45);
            // Visual feedback
            if (rotation + 45 > 1000) handleSuccess();
        }
    };

    const handleAnswer = () => {
        if (gameState !== 'playing') return;
        const type = MINIGAMES[currentGameIndex % MINIGAMES.length].id;
        if (type === 'answer') {
            setPhoneShaking(false);
            handleSuccess();
        }
    };

    const handleHideEyes = (isHiding) => {
        if (gameState !== 'playing') return;
        const type = MINIGAMES[currentGameIndex % MINIGAMES.length].id;
        if (type === 'dont_look') {
            setEyesOpen(!isHiding);
        }
    };


    // --- RENDERERS ---

    const renderMinigame = () => {
        const type = MINIGAMES[currentGameIndex % MINIGAMES.length].id;

        if (type === 'rewind') {
            return (
                <div className="flex flex-col items-center">
                    <motion.div
                        className="w-48 h-48 rounded-full border-8 border-white border-dashed flex items-center justify-center mb-8"
                        animate={{ rotate: rotation }}
                        transition={{ duration: 0.1 }}
                    >
                        <div className="w-4 h-4 bg-white rounded-full" />
                    </motion.div>
                    <button
                        onPointerDown={handleRewind}
                        className="px-8 py-4 bg-white text-black font-black text-2xl uppercase tracking-tighter hover:bg-gray-300"
                    >
                        TOURNE !
                    </button>
                </div>
            );
        }

        if (type === 'dont_look') {
            return (
                <div
                    className="flex flex-col items-center justify-center w-full h-full"
                    onPointerDown={() => handleHideEyes(true)}
                    onPointerUp={() => handleHideEyes(false)}
                    onTouchStart={() => handleHideEyes(true)}
                    onTouchEnd={() => handleHideEyes(false)}
                >
                    {eyesOpen ? (
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="bg-white w-full h-full absolute inset-0 flex items-center justify-center"
                        >
                            <img src="https://media.giphy.com/media/xxxx/giphy.gif" alt="" className="opacity-0" /> {/* Preload trick? No. */}
                            <div className="text-black font-black text-6xl text-center">👁️<br />JE TE VOIS</div>
                        </motion.div>
                    ) : (
                        <div className="bg-black w-full h-full absolute inset-0 flex items-center justify-center border-4 border-white">
                            <div className="text-white font-mono text-xl">YEUX FERMÉS...</div>
                        </div>
                    )}
                    <p className="absolute bottom-10 text-white font-bold text-xl pointer-events-none z-50">MAINTIENS APPUYÉ</p>
                </div>
            );
        }

        if (type === 'answer') {
            return (
                <div className="flex flex-col items-center">
                    <motion.div
                        animate={phoneShaking ? { x: [-5, 5, -5, 5], rotate: [-2, 2, -2, 2] } : {}}
                        transition={{ repeat: Infinity, duration: 0.1 }}
                        className="text-9xl mb-8 cursor-pointer"
                        onPointerDown={handleAnswer}
                    >
                        ☎️
                    </motion.div>
                    <p className="text-2xl font-mono blink animate-pulse">APPEL ENTRANT...</p>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden font-mono select-none touch-none">
            {/* VHS EFFECT OVERLAY */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-20" style={{ backgroundImage: `url("${NOISE_SVG}")` }} />
            <div className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scanline" style={{ height: '100%', backgroundSize: '100% 3px' }} />

            {/* CHROMATIC ABERRATION */}
            <div className="absolute inset-0 transition-all duration-100"
                style={{
                    textShadow: glitchIntensity > 0 ? `${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0px red, ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0px blue` : 'none',
                    filter: `blur(${glitchIntensity}px) contrast(${1 + glitchIntensity})`
                }}>

                {/* HEADERS */}
                <div className="absolute top-4 left-4 text-xl font-bold text-green-500 shadow-green-glow">PLAY ►</div>
                <div className="absolute top-4 right-4 text-xl font-bold">SP: {score * 100}</div>

                {/* GAME AREA */}
                {gameState === 'intro' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black">
                        <h1 className="text-6xl font-black mb-4 glitch-text" data-text="7 JOURS">7 JOURS</h1>
                        <p className="mb-8 text-center max-w-md px-4 text-gray-400">
                            Une cassette maudite. Des épreuves rapides.<br />
                            Survivez à la séquence.
                        </p>
                        <button onClick={startGame} className="px-8 py-3 bg-white text-black font-bold text-xl hover:bg-gray-200 uppercase">
                            Insérer la cassette
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <motion.div
                            key={currentGameIndex}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full h-full flex flex-col items-center justify-center relative"
                        >
                            <div className="absolute top-20 text-4xl font-black text-red-500 uppercase tracking-widest bg-black px-4 py-2 border border-red-500">
                                {MINIGAMES[currentGameIndex % MINIGAMES.length].instruction}
                            </div>

                            {renderMinigame()}

                            {/* Timer Bar */}
                            <div className="absolute bottom-0 left-0 h-4 bg-red-600 transition-all ease-linear"
                                style={{ width: `${(timeLeft / MINIGAMES[currentGameIndex % MINIGAMES.length].duration) * 100}%` }}
                            />
                        </motion.div>
                    </div>
                )}

                {gameState === 'intermission' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-900 z-40">
                        <h2 className="text-4xl font-bold text-white tracking-widest">AVANCE RAPIDE...</h2>
                        <div className="absolute bottom-10 animate-pulse text-2xl">⏩</div>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
                        <img src="https://media.tenor.com/images/3a43697991b5c33857508670d9036c1e/tenor.gif" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen" alt="noise" />
                        <h1 className="text-6xl font-black text-red-600 mb-4 z-10 relative">MORT</h1>
                        <button onClick={() => { setGameState('intro'); setScore(0); }} className="px-6 py-2 border border-white text-white z-10 hover:bg-white hover:text-black">
                            RÉESSAYER
                        </button>
                        <button onClick={onExit} className="mt-4 text-gray-500 underline z-10">Quitter</button>
                    </div>
                )}

                {gameState === 'won' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-black z-50">
                        <h1 className="text-4xl font-bold mb-4">VIVANT...</h1>
                        <p>La malédiction est levée.</p>
                    </div>
                )}
            </div>

            <style>{`
                .shadow-green-glow { text-shadow: 0 0 10px #00ff00; }
                @keyframes scanline {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(100vh); }
                }
                .animate-scanline { animation: scanline 4s linear infinite; }
                .glitch-text { position: relative; }
                .glitch-text::before, .glitch-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                }
                .glitch-text::before {
                    left: 2px; text-shadow: -1px 0 red; clip: rect(24px, 550px, 90px, 0); animation: glitch-anim-2 3s infinite linear alternate-reverse;
                }
                .glitch-text::after {
                    left: -2px; text-shadow: -1px 0 blue; clip: rect(85px, 550px, 140px, 0); animation: glitch-anim 2.5s infinite linear alternate-reverse;
                }
                @keyframes glitch-anim {
                    0% { clip: rect(12px, 9999px, 86px, 0); }
                    100% { clip: rect(69px, 9999px, 13px, 0); }
                }
                @keyframes glitch-anim-2 {
                    0% { clip: rect(65px, 9999px, 100px, 0); }
                    100% { clip: rect(10px, 9999px, 34px, 0); }
                }
            `}</style>
        </div>
    );
}
