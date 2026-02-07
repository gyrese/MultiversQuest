# 🎮 MULTIVERSE QUEST (MULTIVERSE GLITCH)

## 📋 Résumé Exécutif

**MultiversQuest** est une application web de type **chasse au trésor immersive** destinée à être jouée en équipe. Le concept repose sur l'exploration de **6 univers thématiques** (inspirés de films cultes) contenant chacun **4 mini-jeux/activités** à compléter pour collecter des **fragments dimensionnels** et stabiliser le "multivers".

---

## 🛠️ Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 19.2.0 | Framework UI principal |
| **Vite** | 7.2.4 | Build tool et dev server |
| **Tailwind CSS** | 4.1.18 | Styling utilitaire |
| **Framer Motion** | 12.29.2 | Animations et transitions |
| **Web Audio API** | Native | Génération de sons (notes musicales) |

---

## 🏗️ Architecture des Fichiers

```
MultiversQuest/
├── public/
│   └── backgrounds/
│       └── rencontre3etype.png      # Image de fond IA générée
├── src/
│   ├── activities/                   # Mini-jeux individuels
│   │   ├── index.js
│   │   └── Rencontre3eType.jsx       # ✅ SEUL MINI-JEU IMPLÉMENTÉ
│   ├── assets/
│   ├── components/                   # Composants UI réutilisables
│   │   ├── Hub.jsx                   # Hub central de navigation
│   │   ├── LandingPage.jsx           # Page d'accueil/initialisation
│   │   ├── PortalCard.jsx            # (Non utilisé actuellement)
│   │   ├── UniverseCard.jsx          # Carte univers avec liste d'activités
│   │   └── index.js
│   ├── context/
│   │   └── GameContext.jsx           # État global du jeu (React Context + Reducer)
│   ├── data/
│   │   └── universes.js              # Configuration complète des 6 univers et 24 activités
│   ├── universes/                    # (Template pour futurs composants univers)
│   │   ├── index.js
│   │   └── UniverseTemplate.jsx
│   ├── App.jsx                       # Routeur principal + transitions de pages
│   ├── index.css                     # Styles globaux + effets "glitch"
│   └── main.jsx                      # Point d'entrée React
├── index.html
├── package.json
└── vite.config.js
```

---

## 🎨 Design System

### Thème Visuel
- **Style principal** : Esthétique **cyberpunk/glitch** sombre
- **Couleurs de base** :
  - `--color-void: #0a0a0f` (fond principal noir bleuté)
  - `--color-glitch-cyan: #00ffff` (accent principal)
  - `--color-glitch-magenta: #ff00ff` (accent secondaire)
  - `--color-glitch-green: #00ff41`

### Polices
- **Titres** : `Orbitron` (futuriste)
- **Corps / Code** : `JetBrains Mono` (monospace)

### Effets Spéciaux CSS
- **Scanlines** : Effet de lignes horizontales (style écran CRT)
- **Glitch text** : Animation de texte avec décalage RGB
- **Flicker** : Scintillement subtil
- **Portal glow** : Animation de pulse lumineux sur les cartes

---

## 📊 Structure des Données (universes.js)

### 6 Univers Thématiques

| ID | Nom | Icône | Couleur Primaire | Nb Activités |
|----|-----|-------|------------------|--------------|
| `odyssee_spatiale` | ODYSSÉE SPATIALE | 🚀 | `#00d4ff` (cyan) | 4 |
| `royaumes_legendaires` | ROYAUMES LÉGENDAIRES | ⚔️ | `#ffd700` (or) | 4 |
| `tenebres_eternelles` | TÉNÈBRES ÉTERNELLES | 🧟 | `#dc2626` (rouge) | 4 |
| `mecanique_futur` | MÉCANIQUE DU FUTUR | 🤖 | `#00ff88` (vert) | 4 |
| `eres_perdues` | ÈRES PERDUES | 🦕 | `#22c55e` (vert nature) | 4 |
| `realites_alterees` | RÉALITÉS ALTÉRÉES | 🎭 | `#a855f7` (violet) | 4 |

### 24 Activités (4 par univers)

Chaque activité possède :
- `id`, `name`, `film` (référence au film)
- `icon` (emoji)
- `type` (sequence, quiz_choice, escape, decode, riddles, puzzle, etc.)
- `description`, `difficulty` (1-4), `maxPoints`

#### Univers 1 : ODYSSÉE SPATIALE 🚀
| Activité | Film | Type | Points Max |
|----------|------|------|------------|
| 👽 Rencontre du 3ᵉ Type | Rencontre du 3ᵉ Type (1977) | sequence | 300 |
| ⚔️ L'Appel de la Force | Star Wars (Saga) | quiz_choice | 250 |
| 🛸 Survivre au Nostromo | Alien (1979) | escape | 400 |
| 🕳️ Message du Tesseract | Interstellar (2014) | decode | 350 |

