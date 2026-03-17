/**
 * 🌌 MultiversQuest - Core Server
 * Serveur temps réel pour la gestion du jeu multijoueur
 * Express + Socket.io
 */

const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve Vite build output (production)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ============================================
// 🗄️ ÉTAT DU JEU (In-Memory + Persistance)
// ============================================

const DATA_FILE = path.join(__dirname, 'game_state.json');
const API_SECRET = process.env.API_SECRET || 'multivers_secret_2026';

// État initial par défaut
const defaultGameState = {
    teams: {},
    history: [],
    status: 'LOBBY',         // LOBBY, PLAYING, PAUSED, ENDED
    phase: 'INITIALISATION', // INITIALISATION, ANOMALIES, CONVERGENCE, EPILOGUE
    startTime: null,
    globalTimer: 3600,       // 1 heure par défaut
    scenarioEvents: [],
    activeEffects: [],       // Effets visuels actifs (GLITCH, ALERT, etc.)
    config: {
        maxTeams: 20,
        pointsMultiplier: 1,
        autoSave: true
    },
    // Mode Session Night (Soirée Orchestrée)
    sessionNight: null
};

// Charger l'état depuis le fichier ou utiliser les valeurs par défaut
function loadGameState() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const saved = JSON.parse(data);
            console.log('💾 État du jeu chargé depuis le fichier');
            const state = { ...defaultGameState, ...saved };

            // 🔧 Réparation et Synchronisation des registres de score (Autorité Serveur)
            Object.values(state.teams).forEach(team => {
                if (!team.completions) team.completions = {};
                if (!team.completedActivities) team.completedActivities = [];

                // Fallback 1: Si completions est vide, on tente de reconstruire depuis playerState (Legacy Sync)
                if (Object.keys(team.completions).length === 0 && team.playerState?.universes) {
                    Object.entries(team.playerState.universes).forEach(([uId, u]) => {
                        if (u.activities) {
                            Object.entries(u.activities).forEach(([aId, act]) => {
                                if (act.status === 'completed' && typeof act.bestScore === 'number' && act.bestScore > 0) {
                                    team.completions[`${uId}:${aId}`] = act.bestScore;
                                }
                            });
                        }
                    });
                }

                // Fallback 2: Si completedActivities est vide (nécessaire pour WarRoom), on remplit depuis completions
                if (team.completedActivities.length === 0 && Object.keys(team.completions).length > 0) {
                    Object.entries(team.completions).forEach(([key, score]) => {
                        const [uId, aId] = key.split(':');
                        team.completedActivities.push({
                            universeId: uId,
                            activityId: aId,
                            points: score,
                            timestamp: Date.now()
                        });
                    });
                }

                // 🎯 Re-calcul du score total Autoritaire
                let totalScore = 0;
                Object.values(team.completions).forEach(s => totalScore += s);

                if (totalScore !== team.score) {
                    console.log(`🔧 Réparation score pour ${team.name}: ${team.score} -> ${totalScore}`);
                    team.score = totalScore;
                    if (team.playerState) team.playerState.points = totalScore;
                }
            });

            return state;
        }
    } catch (error) {
        console.error('⚠️ Erreur chargement état:', error.message);
    }
    return { ...defaultGameState };
}

// Sauvegarder l'état
function saveGameState() {
    if (!gameState.config.autoSave) return;
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(gameState, null, 2));
    } catch (error) {
        console.error('⚠️ Erreur sauvegarde:', error.message);
    }
}

let gameState = loadGameState();

// Rate limiter anti-soumissions concurrentes (clé: teamId:universeId:activityId)
const lastSubmissions = new Map();

// ============================================
// 🔒 MIDDLEWARE D'AUTHENTIFICATION
// ============================================

function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_SECRET) {
        return res.status(401).json({ error: 'API Key invalide' });
    }
    next();
}

function validateTeamToken(req, res, next) {
    const { teamId, token } = req.body;
    const team = gameState.teams[teamId];
    if (!team || team.token !== token) {
        return res.status(403).json({ error: 'Token équipe invalide' });
    }
    req.team = team;
    next();
}

// ============================================
// 📡 ROUTES API REST
// ============================================

// --- Health Check ---
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        players: Object.keys(gameState.teams).length,
        gameStatus: gameState.status,
        phase: gameState.phase,
        timer: gameState.globalTimer,
        uptime: process.uptime()
    });
});

// --- Génération d'avatar IA (Proxy vers Hugging Face) ---
// Même pattern que generate.php : le serveur fait le call HF et renvoie le blob image
const HF_TOKEN = process.env.HF_TOKEN || '';
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';

