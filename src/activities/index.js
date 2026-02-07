/**
 * Index des Activités
 * 
 * Chaque activité est un mini-jeu lié à un film spécifique
 */

// Odyssée Spatiale
export { default as Rencontre3eType } from './Rencontre3eType';

// TODO: Ajouter les autres activités au fur et à mesure
// export { default as StarWarsForce } from './StarWarsForce';
// export { default as AlienSurvie } from './AlienSurvie';
// etc.

// Map des activités par ID pour le chargement dynamique
export const ACTIVITY_COMPONENTS = {
    'rencontre_3e_type': () => import('./Rencontre3eType'),
    // Ajouter les autres activités ici
};
