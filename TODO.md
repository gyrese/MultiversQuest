# MULTIVERS QUEST — TODO & REFONTE ARCHITECTURE
> Rédigé le 2026-03-16. Objectif : rendre le système de sessions et la connexion joueur robustes, lisibles et maintenables.

---

## 🔴 PROBLÈMES ACTUELS (diagnostic)

### Flux sessions cassé
- Deux modes (Histoire + Open Games) dans `AdminLanding` avec des chemins de code dupliqués et fragiles
- `SessionNightManager` est un composant séparé dans `AdminPanel` (onglet "Session"), découplé de `AdminLanding` → le GM jongle entre deux interfaces
- La transition `LOBBY → PLAYING` n'est pas la même selon le mode : `startGame()` vs `createSession()` → confusion
- Le salon d'attente joueur (`GameLobby`) s'affiche seulement si `status === 'LOBBY'` ET `sessionNight === null` → facile de le manquer
- `NEW_SESSION` reset tout mais le GM doit le déclencher manuellement avant de créer une session → ordre fragile

### Connexion joueur fragile
- L'auto-rejoin ne fonctionne que si `teamId` est absent du localStorage → logique inversée difficile à suivre
- Aucune distinction claire entre "première connexion" et "reconnexion après déco"
- Le joueur éjecté (nouvelle session) atterrit sur l'écran de login sans contexte ni explication
- Sur mobile, si la page est rechargée entre deux activités, le flow reprend depuis la connexion sans que le score soit retrouvé automatiquement

### Architecture serveur fragile
- `sessionNight` dans `gameState` → un seul objet qui mélange config initiale + état live (timer, index courant, scores)
- Le ticker `setInterval` est perdu au redémarrage serveur → session bloquée
- `setTimeout` pour le happening (multiplicateur x2) est perdu au redémarrage → x2 permanent
- Pas de verrou sur les soumissions de score concurrentes (même équipe, même activité, deux requêtes simultanées)
- `game_state.json` = fichier plat, pas de versioning, corruption possible

---

## 🎯 VISION CIBLE

### Principe directeur
> **Une soirée = une Session. Une Session a un Mode. Tout passe par un flux unique.**

Le GM crée une session depuis un écran dédié, choisit le mode, ouvre le salon, lance le jeu. Les joueurs ont un seul chemin : QR → nom → attente → jeu.

### Nouveau modèle de statut (serveur)
```
IDLE
 └─► LOBBY          (salon d'attente, équipes rejoignent)
       └─► STARTING  (compte à rebours 5s ou vidéo intro)
             └─► PLAYING       (mode Libre : hub ouvert)
             └─► UNIVERSE_OPEN (mode Histoire : univers actif)
                   └─► QUIZ_OPEN
                         └─► UNIVERSE_RESULTS
                               └─► UNIVERSE_OPEN (univers suivant)
                               └─► SESSION_RESULTS (dernier univers)
                                     └─► IDLE
```

---

## 📋 TODO — REFONTE COMPLÈTE

### PHASE 1 — Nettoyage & consolidation (priorité haute)

#### 1.1 Unifier le modèle de Session côté serveur
- [ ] Créer un objet `session` propre séparé de `gameState` :
  ```js
  session: {
    id: uuid,
    mode: 'FREE' | 'STORY',
    status: 'IDLE' | 'LOBBY' | 'STARTING' | 'PLAYING' | 'UNIVERSE_OPEN' | 'QUIZ_OPEN' | 'UNIVERSE_RESULTS' | 'SESSION_RESULTS',
    config: { ... },          // config immuable créée au départ
    runtime: { ... },         // état live (timer, index, scores)
    createdAt, startedAt, endedAt
  }
  ```
- [ ] Supprimer `gameState.sessionNight` et `gameState.status` (remplacer par `session.status`)
- [ ] Garder `gameState.teams` uniquement pour les équipes (pas de mélange avec la config session)
- [ ] Stocker `session.runtime.happeningEndsAt` (timestamp) au lieu d'un `setTimeout` → vérifier au redémarrage

