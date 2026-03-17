/**
 * Index des Activités - Barrel Export
 *
 * Ce fichier n'est PAS utilisé par PlayerApp (qui fait du lazy loading direct).
 * Il sert uniquement de référence centralisée des activités disponibles.
 *
 * Pour ajouter une activité:
 * 1. Créer le composant dans src/activities/
 * 2. Ajouter le lazy() import dans PlayerApp.jsx
 * 3. Ajouter l'entrée dans ACTIVITY_MAP de PlayerApp.jsx
 * 4. S'assurer que l'ID correspond à celui dans src/data/universes.js
 */

// Odyssée Spatiale
export { default as Rencontre3eType } from './Rencontre3eType';
export { default as RoverRadar } from './RoverRadar';
export { default as AlienSurvie } from './AlienSurvie';
export { default as InterstellarMorse } from './InterstellarMorse';
export { default as KesselRun } from './KesselRun';

// Royaumes Légendaires
export { default as SceauRunique } from './SceauRunique';
export { default as GotTrone } from './GotTrone';
export { default as CoursPotions } from './CoursPotions';
export { default as OracleSmaug } from './OracleSmaug';

// Ténèbres Éternelles
export { default as RingVHS } from './RingVHS';
export { default as SawEscape } from './SawEscape';
export { default as PennywiseRunner } from './PennywiseRunner';
export { default as OverlookMaze } from './OverlookMaze';

// Mécanique du Futur
export { default as MatrixChoix } from './MatrixChoix';
export { default as SkynetCode } from './SkynetCode';
export { default as ThreeLaws } from './ThreeLaws';
export { default as VoightKampff } from './VoightKampff';

// Ères Perdues
export { default as JurassicHack } from './JurassicHack';
export { default as SkullIsland } from './SkullIsland';
export { default as PrimalCommunication } from './PrimalCommunication';
export { default as PrimalHunt } from './PrimalHunt';

// Réalités Altérées
export { default as TenetInversion } from './TenetInversion';
export { default as TimelineParadox } from './TimelineParadox';

// Club Dorothée
export { default as Kamehameha } from './Kamehameha';
export { default as NickyLarson } from './NickyLarson';
export { default as SailorMoon } from './SailorMoon';

// Animation World
export { default as ToyStoryAndy } from './ToyStoryAndy';
export { default as ShrekSwamp } from './ShrekSwamp';
export { default as ChihiroBath } from './ChihiroBath';
export { default as LionKingLyrics } from './LionKingLyrics';

// Post-Apo
export { default as FalloutTerminal } from './FalloutTerminal';

// Génériques
export { default as GenericQuiz } from './GenericQuiz';
export { default as ComingSoon } from './ComingSoon';
