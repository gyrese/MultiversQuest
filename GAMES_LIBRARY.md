# GAMES LIBRARY - MultiversQuest
## Catalogue complet de mini-jeux pop culture

> Chaque jeu dure **1 a 4 minutes**, jouable sur **telephone tactile**, dans le cadre d'une soiree equipe.
> Stack: **React 19 + Framer Motion + Tailwind CSS**. Canvas/PixiJS uniquement si necessaire.

---

## LEGENDE

| Tag | Signification |
|-----|--------------|
| `DEXTERITE` | Reflexes, vitesse, precision tactile |
| `MEMOIRE` | Memorisation de sequences, patterns |
| `LOGIQUE` | Puzzle, deduction, strategie |
| `CULTURE` | Quiz, connaissances pop culture |
| `FUN` | Party game, action physique, humour |
| `OBSERVATION` | Trouver, reperer, analyser |
| `RYTHME` | Timing, musique, synchronisation |

| Difficulte | Complexite dev |
|-----------|---------------|
| `EASY` | CSS + Framer Motion uniquement |
| `MEDIUM` | React state + timers + touch events |
| `HARD` | Canvas/PixiJS ou physique simulee |

---

## 1. ODYSSEE SPATIALE (Science-Fiction)

### 1.1 Rencontre du 3e Type - Sequence Musicale
- **Film**: Rencontre du 3e Type (1977)
- **Type**: `MEMOIRE` `RYTHME`
- **Dev**: `EASY`
- **Gameplay**: Simon classique. 5 notes jouees, le joueur reproduit la sequence. Difficulte croissante (5 → 8 → 12 notes).
- **Tech**: Web Audio API pour generer les tons. Boutons colores Framer Motion. Pas de lib externe.
- **Statut**: FAIT

### 1.2 Sauvetage Martien - Radar GPS
- **Film**: Seul sur Mars (2015)
- **Type**: `DEXTERITE` `OBSERVATION`
- **Dev**: `MEDIUM`
- **Gameplay**: Ecran radar. Le joueur oriente son telephone (DeviceOrientation API) pour scanner et localiser un signal GPS du Rover. Hot/Cold feedback visuel et sonore.
- **Tech**: DeviceOrientation API. CSS radial-gradient pour le radar sweep. Vibration API pour feedback.
- **Statut**: FAIT

### 1.3 Bug Hunt - Tir Arcade
- **Film**: Starship Troopers (1997)
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Des insectes Arachnides apparaissent a l'ecran. Tap pour tirer. Combo system. 60 secondes pour scorer max.
- **Tech**: PixiJS pour sprites et particules. Touch events natifs.
- **Statut**: FAIT

### 1.4 Route de Kessel - Pilotage Asteroides
- **Film**: Solo: A Star Wars Story (2018)
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Vue de dessus. Le Faucon avance automatiquement. Le joueur incline le telephone (gyroscope) pour eviter les asteroides. Acceleration progressive.
- **Tech**: DeviceOrientation API. CSS transforms pour le mouvement. requestAnimationFrame game loop.
- **Statut**: FAIT