#### 1.2 Robustesse du ticker serveur
- [ ] Au démarrage du serveur, si `session.status === 'UNIVERSE_OPEN'`, recalculer le temps restant depuis `runtime.universeStartedAt` et relancer le ticker automatiquement
- [ ] Idem pour le happening : si `runtime.happeningEndsAt > Date.now()`, relancer le timeout résiduel
- [ ] Centraliser tout dans une fonction `restoreSessionState()` appelée au boot

#### 1.3 Verrou de score (anti-race condition)
- [ ] Ajouter un `Set` en mémoire `pendingScores = new Set()` avec clé `teamId:universeId:activityId`
- [ ] Dans `POST /api/score` : si clé présente → répondre 409 (déjà en cours), sinon ajouter, traiter, supprimer
- [ ] Ajouter un cooldown de 2s par activité par équipe (stocker `lastSubmissionAt` dans `team.completions`)

#### 1.4 Supprimer les doublons de flux dans AdminLanding
- [ ] Fusionner `StoryModeConfig` et `OpenGamesConfig` en un seul composant `SessionConfigurator`
- [ ] Le `SessionConfigurator` rend différents champs selon `mode` (pas deux composants entiers séparés)
- [ ] Supprimer l'appel manuel à `adminActions.newSession()` avant `adminActions.createSession()` → le serveur doit faire le reset dans `SESSION_CREATE` lui-même

---

### PHASE 2 — Nouveau flux Admin (interface unifiée)

#### 2.1 Refonte de AdminLanding → "Session Manager"
- [ ] Remplacer `AdminLanding.jsx` par une page `SessionManager.jsx` avec 3 vues :
  - **Vue A — Accueil** : état de la dernière session, bouton "Nouvelle soirée", bouton "Reprendre"
  - **Vue B — Configuration** : sélectionner mode (Libre / Histoire), configurer univers/durées, bouton "Ouvrir le Salon"
  - **Vue C — Salon (Lobby)** : QR code + URL + liste équipes en live + bouton "Lancer !" + bouton "Annuler"
- [ ] Le bouton "Reprendre" n'apparaît que si `session.status !== 'IDLE' && session.status !== 'SESSION_RESULTS'`
- [ ] La vue C est la même pour les deux modes (pas de fork)

#### 2.2 Refonte de AdminPanel → panneau de contrôle en jeu
- [ ] Supprimer l'onglet "Session Night" de `AdminPanel` — `SessionNightManager` est absorbé dans le nouveau `SessionManager`
- [ ] `AdminPanel` devient uniquement le tableau de bord **pendant le jeu** :
  - Barre de statut session en haut (mode, univers actuel, timer)
  - Contrôles contextuels (boutons adaptés au `session.status` actuel)
  - Liste équipes + scores
  - Effets WarRoom (alert, glitch, vidéo)
  - Historique des événements
- [ ] Les contrôles changent automatiquement selon le statut :
  - `PLAYING` → "Terminer la partie libre" / "Pause"
  - `UNIVERSE_OPEN` → "Forcer Quiz" / "Happening"
  - `QUIZ_OPEN` → "Clôturer Quiz"
  - `UNIVERSE_RESULTS` → "Univers Suivant" ou "Terminer"
- [ ] Plus besoin de naviguer entre deux onglets pour contrôler la session

#### 2.3 Transitions admin claires
- [ ] Bouton "Lancer !" (lobby) → serveur passe `LOBBY → STARTING` → envoi socket `session:starting` avec countdown (5s)
- [ ] Après countdown → `STARTING → PLAYING` (ou `UNIVERSE_OPEN` si mode Histoire) automatiquement
- [ ] Chaque transition émet un événement socket nommé (`session:statusChange`) avec `{ from, to, payload }`
- [ ] Le client écoute `session:statusChange` pour mettre à jour l'UI (pas de déduction d'état côté client)

---

### PHASE 3 — Nouveau flux Joueur (connexion robuste)

#### 3.1 Refonte connexion joueur (`PlayerApp.jsx`)
- [ ] Remplacer la logique de vues avec des états string par un vrai state machine :
  ```js
  type PlayerView = 'CONNECTING' | 'LOGIN' | 'LOBBY' | 'GAME' | 'ACTIVITY' | 'RESULTS' | 'EJECTED'
  ```
