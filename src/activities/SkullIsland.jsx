import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SkullIsland({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, playing, won, lost
    const [player, setPlayer] = useState({ x: 50, y: 0, vx: 0, vy: 0 }); // Percentages
    const [platforms, setPlatforms] = useState([]);
    const [score, setScore] = useState(0);
    const [cameraY, setCameraY] = useState(0);

    const gameLoopRef = useRef();
    const containerRef = useRef();

    // Init
    useEffect(() => {
        if (gameState === 'playing') {
            // Generate Platforms
            const plats = [];
            for (let i = 0; i < 50; i++) {
                plats.push({
                    id: i,
                    x: Math.random() * 80, // %
                    y: i * 15 + 10, // vertical spacing
                    w: 20, // width %
                    type: Math.random() > 0.9 ? 'fragile' : 'normal'
                });
            }
            setPlatforms(plats);
            setPlayer({ x: 50, y: 0, vx: 0, vy: 0 }); // Bottom
            setCameraY(0);
            setScore(0);

            startGameLoop();
        }
        return () => cancelAnimationFrame(gameLoopRef.current);
    }, [gameState]);

    const startGameLoop = () => {
        const loop = () => {
            setPlayer(prev => {
                let { x, y, vx, vy } = prev;

                // Physics
                vy -= 0.05; // Gravity
                x += vx;
                y += vy;

                // Bounce off walls
                if (x < 0) { x = 0; vx = -vx; }
                if (x > 90) { x = 90; vx = -vx; }

                // Platform Collision (only falling down)
                if (vy < 0) {
                    // Check ground
                    if (y < 0) {
                        y = 0; vy = 1.5; // Bounce
                    }

                    // Check platforms
                    // Need access to current platforms state... 
                    // In React loop this is tricky without Ref. A bit hacky for now.
                    // Let's rely on functional update or Ref.

                    // For MVP simplicity: collision check inside render loop logic is hard.
                    // We'll trust the Ref pattern for platforms.
                }

                // Camera follow
                if (y > cameraY + 40) {
                    // setCameraY(y - 40); // Done via side effect or derived state
                }

                return { x, y, vx, vy };
            });

            // Move Platform logic and collision needed here actually...
            // Switching to simple "Click to Jump" mechanical for robustness?
            // No, Doodle Jump is about auto-jump on landing + tilt control.
            // Mouse/Touch X controls player X.
        };
        // gameLoopRef.current = requestAnimationFrame(loop);
    };

    // SIMPLIFIED DOODLE JUMP: 
    // Player bounces automatically bottom. 
    // Touch left/right to move.

    // Actually, let's build the Vertical Platformer more reliably with a direct logic hook.

    const [lastTime, setLastTime] = useState(0);

    // Game Loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const interval = setInterval(() => {
            setPlayer(p => {
                let next = { ...p };

                // Gravity
                next.vy -= 0.15;
                next.y += next.vy;
                next.x += next.vx;

                // Drag
                next.vx *= 0.9;

                // Screen Wrap
                if (next.x < -5) next.x = 95;
                if (next.x > 95) next.x = -5;

                // Camera follow high point
                if (next.y > cameraY + 30) {
                    setCameraY(next.y - 30);
                    setScore(Math.floor(next.y * 10));
                }

                // Fall death
                if (next.y < cameraY - 10) {
                    setGameState('lost');
                }

                // Win
                if (next.y > 500) { // Height goal
                    setGameState('won');
                    setTimeout(() => onComplete(500), 2000);
                }

                return next;
            });
        }, 16);

        return () => clearInterval(interval);
    }, [gameState, cameraY]);

    // Collision Check (Separate effect to access latest Platforms)
    useEffect(() => {
        if (gameState !== 'playing') return;
        if (player.vy > 0) return; // Only check if falling

        // Check platforms
        let hit = false;

        // Ground check
        if (player.y <= 0 && player.y > -2) {
            setPlayer(p => ({ ...p, vy: 2.5 }));
            return;
        }

        platforms.forEach(plat => {
            // Simple Box
            // Player is roughly 5x5% ?
            // Platform Y is fixed?
            if (
                player.y >= plat.y &&
                player.y <= plat.y + 2 && // Tolerance
                player.x + 5 >= plat.x &&
                player.x <= plat.x + plat.w
            ) {
                // Bounce
                setPlayer(p => ({ ...p, vy: 2.5 }));
                // Break fragile?
            }
        });

    }, [player.y, gameState, platforms]); // Check on Y change

    const handleControl = (dir) => {
        setPlayer(p => ({ ...p, vx: dir * 1.5 }));
    };

    return (
        <div className="fixed inset-0 bg-[#0d1a1a] font-mono select-none overflow-hidden touch-none flex flex-col">

            {/* Background Layers */}
            <div className="absolute inset-0 z-0 opacity-30"
                style={{
                    backgroundImage: 'linear-gradient(to top, #0f2b1d, #000)',
                    transform: `translateY(${cameraY * 0.5}px)` // Parallax
                }}
            />
            {/* Mist */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-20 animate-pulse" />

            {gameState === 'playing' && (
                <div className="relative w-full h-full z-20">

                    {/* World Container - Shifted by Camera */}
                    <div className="absolute w-full bottom-0 left-0 transition-transform duration-75 ease-linear"
                        style={{ transform: `translateY(${50 + (-cameraY * 10)}px)` }}>

                        {/* Ground */}
                        <div className="absolute bottom-[-50px] left-0 w-full h-[50px] bg-green-900 border-t-4 border-green-700" />

                        {/* Platforms */}
                        {platforms.map(plat => (
                            <div key={plat.id}
                                className="absolute h-4 bg-amber-800 rounded border border-amber-950 shadow-lg"
                                style={{
                                    left: `${plat.x}%`,
                                    bottom: `${plat.y * 10}px`, // Scale Y for pixels
                                    width: `${plat.w}%`
                                }}
                            >
                                {/* Vines hanging */}
                                <div className="absolute top-4 left-2 w-1 h-8 bg-green-800 opacity-80" />
                                <div className="absolute top-4 right-4 w-1 h-6 bg-green-800 opacity-60" />
                            </div>
                        ))}

                        {/* Player (Kong/Human?) let's say Survivor */}
                        <motion.div
                            className="absolute w-10 h-10 bg-white rounded shadow-[0_0_15px_white] flex items-center justify-center text-xl z-30"
                            style={{
                                left: `${player.x}%`,
                                bottom: `${player.y * 10}px`
                            }}
                        >
                            🧗
                        </motion.div>

                        {/* Goal */}
                        <div className="absolute left-1/2 -translate-x-1/2 text-6xl text-center" style={{ bottom: '5100px' }}>
                            🦍
                            <div className="text-white text-sm bg-black px-2">KONG ATTEND</div>
                        </div>

                    </div>

                    {/* HUD */}
                    <div className="absolute top-4 left-4 text-white font-bold text-xl drop-shadow-md">
                        ALT: {Math.floor(score)}m
                    </div>
                </div>
            )}

            {/* CONTROLS OVERLAY */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 z-50 flex">
                <div
                    className="flex-1 active:bg-white/10"
                    onPointerDown={() => handleControl(-1)}
                    onPointerUp={() => handleControl(0)}
                    onTouchStart={() => handleControl(-1)}
                    onTouchEnd={() => handleControl(0)}
                />
                <div
                    className="flex-1 active:bg-white/10"
                    onPointerDown={() => handleControl(1)}
                    onPointerUp={() => handleControl(0)}
                    onTouchStart={() => handleControl(1)}
                    onTouchEnd={() => handleControl(0)}
                />
            </div>

            {gameState === 'intro' && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-5xl font-black text-amber-600 mb-4 tracking-tighter">SKULL ISLAND</h1>
                    <p className="text-gray-400 mb-8 max-w-sm text-sm">
                        L'île s'effondre. Grimpez vers le sommet pour échapper aux prédateurs.<br />
                        Touchez GAUCHE / DROITE pour vous diriger.
                    </p>
                    <button onClick={() => setGameState('playing')} className="px-8 py-4 bg-amber-800 text-white font-bold rounded hover:bg-amber-700 border-2 border-amber-600">
                        COMMENCER L'ASCENSION
                    </button>
                    <button onClick={onExit} className="mt-8 text-gray-600 text-xs">Quitter</button>
                </div>
            )}

            {gameState === 'lost' && (
                <div className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">💀</div>
                    <h2 className="text-4xl font-bold text-white mb-2">CHUTE MORTELLE</h2>
                    <button onClick={() => setGameState('playing')} className="mt-8 px-6 py-2 bg-black text-white rounded">Réessayer</button>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">🚁</div>
                    <h2 className="text-4xl font-bold text-white mb-2">EXTRACTION RÉUSSIE</h2>
                    <p>Kong vous regarde partir...</p>
                </div>
            )}

        </div>
    );
}
