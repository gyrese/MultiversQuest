import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ActivityShell from '../components/activity/ActivityShell';
import { useActivityScore } from '../hooks/useActivityScore';

// Simple prototype for La Route de Kessel
export default function KesselRun({ universeId = 'star_wars', onComplete, onExit }) {
    const SEGMENTS = 6; // number of segments in the run

    const {
        isPlaying,
        isCompleted,
        score,
        bonus,
        startActivity,
        recordAction,
        finalizeActivity
    } = useActivityScore(universeId, 'kessel_run', {
        maxPoints: 600,
        activityType: 'navigation',
        onComplete
    });

    const [started, setStarted] = useState(false);
    const [segment, setSegment] = useState(0);
    const [fuel, setFuel] = useState(100); // percent
    const [timeLeft, setTimeLeft] = useState(120); // seconds
    const [chosenPath, setChosenPath] = useState({}); // per-segment choice
    const [inRepair, setInRepair] = useState(false);
    const [repairProgress, setRepairProgress] = useState(0);
    const timerRef = useRef(null);

    // Start run
    const handleStart = () => {
        startActivity();
        setStarted(true);
        setSegment(1);
        setChosenPath({});
        setFuel(100);
        setTimeLeft(120);
        recordAction(false);
    };

    // Main loop: time countdown and automatic progression if not repairing
    useEffect(() => {
        if (!started || isCompleted) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(t => t - 1);
            // passive fuel drain
            setFuel(f => Math.max(0, f - 0.2));
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [started, isCompleted]);

    // End conditions: fail on no fuel or time, success on finish segments
    useEffect(() => {
        if (!started) return;
        if (fuel <= 0 || timeLeft <= 0) {
            clearInterval(timerRef.current);
            setStarted(false);
            finalizeActivity(false, 0);
        }
    }, [fuel, timeLeft]);

    // Called when player selects a path for current segment
    const choosePath = (choice) => {
        if (!started || inRepair) return;
        recordAction(false);

        // Choices: 'safe' (low fuel cost, long time), 'balanced', 'risky' (short time, high fuel, may trigger repair)
        const costs = {
            safe: { fuel: -5, time: -12, risk: 0 },
            balanced: { fuel: -10, time: -9, risk: 0.2 },
            risky: { fuel: -18, time: -5, risk: 0.45 }
        };

        const c = costs[choice] || costs.balanced;
        setFuel(f => Math.max(0, f + c.fuel));
        setTimeLeft(t => Math.max(0, t + c.time));

        setChosenPath(prev => ({ ...prev, [segment]: choice }));

        // Random chance to trigger a repair mini-game on risky routes
        if (Math.random() < c.risk) {
            setInRepair(true);
            setRepairProgress(0);
        } else {
            // progress to next segment after short delay
            setTimeout(() => setSegment(s => s + 1), 800);
        }
    };

    // Simple repair mini-game: hold a button to charge repairProgress to 100
    useEffect(() => {
        if (!inRepair) return;
        const id = setInterval(() => {
            setRepairProgress(p => Math.min(100, p + 8));
        }, 300);
        return () => clearInterval(id);
    }, [inRepair]);

    const completeRepair = () => {
        // small fuel/time penalty but continue
        setFuel(f => Math.max(0, f - 8));
        setTimeLeft(t => Math.max(0, t - 6));
        setInRepair(false);
        setRepairProgress(0);
        setTimeout(() => setSegment(s => s + 1), 400);
    };

    // If we passed last segment -> success
    useEffect(() => {
        if (!started) return;
        if (segment > SEGMENTS) {
            clearInterval(timerRef.current);
            setStarted(false);
            const finalScore = Math.round(100 + fuel * 3 + Math.max(0, timeLeft));
            finalizeActivity(true, finalScore);
        }
    }, [segment]);

    // Quick HUD helpers
    const fuelColor = fuel > 50 ? '#10b981' : (fuel > 20 ? '#f59e0b' : '#ef4444');

    return (
        <ActivityShell
            title="La Route de Kessel"
            subtitle="Trajet dangereux à travers champs d'astéroïdes"
            universeColor="#f59e0b"
            onExit={onExit}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            background={
                <div className="absolute inset-0 bg-black">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0b1221_0%,_black_70%)] opacity-40" />
                </div>
            }
        >
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <div className="text-sm text-gray-300">Segment</div>
                        <div className="text-2xl font-bold">{segment}/{SEGMENTS}</div>
                    </div>

                    <div className="flex gap-6">
                        <div className="text-center">
                            <div className="text-sm text-gray-300">Carburant</div>
                            <div className="w-48 bg-gray-800 h-4 rounded overflow-hidden">
                                <div style={{ width: `${fuel}%`, background: fuelColor, height: '100%' }} />
                            </div>
                            <div className="text-xs text-gray-400">{Math.round(fuel)}%</div>
                        </div>

                        <div className="text-center">
                            <div className="text-sm text-gray-300">Temps restant</div>
                            <div className="text-2xl font-mono">{Math.max(0, timeLeft)}s</div>
                        </div>
                    </div>
                </div>

                {/* Mini-map / segment choices */}
                <div className="bg-gray-900/60 p-4 rounded mb-6">
                    <div className="text-sm text-gray-300 mb-2">Carte de la Route</div>
                    <div className="flex gap-2 items-center">
                        {[...Array(SEGMENTS)].map((_, i) => {
                            const idx = i + 1;
                            const chosen = chosenPath[idx];
                            return (
                                <div key={idx} className={`w-full p-2 rounded text-center ${idx === segment ? 'ring-2 ring-yellow-400' : 'bg-gray-800/40'}`}>
                                    <div className="text-xs text-gray-400">#{idx}</div>
                                    <div className="font-bold">{chosen || (idx < segment ? 'OK' : (idx === segment ? 'EN COURS' : '—'))}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Controls / gameplay area */}
                <div className="bg-black/60 p-6 rounded">
                    {!started && !isCompleted ? (
                        <motion.button whileTap={{ scale: 0.98 }} onClick={handleStart} className="px-6 py-3 bg-yellow-500 text-black font-bold rounded">Lancer la Route</motion.button>
                    ) : inRepair ? (
                        <div className="text-center">
                            <div className="text-lg font-bold mb-2">Réparation en cours</div>
                            <div className="w-3/4 mx-auto bg-gray-800 h-6 rounded overflow-hidden mb-3">
                                <div style={{ width: `${repairProgress}%`, background: '#3b82f6', height: '100%' }} />
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={completeRepair} className="px-4 py-2 bg-blue-600 rounded text-white" disabled={repairProgress < 80}>Terminer réparation</button>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">Maintenez la pression pour accélérer la réparation (prototype auto-charge)</div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-3 text-gray-300">Choisissez la trajectoire pour ce segment :</div>
                            <div className="flex gap-3">
                                <button onClick={() => choosePath('safe')} className="flex-1 px-4 py-3 bg-gray-800 rounded border border-gray-700">Itinéraire Sûr<br/><span className="text-xs text-gray-400">+faible conso, +long</span></button>
                                <button onClick={() => choosePath('balanced')} className="flex-1 px-4 py-3 bg-gray-800 rounded border border-gray-700">Itinéraire Équilibré<br/><span className="text-xs text-gray-400">équilibre temps/conso</span></button>
                                <button onClick={() => choosePath('risky')} className="flex-1 px-4 py-3 bg-gray-800 rounded border border-gray-700">Itinéraire Risqué<br/><span className="text-xs text-gray-400">court mais dangereux</span></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick instructions */}
                <div className="text-xs text-gray-500 mt-3">Rôles : pilote (choisit trajectoire) & ingénieur (gère réparations). Prototype simplifié pour intégration.</div>
            </div>
        </ActivityShell>
    );
}
