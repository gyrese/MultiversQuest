import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UNIVERSES } from '../data/universes';
import { usePlayer } from '../context/PlayerContext';

export default function UniverseCard({ universeId, onEnter }) {
    const { state, actions } = usePlayer();
    const [isExpanded, setIsExpanded] = useState(false);

    const universeConfig = UNIVERSES[universeId];
    const universeState = state.universes[universeId];

    if (!universeConfig || !universeState) return null;

    const { name, subtitle, icon, image, colors, activities } = universeConfig;
    const { status, completedActivities } = universeState;
    // En Session Night, seules les activités déverrouillées comptent (pas toutes les 8 de l'univers)
    const totalActivities = state.isSessionNight
        ? Object.values(universeState.activities || {}).filter(a => a.status !== 'locked').length
        : Object.keys(activities).length;
    const progress = actions.getUniverseProgress(universeId);

    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';

    const handleCardClick = () => {
        if (isLocked) {
            // Simulate bio-scan unlock (in real app, this would be QR code or physical action)
            actions.unlockUniverse(universeId);
            // Also unlock first activity
            const firstActivityId = Object.keys(activities)[0];
            if (firstActivityId) {
                actions.unlockActivity(universeId, firstActivityId);
            }
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    const handleEnterActivity = (activityId) => {
        if (onEnter) {
            onEnter(universeId, activityId);
        }
    };

    return (
        <motion.div
            layout
            className="relative rounded-2xl overflow-hidden"
            style={{
                background: isLocked
                    ? 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)'
                    : universeConfig.background,
                border: `2px solid ${isLocked ? '#333' : colors.primary}40`,
                boxShadow: isLocked
                    ? 'none'
                    : `0 0 30px ${colors.glow}, inset 0 0 60px ${colors.primary}10`,
            }}
        >
            {/* Card Header - Always visible */}
            <motion.div
                className="p-5 cursor-pointer"
                onClick={handleCardClick}
                whileHover={{ scale: isLocked ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <div className="flex items-center gap-4">
                    {/* Icon Container */}
                    <motion.div
                        className="relative w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                        style={{
                            background: isLocked
                                ? 'rgba(50, 50, 50, 0.5)'
                                : `linear-gradient(135deg, ${colors.primary}30, ${colors.accent}30)`,
                            border: `2px solid ${isLocked ? '#444' : colors.primary}60`,
                        }}
                        animate={!isLocked && !isCompleted ? {
                            boxShadow: [
                                `0 0 10px ${colors.glow}`,
                                `0 0 25px ${colors.glow}`,
                                `0 0 10px ${colors.glow}`,
                            ],
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {isLocked ? '🔒' : (
                            image ? (
                                <img
                                    src={image}
                                    alt={name}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : icon
                        )}

                        {/* Completion badge */}
                        {isCompleted && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-sm shadow-lg"
                            >
                                ✓
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Text Content */}
                    <div className="flex-1">
                        <h3
                            className="font-orbitron font-bold text-lg mb-1"
                            style={{ color: isLocked ? '#666' : colors.primary }}
                        >
                            {name}
                        </h3>
                        <p className={`text-sm ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                            {isLocked ? '🔐 Scan requis pour débloquer' : subtitle}
                        </p>

                        {/* Progress bar */}
                        {!isLocked && (
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.percentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    />
                                </div>
                                <span
                                    className="text-xs font-mono"
                                    style={{ color: colors.primary }}
                                >
                                    {completedActivities}/{totalActivities}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Arrow indicator */}
                    {!isLocked && (
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-2xl"
                            style={{ color: colors.primary }}
                        >
                            ⌵
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Expanded Activities List */}
            <AnimatePresence>
                {isExpanded && !isLocked && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="px-5 pb-5 pt-2 border-t"
                            style={{ borderColor: `${colors.primary}20` }}
                        >
                            <p className="text-xs text-gray-500 font-mono mb-3">
                                ▸ Sélectionnez une activité
                            </p>
                            <div className="grid gap-2">
                                {Object.values(activities).map((activity, index) => {
                                    const activityState = universeState.activities[activity.id];
                                    const isActivityLocked = activityState?.status === 'locked';
                                    const isActivityCompleted = activityState?.status === 'completed';

                                    // SESSION NIGHT: Hide locked activities completely (reduce noise)
                                    // User req: "show ONLY selected 4 challenges"
                                    if (state.isSessionNight && isActivityLocked) {
                                        return null;
                                    }

                                    // Detect Quiz Highlight
                                    const isQuiz = activity.type === 'quiz' || activity.id.includes('quiz'); // Robust check
                                    const isQuizHighlight = isQuiz && !isActivityLocked && !isActivityCompleted;

                                    return (
                                        <motion.button
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={isQuizHighlight ? {
                                                opacity: 1, x: 0,
                                                scale: [1, 1.02, 1],
                                                borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'], // Amber/Gold pulse
                                                boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 15px rgba(245,158,11,0.3)', '0 0 0px rgba(245,158,11,0)']
                                            } : { opacity: 1, x: 0 }}
                                            transition={isQuizHighlight ? {
                                                duration: 1.5,
                                                repeat: Infinity
                                            } : { delay: index * 0.05 }}
                                            onClick={() => !isActivityLocked && handleEnterActivity(activity.id)}
                                            disabled={isActivityLocked}
                                            className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isActivityLocked
                                                ? 'bg-black/20 cursor-not-allowed opacity-50 grayscale' // Grayscale added for extra "disabled" feel
                                                : isQuizHighlight
                                                    ? 'bg-amber-500/10 cursor-pointer'
                                                    : 'bg-black/30 hover:bg-black/50 cursor-pointer'
                                                }`}
                                            style={{
                                                border: isQuizHighlight
                                                    ? '2px solid #f59e0b'
                                                    : `1px solid ${isActivityCompleted ? '#22c55e40' : isActivityLocked ? '#33333340' : colors.primary + '30'}`,
                                            }}
                                            whileHover={!isActivityLocked ? { scale: 1.02, x: 5 } : {}}
                                            whileTap={!isActivityLocked ? { scale: 0.98 } : {}}
                                        >
                                            {/* Activity Icon */}
                                            <span className="text-2xl">
                                                {isActivityLocked ? '🔒' : activity.icon}
                                            </span>

                                            {/* Activity Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-semibold text-sm ${isActivityLocked ? 'text-gray-600' : isQuizHighlight ? 'text-amber-400 font-bold' : 'text-white'}`}>
                                                    {isQuizHighlight ? '🔥 ' : ''}{activity.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {activity.type === 'quiz' ? 'Épreuve Finale' : activity.film}
                                                </p>
                                            </div>

                                            {/* Difficulty & Points */}
                                            <div className="text-right">
                                                <div className="flex gap-0.5 justify-end mb-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`text-xs ${i < activity.difficulty ? 'text-yellow-500' : 'text-gray-700'}`}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                <span
                                                    className="text-xs font-mono"
                                                    style={{ color: isActivityCompleted ? '#22c55e' : colors.primary }}
                                                >
                                                    {isActivityCompleted
                                                        ? `✓ ${activityState.bestScore}pts`
                                                        : `${activity.maxPoints}pts`
                                                    }
                                                </span>
                                            </div>

                                            {/* Play indicator */}
                                            {!isActivityLocked && (
                                                <motion.span
                                                    className="text-lg"
                                                    style={{ color: isQuizHighlight ? '#f59e0b' : colors.primary }}
                                                    animate={{ x: [0, 5, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    ▶
                                                </motion.span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Locked overlay effect */}
            {isLocked && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
                        }}
                    />
                </div>
            )}

            {/* Completion glow effect */}
            {isCompleted && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                        boxShadow: [
                            'inset 0 0 20px rgba(34, 197, 94, 0.2)',
                            'inset 0 0 40px rgba(34, 197, 94, 0.3)',
                            'inset 0 0 20px rgba(34, 197, 94, 0.2)',
                        ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </motion.div>
    );
}
