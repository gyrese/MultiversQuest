
import { useState, useRef, useEffect } from 'react';

/**
 * Hook de scoring standard pour les mini-jeux MultiversQuest
 * Gère le chronomètre, les tentatives et le calcul du score final.
 */
export function useActivityScore({
    maxPoints = 1000,
    activityType = 'standard', // 'sequence', 'quiz', 'decode', 'standard'
    onComplete = () => { }
} = {}) {
    // État du jeu
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [attempts, setAttempts] = useState(0); // Nombre d'essais ou d'erreurs
    const [clicks, setClicks] = useState(0);     // Nombre d'actions utilisateur
    const [score, setScore] = useState(0);

    // Refs pour les valeurs qui ne déclenchent pas de re-render (si nécessaire)
    const timerRef = useRef(null);

    /**
     * Démarre l'activité et le chronomètre
     */
    const startActivity = () => {
        setIsPlaying(true);
        setIsCompleted(false);
        setStartTime(Date.now());
        setEndTime(null);
        setAttempts(0);
        setClicks(0);
        setScore(0);
    };

    /**
     * Enregistre une interaction (clic, action, essai)
     * @param {boolean} isError - Si l'action était une erreur
     */
    const recordAction = (isError = false) => {
        if (!isPlaying) return;
        setClicks(prev => prev + 1);
        if (isError) {
            setAttempts(prev => prev + 1);
        }
    };

    /**
     * Termine l'activité et calcule le score final
     * @param {boolean} success - Si l'activité a été réussie
     * @param {object} metadata - Données supplémentaires pour le calcul (ex: niveau de difficulté)
     */
    const finalizeActivity = (success = true, metadata = {}) => {
        if (!isPlaying && !startTime) return; // Déjà fini ou pas commencé

        const end = Date.now();
        setEndTime(end);
        setIsPlaying(false);
        setIsCompleted(true);

        if (!success) {
            setScore(0);
            onComplete({ score: 0, success: false });
            return;
        }

        // Calcul du score
        const durationMs = end - startTime;
        const durationSec = durationMs / 1000;

        let calculatedScore = maxPoints;

        // Bonus/Malus selon le type d'activité
        switch (activityType) {
            case 'sequence': // Simon-like : pénalité par erreur, bonus de vitesse
                // Pénalité exponentielle pour les erreurs
                if (attempts > 0) {
                    calculatedScore -= (attempts * 100);
                }

                // Bonus de vitesse si sans erreur majeure
                if (attempts === 0 && durationSec < 30) {
                    calculatedScore += 200;
                }
                break;

            case 'quiz': // Questions : score basé sur les bonnes réponses (géré externe) ou temps
                // Ici on suppose que maxPoints est le score parfait, on réduit par erreur
                calculatedScore -= (attempts * (maxPoints / 10)); // 10% par erreur
                break;

            case 'decode': // Puzzle/Code : fortement basé sur le temps
                // Perte de points par seconde après un seuil
                const timeThreshold = 60; // secondes
                if (durationSec > timeThreshold) {
                    calculatedScore -= Math.floor(durationSec - timeThreshold) * 5;
                }
                // Pénalité par tentative erronée
                calculatedScore -= (attempts * 50);
                break;

            default:
                // Version standard : temps et erreurs simples
                calculatedScore -= (attempts * 50);
                break;
        }

        // Le score ne peut pas être négatif
        const finalScore = Math.max(0, Math.round(calculatedScore));
        setScore(finalScore);

        onComplete({
            score: finalScore,
            success: true,
            stats: {
                duration: durationMs,
                attempts,
                clicks
            }
        });
    };

    /**
     * Formate le temps écoulé pour l'affichage
     */
    const getFormattedTime = () => {
        if (!startTime) return "00:00";
        const end = endTime || Date.now();
        const duration = Math.floor((end - startTime) / 1000);
        const mins = Math.floor(duration / 60).toString().padStart(2, '0');
        const secs = (duration % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // Timer pour mettre à jour l'interface si besoin (optionnel, peut être géré par le composant)
    // Ici on ne force pas le re-render chaque seconde pour la performance, 
    // le composant parent peut utiliser son propre RAF ou setInterval pour l'affichage.

    return {
        // États
        isPlaying,
        isCompleted,
        score,
        attempts,
        clicks,

        // Actions
        startActivity,
        recordAction,
        finalizeActivity,

        // Helpers
        getFormattedTime
    };
}
