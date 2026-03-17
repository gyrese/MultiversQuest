
import React, { useRef, useEffect, useState } from 'react';
import { PixiEngine } from './PixiEngine';
// import { useActivityScore } from '../../hooks/useActivityScore'; // TBD

export default function BugHunt({ onExit }) {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);

    // Game HUD State
    const [score, setScore] = useState(0);
    const [ammo, setAmmo] = useState(10);
    const [lives, setLives] = useState(5);
    const [wave, setWave] = useState(1);
    const [isGameOver, setIsGameOver] = useState(false);

    // ─── ENGINE BRIDGE ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!canvasRef.current) return;

        const callbacks = {
            onScore: (s) => setScore(s),
            onAmmo: (a) => setAmmo(a),
            onWave: (w) => setWave(w),
        };

        const engine = new PixiEngine(canvasRef.current, callbacks);
        engineRef.current = engine;

        // v8 Async Init
        engine.init().then(() => {
            console.log("👾 PixiRetro Engine Started");
            engine.start();
        }).catch(e => console.error("🔥 Engine Init Failed", e));

        return () => {
            console.log("🛑 PixiRetro Engine Destroyed");
            engine.destroy(); // Assumes destroy is robust
            engineRef.current = null;
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none font-mono">
            {/* Canvas 2D (Background) */}
            <canvas ref={canvasRef} className="absolute inset-0 block" style={{ width: '100%', height: '100%' }} />

            {/* CRT SCANLINES FX (CSS Overlay) */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 2px 100%'
                }}>
            </div>

            {/* HUD (Top Left) */}
            <div className="absolute top-4 left-4 text-green-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(0,255,0,0.8)] pointer-events-none">
                <div>SCORE: {score.toLocaleString()}</div>
                <div className="text-yellow-400 text-sm mt-1">WAVE {wave}</div>
            </div>

            {/* HUD (Top Right) */}
            <div className="absolute top-4 right-4 text-right pointer-events-none">
                <div className="text-red-500 font-bold text-2xl drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">
                    {'♥'.repeat(lives)}
                </div>
                <div className="text-cyan-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] mt-1">
                    {'▮'.repeat(ammo)}
                </div>
            </div>

            {/* HINT */}
            <div className="absolute bottom-8 w-full text-center text-white/30 text-xs pointer-events-none">
                [ DRAG TO AIM — TAP TO SHOOT ]
            </div>

            {/* GAME OVER */}
            {isGameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
                    <h1 className="text-6xl text-red-600 font-black tracking-widest mb-4 drop-shadow-[0_0_20px_red]">MORT</h1>
                    <p className="text-white text-2xl mb-8">SCORE: {score}</p>
                    <div className="flex gap-4">
                        <button onClick={onExit} className="px-8 py-3 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white uppercase font-bold transition-all">
                            Quitter
                        </button>
                        <button onClick={handleRetry} className="px-8 py-3 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white uppercase font-bold transition-all">
                            Rejouer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
