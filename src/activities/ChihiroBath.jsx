import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ChihiroBath({ onComplete, onExit }) {
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Setup scaling
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Draw "Mud"
        ctx.fillStyle = '#5D4037'; // Dark Brown Mud
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some texture
        for (let i = 0; i < 500; i++) {
            ctx.fillStyle = '#4E342E';
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 50 + 20,
                0, Math.PI * 2
            );
            ctx.fill();
        }

    }, []);

    const handleScratch = (e) => {
        if (isComplete) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Handle both mouse and touch
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();

        // Check progress every 20 events or so (throttle)
        if (Math.random() > 0.9) {
            checkProgress();
        }
    };

    const checkProgress = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // Sample center area (too expensive to check full canvas)
        const w = canvas.width;
        const h = canvas.height;
        // Check 100 random points
        let cleared = 0;
        const total = 50;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Optimization: check alpha of every 100th pixel
        let alphaSum = 0;
        let count = 0;
        for (let i = 3; i < data.length; i += 400) { // Step 100 pixels * 4
            alphaSum += data[i];
            count++;
        }

        // Lower average alpha means more cleared
        const avgAlpha = alphaSum / count;
        const percentCleared = 100 - (avgAlpha / 255 * 100);

        setProgress(percentCleared);

        if (percentCleared > 75) {
            setIsComplete(true);
            setTimeout(() => onComplete(400), 1000);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden touch-none select-none bg-[#E0F7FA]">
            {/* Clean Background (The Result) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <div className="text-9xl animate-bounce">🛁</div>
                    <h1 className="text-4xl font-bold text-cyan-600 mt-8 drop-shadow-lg">PROPRE !</h1>
                </div>
            </div>

            {/* Dirty Canvas Overlay */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 touch-none transition-opacity duration-1000 ${isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                onTouchMove={handleScratch}
            />

            {/* UI */}
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-50">
                <div className="bg-white/80 px-4 py-2 rounded-full font-bold text-cyan-800 border-2 border-cyan-500 shadow-lg">
                    NETTOYAGE: {Math.round(progress)}%
                </div>
                <button onClick={onExit} className="pointer-events-auto bg-white/80 text-cyan-800 px-4 py-2 rounded-full font-bold border-2 border-cyan-500 shadow-lg hover:bg-white">
                    QUITTER
                </button>
            </div>

            {/* Hint */}
            {!isComplete && progress < 10 && (
                <div className="absolute bottom-10 left-0 right-0 text-center text-white font-bold text-2xl animate-pulse pointer-events-none drop-shadow-md">
                    FROTTEZ L'ÉCRAN !
                </div>
            )}
        </div>
    );
}
