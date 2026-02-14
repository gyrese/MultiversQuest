
import { useState, useCallback, useRef } from 'react';
import { useGame } from '../context/PlayerContext';
import { useGame as useGlobalGame } from '../context/GameContext';

/**
 * Hook Activity Engine Standardisé
 * Gère l'état, le timer, les tentatives et le calcul de score selon le type d'activité.
 * 
 * @param {string} universeId - ID de l'univers cible
 * @param {string} activityId - ID unique de l'activité
 * @param {Object} options - Configuration de l'activité
 * @param {number} options.maxPoints - Score maximum possible (défaut: 1000)
 * @param {string} options.activityType - 'standard', 'sequence', 'quiz', 'time-attack'
 * @param {function} options.onComplete - Callback de fin (succès ou échec)
 */
export function useActivityScore(universeId, activityId, options = {}) {
    const { maxPoints = 1000, activityType = 'standard', onComplete } = options;
    const { actions } = useGame();
    const { submitScore } = useGlobalGame();

    // État du jeu
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [bonus, setBonus] = useState(0); // Bonus affiché séparément

    // Stats internes pour le calcul
    const stats = useRef({
        startTime: null,
        endTime: null,
        attempts: 0,
        errors: 0,
        clicks: 0, // Pour le type sequence/clics
    });

    /**
     * Démarre l'activité (lance le timer)
     */
    const startActivity = useCallback(() => {
        setIsPlaying(true);
        setIsCompleted(false);
        setScore(0);
        setBonus(0);
        stats.current = {
            startTime: Date.now(),
            endTime: null,
            attempts: 0,
            errors: 0,
            clicks: 0,
        };
    }, []);

    /**
     * Enregistre une action (clic, essai, erreur)
     * @param {boolean} isError - Si l'action est une erreur
     */
    const recordAction = useCallback((isError = false) => {
        if (!isPlaying) return;

        if (isError) {
            stats.current.errors += 1;
        }
        stats.current.clicks += 1;
        stats.current.attempts += 1;
    }, [isPlaying]);

    /**
     * Termine l'activité et calcule le score final
     * @param {boolean} success - Si l'activité est réussie
     * @param {number} customBonus - Bonus manuel (optionnel, s'ajoute au calcul)
     */
    const finalizeActivity = useCallback((success, customBonus = 0) => {
        if (!isPlaying && !success) return; // On peut forcer la fin même si pas "playing" (ex: debug)

        const endTime = Date.now();
        stats.current.endTime = endTime;
        const duration = (endTime - stats.current.startTime) / 1000; // secondes

        let finalScore = 0;
        let calculatedBonus = customBonus;

        if (success) {
            // Logique de scoring selon le type
            switch (activityType) {
                case 'sequence':
                    // Type "Rencontre du 3e type" : pénalité par erreur, bonus de rapidité (clics)
                    // Note: Le bonus de clics est souvent calculé par le composant parent et passé via customBonus
                    // Ici on applique une petite pénalité de base pour les erreurs éventuelles
                    finalScore = Math.max(0, maxPoints - (stats.current.errors * 50));
                    break;

                case 'quiz':
                    // Type QCM : Pourcentage de réussite (géré souvent en amont, ici simple placeholder)
                    finalScore = maxPoints;
                    break;

                case 'time-attack':
                    // Plus c'est rapide, plus ça rapporte
                    // Exemple : Max points si < 30s, puis décroissance
                    const timePenalty = Math.max(0, (duration - 30) * 10);
                    finalScore = Math.max(100, maxPoints - timePenalty);
                    break;

                case 'standard':
                default:
                    // Score fixe moins pénalités
                    finalScore = Math.max(100, maxPoints - (stats.current.errors * 20));
                    break;
            }

            // Ajouter le bonus externe (ex: rapidité spécifique)
            if (typeof calculatedBonus !== 'number' || isNaN(calculatedBonus)) {
                console.warn('⚠️ useActivityScore: Bonus invalide, ignoré', calculatedBonus);
                calculatedBonus = 0;
            }
            finalScore += calculatedBonus;
        }

        // Sécurité anti-NaN
        if (typeof finalScore !== 'number' || isNaN(finalScore)) {
            console.error('⚠️ useActivityScore: Score final NaN détecté! Force à 0.', {
                activityType, maxPoints, errors: stats.current.errors, duration, customBonus
            });
            finalScore = 0;
        }

        setScore(finalScore);
        setBonus(calculatedBonus);
        setIsCompleted(true);
        setIsPlaying(false);

        // Sauvegarde globale (si succès)
        if (success) {
            // 1. Mise à jour Locale (Client)
            if (actions && actions.completeActivity) {
                actions.completeActivity(universeId, activityId, finalScore);
            }
            // 2. Mise à jour Serveur (Socket)
            if (submitScore) {
                console.log(`📤 Sending score to server: ${universeId}/${activityId} = ${finalScore}`);
                submitScore(universeId, activityId, finalScore, true);
            } else {
                console.error("❌ Cannot submit score: GameContext not available or not connected");
            }
        }

        if (onComplete) {
            onComplete({
                success,
                score: finalScore,
                stats: { ...stats.current, duration }
            });
        }

    }, [isPlaying, activityType, maxPoints, actions, universeId, activityId, onComplete, submitScore]);

    return {
        // États
        isPlaying,
        isCompleted,
        score,
        bonus,
        stats: stats.current,

        // Actions
        startActivity,
        recordAction,
        finalizeActivity
    };
}