#### Univers 2 : ROYAUMES LÉGENDAIRES ⚔️
| Activité | Film | Type | Points Max |
|----------|------|------|------------|
| 💍 Les Énigmes de Gollum | Le Seigneur des Anneaux | riddles | 300 |
| 👑 Le Jeu des Trônes | Game of Thrones | quiz_choice | 350 |
| ⚗️ Cours de Potions | Harry Potter | combination | 250 |
| 🐉 L'Oracle de Smaug | Le Hobbit | riddles | 300 |

#### Univers 3 : TÉNÈBRES ÉTERNELLES 🧟
| Activité | Film | Type | Points Max |
|----------|------|------|------------|
| 📼 La Cassette Maudite | The Ring (2002) | puzzle | 400 |
| 🧩 Le Jeu de Jigsaw | Saw (Saga) | escape | 500 |
| 🎈 Face à Pennywise | It / Ça (2017) | courage | 350 |
| 🏨 Le Labyrinthe Overlook | The Shining (1980) | maze | 350 |

#### Univers 4 : MÉCANIQUE DU FUTUR 🤖
| Activité | Film | Type | Points Max |
|----------|------|------|------------|
| 💊 Pilule Rouge ou Bleue | Matrix (Trilogie) | quiz_choice | 300 |
| 🔴 Code Skynet | Terminator (Saga) | decode | 350 |
| ⚙️ Les Trois Lois | I, Robot (2004) | logic | 350 |
| 👁️ Test Voight-Kampff | Blade Runner (1982) | detection | 400 |

#### Univers 5 : ÈRES PERDUES 🦕
| Activité | Film | Type | Points Max |
|----------|------|------|------------|
| 🧬 Séquençage ADN | Jurassic Park (Saga) | sequence | 300 |
| 🦍 Île du Crâne | King Kong (2005) | survival | 350 |
| 🐵 Communication Primitive | La Planète des Singes | language | 250 |
| 🏹 La Chasse Primitive | 10 000 BC (2008) | timing | 300 |

#### Univers 6 : RÉALITÉS ALTÉRÉES 🎭
| Activité | Film | Type | Points Max |
|----------|------|------|------------|
| 💭 Niveaux de Rêve | Inception (2010) | layers | 450 |
| ⚡ Paradoxe Temporel | Retour vers le Futur | timeline | 350 |
| 🔄 Inversion Temporelle | Tenet (2020) | reverse | 450 |
| ✨ Puzzle Dimensionnel | Doctor Strange (2016) | spatial | 400 |

---

## 🧠 GameContext - Gestion d'État

### État Global (`state`)
```javascript
{
  teamName: '',              // Nom de l'équipe
  isInitialized: false,      // Jeu démarré
  points: 0,                 // Score total
  fragments: 0,              // Fragments collectés (1 par univers complété)
  totalFragments: 6,         // Nombre total de fragments à collecter
  universes: {               // État de chaque univers
    [universeId]: {
      status: 'locked' | 'unlocked' | 'in_progress' | 'completed',
      points: 0,
      completedActivities: 0,
      activities: {
        [activityId]: {
          status: 'locked' | 'unlocked' | 'completed',
          points: 0,
          bestScore: 0
        }
      }
    }
  },
  inventory: [],             // Objets collectés
  currentUniverse: null,
  currentActivity: null
}
```

### Actions Disponibles
| Action | Description |
|--------|-------------|
| `initializeTeam(teamName)` | Démarrer le jeu avec le nom d'équipe |
| `unlockUniverse(universeId)` | Débloquer un univers |
| `startUniverse(universeId)` | Commencer un univers |
| `completeUniverse(universeId, points)` | Marquer un univers comme complété |
| `unlockActivity(universeId, activityId)` | Débloquer une activité |
| `startActivity(universeId, activityId)` | Démarrer une activité |
| `completeActivity(universeId, activityId, points)` | Compléter une activité avec un score |
| `addPoints(points)` | Ajouter des points |
| `collectFragment()` | Collecter un fragment dimensionnel |
| `addToInventory(item)` | Ajouter un objet à l'inventaire |
| `resetGame()` | Réinitialiser la partie |

### Helpers Disponibles
| Helper | Description |
|--------|-------------|
| `getUniverseStatus(universeId)` | Retourne le statut d'un univers |
| `getActivityStatus(universeId, activityId)` | Retourne le statut d'une activité |
| `isUniverseAccessible(universeId)` | Vérifie si un univers est accessible |
| `isActivityAccessible(universeId, activityId)` | Vérifie si une activité est accessible |
| `getCompletedCount()` | Nombre d'univers complétés |
| `getUniverseProgress(universeId)` | Progression d'un univers (completed, total, percentage) |