- [ ] Vue `CONNECTING` : écran de chargement pendant que le socket s'initialise (évite le flash login avant connexion)
- [ ] Vue `EJECTED` : écran dédié quand le joueur est éjecté (nouvelle session) avec message clair + bouton "Rejoindre la nouvelle session"
- [ ] Supprimer toute logique d'auto-login — le joueur choisit explicitement

#### 3.2 Connexion / Reconnexion propre
- [ ] Séparer deux cas distincts dans `TeamLogin` :
  - **Nouveau joueur** : champ nom + bouton "Rejoindre" → `POST /api/teams`
  - **Joueur qui revient** : si `localStorage.teamName` existe → proposer carte "Reprendre en tant que [nom]" (1 clic) ET option "Nouveau nom"
- [ ] À la connexion, le serveur répond avec `{ teamId, token, status }` où `status` indique si l'équipe existait déjà
- [ ] Côté client : stocker `teamId + token + teamName` dans `localStorage` uniquement APRÈS confirmation serveur (pas avant)
- [ ] Supprimer le `useEffect` qui détecte l'éjection en regardant `gameState.teams` → remplacer par un événement serveur explicite `session:teamEjected` (plus fiable)

#### 3.3 Salon d'attente joueur (`GameLobby`)
- [ ] Afficher dès que `session.status === 'LOBBY'` (indépendant du mode)
- [ ] Afficher aussi pendant `STARTING` avec un compte à rebours
- [ ] Si le joueur se reconnecte en cours de partie (`PLAYING` / `UNIVERSE_OPEN`), sauter le lobby et aller directement au hub
- [ ] Ajouter un indicateur "Game Master en ligne" (booléen côté serveur : un socket ADMIN est-il connecté ?)

