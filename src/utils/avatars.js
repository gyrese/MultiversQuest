/**
 * 🎨 Utilitaires pour la génération d'avatars DiceBear
 * Utilise l'API DiceBear pour générer des avatars uniques basés sur un seed
 */

// Styles DiceBear disponibles
export const AVATAR_STYLES = [
    { id: 'bottts', label: 'Robots', icon: '🤖' },
    { id: 'pixel-art', label: 'Pixel Art', icon: '👾' },
    { id: 'avataaars', label: 'Cartoon', icon: '😎' },
    { id: 'lorelei', label: 'Minimaliste', icon: '🎭' },
    { id: 'fun-emoji', label: 'Fun Emoji', icon: '🤪' },
    { id: 'thumbs', label: 'Thumbs', icon: '👍' },
    { id: 'shapes', label: 'Formes', icon: '🔷' },
    { id: 'adventurer', label: 'Aventurier', icon: '🧝' },
    { id: 'big-smile', label: 'Sourire', icon: '😁' },
    { id: 'notionists', label: 'Notionists', icon: '✏️' },
    { id: 'open-peeps', label: 'Open Peeps', icon: '🙋' },
    { id: 'personas', label: 'Personas', icon: '👤' },
];

/**
 * Génère l'URL d'un avatar DiceBear
 * @param {string} seed - Le seed pour générer l'avatar (ex: nom d'équipe)
 * @param {string} style - Le style DiceBear (ex: 'bottts', 'pixel-art')
 * @param {number} size - La taille de l'avatar en pixels
 * @returns {string} URL de l'avatar SVG
 */
export const getAvatarUrl = (seed, style = 'bottts', size = 128) => {
    const encodedSeed = encodeURIComponent(seed || 'default');
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodedSeed}&size=${size}&backgroundColor=0a0a0f,1a1a2e,0f0f1f`;
};

/**
 * Récupère le style d'avatar par son ID
 * @param {string} styleId - L'ID du style
 * @returns {object|undefined} L'objet style ou undefined
 */
export const getAvatarStyleById = (styleId) => {
    return AVATAR_STYLES.find(s => s.id === styleId);
};

export default {
    AVATAR_STYLES,
    getAvatarUrl,
    getAvatarStyleById
};
