import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { UNIVERSES, UNIVERSE_ORDER } from '../data/universes';
import { motion, AnimatePresence } from 'framer-motion';

export default function SessionNightManager() {
    const { gameState, adminActions, formatTimer } = useGame();
    const session = gameState.sessionNight;

    // --- STATE LOCAL: CREATION ---
    const [videoInput, setVideoInput] = useState('');
    const [selectedUniverses, setSelectedUniverses] = useState([]); // [id1, id2, ...]
    const [universeConfigs, setUniverseConfigs] = useState({}); // { id: { challenges: [], quizId: '', duration: 1200 } }
    const [globalConfig, setGlobalConfig] = useState({
        introVideoUrl: '/video/intro.mp4',
        requiredTalismans: 50
    });

    // Initialisation
    useEffect(() => {
        // Pre-fill defaults if empty
        if (selectedUniverses.length === 0) {
            // Default 2 first universes
            // setSelectedUniverses(UNIVERSE_ORDER.slice(0, 2));
        }
    }, []);

    // Helper: Toggle Universe Selection
    const toggleUniverse = (uId) => {
        if (selectedUniverses.includes(uId)) {
            setSelectedUniverses(prev => prev.filter(id => id !== uId));
            const newConfigs = { ...universeConfigs };
            delete newConfigs[uId];
            setUniverseConfigs(newConfigs);
        } else {
            setSelectedUniverses(prev => [...prev, uId]);
            // Default Config
            const universe = UNIVERSES[uId];
            const activities = Object.values(universe.activities);
            // Try to find quiz and 4 challenges
            const quiz = activities.find(a => a.type === 'quiz');
            // Select ALL challenges by default, let user uncheck
            const challenges = activities.filter(a => a.type !== 'quiz').slice(0, 4).map(a => a.id);

            setUniverseConfigs(prev => ({
                ...prev,
                [uId]: {
                    universeId: uId,
                    selectedChallengeIds: challenges,
                    quizActivityId: quiz ? quiz.id : '',
                    durationSeconds: 1200 // 20 min default
                }
            }));
        }
    };

    const toggleChallenge = (uId, challengeId) => {
        setUniverseConfigs(prev => {
            const currentConfig = prev[uId];
            const currentChallenges = currentConfig.selectedChallengeIds;
            let newChallenges;

            if (currentChallenges.includes(challengeId)) {
                newChallenges = currentChallenges.filter(id => id !== challengeId);
            } else {
                newChallenges = [...currentChallenges, challengeId];
            }

            return {
                ...prev,
                [uId]: {
                    ...currentConfig,
                    selectedChallengeIds: newChallenges
                }
            };
        });
    };

    const handleCreateSession = () => {
        // Build payload
        const universePayload = selectedUniverses.map(uId => universeConfigs[uId]);

        if (universePayload.length === 0) {
            alert("Sélectionnez au moins un univers !");
            return;
        }

        const payload = {
            universes: universePayload,
            introVideoUrl: globalConfig.introVideoUrl,
            requiredTalismans: parseInt(globalConfig.requiredTalismans) || 50
        };

        adminActions.createSession(payload);
    };

    // --- RENDER HELPERS ---

    const renderDraftMode = () => (
        <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold mb-4 text-purple-400">1. Sélection des Univers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {UNIVERSE_ORDER.map(uId => {
                        const uni = UNIVERSES[uId];
                        const isSelected = selectedUniverses.includes(uId);
                        return (
                            <div key={uId} className={`rounded-lg border-2 transition-all overflow-hidden ${isSelected ? 'border-green-500 bg-green-900/20' : 'border-slate-600 bg-slate-900/50'}`}>
                                {/* Header (Clickable to toggle selection) */}
                                <div
                                    onClick={() => toggleUniverse(uId)}
                                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{uni.icon}</span>
                                        <span className="font-bold text-sm">{uni.name}</span>
                                    </div>
                                    <div>{isSelected ? '✅' : '⬜'}</div>
                                </div>

                                {/* Configuration (Only if selected) */}
                                <AnimatePresence>
                                    {isSelected && universeConfigs[uId] && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="bg-black/30 text-sm overflow-hidden"
                                        >
                                            <div className="p-3 border-t border-slate-700">
                                                <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Défis sélectionnés ({universeConfigs[uId].selectedChallengeIds.length})</p>
                                                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                                    {Object.values(uni.activities)
                                                        .filter(a => a.type !== 'quiz')
                                                        .map(activity => {
                                                            const isChecked = universeConfigs[uId].selectedChallengeIds.includes(activity.id);
                                                            return (
                                                                <div
                                                                    key={activity.id}
                                                                    onClick={() => toggleChallenge(uId, activity.id)}
                                                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isChecked ? 'bg-purple-900/40 text-purple-200' : 'text-gray-500 hover:bg-white/5'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`}>
                                                                        {isChecked && <span className="text-[10px] text-white">✓</span>}
                                                                    </div>
                                                                    <span className="truncate">{activity.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-slate-700">
                                                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                                        <span>Durée (sec)</span>
                                                        <span className="text-white">{formatTimer(universeConfigs[uId].durationSeconds)}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="300"
                                                        max="3600"
                                                        step="60"
                                                        value={universeConfigs[uId].durationSeconds}
                                                        onChange={(e) => setUniverseConfigs(prev => ({
                                                            ...prev,
                                                            [uId]: { ...prev[uId], durationSeconds: parseInt(e.target.value) }
                                                        }))}
                                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedUniverses.length > 0 && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 text-purple-400">2. Configuration Globale</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Vidéo d'Intro (URL)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                placeholder="/videos/intro_general.mp4"
                                value={globalConfig.introVideoUrl}
                                onChange={e => setGlobalConfig({ ...globalConfig, introVideoUrl: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Talismans requis (Coop)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                value={globalConfig.requiredTalismans}
                                onChange={e => setGlobalConfig({ ...globalConfig, requiredTalismans: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={handleCreateSession}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-xl hover:scale-[1.02] transition-transform"
            >
                INITIALISER LA SESSION
            </button>
        </div>
    );

    // Labels lisibles pour les statuts
    const STATUS_LABELS = {
        DRAFT: { label: 'Brouillon', color: 'text-gray-400', bg: 'bg-gray-700/50 border-gray-600' },
        INTRO: { label: '📺 Intro en cours', color: 'text-blue-300', bg: 'bg-blue-900/30 border-blue-500/50' },
        HEADQUARTERS: { label: '🏛️ Quartier Général', color: 'text-cyan-300', bg: 'bg-cyan-900/30 border-cyan-500/50' },
        UNIVERSE_ACTIVE: { label: '🚀 Univers actif', color: 'text-green-300', bg: 'bg-green-900/30 border-green-500/50' },
        QUIZ_ACTIVE: { label: '❓ Quiz ouvert', color: 'text-orange-300', bg: 'bg-orange-900/30 border-orange-500/50' },
        UNIVERSE_COMPLETE: { label: '✅ Univers terminé', color: 'text-purple-300', bg: 'bg-purple-900/30 border-purple-500/50' },
        SESSION_COMPLETE: { label: '🏁 Session terminée', color: 'text-red-300', bg: 'bg-red-900/30 border-red-500/50' },
    };

    const renderActiveMode = () => {
        if (!session) return null;
        const currentU = session.universes[session.currentUniverseIndex];
        const currentUniverseData = currentU ? UNIVERSES[currentU.universeId] : null;
        const statusMeta = STATUS_LABELS[session.status] || STATUS_LABELS.DRAFT;
        const isLastUniverse = session.currentUniverseIndex >= session.universes.length - 1;

        return (
            <div className="space-y-4">

                {/* ══ RAIL NARRATIF ══ */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Progression de la soirée</span>
                        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.color}`}>
                            {statusMeta.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {/* Intro */}
                        <div className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${['INTRO'].includes(session.status) ? 'bg-blue-600 border-blue-400 text-white' : ['HEADQUARTERS', 'UNIVERSE_ACTIVE', 'QUIZ_ACTIVE', 'UNIVERSE_COMPLETE', 'SESSION_COMPLETE'].includes(session.status) ? 'bg-slate-700 border-slate-600 text-gray-400 line-through' : 'bg-slate-800 border-slate-600 text-gray-500'}`}>
                            📺 Intro
                        </div>
                        <div className="flex-shrink-0 text-gray-600">→</div>

                        {/* Univers */}
                        {session.universes.map((u, idx) => {
                            const uData = UNIVERSES[u.universeId];
                            const isCurrent = idx === session.currentUniverseIndex;
                            const isDone = idx < session.currentUniverseIndex || session.status === 'SESSION_COMPLETE';
                            const isActive = isCurrent && ['UNIVERSE_ACTIVE', 'QUIZ_ACTIVE', 'UNIVERSE_COMPLETE'].includes(session.status);
                            return (
                                <React.Fragment key={u.universeId}>
                                    <div className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${isDone ? 'bg-slate-700 border-slate-600 text-gray-400 line-through' : isActive ? `border-green-500/70 text-white` : isCurrent && session.status === 'HEADQUARTERS' ? 'border-cyan-500/70 text-cyan-200 bg-cyan-900/20' : 'bg-slate-800 border-slate-600 text-gray-500'}`}
                                        style={isActive ? { background: `${uData?.color || '#22c55e'}22`, borderColor: `${uData?.color || '#22c55e'}99` } : {}}>
                                        {uData?.icon} U{idx + 1}
                                        {isCurrent && session.status === 'QUIZ_ACTIVE' && <span className="ml-1 text-orange-400">❓</span>}
                                    </div>
                                    {idx < session.universes.length - 1 && <div className="flex-shrink-0 text-gray-600">→</div>}
                                </React.Fragment>
                            );
                        })}
                        <div className="flex-shrink-0 text-gray-600">→</div>
                        <div className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border ${session.status === 'SESSION_COMPLETE' ? 'bg-red-800 border-red-500 text-white' : 'bg-slate-800 border-slate-600 text-gray-500'}`}>
                            🏁 Fin
                        </div>
                    </div>
                </div>

                {/* ══ STATUS BAR ══ */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: currentUniverseData ? `radial-gradient(ellipse at left, ${currentUniverseData.color || '#1e40af'}22 0%, transparent 60%)` : undefined }} />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="text-5xl">{currentUniverseData?.icon || (session.status === 'HEADQUARTERS' ? '🏛️' : '🌌')}</div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest">
                                {session.status === 'HEADQUARTERS' ? 'Quartier Général' : `Univers ${session.currentUniverseIndex + 1}/${session.universes.length}`}
                            </div>
                            <h2 className="text-2xl font-black text-white">
                                {session.status === 'HEADQUARTERS' ? 'Débrief & Préparation' : (currentUniverseData?.name || '—')}
                            </h2>
                        </div>
                    </div>
                    <div className="text-right relative z-10">
                        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Timer</div>
                        <div className={`text-5xl font-mono font-bold ${session.tickRemainingSeconds !== null && session.tickRemainingSeconds < 60 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                            {session.tickRemainingSeconds !== null ? formatTimer(session.tickRemainingSeconds) : '--:--'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* ══ LEFT: CONTRÔLE DE FLUX ══ */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 h-full space-y-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">🎬 Flux</h3>

                            {/* DRAFT → Lancer */}
                            {session.status === 'DRAFT' && (
                                <button onClick={adminActions.launchSession}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg hover:scale-[1.02] transition-all">
                                    ▶ LANCER L'INTRO
                                </button>
                            )}

                            {/* INTRO → Passer au QG */}
                            {session.status === 'INTRO' && (
                                <>
                                    <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded text-center text-blue-200 text-sm animate-pulse">
                                        📺 Vidéo d'intro en cours...
                                    </div>
                                    <button onClick={adminActions.openHeadquarters}
                                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg border border-slate-500 transition-all">
                                        ⏭ Passer au QG
                                    </button>
                                </>
                            )}

                            {/* HEADQUARTERS → Décoller vers l'univers courant */}
                            {session.status === 'HEADQUARTERS' && currentU && (
                                <button onClick={() => adminActions.openUniverse(currentU.universeId)}
                                    className="w-full py-4 font-bold text-white rounded-lg shadow-lg hover:scale-[1.02] transition-all"
                                    style={{ background: `linear-gradient(135deg, ${currentUniverseData?.color || '#2563eb'}cc, ${currentUniverseData?.color || '#2563eb'}44)` }}>
                                    🚀 DÉCOLLAGE<br />
                                    <span className="text-sm font-normal opacity-80">{currentUniverseData?.name}</span>
                                </button>
                            )}

                            {/* UNIVERSE_ACTIVE → Forcer Quiz */}
                            {session.status === 'UNIVERSE_ACTIVE' && (
                                <>
                                    <button onClick={adminActions.forceStartQuiz}
                                        className="w-full py-3 bg-orange-700 hover:bg-orange-600 text-white font-bold rounded-lg transition-all">
                                        ⚠️ FORCER LE QUIZ
                                    </button>
                                    <p className="text-xs text-center text-gray-500">Arrête le timer et ouvre le quiz</p>

                                    {currentUniverseData?.happening && (
                                        <button onClick={() => adminActions.triggerHappening(currentUniverseData.happening)}
                                            className="w-full py-3 rounded-lg font-bold text-white transition-all hover:scale-[1.02] border mt-2"
                                            style={{
                                                background: `linear-gradient(135deg, ${currentUniverseData.happening.color}33, ${currentUniverseData.happening.color}55)`,
                                                borderColor: `${currentUniverseData.happening.color}88`,
                                            }}>
                                            🎬 HAPPENING !
                                            <div className="text-xs font-normal opacity-70 truncate">{currentUniverseData.happening.subtitle}</div>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* QUIZ_ACTIVE → Clôturer */}
                            {session.status === 'QUIZ_ACTIVE' && (
                                <>
                                    <div className="p-3 bg-orange-900/30 border border-orange-500/30 rounded text-center text-orange-200 text-sm animate-pulse">
                                        ❓ Quiz en cours — attendez les réponses
                                    </div>
                                    <button onClick={adminActions.closeQuiz}
                                        className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-all">
                                        🔒 CLÔTURER LE QUIZ
                                    </button>
                                </>
                            )}

                            {/* UNIVERSE_COMPLETE → QG ou Terminer */}
                            {session.status === 'UNIVERSE_COMPLETE' && (
                                <>
                                    <div className="p-3 bg-purple-900/30 border border-purple-500/30 rounded text-center text-purple-200 text-sm">
                                        ✅ Univers terminé — débrief
                                    </div>
                                    {!isLastUniverse ? (
                                        <button onClick={adminActions.openNextUniverse}
                                            className="w-full py-4 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:scale-[1.02] transition-all">
                                            ⏭ UNIVERS SUIVANT
                                            <div className="text-xs font-normal opacity-70">
                                                {UNIVERSES[session.universes[session.currentUniverseIndex + 1]?.universeId]?.name}
                                            </div>
                                        </button>
                                    ) : (
                                        <button onClick={adminActions.endSession}
                                            className="w-full py-4 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-all">
                                            🏁 TERMINER LA SESSION
                                        </button>
                                    )}
                                    <button onClick={adminActions.openHeadquarters}
                                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm font-bold rounded-lg border border-slate-600 transition-all">
                                        🏛️ Retour QG
                                    </button>
                                </>
                            )}

                            {/* SESSION_COMPLETE */}
                            {session.status === 'SESSION_COMPLETE' && (
                                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded text-center text-red-200 text-sm">
                                    🏁 Session terminée<br />
                                    <span className="text-xs text-gray-400">Utilisez "Nouvelle soirée" dans l'admin pour recommencer</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. CENTER: LIVE ACTIONS & BONUSES */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 h-full">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                🎲 Maître du Jeu
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* ROUE DU DESTIN */}
                                <div className="col-span-2 bg-slate-900/50 p-4 rounded-lg border border-purple-500/30">
                                    <h4 className="font-bold text-purple-400 mb-2">🎡 Roue des Duels</h4>
                                    <div className="flex gap-2 mb-2">
                                        <select className="bg-slate-800 border-slate-600 text-white text-xs rounded p-2 flex-1">
                                            <option>Choisir Équipe A...</option>
                                            {Object.values(gameState.teams).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <span className="text-white font-bold self-center">VS</span>
                                        <select className="bg-slate-800 border-slate-600 text-white text-xs rounded p-2 flex-1">
                                            <option>Choisir Équipe B...</option>
                                            {Object.values(gameState.teams).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <button className="w-full py-2 bg-purple-900/50 border border-purple-500/50 hover:bg-purple-800 text-purple-200 rounded font-bold transition-colors">
                                        ⚡ LANCER LE DUEL
                                    </button>
                                </div>

                                {/* GLOBAL EFFECTS */}
                                <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                                    <h4 className="font-bold text-red-400 mb-2 text-sm">🚨 Effets WarRoom</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => adminActions.sendWarRoomCommand({ type: 'TRIGGER_ALERT', payload: { message: 'INTRUSION DÉTECTÉE' } })} className="flex-1 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 text-xs rounded border border-red-500/30">
                                            ALERTE ROUGE
                                        </button>
                                        <button onClick={() => adminActions.sendWarRoomCommand({ type: 'TRIGGER_GLITCH', payload: { duration: 5000 } })} className="flex-1 py-2 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 text-xs rounded border border-cyan-500/30">
                                            GLITCHE
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                                    <h4 className="font-bold text-yellow-400 mb-2 text-sm">🏆 Gestion Points</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => Object.keys(gameState.teams).forEach(id => adminActions.adjustScore(id, 500, 'Bonus MJ'))}
                                            className="flex-1 py-2 bg-green-900/50 hover:bg-green-800 text-green-200 text-xs rounded border border-green-500/30">
                                            +500 PTS (Tous)
                                        </button>
                                        <button
                                            onClick={() => Object.keys(gameState.teams).forEach(id => adminActions.adjustScore(id, -200, 'Pénalité MJ'))}
                                            className="flex-1 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 text-xs rounded border border-red-500/30">
                                            -200 PTS (Tous)
                                        </button>
                                    </div>
                                </div>

                                {/* 🎬 VIDEO WARROOM */}
                                <div className="col-span-2 p-4 rounded-lg bg-indigo-900/20 border border-indigo-500/30">
                                    <h4 className="font-bold text-indigo-300 mb-3 text-sm">🎬 Vidéos WarRoom</h4>

                                    {/* Raccourcis par univers */}
                                    {session.universes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {session.universes.map(u => {
                                                const uData = UNIVERSES[u.universeId];
                                                const vUrl = `/video/universes/${u.universeId}.mp4`;
                                                return (
                                                    <button
                                                        key={u.universeId}
                                                        onClick={() => adminActions.playVideo(vUrl)}
                                                        className="px-3 py-1.5 text-xs font-bold rounded border border-indigo-500/40 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 transition-all"
                                                        title={`Lancer vidéo intro ${uData?.name}`}
                                                    >
                                                        {uData?.icon} {uData?.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* URL manuelle + contrôles */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-400"
                                            placeholder="/video/intro.mp4"
                                            value={videoInput}
                                            onChange={e => setVideoInput(e.target.value)}
                                        />
                                        <button
                                            onClick={() => adminActions.playVideo(videoInput || '/video/intro.mp4')}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-colors"
                                        >
                                            ▶ PLAY
                                        </button>
                                        <button
                                            onClick={() => adminActions.playVideo(null)}
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs font-bold rounded transition-colors"
                                            title="Arrêter la vidéo"
                                        >
                                            ■
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. TEAM LIST (MINI) */}
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">📊 Équipes en direct ({Object.keys(gameState.teams).length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                        {Object.values(gameState.teams).map(t => (
                            <div key={t.id} className="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
                                <span className={`text-xs font-bold truncate ${t.connected ? 'text-green-400' : 'text-gray-500'}`}>
                                    {t.connected ? '●' : '○'} {t.name}
                                </span>
                                <span className="font-mono text-cyan-400 text-sm">{t.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="session-manager p-4">
            <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                🌙 GESTION SESSION NIGHT
            </h2>

            {(!session) ? (
                renderDraftMode()
            ) : (
                renderActiveMode()
            )}

            <style>{`
                .btn-action {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: bold;
                    color: white;
                    transition: transform 0.2s;
                }
                .btn-action:hover {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
