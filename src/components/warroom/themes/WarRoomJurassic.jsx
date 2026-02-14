import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function WarRoomJurassic({ gameState, lastScoringTeam, NEXUS_URL }) {
    const { teams, history, globalTimer } = gameState;

    // Sorting teams by score
    const sortedTeams = useMemo(() =>
        Object.values(teams).sort((a, b) => b.score - a.score),
        [teams]
    );

    const topTeam = sortedTeams.length > 0 ? sortedTeams[0] : null;

    // Format Logic
    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="relative z-10 w-full h-screen bg-[#001100] text-[#00ff00] font-mono overflow-hidden p-0 flex flex-col select-none">

            {/* CRT OVERLAY EFFECTS */}
            <div className="pointer-events-none absolute inset-0 z-50">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,255,0,0)_60%,rgba(0,0,0,0.6)_100%)]" />
                {/* Scanline pulse */}
                <div className="absolute inset-0 opacity-10 animate-pulse bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,#00ff00_1px,#00ff00_2px)]" />
            </div>

            {/* HEADER - HAZARD STRIPES */}
            <header className="shrink-0 h-16 bg-[#1a1a1a] relative border-b-4 border-[#ffcc00] flex items-center justify-center overflow-hidden">
                {/* Hazard Stripes Pattern */}
                <div className="absolute inset-0 opacity-80"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(-45deg, #FFD700, #FFD700 20px, #000 20px, #000 40px)'
                    }}
                />

                {/* Title Box */}
                <div className="relative z-10 bg-black/90 px-8 py-2 border-2 border-[#FFD700] text-[#FFD700] flex items-center gap-4 shadow-lg">
                    <span className="text-xl">⚠️</span>
                    <h1 className="text-2xl font-bold tracking-[0.2em] font-mono">INGEN SECURITY SYSTEMS</h1>
                    <span className="text-xl">⚠️</span>
                </div>
            </header>

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 p-6 grid grid-cols-12 gap-6 relative z-10">

                {/* COL 1: PERSONNEL LOG (Leaderboard) */}
                <div className="col-span-3 border-2 border-[#005500] bg-black/80 flex flex-col p-4 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                    <h2 className="text-[#00aa00] border-b border-[#005500] pb-2 mb-4 text-sm tracking-widest flex items-center">
                        <span className="text-xs mr-2">{'>'}</span>
                        SITE_B://security/personnel.log
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {sortedTeams.map((team, idx) => (
                                <motion.div
                                    key={team.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0, backgroundColor: lastScoringTeam === team.id ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0,0,0,0)' }}
                                    className={`flex justify-between items-center p-2 text-sm border-l-2 ${idx < 3 ? 'border-[#00ff00]' : 'border-[#005500]'}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-[#00aa00]">[{String(idx + 1).padStart(2, '0')}]</span>
                                        <span className={`truncate ${idx === 0 ? 'text-[#00ff00] font-bold' : 'text-[#00cc00]'}`}>
                                            {team.name}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[#00aa00]">{team.score} pts</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {sortedTeams.length === 0 && <div className="text-[#004400] text-center mt-10">NO SIGNAL...</div>}
                    </div>
                </div>

                {/* COL 2: CENTER (Top Survivors / Main Highlight) */}
                <div className="col-span-6 flex flex-col gap-6">

                    {/* Top Panel - Survivors */}
                    <div className="flex-1 border-2 border-[#005500] bg-black/80 p-6 flex flex-col items-center justify-center relative">
                        <div className="absolute top-2 left-0 right-0 text-center">
                            <h2 className="text-[#FFD700] tracking-[0.5em] text-sm">=== TOP SURVIVORS ===</h2>
                        </div>

                        {/* ALPHA PREDATOR (Rank 1) */}
                        {topTeam ? (
                            <motion.div
                                key={topTeam.id}
                                layoutId="topTeam"
                                className="w-full max-w-md border-4 border-[#FFD700]/50 bg-[#FFD700]/5 p-8 text-center mb-8 relative"
                            >
                                <div className="text-[#FFD700] text-xs uppercase tracking-widest mb-2 flex justify-center items-center gap-2">
                                    <span>🦖</span> ALPHA PREDATOR
                                </div>
                                <div className="text-4xl md:text-5xl font-bold text-[#00ff00] text-shadow-green break-words">
                                    {topTeam.name}
                                </div>
                                <div className="mt-2 text-[#00aa00] text-xl font-mono">{topTeam.score.toLocaleString()} PTS</div>

                                {/* Corner Decorations */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FFD700]" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FFD700]" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FFD700]" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FFD700]" />
                            </motion.div>
                        ) : (
                            <div className="text-[#004400] text-2xl animate-pulse">SEARCHING...</div>
                        )}

                        {/* Rank 2 & 3 */}
                        <div className="flex gap-4 w-full max-w-2xl text-center">
                            {sortedTeams[1] && (
                                <div className="flex-1 border border-[#005500] p-4 text-[#00cc00]">
                                    <div className="text-xs text-[#007700] mb-1">RANK 02</div>
                                    <div className="font-bold text-lg truncate">{sortedTeams[1].name}</div>
                                    <div className="font-mono">{sortedTeams[1].score}</div>
                                </div>
                            )}
                            {sortedTeams[2] && (
                                <div className="flex-1 border border-[#005500] p-4 text-[#00cc00]">
                                    <div className="text-xs text-[#007700] mb-1">RANK 03</div>
                                    <div className="font-bold text-lg truncate">{sortedTeams[2].name}</div>
                                    <div className="font-mono">{sortedTeams[2].score}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COL 3: SYSTEM STATUS & LOGS */}
                <div className="col-span-3 flex flex-col gap-6">

                    {/* Status Panel */}
                    <div className="border-2 border-[#005500] bg-black/80 p-4 h-1/2 flex flex-col">
                        <h2 className="text-[#00aa00] border-b border-[#005500] pb-2 mb-4 text-sm tracking-widest">
                            {'>'} SYSTEM_STATUS
                        </h2>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-end border-b border-[#003300] pb-1">
                                <span className="text-[#007700] text-xs">PERIMETER_FENCE:</span>
                                <span className="text-red-500 font-bold animate-pulse text-sm">OFFLINE</span>
                            </div>

                            <div className="flex justify-between items-end border-b border-[#003300] pb-1">
                                <span className="text-[#007700] text-xs">TIMER_COUNTDOWN:</span>
                                <span className={`font-mono text-2xl font-bold ${globalTimer < 300 ? 'text-red-500 animate-pulse' : 'text-[#FFD700]'}`}>
                                    {formatTime(globalTimer)}
                                </span>
                            </div>

                            <div className="flex justify-between items-end border-b border-[#003300] pb-1">
                                <span className="text-[#007700] text-xs">ACTIVE_TEAMS:</span>
                                <span className="text-[#00ff00] font-bold">{Object.keys(teams).length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="border-2 border-[#005500] bg-black/80 p-4 flex-1 flex flex-col min-h-0">
                        <h2 className="text-[#00aa00] border-b border-[#005500] pb-2 mb-2 text-sm tracking-widest">
                            {'>'} ACTIVITY_LOG:
                        </h2>
                        <div className="flex-1 overflow-y-auto text-xs font-mono space-y-1 custom-scrollbar">
                            {history.slice(0, 8).map((log, i) => (
                                <div key={i} className={`truncate ${i === 0 ? 'text-[#00ff00]' : 'text-[#007700]'}`}>
                                    <span className="opacity-50">[{new Date(log.time).toLocaleTimeString()}]</span> {log.message}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Registration QR */}
                    <div className="border border-[#005500] bg-black/90 p-4 flex flex-col items-center">
                        <h3 className="text-[#FFD700] text-[10px] mb-2 font-bold tracking-widest">{'>'} PERSONNEL_REGISTRATION</h3>
                        <div className="bg-white p-1">
                            <QRCodeSVG value={NEXUS_URL} size={64} level="M" fgColor="#000000" bgColor="#FFFFFF" />
                        </div>
                        <div className="text-[10px] text-[#005500] mt-1">SCAN_TO_REGISTER</div>
                    </div>

                </div>
            </div>

            {/* Bottom Hazard Stripe */}
            <footer className="h-8 bg-[#1a1a1a] relative border-t-4 border-[#ffcc00]">
                <div className="absolute inset-0 opacity-80"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #FFD700, #FFD700 20px, #000 20px, #000 40px)'
                    }}
                />
            </footer>

            <style>{`
                .text-shadow-green {
                    text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #001100; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #005500; }
            `}</style>
        </div>
    );
}
