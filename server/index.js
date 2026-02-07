
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permettre toutes les connexions (pour le dev)
        methods: ["GET", "POST"]
    }
});

// --- ÉTAT DU JEU (In-Memory Database) ---
const gameState = {
    teams: {},          // { teamId: { name, avatar, score, completedUniverses: [] } }
    history: [],        // Logs d'activité
    status: 'LOBBY',    // 'LOBBY', 'PLAYING', 'PAUSED', 'ENDED'
    startTime: null,    // Timestamp du début
    globalTimer: 3600,  // Durée en secondes (1h)
    scenarioEvents: [], // Événements déclenchés (ex: 'GLITCH_MODE')
};

// --- ROUTES API REST (Création & Check) ---

// Vérifier si le serveur est en ligne
app.get('/health', (req, res) => {
    res.json({ status: 'OK', players: Object.keys(gameState.teams).length });
});

// Créer une équipe
app.post('/api/teams', (req, res) => {
    const { name, avatar } = req.body;

    // Générer un ID simple
    const teamId = 'team_' + Math.random().toString(36).substr(2, 9);

    gameState.teams[teamId] = {
        id: teamId,
        name: name || `Équipe ${Object.keys(gameState.teams).length + 1}`,
        avatar: avatar || 'default',
        score: 0,
        completedUniverses: [],
        connected: false
    };

    io.emit('teams:update', gameState.teams); // Broadcast aux dashboards
    res.json({ success: true, teamId, team: gameState.teams[teamId] });
});

// --- SOCKET.IO (Temps Réel) ---

// --- GAME LOOP (Timer & Events) ---
let gameInterval = null;

function startGameLoop() {
    if (gameInterval) return;

    console.log("Démarrage de la boucle de jeu...");
    gameState.status = 'PLAYING';
    gameState.startTime = Date.now();
    io.emit('game:status', 'PLAYING');

    gameInterval = setInterval(() => {
        if (gameState.status === 'PLAYING') {
            // 1. Décrémenter le timer
            if (gameState.globalTimer > 0) {
                gameState.globalTimer--;

                // Broadcast light (juste le timer) pour ne pas spammer
                // On envoie le state complet toutes les secondes c'est acceptable pour < 100 clients
                io.emit('timer:update', gameState.globalTimer);
            } else {
                gameState.status = 'ENDED';
                io.emit('game:status', 'ENDED');
                clearInterval(gameInterval);
            }

            // 2. Simulation d'activité (POUR DEMO)
            // Une chance sur 5 chaque seconde qu'une équipe marque (augmenté pour la démo)
            if (Math.random() > 0.6) {
                simulateActivity();
            }
        }
    }, 1000);
}

function simulateActivity() {
    const teamIds = Object.keys(gameState.teams);
    if (teamIds.length === 0) return;

    const randomTeamId = teamIds[Math.floor(Math.random() * teamIds.length)];
    const points = [100, 200, 500, -50][Math.floor(Math.random() * 4)];
    const universes = ['Jurassic Park', 'Mario World', 'Star Wars', 'Poudlard', 'Matrix'];
    const universe = universes[Math.floor(Math.random() * universes.length)];

    if (gameState.teams[randomTeamId]) {
        gameState.teams[randomTeamId].score += points;
        const log = {
            time: Date.now(),
            type: 'SCORE',
            message: `ÉQUIPE ${gameState.teams[randomTeamId].name.toUpperCase()} : ${universe} (${points > 0 ? '+' : ''}${points}pts)`
        };
        gameState.history.unshift(log);
        if (gameState.history.length > 20) gameState.history.pop();

        // Broadcast complet pour mettre à jour les scores
        io.emit('game:fullState', gameState);
    }
}

// Auto-start pour la démo après 3 secondes (rapide)
setTimeout(() => {
    // Créer des équipes fake si vide
    if (Object.keys(gameState.teams).length === 0) {
        console.log("Injection des équipes de démo...");
        const fakes = [
            { id: 't1', name: 'Alpha Squad', avatar: 'raptor', score: 1200, completedUniverses: ['Jurassic'], connected: true },
            { id: 't2', name: 'Cyber Punks', avatar: 'robot', score: 950, completedUniverses: [], connected: true },
            { id: 't3', name: 'Les Jedis', avatar: 'yoda', score: 1500, completedUniverses: ['Star Wars'], connected: true },
            { id: 't4', name: 'Mario Bros', avatar: 'mario', score: 800, completedUniverses: ['Mario'], connected: true }
        ];
        fakes.forEach(t => gameState.teams[t.id] = t);
    }
    startGameLoop();
}, 3000);

io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);

    // 1. Identification (Joueur ou Admin ou Dashboard)
    socket.on('identify', ({ type, teamId }) => {
        if (type === 'TEAM' && teamId && gameState.teams[teamId]) {
            gameState.teams[teamId].connected = true;
            socket.teamId = teamId; // Attacher l'ID au socket
            socket.join('teams');   // Rejoindre la room des équipes
            console.log(`Équipe ${gameState.teams[teamId].name} connectée.`);

            // Envoyer l'état actuel à l'équipe
            socket.emit('game:state', gameState);
        }
        else if (type === 'DASHBOARD') {
            socket.join('dashboards');
            socket.emit('game:fullState', gameState);
        }
        else if (type === 'ADMIN') {
            socket.join('admins');
            socket.emit('game:fullState', gameState);
        }
    });

    // 2. Réception de Score (Fin d'activité)
    socket.on('activity:complete', ({ teamId, universe, points, success }) => {
        if (!gameState.teams[teamId]) return;

        // Logique de validation (simple pour l'instant)
        if (success) {
            gameState.teams[teamId].score += points;
            if (!gameState.teams[teamId].completedUniverses.includes(universe)) {
                gameState.teams[teamId].completedUniverses.push(universe);
            }

            // Log pour le dashboard
            const log = {
                time: Date.now(),
                type: 'SCORE',
                message: `L'équipe ${gameState.teams[teamId].name} a complété ${universe} (+${points}pts)`
            };
            gameState.history.unshift(log); // Ajouter au début
            if (gameState.history.length > 50) gameState.history.pop(); // Limiter la taille

            // Broadcast global
            io.emit('score:update', {
                teamId,
                newScore: gameState.teams[teamId].score,
                history: gameState.history
            });

            io.emit('teams:update', gameState.teams);
        }
    });

    // 3. Commandes Admin (Start, Pause, Event)
    socket.on('admin:action', (action) => {
        // Vérification admin (à sécuriser plus tard avec un token)
        console.log('Action Admin:', action);

        switch (action.type) {
            case 'START_GAME':
                startGameLoop(); // Utiliser la boucle
                break;

            case 'PAUSE_GAME':
                gameState.status = 'PAUSED';
                io.emit('game:status', 'PAUSED');
                break;

            case 'TRIGGER_EVENT':
                const event = { id: Date.now(), ...action.payload }; // ex: { name: 'GLITCH', duration: 300 }
                gameState.scenarioEvents.push(event);
                io.emit('scenario:event', event);
                break;
        }
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
        if (socket.teamId && gameState.teams[socket.teamId]) {
            gameState.teams[socket.teamId].connected = false;
            io.emit('teams:update', gameState.teams);
        }
    });
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
});
