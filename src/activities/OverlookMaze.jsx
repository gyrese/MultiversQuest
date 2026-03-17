import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG ---
const MAZE_SIZE = 15;
const CELL_SIZE = 40; // Virtual pixels for calculation

// Recursive Backtracker Maze Gen
const generateMaze = (width, height) => {
    const grid = Array(height).fill().map(() => Array(width).fill(1)); // 1 = Wall
    const stack = [];
    const start = { x: 1, y: 1 };
    grid[start.y][start.x] = 0; // 0 = Path
    stack.push(start);

    const directions = [
        { dx: 0, dy: -2 }, // Up
        { dx: 2, dy: 0 },  // Right
        { dx: 0, dy: 2 },  // Down
        { dx: -2, dy: 0 }  // Left
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const validNeighbors = [];

        for (let d of directions) {
            const nx = current.x + d.dx;
            const ny = current.y + d.dy;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === 1) {
                validNeighbors.push({ nx, ny, tx: current.x + d.dx / 2, ty: current.y + d.dy / 2 });
            }
        }

        if (validNeighbors.length > 0) {
            const chosen = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
            grid[chosen.ty][chosen.tx] = 0; // Remove wall between
            grid[chosen.ny][chosen.nx] = 0; // Mark neighbor as path
            stack.push({ x: chosen.nx, y: chosen.ny });
        } else {
            stack.pop();
        }
    }
    return grid;
};

