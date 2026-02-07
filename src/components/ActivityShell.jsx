
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ActivityShell - Composant conteneur standard pour tous les mini-jeux
 * Gère le layout, les animations, les phases de jeu et le HUD.
 */
export default function ActivityShell({
    // Méta-données
    title = "Activité Inconnue",
    universeName = "Multivers",
    color = "cyan", // cyan, gold, green, red
    maxPoints = 1000,
    instructions = "Complétez l'objectif pour gagner des points.",

    // État du jeu (provenant de useActivityScore)
    isPlaying = false,
    isCompleted = false,
    score = 0,
    stats = {},

    // Actions
    onStart = () => { },
    onExit = () => { }, // Retour au hub
    onNext = () => { }, // Continuer vers la suite (sauvegarde + nav)
    onRetry = () => { }, // Relancer l'activité

    // Contenu du jeu
    children
}) {
    // Phase locale : 'intro' | 'play' | 'success' | 'fail'
    const [phase, setPhase] = useState('intro');
    const [showHelp, setShowHelp] = useState(false);

    // Synchronisation de la phase avec les props externes
    useEffect(() => {
        if (isPlaying) {
            setPhase('play');
        } else if (isCompleted) {
            setPhase(score > 0 ? 'success' : 'fail');
        } else {
            // Si on n'est ni en jeu ni complété, on est en intro (ou reset)
            setPhase('intro');
        }
    }, [isPlaying, isCompleted, score]);

    // Couleurs dynamiques selon l'univers/thème

    const themeColors = {
        cyan: {
            text: 'text-cyan-400',
            border: 'border-cyan-500',
            bg: 'bg-cyan-900/20',
            glow: 'text-glow-cyan',
            btnBg: 'bg-cyan-500/20',
            btnHover: 'hover:bg-cyan-500/40',
            btnBorder: 'border-cyan-500'
        },
        gold: {
            text: 'text-yellow-400',
            border: 'border-yellow-500',
            bg: 'bg-yellow-900/20',
            glow: 'text-glow-gold',
            btnBg: 'bg-yellow-500/20',
            btnHover: 'hover:bg-yellow-500/40',
            btnBorder: 'border-yellow-500'
        },
        green: {
            text: 'text-green-400',
            border: 'border-green-500',
            bg: 'bg-green-900/20',
            glow: 'text-glow-green',
            btnBg: 'bg-green-500/20',
            btnHover: 'hover:bg-green-500/40',
            btnBorder: 'border-green-500'
        },
        red: {
            text: 'text-red-500',
            border: 'border-red-600',
            bg: 'bg-red-900/20',
            glow: 'shadow-red-500',
            btnBg: 'bg-red-500/20',
            btnHover: 'hover:bg-red-500/40',
            btnBorder: 'border-red-600'
        },
    };
    const theme = themeColors[color] || themeColors.cyan;

    // --- VUES SECONDAIRES ---

    const IntroView = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-6 pt-12"
        >
            <div className={`text-4xl font-bold font-orbitron ${theme.text} ${theme.glow} tracking-widest uppercase`}>
                {universeName}
            </div>
            <div className="w-24 h-1 bg-current opacity-50 rounded-full" />
            <h1 className="text-2xl font-mono font-bold text-white glitch-text">
                {title}
            </h1>

            <div className="bg-black/40 border border-white/10 p-6 rounded-lg backdrop-blur-sm max-w-sm mx-auto">
                <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-line">
                    {instructions}
                </p>
            </div>

            <div className="pt-8">
                <button
                    onClick={onStart}
                    className={`px-8 py-4 ${theme.btnBorder || theme.border} border-2 bg-black/60 text-white font-bold font-orbitron uppercase tracking-widest ${theme.btnHover || ''} transition-all transform hover:scale-105 active:scale-95 btn-glitch`}
                >
                    Initialiser_Sequence
                </button>
            </div>
        </motion.div>
    );

    const ResultView = ({ isSuccess }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-12"
        >
            <div className={`text-6xl font-black font-orbitron ${isSuccess ? theme.text : 'text-red-500'} ${theme.glow}`}>
                {isSuccess ? 'SUCCÈS' : 'ÉCHEC'}
            </div>

            <div className="flex flex-col items-center space-y-2">
                <span className="text-gray-400 font-mono text-sm uppercase tracking-widest">Score Final</span>
                <span className={`text-5xl font-mono font-bold ${theme.text}`}>
                    {score} <span className="text-xl text-gray-500">/ {maxPoints}</span>
                </span>
            </div>

            {stats && (
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs text-sm font-mono text-gray-400">
                    {stats.attempts !== undefined && (
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                            Err: <span className="text-white">{stats.attempts}</span>
                        </div>
                    )}
                    {stats.duration !== undefined && (
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                            Tps: <span className="text-white">{(stats.duration / 1000).toFixed(1)}s</span>
                        </div>
                    )}
                </div>
            )}

            <div className="pt-8 flex flex-col space-y-4 w-full max-w-xs px-4">
                {isSuccess ? (
                    <button
                        onClick={onNext}
                        className={`w-full py-4 ${theme.btnBorder || theme.border} border-2 ${theme.btnBg || ''} text-white font-bold font-orbitron uppercase tracking-widest ${theme.btnHover || ''} transition-all`}
                    >
                        Continuer_{'>>'}
                    </button>
                ) : (
                    <button
                        onClick={onRetry}
                        className="w-full py-4 border-2 border-white/20 bg-white/5 text-white font-bold font-orbitron uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        Réessayer_
                    </button>
                )}

                <button
                    onClick={onExit}
                    className="text-xs text-gray-500 hover:text-white underline underline-offset-4 font-mono uppercase"
                >
                    Abandonner / Quitter
                </button>
            </div>
        </motion.div>
    );

    // --- RENDER ---

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col font-mono selection:bg-white/20">

            {/* Background FX */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="scanlines absolute inset-0 opacity-30"></div>
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent opacity-80"></div>
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent opacity-80"></div>
            </div>

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-4 py-4 w-full max-w-lg mx-auto border-b border-white/5">
                <button
                    onClick={onExit}
                    className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Retour"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex flex-col items-center">
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.text} font-orbitron`}>{universeName}</span>
                    <span className="text-sm font-bold tracking-wide">{title}</span>
                </div>

                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={`p-2 -mr-2 ${showHelp ? theme.text : 'text-gray-400'} hover:text-white transition-colors`}
                    aria-label="Aide"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </header>

            {/* Max Points Display (Top Right Absolute or integrated) */}
            <div className="absolute top-16 right-4 z-10 opacity-30 pointer-events-none hidden sm:block">
                <div className="text-[10px] uppercase text-right">Max Pts</div>
                <div className="font-orbitron text-xl">{maxPoints}</div>
            </div>

            {/* Main Container */}
            <main className="relative z-10 flex-1 flex flex-col w-full max-w-lg mx-auto p-4 overflow-hidden">
                <AnimatePresence mode="wait">

                    {phase === 'intro' && (
                        <motion.div key="intro" className="flex-1 h-full" exit={{ opacity: 0 }}>
                            <IntroView />
                        </motion.div>
                    )}

                    {phase === 'play' && (
                        <motion.div
                            key="play"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full relative"
                        >
                            {/* Overlay Aide en jeu */}
                            <AnimatePresence>
                                {showHelp && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="absolute inset-x-0 top-0 z-30 bg-black/90 border-b border-white/20 p-4 text-sm text-gray-300 backdrop-blur-md"
                                    >
                                        <p>{instructions}</p>
                                        <button onClick={() => setShowHelp(false)} className="mt-2 text-xs uppercase text-white/50 hover:text-white">Fermer</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {children}
                        </motion.div>
                    )}

                    {(phase === 'success' || phase === 'fail') && (
                        <motion.div key="result" className="flex-1 h-full">
                            <ResultView isSuccess={phase === 'success'} />
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* Footer / Status Bar (Optional) */}
            {phase === 'play' && (
                <div className="relative z-20 py-2 border-t border-white/5 bg-black/40 backdrop-blur text-xs font-mono text-center text-gray-500 uppercase tracking-widest">
                    Module Actif - Enregistrement...
                </div>
            )}

        </div>
    );
}
