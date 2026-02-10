import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/PlayerContext';

/**
 * ActivityShell - Conteneur standard pour toutes les activités
 *
 * @param {string} title - Titre de l'activité
 * @param {string} subtitle - Sous-titre ou description courte
 * @param {string} universeColor - Couleur de l'univers (pour le thème)
 * @param {function} onExit - Callback pour quitter l'activité
 * @param {boolean} isCompleted - Si l'activité est terminée
 * @param {number} score - Score actuel
 * @param {number} bonus - Bonus obtenu
 * @param {ReactNode} children - Contenu principal de l'activité
 * @param {ReactNode} background - Composant de fond optionnel
 * @param {ReactNode} successContent - Contenu à afficher en cas de succès (optionnel)
 */
export default function ActivityShell({
    title,
    subtitle,
    universeColor = '#a855f7',
    onExit,
    isCompleted,
    score = 0,
    bonus = 0,
    children,
    background,
    successContent,
}) {
    const { state } = useGame();
    // Utiliser la couleur de l'univers si disponible
    // const themeColor = universeColor;

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#020817] text-white">
            {/* Fond d'écran global */}
            <div className="absolute inset-0 z-0">
                {background}
                {/* Overlay sombre plus léger pour garder les couleurs vibrantes */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
            </div>

            {/* Header de l'activité */}
            <header className="relative z-20 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExit}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors border border-white/5 backdrop-blur-md"
                    >
                        ← Retour
                    </motion.button>

                    <div className="text-center flex-1 mx-4">
                        <h1
                            className="font-orbitron font-bold text-xl sm:text-2xl leading-tight truncate px-2"
                            style={{
                                background: `linear-gradient(to right, #fff, ${universeColor})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: `0 0 20px ${universeColor}80`  // Glow subtil sur le titre
                            }}
                        >
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-white/60 uppercase tracking-widest truncate mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Affichage du score si complété */}
                    <div className="w-[60px] flex justify-end">
                        {isCompleted ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex flex-col items-end"
                            >
                                <span className="text-[10px] text-green-400 font-bold uppercase">Succès</span>
                                <span className="font-mono text-lg font-bold text-white">+{score}</span>
                            </motion.div>
                        ) : (
                            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-lg">
                                <span className="text-lg">🏆</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Contenu Principal */}
            <main className="relative z-10 flex flex-col min-h-[calc(100vh-80px)] items-center justify-center">
                <AnimatePresence mode="wait">
                    {!isCompleted ? (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 md:p-8 justify-center"
                        >
                            {children}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto text-center"
                        >
                            {/* Écran de succès par défaut ou personnalisé */}
                            {successContent || (
                                <div className="bg-black/80 border border-white/10 rounded-2xl p-8 w-full backdrop-blur-xl shadow-2xl">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="text-6xl mb-4"
                                    >
                                        🎉
                                    </motion.div>

                                    <h2 className="text-3xl font-orbitron font-bold text-white mb-2">Activté Réussie !</h2>
                                    <p className="text-white/60 mb-6">Vous avez brillamment relevé le défi.</p>

                                    <div className="bg-white/5 rounded-xl p-4 mb-8">
                                        <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Score Total</p>
                                        <p className="text-5xl font-mono font-bold text-green-400">
                                            {score} <span className="text-lg text-white/30">pts</span>
                                        </p>
                                        {bonus > 0 && (
                                            <div className="mt-2 text-sm text-yellow-400 font-medium">
                                                (dont +{bonus} pts de bonus)
                                            </div>
                                        )}
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onExit}
                                        className="w-full py-4 rounded-xl font-bold text-lg bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 transition-all"
                                    >
                                        Continuer l'aventure
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
