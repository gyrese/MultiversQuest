import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityScore } from '../hooks/useActivityScore';
import ActivityShell from '../components/activity/ActivityShell';

// --- CONFIGURATION DES RUNES (MODE HARDCORE) ---
const RUNES = [
    {
        id: 'fehu',
        name: 'FEHU',
        hint: 'Prospérité',
        color: '#fbbf24', // Or
        // Rune "F" (Fehu)
        svgPath: "M 35 90 L 35 10 M 35 30 L 75 10 M 35 55 L 75 35",
        segments: [
            [{ x: 35, y: 90 }, { x: 35, y: 10 }], // Vertical
            [{ x: 35, y: 30 }, { x: 75, y: 10 }], // Haut
            [{ x: 35, y: 55 }, { x: 75, y: 35 }]  // Bas
        ],
        difficulty: 1
    },
    {
        id: 'pentagram',
        name: 'PENTACLE',
        hint: 'Protection Ancienne',
        color: '#ef4444', // Rouge
        // Etoile à 5 branches
        svgPath: "M 50 10 L 80 90 L 10 35 L 90 35 L 20 90 Z",
        segments: [
            [{ x: 50, y: 10 }, { x: 80, y: 90 }],
            [{ x: 80, y: 90 }, { x: 10, y: 35 }],
            [{ x: 10, y: 35 }, { x: 90, y: 35 }],
            [{ x: 90, y: 35 }, { x: 20, y: 90 }],
            [{ x: 20, y: 90 }, { x: 50, y: 10 }]
        ],
        difficulty: 2
    },
    {
        id: 'othala',
        name: 'OTHALA',
        hint: 'Héritage',
        color: '#8b5cf6', // Violet
        // Forme de losange avec "pieds"
        svgPath: "M 30 90 L 50 10 L 70 90 M 30 90 L 50 50 L 70 90", // Simplifié en croix de losange
        // Version classique Othala : Boucle en bas
        svgPath: "M 30 90 L 50 50 L 70 90 M 50 50 L 50 10 M 50 10 L 30 30 M 50 10 L 70 30", // Trop complexe
        // Othala standard : Losange qui se croise en bas
        svgPath: "M 35 85 L 35 30 L 65 30 L 65 85 L 35 50 L 65 50", // Bof
        // Allons sur le Sceau de Salomon (2 triangles inversés) ou Triskel
        // Valknut (3 triangles) - Trop dur
        // Eclair Harry Potter (Sowilo)
        id: 'sowilo',
        name: 'SOWILO',
        hint: 'Soleil et Victoire',
        color: '#eab308',
        svgPath: "M 70 10 L 30 40 L 70 60 L 30 90",
        segments: [
            [{ x: 70, y: 10 }, { x: 30, y: 40 }],
            [{ x: 30, y: 40 }, { x: 70, y: 60 }],
            [{ x: 70, y: 60 }, { x: 30, y: 90 }]
        ],
        difficulty: 2
    },
    {
        id: 'gate',
        name: 'EREBOR',
        hint: 'Porte des Nains',
        color: '#10b981', // Emeraude
        // Losange avec un trait vertical et horizontal (cible)
        svgPath: "M 50 10 L 90 50 L 50 90 L 10 50 Z M 50 10 L 50 90 M 10 50 L 90 50",
        segments: [
            [{ x: 50, y: 10 }, { x: 90, y: 50 }], [{ x: 90, y: 50 }, { x: 50, y: 90 }],
            [{ x: 50, y: 90 }, { x: 10, y: 50 }], [{ x: 10, y: 50 }, { x: 50, y: 10 }],
            [{ x: 50, y: 10 }, { x: 50, y: 90 }], [{ x: 10, y: 50 }, { x: 90, y: 50 }]
        ],
        difficulty: 3
    }
];

// --- OPTIONS ---
const CANVAS_SIZE = 300;
const STROKE_WIDTH = 6;
const TOLERANCE = 35; // Plus tolérant car de mémoire

