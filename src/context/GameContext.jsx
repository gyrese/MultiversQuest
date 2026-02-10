/**
 * GameContext - Contexte global pour la synchronisation temps réel
 * Gère la connexion Socket.io et l'état du jeu
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';

// Création du contexte
const GameContext = createContext(null);
export default GameProvider;

// URL du serveur (à configurer selon l'env)
// Utilisation de l'IP directe pour le dev mobile sans redémarrage
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.1.14:3000';

export function GameProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState({
        teams: {},
        history: [],
        status: 'LOBBY',
        phase: 'INITIALISATION',
        globalTimer: 3600,
        activeEffects: [],
        ranking: [],
        config: { pointsMultiplier: 1 }
    });

    const [currentTeam, setCurrentTeam] = useState(null);
    const [role, setRole] = useState(null); // 'TEAM', 'DASHBOARD', 'ADMIN'

    // Initialisation du socket
    useEffect(() => {
        const newSocket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        setSocket(newSocket);

        // Connexion
        newSocket.on('connect', () => {
            console.log('✅ Connecté au serveur:', newSocket.id);
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('⚠️ Erreur de connexion:', error.message);
            setConnected(false);
        });

        // État complet du jeu
        newSocket.on('game:fullState', (state) => {
            console.log('📦 État complet reçu:', state);
            setGameState(prev => ({ ...prev, ...state }));
        });

        // Mises à jour partielles
        newSocket.on('teams:update', (teams) => {
            setGameState(prev => ({ ...prev, teams }));
        });

        newSocket.on('score:update', ({ teamId, newScore, ranking, history }) => {
            setGameState(prev => ({
                ...prev,
                teams: {
                    ...prev.teams,
                    [teamId]: { ...prev.teams[teamId], score: newScore }
                },
                ranking: ranking || prev.ranking,
                history: history || prev.history
            }));
        });

        newSocket.on('game:status', (status) => {
            console.log('🎮 Statut:', status);
            setGameState(prev => ({ ...prev, status }));
        });

        newSocket.on('game:phase', (phase) => {
            console.log('📍 Phase:', phase);
            setGameState(prev => ({ ...prev, phase }));
        });

        newSocket.on('timer:update', (globalTimer) => {
            setGameState(prev => ({ ...prev, globalTimer }));
        });

        newSocket.on('history:new', (log) => {
            setGameState(prev => ({
                ...prev,
                history: [log, ...prev.history].slice(0, 50)
            }));
        });

        newSocket.on('scenario:event', (event) => {
            console.log('⚡ Événement:', event);
            setGameState(prev => ({
                ...prev,
                activeEffects: [...prev.activeEffects, { effect: event.effect, endTime: event.endTime }]
            }));
        });

        newSocket.on('scenario:effectEnd', ({ effect }) => {
            setGameState(prev => ({
                ...prev,
                activeEffects: prev.activeEffects.filter(e => e.effect !== effect)
            }));
        });

        newSocket.on('game:ended', ({ ranking }) => {
            setGameState(prev => ({ ...prev, status: 'ENDED', ranking }));
        });

        newSocket.on('game:reset', () => {
            setGameState({
                teams: {},
                history: [],
                status: 'LOBBY',
                phase: 'INITIALISATION',
                globalTimer: 3600,
                activeEffects: [],
                ranking: [],
                config: { pointsMultiplier: 1 }
            });
        });

        // Nettoyage
        return () => newSocket.close();
    }, []);

    // === ACTIONS GÉNÉRALES ===

    const identify = useCallback((type, teamId = null) => {
        if (!socket) return;
        setRole(type);
        setCurrentTeam(teamId);
        socket.emit('identify', { type, teamId });
    }, [socket]);

    const createTeam = useCallback(async (name, avatar, members = []) => {
        try {
            const response = await fetch(`${SERVER_URL}/api/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar, members })
            });
            const data = await response.json();
            if (data.success) {
                identify('TEAM', data.teamId);
                // Stocker le token pour les requêtes futures
                localStorage.setItem('teamToken', data.token);
                localStorage.setItem('teamId', data.teamId);
                return { teamId: data.teamId, token: data.token };
            }
            return { error: data.error };
        } catch (error) {
            console.error('Erreur création équipe:', error);
            return { error: 'Erreur de connexion au serveur' };
        }
    }, [identify]);

    const submitScore = useCallback((universeId, activityId, points, success, metadata = {}) => {
        if (!socket || !currentTeam) return;
        socket.emit('activity:complete', {
            teamId: currentTeam,
            token: localStorage.getItem('teamToken'),
            universeId,
            activityId,
            points,
            success,
            metadata
        });
    }, [socket, currentTeam]);

    // === ACTIONS ADMIN ===

    const adminActions = useMemo(() => ({
        // Démarrer le jeu
        startGame: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'START_GAME' });
        },

        // Mettre en pause
        pauseGame: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'PAUSE_GAME' });
        },

        // Reprendre
        resumeGame: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'RESUME_GAME' });
        },

        // Terminer le jeu
        endGame: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'END_GAME' });
        },

        // Modifier le timer
        setTimer: (seconds) => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SET_TIMER', payload: { seconds } });
        },

        // Ajuster les points d'une équipe
        adjustScore: (teamId, points, reason = '') => {
            if (!socket) return;
            socket.emit('admin:action', {
                type: 'ADJUST_SCORE',
                payload: { teamId, points, reason }
            });
        },

        // Déclencher un événement scénaristique
        triggerEvent: (eventData) => {
            if (!socket) return;
            socket.emit('admin:action', {
                type: 'TRIGGER_EVENT',
                payload: eventData
            });
        },

        // Envoyer une commande au WarRoom (effets visuels)
        sendWarRoomCommand: (command) => {
            if (!socket) return;
            socket.emit('admin:action', {
                type: 'WARROOM_COMMAND',
                payload: command
            });
        },

        // Réinitialiser le jeu (via API REST)
        resetGame: async () => {
            try {
                const response = await fetch(`${SERVER_URL}/api/game/reset`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'multivers_secret_2026' // À configurer
                    }
                });
                return await response.json();
            } catch (error) {
                console.error('Erreur reset:', error);
                return { error: 'Erreur de connexion' };
            }
        },

        // Supprimer une équipe
        deleteTeam: async (teamId) => {
            try {
                const response = await fetch(`${SERVER_URL}/api/teams/${teamId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-API-Key': 'multivers_secret_2026'
                    }
                });
                return await response.json();
            } catch (error) {
                console.error('Erreur suppression:', error);
                return { error: 'Erreur de connexion' };
            }
        }
    }), [socket]);

    // Formattage du timer
    const formatTimer = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Calcul du classement trié
    const sortedTeams = useMemo(() => {
        return Object.values(gameState.teams)
            .sort((a, b) => b.score - a.score);
    }, [gameState.teams]);

    // Valeur exposée
    const value = useMemo(() => ({
        socket,
        connected,
        gameState,
        currentTeam,
        role,
        sortedTeams,
        identify,
        createTeam,
        submitScore,
        adminActions,
        formatTimer,
        SERVER_URL
    }), [socket, connected, gameState, currentTeam, role, sortedTeams, identify, createTeam, submitScore, adminActions, formatTimer]);

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte
export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame doit être utilisé à l'intérieur d'un GameProvider");
    }
    return context;
}
