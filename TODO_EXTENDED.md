
# 🌌 MultiversQuest - Roadmap Technique & Fonctionnelle Étendue

Ce document recense l'ensemble des tâches pour transformer le prototype actuel en une application multijoueur complète, incluant le serveur, l'interface joueur, le tableau de bord (Dashboard) et la narration.

---

## 🔥 EN COURS - Session 07/02/2026

### Dashboard Theming (Refonte Radicale)
- [x] Système de thèmes CSS avec variables 
- [x] Rotation automatique des thèmes (15s)
- [x] **REFONTE TOTALE** : Chaque thème a sa propre structure JSX unique
  - [x] ⭐ **Star Wars** : Panel impérial, étoiles animées, ordinateur de ciblage
  - [x] 🦖 **Jurassic** : Terminal CRT InGen, scanlines vertes, bandes de sécurité
  - [x] 🍄 **Mario** : 8-bit style, blocs question, nuages, ciel bleu
  - [x] ⚡ **Harry Potter** : Parchemin/carte du Maraudeur, ornements dorés, coupe des maisons
  - [x] 💊 **Matrix** : Pluie de code, écran terminal vert, "The One"
- [ ] **EN COURS** : Validation visuelle et ajustements finaux
- [ ] Ajout d'images/assets réels pour chaque univers

---

## 🛠️ 1. Architecture Serveur & Backend (Node.js + Socket.io)

Le serveur le "Cerveau" du Multivers. Il gère l'état global, les scores en temps réel et la synchronisation des événements.

### Core Server
- [ ] **Initialisation Serveur** : Mettre en place un serveur Express + Socket.io.
- [ ] **Gestion des Équipes** :
    - [ ] API Création d'équipe (Nom, Avatar/Univers, Membres).
    - [ ] Stockage en mémoire (ou SQLite/Redis) de l'état des équipes.
- [ ] **Système de Scoring Temps Réel** :
    - [ ] Endpoint `POST /score` sécurisé pour valider la fin d'une activité.
    - [ ] Diffusion (Broadcast) automatique du classement à tous les clients connectés.
- [ ] **Game State Manager** :
    - [ ] Gestion des phases globales (Lobby, Jeu En Cours, Pause, Fin).
    - [ ] Trigger d'événements narratifs globaux (ex: "Glitch Universel").

### Game Master Interface (Admin)
- [ ] **Panel Admin** : Une interface pour le maître du jeu.
    - [ ] Voir les équipes connectées.
    - [ ] Lancer/Arrêter le timer global.
    - [ ] **Boutons "Scénario"** : Déclencher manuellement des événements (ex: "Invasion Bowser", "Panne de courant").
    - [ ] Ajouter/Retirer des points manuellement (arbitrage).

---

## 📱 2. Interface Joueur (Application Mobile / Tablette)

L'interface utilisée par les participants pour naviguer et jouer.

### Navigation & UX
- [ ] **Intégration du Router** : Mettre en place `react-router` pour gérer les vues (Login -> Hub -> Activité).
- [ ] **Team Login** : Écran de connexion/création d'équipe au lancement.
- [ ] **Refonte du Hub** :
    - [ ] Afficher le score actuel de l'équipe en permanence.
    - [ ] Liste des univers débloqués/bloqués.
    - [ ] Indicateur de "Destination Suivante" (fil d'ariane).

### Activités (Gameplay)
- [ ] **Migration Activité** : Convertir les prototypes existants pour utiliser `ActivityShell` et `useActivityScore`.
- [ ] **Scanner QR Code** : Intégrer une librairie (ex: `react-qr-reader`) pour valider l'arrivée physique dans une zone (Univers).
- [ ] **Développement des Mini-Jeux** :
    - [ ] *Jurassic Park* : Séquenceur de sécurité (Memory sonore/visuel).
    - [ ] *Harry Potter* : Quiz de potions (Drag & Drop ou QCM rapide).
    - [ ] *Star Wars* : Décodage de plan (Puzzle ou Code breaker).
    - [ ] *Mario* : Réflexes (Whack-a-mole ou Rythme).

---

## 🖥️ 3. Dashboard / "War Room" (Grand Écran)

L'écran affiché sur les télévisions/projecteurs dans la salle. Il doit être "Spectaculaire" et immersif.

### Layout "Control Center"
- [ ] **Design** : Esthétique "Quartiers Généraux du Multivers" (Grilles, radars, données qui défilent).
- [ ] **Leaderboard Live** :
    - [ ] Tableau dynamique qui se réordonne automatiquement lors des changements de score.
    - [ ] Rétro-éclairage de l'équipe qui vient de marquer ("Highlight").
- [ ] **Timer Global** : Compte à rebours géant avant la fin de la session.

### Widgets & Modules
- [ ] **"Activity Feed"** : Fil d'actualité type logs (ex: *"L'équipe 'Raptors' a piraté le système Jurassic Park (+500pts)"*).
- [ ] **Graphiques** : Courbe d'évolution des scores (bonus visuel).
- [ ] **Dernière découverte** : Popup visuelle quand une équipe débloque un nouvel Univers.

### Effets Scénaristiques (Overlay)
- [ ] **Mode "Alerte Rouge"** : L'écran devient rouge, sirènes visuelles (CSS), message d'urgence.
- [ ] **Mode "Glitch"** : L'écran se déforme (CSS filters) lors des anomalies temporelles.
- [ ] **Vidéos Scénario** : Capacité à jouer une vidéo en plein écran (interruptions du "Dr. Brown" ou méchant).

---

## 🎬 4. Scénario & Narration (Contenu)

Le fil rouge qui relie les mini-jeux.

### Phase 1 : L'Initialisation (0-15min)
- [ ] **Scène d'intro** : Vidéo ou Texte "Bienvenue dans le programme de test Multivers".
- [ ] **État** : Tout est calme, dashboard bleu/propre.
- [ ] **Objectif** : Compléter 1 univers pour calibrer le système.

### Phase 2 : Les Anomalies (15-45min)
- [ ] **Événement "Intrusion"** : Le Dashboard "glitch", un message cryptique apparaît.
- [ ] **Conséquence** : Des zones deviennent "Instables" (Malus de temps sur les mini-jeux).
- [ ] **Mini-Quête** : "Réparer le Firewall" (Action collaborative : toutes les équipes doivent scanner un code en même temps ?).

### Phase 3 : La Convergence (Dernières 15min)
- [ ] **Mode "Mort Subite"** : Les points sont doublés, la musique s'accélère.
- [ ] **Boss Final** : Un puzzle global affiché sur le Grand Écran que les équipes doivent résoudre sur leur téléphone.

### Phase 4 : Épilogue
- [ ] **Podium** : Animation de fin avec les 3 meilleures équipes.
- [ ] **Statistiques** : "Meilleur Hacker", "Plus Rapide", "Explorateur Ultime".

---

## 📅 Planning Immédiat (Next Steps)

1.  Créer le dossier `server/` et initialiser Socket.io.
2.  Créer la page `Dashboard.jsx` (vide pour l'instant mais avec le routing).
3.  Connecter un client "fake" qui envoie des points pour tester l'animation du Dashboard.
