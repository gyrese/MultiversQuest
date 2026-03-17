
import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─── UTILS ────────────────────────────────────────────────────────────────────
const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

// ─── CONFIG LEVELS ────────────────────────────────────────────────────────────
const LEVELS = [
    { freq: 2.5, amp: 40, offset: 0, speed: 0.05, tolerance: 0.15, label: 'LIMA-PROJECT' },
    { freq: 4.8, amp: 60, offset: 20, speed: 0.08, tolerance: 0.10, label: 'MOON-RELAY' },
    { freq: 1.2, amp: 80, offset: 50, speed: 0.12, tolerance: 0.08, label: 'DEEP-SPACE' },
];

export default function CommsTower({ onComplete, onExit }) {
    const canvasRef = useRef(null);
    const [levelIdx, setLevelIdx] = useState(0);
    const [userFreq, setUserFreq] = useState(1.0);  // Controlled by slider
    const [userAmp, setUserAmp] = useState(20);   // Controlled by slider
    const [signalQuality, setSignalQuality] = useState(0);
    const [scanned, setScanned] = useState(0);      // Progress 0-100%
    const [message, setMessage] = useState('RECHERCHE SIGNAL...');
    const [isScanning, setIsScanning] = useState(false);

    // ─── AUDIO ────────────────────────────────────────────────────────────────
    // Simple noise generator later if needed

    // ─── GAME LOOP ────────────────────────────────────────────────────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const t = performance.now() * 0.001;

        const target = LEVELS[levelIdx];

        // Clear
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#003322';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y < h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        const cy = h / 2;

        // Draw Sine Wave
        const drawWave = (freq, amp, speed, color, dash = []) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash(dash);
            for (let x = 0; x < w; x++) {
                // y = sin(x * freq + time * speed) * amp
                // freq scale: small adjusting
                const y = Math.sin((x * 0.02 * freq) + (t * speed * 10)) * amp;
                ctx.lineTo(x, cy + y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        };

        // 1. Target Wave (Ghost)
        drawWave(target.freq, target.amp, target.speed, '#00ffaa44', [5, 5]);

        // 2. User Wave (Active)
        // Add some noise/jitter if signal is bad
        const jitter = (1 - signalQuality) * 5;
        drawWave(userFreq, userAmp, target.speed, '#ff3300', []); // User wave

        // 3. Logic: Calculate Match
        // We compare parameters directly (easier than pixel diff)
        const freqDiff = Math.abs(userFreq - target.freq);
        const ampDiff = Math.abs(userAmp - target.amp);

        // Normalize differences to 0-1 score
        const fScore = Math.max(0, 1 - freqDiff / 2);
        const aScore = Math.max(0, 1 - ampDiff / 50);

        const quality = fScore * aScore; // Both need to be good
        setSignalQuality(prev => lerp(prev, quality, 0.1)); // Smooth

    }, [userFreq, userAmp, levelIdx]);

    useEffect(() => {
        let raf;
        const loop = () => {
            render();
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(raf);
    }, [render]);

    // ─── PROGRESS MECHANIC ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isScanning) {
            // Signal matches? Start scanning
            if (signalQuality > 0.95) {
                setIsScanning(true);
                setMessage('VERROUILLAGE SIGNAL...');
            } else {
                setMessage(signalQuality > 0.7 ? 'SIGNAL PROCHE...' : 'RECHERCHE...');
            }
        } else {
            // Scanning in progress
            if (signalQuality < 0.90) {
                setIsScanning(false); // Lost signal
                setScanned(0);
                setMessage('SIGNAL PERDU');
            } else {
                const timer = setInterval(() => {
                    setScanned(prev => {
                        if (prev >= 100) {
                            clearInterval(timer);
                            handleLevelComplete();
                            return 100;
                        }
                        return prev + 1; // Speed of scan
                    });
                }, 50);
                return () => clearInterval(timer);
            }
        }
    }, [signalQuality, isScanning]);

    const handleLevelComplete = useCallback(() => {
        if (levelIdx < LEVELS.length - 1) {
            setLevelIdx(l => l + 1);
            setScanned(0);
            setIsScanning(false);
            setMessage('SIGNAL ÉTABLI. NOUVELLE CIBLE...');
            // Reset sliders slightly to force adjustment
            setUserFreq(1.0);
            setUserAmp(30);
        } else {
            onComplete(1000);
        }
    }, [levelIdx, onComplete]);

    // ─── RESIZE CANVAS ────────────────────────────────────────────────────────
    useEffect(() => {
        const c = canvasRef.current;
        c.width = window.innerWidth;
        c.height = window.innerHeight;
    }, []);

    return (
        <div className="fixed inset-0 bg-black font-mono text-xs select-none overflow-hidden touch-none">
            {/* CANVAS BG */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* OVERLAY UI */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 pointer-events-none">

                {/* Header */}
                <div className="flex justify-between items-start text-cyan-500">
                    <div>
                        <h1 className="text-xl font-bold tracking-[0.2em]">COMM_UPLINK</h1>
                        <p className="opacity-70">TARGET: {LEVELS[levelIdx].label}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${isScanning ? 'text-green-400 animate-pulse' : 'text-red-500'}`}>
                            {Math.round(signalQuality * 100)}%
                        </div>
                        <div>STRENGTH</div>
                    </div>
                </div>

                {/* Center Message */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    {isScanning && (
                        <div className="w-64 h-2 bg-gray-800 rounded mb-2 overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${scanned}%` }} />
                        </div>
                    )}
                    <span className="bg-black/50 px-2 py-1 border border-cyan-900 text-cyan-400 tracking-widest">
                        {message}
                    </span>
                </div>

                {/* Controls (Pointer events auto-enabled for buttons) */}
                <div className="pointer-events-auto bg-black/80 border-t border-cyan-900 p-4 backdrop-blur-md">

                    <div className="mb-6">
                        <div className="flex justify-between text-cyan-400 mb-1">
                            <span>FRÉQUENCE (Hz)</span>
                            <span>{userFreq.toFixed(2)}</span>
                        </div>
                        <input
                            type="range" min="0.5" max="6.0" step="0.05"
                            value={userFreq}
                            onChange={e => setUserFreq(parseFloat(e.target.value))}
                            className="w-full h-8 bg-gray-900 appearance-none rounded border border-gray-700 slider-thumb-cyan"
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-cyan-400 mb-1">
                            <span>AMPLITUDE (dB)</span>
                            <span>{userAmp.toFixed(0)}</span>
                        </div>
                        <input
                            type="range" min="10" max="150" step="1"
                            value={userAmp}
                            onChange={e => setUserAmp(parseFloat(e.target.value))}
                            className="w-full h-8 bg-gray-900 appearance-none rounded border border-gray-700 slider-thumb-orange"
                        />
                    </div>
                </div>

                {/* Exit */}
                <button onClick={onExit} className="absolute top-4 right-4 mt-12 pointer-events-auto text-red-700 bg-black/50 px-2 py-1 border border-red-900 hover:bg-red-900/20">
                    ABORT
                </button>
            </div>

            {/* CSS for custom range sliders */}
            <style jsx>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 24px; width: 24px;
                    border-radius: 50%;
                    background: #00ffcc;
                    border: 2px solid white;
                    cursor: pointer;
                    margin-top: -8px;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%; height: 6px;
                    background: #004433;
                    border-radius: 3px;
                }
                .slider-thumb-orange::-webkit-slider-thumb {
                    background: #ff4400 !important;
                }
            `}</style>
        </div>
    );
}
