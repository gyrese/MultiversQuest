/**
 * MULTIVERSE QUEST - Template Univers
 * 
 * Ce fichier sert de modèle pour créer les pages de jeu de chaque univers.
 * Copiez ce fichier et adaptez-le pour chaque univers (Jurassic, StarWars, etc.)
 * 
 * Structure attendue:
 * - Chaque univers a son propre composant dans /src/universes/
 * - Le composant reçoit les actions du PlayerContext pour gérer la progression
 * - Utilisez les couleurs et thèmes définis dans index.css
 */

import { motion } from 'framer-motion';
import { useGame } from '../context/PlayerContext';

// Configuration du template
const UNIVERSE_ID = 'template'; // Remplacez par: jurassic, starwars, harrypotter, mario
const UNIVERSE_NAME = 'Nom de l\'Univers';
const THEME_COLORS = {
    primary: '#00ffff',
    secondary: '#12121a',
    accent: '#ff00ff',
};

export default function UniverseTemplate({ onComplete, onExit }) {
    const { state, actions } = useGame();

    // Exemple de complétion d'univers
    const handleComplete = () => {
        const pointsEarned = 250; // Points gagnés par l'équipe
        actions.completeUniverse(UNIVERSE_ID, pointsEarned);

        if (onComplete) {
            onComplete(pointsEarned);
        }
    };

    // Retour au Hub
    const handleExit = () => {
        if (onExit) {
            onExit();
        }
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ backgroundColor: THEME_COLORS.secondary }}
        >
            {/* Header de l'univers */}
            <header className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleExit}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm"
                    >
                        ← Retour au Nexus
                    </button>
                    <h1
                        className="font-orbitron font-bold"
                        style={{ color: THEME_COLORS.primary }}
                    >
                        {UNIVERSE_NAME}
                    </h1>
                </div>
            </header>

            {/* Zone de contenu principal */}
            <main className="p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <p className="text-gray-400 mb-8">
                        Insérez ici la logique de jeu spécifique à cet univers.
                    </p>

                    {/* 
            STRUCTURE SUGGÉRÉE POUR CHAQUE UNIVERS:
            
            1. État local pour suivre la progression dans l'univers
            2. Composants d'énigmes/questions spécifiques au thème
            3. Système de scoring
            4. Animations et effets visuels thématiques
            5. Collecte du fragment à la fin
          */}

                    {/* Exemple de bouton de complétion (à remplacer par vraie logique) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleComplete}
                        className="px-8 py-4 rounded-xl font-bold text-lg"
                        style={{
                            background: `linear-gradient(135deg, ${THEME_COLORS.primary}, ${THEME_COLORS.accent})`,
                            color: '#000',
                        }}
                    >
                        🏆 Récupérer le Fragment
                    </motion.button>
                </motion.div>
            </main>
        </div>
    );
}

/**
 * EXEMPLES DE MINI-JEUX PAR UNIVERS:
 * 
 * 🦖 JURASSIC PARK:
 *    - Quiz sur les dinosaures
 *    - Puzzle de séquence ADN
 *    - Trouver les différences dans une scène
 *    - Labyrinthe pour échapper aux raptors
 * 
 * ⚔️ STAR WARS:
 *    - Quiz sur la saga
 *    - Memory avec les personnages
 *    - Déchiffrage de message en Aurebesh
 *    - Choix moraux (Côté lumineux/obscur)
 * 
 * ⚡ HARRY POTTER:
 *    - Sorting Hat quiz
 *    - Devinettes de potions
 *    - Reconnaissance de sortilèges
 *    - Enigmes de Sphinx
 * 
 * 🍄 SUPER MARIO:
 *    - Quiz pixels/rétro
 *    - Simon avec les blocs ?
 *    - Course contre la montre (QCM rapide)
 *    - Associations thématiques
 */
