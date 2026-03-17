# AGENT.md — Contexte Projet MultiversQuest

> Colle ce fichier en contexte système d'une IA (Claude, GPT, Gemini...) pour obtenir de l'aide sur le projet.

---

## C'est quoi ?

**MultiversQuest** est une application de jeu en soirée (escape-game / quiz / mini-jeux) jouée en équipes sur mobile, projetée sur grand écran (WarRoom). Un Game Master (GM) anime la soirée depuis une interface admin. Les équipes scannent un QR code pour rejoindre.

**Inspiration :** Kahoot + Jackbox + Escape Game + Soirée thématique

---

## Stack Technique

| Côté | Tech |
|------|------|
| Frontend | React 18 + Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js + Express (v5) + Socket.IO |
| Persistance | Fichiers JSON (`server/game_state.json`) |
| Déploiement | Local / LAN (soirée = réseau local) |
| Mobile | PWA-like, optimisé tactile, pas d'app store |

```
Port 5173/5174 → Vite dev / dist
Port 3000      → Express + Socket.IO
```

---

## Architecture des Écrans

### Côté Joueur (`/nexus`)
```
CONNECTING → loader socket
LOGIN      → saisie nom d'équipe, génération avatar IA
LOBBY      → salon d'attente (status === 'LOBBY')
HUB        → carte des univers, choix d'activités
ACTIVITY   → mini-jeu en cours
EJECTED    → nouvelle soirée détectée → proposer rejoin
```

### Côté Admin (`/admin`)
```
AdminLanding     → config session "Open Games" (jeu libre)
SessionNightManager → config session "Story Mode" (univers enchaînés)
AdminPanel       → tableau de bord en jeu (scores, contrôles, effets)
```

### Côté WarRoom (`/warroom`)
```
Projection grand écran. Thème visuel change selon l'univers actif.
Reçoit des événements socket pour :
- Afficher les scores en direct
- Lancer une vidéo plein écran (warroom:video)
- Effets glitch / alerte rouge
- Timer de l'univers
```

---

## Déroulement d'une Soirée (Story Mode)

### Vue d'ensemble
```
[GM] Configure la session (univers, durées, vidéos)
       ↓
[GM] INITIALISER LA SESSION  → status: LOBBY  (joueurs scannent le QR)
       ↓
[JOUEURS] Rejoignent le salon d'attente (GameLobby)
       ↓
[GM] LANCER L'INTRO  → status: PLAYING / sessionNight: INTRO
       ↓ (vidéo d'intro joue sur la WarRoom automatiquement)
[GM] Passer au QG  → sessionNight: HEADQUARTERS
       ↓ (thème WarRoom = défaut, débrief, storytelling)
[GM] DÉCOLLAGE : [Univers X]  → sessionNight: UNIVERSE_ACTIVE
       ↓ (thème WarRoom change, timer démarre, joueurs voient les activités)
       ↓ (timer expire automatiquement OU [GM] FORCER LE QUIZ)
[GM] → sessionNight: QUIZ_ACTIVE
       ↓ (quiz visible et jouable par les équipes)
[GM] CLÔTURER LE QUIZ  → sessionNight: UNIVERSE_COMPLETE
       ↓ (podium univers affiché, scores consolidés)
       ↓
  Si univers restants:
[GM] UNIVERS SUIVANT  → sessionNight: HEADQUARTERS  (boucle)
  Si dernier univers:
[GM] TERMINER LA SESSION  → sessionNight: SESSION_COMPLETE / status: ENDED
       ↓
[WarRoom] Podium final
```

### Machine à états `sessionNight.status`

