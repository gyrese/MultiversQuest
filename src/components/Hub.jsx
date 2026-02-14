import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/PlayerContext';
import { UNIVERSES, UNIVERSE_ORDER } from '../data/universes';
import UniverseCard from './UniverseCard';
import TeamAvatar from './TeamAvatar';
import SaveTransferModal from './SaveTransferModal'; // Assurez-vous que le chemin est correct relative à Hub

export default function Hub({ onStartActivity }) {
    const { state, actions } = useGame();
    const [showInventory, setShowInventory] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedUniverse, setSelectedUniverse] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);

    const handleEnterActivity = (universeId, activityId) => {
        setSelectedUniverse(universeId);
        setSelectedActivity(activityId);
        actions.startActivity(universeId, activityId);

        // Navigate to activity via parent handler
        if (onStartActivity) {
            onStartActivity(universeId, activityId);
        }
    };

    const handleBackToHub = () => {
        setSelectedUniverse(null);
        setSelectedActivity(null);
        actions.setCurrentActivity(null);
    };

    const completedUniverses = actions.getCompletedCount();
    const totalUniverses = UNIVERSE_ORDER.length;

    return (
        <div className="min-h-screen bg-[#030308] relative overflow-hidden">
            {/* ═══════════════════════════════════════════════════════════════════════════
                ENHANCED BACKGROUND - Ultra SF Atmosphere
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Deep space gradient */}
                <div className="absolute inset-0" style={{
                    background: `
                        radial-gradient(ellipse at 50% 0%, rgba(0, 200, 255, 0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 100% 100%, rgba(255, 0, 200, 0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 0% 50%, rgba(100, 0, 255, 0.06) 0%, transparent 40%),
                        linear-gradient(180deg, #030308 0%, #0a0515 50%, #030308 100%)
                    `
                }} />

                {/* Animated grid */}
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                    transition={{ duration: 40, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 255, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 255, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                    }}
                />

                {/* Floating particles */}
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: Math.random() * 3 + 1,
                            height: Math.random() * 3 + 1,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: i % 3 === 0 ? '#0ff' : i % 3 === 1 ? '#f0f' : '#80f',
                            boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.6, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}

                {/* Scanlines effect */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
                }} />

                {/* Holographic shimmer */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0, 0.02, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.1) 50%, transparent 70%)',
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                PREMIUM HEADER - Holographic HUD
            ═══════════════════════════════════════════════════════════════════════════ */}
            <header className="relative z-20 px-4 py-4">
                <div className="max-w-lg mx-auto">
                    {/* Glass panel header */}
                    <motion.div
                        className="flex items-center justify-between p-3 rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,255,255,0.05) 0%, rgba(255,0,255,0.05) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0,255,255,0.15)',
                            boxShadow: '0 0 30px rgba(0,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        {/* Team Avatar & Info */}
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="relative w-12 h-12 rounded-xl overflow-hidden"
                                style={{
                                    border: '2px solid rgba(0,212,255,0.5)',
                                }}
                                animate={{
                                    boxShadow: [
                                        '0 0 15px rgba(0,212,255,0.6)',
                                        '0 0 25px rgba(168,85,247,0.6)',
                                        '0 0 15px rgba(0,212,255,0.6)',
                                    ],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <TeamAvatar
                                    name={state.teamName}
                                    className="w-full h-full object-cover"
                                />
                                {/* Holographic overlay */}
                                <motion.div
                                    className="absolute inset-0"
                                    animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    style={{
                                        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                                        backgroundSize: '200% 200%',
                                    }}
                                />
                            </motion.div>
                            <div>
                                <p className="text-white text-sm font-bold truncate max-w-[100px]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                    {state.teamName}
                                </p>
                                <div className="flex items-center gap-1">
                                    <motion.span
                                        className="text-cyan-400 text-xs font-mono font-bold"
                                        key={state.points}
                                        initial={{ scale: 1.3, color: '#fbbf24' }}
                                        animate={{ scale: 1, color: '#22d3ee' }}
                                    >
                                        {state.points.toLocaleString()}
                                    </motion.span>
                                    <span className="text-cyan-600 text-xs">PTS</span>
                                </div>
                            </div>
                        </div>

                        {/* Fragments Display */}
                        <motion.div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: state.fragments === totalUniverses
                                    ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%)'
                                    : 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.15) 100%)',
                                border: state.fragments === totalUniverses
                                    ? '1px solid rgba(34,197,94,0.5)'
                                    : '1px solid rgba(168,85,247,0.3)',
                            }}
                            animate={state.fragments === totalUniverses ? {
                                boxShadow: [
                                    '0 0 10px rgba(34,197,94,0.3)',
                                    '0 0 25px rgba(34,197,94,0.6)',
                                    '0 0 10px rgba(34,197,94,0.3)',
                                ]
                            } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <motion.span
                                className="text-xl"
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                💎
                            </motion.span>
                            <span className="font-bold text-sm" style={{
                                fontFamily: 'Orbitron',
                                color: state.fragments === totalUniverses ? '#22c55e' : '#a855f7'
                            }}>
                                {state.fragments}/{totalUniverses}
                            </span>
                        </motion.div>

                        {/* Inventory */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowInventory(!showInventory)}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                            style={{
                                background: 'rgba(0,255,255,0.1)',
                                border: '1px solid rgba(0,255,255,0.2)',
                            }}
                        >
                            🎒
                        </motion.button>

                        {/* Export Profile */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowExportModal(true)}
                            className="w-11 h-11 ml-2 rounded-xl flex items-center justify-center text-xl transition-all"
                            style={{
                                background: 'rgba(255,0,255,0.1)',
                                border: '1px solid rgba(255,0,255,0.2)',
                            }}
                        >
                            💾
                        </motion.button>

                        {/* Modal Export */}
                        <SaveTransferModal
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            mode="export"
                        />
                    </motion.div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════════════════
                MAIN CONTENT - Nexus Portal
            ═══════════════════════════════════════════════════════════════════════════ */}
            <main className="relative z-10 px-4 py-6 max-w-lg mx-auto">
                {/* Title Section with Holographic Effect */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <motion.div
                        className="inline-block mb-4"
                        animate={{
                            textShadow: [
                                '0 0 20px rgba(0,255,255,0.8), 0 0 40px rgba(0,255,255,0.4)',
                                '0 0 30px rgba(255,0,255,0.8), 0 0 60px rgba(255,0,255,0.4)',
                                '0 0 20px rgba(0,255,255,0.8), 0 0 40px rgba(0,255,255,0.4)',
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text"
                            style={{
                                fontFamily: 'Orbitron, sans-serif',
                                backgroundImage: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ec4899 100%)',
                            }}>
                            LE NEXUS
                        </h1>
                    </motion.div>

                    <motion.p
                        className="text-cyan-300/60 text-sm font-mono mb-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {'>'} SYSTÈME DE NAVIGATION DIMENSIONNELLE v2.0
                    </motion.p>

                    <motion.div
                        className="flex items-center justify-center gap-2 text-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full bg-green-500"
                            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-green-400/70 font-mono">
                            {completedUniverses === 0
                                ? 'UNIVERS DISPONIBLES • SCAN REQUIS'
                                : `${completedUniverses}/${totalUniverses} UNIVERS COMPLÉTÉS`
                            }
                        </span>
                    </motion.div>
                </motion.div>

                {/* Universe Cards Grid */}
                <div className="grid gap-4">
                    {UNIVERSE_ORDER.map((universeId, index) => (
                        <motion.div
                            key={universeId}
                            initial={{ opacity: 0, x: -50, rotateY: -15 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{
                                delay: index * 0.08,
                                type: 'spring',
                                stiffness: 100,
                            }}
                        >
                            <UniverseCard
                                universeId={universeId}
                                onEnter={handleEnterActivity}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Status Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 p-5 rounded-2xl text-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,30,60,0.6) 0%, rgba(30,0,60,0.6) 100%)',
                        border: '1px solid rgba(0,255,255,0.15)',
                        boxShadow: '0 0 40px rgba(0,255,255,0.05)',
                    }}
                >
                    {/* Animated border glow */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        animate={{
                            boxShadow: [
                                'inset 0 0 20px rgba(0,255,255,0.1)',
                                'inset 0 0 40px rgba(255,0,255,0.15)',
                                'inset 0 0 20px rgba(0,255,255,0.1)',
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />

                    {state.fragments === 0 && (
                        <div className="relative z-10">
                            <motion.span
                                className="text-3xl"
                                animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                📡
                            </motion.span>
                            <p className="text-cyan-200/70 text-sm font-mono mt-2">
                                Scannez un QR code pour activer un portail dimensionnel
                            </p>
                        </div>
                    )}
                    {state.fragments > 0 && state.fragments < totalUniverses && (
                        <div className="relative z-10">
                            <div className="flex justify-center gap-1 mb-3">
                                {[...Array(totalUniverses)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${i < state.fragments ? 'bg-fuchsia-500' : 'bg-gray-700'}`}
                                        animate={i < state.fragments ? {
                                            boxShadow: ['0 0 5px #d946ef', '0 0 15px #d946ef', '0 0 5px #d946ef']
                                        } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>
                            <p className="text-fuchsia-300/70 text-sm font-mono">
                                ◈ {totalUniverses - state.fragments} fragment(s) restant(s) à collecter
                            </p>
                        </div>
                    )}
                    {state.fragments === totalUniverses && (
                        <motion.div
                            className="relative z-10"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                        >
                            <motion.span
                                className="text-4xl"
                                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                🏆
                            </motion.span>
                            <p className="text-emerald-400 font-bold mt-2" style={{ fontFamily: 'Orbitron' }}>
                                MULTIVERS RESTAURÉ !
                            </p>
                            <p className="text-emerald-300/60 text-xs font-mono mt-1">
                                Tous les fragments ont été collectés
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* ═══════════════════════════════════════════════════════════════════════════
                INVENTORY PANEL
            ═══════════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showInventory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowInventory(false)}
                    >
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md rounded-2xl p-6"
                            style={{
                                background: 'linear-gradient(135deg, rgba(10,20,40,0.95) 0%, rgba(30,10,40,0.95) 100%)',
                                border: '1px solid rgba(0,255,255,0.3)',
                                boxShadow: '0 0 60px rgba(0,255,255,0.2)',
                            }}
                        >
                            <h2 className="text-xl font-bold text-center mb-6 text-transparent bg-clip-text"
                                style={{
                                    fontFamily: 'Orbitron',
                                    backgroundImage: 'linear-gradient(90deg, #0ff, #f0f)',
                                }}>
                                🎒 INVENTAIRE
                            </h2>

                            {state.inventory.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-4xl opacity-50">📦</span>
                                    <p className="text-gray-500 mt-3 font-mono text-sm">Inventaire vide</p>
                                    <p className="text-gray-600 text-xs mt-1">Collectez des objets durant vos aventures</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {state.inventory.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="aspect-square rounded-xl flex items-center justify-center text-2xl"
                                            style={{
                                                background: 'rgba(0,255,255,0.1)',
                                                border: '1px solid rgba(0,255,255,0.2)',
                                            }}
                                            whileHover={{ scale: 1.1, borderColor: 'rgba(0,255,255,0.5)' }}
                                        >
                                            {item}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowInventory(false)}
                                className="w-full mt-6 py-3 rounded-xl font-bold text-cyan-400 transition-all"
                                style={{
                                    background: 'rgba(0,255,255,0.1)',
                                    border: '1px solid rgba(0,255,255,0.3)',
                                }}
                            >
                                Fermer
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
