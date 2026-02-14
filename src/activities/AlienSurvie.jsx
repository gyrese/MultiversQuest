import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Grid size
const ROWS = 10;
const COLS = 10;
const CELL_SIZE = 30; // Base size, will scale

const LEVELS = [
    {
        id: 1,
        playerStart: { x: 1, y: 1 },
        exit: { x: 8, y: 8 },
        walls: [
            { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
            { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
            { x: 1, y: 5 }, { x: 2, y: 5 },
            { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 8, y: 3 }
        ],
        enemies: [
            { id: 1, path: [{ x: 4, y: 1 }, { x: 4, y: 4 }], speed: 1000, current: 0 },
            { id: 2, path: [{ x: 6, y: 8 }, { x: 6, y: 5 }], speed: 1200, current: 0 }
        ]
    },
    {
        id: 2,
        playerStart: { x: 0, y: 9 },
        exit: { x: 9, y: 0 },
        walls: [
            { x: 2, y: 9 }, { x: 2, y: 8 }, { x: 2, y: 7 },
            { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
            { x: 6, y: 9 }, { x: 6, y: 8 }, { x: 6, y: 7 }, { x: 6, y: 6 },
            { x: 8, y: 0 }, { x: 8, y: 1 }, { x: 8, y: 2 }
        ],
        enemies: [
            { id: 1, path: [{ x: 0, y: 5 }, { x: 9, y: 5 }], speed: 2000, current: 0 }, // Long patrol
            { id: 2, path: [{ x: 3, y: 0 }, { x: 3, y: 4 }], speed: 1500, current: 0 },
            { id: 3, path: [{ x: 7, y: 9 }, { x: 7, y: 5 }], speed: 1500, current: 0 }
        ]
    }
];

export default function AlienSurvie({ onComplete, onExit }) {
    const [levelIndex, setLevelIndex] = useState(0);
    const [playerPos, setPlayerPos] = useState(LEVELS[0].playerStart);
    const [enemies, setEnemies] = useState(LEVELS[0].enemies.map(e => ({ ...e, pos: e.path[0] })));
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    // Game Loop for Enemies
    useEffect(() => {
        if (gameOver || gameWon) return;

        const level = LEVELS[levelIndex];
        const interval = setInterval(() => {
            setEnemies(prev => prev.map(enemy => {
                // Move towards next path point
                const target = enemy.path[(enemy.current + 1) % enemy.path.length];
                const current = enemy.pos;

                let nextPos = { ...current };
                if (current.x < target.x) nextPos.x += 0.2; // Smooth movement
                else if (current.x > target.x) nextPos.x -= 0.2;

                if (current.y < target.y) nextPos.y += 0.2;
                else if (current.y > target.y) nextPos.y -= 0.2;

                // Check if reached target (approx)
                if (Math.abs(nextPos.x - target.x) < 0.1 && Math.abs(nextPos.y - target.y) < 0.1) {
                    return { ...enemy, pos: target, current: (enemy.current + 1) % enemy.path.length };
                }

                return { ...enemy, pos: nextPos };
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [levelIndex, gameOver, gameWon]);

    // Collision Check
    useEffect(() => {
        if (gameOver || gameWon) return;

        // Enemy collision
        const hit = enemies.some(e => Math.abs(e.pos.x - playerPos.x) < 0.6 && Math.abs(e.pos.y - playerPos.y) < 0.6);
        if (hit) {
            setGameOver(true);
        }

        // Exit reached
        const exit = LEVELS[levelIndex].exit;
        if (Math.round(playerPos.x) === exit.x && Math.round(playerPos.y) === exit.y) {
            if (levelIndex < LEVELS.length - 1) {
                // Next Level
                const nextLvl = levelIndex + 1;
                setLevelIndex(nextLvl);
                setPlayerPos(LEVELS[nextLvl].playerStart);
                setEnemies(LEVELS[nextLvl].enemies.map(e => ({ ...e, pos: e.path[0] })));
            } else {
                setGameWon(true);
                setTimeout(() => onComplete(400), 2000);
            }
        }

    }, [playerPos, enemies, levelIndex, gameOver, gameWon]);

    const handleMove = (dx, dy) => {
        if (gameOver || gameWon) return;

        const nextX = Math.round(playerPos.x + dx);
        const nextY = Math.round(playerPos.y + dy);

        // Bounds check
        if (nextX < 0 || nextX >= COLS || nextY < 0 || nextY >= ROWS) return;

        // Wall check
        const wall = LEVELS[levelIndex].walls.some(w => w.x === nextX && w.y === nextY);
        if (wall) return;

        setPlayerPos({ x: nextX, y: nextY });
    };

    const restartLevel = () => {
        setGameOver(false);
        setPlayerPos(LEVELS[levelIndex].playerStart);
        setEnemies(LEVELS[levelIndex].enemies.map(e => ({ ...e, pos: e.path[0] })));
    };

    return (
        <div className="fixed inset-0 bg-black text-green-500 font-mono flex flex-col items-center justify-center overflow-hidden touch-none select-none">
            {/* CRT Effect Overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00ff00_3px)]" />
            <div className="absolute inset-0 z-50 pointer-events-none opacity-50 bg-[radial-gradient(circle,transparent_50%,black_150%)]" />

            {/* Header */}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                <div>SECTEUR {levelIndex + 1}/{LEVELS.length}</div>
                <button onClick={onExit} className="border border-green-500 px-2 hover:bg-green-900">ABANDONNER</button>
            </div>

            {/* Game Screen */}
            <div className="relative border-4 border-green-900 bg-[#051005] shadow-[0_0_20px_rgba(0,255,0,0.2)] rounded-lg p-1"
                style={{ width: '320px', height: '320px' }} // Fixed size for simplicity
            >
                {/* Exit */}
                <div className="absolute w-[30px] h-[30px] bg-blue-500/50 border border-blue-400 animate-pulse flex items-center justify-center text-xs text-white"
                    style={{
                        left: LEVELS[levelIndex].exit.x * 30 + 5,
                        top: LEVELS[levelIndex].exit.y * 30 + 5
                    }}
                >EXIT</div>

                {/* Walls */}
                {LEVELS[levelIndex].walls.map((w, i) => (
                    <div key={i}
                        className="absolute w-[30px] h-[30px] bg-green-900/50 border border-green-700"
                        style={{ left: w.x * 30 + 5, top: w.y * 30 + 5 }}
                    />
                ))}

                {/* Enemies (Aliens) */}
                {enemies.map((e, i) => (
                    <div key={i}
                        className="absolute w-[30px] h-[30px] bg-red-600 rounded-full blur-[2px] transition-all duration-75 flex items-center justify-center"
                        style={{ left: e.pos.x * 30 + 5, top: e.pos.y * 30 + 5 }}
                    >
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                ))}

                {/* Player */}
                <div className="absolute w-[24px] h-[24px] bg-green-400 rounded-sm shadow-[0_0_10px_#0f0] transition-all duration-100 z-10"
                    style={{ left: playerPos.x * 30 + 8, top: playerPos.y * 30 + 8 }}
                />

                {/* Game Over Screen */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 text-red-500">
                        <h2 className="text-2xl font-bold mb-4">SIGNAL PERDU</h2>
                        <button onClick={restartLevel} className="border border-red-500 px-4 py-2 hover:bg-red-900 text-white">RÉESSAYER</button>
                    </div>
                )}

                {/* Win Screen */}
                {gameWon && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-green-400">
                        <h2 className="text-2xl font-bold mb-4">ÉVACUATION RÉUSSIE</h2>
                    </div>
                )}
            </div>

            {/* D-Pad Controls */}
            <div className="mt-8 grid grid-cols-3 gap-2">
                <div />
                <button
                    onPointerDown={() => handleMove(0, -1)}
                    className="w-16 h-16 bg-green-900/30 border border-green-500 rounded flex items-center justify-center text-2xl active:bg-green-500 active:text-black"
                >▲</button>
                <div />
                <button
                    onPointerDown={() => handleMove(-1, 0)}
                    className="w-16 h-16 bg-green-900/30 border border-green-500 rounded flex items-center justify-center text-2xl active:bg-green-500 active:text-black"
                >◀</button>
                <div className="w-16 h-16 flex items-center justify-center font-bold text-xs text-center leading-none opacity-50">
                    MVT
                </div>
                <button
                    onPointerDown={() => handleMove(1, 0)}
                    className="w-16 h-16 bg-green-900/30 border border-green-500 rounded flex items-center justify-center text-2xl active:bg-green-500 active:text-black"
                >▶</button>
                <div />
                <button
                    onPointerDown={() => handleMove(0, 1)}
                    className="w-16 h-16 bg-green-900/30 border border-green-500 rounded flex items-center justify-center text-2xl active:bg-green-500 active:text-black"
                >▼</button>
                <div />
            </div>

        </div>
    );
}
