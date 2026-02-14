import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function WarRoomMario({ gameState, lastScoringTeam, NEXUS_URL }) {
    const { teams, history, globalTimer } = gameState;
    const sortedTeams = useMemo(() => Object.values(teams).sort((a, b) => b.score - a.score), [teams]);
    const topTeam = sortedTeams[0];

    const formatTime = (s) => `${Math.floor(s / 60)}`;
    const formatTimeSec = (s) => `${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="relative z-10 w-full h-screen bg-[#6b8cff] font-['Press_Start_2P',_monospace] overflow-hidden p-8 flex flex-col select-none text-white">

            {/* CLOUDS BACKGROUND */}
            <div className="absolute top-10 left-20 text-white/50 text-6xl animate-pulse">☁️</div>
            <div className="absolute top-40 right-40 text-white/50 text-8xl animate-bounce">☁️</div>

            {/* HEADER - HUD STYLE */}
            <header className="flex justify-between items-start mb-8 text-2xl uppercase tracking-widest drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <div className="flex flex-col">
                    <span className="text-red-500">MARIO</span>
                    <span>{topTeam ? topTeam.score.toString().padStart(6, '0') : '000000'}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[#FBD000]">x {Object.keys(teams).length}</span>
                    <span className="text-xs mt-2 text-white">JOUEURS</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-white">MONDE</span>
                    <span className="text-xs mt-2">1-1</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[#FBD000]">TEMPS</span>
                    <span className="text-white">{formatTime(globalTimer)}</span>
                </div>
            </header>

            {/* MAIN CONTENT - BLOCKS */}
            <div className="flex-1 grid grid-cols-3 gap-8 min-h-0 relative z-10">

                {/* COL 1: LEADERBOARD - Bricks */}
                <div className="col-span-1 bg-[#b5651d] border-4 border-black p-4 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col relative">
                    {/* Brick Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(335deg, rgba(0,0,0,0.3) 23px, transparent 23px), linear-gradient(155deg, rgba(0,0,0,0.3) 23px, transparent 23px), linear-gradient(335deg, rgba(0,0,0,0.3) 23px, transparent 23px), linear-gradient(155deg, rgba(0,0,0,0.3) 23px, transparent 23px)',
                            backgroundSize: '58px 58px',
                            backgroundColor: '#b5651d'
                        }}
                    />

                    <h2 className="text-center mb-4 text-[#FBD000] drop-shadow-[2px_2px_0_#000]">CLASSEMENT</h2>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
                        {sortedTeams.map((team, idx) => (
                            <motion.div
                                key={team.id}
                                className={`flex justify-between items-center p-2 border-2 border-black bg-[#e52521] shadow-[4px_4px_0_#000] ${lastScoringTeam === team.id ? 'animate-bounce' : ''}`}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                            >
                                <span className="text-xs truncate max-w-[60%]">{idx + 1}. {team.name}</span>
                                <span className="text-[#FBD000] text-xs flex items-center gap-1">
                                    🪙 {team.score}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* COL 2: CENTER STAGE */}
                <div className="col-span-1 flex flex-col items-center justify-end pb-12 relative">
                    {/* Winner Block */}
                    {topTeam ? (
                        <div className="mb-20 animate-bounce">
                            <div className="w-48 h-48 bg-[#FBD000] border-4 border-black box-border flex items-center justify-center text-6xl shadow-[8px_8px_0_rgba(0,0,0,0.5)] relative">
                                <span className="text-black">?</span>
                                {/* User Avatars bouncing out would go here */}
                                <div className="absolute -top-16 text-xl text-white bg-black p-2 border-2 border-white whitespace-nowrap">
                                    {topTeam.name}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-2xl animate-pulse">PRÊT ?</div>
                    )}

                    {/* Ground */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-[repeating-linear-gradient(45deg,#b5651d,#b5651d_10px,#8b4513_10px,#8b4513_20px)] border-t-4 border-black">
                        <div className="absolute -top-8 w-full h-8 bg-[linear-gradient(to_bottom,#22c55e,#008000)] border-t-4 border-black" />
                    </div>
                </div>

                {/* COL 3: LOGS & QR - Pipe Style */}
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-[#22c55e] border-4 border-black flex-1 p-4 shadow-[8px_8px_0_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                        <h2 className="text-center mb-4 text-black drop-shadow-none">JOURNAL</h2>

                        <div className="flex-1 overflow-y-auto space-y-2 text-[10px] text-black font-bold custom-scrollbar">
                            {history.slice(0, 10).map((log, i) => (
                                <div key={i} className="bg-[#008000] text-white p-2 border-2 border-black">
                                    {log.message}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black p-4 border-4 border-white flex justify-center items-center">
                        <div className="bg-white p-2">
                            <QRCodeSVG value={NEXUS_URL} size={80} />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #FBD000; border: 2px solid black; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
            `}</style>
        </div>
    );
}
