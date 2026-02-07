import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerProvider, useGame } from './context/PlayerContext';
import LandingPage from './components/LandingPage';
import Hub from './components/Hub';
import './index.css';

// Lazy load activities
const Rencontre3eType = lazy(() => import('./activities/Rencontre3eType'));

// Map des composants d'activité
const ACTIVITY_MAP = {
  'rencontre_3e_type': Rencontre3eType,
};

// Loading component
function ActivityLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

// Composant principal avec gestion de navigation
function AppContent() {
  const { state, actions } = useGame();
  const [currentView, setCurrentView] = useState(state.isInitialized ? 'hub' : 'landing');
  const [activeActivity, setActiveActivity] = useState(null);
  const [activeUniverse, setActiveUniverse] = useState(null);

  const handleEnterHub = () => {
    setCurrentView('hub');
  };

  const handleStartActivity = (universeId, activityId) => {
    setActiveUniverse(universeId);
    setActiveActivity(activityId);
    setCurrentView('activity');
    actions.startActivity(universeId, activityId);
  };

  const handleExitActivity = () => {
    setActiveActivity(null);
    setActiveUniverse(null);
    setCurrentView('hub');
    actions.setCurrentActivity(null);
  };

  const handleCompleteActivity = (points) => {
    console.log(`Activité complétée avec ${points} points`);
    // Small delay before returning to hub
    setTimeout(() => {
      handleExitActivity();
    }, 1500);
  };

  // Variantes d'animation pour les transitions de page
  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: {
      opacity: 0,
      scale: 1.05,
      filter: 'blur(10px)',
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.5,
  };

  // Get activity component
  const ActivityComponent = activeActivity ? ACTIVITY_MAP[activeActivity] : null;

  return (
    <AnimatePresence mode="wait">
      {currentView === 'landing' && !state.isInitialized ? (
        <motion.div
          key="landing"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <LandingPage onEnter={handleEnterHub} />
        </motion.div>
      ) : currentView === 'activity' && ActivityComponent ? (
        <motion.div
          key={`activity-${activeActivity}`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Suspense fallback={<ActivityLoader />}>
            <ActivityComponent
              universeId={activeUniverse}
              onComplete={handleCompleteActivity}
              onExit={handleExitActivity}
            />
          </Suspense>
        </motion.div>
      ) : (
        <motion.div
          key="hub"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <HubWithActivityHandler onStartActivity={handleStartActivity} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hub wrapper to pass activity handler
function HubWithActivityHandler({ onStartActivity }) {
  return <Hub onStartActivity={onStartActivity} />;
}

// Composant App avec Provider
export default function PlayerApp() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}