// Overlook Carpet Pattern SVG Pattern
const CARPET_PATTERN = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b91c1c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3Cpath d='M0 0h60v60H0z' stroke='%23f97316' stroke-width='2' fill='none' opacity='0.2'/%3E%3C/g%3E%3C/svg%3E`;

export default function OverlookMaze({ onComplete, onExit }) {
    const [maze, setMaze] = useState([]);
    const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
    const [keyPos, setKeyPos] = useState(null);
    const [exitPos, setExitPos] = useState({ x: MAZE_SIZE - 2, y: MAZE_SIZE - 2 });
    const [hasKey, setHasKey] = useState(false);
    const [jackPos, setJackPos] = useState({ x: MAZE_SIZE - 2, y: 1 });
    const [gameState, setGameState] = useState('intro'); // intro, playing, won, lost
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

    const containerRef = useRef(null);

    // Init Maze
    useEffect(() => {
        if (gameState !== 'playing') return;
        const newMaze = generateMaze(MAZE_SIZE, MAZE_SIZE);
        setMaze(newMaze);

        // Find random spots for key
        let kx, ky;
        do {
            kx = Math.floor(Math.random() * (MAZE_SIZE - 2)) + 1;
            ky = Math.floor(Math.random() * (MAZE_SIZE - 2)) + 1;
        } while (newMaze[ky][kx] === 1 || (kx < 4 && ky < 4)); // Not near start or in wall

        setKeyPos({ x: kx, y: ky });
        setExitPos({ x: MAZE_SIZE - 2, y: MAZE_SIZE - 2 });
        setPlayerPos({ x: 1, y: 1 });
        setJackPos({ x: MAZE_SIZE - 2, y: 1 });
        setHasKey(false);

    }, [gameState]);

    // Jack AI
    useEffect(() => {
        if (gameState !== 'playing') return;
        const interval = setInterval(() => {
            setJackPos(prev => {
                // Extremely simple AI: Move towards player if possible, else random
                // Actually, let's make him phase through walls slowly? No that's cheating.
                // Simple Manhattan movement valid check
                let next = { ...prev };
                const dx = playerPos.x - prev.x;
                const dy = playerPos.y - prev.y;

                // Try move X
                if (Math.abs(dx) > Math.abs(dy)) {
                    const stepX = prev.x + (dx > 0 ? 1 : -1);
                    if (maze[prev.y][stepX] === 0) { next.x = stepX; }
                    else if (maze[prev.y + (dy > 0 ? 1 : -1)]?.[prev.x] === 0) { next.y += (dy > 0 ? 1 : -1); }
                } else {
                    const stepY = prev.y + (dy > 0 ? 1 : -1);
                    if (maze[stepY][prev.x] === 0) { next.y = stepY; }
                    else if (maze[prev.y][prev.x + (dx > 0 ? 1 : -1)] === 0) { next.x += (dx > 0 ? 1 : -1); }
                }

                // Catch check
                if (Math.abs(next.x - playerPos.x) < 1 && Math.abs(next.y - playerPos.y) < 1) {
                    setGameState('lost');
                }

                return next;
            });
        }, 800); // Jack speed

        return () => clearInterval(interval);
    }, [maze, playerPos, gameState]);

    // Controls
    const move = (dx, dy) => {
        if (gameState !== 'playing') return;
        const nx = playerPos.x + dx;
        const ny = playerPos.y + dy;

        if (maze[ny] && maze[ny][nx] === 0) {
            setPlayerPos({ x: nx, y: ny });

            // Key check
            if (!hasKey && nx === keyPos.x && ny === keyPos.y) {
                setHasKey(true);
            }

            // Exit check
            if (hasKey && nx === exitPos.x && ny === exitPos.y) {
                setGameState('won');
                setTimeout(() => onComplete(500), 2000);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white font-serif overflow-hidden touch-none select-none flex flex-col">

            {gameState === 'intro' && (
                <div className="absolute inset-0 z-50 bg-[#1a0f0f] flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
                    <h1 className="text-5xl font-bold text-orange-700 mb-4" style={{ fontFamily: 'Courier New' }}>ROOM 237</h1>
                    <p className="mb-8 text-xl">Trouvez la clé.<br />Échappez-vous de l'hôtel.<br />Ne laissez pas Jack vous attraper.</p>
                    <button onClick={() => setGameState('playing')} className="px-8 py-3 bg-red-900 text-white font-bold rounded shadow-lg animate-pulse">
                        ENTRER
                    </button>
                    <div className="mt-8 opacity-50 text-sm">Contrôles : Glissez ou touchez les flèches</div>
                </div>
            )}

            {gameState === 'playing' && (
                <>
                    {/* Header HUD */}
                    <div className="h-16 bg-[#2d1b1b] border-b-4 border-orange-900 flex items-center justify-between px-4 z-20 relative shadow-lg">
                        <div className="text-orange-500 font-bold text-xl">
                            {hasKey ? "🏃 FUYEZ !" : "🔑 TROUVEZ LA CLÉ"}
                        </div>
                        <button onClick={onExit} className="text-xs text-red-500/50 uppercase">Abandonner</button>
                    </div>

                    {/* Maze Viewport */}
                    <div className="flex-1 relative overflow-hidden bg-orange-900">
                        {/* Carpet Pattern Background for Floor */}
                        <div className="absolute inset-0 z-0 opacity-80" style={{ backgroundImage: `url("${CARPET_PATTERN}")`, backgroundSize: '60px 60px' }} />

                        {/* MAZE SCENE */}
                        <motion.div
                            className="absolute"
                            animate={{
                                x: -playerPos.x * 40 + window.innerWidth / 2 - 20,
                                y: -playerPos.y * 40 + window.innerHeight / 2 - 20
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* Render Maze */}
                            {maze.map((row, y) => row.map((cell, x) => {
                                if (cell === 1) { // Wall
                                    return (
                                        <div key={`${x}-${y}`}
                                            className="absolute w-[40px] h-[40px] bg-[#2a1a1a] border border-[#1a0a0a] shadow-inner"
                                            style={{ left: x * 40, top: y * 40 }}
                                        />
                                    );
                                }
                                return null;
                            }))}

                            {/* Elements */}
                            {!hasKey && keyPos && (
                                <div className="absolute w-[40px] h-[40px] flex items-center justify-center animate-bounce text-2xl"
                                    style={{ left: keyPos.x * 40, top: keyPos.y * 40 }}>
                                    🔑
                                </div>
                            )}

                            <div className="absolute w-[40px] h-[40px] flex items-center justify-center text-4xl"
                                style={{ left: exitPos.x * 40, top: exitPos.y * 40 }}>
                                🚪
                            </div>

                            {/* Jack */}
                            <motion.div
                                className="absolute w-[40px] h-[40px] flex items-center justify-center text-3xl z-10 transition-all duration-700"
                                style={{ left: jackPos.x * 40, top: jackPos.y * 40 }}
                            >
                                🪓
                            </motion.div>

                            {/* Player (Danny) */}
                            <div className="absolute w-[30px] h-[30px] bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_white] z-20 top-[5px] left-[5px]"
                                style={{ left: playerPos.x * 40 + 5, top: playerPos.y * 40 + 5 }} // +5 offset for centering in 40px cell
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-xs">🚗</div>
                            </div>
                        </motion.div>

                        {/* Fog of War (Vignette) */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50px,black_300px)] z-30" />

                        {/* Red Flash on Danger */}
                        {Math.abs(jackPos.x - playerPos.x) + Math.abs(jackPos.y - playerPos.y) < 4 && (
                            <div className="absolute inset-0 pointer-events-none bg-red-500/20 animate-pulse z-40" />
                        )}
                    </div>

                    {/* D-Pad */}
                    <div className="h-48 bg-[#1a0f0f] relative z-50 grid grid-cols-3 gap-2 p-4 pb-8">
                        <div />
                        <button onPointerDown={() => move(0, -1)} className="bg-orange-900/50 rounded flex items-center justify-center text-2xl active:bg-orange-500">⬆️</button>
                        <div />
                        <button onPointerDown={() => move(-1, 0)} className="bg-orange-900/50 rounded flex items-center justify-center text-2xl active:bg-orange-500">⬅️</button>
                        <div className="flex items-center justify-center text-orange-500 font-bold text-center text-xs">D-PAD</div>
                        <button onPointerDown={() => move(1, 0)} className="bg-orange-900/50 rounded flex items-center justify-center text-2xl active:bg-orange-500">➡️</button>
                        <div />
                        <button onPointerDown={() => move(0, 1)} className="bg-orange-900/50 rounded flex items-center justify-center text-2xl active:bg-orange-500">⬇️</button>
                        <div />
                    </div>
                </>
            )}

            {gameState === 'lost' && (
                <div className="absolute inset-0 z-50 bg-red-900 flex flex-col items-center justify-center">
                    <h1 className="text-6xl font-black mb-4 animate-bounce">HERE'S JOHNNY!</h1>
                    <div className="text-9xl mb-8">🪓</div>
                    <button onClick={() => setGameState('playing')} className="px-6 py-2 bg-black text-white rounded">Réessayer</button>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 bg-white text-black flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-bold mb-4">ÉCHAPPÉ !</h1>
                    <div className="text-6xl mb-8">❄️</div>
                </div>
            )}
        </div>
    );
}
