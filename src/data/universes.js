/**
 * MULTIVERSE QUEST - Configuration des Univers et Activités
 * 
 * Structure hiérarchique:
 * - UNIVERS: Thèmes génériques (Heroic Fantasy, Horreur, SF Espace, etc.)
 * - ACTIVITÉS: Mini-jeux spécifiques liés à des films dans chaque univers
 */

export const UNIVERSES = {
    // 🚀 SF ESPACE - Voyages interstellaires et premiers contacts
    odyssee_spatiale: {
        id: 'odyssee_spatiale',
        name: 'ODYSSÉE SPATIALE',
        subtitle: 'Aux confins de l\'univers',
        icon: '🚀',
        image: '/images/universes/odyssee_spatiale.png',
        colors: {
            primary: '#00d4ff',
            secondary: '#0a1628',
            accent: '#7c3aed',
            glow: 'rgba(0, 212, 255, 0.5)',
        },
        background: 'linear-gradient(135deg, #0a1628 0%, #1a0a2e 50%, #0a1628 100%)',
        description: 'Explorez les mystères de l\'espace profond',
        activities: {
            rencontre_3e_type: {
                id: 'rencontre_3e_type',
                name: 'Rencontre du 3ᵉ Type',
                film: 'Rencontre du 3ᵉ Type (1977)',
                icon: '👽',
                type: 'sequence',
                description: 'Reproduisez la séquence musicale pour communiquer avec les extraterrestres',
                difficulty: 2,
                maxPoints: 300,
                hint: 'Écoutez attentivement les 5 notes et reproduisez-les dans le bon ordre',
            },
            star_wars_force: {
                id: 'star_wars_force',
                name: 'L\'Appel de la Force',
                film: 'Star Wars (Saga)',
                icon: '⚔️',
                type: 'quiz_choice',
                description: 'Vos choix détermineront votre alignement avec la Force',
                difficulty: 2,
                maxPoints: 250,
            },
            alien_survie: {
                id: 'alien_survie',
                name: 'Survivre au Nostromo',
                film: 'Alien (1979)',
                icon: '🛸',
                type: 'escape',
                description: 'Échappez au Xenomorphe en résolvant les énigmes du vaisseau',
                difficulty: 3,
                maxPoints: 400,
            },
            interstellar_morse: {
                id: 'interstellar_morse',
                name: 'Message du Tesseract',
                film: 'Interstellar (2014)',
                icon: '🕳️',
                type: 'decode',
                description: 'Décodez le message en morse envoyé depuis le Tesseract',
                difficulty: 3,
                maxPoints: 350,
            },
        },
    },

    // ⚔️ HEROIC FANTASY - Royaumes magiques et quêtes épiques
    royaumes_legendaires: {
        id: 'royaumes_legendaires',
        name: 'ROYAUMES LÉGENDAIRES',
        subtitle: 'Magie et aventures épiques',
        icon: '⚔️',
        image: '/images/universes/royaumes_legendaires.png',
        colors: {
            primary: '#ffd700',
            secondary: '#1a0f00',
            accent: '#ff6b35',
            glow: 'rgba(255, 215, 0, 0.5)',
        },
        background: 'linear-gradient(135deg, #1a0f00 0%, #2d1810 50%, #1a0f00 100%)',
        description: 'Entrez dans des mondes de magie et de légendes',
        activities: {
            lotr_enigmes: {
                id: 'lotr_enigmes',
                name: 'Les Énigmes de Gollum',
                film: 'Le Seigneur des Anneaux (Trilogie)',
                icon: '💍',
                type: 'riddles',
                description: 'Résolvez les énigmes comme Bilbon face à Gollum',
                difficulty: 2,
                maxPoints: 300,
            },
            got_trone: {
                id: 'got_trone',
                name: 'Le Jeu des Trônes',
                film: 'Game of Thrones (Série)',
                icon: '👑',
                type: 'quiz_choice',
                description: 'Faites les bons choix pour survivre à Westeros',
                difficulty: 3,
                maxPoints: 350,
            },
            hp_potions: {
                id: 'hp_potions',
                name: 'Cours de Potions',
                film: 'Harry Potter (Saga)',
                icon: '⚗️',
                type: 'combination',
                description: 'Préparez les potions demandées par le Professeur Rogue',
                difficulty: 2,
                maxPoints: 250,
            },
            hobbit_riddler: {
                id: 'hobbit_riddler',
                name: 'L\'Oracle de Smaug',
                film: 'Le Hobbit (Trilogie)',
                icon: '🐉',
                type: 'riddles',
                description: 'Affrontez le dragon en répondant à ses devinettes',
                difficulty: 2,
                maxPoints: 300,
            },
        },
    },

    // 🧟 HORREUR - Terreur et survie
    tenebres_eternelles: {
        id: 'tenebres_eternelles',
        name: 'TÉNÈBRES ÉTERNELLES',
        subtitle: 'Affrontez vos peurs',
        icon: '🧟',
        image: '/images/universes/tenebres_eternelles.png',
        colors: {
            primary: '#dc2626',
            secondary: '#0a0a0a',
            accent: '#7f1d1d',
            glow: 'rgba(220, 38, 38, 0.5)',
        },
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)',
        description: 'Survivez aux cauchemars les plus terrifiants',
        activities: {
            ring_vhs: {
                id: 'ring_vhs',
                name: 'La Cassette Maudite',
                film: 'The Ring (2002)',
                icon: '📼',
                type: 'puzzle',
                description: 'Reconstituez les images de la cassette maudite avant que le temps ne s\'écoule',
                difficulty: 3,
                maxPoints: 400,
            },
            saw_escape: {
                id: 'saw_escape',
                name: 'Le Jeu de Jigsaw',
                film: 'Saw (Saga)',
                icon: '🧩',
                type: 'escape',
                description: 'Résolvez les énigmes mortelles de Jigsaw pour survivre',
                difficulty: 4,
                maxPoints: 500,
            },
            it_peurs: {
                id: 'it_peurs',
                name: 'Face à Pennywise',
                film: 'It / Ça (2017)',
                icon: '🎈',
                type: 'courage',
                description: 'Affrontez vos peurs pour vaincre le clown démoniaque',
                difficulty: 3,
                maxPoints: 350,
            },
            shining_labyrinth: {
                id: 'shining_labyrinth',
                name: 'Le Labyrinthe Overlook',
                film: 'The Shining (1980)',
                icon: '🏨',
                type: 'maze',
                description: 'Trouvez la sortie du labyrinthe de l\'hôtel Overlook',
                difficulty: 3,
                maxPoints: 350,
            },
        },
    },

    // 🤖 ROBOTS & IA - Technologie et conscience artificielle
    mecanique_futur: {
        id: 'mecanique_futur',
        name: 'MÉCANIQUE DU FUTUR',
        subtitle: 'Homme vs Machine',
        icon: '🤖',
        image: '/images/universes/mecanique_futur.png',
        colors: {
            primary: '#00ff88',
            secondary: '#001a0d',
            accent: '#00cc6a',
            glow: 'rgba(0, 255, 136, 0.5)',
        },
        background: 'linear-gradient(135deg, #001a0d 0%, #0d1a14 50%, #001a0d 100%)',
        description: 'Explorez les frontières entre l\'homme et la machine',
        activities: {
            matrix_choix: {
                id: 'matrix_choix',
                name: 'Pilule Rouge ou Bleue',
                film: 'Matrix (Trilogie)',
                icon: '💊',
                type: 'quiz_choice',
                description: 'Vos choix révéleront si vous êtes prêt à voir la vérité',
                difficulty: 2,
                maxPoints: 300,
            },
            terminator_code: {
                id: 'terminator_code',
                name: 'Code Skynet',
                film: 'Terminator (Saga)',
                icon: '🔴',
                type: 'decode',
                description: 'Déchiffrez les codes binaires pour stopper Skynet',
                difficulty: 3,
                maxPoints: 350,
            },
            irobot_lois: {
                id: 'irobot_lois',
                name: 'Les Trois Lois',
                film: 'I, Robot (2004)',
                icon: '⚙️',
                type: 'logic',
                description: 'Résolvez les paradoxes des lois de la robotique',
                difficulty: 3,
                maxPoints: 350,
            },
            bladerunner_test: {
                id: 'bladerunner_test',
                name: 'Test Voight-Kampff',
                film: 'Blade Runner (1982)',
                icon: '👁️',
                type: 'detection',
                description: 'Identifiez les réplicants parmi les humains',
                difficulty: 4,
                maxPoints: 400,
            },
        },
    },

    // 🦕 AVENTURE PRÉHISTORIQUE - Créatures anciennes et survie
    eres_perdues: {
        id: 'eres_perdues',
        name: 'ÈRES PERDUES',
        subtitle: 'Quand les géants régnaient',
        icon: '🦕',
        image: '/images/universes/eres_perdues.png',
        colors: {
            primary: '#22c55e',
            secondary: '#0a1a0a',
            accent: '#84cc16',
            glow: 'rgba(34, 197, 94, 0.5)',
        },
        background: 'linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 50%, #0a1a0a 100%)',
        description: 'Voyagez dans des ères où l\'homme n\'existait pas',
        activities: {
            jurassic_adn: {
                id: 'jurassic_adn',
                name: 'Séquençage ADN',
                film: 'Jurassic Park (Saga)',
                icon: '🧬',
                type: 'sequence',
                description: 'Complétez les séquences ADN pour recréer les dinosaures',
                difficulty: 2,
                maxPoints: 300,
            },
            kong_survie: {
                id: 'kong_survie',
                name: 'Île du Crâne',
                film: 'King Kong (2005)',
                icon: '🦍',
                type: 'survival',
                description: 'Survivez aux dangers de Skull Island',
                difficulty: 3,
                maxPoints: 350,
            },
            planete_singes: {
                id: 'planete_singes',
                name: 'Communication Primitive',
                film: 'La Planète des Singes (Saga)',
                icon: '🐵',
                type: 'language',
                description: 'Apprenez à communiquer avec les singes évolués',
                difficulty: 2,
                maxPoints: 250,
            },
            prehistoric_hunt: {
                id: 'prehistoric_hunt',
                name: 'La Chasse Primitive',
                film: '10 000 BC (2008)',
                icon: '🏹',
                type: 'timing',
                description: 'Chassez le mammouth au bon moment',
                difficulty: 2,
                maxPoints: 300,
            },
        },
    },

    // 🎭 RÉALITÉS ALTÉRÉES - Dimensions et temps
    realites_alterees: {
        id: 'realites_alterees',
        name: 'RÉALITÉS ALTÉRÉES',
        subtitle: 'Au-delà du temps et de l\'espace',
        icon: '🎭',
        image: '/images/universes/realites_alterees.png',
        colors: {
            primary: '#a855f7',
            secondary: '#0f0a1a',
            accent: '#ec4899',
            glow: 'rgba(168, 85, 247, 0.5)',
        },
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 50%, #0f0a1a 100%)',
        description: 'Où les règles de la réalité n\'ont plus cours',
        activities: {
            inception_reves: {
                id: 'inception_reves',
                name: 'Niveaux de Rêve',
                film: 'Inception (2010)',
                icon: '💭',
                type: 'layers',
                description: 'Naviguez entre les différents niveaux du rêve',
                difficulty: 4,
                maxPoints: 450,
            },
            bttf_timeline: {
                id: 'bttf_timeline',
                name: 'Paradoxe Temporel',
                film: 'Retour vers le Futur (Trilogie)',
                icon: '⚡',
                type: 'timeline',
                description: 'Remettez les événements dans le bon ordre chronologique',
                difficulty: 3,
                maxPoints: 350,
            },
            tenet_inversion: {
                id: 'tenet_inversion',
                name: 'Inversion Temporelle',
                film: 'Tenet (2020)',
                icon: '🔄',
                type: 'reverse',
                description: 'Complétez les séquences dans l\'ordre inversé',
                difficulty: 4,
                maxPoints: 450,
            },
            strange_dimensions: {
                id: 'strange_dimensions',
                name: 'Puzzle Dimensionnel',
                film: 'Doctor Strange (2016)',
                icon: '✨',
                type: 'spatial',
                description: 'Manipulez l\'espace pour résoudre les puzzles',
                difficulty: 3,
                maxPoints: 400,
            },
        },
    },
};

