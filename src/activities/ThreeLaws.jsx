import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThreeLaws({ onComplete, onExit }) {
    const [robots, setRobots] = useState([]);
    const [orders, setOrders] = useState([]); // { x, y, type: 'stop' | 'turn' | 'jump' }
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('intro'); // intro, playing, won, lost
    const [level, setLevel] = useState(1);
    const [selectedTool, setSelectedTool] = useState('stop');

    // CONFIG
    const WIDTH = 800;
    const HEIGHT = 400;
    const SPAWN_RATE = 2000;
    const ROBOT_SPEED = 2;

    useEffect(() => {
        if (gameState !== 'playing') return;

        const interval = setInterval(() => {
            // Spawn Robots
            if (Math.random() < 0.05 && robots.length < 10) {
                setRobots(prev => [...prev, {
                    id: Date.now(),
                    x: 50,
                    y: HEIGHT - 50,
                    dir: 1, // 1: Right, -1: Left
                    state: 'walk' // walk, fall, dead, safe
                }]);
            }

            // Move Robots
            setRobots(prev => prev.map(rob => {
                if (rob.state === 'dead' || rob.state === 'safe') return rob;

                let next = { ...rob };

                // Gravity / Falling
                // Simple floor check
                const floorY = HEIGHT - 50;

                // Forward movement
                next.x += next.dir * ROBOT_SPEED;

                // Border check (Die if fall off screen)
                if (next.x < 0 || next.x > WIDTH) {
                    next.state = 'dead';
                }

                // Interaction with Orders
                for (let order of orders) {
                    if (Math.abs(next.x - order.x) < 20 && Math.abs(next.y - order.y) < 20) {
                        if (order.type === 'stop') {
                            next.dir = 0; // Stop
                        } else if (order.type === 'turn') {
                            next.dir *= -1; // Turn around
                            // Remove order one-time use? Or keep? Let's keep for now.
                        } else if (order.type === 'safe') { // Goal
                            next.state = 'safe';
                            setScore(s => s + 100);
                        }
                    }
                }

                // Check Win
                if (score >= 500) {
                    setGameState('won');
                    setTimeout(() => onComplete(score), 2000);
                }

                return next;
            }));

        }, 50);

        return () => clearInterval(interval);
    }, [gameState, robots, orders, score]);

    const handlePlaceOrder = (e) => {
        if (gameState !== 'playing') return;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setOrders(prev => [...prev, { x, y: HEIGHT - 50, type: selectedTool }]);
    };

    return (
        <div className="fixed inset-0 bg-[#e0e0e0] text-gray-800 font-sans select-none flex flex-col items-center justify-center">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-white shadow flex justify-between items-center z-20">
                <div className="font-bold text-xl text-blue-600">USR ROBOTICS LAB</div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setSelectedTool('stop')}
                        className={`px-4 py-2 rounded border ${selectedTool === 'stop' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                    >
                        ✋ STOP
                    </button>
                    <button
                        onClick={() => setSelectedTool('turn')}
                        className={`px-4 py-2 rounded border ${selectedTool === 'turn' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
                    >
                        ↩️ TURN
                    </button>
                    <div className="px-4 py-2 font-mono bg-black text-green-400 rounded">
                        SCORE: {score}/500
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div
                className="relative w-[800px] h-[400px] bg-white border-2 border-gray-400 overflow-hidden shadow-inner cursor-crosshair"
                onClick={handlePlaceOrder}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                />

                {/* Exit Goal */}
                <div className="absolute bottom-[50px] right-[50px] w-16 h-24 bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-xs text-center">
                    SAFE<br />ZONE
                </div>
                {/* Invisible trigger for goal */}
                {/* Actually let's add a persistent order for goal */}
                {/* Done via logic check above? No, need explicit order. */}
                {/* Hack: Add invisible 'safe' order at init */}
            </div>

            {/* Render Objects */}
            {/* Need to portal or relative render inside the game area div */}
            {/* ... simplified for React code gen, doing absolute overlay */}
            {/* RE-ARCHITECTING RENDERING FOR SIMPLICITY */}

            {/* Just overlay on top of game area */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none">

                {/* Orders */}
                {orders.map((o, i) => (
                    <div key={i} className="absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-md"
                        style={{ left: o.x, top: o.y, backgroundColor: o.type === 'stop' ? 'red' : 'orange' }}>
                        {o.type === 'stop' ? '✋' : '↩️'}
                    </div>
                ))}

                {/* Robots */}
                {robots.map(r => (
                    <motion.div
                        key={r.id}
                        className="absolute w-8 h-12 bg-blue-500 rounded-t-lg border border-blue-700 flex items-center justify-center text-xs text-white"
                        style={{ left: r.x, top: r.y - 12 }} // anchor bottom
                        animate={{ x: r.dir * 5 }} // small jitter?
                    >
                        🤖
                    </motion.div>
                ))}

                {/* Goal Text Overlay */}
                <div className="absolute bottom-[50px] right-[50px] w-16 h-24 pointer-events-auto"
                    onPointerEnter={(e) => {
                        // Manually add 'safe' order here if not exists
                        if (!orders.find(o => o.type === 'safe')) {
                            setOrders(prev => [...prev, { x: 750 + 32, y: HEIGHT - 50, type: 'safe' }]);
                        }
                    }}
                />

            </div>


            {gameState === 'intro' && (
                <div className="absolute inset-0 z-50 bg-white/90 flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">PROTOCOLE DE SÉCURITÉ</h1>
                    <p className="mb-8 text-center text-gray-600 max-w-md">
                        Les robots NS-5 sont défectueux.<br />
                        Utilisez les balises pour les guider vers la zone de réparation.<br />
                        Ne les laissez pas tomber.
                    </p>
                    <button onClick={() => setGameState('playing')} className="px-8 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700">
                        INITIALISER
                    </button>
                </div>
            )}

            <button onClick={onExit} className="mt-4 text-gray-500 underline">Quitter la simulation</button>
        </div>
    );
}
