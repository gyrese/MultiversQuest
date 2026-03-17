import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GRAVITY = 0.5;

export default function PrimalHunt({ onComplete, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, playing, won
    const [spear, setSpear] = useState({ x: 100, y: 300, vx: 0, vy: 0, active: false });
    const [mammoth, setMammoth] = useState({ x: 600, y: 300, dir: -1, hp: 3 });
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);

    const gameAreaRef = useRef();
    const loopRef = useRef();

    // Game Loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const loop = () => {
            // Move Spear
            if (spear.active) {
                setSpear(prev => {
                    const nextX = prev.x + prev.vx;
                    const nextY = prev.y + prev.vy;
                    const nextVy = prev.vy + GRAVITY;

                    // Collision with Floor
                    if (nextY > 350) {
                        return { ...prev, y: 350, vx: 0, vy: 0, active: false }; // Stick in ground
                    }

                    // Collision with Mammoth (Hitbox approx 100x60)
                    if (
                        nextX > mammoth.x && nextX < mammoth.x + 100 &&
                        nextY > mammoth.y && nextY < mammoth.y + 60
                    ) {
                        // Hit!
                        setMammoth(m => ({ ...m, hp: m.hp - 1 }));
                        return { ...prev, active: false, x: -1000 }; // Remove spear
                    }

                    // Out of bounds
                    if (nextX > 800 || nextX < 0) {
                        return { ...prev, active: false };
                    }

                    return { x: nextX, y: nextY, vx: prev.vx, vy: nextVy, active: true };
                });
            }

            // Move Mammoth
            setMammoth(prev => {
                let nextX = prev.x + (prev.dir * 2);
                let nextDir = prev.dir;

                if (nextX < 400) nextDir = 1;
                if (nextX > 700) nextDir = -1;

                if (prev.hp <= 0) {
                    setGameState('won');
                    setTimeout(() => onComplete(prev.hp * 100 + 300), 2000); // Score based on... wait HP is 0. Base score.
                }

                return { ...prev, x: nextX, dir: nextDir };
            });

            loopRef.current = requestAnimationFrame(loop);
        };
        loopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(loopRef.current);
    }, [gameState, spear.active, mammoth.hp]);

    // Drag Logic
    const handlePointerDown = (e) => {
        if (spear.active) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handlePointerMove = (e) => {
        if (!dragStart || spear.active) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        setDragEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handlePointerUp = () => {
        if (!dragStart || !dragEnd) {
            setDragStart(null);
            setDragEnd(null);
            return;
        };

        // Calculate Launch Vector
        // Drag BACKWARDS to shoot FORWARDS
        const dx = dragStart.x - dragEnd.x;
        const dy = dragStart.y - dragEnd.y;

        const power = Math.min(20, Math.sqrt(dx * dx + dy * dy) * 0.15);
        const angle = Math.atan2(dy, dx);

        setSpear(prev => ({
            ...prev,
            vx: Math.cos(angle) * power,
            vy: Math.sin(angle) * power,
            active: true
        }));

        setDragStart(null);
        setDragEnd(null);
    };

    // Respawn Spear logic
    useEffect(() => {
        if (!spear.active && spear.y >= 350) {
            // Stick delay then reset
            const timer = setTimeout(() => {
                setSpear({ x: 100, y: 300, vx: 0, vy: 0, active: false });
            }, 1000);
            return () => clearTimeout(timer);
        }
        if (!spear.active && spear.x === -1000) {
            // Hit reset
            const timer = setTimeout(() => {
                setSpear({ x: 100, y: 300, vx: 0, vy: 0, active: false });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [spear.active, spear.y, spear.x]);

    return (
        <div className="fixed inset-0 bg-blue-200 select-none overflow-hidden touch-none flex flex-col items-center justify-center">

            {/* Game Container */}
            <div
                ref={gameAreaRef}
                className="relative w-[800px] h-[400px] bg-[#87CEEB] overflow-hidden border-4 border-[#5D4037] cursor-crosshair shadow-2xl"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Background */}
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#87CEEB] to-[#FFF8E1]" />
                <div className="absolute bottom-0 w-full h-[50px] bg-[#5D4037]" /> {/* Ground */}

                {/* Trajectory Hint */}
                {dragStart && dragEnd && (
                    <svg className="absolute inset-0 pointer-events-none z-10">
                        <line
                            x1={spear.x} y1={spear.y}
                            x2={spear.x + (dragStart.x - dragEnd.x)}
                            y2={spear.y + (dragStart.y - dragEnd.y)}
                            stroke="rgba(255,0,0,0.5)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                    </svg>
                )}

                {/* Spear */}
                <div
                    className="absolute z-20 w-20 h-2 bg-black origin-left"
                    style={{
                        left: spear.x,
                        top: spear.y,
                        transform: `rotate(${Math.atan2(spear.vy, spear.vx) * (180 / Math.PI)}deg)`
                    }}
                >
                    <div className="absolute right-0 top-[-2px] w-4 h-4 bg-gray-400 transform rotate-45" /> {/* Tip */}
                </div>

                {/* Mammoth */}
                {mammoth.hp > 0 && (
                    <div
                        className="absolute z-10 w-[100px] h-[60px] bg-[#3E2723] rounded-full flex items-center justify-center transition-transform"
                        style={{
                            left: mammoth.x,
                            top: mammoth.y,
                            transform: `scaleX(${mammoth.dir * -1})` // Flip
                        }}
                    >
                        {/* CSS Mammoth */}
                        <div className="absolute top-[-10px] left-[10px] w-30 h-20 bg-[#3E2723] rounded-full" />
                        <div className="absolute top-2 left-[-20px] w-10 h-10 bg-white rounded-full transform -rotate-45" /> {/* Tusk */}
                        <div className="absolute top-0 right-2 w-2 h-2 bg-white rounded-full" /> {/* Eye */}

                        {/* HP Bar */}
                        <div className="absolute -top-6 w-full h-2 bg-red-900">
                            <div className="h-full bg-green-500" style={{ width: `${(mammoth.hp / 3) * 100}%` }} />
                        </div>
                    </div>
                )}

                {/* UI */}
                <div className="absolute top-4 left-4 font-bold text-[#3E2723]">
                    LANCES: ∞<br />
                    CIBLE: MAMMOUTH ({mammoth.hp} PV)
                </div>

            </div>

            {/* Intro */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-50 bg-[#3E2723]/90 flex flex-col items-center justify-center text-[#FFF8E1]">
                    <h1 className="text-4xl font-bold mb-4">CHASSE À LA LANCE</h1>
                    <p className="mb-6 max-w-md text-center">
                        Maintenez et glissez vers l'arrière pour viser.<br />
                        Relâchez pour lancer.<br />
                        Touchez le mammouth 3 fois.
                    </p>
                    <button onClick={() => setGameState('playing')} className="px-8 py-3 bg-[#FF6F00] text-white font-bold rounded shadow-lg uppercase">
                        CHASSER
                    </button>
                    <button onClick={onExit} className="mt-8 text-xs underline opacity-50">PARTIR BREDOUILLE</button>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 bg-[#1B5E20]/90 flex flex-col items-center justify-center text-white">
                    <h1 className="text-5xl font-bold mb-4">MAMMOUTH VAINCUS</h1>
                    <p className="text-2xl mb-8">La tribu mangera ce soir.</p>
                </div>
            )}
        </div>
    );
}
