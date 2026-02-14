import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function WarRoomFantasy({ gameState, lastScoringTeam, NEXUS_URL }) {
    const { teams, history, globalTimer } = gameState;
    const sortedTeams = useMemo(() => Object.values(teams).sort((a, b) => b.score - a.score), [teams]);
    const topTeam = sortedTeams[0];

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="relative z-10 w-full h-screen bg-[#2d1b0e] font-serif text-[#d4af37] overflow-hidden p-0 flex flex-col select-none">

            {/* Background Texture - Parchment & Universe Img */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: 'url("/images/universes/royaumes_legendaires.png")' }}
            />
            <div className="absolute inset-0 z-0 bg-[#d4af37]/10 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle,transparent_40%,#1a0f05_100%)] pointer-events-none" />

            {/* Header - Ornate Scroll */}
            <header className="relative z-10 py-6 text-center">
                <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                <h1 className="text-5xl font-bold tracking-widest text-[#f4ebd0] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-['Cinzel_Decorative',_serif]">
                    CHRONIQUES DU ROYAUME
                </h1>
                <div className="text-sm italic opacity-70 mt-2 text-[#d4af37]">Année du Dragon • Âge des Héros</div>
                <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            </header>

            {/* Main Content - Triptych Layout */}
            <div className="flex-1 grid grid-cols-12 gap-8 p-8 relative z-10">

                {/* COL 1: QUEST LOG (Leaderboard) */}
                <div className="col-span-3 bg-[#1a0f05]/90 border border-[#8b5a2b] p-6 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative rounded-lg">
                    {/* Corner Decorations */}
                    <div className="absolute top-0 left-0 text-3xl text-[#d4af37] leading-none">╔</div>
                    <div className="absolute top-0 right-0 text-3xl text-[#d4af37] leading-none">╗</div>
                    <div className="absolute bottom-0 left-0 text-3xl text-[#d4af37] leading-none">╚</div>
                    <div className="absolute bottom-0 right-0 text-3xl text-[#d4af37] leading-none">╝</div>

                    <h2 className="text-center text-xl mb-6 border-b border-[#8b5a2b] pb-2 text-[#f4ebd0]">NOBLES MAISONS</h2>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 h-[calc(100%-4rem)]">
                        <AnimatePresence>
                            {sortedTeams.map((team, idx) => (
                                <motion.div
                                    key={team.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`
                                        flex items-center gap-3 p-3 border-b border-[#8b5a2b]/30
                                        ${idx === 0 ? 'bg-[#d4af37]/10' : ''}
                                        ${lastScoringTeam === team.id ? 'text-[#f4ebd0] drop-shadow-[0_0_5px_gold]' : ''}
                                    `}
                                >
                                    <span className="font-bold text-lg w-8">{idx + 1}.</span>
                                    <div className="flex-1">
                                        <div className="font-bold">{team.name}</div>
                                        <div className="text-xs opacity-70 italic">{team.score} pièces d'or</div>
                                    </div>
                                    {idx < 3 && <span className="text-lg">{['👑', '⚔️', '🛡️'][idx]}</span>}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* COL 2: CENTER (Champion & Time) */}
                <div className="col-span-6 flex flex-col items-center justify-start pt-10">
                    {/* Champion Banner */}
                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-[#d4af37] blur-[50px] opacity-20 pointer-events-none" />

                        {topTeam ? (
                            <motion.div
                                layoutId="champion"
                                className="relative text-center"
                            >
                                <div className="text-6xl mb-4 animate-float">🛡️</div>
                                <div className="text-5xl font-bold text-[#f4ebd0] drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] mb-2">
                                    {topTeam.name}
                                </div>
                                <div className="text-xl text-[#d4af37] tracking-[0.3em] border-t border-b border-[#d4af37]/50 py-2 inline-block">
                                    CHAMPION DU ROYAUME
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-2xl text-[#8b5a2b] animate-pulse">En quête d'un Héros...</div>
                        )}
                    </div>

                    {/* Hourglass / Timer */}
                    <div className="mt-auto mb-12 text-center">
                        <div className="text-[#8b5a2b] text-sm uppercase tracking-widest mb-2">Sables du Temps</div>
                        <div className="text-5xl font-bold text-[#f4ebd0] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {formatTime(globalTimer)}
                        </div>
                    </div>
                </div>

                {/* COL 3: SCROLLS & QR */}
                <div className="col-span-3 flex flex-col gap-6">
                    {/* Scroll Log */}
                    <div className="flex-1 bg-[#f4ebd0] text-[#2d1b0e] p-6 relative shadow-[0_4px_10px_rgba(0,0,0,0.5)] rounded-sm rotate-1">
                        {/* Scroll Ends Effect */}
                        <div className="absolute -top-3 -left-2 -right-2 h-6 bg-[#d4af37] rounded-full shadow-md" />
                        <div className="absolute -bottom-3 -left-2 -right-2 h-6 bg-[#d4af37] rounded-full shadow-md" />

                        <h2 className="text-center font-bold border-b-2 border-[#2d1b0e] pb-1 mb-2">Journal du Scribe</h2>
                        <div className="h-[calc(100%-3rem)] overflow-y-auto custom-scrollbar-light text-sm italic leading-relaxed space-y-2">
                            {history.slice(0, 10).map((log, i) => (
                                <div key={i} className="first-letter:text-2xl first-letter:font-bold first-letter:float-left first-letter:mr-1">
                                    {log.message}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Join Seal */}
                    <div className="bg-[#1a0f05] border border-[#d4af37] p-4 flex flex-col items-center justify-center rounded-lg shadow-lg">
                        <div className="bg-white p-2 rounded mb-2">
                            <QRCodeSVG value={NEXUS_URL} size={70} />
                        </div>
                        <div className="text-[#d4af37] text-xs uppercase tracking-widest text-center">Rejoindre la Quête</div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #8b5a2b; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1a0f05; }
                .custom-scrollbar-light::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #8b5a2b; }
            `}</style>
        </div>
    );
}
