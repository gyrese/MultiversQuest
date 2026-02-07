/**
 * PlayerContext - Contexte local pour l'état du joueur (côté client)
 * Ce contexte gère l'état local du joueur: équipe, univers, activités complétées
 */

import { createContext, useContext, useReducer, useMemo } from 'react';
import { UNIVERSES, UNIVERSE_ORDER } from '../data/universes';

const PlayerContext = createContext(null);

// État initial du joueur
function createInitialState() {
    const universes = {};

    // Initialisation de chaque univers
    UNIVERSE_ORDER.forEach((universeId, index) => {
        const universe = UNIVERSES[universeId];
        const activities = {};

        // Initialiser chaque activité
        Object.keys(universe.activities).forEach((activityId, actIndex) => {
            activities[activityId] = {
                status: actIndex === 0 ? 'available' : 'locked', // Première activité débloquée
                bestScore: 0,
                attempts: 0,
            };
        });

        universes[universeId] = {
            status: index === 0 ? 'available' : 'locked', // Premier univers débloqué
            completedActivities: 0,
            activities,
        };
    });

    return {
        isInitialized: false,
        teamName: '',
        points: 0,
        fragments: 0,
        currentActivity: null,
        universes,
        inventory: [],
    };
}

// Reducer pour les actions
function playerReducer(state, action) {
    switch (action.type) {
        case 'INITIALIZE_TEAM': {
            return {
                ...state,
                isInitialized: true,
                teamName: action.payload.teamName,
            };
        }

        case 'UNLOCK_UNIVERSE': {
            const { universeId } = action.payload;
            return {
                ...state,
                universes: {
                    ...state.universes,
                    [universeId]: {
                        ...state.universes[universeId],
                        status: 'available',
                    },
                },
            };
        }

        case 'UNLOCK_ACTIVITY': {
            const { universeId, activityId } = action.payload;
            return {
                ...state,
                universes: {
                    ...state.universes,
                    [universeId]: {
                        ...state.universes[universeId],
                        activities: {
                            ...state.universes[universeId].activities,
                            [activityId]: {
                                ...state.universes[universeId].activities[activityId],
                                status: 'available',
                            },
                        },
                    },
                },
            };
        }

        case 'COMPLETE_ACTIVITY': {
            const { universeId, activityId, score } = action.payload;
            const universe = state.universes[universeId];
            const activity = universe.activities[activityId];

            const newBestScore = Math.max(activity.bestScore, score);
            const wasCompleted = activity.status === 'completed';

            // Calculer les nouveaux points (seulement ajouter la différence)
            const pointsToAdd = wasCompleted
                ? Math.max(0, score - activity.bestScore)
                : score;

            // Vérifier si l'univers est maintenant complété
            const activitiesObj = universe.activities;
            let completedCount = universe.completedActivities;
            if (!wasCompleted) completedCount++;

            const totalActivities = Object.keys(UNIVERSES[universeId].activities).length;
            const isUniverseCompleted = completedCount >= totalActivities;

            // Débloquer la prochaine activité si elle existe
            const activityKeys = Object.keys(activitiesObj);
            const currentIndex = activityKeys.indexOf(activityId);
            const nextActivityId = activityKeys[currentIndex + 1];

            let updatedActivities = {
                ...activitiesObj,
                [activityId]: {
                    ...activity,
                    status: 'completed',
                    bestScore: newBestScore,
                    attempts: activity.attempts + 1,
                },
            };

            // Débloquer la prochaine activité
            if (nextActivityId && updatedActivities[nextActivityId].status === 'locked') {
                updatedActivities[nextActivityId] = {
                    ...updatedActivities[nextActivityId],
                    status: 'available',
                };
            }

            // Débloquer le prochain univers si celui-ci est complété
            let newUniverses = { ...state.universes };
            if (isUniverseCompleted && !wasCompleted) {
                const universeIndex = UNIVERSE_ORDER.indexOf(universeId);
                const nextUniverseId = UNIVERSE_ORDER[universeIndex + 1];
                if (nextUniverseId && newUniverses[nextUniverseId].status === 'locked') {
                    newUniverses[nextUniverseId] = {
                        ...newUniverses[nextUniverseId],
                        status: 'available',
                    };
                }
            }

            newUniverses[universeId] = {
                ...universe,
                status: isUniverseCompleted ? 'completed' : 'available',
                completedActivities: completedCount,
                activities: updatedActivities,
            };

            return {
                ...state,
                points: state.points + pointsToAdd,
                fragments: isUniverseCompleted && !wasCompleted ? state.fragments + 1 : state.fragments,
                universes: newUniverses,
            };
        }

        case 'SET_CURRENT_ACTIVITY': {
            return {
                ...state,
                currentActivity: action.payload,
            };
        }

        case 'ADD_TO_INVENTORY': {
            return {
                ...state,
                inventory: [...state.inventory, action.payload],
            };
        }

        default:
            return state;
    }
}

// Provider component
export function PlayerProvider({ children }) {
    const [state, dispatch] = useReducer(playerReducer, null, createInitialState);

    // Actions
    const actions = useMemo(() => ({
        initializeTeam: (teamName) => {
            dispatch({ type: 'INITIALIZE_TEAM', payload: { teamName } });
        },

        unlockUniverse: (universeId) => {
            dispatch({ type: 'UNLOCK_UNIVERSE', payload: { universeId } });
        },

        unlockActivity: (universeId, activityId) => {
            dispatch({ type: 'UNLOCK_ACTIVITY', payload: { universeId, activityId } });
        },

        completeActivity: (universeId, activityId, score) => {
            dispatch({ type: 'COMPLETE_ACTIVITY', payload: { universeId, activityId, score } });
        },

        startActivity: (universeId, activityId) => {
            dispatch({ type: 'SET_CURRENT_ACTIVITY', payload: { universeId, activityId } });
        },

        setCurrentActivity: (activity) => {
            dispatch({ type: 'SET_CURRENT_ACTIVITY', payload: activity });
        },

        addToInventory: (item) => {
            dispatch({ type: 'ADD_TO_INVENTORY', payload: item });
        },

        // Helpers
        getUniverseProgress: (universeId) => {
            const universe = state.universes[universeId];
            const totalActivities = Object.keys(UNIVERSES[universeId].activities).length;
            return {
                completed: universe.completedActivities,
                total: totalActivities,
                percentage: Math.round((universe.completedActivities / totalActivities) * 100),
            };
        },

        getCompletedCount: () => {
            return Object.values(state.universes).filter(u => u.status === 'completed').length;
        },

        isActivityCompleted: (universeId, activityId) => {
            return state.universes[universeId]?.activities[activityId]?.status === 'completed';
        },
    }), [state]);

    const value = useMemo(() => ({ state, actions }), [state, actions]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

// Hook
export function useGame() {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('useGame must be used within PlayerProvider');
    }
    return context;
}
