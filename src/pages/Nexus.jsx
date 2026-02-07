import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

// Universe data
const UNIVERSES = [
    { id: 'starwars', name: 'Star Wars', icon: '⭐', color: 'from-yellow-500 to-amber-600', description: 'Une galaxie très lointaine...' },
    { id: 'jurassic', name: 'Jurassic Park', icon: '🦖', color: 'from-green-500 to-emerald-600', description: 'La vie trouve son chemin' },
    { id: 'mario', name: 'Super Mario', icon: '🍄', color: 'from-red-500 to-orange-500', description: "C'est-a moi, Mario!" },
    { id: 'harry', name: 'Harry Potter', icon: '⚡', color: 'from-amber-500 to-yellow-600', description: 'Poudlard vous attend' },
    { id: 'matrix', name: 'The Matrix', icon: '💊', color: 'from-green-400 to-lime-500', description: 'Pilule rouge ou bleue?' },
];

export default function Nexus() {
    const { gameState, identify, createTeam } = useGame();

    const [teamName, setTeamName] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [showTeamCreation, setShowTeamCreation] = useState(true);
    const [currentTeam, setCurrentTeam] = useState(null);

    useEffect(() => {
        identify('NEXUS');
    }, [identify]);

    // Check if team already exists in localStorage
    useEffect(() => {
        const savedTeam = localStorage.getItem('multiversquest_team');
        if (savedTeam) {
            const team = JSON.parse(savedTeam);
            setCurrentTeam(team);
            setShowTeamCreation(false);
        }
    }, []);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) return;

        setIsJoining(true);

        const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const team = {
            id: teamId,
            name: teamName.trim(),
            createdAt: new Date().toISOString(),
            score: 0
        };

        localStorage.setItem('multiversquest_team', JSON.stringify(team));

        if (createTeam) {
            createTeam(team.id, team.name);
        }

        setTimeout(() => {
            setCurrentTeam(team);
            setShowTeamCreation(false);
            setIsJoining(false);
        }, 1000);
    };

    const handleResetTeam = () => {
        localStorage.removeItem('multiversquest_team');
        setCurrentTeam(null);
        setShowTeamCreation(true);
        setTeamName('');
    };

    // Get team score from server state
    const teamData = currentTeam && gameState.teams[currentTeam.id];
    const score = teamData?.score || currentTeam?.score || 0;

    // ═══════════════════════════════════════════════════════════════════════════
    // HUB VIEW - After team creation, show universes
    // ═══════════════════════════════════════════════════════════════════════════
    if (!showTeamCreation && currentTeam) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.15) 0%, transparent 40%),
                                radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.15) 0%, transparent 40%)
                            `
                        }} />
                    <motion.div
                        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                        className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
                            `,
                            backgroundSize: '60px 60px'
                        }}
                    />
                </div>

                {/* Header */}
                <header className="relative z-20 px-4 py-4 border-b border-cyan-900/30 bg-[#0a0a0f]/80 backdrop-blur-sm">
                    <div className="max-w-lg mx-auto flex items-center justify-between">
                        {/* Team Info */}
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm"
                                animate={{
                                    boxShadow: [
                                        '0 0 10px rgba(0, 255, 255, 0.5)',
                                        '0 0 20px rgba(255, 0, 255, 0.5)',
                                        '0 0 10px rgba(0, 255, 255, 0.5)'
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                {currentTeam.name.charAt(0).toUpperCase()}
                            </motion.div>
                            <div>
                                <p className="font-bold text-white text-sm truncate max-w-[120px]" style={{ fontFamily: 'Orbitron' }}>
                                    {currentTeam.name}
                                </p>
                                <p className="text-cyan-400 text-xs font-mono">
                                    {score} PTS
                                </p>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleResetTeam}
                            className="px-3 py-1 text-xs rounded bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50"
                        >
                            Quitter
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 px-4 py-6 max-w-lg mx-auto">
                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron' }}>
                            LE NEXUS
                        </h1>
                        <p className="text-gray-400 text-sm font-mono">
                            {'>'} Explorez les univers thématiques
                        </p>
                    </motion.div>

                    {/* Universes Grid */}
                    <div className="grid gap-4">
                        {UNIVERSES.map((universe, index) => (
                            <motion.div
                                key={universe.id}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-4 rounded-xl bg-gradient-to-r ${universe.color} cursor-pointer relative overflow-hidden`}
                                    style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl">{universe.icon}</span>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{universe.name}</h3>
                                            <p className="text-white/70 text-sm">{universe.description}</p>
                                        </div>
                                    </div>

                                    {/* Status indicator */}
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-black/30 text-white/60">
                                        🔒 Scan QR
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 p-4 rounded-lg bg-[#12121a]/80 border border-cyan-900/30 text-center"
                    >
                        <p className="text-gray-400 text-sm font-mono">
                            <span className="text-yellow-400">⚠️</span> Scannez les QR codes dans la salle pour débloquer les univers
                        </p>
                    </motion.div>
                </main>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEAM CREATION VIEW
    // ═══════════════════════════════════════════════════════════════════════════
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

                {/* Logo / Title */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 text-transparent bg-clip-text mb-2"
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
                            <div className="text-5xl mb-4">🚀</div>
                            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron' }}>
                                Créer votre équipe
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Choisissez un nom mémorable pour votre équipe
                            </p>
                        </div>

                        <div className="space-y-4">
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
                                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-cyan-900/50 text-white placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCreateTeam}
                                disabled={!teamName.trim() || isJoining}
                                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${teamName.trim() && !isJoining
                                        ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:from-cyan-400 hover:to-fuchsia-400'
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                                style={{ fontFamily: 'Orbitron' }}
                            >
                                {isJoining ? (
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
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-gray-600 text-xs font-mono"
                >
                    MultiversQuest © 2026 - Portail Dimensionnel v1.0
                </motion.p>
            </div>
        </div>
    );
}