| Statut | Description | Actions autorisées |
|--------|-------------|-------------------|
| `DRAFT` | Session créée, pas encore lancée | `SESSION_LAUNCH` |
| `INTRO` | Vidéo d'intro en cours sur WarRoom | `SESSION_OPEN_HEADQUARTERS` (skip) |
| `HEADQUARTERS` | QG inter-univers — débrief, storytelling | `SESSION_OPEN_UNIVERSE` |
| `UNIVERSE_ACTIVE` | Activités ouvertes, timer actif | `SESSION_FORCE_END_UNIVERSE`, `SESSION_TRIGGER_HAPPENING` |
| `QUIZ_ACTIVE` | Quiz de l'univers ouvert aux équipes | `SESSION_CLOSE_QUIZ` |
| `UNIVERSE_COMPLETE` | Podium univers, en attente du GM | `SESSION_NEXT_UNIVERSE`, `SESSION_OPEN_HEADQUARTERS`, `SESSION_END` |
| `SESSION_COMPLETE` | Soirée terminée, podium final | — (NEW_SESSION pour recommencer) |

### Mapping `gameState.status` ↔ `sessionNight.status`
```
gameState.status = 'LOBBY'   → sessionNight null ou DRAFT (joueurs dans le salon)
gameState.status = 'PLAYING' → sessionNight INTRO, HEADQUARTERS, UNIVERSE_ACTIVE, QUIZ_ACTIVE, UNIVERSE_COMPLETE
gameState.status = 'ENDED'   → sessionNight SESSION_COMPLETE
```

### Effets automatiques lors des transitions
| Transition | Effets automatiques serveur |
|-----------|----------------------------|
| `DRAFT → INTRO` | `warroom:video` avec `introVideoUrl` si défini |
| `HEADQUARTERS → UNIVERSE_ACTIVE` | `warroom:theme` avec l'ID de l'univers + `warroom:video` avec `universe.videoUrl` si défini |
| `UNIVERSE_ACTIVE → QUIZ_ACTIVE` | Alert `sessionNight:alert` "LE QUIZ EST OUVERT !" |
| `UNIVERSE_COMPLETE/INTRO → HEADQUARTERS` | `warroom:theme` = 'default' |
| `→ SESSION_COMPLETE` | `sessionNight:complete` émis avec podium final |

---

## Modèle de Données Serveur

```js
// gameState (in-memory + sauvegardé dans game_state.json)
{
  status: 'LOBBY' | 'PLAYING' | 'PAUSED' | 'ENDED',
  teams: {
    [teamId]: {
      id, name, score, connected,
      completedActivities: { [universeId]: [activityId, ...] },
      token  // auth simple
    }
  },
  sessionNight: null | {
    id,
    status,            // voir machine à états ci-dessus
    introVideoUrl,     // vidéo globale (début de soirée)
    universes: [{
      universeId,
      selectedChallengeIds,   // activités sélectionnées par le GM
      quizActivityId,
      durationSeconds,
      videoUrl                // vidéo d'intro de l'univers (optionnel)
    }],
    currentUniverseIndex,
    universeEndsAt,      // timestamp absolu pour boot recovery
    happeningEndsAt,     // timestamp absolu — x2 multiplier
    tickRemainingSeconds,
    happeningActive,
    perTeam: {},
    universeWinners: [],
    coop: { requiredTalismans, foundTalismans, isSuccess }
  },
  config: { pointsMultiplier: 1 | 2 },
  history: [...],
  themeUniverse: 'default' | <universeId>
}
```

---

## Univers de Jeu (9 univers)

| ID | Nom | Thème |
|----|-----|-------|
| `odyssee_spatiale` | Odyssée Spatiale | SF / Espace (Alien, Interstellar, Star Wars...) |
| `royaumes_legendaires` | Royaumes Légendaires | Fantasy (HP, GOT, Hobbit...) |
| `tenebres_eternelles` | Ténèbres Éternelles | Horreur (Ring, Saw, It, Shining...) |
| `mecanique_futur` | Mécanique du Futur | Robots / IA (Matrix, Terminator, I, Robot...) |
| `eres_perdues` | Ères Perdues | Préhistoire / Dinosaures (Jurassic, Kong...) |
| `realites_alterees` | Réalités Altérées | Dimensions / Temps (Inception, Tenet, BTTF...) |
| `club_dorothee` | Club Dorothée | Animés 90s (DBZ, Sailor Moon, Nicky Larson...) |
| `animation_world` | Animation World | Dessins animés (Toy Story, Shrek, Chihiro...) |
| `terres_devastees` | Terres Dévastées | Post-apocalyptique (Fallout, Mad Max...) |

