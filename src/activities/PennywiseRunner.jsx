import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ASSETS & STYLES ---
const SEWER_SVG = `data:image/svg+xml,%3Csvg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='brick' width='40' height='20' patternUnits='userSpaceOnUse'%3E%3Crect width='40' height='20' fill='%231a1a1a'/%3E%3Cpath d='M0 10h40M20 0v10M0 20h40M20 10v10' stroke='%23333' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23brick)'/%3E%3C/svg%3E`;

const LANES = [-1, 0, 1]; // Left, Center, Right
const LANE_WIDTH = 100;

export default function PennywiseRunner({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, playing, won, lost
    const [playerLane, setPlayerLane] = useState(0); // Index 0-2 (mapped to LANES)
    const [distance, setDistance] = useState(0);
    const [obstacles, setObstacles] = useState([]);
    const [balloons, setBalloons] = useState([]);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(8);

    const gameLoopRef = useRef(null);
    const lastSpawnRef = useRef(0);

    // --- GAME LOOP ---
    useEffect(() => {
        if (gameState !== 'playing') return;

        const loop = () => {
            setDistance(d => d + 1);

            // Move Obstacles & Balloons
            setObstacles(prev => {
                const newObs = prev.map(o => ({ ...o, z: o.z - speed })).filter(o => o.z > -100);

                // Collision Detection
                const playerZ = 0; // Player is fixed at Z=0
                // Simple box collision
                for (let o of newObs) {
                    if (Math.abs(o.z - playerZ) < 50 && o.lane === playerLane) {
                        setGameState('lost');
                        return prev; // Stop everything
                    }
                }
                return newObs;
            });

            setBalloons(prev => {
                const newBalloons = prev.map(b => ({ ...b, z: b.z - speed })).filter(b => b.z > -100);
                // Collection Detection
                const playerZ = 0;
                for (let b of newBalloons) {
                    if (Math.abs(b.z - playerZ) < 50 && b.lane === playerLane && !b.collected) {
                        b.collected = true; // Visual feedback
                        setScore(s => s + 10);
                    }
                }
                return newBalloons.filter(b => !b.collected);
            });

            // Spawning Logic
            if (Date.now() - lastSpawnRef.current > 1500 / (speed / 8)) {
                spawnEntity();
                lastSpawnRef.current = Date.now();
            }

            // Progression
            if (distance > 1000) { // arbitrary units
                setSpeed(10);
            }
            if (distance > 2000) {
                setGameState('won');
                setTimeout(() => onComplete(Math.min(500, score)), 2000);
                return;
            }

            gameLoopRef.current = requestAnimationFrame(loop);
        };

        gameLoopRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(gameLoopRef.current);

    }, [gameState, playerLane, speed, distance]);

    const spawnEntity = () => {
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const type = Math.random() > 0.3 ? 'obstacle' : 'balloon';

        if (type === 'obstacle') {
            setObstacles(prev => [...prev, { lane, z: 1000, id: Date.now() }]);
        } else {
            setBalloons(prev => [...prev, { lane, z: 1000, id: Date.now() }]);
        }
    };

    // --- CONTROLS ---
    const handleSwipe = (direction) => {
        setPlayerLane(current => {
            if (direction === 'left') return Math.max(-1, current - 1);
            if (direction === 'right') return Math.min(1, current + 1);
            return current;
        });
    };

    return (
        <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden touch-none select-none flex flex-col items-center justify-center">

            {/* 3D PERSPECTIVE CONTAINER */}
            <div className="absolute inset-0 perspective-container bg-[#050510]" style={{ perspective: '800px', overflow: 'hidden' }}>

                {/* Sewer Walls / Tunnel Effect */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("${SEWER_SVG}")`, backgroundSize: '100px 100px', transform: `translateY(${distance * 5}px)` }} />

                {/* Fog */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-20" />


                {gameState === 'playing' && (
                    <div className="relative w-full h-full preserve-3d" style={{ transformStyle: 'preserve-3d' }}>

                        {/* GROUND PLANE */}
                        <div className="absolute bottom-0 left-1/2 w-[600px] h-[2000px] bg-[#1a1a1a] origin-bottom transform -translate-x-1/2 rotate-x-60 translate-z-[-200px]"
                            style={{
                                backgroundImage: 'linear-gradient(to bottom, transparent 0%, #333 100%), linear-gradient(90deg, transparent 49%, #444 50%, transparent 51%)',
                                backgroundSize: '100% 100%, 33.33% 100%'
                            }}
                        />

                        {/* Player */}
                        <motion.div
                            className="absolute bottom-20 left-1/2 w-16 h-24 bg-yellow-500 rounded-lg shadow-[0_10px_20px_black] z-30 flex items-center justify-center text-3xl"
                            animate={{ x: playerLane * 100 - 32, y: [0, -10, 0] }} // -32 is half width to center
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, y: { repeat: Infinity, duration: 0.5 } }}
                        >
                            🏃
                        </motion.div>

                        {/* Obstacles */}
                        {obstacles.map(obj => (
                            <motion.div
                                key={obj.id}
                                className="absolute bottom-20 left-1/2 w-16 h-16 bg-gray-800 border b-gray-600 rounded flex items-center justify-center text-2xl z-20"
                                style={{
                                    x: obj.lane * 100 - 32,
                                    scale: (1000 - obj.z) / 1000,
                                    opacity: (1000 - obj.z) / 1000,
                                    bottom: 100 + (obj.z / 10) // Fake depth
                                }}
                            >
                                🚧
                            </motion.div>
                        ))}

                        {/* Balloons */}
                        {balloons.map(obj => (
                            <motion.div
                                key={obj.id}
                                className="absolute bottom-40 left-1/2 w-12 h-16 bg-red-600 rounded-full flex items-center justify-center text-xs z-20 shadow-[0_0_15px_red] opacity-80"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{
                                    x: obj.lane * 100 - 24,
                                    scale: (1000 - obj.z) / 1000,
                                    opacity: (1000 - obj.z) / 1000,
                                    bottom: 150 + (obj.z / 10) // Fake depth
                                }}
                            >
                                🎈
                            </motion.div>
                        ))}

                    </div>
                )}
            </div>

            {/* UI LAYER */}
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                    <button onClick={onExit} className="pointer-events-auto px-4 py-2 bg-black/50 text-white border border-white/20 rounded">QUITTER</button>
                    <div className="text-2xl font-bold text-red-500">{score} PTS</div>
                </div>

                {gameState === 'playing' && (
                    <div className="flex justify-between w-full pointer-events-auto h-1/2 items-end pb-10 gap-4">
                        <button onPointerDown={() => handleSwipe('left')} className="flex-1 h-32 bg-white/5 active:bg-white/20 rounded-xl border border-white/10 flex items-center justify-center text-4xl">⬅️</button>
                        <button onPointerDown={() => handleSwipe('right')} className="flex-1 h-32 bg-white/5 active:bg-white/20 rounded-xl border border-white/10 flex items-center justify-center text-4xl">➡️</button>
                    </div>
                )}
            </div>

            {gameState === 'intro' && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-8 pointer-events-auto">
                    <div className="text-6xl mb-4 animate-bounce">🎈</div>
                    <h1 className="text-5xl font-black text-red-600 mb-2 font-serif tracking-widest">ÇA</h1>
                    <p className="text-gray-400 mb-8 max-w-sm">
                        Courez. Ne vous arrêtez jamais.<br />
                        Évitez les obstacles.<br />
                        Attrapez les ballons rouges pour marquer des points.
                    </p>
                    <button onClick={() => setGameState('playing')} className="px-8 py-4 bg-red-700 text-white font-bold text-xl rounded hover:bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.4)]">
                        COURIR
                    </button>
                </div>
            )}

            {gameState === 'lost' && (
                <div className="absolute inset-0 z-50 bg-red-900 flex flex-col items-center justify-center pointer-events-auto">
                    <h1 className="text-6xl font-black mb-4">MORT</h1>
                    <p className="text-2xl mb-8">Tu flotteras aussi...</p>
                    <button onClick={() => { setGameState('playing'); setDistance(0); setObstacles([]); }} className="px-6 py-3 bg-black text-white rounded font-bold">RÉESSAYER</button>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 bg-white text-black flex flex-col items-center justify-center pointer-events-auto">
                    <h1 className="text-5xl font-bold mb-4">SURVIVANT</h1>
                    <p className="text-xl">La peur ne vous contrôle plus.</p>
                </div>
            )}

        </div>
    );
}