### 1.5 Survivre au Nostromo - Infiltration Stealth
- **Film**: Alien (1979)
- **Type**: `LOGIQUE` `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Grille 2D vue de dessus. Le joueur deplace Ripley case par case. Les Xenomorphes patrouillent en pattern. Atteindre la sortie sans se faire voir. Detecteur de mouvement audio.
- **Tech**: Grid-based pathfinding. CSS Grid pour le rendu. State machine pour l'IA des aliens.
- **Statut**: FAIT

### 1.6 Message du Tesseract - Decodage Morse
- **Film**: Interstellar (2014)
- **Type**: `LOGIQUE` `MEMOIRE`
- **Dev**: `EASY`
- **Gameplay**: Un message en morse s'affiche (points et tirets animes). Le joueur doit decoder et taper le mot (S-T-A-Y). Tableau de reference morse fourni. 3 messages de difficulte croissante.
- **Tech**: CSS animations pour les flashs. Input text simple. Pas de lib.
- **Statut**: FAIT

### 1.7 Holo-Chess - Dejarik
- **Film**: Star Wars: A New Hope (1977)
- **Type**: `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Version simplifiee du jeu d'echecs holographique. Plateau hexagonal, 4 pieces par joueur. Chaque piece a un mouvement unique. Battre l'IA en 10 tours max. "Let the Wookiee win."
- **Tech**: Plateau SVG hexagonal. IA minimax simplifiee. Framer Motion pour les attaques.
- **Ref**: [hex grid guide](https://www.redblobgames.com/grids/hexagons/)

### 1.8 Pod Racing - Course de Reaction
- **Film**: Star Wars Episode I (1999)
- **Type**: `DEXTERITE` `RYTHME`
- **Dev**: `MEDIUM`
- **Gameplay**: Le podracer avance dans un canyon. Des obstacles arrivent en rythme. Le joueur doit slider gauche/droite au bon timing. Style Guitar Hero lateral. "Now THIS is podracing!"
- **Tech**: CSS perspective 3D pour l'effet de vitesse. Touch swipe events. BPM-synced obstacles.

### 1.9 Gravitational Slingshot
- **Film**: The Martian / Apollo 13
- **Type**: `LOGIQUE` `DEXTERITE`
- **Dev**: `HARD`
- **Gameplay**: Lancer une sonde spatiale. Des planetes exercent une gravite. Le joueur doit tracer la trajectoire initiale pour que la sonde atteigne la cible en utilisant les assists gravitationnels.
- **Tech**: Simulation physique 2D simple (Euler integration). Canvas pour le trace. Drag to aim.

### 1.10 Alien Facehugger Dodge
- **Film**: Aliens (1986)
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `EASY`
- **Gameplay**: Des facehuggers tombent du plafond. Le joueur secoue son telephone (accelerometre) pour les repousser. Chaque secousse = repousse. Trop lent = game over. "Game over, man!"
- **Tech**: DeviceMotion API pour detecter les secousses. CSS spring animations. Vibration feedback.

---

## 2. ROYAUMES LEGENDAIRES (Heroic Fantasy)

### 2.1 Le Sceau Runique - Trace de Glyphes
- **Film**: Seigneur des Anneaux / Harry Potter
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Un glyphe runique s'affiche. Le joueur doit le tracer au doigt sur l'ecran. Scoring par precision du trace (distance au modele). 5 runes de difficulte croissante.
- **Tech**: Canvas 2D pour le dessin. Algorithme de comparaison de path ($1 Recognizer ou Hausdorff distance).
- **Statut**: FAIT

### 2.2 Le Jeu des Trones - Choix Corneliens
- **Film**: Game of Thrones (Serie)
- **Type**: `LOGIQUE` `CULTURE`
- **Dev**: `EASY`
- **Gameplay**: Style "Reigns". Des cartes arrivent avec des dilemmes. Swipe gauche ou droite. 4 jauges (Peuple, Armee, Tresor, Foi). Si une jauge tombe a 0, game over. Survivre 15 tours.
- **Tech**: Framer Motion drag gestures. State machine pour les jauges. Deck de 30+ cartes.
- **Statut**: FAIT

### 2.3 Cours de Potions - Crafting
- **Film**: Harry Potter (Saga)
- **Type**: `LOGIQUE` `MEMOIRE`
- **Dev**: `MEDIUM`
- **Gameplay**: Recette affichee brievement puis cachee. Drag & drop des ingredients dans le chaudron dans le bon ordre. Melanger (geste circulaire). Couleur du chaudron = feedback.
- **Tech**: Framer Motion drag. Touch gesture recognition pour le melange. CSS color transitions.
- **Statut**: FAIT

### 2.4 L'Oracle de Smaug - 1, 2, 3 Soleil
- **Film**: Le Hobbit (Trilogie)
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `MEDIUM`
- **Gameplay**: Smaug dort sur son tresor. Le joueur tape l'ecran pour avancer et voler de l'or. Quand l'oeil du dragon s'ouvre, il faut s'arreter immediatement (ne plus toucher). Se faire prendre = perte d'or.
- **Tech**: State machine (sleep/waking/awake). Accelerometre optionnel. Timer aleatoire pour les phases.
- **Statut**: FAIT

### 2.5 Bataille de Poudlard - Tower Defense
- **Film**: Harry Potter et les Reliques de la Mort
- **Type**: `LOGIQUE`
- **Dev**: `HARD`
- **Gameplay**: Vue de dessus. Des mangemorts avancent vers Poudlard. Placer des sorts defensifs (Protego, Stupefix, Incendio) sur le chemin. Chaque sort a un cout en mana et un effet different.
- **Tech**: Grid pathfinding (A*). Game loop requestAnimationFrame. Canvas ou DOM pour le rendu.

### 2.6 Enigmes de Gollum
- **Film**: Le Hobbit: Un Voyage Inattendu
- **Type**: `LOGIQUE` `CULTURE`
- **Dev**: `EASY`
- **Gameplay**: Gollum pose des devinettes classiques du film + nouvelles. Le joueur a 30s par enigme. 3 indices progressifs disponibles (coutent des points). "What has it got in its pocketses?"
- **Tech**: Timer + input text. Fuzzy string matching pour accepter les variations. Framer Motion pour Gollum.

### 2.7 Forge de l'Anneau - Simon de Feu
- **Film**: Le Seigneur des Anneaux
- **Type**: `MEMOIRE` `RYTHME`
- **Dev**: `EASY`
- **Gameplay**: 4 enclumes dans la forge. Elles s'allument en sequence (comme Simon). Le joueur reproduit en tapant. A chaque round reussi, une lettre elfique s'inscrit sur l'anneau. Finir l'inscription = victoire.
- **Tech**: Web Audio API pour les sons metalliques. CSS glow animations. Meme pattern que Rencontre3eType.

### 2.8 Duel de Sorciers
- **Film**: Harry Potter / Gandalf vs Balrog
- **Type**: `DEXTERITE` `RYTHME`
- **Dev**: `MEDIUM`
- **Gameplay**: Rock-Paper-Scissors avance. 3 sorts (Attaque/Defense/Ruse) en boucle. Le joueur voit un indice visuel rapide du sort adverse et doit choisir le contre en <1s. Best of 7.
- **Tech**: Timer rapide. Framer Motion pour les animations de sorts. Vibration API.

---

## 3. TENEBRES ETERNELLES (Horreur)

### 3.1 La Cassette Maudite - WarioWare Horror
- **Film**: The Ring (2002)
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `MEDIUM`
- **Gameplay**: Enchainement rapide de micro-jeux de 3-5 secondes. "REBOBINE!" (geste circulaire), "NE REGARDE PAS!" (couvrir l'ecran), "DECROCHE!" (swipe up). Echouer = la fille du puits se rapproche.
- **Tech**: State machine WarioWare. Touch gesture detection. CSS VHS glitch effect.
- **Statut**: FAIT

### 3.2 Le Jeu de Jigsaw - Puzzle Timing
- **Film**: Saw (Saga)
- **Type**: `DEXTERITE` `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Mecanisme rotatif. Arreter l'aiguille dans la zone verte pour desactiver un piege. 5 pieges de plus en plus rapides et avec des zones de plus en plus petites. "I want to play a game."
- **Tech**: requestAnimationFrame pour la rotation. CSS conic-gradient. Touch pour stop.
- **Statut**: FAIT

### 3.3 Face a Pennywise - Runner Egouts
- **Film**: It / Ca (2017)
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Vue perspective 3D CSS. Le joueur court dans les egouts. Swipe gauche/droite pour eviter les obstacles. Tap pour attraper les ballons rouges (+points). Pennywise se rapproche si on ralentit.
- **Tech**: CSS perspective + translateZ pour la 3D. Touch swipe. Parallax layers.
- **Statut**: FAIT

### 3.4 Le Labyrinthe Overlook - Fog of War
- **Film**: The Shining (1980)
- **Type**: `LOGIQUE` `OBSERVATION`
- **Dev**: `MEDIUM`
- **Gameplay**: Labyrinthe genere proceduralement. Vue de dessus avec brouillard de guerre (seule la zone proche est visible). Trouver la cle puis la sortie. Jack Torrance patrouille et bloque des chemins. "Here's Johnny!"
- **Tech**: Maze generation (recursive backtracker). CSS radial-gradient mask pour le fog. Grid state.
- **Statut**: FAIT

### 3.5 Ouija Board - Spiritisme
- **Film**: L'Exorciste / Ouija
- **Type**: `FUN` `OBSERVATION`
- **Dev**: `EASY`
- **Gameplay**: Un plateau Ouija s'affiche. Le "curseur" bouge tout seul et epelle un message. Le joueur doit lire et taper le message avant que le curseur ne finisse. 5 messages de plus en plus rapides.
- **Tech**: CSS animation du curseur le long d'un path SVG. Input text. Timer.

### 3.6 Zombie Horde - Swipe to Survive
- **Film**: World War Z / The Walking Dead
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `EASY`
- **Gameplay**: Des zombies arrivent de tous les cotes. Chaque zombie a une direction de swipe (fleche). Swiper dans la bonne direction pour les repousser. Rater ou etre trop lent = degats. Survivre 60 secondes.
- **Tech**: Touch swipe detection. Framer Motion pour les zombies qui arrivent. Compteur de vie.

### 3.7 Exorcisme - Memorisation d'Incantations
- **Film**: L'Exorciste (1973)
- **Type**: `MEMOIRE`
- **Dev**: `EASY`
- **Gameplay**: Une incantation latine s'affiche brievement. Le joueur doit la restituer en choisissant les bons mots dans le desordre. La chambre tremble de plus en plus si on se trompe.
- **Tech**: Framer Motion pour les tremblements. Array shuffle. CSS ambient horror effects.

### 3.8 Photo de Fantome - Spot the Difference
- **Film**: Paranormal Activity / Insidious
- **Type**: `OBSERVATION`
- **Dev**: `EASY`
- **Gameplay**: Deux photos quasi identiques d'une piece. Trouver les 5 differences (dont certaines sont des elements "paranormaux" subtils). Timer de 45 secondes. Les photos "glitchent" periodiquement.
- **Tech**: Deux images superposees. Touch tap sur les zones. CSS glitch animation intermittente.

---

## 4. MECANIQUE DU FUTUR (Robots & IA)

### 4.1 Code Skynet - Pipe Mania
- **Film**: Terminator (Saga)
- **Type**: `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Grille de tuiles. Chaque tuile est un tuyau. Tap pour tourner. Connecter le flux d'energie du point A au point B avant que le chrono ne s'ecoule. Esthetique Cyberspace neon.
- **Tech**: Grid state machine. Flood-fill pour verifier la connexion. CSS rotation transitions.
- **Statut**: FAIT

### 4.2 Pilule Rouge ou Bleue - Quiz Psycho
- **Film**: Matrix (Trilogie)
- **Type**: `CULTURE` `FUN`
- **Dev**: `EASY`
- **Gameplay**: Questions rapides (5s par question) de type "Que feriez-vous si...". Deux choix toujours (pilule rouge = choix audacieux, bleue = choix prudent). Score basé sur la coherence du profil.
- **Tech**: JSON de questions. Timer. Framer Motion pour l'animation pluie de code.
- **Statut**: FAIT

### 4.3 Les Trois Lois - Lemmings-like
- **Film**: I, Robot (2004)
- **Type**: `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Des robots marchent en ligne droite. Le joueur place des ordres (STOP, TURN, JUMP) sur la grille pour les guider vers la sortie sans qu'ils tombent dans le vide. 5 niveaux.
- **Tech**: Grid + tick-based simulation. State machine par robot. DOM ou Canvas.
- **Statut**: FAIT

### 4.4 Test Voight-Kampff - Detection Replicant
- **Film**: Blade Runner (1982)
- **Type**: `OBSERVATION`
- **Dev**: `MEDIUM`
- **Gameplay**: Gros plan sur un oeil anime. Le joueur observe les micro-reactions (dilatation pupille, micro-tics). 5 sujets, pour chaque: choisir si c'est un humain ou un replicant. Les indices sont subtils et lies aux questions posees.
- **Tech**: CSS animations de pupille (scale, filter). Framer Motion pour les tics. Timer de reflexion.
- **Statut**: FAIT

### 4.5 Hack the Gibson - Terminal Hacking
- **Film**: Hackers (1995) / Mr. Robot
- **Type**: `DEXTERITE` `LOGIQUE`
- **Dev**: `EASY`
- **Gameplay**: Terminal vert retro. Des lignes de code defilent. Le joueur doit reperer et taper les mots-cles de hacking qui passent (SQL injection, buffer overflow...). Chaque mot correct = un % de hack complete.
- **Tech**: CSS monospace terminal. setInterval pour le defilement. Input capture. setTimeout pour la difficulte.

### 4.6 Robot Dance - Reproduction de Mouvements
- **Film**: Westworld / Ex Machina
- **Type**: `MEMOIRE` `RYTHME`
- **Dev**: `MEDIUM`
- **Gameplay**: Un robot execute une sequence de mouvements (representes par des fleches/icones). Le joueur reproduit en swipant dans les directions. Comme un DDR simplifie. La musique est electronique et le tempo augmente.
- **Tech**: Swipe direction detection. BPM timer. Framer Motion pour le robot. Web Audio API optionnel.

### 4.7 Circuit Imprime - Trace de Piste
- **Film**: Tron / Ghost in the Shell
- **Type**: `DEXTERITE` `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Un circuit imprime avec des composants a connecter. Le joueur trace au doigt les pistes entre les points. Les pistes ne doivent pas se croiser. Esthetique PCB vert phosphorescent.
- **Tech**: Canvas pour le trace libre. Intersection detection. SVG pour le circuit de base.

### 4.8 Emotion Analysis - Micro-Expressions
- **Film**: Blade Runner 2049 / Westworld
- **Type**: `OBSERVATION`
- **Dev**: `EASY`
- **Gameplay**: Des visages s'affichent avec des micro-expressions (joie, peur, degout, surprise, colere, mepris). Le joueur doit identifier l'emotion en <3s. 10 visages. Les differences sont subtiles (IA vs humain).
- **Tech**: Images statiques + CSS filter subtle changes. Boutons de choix. Timer.

---

## 5. ERES PERDUES (Prehistoire & Monstres)

### 5.1 Systeme de Securite - Mastermind Jurassic
- **Film**: Jurassic Park (1993)
- **Type**: `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Interface terminal Unix retro. Reproduire un code de securite (Mastermind: deviner la sequence de 4 couleurs en 8 essais). Feedback: bien place / mal place. "Ah ah ah, you didn't say the magic word!"
- **Tech**: Mastermind logic. CSS terminal CRT effect (scanlines, flicker). Sons clavier mecanique.
- **Statut**: FAIT

### 5.2 Ile du Crane - Vertical Platformer
- **Film**: King Kong (2005)
- **Type**: `DEXTERITE`
- **Dev**: `HARD`
- **Gameplay**: Doodle Jump-like. Le joueur monte en sautant de plateforme en plateforme. Incliner le telephone pour diriger. Eviter les rochers qui tombent. Atteindre le sommet de Skull Island.
- **Tech**: Canvas ou DOM. DeviceOrientation pour le tilt. Collision detection. Gravity sim.
- **Statut**: FAIT

### 5.3 Communication Primitive - Memory Sonore
- **Film**: La Planete des Singes (Saga)
- **Type**: `MEMOIRE`
- **Dev**: `EASY`
- **Gameplay**: 4 icones de signes simiesques. Sequence jouee (visuel + son). Reproduire. Comme Simon mais avec des gestes de singes et des sons de percussions/grognements. 5 rounds.
- **Tech**: Web Audio API. Framer Motion. Meme base que Rencontre3eType adapte.
- **Statut**: FAIT

### 5.4 La Chasse Primitive - Tir Balistique
- **Film**: 10 000 BC (2008)
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Angry Birds simplifie. Drag pour viser (angle + puissance), release pour lancer la lance. Toucher le mammouth/dino qui bouge. 5 lances, scorer le max. Trajectoire parabolique.
- **Tech**: Touch drag pour aim. Physique balistique simple (gravite). Canvas pour trace + cible.
- **Statut**: FAIT

### 5.5 DNA Sequencing - Puzzle ADN
- **Film**: Jurassic Park / Jurassic World
- **Type**: `LOGIQUE`
- **Dev**: `EASY`
- **Gameplay**: Une sequence ADN incomplete (A-T-G-C). Le joueur doit completer les paires manquantes (A↔T, G↔C). Difficulte croissante: sequences plus longues, timer plus court. "Life finds a way."
- **Tech**: Drag & drop des nucleotides. CSS double helix animation. Timer.

### 5.6 Excavation - Fouilles Archeologiques
- **Film**: Indiana Jones / Jurassic Park
- **Type**: `OBSERVATION` `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Un carre de sable. Le joueur "gratte" au doigt pour reveler des os de dinosaure. Gratter trop fort/vite = casser les os (-points). Gratter doucement = reveler. Trouver le squelette complet.
- **Tech**: Canvas avec couche de "sable" (pixels). Touch move = eraser. Pression = vitesse du doigt.

---

## 6. REALITES ALTEREES (Temps & Dimensions)

### 6.1 Inversion Temporelle - Logique Inversee
- **Film**: Tenet (2020)
- **Type**: `LOGIQUE` `MEMOIRE`
- **Dev**: `EASY`
- **Gameplay**: Une sequence d'actions est montree a l'endroit. Le joueur doit la reproduire A L'ENVERS. Round 1: 3 actions, Round 5: 7 actions. Actions = fleches/couleurs/symboles.
- **Tech**: Array reverse. Framer Motion pour le replay "rewind". Timer.
- **Statut**: FAIT

### 6.2 Paradoxe Temporel - Timeline
- **Film**: Retour vers le Futur (Trilogie)
- **Type**: `CULTURE` `LOGIQUE`
- **Dev**: `EASY`
- **Gameplay**: Des evenements de films sont dans le desordre. Drag & drop pour les remettre en ordre chronologique. 3 rounds: facile (5 events), moyen (8), hard (12). "Great Scott!"
- **Tech**: Framer Motion drag reorder. Array comparison pour le scoring.
- **Statut**: FAIT

### 6.3 Niveaux de Reve - Platformer Gravite
- **Film**: Inception (2010)
- **Type**: `DEXTERITE` `LOGIQUE`
- **Dev**: `HARD`
- **Gameplay**: Platformer ou le joueur peut INVERSER la gravite (tap = flip). Le personnage tombe vers le haut ou le bas. Naviguer les 3 niveaux de reve. L'esthetique change a chaque niveau (plus abstrait en profondeur).
- **Tech**: Canvas/PixiJS. Gravity toggle. Tile-based level design. Collision detection.

### 6.4 Puzzle Dimensionnel - Rotation de Monde
- **Film**: Doctor Strange (2016)
- **Type**: `LOGIQUE`
- **Dev**: `HARD`
- **Gameplay**: Un labyrinthe 2D vu de haut. Le joueur fait TOURNER le monde entier (90 degres) et la bille tombe dans la nouvelle direction de gravite. Combiner les rotations pour guider la bille vers la sortie.
- **Tech**: CSS rotate + gravity simulation. Canvas pour la physique. Touch pour rotation.

### 6.5 Boucle Temporelle - Groundhog Day
- **Film**: Un Jour Sans Fin / Edge of Tomorrow
- **Type**: `MEMOIRE` `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Le joueur revit la meme scene en boucle. A chaque iteration, il doit memoriser un nouvel element et l'utiliser dans la boucle suivante. 5 boucles. Chaque boucle ajoute un element a retenir.
- **Tech**: State machine avec memoire des boucles. Framer Motion. Array de decisions cumulatives.

### 6.6 Portail Dimensionnel - Rick & Morty
- **Film**: Rick & Morty (Serie)
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `EASY`
- **Gameplay**: Des portails verts s'ouvrent a des endroits aleatoires. Tap le plus vite possible pour y entrer avant qu'ils ne se ferment. Chaque portail donne un score aleatoire (-50 a +200). Certains portails sont des pieges! "Wubba lubba dub dub!"
- **Tech**: Random positioning. Timer per portal. Touch tap. Framer Motion AnimatePresence.

### 6.7 Multiverse Matching - Memory Interdimensionnel
- **Film**: Everything Everywhere All At Once / Spider-Verse
- **Type**: `MEMOIRE`
- **Dev**: `EASY`
- **Gameplay**: Jeu de Memory classique mais les paires sont des versions "multivers" du meme personnage (ex: Spider-Man / Miles Morales / Spider-Gwen). 12 cartes (6 paires). Timer 60s.
- **Tech**: CSS flip animation. Array shuffle. State machine pour les paires.

---

## 7. CLUB DOROTHEE (Anime 90s)

### 7.1 Kamehameha Challenge - Button Mashing
- **Film**: Dragon Ball Z
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `EASY`
- **Gameplay**: Duel d'energie contre Cell. Taper l'ecran le plus vite possible pendant 10 secondes pour charger le Kamehameha. Jauge vs jauge adverse (IA). Atteindre un seuil pour gagner.
- **Tech**: Tap counter. Timer. CSS energy beam animation. Framer Motion pour le duel.
- **Statut**: FAIT

### 7.2 Le Tir de Nicky - Precision
- **Film**: Nicky Larson / City Hunter
- **Type**: `DEXTERITE` `OBSERVATION`
- **Dev**: `MEDIUM`
- **Gameplay**: Scene de toit la nuit. Des cibles (mechants) et des civils (otages) apparaissent. Tap pour tirer sur les mechants. Ne PAS toucher les otages (-gros malus). 30 secondes. Mokkori mode bonus.
- **Tech**: Random target spawn. Touch precision. Timer. Framer Motion AnimatePresence.
- **Statut**: FAIT

### 7.3 Prisme Lunaire - Rythme
- **Film**: Sailor Moon
- **Type**: `RYTHME` `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Sequence de transformation. Des etoiles descendent (style Guitar Hero). Tap au bon moment quand l'etoile passe dans la zone. Combo system. "Moon Prism Power, Make Up!"
- **Tech**: requestAnimationFrame. Hit detection temporelle. CSS starfield. Web Audio API pour la musique.
- **Statut**: FAIT

### 7.4 Tir de la Feuille Morte - Trace de Courbe
- **Film**: Olive et Tom / Captain Tsubasa
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Terrain de foot vu de dessus. Un mur de joueurs devant. Le joueur trace au doigt la trajectoire que le ballon doit suivre pour contourner le mur et rentrer dans le but. Physique du ballon suit le trace.
- **Tech**: Canvas touch path. Bezier curve interpolation. Collision avec le mur/filet.

### 7.5 Chevaliers du Zodiaque - Cosmos Rising
- **Film**: Saint Seiya
- **Type**: `DEXTERITE` `RYTHME`
- **Dev**: `EASY`
- **Gameplay**: Le Cosmos monte! Taper en rythme pour accumuler du Cosmos (jauge). A chaque seuil, une attaque se declenche automatiquement (Pegasus Ryu Sei Ken, Diamond Dust...). Atteindre le 7eme sens pour gagner.
- **Tech**: BPM detection simple (tap rhythm). CSS constellation animations. Jauge de progression.

### 7.6 Ken le Survivant - QTE
- **Film**: Hokuto no Ken
- **Type**: `DEXTERITE` `FUN`
- **Dev**: `EASY`
- **Gameplay**: Quick Time Events. Des fleches/boutons apparaissent rapidement. Le joueur doit taper/swiper dans la bonne direction. Enchainer les combos. A la fin: "Omae wa mou shindeiru." "NANI?!"
- **Tech**: QTE state machine. Random direction sequence. Timer per input. Framer Motion pour les effets.

### 7.7 Course de Tortues - Tortue Geniale
- **Film**: Dragon Ball
- **Type**: `FUN` `DEXTERITE`
- **Dev**: `EASY`
- **Gameplay**: Tortue Geniale fait la course. Incliner le telephone pour diriger la tortue entre des obstacles. La tortue est LENTE, ce qui rend le jeu comiquement difficile. Ramasser les magazines pour du boost.
- **Tech**: DeviceOrientation. CSS transform. Simple physics. Humour.

---

## 8. MONDES ANIMES (Disney / Pixar / Ghibli)

### 8.1 Hakuna Matata - Texte a Trous
- **Film**: Le Roi Lion (Disney)
- **Type**: `CULTURE` `MEMOIRE`
- **Dev**: `EASY`
- **Gameplay**: Paroles de chansons Disney celebres avec des mots manquants. Le joueur choisit parmi 4 propositions. 10 questions. Timer de 15s par question.
- **Tech**: JSON de questions/reponses. Boutons de choix. Timer. Framer Motion.
- **Statut**: FAIT

### 8.2 Chambre d'Andy - Objets Caches
- **Film**: Toy Story (Pixar)
- **Type**: `OBSERVATION`
- **Dev**: `MEDIUM`
- **Gameplay**: Grande image panoramique de la chambre d'Andy. Zoom/pan tactile. Trouver 8 jouets caches (Woody, Buzz, Rex, Hamm...). Timer de 90 secondes. Les objets sont bien caches.
- **Tech**: CSS transform: scale/translate pour le zoom/pan. Touch gestures. Hit zones SVG.
- **Statut**: FAIT

### 8.3 Le Marais - Whack-a-Mole
- **Film**: Shrek (Dreamworks)
- **Type**: `DEXTERITE`
- **Dev**: `EASY`
- **Gameplay**: 9 trous dans le marais. Des creatures de conte de fee (chevaliers, miroir magique, chat botte) sortent. Tap pour les repousser. L'ane sort aussi — ne PAS le taper! 60 secondes. "Get out of my swamp!"
- **Tech**: CSS grid 3x3. Random spawn timing. Touch tap. Timer. Framer Motion pop.
- **Statut**: FAIT

### 8.4 Le Bain des Esprits - Grattage
- **Film**: Le Voyage de Chihiro (Ghibli)
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: L'Esprit Putride est recouvert de boue. Frotter l'ecran avec le doigt pour nettoyer. Differentes couches a enlever. Reveler progressivement l'esprit de riviere en dessous. Timer 60s.
- **Tech**: Canvas 2D. Touch move = eraser (globalCompositeOperation: destination-out). Layers progressifs.
- **Statut**: FAIT

### 8.5 Ratatouille - Chef Challenge
- **Film**: Ratatouille (Pixar)
- **Type**: `MEMOIRE` `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Le chef Gusteau montre une recette (sequence d'ingredients). Les ingredients defilent sur un tapis roulant. Le joueur doit taper les bons au bon moment (et ignorer les mauvais). "Anyone can cook!"
- **Tech**: Horizontal scroll animation. Touch tap on items. Sequence matching. Timer.

### 8.6 Labyrinthe de Totoro
- **Film**: Mon Voisin Totoro (Ghibli)
- **Type**: `LOGIQUE`
- **Dev**: `EASY`
- **Gameplay**: Un petit labyrinthe dans la foret. Guider Mei vers Totoro en swipant (haut/bas/gauche/droite). Les Noiraudes (petites boules noires) bloquent certains chemins aleatoirement. 5 labyrinthes de taille croissante.
- **Tech**: Grid maze. Swipe detection. CSS grid render. Framer Motion pour les deplacements.

### 8.7 Nemo - Courant Est-Australien
- **Film**: Le Monde de Nemo (Pixar)
- **Type**: `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Nemo nage dans le courant (auto-scroll horizontal). Incliner le telephone pour monter/descendre. Eviter les meduses. Attraper les coquillages. "Just keep swimming!"
- **Tech**: DeviceOrientation. CSS parallax scroll. Collision rectangulaire simple.

---

## 9. TERRES DESOLEES (Post-Apocalypse)

### 9.1 Fuite de l'Abri 111 - Terminal Hacking
- **Film**: Fallout (Jeu Video)
- **Type**: `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Terminal vert retro (PIP-Boy style). Liste de mots. Le joueur choisit un mot. Le jeu indique combien de lettres sont correctes et bien placees (Mastermind avec des mots). 4 essais pour trouver le mot de passe.
- **Tech**: CSS terminal CRT. String comparison algo. Monospace font.
- **Statut**: FAIT

### 9.2 Route de la Fureur - Convoy Defense
- **Film**: Mad Max: Fury Road (2015)
- **Type**: `DEXTERITE`
- **Dev**: `HARD`
- **Gameplay**: Le War Rig roule (auto-scroll). Des voitures ennemies arrivent par la gauche et la droite. Le joueur swipe pour lancer des objets (pneus, lances) sur les ennemis. Boss: Guitar Flamethrower Guy. "WITNESS ME!"
- **Tech**: Canvas side-scroller. Touch swipe to throw. Collision detection. Sprite animation.

### 9.3 Silence de Mort - Micro Detection
- **Film**: Sans Un Bruit / The Last of Us
- **Type**: `FUN` `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Le joueur doit avancer (tap pour avancer d'un pas). MAIS: le micro du telephone detecte le bruit ambiant. Si le volume depasse un seuil, la creature attaque. Il faut avancer en silence total. 10 pas pour gagner.
- **Tech**: Web Audio API (getUserMedia) pour le niveau micro. Threshold detection. Framer Motion.
- **Note**: Demander permission micro. Fallback: mode "ne bouge pas" avec accelerometre.

### 9.4 La Horde - Tower Defense Simplifie
- **Film**: The Walking Dead
- **Type**: `LOGIQUE`
- **Dev**: `HARD`
- **Gameplay**: Vue de dessus. Des zombies avancent vers la base. Le joueur place des pieges (barricades, mines, tourelles) avec un budget limite. Vagues de 30s. Survivre 3 vagues.
- **Tech**: Grid pathfinding (A*). Game loop. Canvas ou DOM grid. Spawn waves.

### 9.5 Geiger Counter - Hot & Cold
- **Film**: Fallout / Stalker
- **Type**: `OBSERVATION` `DEXTERITE`
- **Dev**: `EASY`
- **Gameplay**: Un objet precieux est cache dans une zone radioactive. Le compteur Geiger (vibration + son) s'intensifie quand on se rapproche. Le joueur deplace un curseur a l'ecran pour chercher. Trouver en <45s.
- **Tech**: Distance calculation. Vibration API intensity. CSS noise filter. Audio frequency modulation.

### 9.6 Bunker Inventory - Tetris de Survie
- **Film**: Fallout Shelter / 10 Cloverfield Lane
- **Type**: `LOGIQUE`
- **Dev**: `MEDIUM`
- **Gameplay**: Un sac a dos avec une grille. Des objets de survie de tailles differentes (armes, nourriture, medkits). Drag & rotate pour tout faire rentrer. Plus d'objets = meilleur score. Tetris-like inventory management.
- **Tech**: Grid drag & drop. Rotation on tap. Collision grid check. Framer Motion drag.

### 9.7 Signal Radio - Frequence SOS
- **Film**: The Road / Mad Max
- **Type**: `DEXTERITE` `OBSERVATION`
- **Dev**: `EASY`
- **Gameplay**: Un poste radio avec un cadran rotatif. Le joueur tourne le cadran (geste circulaire) pour trouver des frequences. A certaines frequences: messages, musique, SOS. Trouver les 3 frequences SOS parmi le bruit.
- **Tech**: Touch rotation gesture. CSS radio dial. Web Audio API pour les sons radio (static, voices).

---

## 10. JEUX GENERIQUES (Tous Univers)

### 10.1 Quiz Culture G
- **Type**: `CULTURE`
- **Dev**: `EASY`
- **Gameplay**: 10-20 questions QCM sur le theme de l'univers. 15s par question. Bonus temps (reponse rapide = plus de points). Animations de feedback (correct/incorrect).
- **Tech**: JSON de questions. Timer. Score = base + time bonus.
- **Statut**: FAIT (GenericQuiz.jsx reutilisable par univers)

### 10.2 Blind Test - Audio Quiz
- **Type**: `CULTURE` `MEMOIRE`
- **Dev**: `MEDIUM`
- **Gameplay**: Un extrait musical de film/serie joue pendant 5-10 secondes. 4 choix de reponse. 10 extraits. Bonus si reponse en <3s. Peut etre decline par univers.
- **Tech**: Audio files pre-chargees. Web Audio API. Timer. JSON de questions.
- **Assets**: Necessite des extraits audio (MP3/OGG, <10s chacun, fair use).

### 10.3 Qui Suis-Je? - Devinettes Rapides
- **Type**: `CULTURE`
- **Dev**: `EASY`
- **Gameplay**: Des indices apparaissent un par un (toutes les 5s). Le joueur doit deviner le personnage. Plus on repond tot, plus on gagne de points. 5 personnages par manche.
- **Tech**: Timer progressif. Input text + fuzzy matching. Framer Motion reveal.

### 10.4 Pictionary - Dessin Flash
- **Type**: `FUN` `DEXTERITE`
- **Dev**: `MEDIUM`
- **Gameplay**: Un mot de la pop culture s'affiche (ex: "Lightsaber", "DeLorean"). Le joueur a 30s pour dessiner. Un algorithme simple note la coherence OU les autres joueurs votent.
- **Tech**: Canvas drawing. Touch path. Optionnel: export image pour vote multi-joueur via Socket.IO.

---

## 11. IDEES BONUS - NOUVEAUX UNIVERS POSSIBLES

### 11.1 SUPER-HEROS (Marvel / DC)

| Jeu | Type | Concept |
|-----|------|---------|
| **Snap de Thanos** | `FUN` `DEXTERITE` | Tap 50% des elements a l'ecran en <5s. Lesquels survivent est aleatoire. Score = precision. |
| **Spider-Sense** | `OBSERVATION` `DEXTERITE` | Des dangers apparaissent autour de l'ecran. Un bref flash "spider-sense" indique la direction. Swipe pour esquiver. Reflexes purs. |
| **Batcave Decryptage** | `LOGIQUE` | Dechiffrer des messages codes de criminels. Substitution cipher, Caesar cipher, morse... |
| **Mjolnir Worthy** | `FUN` | Le telephone vibre de plus en plus fort. Le joueur doit le "soulever" (accelerometre vertical). Seuls les "dignes" reussissent (condition cachee: le lever DOUCEMENT). |

### 11.2 RETRO GAMING (Jeux Video Classiques)

| Jeu | Type | Concept |
|-----|------|---------|
| **Pac-Man Maze** | `DEXTERITE` | Labyrinthe classique. Swipe pour diriger. Manger les points, eviter les fantomes. 60s. |
| **Tetris Rush** | `LOGIQUE` `DEXTERITE` | 60 secondes de Tetris. Score max. Pieces pre-generees pour etre equitable entre joueurs. |
| **Metal Gear Codec** | `MEMOIRE` | Des frequences codec sont donnees. Retenir et composer la bonne frequence pour appeler le bon contact. |
| **Street Fighter QTE** | `DEXTERITE` `FUN` | Enchainement de commandes (↓↘→ + Punch). Le joueur reproduit les inputs d'un combo. Scoring par precision timing. "Hadouken!" |
| **Pokemon Qui-Est-Ce** | `CULTURE` | Silhouette d'un Pokemon. Deviner lequel. Classique meme. "Who's that Pokemon?!" |
| **GTA Wanted** | `FUN` `DEXTERITE` | Des etoiles de recherche apparaissent. Le joueur doit "fuir" (tilt phone) en evitant les flics qui arrivent de partout. Plus de temps = plus de score. |

### 11.3 MUSIQUE & CINEMA

| Jeu | Type | Concept |
|-----|------|---------|
| **Soundtrack Guess** | `CULTURE` `MEMOIRE` | Jouer 5 secondes d'une bande originale. Deviner le film parmi 4 choix. 15 rounds. |
| **Scene Shuffle** | `LOGIQUE` `CULTURE` | 4 screenshots de film melanges. Remettre dans l'ordre chronologique de la scene. |
| **Famous Last Words** | `CULTURE` | "I'll be back", "May the Force be with you"... Qui a dit cette replique? QCM rapide. |
| **Movie Emoji** | `CULTURE` `LOGIQUE` | Un film represente par 3-5 emojis. Deviner le titre. Ex: 🦈🏖️🩸 = Les Dents de la Mer. |

---

## 12. REFERENCES TECHNIQUES

### Libs Recommandees (deja dans le projet)
- **Framer Motion** : Animations, drag, gestures, layout animations
- **PixiJS** : Jeux canvas 2D performants (Bug Hunt, platformers)
- **GSAP** : Animations timeline complexes (optionnel, Framer suffit souvent)
- **Tailwind CSS** : Styling rapide et coherent

### APIs Navigateur Utiles
- **Web Audio API** : Sons proceduraux, playback, analyse frequence
- **DeviceOrientation API** : Gyroscope (pilotage, inclinaison)
- **DeviceMotion API** : Accelerometre (secousses, detection mouvement)
- **Vibration API** : Feedback haptique (navigator.vibrate)
- **getUserMedia** : Acces micro (Silence de Mort)
- **Touch Events** : touchstart, touchmove, touchend pour les gestes

### Patterns de Jeu Reutilisables
- **Simon Pattern** : Sequence memorisable → Rencontre3eType, PrimalCommunication, Forge de l'Anneau
- **Whack-a-Mole** : Targets popup → ShrekSwamp, BugHunt (tap variant)
- **Runner/Scroller** : Auto-scroll + obstacles → PennywiseRunner, Pod Racing, Nemo
- **Grid Puzzle** : Grille manipulable → SkynetCode, OverlookMaze, Pac-Man
- **Quiz Engine** : JSON questions + timer → GenericQuiz (deja reutilisable)
- **Drag & Reorder** : Framer Motion drag → TimelineParadox, CoursPotions
- **QTE Engine** : Inputs rapides + timing → Kamehameha, Ken le Survivant, Street Fighter

### Scoring Standard
```
Score = basePoints * accuracyMultiplier * timeBonus
- basePoints: defini par activite (100-600)
- accuracyMultiplier: 0.0 - 1.0 (precision du joueur)
- timeBonus: 1.0 - 1.5 (bonus si rapide, via timer restant)
```