Chaque univers a : `name`, `icon`, `color`, `activities{}`, `happening{}`, `videoUrl`

---

## Activités Existantes (36 fichiers)

```
src/activities/
  RoverRadar.jsx        → Sonar GPS (localiser un rover sur Mars) ~3min
  Rencontre3eType.jsx   → Séquence musicale ET (Close Encounters)
  JurassicHack.jsx      → Terminal hacking thème Jurassic Park
  SceauRunique.jsx      → Puzzle runes (Harry Potter / fantasy)
  TenetInversion.jsx    → Puzzle d'inversion temporelle
  KesselRun.jsx         → Course spatiale (Star Wars)
  FalloutTerminal.jsx   → Terminal Fallout (déchiffrage)
  AlienSurvie.jsx       → Survie dans le vaisseau (Alien)
  InterstellarMorse.jsx → Code morse (Interstellar)
  GravitySlingshot.jsx  → Orbite gravitationnelle
  CoursPotions.jsx      → Recettes potions (HP)
  OracleSmaug.jsx       → Devinettes de Smaug (Hobbit)
  MatrixChoix.jsx       → Pilule rouge/bleue (Matrix QCM)
  SkynetCode.jsx        → Debug code (Terminator)
  ThreeLaws.jsx         → Lois d'Asimov (I, Robot)
  VoightKampff.jsx      → Test Voight-Kampff (Blade Runner)
  GotTrone.jsx          → Arbre généalogique (GOT)
  TimelineParadox.jsx   → Paradoxes temporels (BTTF)
  RingVHS.jsx           → Cassette maudite (The Ring)
  SawEscape.jsx         → Escape trap (Saw)
  PennywiseRunner.jsx   → Fuir Pennywise (It)
  OverlookMaze.jsx      → Labyrinthe (The Shining)
  SkullIsland.jsx       → Survie jungle (Kong)
  PrimalCommunication.jsx → Communication préhistorique
  PrimalHunt.jsx        → Chasse préhistorique
  Kamehameha.jsx        → QTE kamehameha (DBZ)
  NickyLarson.jsx       → Tir précis (City Hunter)
  SailorMoon.jsx        → Transformation (Sailor Moon)
  ToyStoryAndy.jsx      → Ranger les jouets (Toy Story)
  ShrekSwamp.jsx        → Défense du marécage (Shrek)
  ChihiroBath.jsx       → Service au bain (Chihiro)
  LionKingLyrics.jsx    → Paroles du Roi Lion
  GenericQuiz.jsx       → Quiz générique (utilisé pour tous les quiz)
  CommsTower.jsx        → Tour de communications (à finir)
  PortailAlien.jsx      → Portail alien (à finir)
```

---

## Comment Créer une Activité

### 1. Structure minimale

```jsx
// src/activities/MonActivite.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ActivityShell from '../components/activity/ActivityShell';
import { useActivityScore } from '../hooks/useActivityScore';

export default function MonActivite({ universeId, onComplete, onExit }) {
  const { isPlaying, isCompleted, score, startActivity, recordAction, finalizeActivity } =
    useActivityScore(universeId, 'mon_activite_id', {
      maxPoints: 1000,
      activityType: 'standard', // 'standard' | 'sequence' | 'quiz' | 'time-attack'
      onComplete,
    });

  return (
    <ActivityShell
      title="Mon Activité"
      subtitle="Description courte"
      universeColor="#00d4ff"
      onExit={onExit}
      isCompleted={isCompleted}
      score={score}
    >
      {/* Ton contenu ici */}
    </ActivityShell>
  );
}
```

