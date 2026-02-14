/**
 * PlayerContext - Contexte local pour l'état du joueur (côté client)
 * Ce contexte gère l'état local du joueur: équipe, univers, activités complétées
 */

import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { UNIVERSES, UNIVERSE_ORDER } from '../data/universes';

const PlayerContext = createContext(null);

// État initial du joueur
function createInitialState() {
    const universes = {};

    // Initialisation de chaque univers
    UNIVERSE_ORDER.forEach((universeId, index) => {
        const universe = UNIVERSES[universeId];
        if (!universe) return;

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
        avatarStyle: 'bottts', // Style DiceBear par défaut
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
                avatarStyle: action.payload.avatarStyle || 'bottts',
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
            let { universeId, activityId, score } = action.payload;
            // Fix NaN input
            if (typeof score !== 'number' || isNaN(score)) score = 0;

            const universe = state.universes[universeId];
            const activity = universe.activities[activityId];

            // Fix existing NaN corruption in state
            const currentBest = (typeof activity.bestScore === 'number' && !isNaN(activity.bestScore)) ? activity.bestScore : 0;
            const currentPoints = (typeof state.points === 'number' && !isNaN(state.points)) ? state.points : 0;

            const newBestScore = Math.max(currentBest, score);
            const wasCompleted = activity.status === 'completed';

            // Calculer les nouveaux points (seulement ajouter la différence)
            const pointsToAdd = wasCompleted
                ? Math.max(0, score - currentBest)
                : score;

            // Safety check for result
            const safePointsToAdd = (typeof pointsToAdd === 'number' && !isNaN(pointsToAdd)) ? pointsToAdd : 0;

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
                points: (currentPoints || 0) + (safePointsToAdd || 0),
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

        case 'SYNC_SCORE': {
            return {
                ...state,
                points: action.payload
            };
        }

        case 'IMPORT_FULL_STATE': {
            return {
                ...state,
                ...action.payload,
                isInitialized: true
            };
        }

        default:
            return state;
    }
}

const STORAGE_KEY = 'multivers_player_state_v2';

// Provider component
export function PlayerProvider({ children }) {
    const [state, dispatch] = useReducer(playerReducer, null, () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const initialState = createInitialState();

        if (saved) {
            try {
                const savedState = JSON.parse(saved);

                // 🔄 MIGRATION / MERGE STATE
                // On fusionne l'état sauvegardé avec l'état initial pour inclure les nouveautés (ex: nouveaux quiz)
                const mergedUniverses = { ...initialState.universes };

                if (savedState.universes) {
                    Object.keys(mergedUniverses).forEach(universeId => {
                        const savedUniverse = savedState.universes[universeId];
                        const initialUniverse = mergedUniverses[universeId];

                        if (savedUniverse && initialUniverse) {
                            // Fusion des activités
                            const mergedActivities = { ...initialUniverse.activities };

                            if (savedUniverse.activities) {
                                Object.keys(mergedActivities).forEach(activityId => {
                                    if (savedUniverse.activities[activityId]) {
                                        // On garde la progression sauvegardée
                                        mergedActivities[activityId] = savedUniverse.activities[activityId];
                                    }
                                    // Sinon on garde l'activité initiale (locked/available par défaut)
                                });
                            }

                            mergedUniverses[universeId] = {
                                ...initialUniverse, // Structure de base
                                ...savedUniverse,   // Progression (status, completedActivities)
                                activities: mergedActivities
                            };
                        }
                        // Si l'univers n'existe pas dans la save (nouveau), on garde l'initial
                    });
                }

                return {
                    ...initialState,
                    ...savedState,
                    universes: mergedUniverses
                };

            } catch (e) {
                console.error("Save corrompue, réinitialisation", e);
            }
        }
        return initialState;
    });

    // Auto-save
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Actions
    const actions = useMemo(() => ({
        initializeTeam: (teamName, avatarStyle = 'bottts') => {
            dispatch({ type: 'INITIALIZE_TEAM', payload: { teamName, avatarStyle } });
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

        syncScore: (serverScore) => {
            dispatch({ type: 'SYNC_SCORE', payload: serverScore });
        },

        importSave: (jsonString) => {
            try {
                const data = JSON.parse(jsonString);
                // Validation minimale
                if (data && data.teamName) {
                    dispatch({ type: 'IMPORT_FULL_STATE', payload: data });
                    return { success: true };
                }
                return { success: false, error: 'Données invalides' };
            } catch (e) {
                return { success: false, error: 'Format invalide' };
            }
        },

        // Helpers
        getUniverseProgress: (universeId) => {
            const universe = state.universes[universeId];
            if (!universe) return { completed: 0, total: 0, percentage: 0 }; // Fail safety

            const config = UNIVERSES[universeId];
            if (!config) return { completed: 0, total: 0, percentage: 0 };

            const totalActivities = Object.keys(config.activities).length;
            return {
                completed: universe.completedActivities,
                total: totalActivities,
                percentage: totalActivities > 0 ? Math.round((universe.completedActivities / totalActivities) * 100) : 0,
            };
        },

        getCompletedCount: () => {
            if (!state.universes) return 0;
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
