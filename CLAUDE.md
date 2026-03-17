# MultiversQuest — Instructions pour Claude

## Stack technique
- **Frontend** : React 18 + Vite, Tailwind CSS, Framer Motion
- **Backend** : Node.js + Express v5 + Socket.IO
- **État** : Context API (PlayerContext, GameContext) — pas de Redux
- **Build** : `npm run build` → `dist/`, servi par Express en prod
- **Dev** : `npm run dev` (Vite sur :5173) + `node server/index.js` (Express sur :3001)

## Architecture des écrans
| Écran | Fichier | Description |
|-------|---------|-------------|
| WarRoom (GM) | `src/pages/WarRoom.jsx` | Tableau de bord maître de jeu |
| AdminPanel | `src/pages/AdminPanel.jsx` | Gestion sessions & équipes |
| Hub joueur | `src/components/Hub.jsx` | Liste des univers débloqués |
| PlayerApp | `src/PlayerApp.jsx` | Machine d'états joueur |
| SessionNightManager | `src/components/SessionNightManager.jsx` | Contrôle soirée story mode |

## Machine d'états joueur (PlayerApp)
```
connecting → login → lobby → hub → activity → ejected
```
- `connecting` : socket pas encore prêt
- `lobby` : en attente (gameState.status === 'LOBBY')
- `hub` : session en cours, le joueur choisit une activité
- `ejected` : événement `team:ejected` reçu

## Machine d'états Session Night (sessionNight.status)
```
DRAFT → INTRO → HEADQUARTERS → UNIVERSE_ACTIVE → QUIZ_ACTIVE → UNIVERSE_COMPLETE → SESSION_COMPLETE
```
- `gameState.status` = macro : `LOBBY | PLAYING | ENDED`
- `sessionNight.status` = micro : état narratif de la soirée

## Conventions de code
- Composants React : PascalCase, fichier `.jsx`
- Hooks custom : camelCase préfixé `use`, fichier `.js`
- Activités : un fichier par activité dans `src/activities/`
- Toujours utiliser `useActivityScore` hook pour soumettre un score
- Scores soumis via Socket.IO (`submitScore`) ET PlayerContext (`completeActivity`)
- Ne jamais hardcoder d'IP — utiliser `window.location.hostname`

## Ajouter une activité
1. Créer `src/activities/MonActivite.jsx`
2. Ajouter `lazy(() => import('./activities/MonActivite'))` dans `PlayerApp.jsx`
3. Ajouter l'entrée dans `ACTIVITY_MAP` de `PlayerApp.jsx`
4. Ajouter l'export dans `src/activities/index.js`
5. Référencer l'`id` dans `src/data/universes.js`

## Orchestration de travail

### Plan d'abord
Avant toute modification non triviale : lire les fichiers concernés, comprendre l'existant, proposer l'approche. Ne pas coder à l'aveugle.

### Agents en parallèle
Pour les recherches indépendantes, lancer plusieurs agents simultanément. Ne pas faire séquentiellement ce qui peut être parallèle.

### Vérification avant de déclarer "fini"
- Le build passe (`npm run build`) sans erreur
- Aucune prop manquante, aucun import oublié
- Les IDs d'activité correspondent entre `universes.js` et `PlayerApp.jsx`

### Corrections autonomes
Si un bug est découvert en cours de tâche : le corriger directement sans demander, puis signaler ce qui a été corrigé.

## Gestion des tâches
- Décomposer les grosses tâches en étapes avec TodoWrite
- Marquer chaque étape terminée dès qu'elle est faite
- Ne pas regrouper plusieurs étapes avant de marquer

## Principes

**Simplicité** — La solution la plus simple qui fonctionne. Pas d'abstraction prématurée.

**Pas de demi-mesures** — Si une fonctionnalité est implémentée, elle doit être complète et fonctionnelle.

**Impact minimal** — Modifier uniquement ce qui est nécessaire. Ne pas refactoriser du code adjacent non demandé.

**Langue** — Répondre en français. Commentaires de code en français. Commits en anglais (convention git du projet).

**Pas de fichiers inutiles** — Ne pas créer de fichiers de documentation sauf si explicitement demandé.