### 2. Hook `useActivityScore` — ce qu'il gère automatiquement
- Timer de début/fin
- Calcul de score selon `activityType`
- `submitScore` vers le serveur (Socket.IO)
- Sauvegarde locale dans PlayerContext

### 3. Types de scoring
| Type | Comportement |
|------|-------------|
| `standard` | Score max - pénalités erreurs |
| `time-attack` | Bonus de rapidité (< 30s = max) |
| `sequence` | Pénalité par erreur de séquence |
| `quiz` | Score brut passé en customBonus |

### 4. `ActivityShell` — props importantes
```jsx
<ActivityShell
  title="Titre"
  subtitle="Sous-titre"
  universeColor="#hexcolor"
  onExit={fn}           // Bouton retour
  isCompleted={bool}    // Affiche écran de fin
  score={number}        // Score final
  bonus={number}        // Bonus affiché séparément
  background={<JSX/>}   // Fond animé optionnel
  successContent={<JSX/>} // Overlay succès custom
>
  {/* Contenu du jeu */}
</ActivityShell>
```

### 5. Enregistrer dans le projet
```js
// 1. src/PlayerApp.jsx — ajouter le lazy import
const MonActivite = lazy(() => import('./activities/MonActivite.jsx'));

// 2. src/PlayerApp.jsx — ajouter dans ACTIVITY_MAP
'mon_activite_id': MonActivite,

// 3. src/data/universes.js — ajouter dans l'univers cible
activities: {
  mon_activite_id: {
    id: 'mon_activite_id',
    name: 'Mon Activité',
    type: 'challenge', // ou 'quiz'
    points: 1000,
    duration: '5-7 min',
    difficulty: 2, // 1-3
    description: '...',
    icon: '🚀',
  }
}
```

---

## Events Socket.IO (principaux)

### Serveur → Clients
```
game:fullState        → état complet du jeu
teams:update          → liste équipes mise à jour
score:update          → score d'une équipe
sessionNight:state    → état de la session night
sessionNight:tick     → tick timer (secondes restantes)
game:status           → changement de statut
team:ejected          → équipe éjectée (nouvelle session)
warroom:video         → lancer une vidéo sur la WarRoom
warroom:theme         → changer le thème visuel
```

### Client → Serveur
```
identify              → { type: 'TEAM'|'ADMIN'|'WARROOM', teamId? }
admin:action          → { type: '...', payload: {} }
player:sync           → { teamId, state } — sauvegarde cloud
team:logout           → déconnexion volontaire
```

### Actions Admin (admin:action) — Story Mode

| Action | État requis | Effet |
|--------|-------------|-------|
| `SESSION_CREATE` | n'importe | Reset + crée sessionNight (DRAFT) + gameState=LOBBY |
| `SESSION_LAUNCH` | DRAFT | sessionNight=INTRO, gameState=PLAYING, vidéo intro → WarRoom |
| `SESSION_OPEN_HEADQUARTERS` | INTRO ou UNIVERSE_COMPLETE | sessionNight=HEADQUARTERS, thème default → WarRoom |
| `SESSION_OPEN_UNIVERSE` | HEADQUARTERS ou UNIVERSE_COMPLETE | sessionNight=UNIVERSE_ACTIVE, timer start, thème+vidéo → WarRoom |
| `SESSION_FORCE_END_UNIVERSE` | UNIVERSE_ACTIVE | sessionNight=QUIZ_ACTIVE, timer stop |
| `SESSION_CLOSE_QUIZ` | QUIZ_ACTIVE | sessionNight=UNIVERSE_COMPLETE, podium émis |
| `SESSION_NEXT_UNIVERSE` | UNIVERSE_COMPLETE | → HEADQUARTERS (si suivant) ou SESSION_COMPLETE (si dernier) |
| `SESSION_END` | n'importe | sessionNight=SESSION_COMPLETE, gameState=ENDED |
| `NEW_SESSION` | n'importe | Reset total, équipes éjectées (`team:ejected`), gameState=LOBBY |

