/**
 * PlayerContext - Contexte local pour l'état du joueur (côté client)
 * Ce contexte gère l'état local du joueur: équipe, univers, activités complétées
 */

import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { UNIVERSES, UNIVERSE_ORDER } from '../data/universes';
import { GameContext } from './GameContext'; // Import GameContext to read server state

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
        teamId: null, // Add teamId to track ownership
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
            const { teamId, teamName, avatarStyle } = action.payload;

            // Check if we are switching to a different team
            // If so, we must RESET all progress to avoid leak from previous session
            if (teamId && state.teamId && state.teamId !== teamId) {
                console.log(`🔄 Changement d'équipe détecté (${state.teamId} -> ${teamId}). Reset du profile.`);
                const freshState = createInitialState();
                return {
                    ...freshState,
                    isInitialized: true,
                    teamId,
                    teamName,
                    avatarStyle: avatarStyle || 'bottts',
                };
            }

            return {
                ...state,
                isInitialized: true,
                teamId, // Ensure teamId is set
                teamName,
                avatarStyle: avatarStyle || 'bottts',
            };
        }

        case 'RESET_STATE': {
            console.log("🧹 Reset complet de l'état joueur");
            return createInitialState();
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
                // points: (currentPoints || 0) + (safePointsToAdd || 0), // DEPRECATED: Points are now server-authoritative
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
            // Keep for offline/local display but derivedState will override
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

    const actions = useMemo(() => ({
        initializeTeam: (teamId, teamName, avatarStyle = 'bottts') => {
            dispatch({ type: 'INITIALIZE_TEAM', payload: { teamId, teamName, avatarStyle } });
        },

        resetState: () => {
            dispatch({ type: 'RESET_STATE' });
            localStorage.removeItem(STORAGE_KEY);
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

    // ─────────────────────────────────────────────────────────────────────────────
    // 🌙 SESSION NIGHT INTERCEPTOR
    // ─────────────────────────────────────────────────────────────────────────────
    // On doit lire le GameContext pour savoir si une Session Night est active
    // et filtrer l'accès aux univers en conséquence.
    const gameContext = useContext(GameContext);
    const sessionNight = gameContext?.gameState?.sessionNight;

    const derivedState = useMemo(() => {
        if (!state) return null;

        // --- SOURCE DE VÉRITÉ : SCORE SERVEUR ---
        const gameState = gameContext?.gameState;
        const serverTeamData = state.teamId ? gameState?.teams?.[state.teamId] : null;
        const serverScore = typeof serverTeamData?.score === 'number' ? serverTeamData.score : null;

        // Si pas de session existante, on reste en mode Standard
        if (!sessionNight) {
            return {
                ...state,
                universes: state.universes, // Garder l'état local standard
                isSessionNight: false,
                points: serverScore !== null ? serverScore : state.points
            };
        }

        // --- MODE SESSION NIGHT DÉTECTÉ ---
        // Même si DRAFT ou COMPLETE, on passe en mode Session Night pour éviter le fallback Standard
        // Cela permet d'afficher des écrans d'attente ou de fin spécifiques
        const isSessionActive = true;
        const currentStatus = sessionNight.status;

        console.log(`🌙 PlayerContext: Mode Session Night Actif (Statut: ${currentStatus})`);

        // --- MODE SESSION NIGHT ACTIF ---
        // On construit une vue "filtrée" des univers
        const activeSnUniverseIndex = sessionNight.currentUniverseIndex;
        const activeSnUniverseData = sessionNight.universes[activeSnUniverseIndex];

        // DEBUG: Tracer l'univers actif
        console.log('[PlayerContext] Session Night actif:', {
            status: sessionNight.status,
            currentIndex: activeSnUniverseIndex,
            activeUniverse: activeSnUniverseData?.universeId,
            selectedChallenges: activeSnUniverseData?.selectedChallengeIds,
            quizId: activeSnUniverseData?.quizActivityId,
            allUniverses: sessionNight.universes?.map(u => u.universeId)
        });

        // Si on est en INTRO, DRAFT, ATTENTE GM ou FINI, tout est verrouillé
        const isLockedState = ['INTRO', 'HEADQUARTERS', 'DRAFT', 'SESSION_COMPLETE'].includes(sessionNight.status);

        const filteredUniverses = {};

        // On parcourt tous les univers possibles, mais on lock tout
        // SAUF l'univers courant de la session
        UNIVERSE_ORDER.forEach((uId) => {
            // Est-ce l'univers actif ?
            const isActiveUniverse = activeSnUniverseData && activeSnUniverseData.universeId === uId;

            // Récupérer l'état local (pour garder les checkmarks des activités finies)
            const localUnivState = state.universes[uId] || { activities: {}, completedActivities: 0 };

            // Calculer le statut de l'univers
            let derivedStatus = 'locked';
            if (isActiveUniverse && !isLockedState) {
                derivedStatus = 'available'; // Ouvert !
            }

            // Filtrer les activités
            const derivedActivities = {};
            // On prend la config statique pour savoir quelles activités existent
            const staticActivities = UNIVERSES[uId]?.activities || {};

            Object.keys(staticActivities).forEach(activityId => {
                const localActState = localUnivState.activities[activityId] || { status: 'locked', bestScore: 0 };

                // Par défaut locked
                let actStatus = 'locked';

                if (isActiveUniverse && !isLockedState) {
                    // Robustesse : Check ID configuré OU type 'quiz'
                    const activityConfig = staticActivities[activityId];
                    const isQuiz = (activeSnUniverseData?.quizActivityId === activityId) || activityConfig?.type === 'quiz';
                    // Est-ce un défi sélectionné par le GM pour ce soir ?
                    const isSelectedChallenge = activeSnUniverseData?.selectedChallengeIds?.includes(activityId);

                    if (sessionNight.status === 'UNIVERSE_ACTIVE') {
                        if (isSelectedChallenge) {
                            // Défi sélectionné → toujours available (pas de progression séquentielle)
                            actStatus = 'available';
                        }
                        // Quiz et activités non-sélectionnées → restent 'locked' (cachées par UniverseCard)
                    } else if (sessionNight.status === 'QUIZ_ACTIVE') {
                        // Seul le quiz est accessible, tout le reste est verrouillé
                        actStatus = isQuiz ? 'available' : 'locked';
                    } else {
                        // UNIVERSE_COMPLETE ou autre → tout verrouillé
                        actStatus = 'locked';
                    }

                    // Si localement c'est 'completed', on garde 'completed' (visuel checkmark)
                    // Mais SEULEMENT si l'activité est censée être visible (selected ou quiz actif)
                    if (localActState.status === 'completed' && (isSelectedChallenge || (isQuiz && sessionNight.status === 'QUIZ_ACTIVE'))) {
                        actStatus = 'completed';
                    }
                }

                derivedActivities[activityId] = {
                    ...localActState,
                    status: actStatus
                };
            });

            filteredUniverses[uId] = {
                ...localUnivState,
                status: derivedStatus,
                activities: derivedActivities
            };
        });

        // Fallback Session Night score if applicable
        const sessionScore = (state.teamId && sessionNight.perTeam && typeof sessionNight.perTeam[state.teamId]?.score === 'number')
            ? sessionNight.perTeam[state.teamId].score
            : null;

        return {
            ...state,
            universes: filteredUniverses,
            isSessionNight: true, // Flag pour l'UI
            sessionStatus: sessionNight.status,
            sessionIntroVideoUrl: sessionNight.introVideoUrl,
            // Liste des univers de la session pour l'affichage dans le Hub
            sessionUniverseIds: sessionNight.universes.map(u => u.universeId),
            // Priorité: 1. Score Serveur Global | 2. Score Session Serveur | 3. Score Local (Cache)
            points: serverScore !== null ? serverScore : (sessionScore !== null ? sessionScore : state.points),
        };

    }, [state, sessionNight, gameContext?.gameState?.teams]);

    const value = useMemo(() => ({ state: derivedState, actions }), [derivedState, actions]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

// Hook principal — utiliser usePlayer() pour accéder au contexte joueur
export function usePlayer() {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within PlayerProvider');
    }
    return context;
}

// Alias déprécié pour compatibilité (préférer usePlayer)
export const useGame = usePlayer;

