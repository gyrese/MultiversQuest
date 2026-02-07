import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/PlayerContext';

export default function LandingPage({ onEnter }) {
    const [teamName, setTeamName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bootSequence, setBootSequence] = useState([]);
    const { actions } = useGame();

    // Boot sequence animation
    useEffect(() => {
        const messages = [
            { text: '[OK] Connexion au Nexus établie', color: 'text-emerald-400', delay: 500 },
            { text: '[OK] Protocoles dimensionnels initialisés', color: 'text-emerald-400', delay: 1000 },
            { text: '[ALERTE] 6 univers détectés', color: 'text-amber-400', delay: 1500 },
            { text: '[REQUIS] Identification de l\'équipe', color: 'text-cyan-400', delay: 2000 },
        ];

        messages.forEach((msg, i) => {
            setTimeout(() => {
                setBootSequence(prev => [...prev, msg]);
            }, msg.delay);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) return;

        setIsLoading(true);

        // Simulation d'initialisation système
        await new Promise(resolve => setTimeout(resolve, 2000));

        actions.initializeTeam(teamName.trim());
        onEnter();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#030308]">

            {/* ═══════════════════════════════════════════════════════════════════════════
                ENHANCED BACKGROUND - Deep Space Atmosphere
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Space gradient */}
                <div className="absolute inset-0" style={{
                    background: `
                        radial-gradient(ellipse at 30% 20%, rgba(0, 100, 255, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, rgba(255, 0, 150, 0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(100, 0, 255, 0.08) 0%, transparent 60%),
                        linear-gradient(180deg, #020208 0%, #0a0520 50%, #020208 100%)
                    `
                }} />

                {/* Stars */}
                {[...Array(60)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: Math.random() * 2 + 0.5,
                            height: Math.random() * 2 + 0.5,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.3, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}

                {/* Animated grid */}
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                    transition={{ duration: 30, repeat: Infinity, repeatType: 'reverse' }}
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,255,0.5) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Floating orbs */}
                <motion.div
                    className="absolute w-64 h-64 rounded-full blur-3xl"
                    style={{ background: 'rgba(0,200,255,0.15)', left: '10%', top: '20%' }}
                    animate={{ x: [0, 50, 0], y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute w-48 h-48 rounded-full blur-3xl"
                    style={{ background: 'rgba(255,0,200,0.12)', right: '5%', bottom: '30%' }}
                    animate={{ x: [0, -40, 0], y: [0, 20, 0], opacity: [0.08, 0.15, 0.08] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />

                {/* Scanlines */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
                }} />
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                LOGO & TITLE
            ═══════════════════════════════════════════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 text-center mb-10"
            >
                {/* Central Logo */}
                <motion.div
                    className="relative mb-6 inline-block"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <motion.div
                        className="w-36 h-36 rounded-full overflow-hidden"
                        animate={{
                            boxShadow: [
                                '0 0 30px rgba(0,255,255,0.6), 0 0 60px rgba(0,255,255,0.3)',
                                '0 0 50px rgba(255,100,0,0.6), 0 0 80px rgba(255,100,0,0.3)',
                                '0 0 30px rgba(0,255,255,0.6), 0 0 60px rgba(0,255,255,0.3)',
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <img
                            src="/images/rocket-logo.png"
                            alt="MultiversQuest"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                    {/* Orbiting particles */}
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                background: i === 0 ? '#0ff' : i === 1 ? '#f90' : '#f0f',
                                boxShadow: `0 0 10px ${i === 0 ? '#0ff' : i === 1 ? '#f90' : '#f0f'}`,
                                top: '50%',
                                left: '50%',
                            }}
                            animate={{
                                x: [75 * Math.cos(i * 2.09), 75 * Math.cos(i * 2.09 + Math.PI), 75 * Math.cos(i * 2.09 + 2 * Math.PI)],
                                y: [75 * Math.sin(i * 2.09), 75 * Math.sin(i * 2.09 + Math.PI), 75 * Math.sin(i * 2.09 + 2 * Math.PI)],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
                        />
                    ))}
                </motion.div>

                <motion.h1
                    className="text-4xl md:text-5xl font-black tracking-wider mb-2"
                    style={{
                        fontFamily: 'Orbitron, sans-serif',
                        background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ec4899 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                    animate={{
                        textShadow: [
                            '0 0 30px rgba(0,212,255,0.5)',
                            '0 0 50px rgba(168,85,247,0.5)',
                            '0 0 30px rgba(0,212,255,0.5)',
                        ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    MULTIVERSE
                </motion.h1>

                <motion.p
                    className="text-2xl font-bold tracking-[0.3em] text-cyan-400"
                    style={{ fontFamily: 'Orbitron' }}
                    animate={{
                        textShadow: [
                            '0 0 10px rgba(0,255,255,0.8)',
                            '0 0 20px rgba(0,255,255,1)',
                            '0 0 10px rgba(0,255,255,0.8)',
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    QUEST
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 text-gray-500 font-mono text-xs tracking-wider"
                >
                    SYSTÈME DE RESTAURATION MULTIVERS v3.47
                </motion.p>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                TERMINAL CARD
            ═══════════════════════════════════════════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                <div
                    className="rounded-2xl p-6 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,30,60,0.8) 0%, rgba(30,0,60,0.8) 100%)',
                        border: '1px solid rgba(0,255,255,0.2)',
                        boxShadow: '0 0 50px rgba(0,255,255,0.1), inset 0 0 50px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Animated border glow */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        animate={{
                            boxShadow: [
                                'inset 0 0 20px rgba(0,255,255,0.1), 0 0 30px rgba(0,255,255,0.1)',
                                'inset 0 0 40px rgba(255,0,255,0.15), 0 0 40px rgba(255,0,255,0.15)',
                                'inset 0 0 20px rgba(0,255,255,0.1), 0 0 30px rgba(0,255,255,0.1)',
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />

                    {/* Terminal header */}
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-cyan-900/30">
                        <motion.div
                            className="w-3 h-3 rounded-full bg-red-500"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                            className="w-3 h-3 rounded-full bg-yellow-500"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        />
                        <motion.div
                            className="w-3 h-3 rounded-full bg-green-500"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        />
                        <span className="ml-4 text-xs text-gray-600 font-mono">
                            nexus_terminal.exe
                        </span>
                    </div>

                    {/* Boot sequence messages */}
                    <div className="space-y-2 mb-6 font-mono text-xs min-h-[100px]">
                        <AnimatePresence>
                            {bootSequence.map((msg, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={msg.color}
                                >
                                    {msg.text}
                                    {i === bootSequence.length - 1 && (
                                        <motion.span
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                        >
                                            _
                                        </motion.span>
                                    )}
                                </motion.p>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-cyan-400/70 text-sm mb-2 font-mono">
                                {'>'} IDENTITÉ DE L'ÉQUIPE
                            </label>
                            <motion.input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Entrez le nom de votre équipe..."
                                className="w-full px-5 py-4 rounded-xl text-white font-mono text-lg placeholder-gray-600
                                           focus:outline-none transition-all duration-300"
                                style={{
                                    background: 'rgba(0,20,40,0.8)',
                                    border: '1px solid rgba(0,255,255,0.2)',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                                }}
                                whileFocus={{
                                    borderColor: 'rgba(0,255,255,0.5)',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,255,0.2)',
                                }}
                                maxLength={25}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={!teamName.trim() || isLoading}
                            whileHover={teamName.trim() && !isLoading ? { scale: 1.02, y: -2 } : {}}
                            whileTap={teamName.trim() && !isLoading ? { scale: 0.98 } : {}}
                            className="w-full py-5 rounded-xl font-bold text-lg uppercase tracking-wider relative overflow-hidden transition-all duration-300"
                            style={{
                                fontFamily: 'Orbitron',
                                background: isLoading
                                    ? 'linear-gradient(135deg, rgba(0,200,255,0.3) 0%, rgba(168,85,247,0.3) 100%)'
                                    : teamName.trim()
                                        ? 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ec4899 100%)'
                                        : 'rgba(50,50,70,0.5)',
                                color: teamName.trim() ? '#fff' : '#666',
                                cursor: teamName.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                boxShadow: teamName.trim() && !isLoading
                                    ? '0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(168,85,247,0.2)'
                                    : 'none',
                            }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="inline-block w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full"
                                    />
                                    INITIALISATION...
                                </span>
                            ) : (
                                <>
                                    <span className="relative z-10">🚀 INITIALISER SYSTÈME</span>
                                    {teamName.trim() && (
                                        <motion.div
                                            className="absolute inset-0"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '200%' }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            style={{
                                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>

            {/* Footer warning */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="relative z-10 text-center mt-8 text-gray-600 text-xs font-mono"
            >
                ⚠️ La stabilité du multivers dépend de vous
            </motion.p>
        </div>
    );
}
