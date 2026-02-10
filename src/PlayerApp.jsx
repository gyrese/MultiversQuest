/**
 * 📱 PlayerApp - Interface Joueur MultiversQuest
 * Application mobile/tablette avec connexion serveur temps réel
 * Gère: Login → Hub (avec choix univers + activités) → Activités
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from './context/GameContext';
import { PlayerProvider, useGame as usePlayerGame } from './context/PlayerContext';
import { AVATAR_STYLES, getAvatarUrl } from './utils/avatars';
import Hub from './components/Hub';
import './index.css';
import DebugPanel from './components/debug/DebugPanel';

// Lazy load activities pour optimiser le bundle initial
const Rencontre3eType = lazy(() => import('./activities/Rencontre3eType.jsx'));
const JurassicHack = lazy(() => import('./activities/JurassicHack.jsx'));
const SceauRunique = lazy(() => import('./activities/SceauRunique.jsx'));
const TenetInversion = lazy(() => import('./activities/TenetInversion.jsx'));

// Map des composants d'activité
// Les clés doivent correspondre aux IDs utilisés dans les données de l'univers
const ACTIVITY_MAP = {
  'rencontre_3e_type': Rencontre3eType,
  'jurassic_hack': JurassicHack,
  'sceau_runique': SceauRunique,
  'tenet_inversion': TenetInversion,
};

// ============================================
// 🔄 LOADING COMPONENT
// ============================================
function LoadingSpinner({ message = "Chargement..." }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
      />
      <p className="text-gray-400 font-mono text-sm">{message}</p>
    </div>
  );
}

// ============================================
// 🔐 LOGIN SCREEN
// ============================================

function TeamLogin({ onJoinSuccess }) {
  const { connected, createTeam, gameState } = useGame();
  const [teamName, setTeamName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(AVATAR_STYLES[0]);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing team in localStorage
  useEffect(() => {
    const savedTeamId = localStorage.getItem('teamId');
    const savedToken = localStorage.getItem('teamToken');
    const savedName = localStorage.getItem('teamName');
    const savedStyle = localStorage.getItem('teamAvatarStyle');

    if (savedTeamId && savedToken && savedName) {
      // Auto-login with saved credentials
      onJoinSuccess({
        teamId: savedTeamId,
        token: savedToken,
        name: savedName,
        avatarStyle: savedStyle || 'bottts'
      });
    }
  }, [onJoinSuccess]);

  const handleCreateTeam = async () => {
    if (!teamName.trim() || teamName.length < 2) {
      setError('Le nom doit faire au moins 2 caractères');
      return;
    }

    setIsJoining(true);
    setError(null);

    const result = await createTeam(teamName.trim(), selectedStyle.id);

    if (result.error) {
      setError(result.error);
      setIsJoining(false);
    } else {
      // Save to localStorage for persistence
      localStorage.setItem('teamId', result.teamId);
      localStorage.setItem('teamToken', result.token);
      localStorage.setItem('teamName', teamName.trim());
      localStorage.setItem('teamAvatarStyle', selectedStyle.id);

      onJoinSuccess({
        teamId: result.teamId,
        token: result.token,
        name: teamName.trim(),
        avatarStyle: selectedStyle.id
      });
    }
  };

  // URL de l'avatar prévisualisé
  const previewAvatarUrl = getAvatarUrl(teamName || 'Preview', selectedStyle.id, 128);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a15] via-[#0f0f1f] to-[#0a0a15] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
                            radial-gradient(circle at 20% 30%, rgba(0,255,255,0.15) 0%, transparent 40%),
                            radial-gradient(circle at 80% 70%, rgba(255,0,255,0.15) 0%, transparent 40%)
                        `
          }} />
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
                            linear-gradient(rgba(0,255,255,0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,255,0.2) 1px, transparent 1px)
                        `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-mono ${connected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}
        >
          {connected ? '🟢 Connecté' : '🔴 Hors ligne'}
        </motion.div>

        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-32 h-32 mx-auto mb-4"
            animate={{
              scale: [1, 1.05, 1],
              filter: ['drop-shadow(0 0 10px rgba(0,212,255,0.5))', 'drop-shadow(0 0 20px rgba(255,0,255,0.5))', 'drop-shadow(0 0 10px rgba(0,212,255,0.5))']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <img
              src="/images/rocket-logo.png"
              alt="Multivers Quest"
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 text-transparent bg-clip-text mb-2"
            style={{ fontFamily: 'Orbitron, sans-serif' }}>
            MULTIVERS QUEST
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            {'>'} Portail de connexion au Nexus
          </p>
        </motion.div>

        {/* Team Creation Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#12121a]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8"
            style={{ boxShadow: '0 0 40px rgba(0,255,255,0.1)' }}>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4">
                <img src="/images/rocket-logo.png" alt="" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron' }}>
                Créer votre équipe
              </h2>
              <p className="text-gray-400 text-sm">
                {gameState.status === 'PLAYING'
                  ? '⚡ Partie en cours - Rejoignez maintenant!'
                  : 'Choisissez un nom mémorable pour votre équipe'}
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {/* Nom de l'équipe */}
              <div>
                <label className="block text-gray-400 text-sm font-mono mb-2">
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
                  placeholder="Les Voyageurs du Multivers..."
                  maxLength={30}
                  autoFocus
                  disabled={!connected}
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-cyan-900/50 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all disabled:opacity-50"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Sélection de Style d'Avatar + Prévisualisation */}
              <div>
                <label className="block text-gray-400 text-sm font-mono mb-3">
                  Style d'avatar
                </label>

                {/* Prévisualisation de l'avatar généré */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    key={previewAvatarUrl}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyan-500/50"
                    style={{ boxShadow: '0 0 25px rgba(0,212,255,0.3)' }}
                  >
                    <img
                      src={previewAvatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                {/* Grille des styles */}
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <motion.button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${selectedStyle.id === style.id
                        ? 'bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 border-2 border-cyan-400'
                        : 'bg-[#0a0a0f] border border-gray-800 hover:border-gray-600'
                        }`}
                      style={{
                        boxShadow: selectedStyle.id === style.id
                          ? '0 0 15px rgba(0,212,255,0.3)'
                          : 'none'
                      }}
                      title={style.label}
                    >
                      <span className="text-lg">{style.icon}</span>
                      <span className={`text-[10px] font-mono ${selectedStyle.id === style.id ? 'text-cyan-400' : 'text-gray-500'
                        }`}>
                        {style.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Info style sélectionné */}
                <motion.p
                  key={selectedStyle.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-center text-xs text-gray-500 font-mono"
                >
                  💡 L'avatar change selon le nom de l'équipe
                </motion.p>
              </div>

              <motion.button
                whileHover={{ scale: connected && teamName.trim() ? 1.02 : 1 }}
                whileTap={{ scale: connected && teamName.trim() ? 0.98 : 1 }}
                onClick={handleCreateTeam}
                disabled={!teamName.trim() || isJoining || !connected}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${teamName.trim() && !isJoining && connected
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:from-cyan-400 hover:to-fuchsia-400'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                style={{ fontFamily: 'Orbitron' }}
              >
                {!connected ? (
                  '⏳ Connexion au serveur...'
                ) : isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >⚡</motion.span>
                    Connexion au Nexus...
                  </span>
                ) : (
                  'Entrer dans le Multivers'
                )}
              </motion.button>
            </div>

            {/* Teams Count */}
            <div className="mt-4 text-center text-gray-500 text-xs font-mono">
              👥 {Object.keys(gameState.teams).length} équipes inscrites
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-gray-600 text-xs font-mono"
        >
          MultiversQuest © 2026 - Portail Dimensionnel v2.0
        </motion.p>
      </div>
    </div>
  );
}

// ============================================
// 🎮 MAIN APP CONTENT
// ============================================
function AppContent() {
  const { identify, connected, gameState, submitScore } = useGame();
  const { state: playerState, actions: playerActions } = usePlayerGame();

  const [currentView, setCurrentView] = useState('login'); // login, hub, activity
  const [team, setTeam] = useState(null);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);

  // Identify as player when connected
  useEffect(() => {
    if (connected && team) {
      identify('TEAM', team.teamId);
    }
  }, [connected, team, identify]);

  // Handlers
  const handleJoinSuccess = (teamData) => {
    setTeam(teamData);
    playerActions.initializeTeam(teamData.name, teamData.avatarStyle || 'bottts');
    setCurrentView('hub');
  };

  const handleLogout = () => {
    localStorage.removeItem('teamId');
    localStorage.removeItem('teamToken');
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamAvatarStyle');
    setTeam(null);
    setCurrentView('login');
  };

  // Called from Hub > UniverseCard when user selects an activity
  const handleStartActivity = (universeId, activityId) => {
    setSelectedUniverse(universeId);
    setActiveActivity(activityId);
    playerActions.startActivity(universeId, activityId);
    setCurrentView('activity');
  };

  const handleCompleteActivity = (points) => {
    if (selectedUniverse && activeActivity) {
      // Update local state
      playerActions.completeActivity(selectedUniverse, activeActivity, points);

      // Send to server
      submitScore(selectedUniverse, activeActivity, points, true, {
        universeCompleted: false
      });
    }

    setTimeout(() => {
      setActiveActivity(null);
      setSelectedUniverse(null);
      setCurrentView('hub');
    }, 1500);
  };

  const handleExitActivity = () => {
    setActiveActivity(null);
    setSelectedUniverse(null);
    setCurrentView('hub');
    playerActions.setCurrentActivity(null);
  };

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // Get activity component
  const ActivityComponent = activeActivity ? ACTIVITY_MAP[activeActivity] : null;

  return (
    <>
      <AnimatePresence mode="wait">
        {currentView === 'login' && (
          <motion.div
            key="login"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <TeamLogin onJoinSuccess={handleJoinSuccess} />
          </motion.div>
        )}

        {currentView === 'hub' && team && (
          <motion.div
            key="hub"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Server Status Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-[#030308]/90 backdrop-blur-sm border-b border-cyan-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400 font-mono">
                  {gameState.status === 'PLAYING' ? '🎮 En jeu' :
                    gameState.status === 'PAUSED' ? '⏸️ Pause' :
                      gameState.status === 'ENDED' ? '🏁 Terminé' : '⏳ Attente'}
                </span>
              </div>
              {gameState.status === 'PLAYING' && gameState.globalTimer > 0 && (
                <span className="text-cyan-400 font-mono text-sm" style={{ fontFamily: 'Orbitron' }}>
                  ⏱️ {Math.floor(gameState.globalTimer / 60)}:{String(gameState.globalTimer % 60).padStart(2, '0')}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:text-red-300 font-mono"
              >
                Quitter
              </button>
            </div>

            {/* Hub with padding for status bar */}
            <div className="pt-10">
              <Hub onStartActivity={handleStartActivity} />
            </div>
          </motion.div>
        )}

        {currentView === 'activity' && ActivityComponent && (
          <motion.div
            key={`activity-${activeActivity}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<LoadingSpinner message="Chargement de l'activité..." />}>
              <ActivityComponent
                universeId={selectedUniverse}
                onComplete={handleCompleteActivity}
                onExit={handleExitActivity}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
      <DebugPanel onLaunch={handleStartActivity} />
    </>
  );
}

// ============================================
// 🚀 MAIN EXPORT
// ============================================
export default function PlayerApp() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}
