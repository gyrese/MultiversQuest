/**
 * 👑 AdminPanel - Interface Game Master
 * Contrôle total sur le jeu MultiversQuest
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

// Événements scénaristiques prédéfinis
const SCENARIO_EVENTS = [
    {
        id: 'GLITCH_UNIVERSEL',
        name: 'Glitch Universel',
        description: 'Une anomalie temporelle déforme la réalité!',
        icon: '🔮',
        effect: 'GLITCH',
        duration: 30000,
        color: '#9b59b6'
    },
    {
        id: 'ALERTE_ROUGE',
        name: 'Alerte Rouge',
        description: 'Intrusion détectée dans le système!',
        icon: '🚨',
        effect: 'ALERT',
        duration: 20000,
        color: '#e74c3c'
    },
    {
        id: 'BONUS_COSMIQUE',
        name: 'Bonus Cosmique',
        description: 'Points x2 temporaire pour tous!',
        icon: '⭐',
        effect: 'BONUS',
        duration: 60000,
        color: '#f1c40f'
    },
    {
        id: 'INVASION_BOWSER',
        name: 'Invasion Bowser',
        description: "L'univers Mario est attaqué!",
        icon: '🐢',
        effect: 'INVASION',
        duration: 45000,
        color: '#e67e22'
    },
    {
        id: 'PANNE_MATRICE',
        name: 'Panne de la Matrice',
        description: 'Le code source devient instable...',
        icon: '💊',
        effect: 'MATRIX_GLITCH',
        duration: 25000,
        color: '#27ae60'
    },
    {
        id: 'ORDRE_66',
        name: 'Ordre 66',
        description: 'Exécutez l\'Ordre 66...',
        icon: '⚔️',
        effect: 'IMPERIAL',
        duration: 30000,
        color: '#c0392b'
    }
];

// Préréglages de timer
const TIMER_PRESETS = [
    { label: '15 min', seconds: 900 },
    { label: '30 min', seconds: 1800 },
    { label: '45 min', seconds: 2700 },
    { label: '1 heure', seconds: 3600 },
    { label: '1h30', seconds: 5400 },
    { label: '2 heures', seconds: 7200 }
];

export default function AdminPanel() {
    const {
        connected,
        gameState,
        sortedTeams,
        adminActions,
        formatTimer,
        identify
    } = useGame();

    const [selectedTeam, setSelectedTeam] = useState(null);
    const [pointsToAdd, setPointsToAdd] = useState(100);
    const [customTimer, setCustomTimer] = useState('');
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [notification, setNotification] = useState(null);

    // États pour le contrôle du WarRoom
    const [alertMessage, setAlertMessage] = useState('ALERTE MULTIVERS');
    const [unlockUniverse, setUnlockUniverse] = useState('');
    const [unlockTeam, setUnlockTeam] = useState('');

    // S'identifier comme Admin au montage
    useEffect(() => {
        identify('ADMIN');
    }, [identify]);

    // Afficher une notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Handlers
    const handleStartGame = () => {
        adminActions.startGame();
        showNotification('🎮 Jeu démarré!');
    };

    const handlePauseGame = () => {
        adminActions.pauseGame();
        showNotification('⏸️ Jeu en pause');
    };

    const handleResumeGame = () => {
        adminActions.resumeGame();
        showNotification('▶️ Jeu repris');
    };

    const handleEndGame = () => {
        adminActions.endGame();
        showNotification('🏁 Jeu terminé!');
    };

    const handleSetTimer = (seconds) => {
        adminActions.setTimer(seconds);
        showNotification(`⏱️ Timer réglé à ${formatTimer(seconds)}`);
    };

    const handleCustomTimer = () => {
        const minutes = parseInt(customTimer);
        if (!isNaN(minutes) && minutes > 0) {
            handleSetTimer(minutes * 60);
            setCustomTimer('');
        }
    };

    const handleAdjustScore = (teamId, points) => {
        adminActions.adjustScore(teamId, points, 'Ajustement manuel');
        const team = gameState.teams[teamId];
        showNotification(`${points > 0 ? '+' : ''}${points} pts pour ${team?.name}`);
        setSelectedTeam(null);
    };

    const handleTriggerEvent = (event) => {
        adminActions.triggerEvent(event);
        showNotification(`⚡ ${event.name} déclenché!`);
    };

    const handleResetGame = async () => {
        const result = await adminActions.resetGame();
        if (result.success) {
            showNotification('🔄 Jeu réinitialisé!');
        } else {
            showNotification('❌ Erreur: ' + result.error, 'error');
        }
        setShowConfirmReset(false);
    };

    const handleDeleteTeam = async (teamId) => {
        const team = gameState.teams[teamId];
        if (confirm(`Supprimer l'équipe "${team?.name}" ?`)) {
            const result = await adminActions.deleteTeam(teamId);
            if (result.success) {
                showNotification(`🗑️ Équipe "${team?.name}" supprimée`);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTRÔLES WAR ROOM - Dual Channel (BroadcastChannel + Socket.IO)
    // ═══════════════════════════════════════════════════════════════════════════

    // Canal de communication avec le WarRoom (même PC)
    const warRoomChannel = useMemo(() => new BroadcastChannel('warroom_controls'), []);

    // Fonction helper pour envoyer sur les deux canaux
    const sendWarRoomCommand = useCallback((command) => {
        // 1. BroadcastChannel (même PC)
        warRoomChannel.postMessage(command);

        // 2. Socket.IO (appareils distants)
        adminActions.sendWarRoomCommand(command);
    }, [warRoomChannel, adminActions]);

    const handleTriggerAlert = () => {
        sendWarRoomCommand({
            type: 'TRIGGER_ALERT',
            payload: { message: alertMessage }
        });
        showNotification(`🚨 Alerte envoyée: "${alertMessage}"`);
    };

    const handleTriggerGlitch = () => {
        sendWarRoomCommand({
            type: 'TRIGGER_GLITCH',
            payload: { duration: 3000 }
        });
        showNotification('🔮 Effet Glitch envoyé!');
    };

    const handleShowUnlock = () => {
        if (!unlockUniverse || !unlockTeam) {
            showNotification('⚠️ Remplissez les deux champs', 'error');
            return;
        }
        sendWarRoomCommand({
            type: 'SHOW_UNLOCK',
            payload: { universe: unlockUniverse, team: unlockTeam }
        });
        showNotification(`🌌 Popup univers "${unlockUniverse}" envoyé!`);
        setUnlockUniverse('');
        setUnlockTeam('');
    };

    // Status badge
    const getStatusBadge = () => {
        const badges = {
            'LOBBY': { text: 'En Attente', color: '#3498db', icon: '🎯' },
            'PLAYING': { text: 'En Cours', color: '#27ae60', icon: '🎮' },
            'PAUSED': { text: 'En Pause', color: '#f39c12', icon: '⏸️' },
            'ENDED': { text: 'Terminé', color: '#e74c3c', icon: '🏁' }
        };
        return badges[gameState.status] || badges['LOBBY'];
    };

    const statusBadge = getStatusBadge();

    return (
        <div className="admin-panel">
            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        className={`notification ${notification.type}`}
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="admin-header">
                <div className="header-left">
                    <h1>👑 Game Master</h1>
                    <span className={`connection-status ${connected ? 'online' : 'offline'}`}>
                        {connected ? '🟢 Connecté' : '🔴 Déconnecté'}
                    </span>
                </div>
                <div className="header-center">
                    <div className="timer-display">
                        <span className="timer-label">TEMPS RESTANT</span>
                        <span className="timer-value">{formatTimer(gameState.globalTimer)}</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="status-badge" style={{ background: statusBadge.color }}>
                        {statusBadge.icon} {statusBadge.text}
                    </div>
                    <div className="phase-badge">
                        📍 {gameState.phase}
                    </div>
                </div>
            </header>

            <main className="admin-main">
                {/* Colonne Gauche - Contrôles */}
                <section className="control-section">
                    {/* Game Controls */}
                    <div className="card control-card">
                        <h2>🎮 Contrôle du Jeu</h2>
                        <div className="button-grid">
                            {gameState.status === 'LOBBY' && (
                                <button className="btn btn-start" onClick={handleStartGame}>
                                    ▶️ Démarrer
                                </button>
                            )}
                            {gameState.status === 'PLAYING' && (
                                <button className="btn btn-pause" onClick={handlePauseGame}>
                                    ⏸️ Pause
                                </button>
                            )}
                            {gameState.status === 'PAUSED' && (
                                <button className="btn btn-resume" onClick={handleResumeGame}>
                                    ▶️ Reprendre
                                </button>
                            )}
                            {(gameState.status === 'PLAYING' || gameState.status === 'PAUSED') && (
                                <button className="btn btn-end" onClick={handleEndGame}>
                                    🏁 Terminer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="card timer-card">
                        <h2>⏱️ Timer</h2>
                        <div className="timer-presets">
                            {TIMER_PRESETS.map(preset => (
                                <button
                                    key={preset.seconds}
                                    className="btn btn-timer"
                                    onClick={() => handleSetTimer(preset.seconds)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="custom-timer">
                            <input
                                type="number"
                                placeholder="Minutes..."
                                value={customTimer}
                                onChange={(e) => setCustomTimer(e.target.value)}
                                min="1"
                            />
                            <button className="btn btn-set" onClick={handleCustomTimer}>
                                Définir
                            </button>
                        </div>
                        <div className="timer-quick">
                            <button className="btn btn-add" onClick={() => handleSetTimer(gameState.globalTimer + 300)}>
                                +5 min
                            </button>
                            <button className="btn btn-sub" onClick={() => handleSetTimer(Math.max(0, gameState.globalTimer - 300))}>
                                -5 min
                            </button>
                        </div>
                    </div>

                    {/* Scenario Events */}
                    <div className="card events-card">
                        <h2>⚡ Événements Scénaristiques</h2>
                        <div className="events-grid">
                            {SCENARIO_EVENTS.map(event => (
                                <motion.button
                                    key={event.id}
                                    className="btn btn-event"
                                    style={{ '--event-color': event.color }}
                                    onClick={() => handleTriggerEvent(event)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="event-icon">{event.icon}</span>
                                    <span className="event-name">{event.name}</span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Active Effects */}
                        {gameState.activeEffects?.length > 0 && (
                            <div className="active-effects">
                                <h3>Effets Actifs:</h3>
                                {gameState.activeEffects.map((eff, i) => (
                                    <span key={i} className="effect-tag">{eff.effect}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 📺 Contrôle War Room */}
                    <div className="card warroom-card">
                        <h2>📺 Contrôle War Room</h2>
                        <p className="warroom-hint">
                            Effets visuels sur l'écran <code>/warroom</code>
                        </p>

                        {/* Theme Selection */}
                        <div className="warroom-section">
                            <label>🎨 Thème Visuel</label>
                            <div className="button-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                {/* DÉFAUT */}
                                <button
                                    className={`btn`}
                                    onClick={() => adminActions.setWarRoomTheme('default')}
                                    style={{
                                        background: gameState.themeUniverse === 'default' ? '#8e44ad' : 'rgba(255,255,255,0.1)',
                                        gridColumn: 'span 2'
                                    }}
                                >
                                    🌀 Défaut (Sci-Fi)
                                </button>

                                {/* SPACE MISSION (NEW) */}
                                <button
                                    className={`btn`}
                                    onClick={() => adminActions.setWarRoomTheme('odyssee_spatiale')}
                                    style={{
                                        background: gameState.themeUniverse === 'odyssee_spatiale' ? '#0ea5e9' : 'rgba(255,255,255,0.05)',
                                        color: gameState.themeUniverse === 'odyssee_spatiale' ? '#fff' : '#38bdf8',
                                        border: '1px solid #38bdf8',
                                        gridColumn: 'span 2'
                                    }}
                                >
                                    🚀 Space Mission
                                </button>

                                {/* JURASSIC */}
                                <button
                                    className={`btn`}
                                    onClick={() => adminActions.setWarRoomTheme('jurassic')}
                                    style={{
                                        background: gameState.themeUniverse === 'jurassic' ? '#27ae60' : 'rgba(255,255,255,0.05)',
                                        color: gameState.themeUniverse === 'jurassic' ? '#fff' : '#2ecc71',
                                        border: '1px solid #2ecc71'
                                    }}
                                >
                                    🦖 Jurassic
                                </button>

                                {/* POST-APO */}
                                <button
                                    className={`btn`}
                                    onClick={() => adminActions.setWarRoomTheme('post_apo')}
                                    style={{
                                        background: gameState.themeUniverse === 'post_apo' ? '#ea580c' : 'rgba(255,255,255,0.05)',
                                        color: gameState.themeUniverse === 'post_apo' ? '#fff' : '#fb923c',
                                        border: '1px solid #fb923c'
                                    }}
                                >
                                    ☢️ Post-Apo
                                </button>

                                {/* MARIO */}
                                <button
                                    className={`btn`}
                                    onClick={() => adminActions.setWarRoomTheme('mario')}
                                    style={{
                                        background: gameState.themeUniverse === 'mario' ? '#e52521' : 'rgba(255,255,255,0.05)',
                                        color: gameState.themeUniverse === 'mario' ? '#fff' : '#f87171',
                                        border: '1px solid #f87171'
                                    }}
                                >
                                    🍄 Mario (8-bit)
                                </button>

                                {/* FANTASY */}
                                <button
                                    className={`btn`}
                                    onClick={() => adminActions.setWarRoomTheme('fantasy')}
                                    style={{
                                        background: gameState.themeUniverse === 'fantasy' ? '#d4af37' : 'rgba(255,255,255,0.05)',
                                        color: gameState.themeUniverse === 'fantasy' ? '#fff' : '#fcd34d',
                                        border: '1px solid #fcd34d'
                                    }}
                                >
                                    ⚔️ Fantasy
                                </button>
                            </div>
                        </div>

                        {/* Alerte Rouge */}
                        <div className="warroom-section">
                            <label>🚨 Alerte Rouge</label>
                            <div className="warroom-input-group">
                                <input
                                    type="text"
                                    value={alertMessage}
                                    onChange={(e) => setAlertMessage(e.target.value)}
                                    placeholder="Message d'alerte..."
                                />
                                <button className="btn btn-alert" onClick={handleTriggerAlert}>
                                    Déclencher
                                </button>
                            </div>
                        </div>

                        {/* Glitch */}
                        <div className="warroom-section">
                            <label>🔮 Effet Glitch</label>
                            <button className="btn btn-glitch" onClick={handleTriggerGlitch}>
                                Activer Glitch (3s)
                            </button>
                        </div>

                        {/* Popup Univers Débloqué */}
                        <div className="warroom-section">
                            <label>🌌 Popup Univers Débloqué</label>
                            <div className="warroom-input-group">
                                <input
                                    type="text"
                                    value={unlockUniverse}
                                    onChange={(e) => setUnlockUniverse(e.target.value)}
                                    placeholder="Nom de l'univers..."
                                />
                                <input
                                    type="text"
                                    value={unlockTeam}
                                    onChange={(e) => setUnlockTeam(e.target.value)}
                                    placeholder="Équipe..."
                                />
                            </div>
                            <button className="btn btn-unlock" onClick={handleShowUnlock}>
                                Afficher Popup
                            </button>
                        </div>
                    </div>
                </section>

                {/* Colonne Droite - Équipes */}
                <section className="teams-section">
                    <div className="card teams-card">
                        <h2>👥 Équipes ({Object.keys(gameState.teams).length})</h2>

                        <div className="teams-list">
                            {sortedTeams.length === 0 ? (
                                <div className="no-teams">
                                    <span>🎯</span>
                                    <p>Aucune équipe inscrite</p>
                                </div>
                            ) : (
                                sortedTeams.map((team, index) => (
                                    <motion.div
                                        key={team.id}
                                        className={`team-row ${selectedTeam === team.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="team-rank">#{index + 1}</div>
                                        <div className="team-info">
                                            <span className="team-name">{team.name}</span>
                                            <span className={`team-status ${team.connected ? 'online' : 'offline'}`}>
                                                {team.connected ? '🟢' : '⚫'}
                                            </span>
                                        </div>
                                        <div className="team-score">{(team.score || 0).toLocaleString()} pts</div>

                                        {/* Actions Panel */}
                                        <AnimatePresence>
                                            {selectedTeam === team.id && (
                                                <motion.div
                                                    className="team-actions"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <div className="points-adjust">
                                                        <input
                                                            type="number"
                                                            value={pointsToAdd}
                                                            onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            className="btn btn-add-points"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAdjustScore(team.id, pointsToAdd);
                                                            }}
                                                        >
                                                            + Ajouter
                                                        </button>
                                                        <button
                                                            className="btn btn-remove-points"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAdjustScore(team.id, -pointsToAdd);
                                                            }}
                                                        >
                                                            - Retirer
                                                        </button>
                                                    </div>
                                                    <button
                                                        className="btn btn-delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTeam(team.id);
                                                        }}
                                                    >
                                                        🗑️ Supprimer
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="card history-card">
                        <h2>📜 Historique</h2>
                        <div className="history-list">
                            {gameState.history?.slice(0, 15).map((log, i) => (
                                <div key={log.id || i} className={`history-item ${log.type.toLowerCase()}`}>
                                    <span className="history-time">
                                        {new Date(log.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="history-message">{log.message}</span>
                                </div>
                            ))}
                            {(!gameState.history || gameState.history.length === 0) && (
                                <p className="no-history">Aucune activité</p>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer - Danger Zone */}
            <footer className="admin-footer">
                <div className="danger-zone">
                    <button
                        className="btn btn-danger"
                        onClick={() => setShowConfirmReset(true)}
                    >
                        🔄 Réinitialiser le Jeu
                    </button>
                </div>
            </footer>

            {/* Modal de confirmation Reset */}
            <AnimatePresence>
                {showConfirmReset && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <h2>⚠️ Confirmer la Réinitialisation</h2>
                            <p>Cette action va supprimer TOUTES les équipes et remettre les scores à zéro.</p>
                            <p><strong>Cette action est irréversible!</strong></p>
                            <div className="modal-buttons">
                                <button className="btn btn-cancel" onClick={() => setShowConfirmReset(false)}>
                                    Annuler
                                </button>
                                <button className="btn btn-confirm-danger" onClick={handleResetGame}>
                                    Confirmer la Réinitialisation
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .admin-panel {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
                    color: #fff;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                /* Header */
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    background: rgba(0, 0, 0, 0.4);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .header-left h1 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #ffd700, #ff8c00);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .connection-status {
                    font-size: 0.85rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    display: inline-block;
                    margin-top: 0.5rem;
                }

                .connection-status.online { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
                .connection-status.offline { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }

                .timer-display {
                    text-align: center;
                }

                .timer-label {
                    display: block;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255, 255, 255, 0.5);
                }

                .timer-value {
                    font-family: 'Orbitron', monospace;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #00d4ff;
                    text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                }

                .header-right {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .status-badge, .phase-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .phase-badge {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Main Content */
                .admin-main {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    padding: 1.5rem 2rem;
                    max-height: calc(100vh - 150px);
                    overflow-y: auto;
                }

                .card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 1.5rem;
                    backdrop-filter: blur(10px);
                }

                .card h2 {
                    margin: 0 0 1rem 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                }

                /* Buttons */
                .btn {
                    border: none;
                    padding: 0.75rem 1.25rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }

                .button-grid {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .btn-start { background: linear-gradient(135deg, #27ae60, #2ecc71); color: #fff; }
                .btn-pause { background: linear-gradient(135deg, #f39c12, #e67e22); color: #fff; }
                .btn-resume { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; }
                .btn-end { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }

                /* Timer Card */
                .timer-presets {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .btn-timer {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    padding: 0.5rem;
                    font-size: 0.8rem;
                }

                .btn-timer:hover {
                    background: rgba(0, 212, 255, 0.3);
                }

                .custom-timer {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .custom-timer input {
                    flex: 1;
                    padding: 0.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(0, 0, 0, 0.3);
                    color: #fff;
                    font-size: 0.9rem;
                }

                .btn-set {
                    background: #00d4ff;
                    color: #000;
                }

                .timer-quick {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-add { background: rgba(46, 204, 113, 0.3); color: #2ecc71; }
                .btn-sub { background: rgba(231, 76, 60, 0.3); color: #e74c3c; }

                /* Events */
                .events-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }

                .btn-event {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, var(--event-color), color-mix(in srgb, var(--event-color) 70%, #000));
                    color: #fff;
                    border-radius: 12px;
                }

                .event-icon {
                    font-size: 1.5rem;
                }

                .event-name {
                    font-size: 0.75rem;
                    text-align: center;
                }

                .active-effects {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .active-effects h3 {
                    font-size: 0.8rem;
                    margin: 0 0 0.5rem 0;
                    color: rgba(255, 255, 255, 0.6);
                }

                .effect-tag {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    background: rgba(155, 89, 182, 0.3);
                    border-radius: 4px;
                    font-size: 0.75rem;
                    margin-right: 0.5rem;
                }

                /* War Room Controls */
                .warroom-card {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }

                .warroom-hint {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0 0 1rem 0;
                }

                .warroom-hint code {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                    color: #06b6d4;
                }

                .warroom-section {
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .warroom-section:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }

                .warroom-section label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: rgba(255, 255, 255, 0.8);
                }

                .warroom-input-group {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .warroom-input-group input {
                    flex: 1;
                    padding: 0.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(0, 0, 0, 0.3);
                    color: #fff;
                    font-size: 0.85rem;
                }

                .btn-alert {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    color: #fff;
                    animation: pulse-alert 2s infinite;
                }

                @keyframes pulse-alert {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
                }

                .btn-glitch {
                    background: linear-gradient(135deg, #9b59b6, #8e44ad);
                    color: #fff;
                    width: 100%;
                }

                .btn-unlock {
                    background: linear-gradient(135deg, #06b6d4, #0891b2);
                    color: #fff;
                    width: 100%;
                }

                /* Teams */
                .teams-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .team-row {
                    display: grid;
                    grid-template-columns: 40px 1fr auto;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .team-row:hover, .team-row.selected {
                    background: rgba(255, 255, 255, 0.08);
                }

                .team-rank {
                    font-family: 'Orbitron', monospace;
                    font-weight: 700;
                    color: #00d4ff;
                }

                .team-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .team-name {
                    font-weight: 600;
                }

                .team-score {
                    font-family: 'Orbitron', monospace;
                    font-weight: 600;
                    color: #ffd700;
                }

                .team-actions {
                    grid-column: 1 / -1;
                    padding-top: 0.75rem;
                    overflow: hidden;
                }

                .points-adjust {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .points-adjust input {
                    width: 80px;
                    padding: 0.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    background: rgba(0, 0, 0, 0.3);
                    color: #fff;
                    text-align: center;
                }

                .btn-add-points { background: #27ae60; color: #fff; flex: 1; }
                .btn-remove-points { background: #e74c3c; color: #fff; flex: 1; }
                .btn-delete { background: rgba(231, 76, 60, 0.2); color: #e74c3c; width: 100%; margin-top: 0.5rem; }

                .no-teams {
                    text-align: center;
                    padding: 2rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .no-teams span {
                    font-size: 3rem;
                }

                /* History */
                .history-list {
                    max-height: 200px;
                    overflow-y: auto;
                }

                .history-item {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin-bottom: 0.25rem;
                    font-size: 0.85rem;
                }

                .history-item.score { background: rgba(39, 174, 96, 0.1); }
                .history-item.event { background: rgba(155, 89, 182, 0.1); }
                .history-item.admin_adjust { background: rgba(241, 196, 15, 0.1); }

                .history-time {
                    color: rgba(255, 255, 255, 0.4);
                    font-family: monospace;
                    font-size: 0.75rem;
                }

                .no-history {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.4);
                }

                /* Footer */
                .admin-footer {
                    padding: 1rem 2rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .danger-zone {
                    text-align: center;
                }

                .btn-danger {
                    background: rgba(231, 76, 60, 0.2);
                    color: #e74c3c;
                    border: 1px solid rgba(231, 76, 60, 0.3);
                }

                .btn-danger:hover {
                    background: rgba(231, 76, 60, 0.4);
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: #1a1a2e;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 2rem;
                    max-width: 400px;
                    text-align: center;
                }

                .modal h2 {
                    margin: 0 0 1rem 0;
                    color: #e74c3c;
                }

                .modal p {
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 1rem;
                }

                .modal-buttons {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .btn-cancel {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .btn-confirm-danger {
                    flex: 1;
                    background: #e74c3c;
                    color: #fff;
                }

                /* Notification */
                .notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    z-index: 1001;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .notification.success {
                    background: linear-gradient(135deg, #27ae60, #2ecc71);
                    color: #fff;
                }

                .notification.error {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: #fff;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .admin-main {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div >
    );
}
