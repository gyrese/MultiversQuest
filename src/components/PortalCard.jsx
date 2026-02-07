import { motion } from 'framer-motion';

// Configuration des univers avec leurs styles
const universeConfig = {
    jurassic: {
        name: 'JURASSIC PARK',
        subtitle: 'Terminal Génétique',
        icon: '🦖',
        gradient: 'from-green-900/80 to-emerald-950/80',
        borderColor: 'border-green-500/50',
        glowColor: 'rgba(34, 197, 94, 0.5)',
        accentColor: 'text-green-400',
        bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    },
    starwars: {
        name: 'STAR WARS',
        subtitle: 'Hologramme Galactique',
        icon: '⚔️',
        gradient: 'from-blue-900/80 to-indigo-950/80',
        borderColor: 'border-blue-500/50',
        glowColor: 'rgba(59, 130, 246, 0.5)',
        accentColor: 'text-blue-400',
        bgPattern: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.07'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
    },
    harrypotter: {
        name: 'HARRY POTTER',
        subtitle: 'Parchemin Magique',
        icon: '⚡',
        gradient: 'from-amber-900/80 to-yellow-950/80',
        borderColor: 'border-amber-500/50',
        glowColor: 'rgba(245, 158, 11, 0.5)',
        accentColor: 'text-amber-400',
        bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.05'%3E%3Cpath d='M30 30l15-15v30L30 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    },
    mario: {
        name: 'SUPER MARIO',
        subtitle: 'Pixel Dimension',
        icon: '🍄',
        gradient: 'from-red-900/80 to-rose-950/80',
        borderColor: 'border-red-500/50',
        glowColor: 'rgba(239, 68, 68, 0.5)',
        accentColor: 'text-red-400',
        bgPattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ef4444' fill-opacity='0.06'%3E%3Crect width='8' height='8' x='0' y='0'/%3E%3Crect width='8' height='8' x='16' y='16'/%3E%3Crect width='8' height='8' x='32' y='0'/%3E%3Crect width='8' height='8' x='16' y='32'/%3E%3C/g%3E%3C/svg%3E")`,
    },
};

export default function PortalCard({ universeId, status, onUnlock, onEnter }) {
    const config = universeConfig[universeId];
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isInProgress = status === 'in_progress';
    const isUnlocked = status === 'unlocked';

    const handleClick = () => {
        if (isLocked && onUnlock) {
            onUnlock(universeId);
        } else if ((isUnlocked || isInProgress) && onEnter) {
            onEnter(universeId);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isLocked ? { scale: 1.03, y: -5 } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
            onClick={handleClick}
            className={`
        portal-card relative overflow-hidden rounded-2xl p-5 cursor-pointer
        border-2 ${config.borderColor} ${isLocked ? 'locked' : ''}
        transition-all duration-500
      `}
            style={{
                background: `linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(20, 20, 35, 0.9))`,
                boxShadow: !isLocked
                    ? `0 0 30px ${config.glowColor}, inset 0 0 20px rgba(0, 0, 0, 0.3)`
                    : 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: config.bgPattern }}
            />

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-60`} />

            {/* Contenu */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <motion.span
                        className="text-3xl"
                        animate={!isLocked ? {
                            rotate: [0, -5, 5, 0],
                            scale: [1, 1.1, 1],
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        {config.icon}
                    </motion.span>

                    {/* Status Badge */}
                    {isCompleted && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="fragment-badge px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-[10px] font-bold text-black uppercase tracking-wider"
                        >
                            ✦ Fragment Restauré
                        </motion.div>
                    )}

                    {isInProgress && (
                        <motion.div
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 text-[10px] font-bold text-black uppercase tracking-wider"
                        >
                            ⟳ En Cours
                        </motion.div>
                    )}

                    {isLocked && (
                        <div className="px-3 py-1 rounded-full bg-gray-700/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-600/50">
                            🔒 Verrouillé
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className={`font-orbitron text-lg font-bold ${config.accentColor} mb-1`}>
                    {config.name}
                </h3>
                <p className="text-gray-400 text-xs font-mono mb-4">
                    {config.subtitle}
                </p>

                {/* Action Button */}
                {isLocked ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 rounded-lg bg-gray-800/80 border border-gray-600/50 text-gray-400 font-mono text-sm uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span>📡</span>
                            Bio-Scan Requis
                        </span>
                    </motion.button>
                ) : isCompleted ? (
                    <div className="w-full py-3 rounded-lg bg-green-900/30 border border-green-500/30 text-green-400 font-mono text-sm text-center uppercase tracking-wider">
                        ✓ Mission Accomplie
                    </div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-3 rounded-lg bg-gradient-to-r ${config.gradient.replace('/80', '')} border ${config.borderColor} ${config.accentColor} font-mono text-sm uppercase tracking-wider transition-all duration-300`}
                        style={{
                            boxShadow: `0 0 20px ${config.glowColor}`,
                        }}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span>▶</span>
                            {isInProgress ? 'Reprendre' : 'Entrer dans le Portail'}
                        </span>
                    </motion.button>
                )}
            </div>

            {/* Effet de scanlines sur la carte */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                }}
            />

            {/* Completed overlay effect */}
            {isCompleted && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 30%, rgba(34, 197, 94, 0.1) 100%)',
                    }}
                />
            )}
        </motion.div>
    );
}
