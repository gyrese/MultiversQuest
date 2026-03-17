/**
 * GameContext - Contexte global pour la synchronisation temps réel
 * Gère la connexion Socket.io et l'état du jeu
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';

// Création du contexte
export const GameContext = createContext(null);

// URL du serveur (dynamique pour le support mobile/LAN)
const getSocketUrl = () => {
    // Si une URL spécifique est définie dans .env (ex: production), l'utiliser
    if (import.meta.env.VITE_SERVER_URL && import.meta.env.VITE_SERVER_URL !== 'http://localhost:3000') {
        return import.meta.env.VITE_SERVER_URL;
    }
    // Sinon, construire l'URL basée sur l'hôte actuel (permet l'accès via IP locale sur mobile)
    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
};
const SERVER_URL = getSocketUrl();

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
        config: { pointsMultiplier: 1 },
        themeUniverse: 'default' // 'default', 'jurassic', 'post_apo', etc.
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
            // Demander l'état complet actuel (statut, phases, équipes...)
            newSocket.emit('request:fullState');
            // Re-identifier automatiquement à chaque (re)connexion selon l'URL
            const path = window.location.pathname;
            if (path.includes('/warroom')) {
                newSocket.emit('identify', { type: 'WARROOM' });
            } else if (path.includes('/admin')) {
                newSocket.emit('identify', { type: 'ADMIN' });
            }
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

        newSocket.on('score:update', ({ teamId, newScore, ranking, completedActivities }) => {
            console.log(`🎯 Score Update [${teamId}]: ${newScore}`);
            setGameState(prev => {
                const team = prev.teams[teamId] || { id: teamId };
                return {
                    ...prev,
                    teams: {
                        ...prev.teams,
                        [teamId]: {
                            ...team,
                            score: newScore,
                            completedActivities: completedActivities || team.completedActivities
                        }
                    },
                    ranking: ranking || prev.ranking
                };
            });
        });

        newSocket.on('team:state', (teamData) => {
            if (!teamData) return;
            console.log(`👥 Team State Received [${teamData.id}]`);
            setGameState(prev => ({
                ...prev,
                teams: {
                    ...prev.teams,
                    [teamData.id]: { ...(prev.teams[teamData.id] || {}), ...teamData }
                }
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

        // --- Session Night Listeners ---
        newSocket.on('sessionNight:state', (sessionNight) => {
            console.log('🌙 Session Night State:', sessionNight);

            // Derive active theme from current universe only if active
            let newTheme = 'default';
            if (sessionNight && ['UNIVERSE_ACTIVE', 'QUIZ_ACTIVE', 'UNIVERSE_COMPLETE'].includes(sessionNight.status)) {
                if (sessionNight.universes && sessionNight.universes.length > 0) {
                    const currentU = sessionNight.universes[sessionNight.currentUniverseIndex];
                    if (currentU) {
                        newTheme = currentU.universeId;
                    }
                }
            }

            setGameState(prev => ({
                ...prev,
                sessionNight,
                themeUniverse: newTheme // Update theme automatically
            }));
        });

        newSocket.on('sessionNight:time', (seconds) => {
            setGameState(prev => {
                if (prev.sessionNight) {
                    return {
                        ...prev,
                        sessionNight: {
                            ...prev.sessionNight,
                            tickRemainingSeconds: seconds
                        }
                    };
                }
                return prev;
            });
        });

        newSocket.on('sessionNight:universeWinner', (data) => {
            console.log('🏆 Vainqueur Univers:', data);
            // On pourrait afficher une notif toast ici
        });

        newSocket.on('sessionNight:complete', (data) => {
            console.log('🏁 Fin Session Night:', data);
        });

        newSocket.on('sessionNight:tick', ({ remaining }) => {
            // Optionnel: update timer local si besoin de précision
        });

        newSocket.on('warroom:theme', (theme) => {
            console.log('🎨 Nouveau thème WarRoom:', theme);
            setGameState(prev => ({ ...prev, themeUniverse: theme }));
        });

        newSocket.on('game:reset', () => {
            console.warn("🔄 Réinitialisation de la partie par l'Admin");

            // Éjecter les joueurs
            if (role === 'TEAM') {
                localStorage.removeItem('teamId');
                localStorage.removeItem('teamToken');
                localStorage.removeItem('teamName');
                localStorage.removeItem('teamAvatarStyle');
                setCurrentTeam(null);
                setRole(null);
                // Force reload pour nettoyer l'UI Nexus
                window.location.reload();
            }

            setGameState({
                teams: {},
                history: [],
                status: 'LOBBY',
                phase: 'INITIALISATION',
                globalTimer: 3600,
                activeEffects: [],
                ranking: [],
                config: { pointsMultiplier: 1 },
                themeUniverse: 'default'
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

    // Soumission de score via API REST (Plus robuste que Socket seul)
    const submitScore = useCallback(async (universeId, activityId, points, success, metadata = {}) => {
        const teamId = localStorage.getItem('teamId');
        const token = localStorage.getItem('teamToken');

        if (!teamId || !token) {
            console.error("❌ submitScore: Identifiants manquants (teamId/token)");
            return false;
        }

        console.log(`📤 Envoi score (API): ${universeId}/${activityId} = ${points}pts`);

        try {
            const response = await fetch(`${SERVER_URL}/api/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId,
                    token,
                    universeId,
                    activityId,
                    points,
                    success,
                    metadata
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log("✅ Score validé par serveur:", data);
                // Le serveur va émettre un socket event 'score:update' qui mettra à jour le state local
                return true;
            } else {
                console.warn("⚠️ Refus serveur:", data.error);

                // GESTION SESSION PERDUE (Serveur restart ou corruption)
                if (response.status === 403 || data.error === 'Token équipe invalide' || data.error === 'API Key invalide') {
                    console.error("⛔ Session invalide. Reset.");
                    localStorage.removeItem('teamId');
                    localStorage.removeItem('teamToken');
                    setCurrentTeam(null);
                    setRole(null);
                    // Force reload pour retourner au Lobby
                    alert("⚠️ Session expirée suite à une maintenance.\nVeuillez recréer votre équipe.");
                    window.location.href = '/';
                }
                return false;
            }
        } catch (error) {
            console.error("❌ Erreur réseau submitScore:", error);
            // Fallback Socket si HTTP fail, mais c'est rare
            if (socket && socket.connected) {
                console.log("⚠️ Tentative fallback Socket...");
                socket.emit('activity:complete', { teamId, token, universeId, activityId, points, success, metadata });
            }
            return false;
        }
    }, [SERVER_URL, socket]);

    // === ACTIONS ADMIN ===

    const adminActions = useMemo(() => ({
        // Nouvelle soirée : reset complet + LOBBY
        newSession: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'NEW_SESSION' });
        },

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

        // Lancer une vidéo plein écran sur la WarRoom (url=null pour stopper)
        playVideo: (url) => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'PLAY_VIDEO', payload: { url } });
        },

        // Déclencher un Happening (vidéo + bonus)
        triggerHappening: (happening) => {
            if (!socket) return;
            socket.emit('admin:action', {
                type: 'SESSION_TRIGGER_HAPPENING',
                payload: { happening }
            });
        },

        // Changer le thème du WarRoom
        setWarRoomTheme: (theme) => {
            if (!socket) return;
            socket.emit('admin:action', {
                type: 'SET_THEME',
                payload: { theme }
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
        },

        // === SESSION NIGHT ACTIONS ===

        // Créer une nouvelle session
        createSession: (config) => {
            if (!socket) return;
            // config: { universes: [], introVideoUrl, requiredTalismans }
            socket.emit('admin:action', {
                type: 'SESSION_CREATE',
                payload: config
            });
        },

        // Lancer la session (Intro)
        launchSession: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SESSION_LAUNCH' });
        },

        // Retour au Quartier Général (depuis INTRO ou UNIVERSE_COMPLETE)
        openHeadquarters: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SESSION_OPEN_HEADQUARTERS' });
        },

        // Ouvrir l'univers suivant
        openNextUniverse: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SESSION_NEXT_UNIVERSE' });
        },

        // Ouvrir un univers spécifique (si besoin manuel)
        openUniverse: (universeId) => {
            if (!socket) return;
            socket.emit('admin:action', {
                type: 'SESSION_OPEN_UNIVERSE',
                payload: { universeId }
            });
        },

        // Forcer la fin du timer univers (passe au Quiz)
        forceStartQuiz: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SESSION_FORCE_END_UNIVERSE' });
        },

        // Fermer le quiz (passe à UNIVERSE_COMPLETE -> Attente Next)
        closeQuiz: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SESSION_CLOSE_QUIZ' });
        },

        // Terminer la session
        endSession: () => {
            if (!socket) return;
            socket.emit('admin:action', { type: 'SESSION_END' });
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

    // Restauration de session automatique (unique point d'entrée)
    useEffect(() => {
        if (!socket || !connected) return;
        if (role) return; // Déjà identifié, ne pas re-trigger

        // 1. Détection par URL (WarRoom / Admin)
        const path = window.location.pathname;
        if (path.includes('/warroom')) {
            identify('WARROOM');
            return;
        }
        if (path.includes('/admin')) {
            identify('ADMIN');
            return;
        }

        // 2. Restauration session équipe depuis localStorage
        const storedTeamId = localStorage.getItem('teamId');
        if (storedTeamId) {
            console.log('🔄 Restauration de session Équipe:', storedTeamId);
            identify('TEAM', storedTeamId);
            return;
        }

        // 3. Restauration session admin depuis localStorage
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
            console.log('🔄 Restauration de session Admin');
            identify('ADMIN');
        }
    }, [socket, connected, identify, role]);

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

export default GameProvider;
