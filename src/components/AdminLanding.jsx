/**
 * 🚀 AdminLanding - Page d'accueil du Game Master
 * Choix entre : Reprendre / Mode Histoire / Open Games
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../context/GameContext';
import { UNIVERSES, UNIVERSE_ORDER } from '../data/universes';

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : Carte de mode
// ─────────────────────────────────────────────────────────────────────────────
function ModeCard({ icon, title, subtitle, description, color, onClick, disabled, badge }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.03, y: -4 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all overflow-hidden
                ${disabled
                    ? 'opacity-40 cursor-not-allowed border-white/10 bg-white/5'
                    : `cursor-pointer border-${color}-500/40 bg-${color}-900/10 hover:border-${color}-400/70 hover:bg-${color}-900/20`
                }`}
            style={!disabled ? {
                borderColor: `var(--color-${color})`,
                boxShadow: `0 0 30px -10px var(--color-${color})`
            } : {}}
        >
            {/* Glow bg */}
            {!disabled && (
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 30% 50%, var(--color-${color}), transparent 70%)` }}
                />
            )}

            {/* Badge */}
            {badge && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40">
                    {badge}
                </div>
            )}

            <div className="flex items-start gap-5 relative z-10">
                <div className="text-5xl flex-shrink-0">{icon}</div>
                <div className="flex-1">
                    <h3 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {title}
                    </h3>
                    <p className="text-sm font-semibold mb-3" style={{ color: `var(--color-${color})` }}>
                        {subtitle}
                    </p>
                    <p className="text-sm text-white/50 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : Configurateur Mode Histoire
// ─────────────────────────────────────────────────────────────────────────────
function StoryModeConfig({ onLaunch, onBack }) {
    const { formatTimer } = useGame();

    const [selectedUniverses, setSelectedUniverses] = useState([]);
    const [universeConfigs, setUniverseConfigs] = useState({});
    const [gamesPerUniverse, setGamesPerUniverse] = useState(4); // nb défis avant quiz
    const [introVideoUrl, setIntroVideoUrl] = useState('/video/intro.mp4');

    const toggleUniverse = (uId) => {
        if (selectedUniverses.includes(uId)) {
            setSelectedUniverses(prev => prev.filter(id => id !== uId));
            const next = { ...universeConfigs };
            delete next[uId];
            setUniverseConfigs(next);
        } else {
            setSelectedUniverses(prev => [...prev, uId]);
            const universe = UNIVERSES[uId];
            const activities = Object.values(universe.activities);
            const quiz = activities.find(a => a.type === 'quiz');
            const challenges = activities.filter(a => a.type !== 'quiz').slice(0, gamesPerUniverse).map(a => a.id);
            setUniverseConfigs(prev => ({
                ...prev,
                [uId]: {
                    universeId: uId,
                    selectedChallengeIds: challenges,
                    quizActivityId: quiz ? quiz.id : '',
                    durationSeconds: 1200
                }
            }));
        }
    };

    const toggleChallenge = (uId, challengeId) => {
        setUniverseConfigs(prev => {
            const cfg = prev[uId];
            const list = cfg.selectedChallengeIds;
            return {
                ...prev,
                [uId]: {
                    ...cfg,
                    selectedChallengeIds: list.includes(challengeId)
                        ? list.filter(id => id !== challengeId)
                        : [...list, challengeId]
                }
            };
        });
    };

    const handleLaunch = () => {
        if (selectedUniverses.length === 0) {
            alert('Sélectionnez au moins un univers !');
            return;
        }
        const universePayload = selectedUniverses.map(uId => universeConfigs[uId]);
        onLaunch({
            universes: universePayload,
            introVideoUrl,
            requiredTalismans: 50
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                    ← Retour
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        📖 Mode Histoire
                    </h2>
                    <p className="text-purple-400 text-sm">Configure ta Session Night</p>
                </div>
            </div>

            {/* Global Config */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                        🎮 Défis par univers (avant Quiz)
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setGamesPerUniverse(Math.max(1, gamesPerUniverse - 1))}
                            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-colors"
                        >−</button>
                        <span className="text-3xl font-black text-purple-400 w-12 text-center" style={{ fontFamily: 'Orbitron' }}>
                            {gamesPerUniverse}
                        </span>
                        <button
                            onClick={() => setGamesPerUniverse(Math.min(8, gamesPerUniverse + 1))}
                            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-colors"
                        >+</button>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                        🎬 Vidéo d'intro
                    </label>
                    <input
                        type="text"
                        value={introVideoUrl}
                        onChange={e => setIntroVideoUrl(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        placeholder="/video/intro.mp4"
                    />
                </div>
            </div>

            {/* Universe Selection */}
            <div>
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
                    🌌 Sélection des Univers ({selectedUniverses.length} sélectionné{selectedUniverses.length > 1 ? 's' : ''})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {UNIVERSE_ORDER.map(uId => {
                        const uni = UNIVERSES[uId];
                        const isSelected = selectedUniverses.includes(uId);
                        const cfg = universeConfigs[uId];

                        return (
                            <div
                                key={uId}
                                className={`rounded-xl border-2 overflow-hidden transition-all ${isSelected
                                    ? 'border-purple-500/60 bg-purple-900/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                            >
                                {/* Toggle Header */}
                                <div
                                    onClick={() => toggleUniverse(uId)}
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{uni.icon}</span>
                                        <span className="font-bold text-sm text-white">{uni.name}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/30'}`}>
                                        {isSelected && <span className="text-white text-xs">✓</span>}
                                    </div>
                                </div>

                                {/* Config Panel */}
                                <AnimatePresence>
                                    {isSelected && cfg && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden border-t border-white/10"
                                        >
                                            <div className="p-3 space-y-3 bg-black/20">
                                                {/* Duration */}
                                                <div>
                                                    <div className="flex justify-between text-xs text-white/40 mb-1">
                                                        <span>⏱ Durée</span>
                                                        <span className="text-white font-mono">{formatTimer(cfg.durationSeconds)}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="300" max="3600" step="60"
                                                        value={cfg.durationSeconds}
                                                        onChange={e => setUniverseConfigs(prev => ({
                                                            ...prev,
                                                            [uId]: { ...prev[uId], durationSeconds: parseInt(e.target.value) }
                                                        }))}
                                                        className="w-full h-1 accent-purple-500"
                                                    />
                                                </div>

                                                {/* Challenges */}
                                                <div>
                                                    <p className="text-xs text-white/40 mb-2">
                                                        🎯 Défis ({cfg.selectedChallengeIds.length})
                                                    </p>
                                                    <div className="space-y-1 max-h-28 overflow-y-auto">
                                                        {Object.values(uni.activities)
                                                            .filter(a => a.type !== 'quiz')
                                                            .map(activity => {
                                                                const checked = cfg.selectedChallengeIds.includes(activity.id);
                                                                return (
                                                                    <div
                                                                        key={activity.id}
                                                                        onClick={() => toggleChallenge(uId, activity.id)}
                                                                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${checked ? 'text-purple-300 bg-purple-900/30' : 'text-white/30 hover:text-white/50'}`}
                                                                    >
                                                                        <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`}>
                                                                            {checked && <span className="text-[8px] text-white">✓</span>}
                                                                        </div>
                                                                        <span className="truncate">{activity.name}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
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

            {/* Launch Button */}
            <motion.button
                onClick={handleLaunch}
                disabled={selectedUniverses.length === 0}
                whileHover={selectedUniverses.length > 0 ? { scale: 1.02 } : {}}
                whileTap={selectedUniverses.length > 0 ? { scale: 0.98 } : {}}
                className={`w-full py-5 rounded-2xl font-black text-xl transition-all ${selectedUniverses.length > 0
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
                {selectedUniverses.length > 0
                    ? `🚀 LANCER LA SESSION (${selectedUniverses.length} univers)`
                    : 'Sélectionnez au moins 1 univers'
                }
            </motion.button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : Configurateur Open Games
// ─────────────────────────────────────────────────────────────────────────────
function OpenGamesConfig({ onLaunch, onBack }) {
    const { formatTimer } = useGame();

    const [gameDuration, setGameDuration] = useState(3600); // 1h par défaut
    const [accessibleUniverses, setAccessibleUniverses] = useState(
        UNIVERSE_ORDER.slice(0, 4) // 4 premiers par défaut
    );

    const DURATION_PRESETS = [
        { label: '30 min', value: 1800 },
        { label: '1h', value: 3600 },
        { label: '1h30', value: 5400 },
        { label: '2h', value: 7200 },
    ];

    const toggleUniverse = (uId) => {
        setAccessibleUniverses(prev =>
            prev.includes(uId) ? prev.filter(id => id !== uId) : [...prev, uId]
        );
    };

    const handleLaunch = () => {
        onLaunch({ duration: gameDuration, universes: accessibleUniverses });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                    ← Retour
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        🎮 Open Games
                    </h2>
                    <p className="text-cyan-400 text-sm">Jeu libre — les équipes explorent à leur rythme</p>
                </div>
            </div>

            {/* Duration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
                    ⏱ Durée de la partie
                </h3>
                <div className="flex gap-3 mb-4">
                    {DURATION_PRESETS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setGameDuration(p.value)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${gameDuration === p.value
                                ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="text-center">
                    <span className="text-4xl font-black text-cyan-400" style={{ fontFamily: 'Orbitron' }}>
                        {formatTimer(gameDuration)}
                    </span>
                    <p className="text-white/30 text-xs mt-1">Durée totale du jeu</p>
                </div>
            </div>

            {/* Accessible Universes */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
                    🌌 Défis accessibles ({accessibleUniverses.length} univers)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {UNIVERSE_ORDER.map(uId => {
                        const uni = UNIVERSES[uId];
                        const isOn = accessibleUniverses.includes(uId);
                        return (
                            <motion.button
                                key={uId}
                                onClick={() => toggleUniverse(uId)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isOn
                                    ? 'border-cyan-500/60 bg-cyan-900/20 text-white'
                                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                                    }`}
                            >
                                <span className="text-2xl">{uni.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate">{uni.name}</div>
                                    <div className="text-xs opacity-60">
                                        {Object.values(uni.activities).length} activités
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isOn ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'}`}>
                                    {isOn && <span className="text-white text-xs">✓</span>}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Launch */}
            <motion.button
                onClick={handleLaunch}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] transition-all"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
                🎮 LANCER OPEN GAMES
            </motion.button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : Admin Lobby (Kahoot-style, côté GM)
// ─────────────────────────────────────────────────────────────────────────────
function AdminLobbyView({ pendingConfig, onStart, onCancel }) {
    const { gameState, formatTimer } = useGame();
    const teams = Object.values(gameState.teams);
    const isStory = pendingConfig?.mode === 'story';
    const joinUrl = `${window.location.protocol}//${window.location.host}`;

    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                    <motion.div className="w-2.5 h-2.5 rounded-full bg-green-400"
                        animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    <span className="text-green-300 font-mono text-sm font-bold tracking-wider">LOBBY OUVERT</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {isStory ? '📖 Mode Histoire' : '🎮 Open Games'}
                </h2>
                <p className="text-white/40 text-sm">
                    {isStory
                        ? `${pendingConfig.config.universes.length} univers configurés · Les équipes peuvent rejoindre`
                        : `${formatTimer(pendingConfig.config.duration)} · Les équipes peuvent rejoindre`
                    }
                </p>
            </div>

            {/* QR Code + URL à projeter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-5">
                <div className="p-2 bg-white rounded-xl flex-shrink-0">
                    <QRCodeSVG value={joinUrl} size={100} level="M" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">Adresse pour les joueurs</div>
                    <div className="text-white font-black text-lg break-all">{joinUrl}</div>
                    <div className="text-green-400 font-mono text-xs mt-1">Scanner le QR code ou taper l'adresse</div>
                </div>
            </div>

            {/* Compteur */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <div className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">Équipes dans le salon</div>
                    <motion.div
                        key={teams.length}
                        initial={{ scale: 1.4, color: '#00ffff' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        transition={{ duration: 0.3 }}
                        className="text-5xl font-black font-mono"
                    >
                        {teams.length}
                    </motion.div>
                </div>
                <div className="text-right">
                    <div className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">Statut</div>
                    <div className="text-green-400 font-bold text-lg">En attente</div>
                </div>
            </div>

            {/* Grille des équipes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px]">
                {teams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-white/20 font-mono text-sm">
                        <div className="text-3xl mb-2">👁</div>
                        En attente de joueurs...
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        <AnimatePresence>
                            {teams.map(t => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
                                >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.connected ? 'bg-green-400' : 'bg-gray-600'}`} />
                                    <span className="text-white text-sm font-bold truncate">{t.name}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Bouton démarrer */}
            <motion.button
                onClick={onStart}
                disabled={teams.length === 0}
                whileHover={teams.length > 0 ? { scale: 1.02, y: -2 } : {}}
                whileTap={teams.length > 0 ? { scale: 0.98 } : {}}
                className={`w-full py-6 rounded-2xl font-black text-2xl transition-all ${teams.length > 0
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_40px_rgba(34,197,94,0.4)]'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
                {teams.length === 0 ? 'En attente de joueurs...' : `🚀 C'EST PARTI ! (${teams.length} équipe${teams.length > 1 ? 's' : ''})`}
            </motion.button>

            <button onClick={onCancel} className="w-full text-center text-xs text-white/20 hover:text-white/40 transition-colors underline">
                Annuler et revenir au menu
            </button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : AdminLanding
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLanding({ onEnterAdmin }) {
    const { gameState, connected, adminActions } = useGame();
    const [view, setView] = useState('home'); // 'home' | 'story' | 'open' | 'lobby'
    const [confirmReset, setConfirmReset] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [pendingConfig, setPendingConfig] = useState(null); // { mode, config }

    // Détecter si une session est en cours (pour "Reprendre")
    const hasActiveSession = gameState.status === 'PLAYING' || gameState.status === 'PAUSED' || gameState.status === 'LOBBY';
    const hasTeams = Object.keys(gameState.teams).length > 0;
    const hasRelevantProgress = hasTeams && Object.values(gameState.teams).some(t => t.score > 0 || (t.completedActivities && t.completedActivities.length > 0));
    const showResumeCard = hasActiveSession || hasRelevantProgress;

    const handleReset = async () => {
        setResetting(true);
        await adminActions.resetGame();
        setResetting(false);
        setConfirmReset(false);
    };

    const handleResume = () => {
        onEnterAdmin();
    };

    // Appelé quand la config histoire est validée → ouvre le lobby
    const handleStoryConfigDone = (sessionConfig) => {
        adminActions.newSession(); // Reset + LOBBY
        setPendingConfig({ mode: 'story', config: sessionConfig });
        setView('lobby');
    };

    // Appelé quand la config open games est validée → ouvre le lobby
    const handleOpenConfigDone = (gameConfig) => {
        adminActions.newSession(); // Reset + LOBBY
        setPendingConfig({ mode: 'open', config: gameConfig });
        setView('lobby');
    };

    // Depuis le lobby, démarrer réellement le jeu
    const handleLobbyStart = () => {
        if (!pendingConfig) return;
        if (pendingConfig.mode === 'story') {
            adminActions.createSession(pendingConfig.config);
            onEnterAdmin('session');
        } else {
            adminActions.setTimer(pendingConfig.config.duration);
            adminActions.startGame();
            onEnterAdmin('standard');
        }
    };

    const handleLobbyCancel = () => {
        setPendingConfig(null);
        setView('home');
    };

    // Floating background icons
    const BG_ICONS = ['⚔️', '🚀', '🦖', '🧙', '🤖', '👾', '🍄', '💀', '🌌', '🐉', '🕷️', '⚡', '🎮', '💊', '🔮'];

    return (
        <div className="min-h-screen bg-[#030712] text-white relative overflow-hidden flex flex-col">
            {/* CSS Variables for colors */}
            <style>{`
                :root {
                    --color-purple: #a855f7;
                    --color-cyan: #06b6d4;
                    --color-amber: #f59e0b;
                    --color-green: #22c55e;
                }
            `}</style>

            {/* Background floating icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {BG_ICONS.map((icon, i) => (
                    <motion.div
                        key={i}
                        className="absolute select-none text-5xl"
                        style={{
                            left: `${(i * 7 + 3) % 95}%`,
                            top: `${(i * 13 + 5) % 90}%`,
                            opacity: 0.04
                        }}
                        animate={{ y: [0, -20, 0], opacity: [0.03, 0.07, 0.03] }}
                        transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                    >
                        {icon}
                    </motion.div>
                ))}
            </div>

            {/* Neon grid */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(100,0,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,0,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
            />

            {/* Radial glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.12) 0%, transparent 60%)' }} />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <motion.div
                        className="text-4xl"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                        🌀
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-black" style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(135deg, #a855f7, #ec4899, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            MULTIVERS QUEST
                        </h1>
                        <p className="text-xs text-yellow-400/80 font-bold tracking-wider">
                            Le bordel cosmique commence ici
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${connected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {connected ? 'Serveur connecté' : 'Déconnecté'}
                    </div>
                    {hasTeams && (
                        <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            👥 {Object.keys(gameState.teams).length} équipes
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-3xl">
                    <AnimatePresence mode="wait">

                        {/* ── HOME ── */}
                        {view === 'home' && (
                            <motion.div
                                key="home"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                        👑 GAME MASTER
                                    </h2>
                                    <p className="text-white/40">Que veux-tu faire aujourd'hui ?</p>
                                </div>

                                <div className="space-y-4">
                                    {/* REPRENDRE SESSION (Affiche seulement si pertinent) */}
                                    {showResumeCard && (
                                        <div className="relative">
                                            <ModeCard
                                                icon="▶️"
                                                title="Reprendre la session"
                                                subtitle={hasActiveSession ? `Jeu ${gameState.status === 'PLAYING' ? 'en cours' : 'en pause'}` : `${Object.keys(gameState.teams).length} équipes enregistrées`}
                                                description={hasActiveSession || hasTeams
                                                    ? "Reprends le contrôle là où tu t'es arrêté. Toutes les équipes et scores sont conservés."
                                                    : "Aucune session active pour le moment. Lance un nouveau jeu ci-dessous."
                                                }
                                                color="green"
                                                onClick={handleResume}
                                                disabled={false}
                                                badge={hasActiveSession ? (gameState.status === 'PLAYING' ? '🟢 EN COURS' : '⏸ EN PAUSE') : '💾 SAUVEGARDÉ'}
                                            />

                                            {/* Bouton suppression */}
                                            <div className="flex justify-end mt-2">
                                                {!confirmReset ? (
                                                    <button
                                                        onClick={() => setConfirmReset(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                                                    >
                                                        🗑️ Supprimer les sessions sauvegardées
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
                                                        <span className="text-xs text-red-300">Supprimer scores + session ?</span>
                                                        <button
                                                            onClick={handleReset}
                                                            disabled={resetting}
                                                            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                                                        >
                                                            {resetting ? '...' : 'Confirmer'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmReset(false)}
                                                            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white/60 text-xs font-bold transition-colors"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                    {/* MODE HISTOIRE */}
                                    <ModeCard
                                        icon="📖"
                                        title="Mode Histoire"
                                        subtitle="Session Night orchestrée"
                                        description="Configure des univers avec leurs défis et un quiz final. Les équipes progressent univers par univers, guidées par le Game Master."
                                        color="purple"
                                        onClick={() => setView('story')}
                                        disabled={false}
                                    />

                                    {/* OPEN GAMES */}
                                    <ModeCard
                                        icon="🎮"
                                        title="Open Games"
                                        subtitle="Jeu libre & exploration"
                                        description="Les équipes explorent librement tous les univers disponibles pendant un temps défini. Idéal pour les événements décontractés."
                                        color="cyan"
                                        onClick={() => setView('open')}
                                        disabled={false}
                                    />
                                </div>

                                {/* Accès direct admin */}
                                <div className="text-center pt-4">
                                    <button
                                        onClick={() => onEnterAdmin('standard')}
                                        className="text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-4"
                                    >
                                        Accéder directement au panneau admin →
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── MODE HISTOIRE ── */}
                        {view === 'story' && (
                            <motion.div key="story">
                                <StoryModeConfig
                                    onLaunch={handleStoryConfigDone}
                                    onBack={() => setView('home')}
                                />
                            </motion.div>
                        )}

                        {/* ── OPEN GAMES ── */}
                        {view === 'open' && (
                            <motion.div key="open">
                                <OpenGamesConfig
                                    onLaunch={handleOpenConfigDone}
                                    onBack={() => setView('home')}
                                />
                            </motion.div>
                        )}

                        {/* ── LOBBY ── */}
                        {view === 'lobby' && (
                            <AdminLobbyView
                                pendingConfig={pendingConfig}
                                onStart={handleLobbyStart}
                                onCancel={handleLobbyCancel}
                            />
                        )}

                    </AnimatePresence>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-4 text-white/10 text-xs border-t border-white/5">
                MULTIVERS QUEST • GAME MASTER CONSOLE • v2.0
            </footer>
        </div>
    );
}