#### 3.4 Persistance de progression joueur
- [ ] À chaque complétion d'activité réussie, sauvegarder immédiatement via `POST /api/score` (déjà fait) ET mettre à jour le localStorage localement
- [ ] Au rechargement de page : charger depuis `localStorage` en premier (affichage immédiat), puis sync serveur en background
- [ ] Émettre `player:sync` non plus en polling (2s) mais à chaque action significative (complétion activité, changement d'univers)

---

### PHASE 4 — Modèle de données serveur propre

#### 4.1 Séparer config session et état live
```js
// Config (immuable après création)
session.config = {
  mode: 'FREE' | 'STORY',
  introVideoUrl: string,
  universes: [{ universeId, selectedChallengeIds, quizActivityId, durationSeconds }],
  requiredTalismans: number,
}

// État live (mutable)
session.runtime = {
  currentUniverseIndex: 0,
  universeStartedAt: timestamp | null,
  tickRemainingSeconds: number,
  happeningEndsAt: timestamp | null,
  pointsMultiplier: 1 | 2,
  perTeam: { [teamId]: { talismans, score, completedActivities } },
}
```

#### 4.2 Événements socket unifiés
- [ ] Un seul événement `session:state` qui envoie l'objet `session` complet (config + runtime + status)
- [ ] Un événement léger `session:tick` pour le timer (juste `{ secondsRemaining }`)
- [ ] Un événement `session:statusChange` pour les transitions (avec from/to)
- [ ] Supprimer les multiples événements `sessionNight:*` fragmentés

#### 4.3 Persistance améliorée
- [ ] Sauvegarder `session` et `teams` dans des fichiers JSON séparés (`session.json`, `teams.json`)
- [ ] Ajouter une fonction `loadSessionState()` au boot qui détecte si une session était en cours et relance les processus actifs
- [ ] Versionner le format de sauvegarde (`{ version: 2, savedAt: timestamp, data: {...} }`) pour gérer les migrations

---

### PHASE 5 — Expérience WarRoom & Dashboard

#### 5.1 WarRoom réactive aux changements de statut
- [ ] Écouter `session:statusChange` pour afficher les bons overlays automatiquement :
  - `LOBBY` → afficher le QR code + équipes
  - `STARTING` → compte à rebours plein écran
  - `UNIVERSE_OPEN` → thème de l'univers + timer
  - `UNIVERSE_RESULTS` → podium univers
  - `SESSION_RESULTS` → podium final + feux d'artifice
- [ ] Supprimer la logique de déduction de thème basée sur `currentUniverseIndex` → le serveur envoie explicitement `themeId` dans `session:statusChange`

#### 5.2 Lobby WarRoom (nouveau)
- [ ] Quand `session.status === 'LOBBY'`, la WarRoom affiche :
  - QR code géant centré
  - URL de connexion en grand
  - Grille des équipes connectées (live)
  - Compteur équipes
  - Animation d'attente thématique

---

### PHASE 6 — Corrections bugs & polish

- [ ] **Bug : admin socket perd sa room après reconnexion** → déjà partiellement corrigé, vérifier que ça tient pour toutes les vues
- [ ] **Happening x2 permanent au redémarrage** → stocker `happeningEndsAt` timestamp et vérifier au boot
- [ ] **Score concurrent** → verrou `pendingScores` (voir Phase 1.3)
- [ ] **API_SECRET en dur** → déplacer dans `.env` (fichier `.env.example` à créer)
- [ ] **NEXUS_URL hardcodé dans WarRoom.jsx** (`http://192.168.1.14:5174/nexus`) → utiliser `window.location` dynamique
- [ ] **Grid CSS cassé dans SessionNightManager** → `grid-cols-2md:grid-cols-4` (espace manquant) → `grid grid-cols-2 md:grid-cols-4`
- [ ] **Boutons "+500 PTS / -200 PTS (Tous)"** dans SessionNightManager ne font rien → brancher sur `adminActions.adjustScore` ou supprimer

---

## 📁 FICHIERS À CRÉER / MODIFIER / SUPPRIMER

| Action | Fichier | Raison |
|--------|---------|--------|
| ✏️ Refonte | `src/components/AdminLanding.jsx` | Remplacer par SessionManager avec 3 vues |
| ✏️ Refonte | `src/PlayerApp.jsx` | State machine propre, reconnexion robuste |
| ✏️ Modifier | `src/pages/AdminPanel.jsx` | Supprimer onglet Session, contrôles contextuels |
| ✏️ Modifier | `src/context/GameContext.jsx` | Unifier les événements socket session |
| ✏️ Refonte | `server/index.js` | Nouveau modèle session, boot recovery, verrou score |
| 🗑️ Supprimer (absorber) | `src/components/SessionNightManager.jsx` | Absorbé dans AdminLanding/AdminPanel |
| ➕ Créer | `src/components/SessionManager.jsx` | Nouvelle vue unifiée admin (config + lobby) |
| ➕ Créer | `src/components/PlayerLobby.jsx` | Salon joueur propre (refacto de GameLobby) |
| ➕ Créer | `.env.example` | Variables d'environnement documentées |

---

## 🗓️ ORDRE D'IMPLÉMENTATION RECOMMANDÉ

```
Semaine 1 : Phase 1 (serveur solide)
  → 1.1 Nouveau modèle session
  → 1.2 Boot recovery ticker
  → 1.3 Verrou score
  → 1.4 Simplifier AdminLanding

Semaine 2 : Phase 2 + 3 (interfaces)
  → 2.1-2.3 SessionManager admin
  → 3.1-3.3 PlayerApp refonte

Semaine 3 : Phase 4 + polish
  → 4.1-4.3 Modèle données propre
  → 5.1-5.2 WarRoom réactive
  → Phase 6 bugs
```

---

## 💡 DÉCISIONS D'ARCHITECTURE

| Question | Décision |
|----------|----------|
| Base de données ? | Non pour l'instant — fichiers JSON suffisent si bien structurés. Évaluer SQLite si > 10 soirées/mois. |
| Authentification admin ? | Simple secret URL (`/admin?key=xxx`) ou token en localStorage. Pas besoin de OAuth. |
| Multi-soirées simultanées ? | Hors scope. Une seule session active à la fois. |
| Historique des soirées ? | Sauvegarder `session_YYYYMMDD.json` à la fin de chaque session pour consultation post-hoc. |
| React Router ou state machine ? | Garder React Router pour les grandes routes. State machine interne (`PlayerView`) pour les sous-écrans joueur. |
