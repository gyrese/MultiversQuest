/**
 * Index des Activités
 * 
 * Chaque activité est un mini-jeu lié à un film spécifique
 */

// Odyssée Spatiale
export { default as Rencontre3eType } from './Rencontre3eType';
// Jurassic Park
export { default as JurassicHack } from './JurassicHack';
// Royaumes Légendaires
export { default as SceauRunique } from './SceauRunique';
// Réalités Altérées
export { default as TenetInversion } from './TenetInversion';
// Star Wars
export { default as KesselRun } from './KesselRun';

// Map des activités par ID pour le chargement dynamique
export const ACTIVITY_COMPONENTS = {
    'rencontre_3e_type': () => import('./Rencontre3eType'),
    'jurassic_hack': () => import('./JurassicHack'),
    'sceau_runique': () => import('./SceauRunique'),
    'tenet_inversion': () => import('./TenetInversion'),
    'kessel_run': () => import('./KesselRun'),
};
