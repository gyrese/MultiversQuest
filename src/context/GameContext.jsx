
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

// Création du contexte
const GameContext = createContext(null);
export default GameProvider;

// URL du serveur (à configurer selon l'env)
const SERVER_URL = 'http://localhost:3000';

export function GameProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState({
        teams: {},
        history: [],
        status: 'LOBBY', // LOBBY, PLAYING, PAUSED, ENDED
    });

    const [currentTeam, setCurrentTeam] = useState(null); // Si on est un joueur
    const [role, setRole] = useState(null); // 'TEAM', 'DASHBOARD', 'ADMIN'

    // Initialisation du socket
    useEffect(() => {
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        // Écouteurs globaux
        newSocket.on('connect', () => {
            console.log('Connecté au serveur de jeu:', newSocket.id);
        });

        newSocket.on('game:fullState', (state) => {
            console.log('État complet reçu:', state);
            setGameState(state);
        });

        newSocket.on('teams:update', (teams) => {
            setGameState(prev => ({ ...prev, teams }));
        });

        newSocket.on('score:update', ({ teamId, newScore, history }) => {
            setGameState(prev => ({
                ...prev,
                teams: {
                    ...prev.teams,
                    [teamId]: { ...prev.teams[teamId], score: newScore }
                },
                history
            }));
        });

        newSocket.on('game:status', (status) => {
            console.log('Nouveau statut de jeu:', status);
            setGameState(prev => ({ ...prev, status }));
        });

        // Nettoyage à la destruction
        return () => newSocket.close();
    }, []);

    // Actions
    const identify = (type, teamId = null) => {
        if (!socket) return;
        setRole(type);
        setCurrentTeam(teamId);
        socket.emit('identify', { type, teamId });
    };

    const createTeam = async (name, avatar) => {
        try {
            const response = await fetch(`${SERVER_URL}/api/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar })
            });
            const data = await response.json();
            if (data.success) {
                identify('TEAM', data.teamId);
                return data.teamId;
            }
        } catch (error) {
            console.error('Erreur création équipe:', error);
        }
        return null;
    };

    const submitScore = (universe, points, success) => {
        if (!socket || !currentTeam) return;
        socket.emit('activity:complete', {
            teamId: currentTeam,
            universe,
            points,
            success
        });
    };

    // Valeur exposée
    const value = useMemo(() => ({
        socket,
        gameState,
        currentTeam,
        role,
        identify,
        createTeam,
        submitScore
    }), [socket, gameState, currentTeam, role]);

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