// Ordre d'affichage par défaut des univers
export const UNIVERSE_ORDER = [
    'odyssee_spatiale',
    'royaumes_legendaires',
    'tenebres_eternelles',
    'mecanique_futur',
    'eres_perdues',
    'realites_alterees',
];

// Types d'activités disponibles
export const ACTIVITY_TYPES = {
    sequence: 'Séquence à reproduire',
    quiz_choice: 'Quiz à choix multiples',
    escape: 'Escape Game',
    decode: 'Décodage',
    riddles: 'Énigmes et devinettes',
    combination: 'Combinaisons',
    puzzle: 'Puzzle',
    courage: 'Épreuve de courage',
    maze: 'Labyrinthe',
    logic: 'Logique',
    detection: 'Détection',
    survival: 'Survie',
    language: 'Communication',
    timing: 'Timing',
    layers: 'Niveaux multiples',
    timeline: 'Chronologie',
    reverse: 'Séquence inversée',
    spatial: 'Puzzle spatial',
};

// Helper pour obtenir toutes les activités d'un univers
export function getUniverseActivities(universeId) {
    const universe = UNIVERSES[universeId];
    if (!universe) return [];
    return Object.values(universe.activities);
}

// Helper pour obtenir une activité spécifique
export function getActivity(universeId, activityId) {
    const universe = UNIVERSES[universeId];
    if (!universe) return null;
    return universe.activities[activityId] || null;
}

// Helper pour compter le total d'activités
export function getTotalActivitiesCount() {
    return Object.values(UNIVERSES).reduce((total, universe) => {
        return total + Object.keys(universe.activities).length;
    }, 0);
}
