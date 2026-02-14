import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityScore } from '../hooks/useActivityScore';
import ActivityShell from '../components/activity/ActivityShell';

// --- CONFIGURATION DES RUNES (VERSION REVUE & CORRIGÉE) ---
const RUNES = [
    {
        id: 'ignis',
        name: 'IGNIS',
        hint: 'Flamme Éternelle',
        color: '#f97316', // Orange vif
        // Lance avec étincelles
        svgPath: "M 50 90 L 50 10 M 50 30 L 80 10 M 50 50 L 80 30 M 20 20 L 50 40",
        segments: [
            [{ x: 50, y: 90 }, { x: 50, y: 10 }], // Axe central
            [{ x: 50, y: 30 }, { x: 80, y: 10 }], // Branche haut droite
            [{ x: 50, y: 50 }, { x: 80, y: 30 }], // Branche milieu droite
            [{ x: 20, y: 20 }, { x: 50, y: 40 }]  // Branche bas gauche (inverse)
        ],
    },
    {
        id: 'aegis',
        name: 'AEGIS',
        hint: 'Bouclier Divin',
        color: '#3b82f6', // Bleu
        // Losange renforcé
        svgPath: "M 50 10 L 90 50 L 50 90 L 10 50 Z M 50 20 L 50 80 M 20 50 L 80 50",
        segments: [
            [{ x: 50, y: 10 }, { x: 90, y: 50 }],
            [{ x: 90, y: 50 }, { x: 50, y: 90 }],
            [{ x: 50, y: 90 }, { x: 10, y: 50 }],
            [{ x: 10, y: 50 }, { x: 50, y: 10 }],
            [{ x: 50, y: 20 }, { x: 50, y: 80 }], // Croix vert.
            [{ x: 20, y: 50 }, { x: 80, y: 50 }]  // Croix horiz.
        ],
    },
    {
        id: 'tempest',
        name: 'TEMPEST',
        hint: 'Foudre Céleste',
        color: '#eab308', // Jaune électrique
        // Zigzag complexe
        svgPath: "M 30 10 L 70 10 L 40 50 L 80 50 L 30 90 L 60 90",
        segments: [
            [{ x: 30, y: 10 }, { x: 70, y: 10 }],
            [{ x: 70, y: 10 }, { x: 40, y: 50 }],
            [{ x: 40, y: 50 }, { x: 80, y: 50 }],
            [{ x: 80, y: 50 }, { x: 30, y: 90 }],
            [{ x: 30, y: 90 }, { x: 60, y: 90 }]
        ],
    },
    {
        id: 'void',
        name: 'VOID',
        hint: 'Néant Infini',
        color: '#a855f7', // Violet
        // Hexagramme unicursal stylisé
        svgPath: "M 50 10 L 20 80 L 80 40 L 20 40 L 80 80 L 50 10",
        segments: [
            [{ x: 50, y: 10 }, { x: 20, y: 80 }],
            [{ x: 20, y: 80 }, { x: 80, y: 40 }],
            [{ x: 80, y: 40 }, { x: 20, y: 40 }],
            [{ x: 20, y: 40 }, { x: 80, y: 80 }],
            [{ x: 80, y: 80 }, { x: 50, y: 10 }]
        ],
    }
];

// --- OPTIONS ---
const CANVAS_SIZE = 320; // Un peu plus grand
const STROKE_WIDTH = 8;
const PRECISION_TOLERANCE = 22; // Distance max acceptée entre un point dessiné et le modèle
const COVERAGE_TOLERANCE = 25; // Rayon pour valider qu'une partie du modèle est "touchée"
const SAMPLING_RATE = 5; // Distance entre les points de contrôle sur le modèle

