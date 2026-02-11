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
    }
};

// Charger l'état depuis le fichier ou utiliser les valeurs par défaut
function loadGameState() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const saved = JSON.parse(data);
            console.log('💾 État du jeu chargé depuis le fichier');
            return { ...defaultGameState, ...saved };
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

    // Vérifier unicité du nom
    const existingNames = Object.values(gameState.teams).map(t => t.name.toLowerCase());
    if (existingNames.includes(name.toLowerCase())) {
        return res.status(400).json({ error: 'Ce nom d\'équipe existe déjà' });
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

    // Vérifier que le jeu est en cours
    if (gameState.status !== 'PLAYING') {
        return res.status(400).json({ error: 'Le jeu n\'est pas en cours', status: gameState.status });
    }

    // Calculer les points avec multiplicateur
    const finalPoints = Math.round(points * gameState.config.pointsMultiplier);

    // Vérification anti-triche basique (cooldown)
    const activityKey = `${universeId}:${activityId}`;
    const lastCompletion = team.completedActivities.find(a => a.key === activityKey);
    const now = Date.now();

    if (lastCompletion && (now - lastCompletion.time) < 5000) {
        return res.status(429).json({ error: 'Cooldown actif, réessayez dans quelques secondes' });
    }

    if (success) {
        // Ajouter les points
        team.score += finalPoints;
        team.lastActivity = now;

        // Tracker l'activité complétée
        if (!lastCompletion) {
            team.completedActivities.push({
                key: activityKey,
                universeId,
                activityId,
                time: now,
                points: finalPoints
            });
        } else {
            lastCompletion.time = now;
            lastCompletion.points = Math.max(lastCompletion.points, finalPoints);
        }

        // Marquer l'univers comme complété si applicable
        if (metadata.universeCompleted && !team.completedUniverses.includes(universeId)) {
            team.completedUniverses.push(universeId);
            addHistoryLog('UNIVERSE_COMPLETE', `🌟 ${team.name} a maîtrisé l'univers ${universeId}!`, teamId);
        }

        // Log de score
        addHistoryLog('SCORE', `${team.name}: ${universeId}/${activityId} (+${finalPoints}pts)`, teamId);

        // Broadcast à tous les clients
        io.emit('score:update', {
            teamId,
            newScore: team.score,
            universeId,
            activityId,
            points: finalPoints,
            ranking: calculateRanking()
        });

        io.emit('teams:update', getPublicTeams());
        saveGameState();

        res.json({
            success: true,
            newScore: team.score,
            pointsAwarded: finalPoints,
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

// Reset complet (Admin)
app.post('/api/game/reset', validateApiKey, (req, res) => {
    stopGameLoop();
    gameState = { ...defaultGameState };
    saveGameState();
    io.emit('game:reset');
    res.json({ success: true, message: 'Jeu réinitialisé' });
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
            console.log(`👥 Équipe "${team.name}" connectée`);

            socket.emit('team:state', getPublicTeam(teamId));
            socket.emit('game:state', getGameStateForTeam(teamId));
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

        if (gameState.status !== 'PLAYING') {
            socket.emit('error', { message: 'Le jeu n\'est pas en cours' });
            return;
        }

        if (success) {
            const finalPoints = Math.round(points * gameState.config.pointsMultiplier);
            team.score += finalPoints;
            team.lastActivity = Date.now();

            addHistoryLog('SCORE', `${team.name}: ${universeId}/${activityId} (+${finalPoints}pts)`, teamId);

            io.emit('score:update', {
                teamId,
                newScore: team.score,
                universeId,
                activityId,
                points: finalPoints,
                ranking: calculateRanking()
            });

            io.emit('teams:update', getPublicTeams());
            socket.emit('activity:validated', { points: finalPoints, newScore: team.score });
            saveGameState();
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
                        addHistoryLog('ADMIN_ADJUST', `[ARBITRAGE] ${team.name}: ${action.payload.points}pts`);
                        io.emit('teams:update', getPublicTeams());
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

function getPublicTeam(teamId) {
    const team = gameState.teams[teamId];
    if (!team) return null;
    return {
        id: team.id,
        name: team.name,
        avatar: team.avatar,
        score: team.score,
        completedUniverses: team.completedUniverses,
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
        }
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
    console.log('================================\n');
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