export default function SceauRunique({ universeId = 'royaumes_legendaires', onComplete, onExit }) {
    // --- STATE ---
    const canvasRef = useRef(null);
    const [currentRuneIndex, setCurrentRuneIndex] = useState(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [message, setMessage] = useState('MÉMORISEZ LE SCEAU');
    const [points, setPoints] = useState([]);
    const [validationScore, setValidationScore] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // --- HOOK ACTIVITY ---
    const {
        isPlaying,
        isCompleted,
        score,
        bonus,
        startActivity,
        recordAction,
        finalizeActivity
    } = useActivityScore(universeId, 'sceau_runique', {
        maxPoints: 500,
        activityType: 'standard',
        onComplete
    });

    const currentRune = RUNES[currentRuneIndex];

    // --- INITIALISATION ---
    useEffect(() => {
        if (!isPlaying && !isCompleted) {
            startActivity();
            setMessage(`SCEAU ${currentRuneIndex + 1}/${RUNES.length}`);
        }
    }, [isPlaying, isCompleted, startActivity, currentRuneIndex]);

    // --- DESSIN (Canvas Logic) ---
    const getCoords = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        if (!isPlaying || isCompleted || showSuccess) return;
        e.preventDefault();
        setIsDrawing(true);
        setPoints([]);
        setMessage('TRACEZ DE MÉMOIRE...');

        const coords = getCoords(e);
        setPoints([coords]);

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.strokeStyle = currentRune.color;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();

        const coords = getCoords(e);
        setPoints(prev => [...prev, coords]);

        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        validateDrawing();
    };

    // --- VALIDATION ALGORITHM ---
    const validateDrawing = useCallback(() => {
        if (points.length < 10) {
            setMessage('TRACÉ TROP COURT !');
            setTimeout(() => {
                clearCanvas();
                setPoints([]); // Reset pour réafficher le modèle
                setMessage('MÉMORISEZ LE SCEAU');
            }, 1000);
            return;
        }

        let validPoints = 0;
        const totalPoints = points.length;

        points.forEach(p => {
            let isClose = false;
            const scaleX = CANVAS_SIZE / 100;
            const scaleY = CANVAS_SIZE / 100;

            for (let segment of currentRune.segments) {
                const start = { x: segment[0].x * scaleX, y: segment[0].y * scaleY };
                const end = { x: segment[1].x * scaleX, y: segment[1].y * scaleY };

                const dist = pointToSegmentDistance(p, start, end);
                if (dist <= TOLERANCE) {
                    isClose = true;
                    break;
                }
            }
            if (isClose) validPoints++;
        });

        // Calcul précision
        const accuracy = (validPoints / totalPoints) * 100;

        // Nexus Hardcore Mode : Tolérance 65% acceptée car dessin aveugle
        if (accuracy > 65 && totalPoints > 20) {
            handleSuccess(accuracy);
        } else {
            handleFail(accuracy);
        }
    }, [points, currentRune]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        // Ne pas reset points ici sinon le modèle réapparaît avant le feedback
    };

    const handleSuccess = (accuracy) => {
        const speedBonus = Math.max(0, 100 - (points.length / 5));
        const accuracyBonus = Math.floor(accuracy);
        const roundScore = 150 + accuracyBonus + speedBonus; // Plus de points

        setValidationScore(Math.round(accuracy));
        setShowSuccess(true);
        setMessage('INCANTATION VALIDÉE !');
        recordAction(false);

        setTimeout(() => {
            if (currentRuneIndex < RUNES.length - 1) {
                setCurrentRuneIndex(prev => prev + 1);
                setShowSuccess(false);
                clearCanvas();
                setPoints([]); // Reset et affiche nouvelle rune
                setMessage('MÉMORISEZ LE SUIVANT...');
            } else {
                finalizeActivity(true, Math.round(score + roundScore));
            }
        }, 1500);
    };

    const handleFail = (accuracy) => {
        setMessage(`ÉCHEC (${Math.round(accuracy)}%)`);
        recordAction(true);

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.boxShadow = "0 0 30px red";
            setTimeout(() => {
                canvas.style.boxShadow = "none";
                clearCanvas();
                setPoints([]); // Réaffiche le modèle pour réessayer
                setMessage('RÉESSAYEZ');
            }, 1000);
        }
    };

    return (
        <ActivityShell
            title="Sceau Runique"
            subtitle={`${currentRune.name} - ${currentRune.hint}`}
            universeColor={currentRune.color}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            onExit={onExit}
            background={
                <div className="absolute inset-0 bg-[#1a0f00]">
                    <div className="absolute inset-0 opacity-20 bg-[url('/textures/parchment.jpg')]" />
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center h-full w-full">

                <div className="relative mb-8 select-none" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>

                    {/* GUIDE - Disparaît dès qu'on dessine */}
                    <div className={`transition-opacity duration-300 ${points.length > 0 ? 'opacity-0' : 'opacity-40'}`}>
                        <svg
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            viewBox="0 0 100 100"
                            className="absolute inset-0 pointer-events-none"
                            style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
                        >
                            <path
                                d={currentRune.svgPath}
                                fill="none"
                                stroke={currentRune.color}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="5 5"
                            />
                        </svg>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className={`
                            absolute inset-0 rounded-lg border-2 border-white/20 touch-none cursor-crosshair
                            ${showSuccess ? 'border-green-500 shadow-[0_0_50px_#22c55e]' : ''}
                        `}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(5px)'
                        }}
                    />

                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 2, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div className="text-6xl">✨</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="text-center">
                    <div className={`text-xl font-bold font-serif tracking-widest mb-2 ${showSuccess ? 'text-green-400' : 'text-amber-100'}`}>
                        {message}
                    </div>
                    {!isCompleted && points.length === 0 && (
                        <div className="text-xs text-amber-500/60 uppercase tracking-[0.2em] animate-pulse">
                            Mémorisez la forme...
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-2">
                    {RUNES.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 w-12 rounded-full transition-colors ${i < currentRuneIndex ? 'bg-amber-500' : i === currentRuneIndex ? 'bg-amber-200' : 'bg-gray-800'}`}
                        />
                    ))}
                </div>

            </div>
        </ActivityShell>
    );
}

// --- HELPERS (Définis hors du composant pour éviter les pbs de scope) ---

const dist2 = (v, w) => (v.x - w.x) ** 2 + (v.y - w.y) ** 2;

const pointToSegmentDistance = (p, v, w) => {
    const l2 = dist2(v, w);
    if (l2 === 0) return Math.sqrt(dist2(p, v)); // v == w case
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
};