export default function SceauRunique({ universeId = 'royaumes_legendaires', onComplete, onExit }) {
    // --- STATE ---
    const canvasRef = useRef(null);
    const [currentRuneIndex, setCurrentRuneIndex] = useState(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [message, setMessage] = useState('MÉMORISEZ LE SCEAU');
    const [points, setPoints] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [debugScore, setDebugScore] = useState(null);

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
        maxPoints: 800, // Augmenté car plus dur
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

    // --- UTILS ---
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

    // --- DESSIN ---
    const startDrawing = (e) => {
        if (!isPlaying || isCompleted || showSuccess) return;

        // Empêcher le scroll sur mobile pour une meilleure UX de dessin
        e.preventDefault();

        setIsDrawing(true);
        setPoints([]);
        setDebugScore(null);
        setMessage('TRACEZ DE MÉMOIRE...');

        const coords = getCoords(e);
        setPoints([coords]);

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); // Clear précédent

        // Style "Magique"
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.strokeStyle = currentRune.color;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentRune.color;
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

    const stopDrawing = (e) => {
        if (!isDrawing) return;
        if (e) e.preventDefault();

        setIsDrawing(false);
        validateDrawing();
    };

    // --- VALIDATION ALGORITHM (ROBUSTE) ---
    const validateDrawing = useCallback(() => {
        if (points.length < 20) {
            handleTooShort();
            return;
        }

        const scale = CANVAS_SIZE / 100;

        // 1. GÉNÉRER LES POINTS CIBLES (Le modèle parfait)
        const targetPoints = [];
        currentRune.segments.forEach(seg => {
            const p1 = { x: seg[0].x * scale, y: seg[0].y * scale };
            const p2 = { x: seg[1].x * scale, y: seg[1].y * scale };
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const steps = Math.ceil(dist / SAMPLING_RATE);

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                targetPoints.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
            }
        });

        // 2. CALCULER LA PRÉCISION (Est-ce que je dessine sur les lignes ?)
        let validUserPoints = 0;
        points.forEach(p => {
            // Pour chaque point utilisateur, est-il proche d'au moins un segment ?
            const isClose = currentRune.segments.some(seg => {
                const start = { x: seg[0].x * scale, y: seg[0].y * scale };
                const end = { x: seg[1].x * scale, y: seg[1].y * scale };
                return pointToSegmentDistance(p, start, end) <= PRECISION_TOLERANCE;
            });
            if (isClose) validUserPoints++;
        });
        const precisionScore = (validUserPoints / points.length) * 100;

        // 3. CALCULER LA COUVERTURE (Est-ce que j'ai dessiné tout le symbole ?)
        let coveredTargets = 0;
        targetPoints.forEach(target => {
            // Pour chaque point cible, y a-t-il un point utilisateur proche ?
            const isCovered = points.some(p => {
                const dist = Math.hypot(p.x - target.x, p.y - target.y);
                return dist <= COVERAGE_TOLERANCE;
            });
            if (isCovered) coveredTargets++;
        });
        const coverageScore = (coveredTargets / targetPoints.length) * 100;

        // 4. SCORE FINAL (Pondéré)
        // La couverture est plus importante (70%) que la précision pure (30%)
        // Cela force à tout dessiner, même un peu mal, plutôt que de faire un trait parfait
        const finalScore = (coverageScore * 0.7) + (precisionScore * 0.3);

        setDebugScore({ cov: Math.round(coverageScore), prec: Math.round(precisionScore), final: Math.round(finalScore) });

        // Critères de réussite stricts
        if (finalScore >= 70 && coverageScore >= 80) { // Il faut au moins avoir couvert 80% du modèle
            handleSuccess(finalScore);
        } else {
            handleFail(finalScore, coverageScore);
        }

    }, [points, currentRune]);

    const handleTooShort = () => {
        setMessage('TRACÉ TROP COURT');
        pulseCanvas('red');
        resetCanvas(1500);
    };

    const handleSuccess = (scorePct) => {
        setMessage('INCANTATION REUSSIE !');
        setShowSuccess(true);
        recordAction(false);
        pulseCanvas('#22c55e');

        setTimeout(() => {
            if (currentRuneIndex < RUNES.length - 1) {
                setCurrentRuneIndex(prev => prev + 1);
                setShowSuccess(false);
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
                setPoints([]);
                setMessage('MÉMORISEZ LE SUIVANT...');
            } else {
                finalizeActivity(true, Math.round(score + (scorePct * 2)));
            }
        }, 2000);
    };

    const handleFail = (finalScore, coverage) => {
        let msg = `RATÉ (${Math.round(finalScore)}%)`;
        if (coverage < 50) msg = "INCOMPLET !";
        else if (finalScore < 60) msg = "TRACÉ IMPRÉCIS";

        setMessage(msg);
        recordAction(true);
        pulseCanvas('red');
        resetCanvas(1500);
    };

    const pulseCanvas = (color) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.transition = 'box-shadow 0.3s ease';
            canvas.style.boxShadow = `0 0 40px ${color}`;
            setTimeout(() => {
                canvas.style.boxShadow = 'none';
            }, 500);
        }
    };

    const resetCanvas = (delay) => {
        setTimeout(() => {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            setPoints([]);
            setMessage('RÉESSAYEZ');
        }, delay);
    };

    return (
        <ActivityShell
            title="Sceaux Runiques"
            subtitle={`${currentRune.name} - ${currentRune.hint}`}
            universeColor={currentRune.color}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            onExit={onExit}
            background={
                <div className="absolute inset-0 bg-[#0f0a05]">
                    <div className="absolute inset-0 opacity-30 bg-[url('/textures/parchment.jpg')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center h-full w-full select-none">

                <div className="relative mb-6" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>

                    {/* GUIDE (Modèle) - Disparaît progressivement */}
                    <div
                        className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out flex items-center justify-center
                            ${points.length > 0 ? 'opacity-0 scale-110 blur-sm' : 'opacity-60 scale-100 blur-0'}
                        `}
                    >
                        <svg
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            viewBox="0 0 100 100"
                            style={{ filter: `drop-shadow(0 0 15px ${currentRune.color})` }}
                            className="visible"
                        >
                            <path
                                d={currentRune.svgPath}
                                fill="none"
                                stroke={currentRune.color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="1 0"
                                className="animate-pulse"
                            />
                        </svg>
                    </div>

                    {/* CANVAS DE DESSIN */}
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className="absolute inset-0 rounded-xl touch-none cursor-crosshair z-10"
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                            border: `1px solid ${currentRune.color}33`
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />

                    {/* FX SUCCESS */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
                                exit={{ scale: 2, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                            >
                                <svg width="200" height="200" viewBox="0 0 100 100">
                                    <path
                                        d={currentRune.svgPath}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth="5"
                                        style={{ filter: 'drop-shadow(0 0 20px #fff)' }}
                                    />
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* UI FEEDBACK */}
                <div className="text-center z-10 h-16">
                    <div className={`text-2xl font-bold font-serif tracking-widest mb-1 transition-colors duration-300`} style={{ color: showSuccess ? '#4ade80' : currentRune.color }}>
                        {message}
                    </div>
                    {debugScore && !showSuccess && (points.length === 0) && (
                        <div className="text-xs text-slate-500 font-mono">
                            Dernier score: Couv {debugScore.cov}% | Préc {debugScore.prec}%
                        </div>
                    )}
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-4 flex gap-3">
                    {RUNES.map((r, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500
                                ${i < currentRuneIndex ? 'w-8 bg-green-500' : i === currentRuneIndex ? 'w-12 bg-white shadow-[0_0_10px_white]' : 'w-4 bg-gray-700'}
                            `}
                            style={{ backgroundColor: i === currentRuneIndex ? r.color : undefined }}
                        />
                    ))}
                </div>

            </div>
        </ActivityShell>
    );
}

// --- MATH HELPERS ---
const dist2 = (v, w) => (v.x - w.x) ** 2 + (v.y - w.y) ** 2;

const pointToSegmentDistance = (p, v, w) => {
    const l2 = dist2(v, w);
    if (l2 === 0) return Math.sqrt(dist2(p, v));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
};
