import { useEffect, useRef, useState, useCallback } from 'react';
import { BugHuntEngine } from './engine';
import { useActivityScore } from '../../hooks/useActivityScore';
import ActivityShell from '../../components/activity/ActivityShell';

export default function BugHunt({ universeId = 'odyssee_spatiale', onComplete, onExit }) {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);

    // États React pour l'UI
    const [hudState, setHudState] = useState({ score: 0, lives: 3, ammo: 6 });
    const [gameOver, setGameOver] = useState(false);
    const [bestScore, setBestScore] = useState(0);

    // Activity Hook pour soumission finale
    const {
        isCompleted,
        startActivity,
        finalizeActivity
    } = useActivityScore(universeId, 'bug_hunt', {
        maxPoints: 500,
        activityType: 'shooting',
        onComplete
    });

    // Charger meilleur score
    useEffect(() => {
        const saved = localStorage.getItem('bughunt_best_score');
        if (saved) setBestScore(parseInt(saved, 10));
    }, []);

    // Initialisation du Moteur
    const initEngine = useCallback(() => {
        if (!canvasRef.current || engineRef.current) return; // Eviter double init

        console.log("🎮 BugHunt: Initializing Engine...");

        const engine = new BugHuntEngine(canvasRef.current, {
            onScore: (score, combo) => {
                setHudState(prev => ({ ...prev, score, combo }));
            },
            onLives: (lives) => {
                setHudState(prev => ({ ...prev, lives }));
            },
            onAmmo: (ammo) => {
                setHudState(prev => ({ ...prev, ammo }));
            },
            onGameOver: (finalScore) => {
                console.log("🎮 BugHunt: Game Over", finalScore);
                setGameOver(true);
                const currentBest = parseInt(localStorage.getItem('bughunt_best_score') || '0', 10);
                if (finalScore > currentBest) {
                    localStorage.setItem('bughunt_best_score', finalScore);
                    setBestScore(finalScore);
                }
                finalizeActivity(finalScore);
            }
        });

        engineRef.current = engine;
        engine.start();
        startActivity(); // Notifie le hook que l'activité a commencé

        return () => engine.destroy();
    }, [startActivity, finalizeActivity]);

    // Démarrage initial (SANS dépendre de isPlaying pour éviter le deadlock)
    useEffect(() => {
        if (!isCompleted && !gameOver) {
            initEngine();
        }

        // Cleanup on unmount
        return () => {
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
        };
    }, [isCompleted, gameOver, initEngine]);

    const handleRestart = () => {
        setGameOver(false);
        setHudState({ score: 0, lives: 3, ammo: 6 });
        // Le useEffect relié à !gameOver va re-déclencher initEngine si engineRef est null ?
        // Non, engineRef persiste.
        // Il faut reset l'engine.
        if (engineRef.current) {
            engineRef.current.stop();
            engineRef.current.start();
            startActivity();
        }
    };

    return (
        <ActivityShell
            title="BUG HUNT"
            subtitle={`Meilleur Score: ${bestScore}`}
            universeColor="#dc2626"
            onExit={onExit}
            isCompleted={isCompleted || gameOver}
            hideContentOnComplete={false}
            successContent={
                <div className="flex flex-col items-center gap-4 p-6 bg-black/80 rounded-xl border border-red-500 z-50 relative pointer-events-auto">
                    <h2 className="text-4xl text-red-500 font-bold font-orbitron">
                        {gameOver ? "MISSION ÉCHOUÉE" : "MISSION ACCOMPLIE"}
                    </h2>
                    <div className="text-2xl text-white">Score Final: <span className="text-yellow-400">{hudState.score}</span></div>
                    {hudState.score >= bestScore && hudState.score > 0 && (
                        <div className="text-green-400 font-bold animate-pulse">NOUVEAU RECORD !</div>
                    )}

                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={handleRestart}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold pointer-events-auto cursor-pointer"
                        >
                            REJOUER
                        </button>
                        <button
                            onClick={onExit}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded text-white font-bold pointer-events-auto cursor-pointer"
                        >
                            QUITTER
                        </button>
                    </div>
                </div>
            }
        >
            {/* CANVAS LAYER - DEBUG RED BACKGROUND si canvas fail */}
            <div className="fixed inset-0 bg-transparent touch-none select-none overflow-hidden"
                style={{ zIndex: 1 }}>

                <canvas
                    ref={canvasRef}
                    className="block w-full h-full touch-none"
                    style={{ touchAction: 'none' }}
                />

                {/* HUD OVERLAY */}
                {!gameOver && (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 pt-24 flex justify-between items-start font-mono text-white text-shadow z-50">
                        <div className="flex flex-col gap-1">
                            <div className="text-3xl font-bold text-yellow-400">{hudState.score}</div>
                            <div className="flex gap-1 text-red-500 text-2xl">
                                {'❤️'.repeat(hudState.lives)}
                                <span className="opacity-30">{'❤️'.repeat(3 - hudState.lives)}</span>
                            </div>
                            {/* AJOUT DEBUGER VISUEL */}
                            <div className="text-xs text-white/50">ENGINE V2.2 running</div>
                        </div>

                        <div className="flex gap-1 justify-end">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-8 rounded-sm ${i < hudState.ammo ? 'bg-yellow-400 shadow-[0_0_5px_#fbbf24]' : 'bg-gray-800 border border-gray-600'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {hudState.ammo === 0 && !gameOver && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-2xl animate-pulse pointer-events-none z-50">
                        RECHARGEZ !
                    </div>
                )}
            </div>
        </ActivityShell>
    );
}
