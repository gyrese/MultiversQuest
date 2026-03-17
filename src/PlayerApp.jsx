/**
 * 📱 PlayerApp - Interface Joueur MultiversQuest
 * Application mobile/tablette avec connexion serveur temps réel
 * Gère: Login → Hub (avec choix univers + activités) → Activités
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from './context/GameContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { getAvatarUrl } from './utils/avatars';
import Hub from './components/Hub';
import './index.css';
import DebugPanel from './components/debug/DebugPanel';
import TeamAvatar from './components/TeamAvatar';
import GameLobby from './components/GameLobby';

// Lazy load activities pour optimiser le bundle initial
// CORE
const Rencontre3eType = lazy(() => import('./activities/Rencontre3eType.jsx'));
const JurassicHack = lazy(() => import('./activities/JurassicHack.jsx'));
const SceauRunique = lazy(() => import('./activities/SceauRunique.jsx'));
const TenetInversion = lazy(() => import('./activities/TenetInversion.jsx'));
const KesselRun = lazy(() => import('./activities/KesselRun.jsx'));
const FalloutTerminal = lazy(() => import('./activities/FalloutTerminal.jsx'));
const RoverRadar = lazy(() => import('./activities/RoverRadar.jsx'));
const BugHunt = lazy(() => import('./activities/bugHunt/Game.jsx'));
const GenericQuiz = lazy(() => import('./activities/GenericQuiz.jsx'));
const ComingSoon = lazy(() => import('./activities/ComingSoon.jsx'));

// BATCH 1 (Simple React)
const MatrixChoix = lazy(() => import('./activities/MatrixChoix.jsx'));
const GotTrone = lazy(() => import('./activities/GotTrone.jsx'));
const TimelineParadox = lazy(() => import('./activities/TimelineParadox.jsx'));
const LionKingLyrics = lazy(() => import('./activities/LionKingLyrics.jsx'));

// BATCH 2 (Arcade React)
const Kamehameha = lazy(() => import('./activities/Kamehameha.jsx'));
const NickyLarson = lazy(() => import('./activities/NickyLarson.jsx'));
const SailorMoon = lazy(() => import('./activities/SailorMoon.jsx'));

// BATCH 3 (Casual React)
const ToyStoryAndy = lazy(() => import('./activities/ToyStoryAndy.jsx'));
const ShrekSwamp = lazy(() => import('./activities/ShrekSwamp.jsx'));
const ChihiroBath = lazy(() => import('./activities/ChihiroBath.jsx'));

// BATCH 4 (Odyssée Spatiale Complete)
const AlienSurvie = lazy(() => import('./activities/AlienSurvie.jsx'));
const InterstellarMorse = lazy(() => import('./activities/InterstellarMorse.jsx'));
const GravitySlingshot = lazy(() => import('./activities/GravitySlingshot.jsx'));

// BATCH 5 (Heroic Fantasy Complete)
const CoursPotions = lazy(() => import('./activities/CoursPotions.jsx'));
const OracleSmaug = lazy(() => import('./activities/OracleSmaug.jsx'));

// BATCH 6 (Horreur & Robots Start)
const RingVHS = lazy(() => import('./activities/RingVHS.jsx'));
const SkynetCode = lazy(() => import('./activities/SkynetCode.jsx'));
const SawEscape = lazy(() => import('./activities/SawEscape.jsx'));
const OverlookMaze = lazy(() => import('./activities/OverlookMaze.jsx'));
const PennywiseRunner = lazy(() => import('./activities/PennywiseRunner.jsx'));
const ThreeLaws = lazy(() => import('./activities/ThreeLaws.jsx'));
const VoightKampff = lazy(() => import('./activities/VoightKampff.jsx'));

// BATCH 7 (Préhistoire)
const SkullIsland = lazy(() => import('./activities/SkullIsland.jsx'));
const PrimalCommunication = lazy(() => import('./activities/PrimalCommunication.jsx'));
const PrimalHunt = lazy(() => import('./activities/PrimalHunt.jsx'));


// Map des composants d'activité
// Les clés doivent correspondre aux IDs utilisés dans les données de l'univers
const ACTIVITY_MAP = {
  // Existing
  'rencontre_3e_type': Rencontre3eType,
  'jurassic_hack': JurassicHack,
  'sceau_runique': SceauRunique,
  'tenet_inversion': TenetInversion,
  'kessel_run': KesselRun,
  'fallout_hack': FalloutTerminal,
  'seul_sur_mars': RoverRadar,
  'bug_hunt': BugHunt,

  // Batch 1 Additions
  'matrix_choix': MatrixChoix,
  'got_trone': GotTrone,
  'bttf_timeline': TimelineParadox,
  'lion_king_song': LionKingLyrics,

  // Batch 2 Additions
  'dbz_kamehameha': Kamehameha,
  'nicky_larson_tir': NickyLarson,
  'sailor_moon_transfo': SailorMoon,

  // Batch 3 Additions
  'toy_story_andy': ToyStoryAndy,
  'shrek_swamp': ShrekSwamp,
  'chihiro_bath': ChihiroBath,

  // Batch 4 Additions
  'alien_survie': AlienSurvie,
  'interstellar_morse': InterstellarMorse,
  'apollo_slingshot': GravitySlingshot,

  // Batch 5 Additions
  'hp_potions': CoursPotions,
  'hobbit_riddler': OracleSmaug,

  // Batch 6 Additions
  'ring_vhs': RingVHS,
  'terminator_code': SkynetCode,
  'saw_escape': SawEscape,
  'shining_labyrinth': OverlookMaze,
  'it_peurs': PennywiseRunner,
  'irobot_lois': ThreeLaws,
  'bladerunner_test': VoightKampff,

  // Batch 7 Additions
  'kong_survie': SkullIsland,
  'planete_singes': PrimalCommunication,
  'prehistoric_hunt': PrimalHunt,

  // À développer (fallback ComingSoon explicite)
  'inception_reves': ComingSoon,
  'strange_dimensions': ComingSoon,
  'olive_tom_tir': ComingSoon,
  'tlou_clickers': ComingSoon,
  'madmax_fury': ComingSoon,
  'walking_dead_defense': ComingSoon,

  // Quizzes
  'quiz_spatiale': GenericQuiz,
  'quiz_fantasy': GenericQuiz,
  'quiz_horreur': GenericQuiz,
  'quiz_robots': GenericQuiz,
  'quiz_dino': GenericQuiz,
  'quiz_dimensions': GenericQuiz,
  'quiz_dorothee': GenericQuiz,
  'quiz_animation': GenericQuiz,
  'quiz_apo': GenericQuiz,
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
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  // Nom sauvegardé pour le rejoin rapide (teamId effacé par éjection)
  const savedName = localStorage.getItem('teamName');
  const savedTeamId = localStorage.getItem('teamId');
  const canAutoRejoin = savedName && !savedTeamId; // teamId effacé = nouvelle soirée

  const handleQuickRejoin = async () => {
    if (!savedName || !connected) return;
    setIsJoining(true);
    setError(null);
    const result = await createTeam(savedName, 'pollinations');
    if (result.error) {
      setError(result.error);
      setIsJoining(false);
    } else {
      localStorage.setItem('teamId', result.teamId);
      localStorage.setItem('teamToken', result.token);
      localStorage.setItem('teamName', savedName);
      localStorage.setItem('teamAvatarStyle', 'pollinations');
      onJoinSuccess({ teamId: result.teamId, token: result.token, name: savedName, avatarStyle: 'pollinations' });
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || teamName.length < 2) {
      setError('Le nom doit faire au moins 2 caractères');
      return;
    }

    setIsJoining(true);
    setError(null);

    const result = await createTeam(teamName.trim(), 'pollinations');

    if (result.error) {
      setError(result.error);
      setIsJoining(false);
    } else {
      // Save to localStorage for persistence
      localStorage.setItem('teamId', result.teamId);
      localStorage.setItem('teamToken', result.token);
      localStorage.setItem('teamName', teamName.trim());
      localStorage.setItem('teamAvatarStyle', 'pollinations');

      onJoinSuccess({
        teamId: result.teamId,
        token: result.token,
        name: teamName.trim(),
        avatarStyle: 'pollinations'
      });
    }
  };



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

            {/* Rejoin rapide si nouvelle soirée */}
            {canAutoRejoin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 rounded-xl border border-cyan-500/40 bg-cyan-900/10"
              >
                <p className="text-cyan-300 text-xs font-mono mb-3 uppercase tracking-widest">Nouvelle soirée — Bienvenue de retour !</p>
                <motion.button
                  onClick={handleQuickRejoin}
                  disabled={!connected || isJoining}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)' }}
                >
                  <TeamAvatar name={savedName} size={28} className="rounded-full" />
                  <span>Continuer avec <span className="text-cyan-200">« {savedName} »</span></span>
                </motion.button>
                <p className="text-center text-white/30 text-xs mt-3 font-mono">— ou choisissez un nouveau nom ci-dessous —</p>
              </motion.div>
            )}

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

              {/* Prévisualisation de l'avatar généré */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-black/40 relative shadow-[0_0_25px_rgba(0,212,255,0.3)]"
                >
                  <TeamAvatar name={teamName || 'Team'} className="w-full h-full object-cover" />
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-cyan-400/70 font-mono mb-4"
              >
                ✨ Logo généré par I.A. à partir du nom
              </motion.p>

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

              {/* Info reconnexion automatique */}
              <p className="text-center text-xs text-cyan-500/60 font-mono mt-3">
                💡 Même nom = reconnexion automatique avec ta progression
              </p>

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
  const { identify, connected, gameState, submitScore, currentTeam, socket } = useGame();
  const { state: playerState, actions: playerActions } = usePlayer();

  const [currentView, setCurrentView] = useState('connecting'); // connecting, login, hub, activity, ejected
  const [team, setTeam] = useState(null);
  const [ejectedMessage, setEjectedMessage] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);

  // Synchronisation Score Client <-> Serveur (Legacy, pour compatibilité)
  useEffect(() => {
    if (currentTeam && gameState.teams[currentTeam]) {
      const serverScore = gameState.teams[currentTeam].score;
      if (typeof serverScore === 'number' && serverScore !== playerState.points) {
        playerActions.syncScore(serverScore);
      }
    }
  }, [currentTeam, gameState.teams, playerState.points, playerActions]);

  // ☁️ SYNC CLOUD (Serveur -> Client)
  useEffect(() => {
    if (!socket) return;

    const onLoadState = (cloudState) => {
      console.log("☁️ Réception sauvegarde Cloud");
      // On convertit en string car importSave attend du JSON stringified (pour QR à la base)
      if (cloudState) {
        playerActions.importSave(JSON.stringify(cloudState));
      }
    };

    socket.on('player:loadState', onLoadState);
    return () => socket.off('player:loadState', onLoadState);
  }, [socket, playerActions]);

  // ☁️ AUTO-SAVE (Client -> Serveur)
  useEffect(() => {
    if (socket && connected && currentTeam && playerState.isInitialized) {
      // Debounce pour ne pas spammer le serveur
      const timer = setTimeout(() => {
        // On n'envoie que si ça a changé ? Difficile à dire.
        // On envoie tout le temps au bout de 2s d'inactivité
        // console.log("☁️ Auto-save vers Cloud...");
        socket.emit('player:sync', { teamId: currentTeam, state: playerState });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [playerState, currentTeam, connected, socket]);

  // Identify as player when connected
  useEffect(() => {
    if (connected && team) {
      identify('TEAM', team.teamId);
    }
  }, [connected, team, identify]);

  // CONNECTING → LOGIN ou auto-login quand le socket est prêt
  useEffect(() => {
    if (!connected) return;
    if (currentView !== 'connecting') return;

    const savedTeamId = localStorage.getItem('teamId');
    const savedToken = localStorage.getItem('teamToken');
    const savedName = localStorage.getItem('teamName');

    if (savedTeamId && savedToken && savedName) {
      // Crédentiels valides → auto-login
      const teamData = {
        teamId: savedTeamId,
        token: savedToken,
        name: savedName,
        avatarStyle: localStorage.getItem('teamAvatarStyle') || 'bottts'
      };
      setTeam(teamData);
      playerActions.initializeTeam(teamData.teamId, teamData.name, teamData.avatarStyle);
      setCurrentView('hub');
    } else {
      setCurrentView('login');
    }
  }, [connected, currentView, playerActions]);

  // Éjection serveur (nouvelle soirée) — via événement explicite
  useEffect(() => {
    if (!socket) return;
    const onEjected = ({ message }) => {
      localStorage.removeItem('teamId');
      localStorage.removeItem('teamToken');
      // teamName reste pour le rejoin rapide
      playerActions.resetState();
      setTeam(null);
      setCurrentView('ejected');
      // Stocker le message d'éjection pour l'afficher
      setEjectedMessage(message || 'Nouvelle session démarrée — reconnectez-vous !');
    };
    socket.on('team:ejected', onEjected);
    return () => socket.off('team:ejected', onEjected);
  }, [socket, playerActions]);

  // Handlers
  const handleJoinSuccess = (teamData) => {
    setTeam(teamData);
    playerActions.initializeTeam(teamData.teamId, teamData.name, teamData.avatarStyle || 'bottts');
    setCurrentView('hub');
  };

  const handleLogout = () => {
    // Notify server of voluntary logout
    if (socket && connected) {
      socket.emit('team:logout');
    }

    localStorage.removeItem('teamId');
    localStorage.removeItem('teamToken');
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamAvatarStyle');

    // 🧹 Clean PlayerContext state immediately
    playerActions.resetState();

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
  // Use map or fallback to ComingSoon
  const ResolvedActivity = activeActivity ? ACTIVITY_MAP[activeActivity] || ComingSoon : null;
  const ActivityComponent = ResolvedActivity;

  return (
    <>
      <AnimatePresence mode="wait">
        {/* CONNECTING — écran de chargement initial */}
        {currentView === 'connecting' && (
          <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSpinner message="Connexion au Nexus..." />
          </motion.div>
        )}

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

        {/* EJECTED — nouvelle session */}
        {currentView === 'ejected' && (
          <motion.div key="ejected" variants={pageVariants} initial="initial" animate="animate" exit="exit"
            className="min-h-screen bg-[#0a0a15] flex flex-col items-center justify-center gap-6 p-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl"
            >🌌</motion.div>
            <h2 className="text-2xl font-bold text-white text-center" style={{ fontFamily: 'Orbitron' }}>
              Nouvelle soirée !
            </h2>
            <p className="text-gray-400 text-center font-mono text-sm max-w-xs">{ejectedMessage}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('login')}
              className="px-8 py-4 rounded-xl font-bold text-white text-lg"
              style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)' }}
            >
              {localStorage.getItem('teamName') ? `Rejoindre en tant que « ${localStorage.getItem('teamName')} »` : 'Rejoindre la session'}
            </motion.button>
            <button onClick={() => { localStorage.removeItem('teamName'); setCurrentView('login'); }}
              className="text-xs text-gray-600 hover:text-gray-400 font-mono">
              Changer de nom
            </button>
          </motion.div>
        )}

        {/* LOBBY / WAITING SCREEN */}
        {currentView === 'hub' && team && gameState.status === 'LOBBY' && (
          <motion.div key="waiting" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <GameLobby team={team} onLogout={handleLogout} />
          </motion.div>
        )}

        {currentView === 'hub' && team && gameState.status !== 'LOBBY' && (
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
                  {playerState.isSessionNight ?
                    (playerState.sessionStatus === 'INTRO' ? '📺 Introduction' : '🌙 Session Night') :
                    gameState.status === 'PLAYING' ? '🎮 En jeu' :
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