app.post('/api/generate-avatar', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt requis' });
    }

    try {
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Accept': '*/*'
            },
            body: JSON.stringify({
                inputs: prompt,
                options: { wait_for_model: true }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HF API Error (${response.status}):`, errorText);
            return res.status(response.status).json({
                error: `Hugging Face API error: ${response.status}`,
                details: errorText
            });
        }

        // Récupérer l'image binaire et la renvoyer au client
        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache 24h
        res.send(Buffer.from(buffer));

    } catch (err) {
        console.error('Avatar generation proxy error:', err);
        res.status(500).json({ error: 'Erreur serveur lors de la génération' });
    }
});

// --- État complet (protégé pour Admin) ---
app.get('/api/state', validateApiKey, (req, res) => {
    res.json(gameState);
});

// --- Gestion des Équipes ---

// Créer une équipe
app.post('/api/teams', (req, res) => {
    const { name, avatar, members = [] } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Nom d\'équipe requis (min 2 caractères)' });
    }

    // Vérifier si l'équipe existe déjà (Reconnexion / Multi-device)
    const existingTeam = Object.values(gameState.teams).find(t => t.name.toLowerCase() === name.trim().toLowerCase());

    if (existingTeam) {
        // En mode "soirée", on autorise la connexion simple par nom d'équipe
        // Cela permet à plusieurs téléphones de jouer pour la même équipe
        console.log(`🔄 Reconnexion à l'équipe existante: ${existingTeam.name} (${existingTeam.id})`);

        // Mettre à jour l'avatar si fournis (optionnel)
        if (avatar && avatar !== 'default') {
            existingTeam.avatar = avatar;
        }

        return res.json({
            success: true,
            teamId: existingTeam.id,
            token: existingTeam.token, // On renvoie le token pour permettre la connexion
            team: getPublicTeam(existingTeam.id),
            message: 'Reconnexion réussie'
        });
    }

    // Limite d'équipes
    if (Object.keys(gameState.teams).length >= gameState.config.maxTeams) {
        return res.status(400).json({ error: 'Nombre maximum d\'équipes atteint' });
    }

    const teamId = 'team_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    const token = 'tkn_' + Math.random().toString(36).substr(2, 16);

    gameState.teams[teamId] = {
        id: teamId,
        token,
        name: name.trim(),
        avatar: avatar || 'default',
        members: members.slice(0, 10), // Max 10 membres
        score: 0,
        completions: {}, // { "universeId:activityId": bestScore }
        completedUniverses: [],
        completedActivities: [],
        connected: false,
        createdAt: Date.now(),
        lastActivity: Date.now()
    };

    // Log historique
    addHistoryLog('TEAM_CREATED', `Équipe "${name}" inscrite au programme Multivers`);

    io.emit('teams:update', getPublicTeams());
    saveGameState();

    res.json({
        success: true,
        teamId,
        token, // Envoyé une seule fois, à stocker côté client
        team: getPublicTeam(teamId)
    });
});

// Liste des équipes (info publique)
app.get('/api/teams', (req, res) => {
    res.json({
        teams: getPublicTeams(),
        count: Object.keys(gameState.teams).length
    });
});

// Détails d'une équipe
app.get('/api/teams/:teamId', (req, res) => {
    const team = gameState.teams[req.params.teamId];
    if (!team) {
        return res.status(404).json({ error: 'Équipe non trouvée' });
    }
    res.json(getPublicTeam(req.params.teamId));
});

// Supprimer une équipe (Admin)
app.delete('/api/teams/:teamId', validateApiKey, (req, res) => {
    const { teamId } = req.params;
    if (!gameState.teams[teamId]) {
        return res.status(404).json({ error: 'Équipe non trouvée' });
    }

    const name = gameState.teams[teamId].name;
    delete gameState.teams[teamId];

    addHistoryLog('TEAM_REMOVED', `Équipe "${name}" retirée du programme`);
    io.emit('teams:update', getPublicTeams());
    saveGameState();

    res.json({ success: true });
});

// --- Système de Score ---

// Endpoint POST /api/score - Validation sécurisée d'une activité
app.post('/api/score', (req, res) => {
    const { teamId, token, universeId, activityId, points, success, metadata = {} } = req.body;

    // Validation du token équipe
    const team = gameState.teams[teamId];
    if (!team) {
        return res.status(404).json({ error: 'Équipe non trouvée' });
    }
    if (team.token !== token) {
        return res.status(403).json({ error: 'Token invalide' });
    }
    // Rate limit: 1.5s minimum entre deux soumissions identiques
    const scoreKey = `${teamId}:${universeId}:${activityId}`;
    const lastTime = lastSubmissions.get(scoreKey) || 0;
    if (Date.now() - lastTime < 1500) {
        return res.status(429).json({ error: 'Soumission trop rapide, attendez un instant' });
    }
    lastSubmissions.set(scoreKey, Date.now());

    // Vérifier que le jeu est en cours (ou session active ou lobby pour tests)
    const isGlobalPlaying = gameState.status === 'PLAYING';
    const isLobby = gameState.status === 'LOBBY';
    const isSessionNightActive = gameState.sessionNight && gameState.sessionNight.status !== 'DRAFT' && gameState.sessionNight.status !== 'SESSION_COMPLETE';

    if (!isGlobalPlaying && !isSessionNightActive && !isLobby) {
        return res.status(400).json({ error: 'Le jeu n\'est pas en cours' });
    }

    // --- Validation Spécifique Session Night ---
    if (isSessionNightActive) {
        const sn = gameState.sessionNight;
        const currentUniv = sn.universes[sn.currentUniverseIndex];

        if (sn.status === 'INTRO' || !currentUniv || currentUniv.universeId !== universeId) {
            return res.status(403).json({ error: 'Cet univers n\'est pas actif' });
        }

        const isChallenge = currentUniv.selectedChallengeIds.includes(activityId);
        const isQuiz = currentUniv.quizActivityId === activityId;

        if (sn.status === 'UNIVERSE_ACTIVE') {
            if (!isChallenge) return res.status(403).json({ error: 'Activité non autorisée dans cette phase' });
        } else if (sn.status === 'QUIZ_ACTIVE') {
            if (!isQuiz) return res.status(403).json({ error: 'Seul le Quiz est autorisé maintenant' });
        }
    }

    if (success) {
        // --- Application Autoritaire du Score ---
        const result = applyScoreUpdate({
            teamId,
            universeId,
            activityId,
            points,
            success,
            metadata
        });

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            success: true,
            points: result.finalPoints,
            newScore: result.newScore,
            delta: result.delta,
            rank: calculateTeamRank(teamId)
        });
    } else {
        // Échec enregistré mais pas de points
        addHistoryLog('ATTEMPT', `${team.name} tente ${universeId}/${activityId}...`, teamId);
        res.json({ success: false, message: 'Échec enregistré' });
    }
});

// Classement
app.get('/api/leaderboard', (req, res) => {
    res.json({
        ranking: calculateRanking(),
        lastUpdate: Date.now()
    });
});

// Ajustement manuel des points (Admin)
app.post('/api/score/adjust', validateApiKey, (req, res) => {
    const { teamId, points, reason } = req.body;

    const team = gameState.teams[teamId];
    if (!team) {
        return res.status(404).json({ error: 'Équipe non trouvée' });
    }

    team.score += points;
    addHistoryLog('ADMIN_ADJUST', `[ARBITRAGE] ${team.name}: ${points > 0 ? '+' : ''}${points}pts - ${reason}`, teamId);

    io.emit('score:update', {
        teamId,
        newScore: team.score,
        ranking: calculateRanking()
    });
    io.emit('teams:update', getPublicTeams());
    saveGameState();

    res.json({ success: true, newScore: team.score });
});

// --- Game State Manager ---

// Changer le statut du jeu
app.post('/api/game/status', validateApiKey, (req, res) => {
    const { status, timer } = req.body;
    const validStatuses = ['LOBBY', 'PLAYING', 'PAUSED', 'ENDED'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }

    const oldStatus = gameState.status;
    gameState.status = status;

    if (status === 'PLAYING' && !gameState.startTime) {
        gameState.startTime = Date.now();
        if (timer) gameState.globalTimer = timer;
        startGameLoop();
    }

    if (status === 'ENDED') {
        stopGameLoop();
    }

    addHistoryLog('STATUS', `État du jeu: ${oldStatus} → ${status}`);
    io.emit('game:status', status);
    io.emit('game:fullState', getGameStateBroadcast());
    saveGameState();

    res.json({ success: true, status });
});

// Changer la phase narrative
app.post('/api/game/phase', validateApiKey, (req, res) => {
    const { phase } = req.body;
    const validPhases = ['INITIALISATION', 'ANOMALIES', 'CONVERGENCE', 'EPILOGUE'];

    if (!validPhases.includes(phase)) {
        return res.status(400).json({ error: 'Phase invalide' });
    }

    gameState.phase = phase;
    addHistoryLog('PHASE', `Phase narrative: ${phase}`);

    // Effets automatiques par phase
    switch (phase) {
        case 'ANOMALIES':
            triggerScenarioEvent({ name: 'PHASE_ANOMALIES', description: 'Des anomalies apparaissent dans le Multivers!' });
            break;
        case 'CONVERGENCE':
            gameState.config.pointsMultiplier = 2;
            triggerScenarioEvent({ name: 'MORT_SUBITE', description: 'Points doublés! Dernière ligne droite!' });
            break;
        case 'EPILOGUE':
            gameState.status = 'ENDED';
            stopGameLoop();
            break;
    }

    io.emit('game:phase', phase);
    io.emit('game:fullState', getGameStateBroadcast());
    saveGameState();

    res.json({ success: true, phase });
});

// Déclencher un événement scénaristique
app.post('/api/game/event', validateApiKey, (req, res) => {
    const { name, description, duration, effect } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nom de l\'événement requis' });
    }

    const event = triggerScenarioEvent({ name, description, duration, effect });
    res.json({ success: true, event });
});

// Liste des événements prédéfinis
app.get('/api/game/events', (req, res) => {
    res.json({
        available: PREDEFINED_EVENTS,
        active: gameState.activeEffects,
        history: gameState.scenarioEvents.slice(-20)
    });
});

// Reset complet (Admin) - Soft Reset : scores à 0, session Night supprimée, joueurs conservés
app.post('/api/game/reset', validateApiKey, (req, res) => {
    console.log('🔄 SOFT RESET demandé par Admin');

    // 1. Arrêter les boucles actives
    stopGameLoop();
    stopSessionTicker();

    // 2. Réinitialiser les scores des équipes (garder les équipes connectées)
    const keptTeams = gameState.teams || {};
    Object.values(keptTeams).forEach(t => {
        t.score = 0;
        t.completions = {};
        t.completedActivities = [];
        t.playerState = {};
    });

    // 3. Garder le status actuel (NE PAS mettre LOBBY pour ne pas éjecter les joueurs)
    //    Remettre à LOBBY seulement si le jeu n'était pas en cours
    const previousStatus = gameState.status;
    const newStatus = (previousStatus === 'PLAYING' || previousStatus === 'PAUSED') ? 'LOBBY' : 'LOBBY';

    // 4. Réinitialiser l'état global en conservant les équipes et le config
    gameState = {
        ...defaultGameState,
        status: newStatus,
        teams: keptTeams,
        config: { ...defaultGameState.config, ...gameState.config, pointsMultiplier: 1 },
        sessionNight: null,
    };

    saveGameState();

    // 5. Notifier les clients — on envoie l'état complet (game:fullState contient sessionNight: null)
    //    On N'envoie PAS game:status séparément pour éviter les side-effects côté joueurs
    io.emit('sessionNight:state', null);          // Fermer la session Night côté WarRoom/joueurs
    io.emit('teams:update', getPublicTeams());    // Scores remis à 0
    io.emit('game:fullState', getGameStateBroadcast()); // État complet (inclut status + sessionNight)

    addHistoryLog('ADMIN', '🔄 Jeu réinitialisé — Scores remis à 0');

    res.json({ success: true, message: 'Jeu réinitialisé (équipes conservées, scores à 0)' });
});


// ============================================
// 🎮 ÉVÉNEMENTS PRÉDÉFINIS
// ============================================

const PREDEFINED_EVENTS = [
    {
        id: 'GLITCH_UNIVERSEL',
        name: 'Glitch Universel',
        description: 'Une anomalie temporelle déforme la réalité!',
        effect: 'GLITCH',
        duration: 30000
    },
    {
        id: 'ALERTE_ROUGE',
        name: 'Alerte Rouge',
        description: 'Intrusion détectée dans le système!',
        effect: 'ALERT',
        duration: 20000
    },
    {
        id: 'BONUS_COSMIQUE',
        name: 'Bonus Cosmique',
        description: 'Points x2 temporaire pour tous!',
        effect: 'BONUS',
        duration: 60000
    },
    {
        id: 'INVASION_BOWSER',
        name: 'Invasion Bowser',
        description: 'L\'univers Mario est attaqué!',
        effect: 'INVASION',
        duration: 45000
    },
    {
        id: 'PANNE_MATRICE',
        name: 'Panne de la Matrice',
        description: 'Le code source devient instable...',
        effect: 'MATRIX_GLITCH',
        duration: 25000
    }
];

function triggerScenarioEvent({ name, description, duration = 30000, effect }) {
    const event = {
        id: Date.now(),
        name,
        description: description || `Événement: ${name}`,
        effect: effect || name.toUpperCase().replace(/\s/g, '_'),
        startTime: Date.now(),
        duration,
        endTime: Date.now() + duration
    };

    gameState.scenarioEvents.push(event);

    // Ajouter l'effet actif
    if (effect) {
        gameState.activeEffects.push({
            effect,
            endTime: event.endTime
        });
    }

    addHistoryLog('EVENT', `⚡ ${event.name}: ${event.description}`);
    io.emit('scenario:event', event);

    // Auto-cleanup de l'effet après expiration
    if (effect && duration > 0) {
        setTimeout(() => {
            gameState.activeEffects = gameState.activeEffects.filter(e => e.endTime > Date.now());
            io.emit('scenario:effectEnd', { effect });
        }, duration);
    }

    saveGameState();
    return event;
}

// ============================================
// ⏱️ GAME LOOP
// ============================================

let gameInterval = null;
let timerInterval = null;

function startGameLoop() {
    if (timerInterval) return;

    console.log('🎮 Démarrage de la boucle de jeu...');

    timerInterval = setInterval(() => {
        if (gameState.status === 'PLAYING') {
            if (gameState.globalTimer > 0) {
                gameState.globalTimer--;
                io.emit('timer:update', gameState.globalTimer);

                // Changements de phase automatiques
                checkPhaseTransitions();

                // Nettoyage des effets expirés
                gameState.activeEffects = gameState.activeEffects.filter(e => e.endTime > Date.now());
            } else {
                // Temps écoulé
                gameState.status = 'ENDED';
                gameState.phase = 'EPILOGUE';
                io.emit('game:status', 'ENDED');
                io.emit('game:phase', 'EPILOGUE');
                io.emit('game:ended', { ranking: calculateRanking() });
                stopGameLoop();
            }
        }
    }, 1000);
}

let sessionInterval = null;

function startSessionTicker() {
    if (sessionInterval) return;
    console.log('🌙 Démarrage du ticker Session Night...');

    sessionInterval = setInterval(() => {
        if (gameState.sessionNight && gameState.sessionNight.status === 'UNIVERSE_ACTIVE') {
            const sn = gameState.sessionNight;
            // Decrementer seulement si > 0
            if (sn.tickRemainingSeconds !== null && sn.tickRemainingSeconds > 0) {
                sn.tickRemainingSeconds--;
                // Emit timer update (optimised: just the time, not full state)
                io.emit('sessionNight:time', sn.tickRemainingSeconds);
            }

            // Check fin du temps
            if (sn.tickRemainingSeconds !== null && sn.tickRemainingSeconds <= 0) {
                console.log('⏰ Fin du temps univers Session Night -> Activation Quiz');
                sn.status = 'QUIZ_ACTIVE';
                sn.tickRemainingSeconds = 0; // Ensure 0
                io.emit('sessionNight:state', sn);
                io.emit('sessionNight:alert', { message: 'LE QUIZ EST OUVERT !', type: 'info' });
                saveGameState();
            }
        }
    }, 1000);
}

function stopSessionTicker() {
    if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
        console.log('🌙 Arrêt du ticker Session Night');
    }
}

function stopGameLoop() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    console.log('⏹️ Boucle de jeu arrêtée');
}

function checkPhaseTransitions() {
    const elapsed = 3600 - gameState.globalTimer; // Temps écoulé en secondes
    const totalTime = 3600;

    // Transitions automatiques basées sur le temps
    if (elapsed >= totalTime * 0.25 && gameState.phase === 'INITIALISATION') {
        gameState.phase = 'ANOMALIES';
        io.emit('game:phase', 'ANOMALIES');
        triggerScenarioEvent(PREDEFINED_EVENTS.find(e => e.id === 'GLITCH_UNIVERSEL'));
    }

    if (elapsed >= totalTime * 0.75 && gameState.phase === 'ANOMALIES') {
        gameState.phase = 'CONVERGENCE';
        gameState.config.pointsMultiplier = 2;
        io.emit('game:phase', 'CONVERGENCE');
        triggerScenarioEvent(PREDEFINED_EVENTS.find(e => e.id === 'BONUS_COSMIQUE'));
    }

    if (elapsed >= totalTime * 0.95 && gameState.phase === 'CONVERGENCE') {
        triggerScenarioEvent({
            name: 'BOSS_FINAL',
            description: 'Le Boss Final approche!',
            effect: 'BOSS',
            duration: 120000
        });
    }
}

// ============================================
// 🔌 SOCKET.IO (Temps Réel)
// ============================================

io.on('connection', (socket) => {
    console.log('🔗 Nouveau client:', socket.id);

    // Identification
    socket.on('identify', ({ type, teamId, token }) => {
        socket.clientType = type;

        if (type === 'TEAM' && teamId && gameState.teams[teamId]) {
            const team = gameState.teams[teamId];
            // Optionnel: vérifier le token pour plus de sécurité
            team.connected = true;
            team.socketId = socket.id;
            socket.teamId = teamId;
            socket.join('teams');
            socket.join(`team:${teamId}`); // Room dédiée à l'équipe
            console.log(`👥 Équipe "${team.name}" connectée`);

            socket.emit('team:state', getPublicTeam(teamId));
            socket.emit('game:state', getGameStateForTeam(teamId));

            // Sync with Session Night if active
            if (gameState.sessionNight && gameState.sessionNight.status !== 'DRAFT' && gameState.sessionNight.status !== 'SESSION_COMPLETE') {
                const sn = gameState.sessionNight;
                if (!sn.perTeam[teamId]) {
                    sn.perTeam[teamId] = { score: team.score, connected: true };
                } else {
                    sn.perTeam[teamId].connected = true;
                    // Optionnel: resync score si besoin
                    sn.perTeam[teamId].score = team.score;
                }
                io.emit('sessionNight:state', sn);
            }

            // Envoyer l'état complet du joueur si disponible (Synchro multi-device)
            if (team.playerState) {
                console.log(`📥 Envoi de la sauvegarde joueur à ${team.name}`);
                socket.emit('player:loadState', team.playerState);
            }
        } else if (type === 'DASHBOARD') {
            socket.join('dashboards');
            socket.emit('game:fullState', getGameStateBroadcast());
            console.log('📺 Dashboard connecté');
        } else if (type === 'WARROOM') {
            socket.join('warrooms');
            socket.emit('game:fullState', getGameStateBroadcast());
            console.log('🎬 War Room connectée');
        } else if (type === 'ADMIN') {
            socket.join('admins');
            socket.emit('game:fullState', getGameStateBroadcast());
            console.log('👑 Admin connecté');
        }
    });

    // Réception de score (alternative au REST)
    socket.on('activity:complete', ({ teamId, token, universeId, activityId, points, success, metadata }) => {
        const team = gameState.teams[teamId];
        if (!team || (token && team.token !== token)) {
            socket.emit('error', { message: 'Authentification échouée' });
            return;
        }

        const isGlobalPlaying = gameState.status === 'PLAYING';
        const isLobby = gameState.status === 'LOBBY';
        const isSessionNightActive = gameState.sessionNight && gameState.sessionNight.status !== 'DRAFT' && gameState.sessionNight.status !== 'SESSION_COMPLETE';

        if (!isGlobalPlaying && !isSessionNightActive && !isLobby) {
            socket.emit('error', { message: 'Le jeu n\'est pas en cours' });
            return;
        }

        if (isLobby) console.log(`[LOBBY] Score submission allow for ${team.name}`);

        if (success) {
            // --- Validation Spécifique Session Night ---
            if (isSessionNightActive) {
                const sn = gameState.sessionNight;
                const currentUniv = sn.universes[sn.currentUniverseIndex];

                if (sn.status === 'UNIVERSE_ACTIVE' && currentUniv) {
                    const isChallenge = currentUniv.selectedChallengeIds.includes(activityId);
                    if (!isChallenge) return socket.emit('error', { message: 'Activité non autorisée' });
                } else if (sn.status === 'QUIZ_ACTIVE' && currentUniv) {
                    // 🔒 LOCK Challenges, UNLOCK Quiz
                    const isQuiz = currentUniv.quizActivityId === activityId;
                    if (!isQuiz) return socket.emit('error', { message: 'Challenges verrouillés. Seul le Quiz est autorisé.' });
                } else {
                    // INTRO, UNIVERSE_COMPLETE...
                    return socket.emit('error', { message: 'Activité actuellement verrouillée.' });
                }
            }

            // --- Application Autoritaire ---
            const result = applyScoreUpdate({
                teamId,
                universeId,
                activityId,
                points,
                success,
                metadata
            });

            if (result.error) {
                socket.emit('error', { message: result.error });
            } else {
                socket.emit('activity:validated', {
                    points: result.finalPoints,
                    newScore: result.newScore,
                    delta: result.delta
                });
            }
        }
    });

    // Synchronisation de l'état complet du joueur (Inventaire, Univers débloqués)
    socket.on('player:sync', ({ teamId, state: pState }) => {
        const team = gameState.teams[teamId];
        if (team && pState) {
            console.log(`💾 Sauvegarde joueur reçue pour ${team.name}`);
            team.playerState = pState;

            // Robustesse : Synchroniser le score global si fourni
            if (typeof pState.points === 'number') {
                team.score = pState.points;
            }

            // Robustesse : Synchroniser avec Session Night si active
            if (gameState.sessionNight && gameState.sessionNight.status !== 'DRAFT' && gameState.sessionNight.status !== 'SESSION_COMPLETE') {
                const sn = gameState.sessionNight;
                if (!sn.perTeam[teamId]) {
                    sn.perTeam[teamId] = { score: 0, connected: true };
                }
                sn.perTeam[teamId].score = team.score;
                sn.perTeam[teamId].connected = true;
                io.emit('sessionNight:state', sn);
            }

            saveGameState();

            // Sync autres appareils
            socket.to(`team:${teamId}`).emit('player:loadState', pState);
            socket.emit('player:synced', { success: true, timestamp: Date.now() });
        }
    });

    // Actions Admin via Socket
    socket.on('admin:action', (action) => {
        if (!socket.rooms.has('admins')) {
            socket.emit('error', { message: 'Action non autorisée' });
            return;
        }

        console.log('👑 Action Admin:', action.type);

        switch (action.type) {
            case 'NEW_SESSION':
                // Reset complet : supprime toutes les équipes, remet en LOBBY
                stopGameLoop();
                stopSessionTicker();
                // Notifier les joueurs connectés avant de les éjecter
                io.to('teams').emit('team:ejected', { reason: 'new_session', message: 'Nouvelle soirée démarrée — reconnectez-vous !' });
                gameState = {
                    ...defaultGameState,
                    status: 'LOBBY',
                    teams: {},
                    config: { ...defaultGameState.config },
                    sessionNight: null,
                };
                saveGameState();
                io.emit('sessionNight:state', null);
                io.emit('teams:update', getPublicTeams());
                io.emit('game:fullState', getGameStateBroadcast());
                addHistoryLog('ADMIN', '🆕 Nouvelle soirée — Lobby ouvert');
                break;

            case 'START_GAME':
                gameState.status = 'PLAYING';
                gameState.startTime = Date.now();
                startGameLoop();
                io.emit('game:status', 'PLAYING');
                io.emit('game:fullState', getGameStateBroadcast());
                break;

            case 'PAUSE_GAME':
                gameState.status = 'PAUSED';
                io.emit('game:status', 'PAUSED');
                break;

            case 'RESUME_GAME':
                gameState.status = 'PLAYING';
                io.emit('game:status', 'PLAYING');
                break;

            case 'END_GAME':
                gameState.status = 'ENDED';
                stopGameLoop();
                io.emit('game:status', 'ENDED');
                io.emit('game:ended', { ranking: calculateRanking() });
                break;

            case 'TRIGGER_EVENT':
                if (action.payload) {
                    triggerScenarioEvent(action.payload);
                }
                break;

            case 'ADJUST_SCORE':
                if (action.payload && action.payload.teamId) {
                    const team = gameState.teams[action.payload.teamId];
                    if (team) {
                        team.score += action.payload.points;
                        addHistoryLog('ADMIN_ADJUST', `[ARBITRAGE] ${team.name}: ${action.payload.points}pts`, action.payload.teamId);

                        // Broadcast score update global
                        io.emit('score:update', {
                            teamId: action.payload.teamId,
                            newScore: team.score,
                            delta: action.payload.points,
                            ranking: calculateRanking()
                        });

                        // Targeted Sync
                        io.to(`team:${action.payload.teamId}`).emit('team:state', getPublicTeam(action.payload.teamId));

                        // Sync with Session Night if active
                        if (gameState.sessionNight && gameState.sessionNight.status !== 'DRAFT' && gameState.sessionNight.status !== 'SESSION_COMPLETE') {
                            const sn = gameState.sessionNight;
                            if (!sn.perTeam[action.payload.teamId]) {
                                sn.perTeam[action.payload.teamId] = { score: 0, connected: true };
                            }
                            sn.perTeam[action.payload.teamId].score = team.score;
                            io.emit('sessionNight:state', sn);
                        }
                    }
                }
                break;

            case 'SET_TIMER':
                if (action.payload && action.payload.seconds) {
                    gameState.globalTimer = action.payload.seconds;
                    io.emit('timer:update', gameState.globalTimer);
                }
                break;

            // ═══════════════════════════════════════════════════════════════
            // 🌙 COMMANDES SESSION NIGHT
            // ═══════════════════════════════════════════════════════════════
            case 'SESSION_CREATE':
                stopGameLoop();
                stopSessionTicker();
                // Reset complet si pas déjà en LOBBY (ex: vient de AdminPanel directement)
                // Si déjà en LOBBY (AdminLanding l'a déjà ouvert), on garde les équipes inscrites
                if (gameState.status !== 'LOBBY') {
                    io.to('teams').emit('team:ejected', { reason: 'new_session', message: 'Nouvelle soirée démarrée — reconnectez-vous !' });
                    gameState.teams = {};
                    gameState.history = [];
                    gameState.activeEffects = [];
                    gameState.config = { ...defaultGameState.config };
                }
                gameState.status = 'LOBBY';
                gameState.phase = 'INITIALISATION';
                gameState.startTime = null;
                gameState.sessionNight = {
                    id: Date.now().toString(),
                    status: 'DRAFT',
                    introVideoUrl: action.payload.introVideoUrl || null,
                    universes: action.payload.universes || [],
                    currentUniverseIndex: 0,
                    universeEndsAt: null,
                    tickRemainingSeconds: null,
                    perTeam: {},
                    universeWinners: [],
                    coop: { requiredTalismans: action.payload.requiredTalismans || 50, foundTalismans: 0, isSuccess: null }
                };
                io.emit('teams:update', getPublicTeams());
                io.emit('game:fullState', getGameStateBroadcast());
                io.emit('sessionNight:state', gameState.sessionNight);
                addHistoryLog('ADMIN', '🌙 Session Night créée — Lobby ouvert');
                break;

            case 'SESSION_LAUNCH':
                if (gameState.sessionNight && gameState.sessionNight.status === 'DRAFT') {
                    gameState.sessionNight.status = 'INTRO';
                    gameState.status = 'PLAYING'; // Libère les joueurs du salon d'attente
                    gameState.startTime = Date.now();
                    io.emit('sessionNight:state', gameState.sessionNight);
                    io.emit('game:fullState', getGameStateBroadcast());
                    // Lancer la vidéo d'intro sur la WarRoom si définie
                    if (gameState.sessionNight.introVideoUrl) {
                        io.to('warrooms').emit('warroom:video', { url: gameState.sessionNight.introVideoUrl });
                    }
                    addHistoryLog('ADMIN', '▶️ Session lancée — Intro en cours');
                }
                break;

            // Retour au QG (depuis INTRO ou UNIVERSE_COMPLETE)
            case 'SESSION_INTRO_END':
            case 'SESSION_OPEN_HEADQUARTERS':
                if (gameState.sessionNight && ['INTRO', 'UNIVERSE_COMPLETE'].includes(gameState.sessionNight.status)) {
                    stopSessionTicker();
                    gameState.sessionNight.status = 'HEADQUARTERS';
                    gameState.sessionNight.tickRemainingSeconds = null;
                    gameState.sessionNight.universeEndsAt = null;
                    gameState.themeUniverse = 'default';
                    io.emit('sessionNight:state', gameState.sessionNight);
                    io.emit('warroom:theme', 'default');
                    addHistoryLog('ADMIN', '🏛️ Quartier Général — débrief en cours');
                }
                break;

            case 'SESSION_OPEN_UNIVERSE':
                if (gameState.sessionNight && ['HEADQUARTERS', 'UNIVERSE_COMPLETE'].includes(gameState.sessionNight.status)) {
                    const sn = gameState.sessionNight;
                    const targetUniverseId = action.payload?.universeId;

                    let targetIndex = sn.currentUniverseIndex;
                    if (targetUniverseId) {
                        const foundIndex = sn.universes.findIndex(u => u.universeId === targetUniverseId);
                        if (foundIndex !== -1) targetIndex = foundIndex;
                    }

                    if (targetIndex < sn.universes.length) {
                        stopSessionTicker();
                        sn.currentUniverseIndex = targetIndex;
                        sn.status = 'UNIVERSE_ACTIVE';
                        const u = sn.universes[targetIndex];
                        sn.tickRemainingSeconds = u.durationSeconds;
                        sn.universeEndsAt = Date.now() + (u.durationSeconds * 1000);
                        // Thème WarRoom de l'univers
                        gameState.themeUniverse = u.universeId;
                        io.emit('warroom:theme', u.universeId);
                        // Vidéo d'intro d'univers si définie
                        if (u.videoUrl) {
                            io.to('warrooms').emit('warroom:video', { url: u.videoUrl });
                        }
                        startSessionTicker();
                        io.emit('sessionNight:state', sn);
                        io.emit('game:fullState', getGameStateBroadcast());
                        addHistoryLog('ADMIN', `🚀 Univers ${targetIndex + 1}/${sn.universes.length} ouvert : ${u.universeId}`);
                        saveGameState();
                    }
                }
                break;

            case 'SESSION_FORCE_END_UNIVERSE':
                if (gameState.sessionNight && gameState.sessionNight.status === 'UNIVERSE_ACTIVE') {
                    stopSessionTicker();
                    gameState.sessionNight.tickRemainingSeconds = 0;
                    gameState.sessionNight.universeEndsAt = null;
                    gameState.sessionNight.status = 'QUIZ_ACTIVE';
                    io.emit('sessionNight:state', gameState.sessionNight);
                    io.emit('sessionNight:alert', { message: 'LE QUIZ EST OUVERT !', type: 'info' });
                    addHistoryLog('ADMIN', '⚠️ Quiz forcé — fin d\'univers anticipée');
                }
                break;

            case 'SESSION_CLOSE_QUIZ':
                // Fin de l'univers actuel
                if (gameState.sessionNight) {
                    const sn = gameState.sessionNight;
                    sn.status = 'UNIVERSE_COMPLETE';

                    const currentUnivId = sn.universes[sn.currentUniverseIndex].universeId;
                    const currentUnivData = sn.universes[sn.currentUniverseIndex];

                    // Calcul du TOP 3 pour l'univers
                    const teamScores = Object.entries(sn.perTeam).map(([tId, stats]) => ({
                        teamId: tId,
                        teamName: gameState.teams[tId]?.name || `Équipe ${tId}`,
                        points: stats.perUniversePoints?.[currentUnivId] || 0,
                    })).sort((a, b) => b.points - a.points);

                    const top3 = teamScores.slice(0, 3);

                    // Calcul du classement général de la session
                    const generalRanking = Object.entries(sn.perTeam).map(([tId, stats]) => ({
                        teamId: tId,
                        teamName: gameState.teams[tId]?.name || `Équipe ${tId}`,
                        totalPoints: Object.values(stats.perUniversePoints || {}).reduce((s, p) => s + p, 0),
                        score: gameState.teams[tId]?.score || 0,
                    })).sort((a, b) => b.score - a.score);

                    // Enregistrer le vainqueur
                    if (top3.length > 0 && top3[0].points > 0) {
                        sn.universeWinners.push({
                            universeId: currentUnivId,
                            teamId: top3[0].teamId,
                            points: top3[0].points
                        });
                    }

                    // Émettre le podium complet
                    io.emit('sessionNight:universeWinner', {
                        universeId: currentUnivId,
                        universeName: currentUnivData.universeName || currentUnivId,
                        top3,
                        generalRanking,
                    });

                    io.emit('sessionNight:state', sn);
                    saveGameState();
                }
                break;

            case 'SESSION_NEXT_UNIVERSE':
                if (gameState.sessionNight && gameState.sessionNight.status === 'UNIVERSE_COMPLETE') {
                    stopSessionTicker();
                    const sn = gameState.sessionNight;
                    sn.currentUniverseIndex++;
                    if (sn.currentUniverseIndex >= sn.universes.length) {
                        // Dernier univers terminé → SESSION_COMPLETE
                        sn.status = 'SESSION_COMPLETE';
                        gameState.status = 'ENDED';
                        sn.coop.isSuccess = sn.coop.foundTalismans >= sn.coop.requiredTalismans;
                        io.emit('sessionNight:complete', { coop: sn.coop, winners: sn.universeWinners });
                        io.emit('game:fullState', getGameStateBroadcast());
                        addHistoryLog('ADMIN', '🏁 Fin de session — podium final');
                    } else {
                        // Retour au QG entre deux univers
                        sn.status = 'HEADQUARTERS';
                        gameState.themeUniverse = 'default';
                        io.emit('warroom:theme', 'default');
                        addHistoryLog('ADMIN', `⏭️ QG — univers ${sn.currentUniverseIndex + 1}/${sn.universes.length} suivant`);
                    }
                    io.emit('sessionNight:state', sn);
                    saveGameState();
                }
                break;

            case 'SESSION_END':
                if (gameState.sessionNight) {
                    stopSessionTicker();
                    gameState.sessionNight.status = 'SESSION_COMPLETE';
                    gameState.status = 'ENDED';
                    gameState.sessionNight.coop.isSuccess = gameState.sessionNight.coop.foundTalismans >= gameState.sessionNight.coop.requiredTalismans;
                    io.emit('sessionNight:state', gameState.sessionNight);
                    io.emit('sessionNight:complete', { coop: gameState.sessionNight.coop, winners: gameState.sessionNight.universeWinners });
                    io.emit('game:fullState', getGameStateBroadcast());
                    addHistoryLog('ADMIN', '🏁 Session terminée par le GM');
                }
                break;

            // ═══════════════════════════════════════════════════════════════
            // 🎬 HAPPENING — Bonus/Malus Cinématique
            // ═══════════════════════════════════════════════════════════════
            case 'SESSION_TRIGGER_HAPPENING':
                if (gameState.sessionNight) {
                    const sn = gameState.sessionNight;
                    const { happening } = action.payload; // { videoUrl, title, subtitle, description, effectType, effectDuration, bonusLabel, color }

                    // 1. Activer le multiplicateur côté serveur
                    if (happening.effectType === 'DOUBLE_POINTS') {
                        const durationMs = (happening.effectDuration || 300) * 1000;
                        gameState.config.pointsMultiplier = 2;
                        sn.happeningActive = true;
                        sn.happeningEndsAt = Date.now() + durationMs;

                        // Auto-reset du multiplicateur après la durée
                        setTimeout(() => {
                            if (gameState.config.pointsMultiplier === 2) {
                                gameState.config.pointsMultiplier = 1;
                            }
                            if (gameState.sessionNight) {
                                gameState.sessionNight.happeningActive = false;
                                gameState.sessionNight.happeningEndsAt = null;
                            }
                            io.emit('sessionNight:happeningEnd', { bonusLabel: happening.bonusLabel });
                            io.emit('sessionNight:state', gameState.sessionNight);
                            saveGameState();
                            console.log('🎬 Happening terminé — Multiplicateur remis à x1');
                        }, durationMs);
                    }

                    // 2. Envoyer la commande à la WarRoom pour afficher l'overlay
                    io.to('warrooms').emit('warroom:command', {
                        type: 'TRIGGER_HAPPENING',
                        payload: happening
                    });

                    // 3. Notifier tous les clients du bonus actif
                    io.emit('sessionNight:happeningStart', happening);
                    io.emit('sessionNight:state', sn);

                    addHistoryLog('HAPPENING', `🎬 Happening déclenché: ${happening.title}`);
                    console.log('🎬 Happening déclenché:', happening.title);
                }
                break;

            // ═══════════════════════════════════════════════════════════════
            // 🎬 PLAY VIDEO — Lecture vidéo plein écran sur WarRoom
            // ═══════════════════════════════════════════════════════════════
            case 'PLAY_VIDEO':
                io.to('warrooms').emit('warroom:video', { url: action.payload?.url || null });
                if (action.payload?.url) {
                    addHistoryLog('ADMIN', `🎬 Vidéo lancée sur WarRoom : ${action.payload.url}`);
                } else {
                    addHistoryLog('ADMIN', '⏹ Vidéo WarRoom arrêtée');
                }
                break;

            // ═══════════════════════════════════════════════════════════════
            // 📺 COMMANDES WAR ROOM
            // ═══════════════════════════════════════════════════════════════
            case 'WARROOM_COMMAND':
                // Relayer la commande à tous les WarRooms connectés
                console.log('📺 WarRoom Command:', action.payload);
                io.to('warrooms').emit('warroom:command', action.payload);
                break;

        }

        saveGameState();
    });

    // Demande d'état complet
    socket.on('request:fullState', () => {
        socket.emit('game:fullState', getGameStateBroadcast());
    });

    // Déconnexion
    // Déconnexion volontaire (Logout UI)
    socket.on('team:logout', () => {
        if (socket.teamId && gameState.teams[socket.teamId]) {
            console.log(`👋 Équipe "${gameState.teams[socket.teamId].name}" s'est déconnectée (Logout)`);
            gameState.teams[socket.teamId].connected = false;
            socket.leave(`team:${socket.teamId}`);
            delete socket.teamId; // Detach team from socket
            io.emit('teams:update', getPublicTeams());
        }
    });

    // Déconnexion Socket (Fermeture onglet)
    socket.on('disconnect', () => {
        console.log('❌ Client déconnecté:', socket.id);
        if (socket.teamId && gameState.teams[socket.teamId]) {
            gameState.teams[socket.teamId].connected = false;
            io.emit('teams:update', getPublicTeams());
        }
    });
});

// ============================================
// 🛠️ FONCTIONS UTILITAIRES
// ============================================

function addHistoryLog(type, message, teamId = null) {
    const log = {
        id: Date.now(),
        time: Date.now(),
        type,
        message,
        teamId
    };
    gameState.history.unshift(log);
    if (gameState.history.length > 100) gameState.history.pop();

    // Broadcast le nouveau log
    io.emit('history:new', log);
}

/**
 * 🎯 Système de Score Autoritaire & Idempotent (Single Source of Truth)
 * Gère le calcul du delta, la mise à jour du score global et le broadcast
 */
function applyScoreUpdate({ teamId, universeId, activityId, points, success, metadata = {} }) {
    const team = gameState.teams[teamId];
    if (!team || !success) return { error: 'Équipe invalide ou échec' };

    const finalPoints = Math.round(points * (gameState.config.pointsMultiplier || 1));
    const activityKey = `${universeId}:${activityId}`;

    if (!team.completions) team.completions = {};
    const previousBest = team.completions[activityKey] || 0;

    // 💡 LOGIQUE IDEMPOTENTE : On ne gagne des points que si on améliore son record
    const delta = Math.max(0, finalPoints - previousBest);
    const isNewProgression = delta > 0 || !team.completions[activityKey];

    if (isNewProgression) {
        team.score += delta;
        team.completions[activityKey] = Math.max(previousBest, finalPoints);
        team.lastActivity = Date.now();

        // 🔄 Sync completedActivities array for WarRoom/Dashboard
        if (!team.completedActivities) team.completedActivities = [];
        const existingIdx = team.completedActivities.findIndex(a => a.activityId === activityId && a.universeId === universeId);
        if (existingIdx >= 0) {
            team.completedActivities[existingIdx].points = team.completions[activityKey];
            team.completedActivities[existingIdx].timestamp = Date.now();
        } else {
            team.completedActivities.push({
                universeId,
                activityId,
                points: team.completions[activityKey],
                timestamp: Date.now()
            });
        }

        // Log historique seulement si progression réelle
        if (delta > 0) {
            addHistoryLog('SCORE', `${team.name}: ${universeId}/${activityId} (+${delta}pts)`, teamId);
        }
    }

    const ranking = calculateRanking();

    // 📢 1. BROADCAST GLOBAL (Leaderboards, War Room)
    io.emit('score:update', {
        teamId,
        newScore: team.score,
        delta,
        universeId,
        activityId,
        ranking,
        completedActivities: team.completedActivities // 🚀 Added for WarRoom/Dashboard real-time sync
    });

    // 🎯 2. SYNC CIBLÉE (Multi-device même équipe)
    // On renvoie l'état public complet à tous les sockets de CETTE équipe
    io.to(`team:${teamId}`).emit('team:state', getPublicTeam(teamId));

    // 🌙 3. SYNC SESSION NIGHT (Si active)
    if (gameState.sessionNight && gameState.sessionNight.status !== 'DRAFT' && gameState.sessionNight.status !== 'SESSION_COMPLETE') {
        const sn = gameState.sessionNight;
        if (!sn.perTeam[teamId]) {
            sn.perTeam[teamId] = { score: 0, connected: true, completed: {} };
        }

        // Sync score absolu pour cohérence
        sn.perTeam[teamId].score = team.score;
        sn.perTeam[teamId].connected = true;

        // Gestion Talismans / Coop Session
        const currentUniv = sn.universes[sn.currentUniverseIndex];
        if (currentUniv && currentUniv.universeId === universeId) {
            const isChallenge = currentUniv.selectedChallengeIds.includes(activityId);
            if (isChallenge && previousBest === 0) {
                // Premiére complétion d'un challenge de la session
                sn.coop.foundTalismans += 1;
                io.emit('sessionNight:talisman', { universeId, total: sn.coop.foundTalismans });
            }
        }

        io.emit('sessionNight:state', sn);
    }

    saveGameState();
    return { success: true, newScore: team.score, delta, finalPoints };
}

function getPublicTeam(teamId) {
    const team = gameState.teams[teamId];
    if (!team) return null;
    return {
        id: team.id,
        name: team.name,
        avatar: team.avatar,
        score: team.score,
        completedUniverses: team.completedUniverses,
        completedActivities: team.completedActivities, // Expose activity details for WarRoom
        connected: team.connected
    };
}

function getPublicTeams() {
    const teams = {};
    Object.keys(gameState.teams).forEach(id => {
        teams[id] = getPublicTeam(id);
    });
    return teams;
}

function calculateRanking() {
    return Object.values(gameState.teams)
        .map(t => ({
            id: t.id,
            name: t.name,
            avatar: t.avatar,
            score: t.score,
            completedUniverses: t.completedUniverses.length
        }))
        .sort((a, b) => b.score - a.score)
        .map((t, index) => ({ ...t, rank: index + 1 }));
}

function calculateTeamRank(teamId) {
    const ranking = calculateRanking();
    const team = ranking.find(t => t.id === teamId);
    return team ? team.rank : null;
}

function getGameStateBroadcast() {
    return {
        teams: getPublicTeams(),
        history: gameState.history.slice(0, 30),
        status: gameState.status,
        phase: gameState.phase,
        globalTimer: gameState.globalTimer,
        startTime: gameState.startTime,
        activeEffects: gameState.activeEffects,
        ranking: calculateRanking(),
        config: {
            pointsMultiplier: gameState.config.pointsMultiplier
        },
        sessionNight: gameState.sessionNight
    };
}

function getGameStateForTeam(teamId) {
    return {
        team: getPublicTeam(teamId),
        status: gameState.status,
        phase: gameState.phase,
        globalTimer: gameState.globalTimer,
        ranking: calculateRanking()
    };
}

// ============================================
// 🚀 DÉMARRAGE DU SERVEUR
// ============================================

// ============================================
// 🔄 BOOT RECOVERY — Restaure l'état actif au démarrage
// ============================================

function restoreSessionState() {
    if (!gameState.sessionNight) return;
    const sn = gameState.sessionNight;

    // Restaurer le multiplicateur happening si encore actif
    if (sn.happeningActive && sn.happeningEndsAt) {
        const remaining = sn.happeningEndsAt - Date.now();
        if (remaining > 0) {
            gameState.config.pointsMultiplier = 2;
            setTimeout(() => {
                if (gameState.config) gameState.config.pointsMultiplier = 1;
                if (gameState.sessionNight) {
                    gameState.sessionNight.happeningActive = false;
                    gameState.sessionNight.happeningEndsAt = null;
                }
                io.emit('sessionNight:happeningEnd', {});
                io.emit('sessionNight:state', gameState.sessionNight);
                saveGameState();
                console.log('🔄 Happening expiré (boot recovery)');
            }, remaining);
            console.log(`🔄 Happening restauré — expire dans ${Math.round(remaining / 1000)}s`);
        } else {
            // Happening expiré pendant le downtime
            gameState.config.pointsMultiplier = 1;
            sn.happeningActive = false;
            sn.happeningEndsAt = null;
            console.log('🔄 Happening expiré pendant le downtime → x1 rétabli');
            saveGameState();
        }
    }

    // Restaurer le ticker si univers actif
    if (sn.status === 'UNIVERSE_ACTIVE') {
        if (sn.universeEndsAt) {
            const remaining = Math.round((sn.universeEndsAt - Date.now()) / 1000);
            if (remaining > 0) {
                sn.tickRemainingSeconds = remaining;
                startSessionTicker();
                console.log(`🔄 Ticker Session Night restauré — ${remaining}s restants`);
            } else {
                // Temps écoulé pendant le downtime → passer en QUIZ automatiquement
                sn.status = 'QUIZ_ACTIVE';
                sn.tickRemainingSeconds = 0;
                console.log('🔄 Temps univers écoulé pendant le downtime → QUIZ_ACTIVE');
                saveGameState();
            }
        } else {
            // Pas de universeEndsAt (session créée avant cette version) → relancer le ticker
            startSessionTicker();
            console.log('🔄 Ticker Session Night relancé (pas de universeEndsAt)');
        }
    }
}

// SPA catch-all: toutes les routes non-API renvoient index.html
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n================================');
    console.log('🌌 MultiversQuest Server');
    console.log('================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`📊 Teams: ${Object.keys(gameState.teams).length}`);
    console.log(`🎮 Status: ${gameState.status}`);
    console.log(`🌙 Session: ${gameState.sessionNight ? gameState.sessionNight.status : 'aucune'}`);
    console.log('================================\n');
    // Restaurer les processus actifs (ticker, happening) si session en cours
    restoreSessionState();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n💾 Sauvegarde avant fermeture...');
    saveGameState();
    process.exit(0);
});

process.on('SIGTERM', () => {
    saveGameState();
    process.exit(0);
});