### Actions Admin — Jeu Libre & Effets
```
START_GAME            → démarrer jeu libre (sans sessionNight)
PAUSE_GAME / RESUME_GAME / END_GAME
ADJUST_SCORE          → { teamId, points, reason }
SESSION_TRIGGER_HAPPENING → { happening: { effectType, effectDuration, videoUrl, ... } }
PLAY_VIDEO            → { url } — vidéo plein écran sur WarRoom (null = stop)
WARROOM_COMMAND       → { type: 'TRIGGER_ALERT'|'TRIGGER_GLITCH', payload }
```

### Fonctions admin côté client (GameContext.adminActions)
```js
adminActions.createSession(payload)     // payload: { universes, introVideoUrl, requiredTalismans }
adminActions.launchSession()
adminActions.openHeadquarters()
adminActions.openUniverse(universeId)
adminActions.openNextUniverse()
adminActions.forceStartQuiz()
adminActions.closeQuiz()
adminActions.endSession()
adminActions.newSession()
adminActions.adjustScore(teamId, points, reason)
adminActions.triggerHappening(happening)
adminActions.playVideo(url)
adminActions.sendWarRoomCommand(command)
```

---

## Contraintes & Conventions

- **Durée cible d'une activité :** 5-10 minutes
- **Mobile-first :** tout doit fonctionner sur smartphone en réseau local
- **Pas de dépendances externes :** pas d'API tierces, tout tourne offline
- **Pas de base de données :** fichiers JSON en persistance (SQLite si > 10 soirées/mois envisagé)
- **Framer Motion** pour toutes les animations
- **Tailwind CSS** pour le style (pas de CSS modules)
- **Orbitron** = police des titres (déjà chargée)
- **Thème sombre** systématique (`bg-[#0a0a0f]` ou similaire)
- **Score max recommandé :** 1000 pts par activité, 500 pour un quiz
- **Pas d'IA generative côté client** (trop lent sur mobile / réseau local)

---

## Idées de Jeux à Développer (backlog)

### Odyssée Spatiale
- [ ] `mars_survival` — Journal de survie sur Mars, 10 décisions sur 100 jours
- [ ] `mars_launch` — Séquence de lancement du MAV en 8 étapes (8 mini-puzzles)
- [ ] `mars_traverse` — Traversée rover 500km, gestion énergie + obstacles

### À placer (univers à définir)
- [ ] `orbital_rendezvous` — Rendez-vous orbital, corrections de trajectoire en 5 phases
- [ ] `habitat_repair` — Plan du Hab endommagé, diagnostiquer et réparer dans l'ordre de priorité

---

## Questions fréquentes pour l'IA

**"Crée-moi une activité X"**
→ Utilise la structure minimale ci-dessus. L'activité reçoit `(universeId, onComplete, onExit)`. Utilise `useActivityScore` + `ActivityShell`. Durée cible : 5-10 min.

**"Ajoute un événement socket"**
→ Côté serveur dans le switch `admin:action` de `server/index.js`. Côté client dans `GameContext.jsx` (adminActions) ou directement via `socket.emit`.

**"Modifie l'interface admin"**
→ `src/components/SessionNightManager.jsx` (mode histoire) ou `src/components/AdminLanding.jsx` (mode libre) ou `src/pages/AdminPanel.jsx` (dashboard en jeu).

**"Ajoute un univers"**
→ Dans `src/data/universes.js`, ajouter l'entrée dans l'objet `UNIVERSES` et dans `UNIVERSE_ORDER`. Créer un thème WarRoom dans `src/components/warroom/themes/`.