### Persistance
- **Sauvegarde automatique** dans `localStorage` (clé: `multiversquest_state`)
- Chargement automatique au démarrage

---

## 🖥️ Flux de Navigation (App.jsx)

```
┌─────────────────┐
│  LandingPage    │  ← Saisie du nom d'équipe
│  (Initialisation)│     Style "terminal cyberpunk"
└────────┬────────┘
         │ handleEnterHub()
         ▼
┌─────────────────┐
│      Hub        │  ← Liste des 6 univers (cartes dépliables)
│   (Le Nexus)    │     Affichage des points, fragments, inventaire
└────────┬────────┘
         │ handleStartActivity(universeId, activityId)
         ▼
┌─────────────────┐
│    Activity     │  ← Mini-jeu en cours
│ (Lazy loaded)   │     Retour au Hub après completion
└─────────────────┘
```

**Transitions** : Animations fluides avec Framer Motion (fade + scale + blur)

---

## 🎵 Mini-Jeu Implémenté : Rencontre du 3ᵉ Type

### Concept
Reproduire la célèbre séquence de 5 notes du film pour communiquer avec les extraterrestres.

### Gameplay
1. **Phase Intro** : Présentation narrative avec vaisseau animé
2. **Phase Play** : 
   - Grille 4x4 de 16 boutons musicaux
   - Chaque bouton produit une note différente (Web Audio API, oscillateur triangle)
   - Le joueur doit trouver et reproduire : **Sol – La – Fa – Fa(grave) – Do**
   - Bouton d'aide : Joue les 3 premières notes (sans pénalité)
3. **Phase Success** : Célébration avec animation + affichage du score

### Configuration des Notes
```javascript
// Grille 4x4 (16 notes de C3 à D5)
const GRID_NOTES = [
  // Ligne 1 : C3, D3, E3, F3 (Fa grave)
  // Ligne 2 : G3, A3, B3, C4 (Do)
  // Ligne 3 : D4, E4, F4 (Fa), G4 (Sol)
  // Ligne 4 : A4 (La), B4, C5, D5
];

// Séquence à reproduire
const ORIGINAL_SEQUENCE = ['G4', 'A4', 'F4', 'F3', 'C4'];
```

### Système de Score
- **Base** : 300 points
- **Bonus rapidité** :
  | Clics | Bonus |
  |-------|-------|
  | ≤10 | +100 pts |
  | ≤15 | +50 pts |
  | ≤20 | +25 pts |
  | >20 | 0 pts |

### Gestion des Erreurs
- **Pas d'écran d'échec** : Reset silencieux de la séquence
- **Exception** : Si la mauvaise note EST la première note de la séquence → on recommence avec cette note

### Éléments Visuels
- Image de fond IA générée (`/backgrounds/rencontre3etype.png`)
- 80 étoiles animées avec scintillement aléatoire
- 3 étoiles filantes avec délais aléatoires
- 4 UFOs traversant l'écran à différentes vitesses
- Planète violette et lune en arrière-plan
- Overlay gradient pour la lisibilité

---

## 🎨 Composants UI Clés

### LandingPage.jsx
- Design "terminal" avec pseudo-messages système animés
- Formulaire de saisie du nom d'équipe (max 25 caractères)
- Particules flottantes en arrière-plan
- Bouton "INITIALISER SYSTÈME" avec effet glitch au hover

### Hub.jsx
- **Header** : 
  - Avatar d'équipe (première lettre + gradient)
  - Compteur de points
  - Compteur de fragments (💎 x/6)
  - Bouton inventaire (🎒)
- **Corps** : Liste verticale de 6 `UniverseCard`
- **Message contextuel** : Adapté selon la progression
- **Contrôles de démo** : +100pts, Unlock Univers, Complete Activité, Reset

### UniverseCard.jsx
- Carte dépliable avec gradient de couleur thématique
- Icône animée avec glow pulsant
- Barre de progression des activités
- Badge de complétion (✓ vert) si terminé
- **État déplié** : Liste des 4 activités avec :
  - Icône de l'activité (ou 🔒 si verrouillée)
  - Nom et film de référence
  - Difficulté (★★★★★)
  - Points max ou meilleur score
  - Bouton play animé (▶)

### Modal Inventaire
- Grille des 6 fragments (collectés = 💎, non collectés = icône univers)
- Liste des objets collectés (vide par défaut)

---

## 🚧 État d'Avancement

### ✅ Complété
- [x] Infrastructure React + Vite + Tailwind
- [x] Design system cyberpunk complet (CSS + animations)
- [x] GameContext avec persistance localStorage
- [x] Landing page fonctionnelle
- [x] Hub de navigation avec 6 univers
- [x] Système de cartes dépliables avec activités
- [x] Modal inventaire
- [x] **1 mini-jeu complet** : Rencontre du 3ᵉ Type (avec audio)

### ⏳ À Implémenter (23 mini-jeux restants)

| Type | Description | Jeux concernés |
|------|-------------|----------------|
| `sequence` | Reproduire une séquence | Séquençage ADN |
| `quiz_choice` | Quiz narratif à choix | Star Wars, Matrix, GoT |
| `escape` | Énigmes à résoudre | Alien, Saw |
| `decode` | Déchiffrer des codes | Morse Interstellar, Binaire Skynet |
| `riddles` | Devinettes | Gollum, Smaug |
| `combination` | Combiner des éléments | Potions Harry Potter |
| `puzzle` | Reconstituer une image | The Ring VHS |
| `courage` | Épreuve interactive | Pennywise |
| `maze` | Labyrinthe | The Shining |
| `logic` | Paradoxes logiques | I, Robot |
| `detection` | Trouver des intrus | Blade Runner |
| `survival` | Survie à obstacles | King Kong |
| `language` | Communication | Planète des Singes |
| `timing` | Actions au bon moment | 10 000 BC |
| `layers` | Navigation multi-niveaux | Inception |
| `timeline` | Chronologie | Retour vers le Futur |
| `reverse` | Actions inversées | Tenet |
| `spatial` | Puzzle 3D/spatial | Doctor Strange |

---

## 🔧 Instructions pour Continuer

### Lancer le Projet
```bash
cd c:\ai\MultiversQuest
npm install   # Si pas fait
npm run dev   # Démarre sur http://localhost:5173
```

### Ajouter un Nouveau Mini-Jeu

1. **Créer le composant** `/src/activities/NouveauJeu.jsx` :
```jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { UNIVERSES } from '../data/universes';

export default function NouveauJeu({ universeId, onComplete, onExit }) {
  const { actions } = useGame();
  const [phase, setPhase] = useState('intro'); // intro, play, success
  const [score, setScore] = useState(0);
  
  const activityConfig = UNIVERSES[universeId]?.activities?.activity_id;
  const basePoints = activityConfig?.maxPoints || 300;
  
  const handleComplete = () => {
    actions.completeActivity(universeId, 'activity_id', score);
    onComplete(score);
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header avec bouton retour */}
      <header className="p-4">
        <button onClick={onExit}>← Retour</button>
      </header>
      
      {/* Contenu selon la phase */}
      {phase === 'intro' && (/* ... */)}
      {phase === 'play' && (/* ... */)}
      {phase === 'success' && (
        <button onClick={handleComplete}>Continuer</button>
      )}
    </div>
  );
}
```

2. **Exporter** dans `/src/activities/index.js` :
```javascript
export { default as NouveauJeu } from './NouveauJeu';
```

3. **Enregistrer** dans `/src/App.jsx` :
```javascript
// Lazy load
const NouveauJeu = lazy(() => import('./activities/NouveauJeu'));

// Ajouter au map
const ACTIVITY_MAP = {
  'rencontre_3e_type': Rencontre3eType,
  'activity_id': NouveauJeu,  // ← ID doit correspondre à universes.js
};
```

---

## 📝 Notes Importantes

1. **Contrôles de démo** : Les boutons dans le Hub sont pour le développement → à supprimer en production

2. **Déblocage simulé** : Actuellement, cliquer sur un univers verrouillé le débloque instantanément. En production, cela devrait être lié à un scan QR code ou action physique.

3. **Audio** : L'AudioContext est initialisé au premier clic utilisateur (contrainte navigateur pour autoplay)

4. **Responsive** : Interface optimisée mobile avec `max-w-lg mx-auto` comme conteneur principal

5. **Lazy Loading** : Les activités sont chargées à la demande pour optimiser les performances

6. **Persistance** : L'état complet est sauvegardé dans localStorage. Un reset complet nécessite d'utiliser le bouton "Reset" ou de vider le localStorage.

---

## 🎯 Objectif Final du Jeu

Les joueurs doivent :
1. Explorer les 6 univers thématiques
2. Compléter les 24 activités (mini-jeux)
3. Collecter les 6 fragments dimensionnels (1 par univers complété)
4. Stabiliser le multivers pour gagner

**Score maximum théorique** : ~8000 points (somme de tous les maxPoints + bonus)

---

*Dernière mise à jour : 7 février 2026*
