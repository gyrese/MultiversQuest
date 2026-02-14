import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function WarRoomPostApo({ gameState, lastScoringTeam, NEXUS_URL }) {
    const { teams, history, globalTimer } = gameState;
    const sortedTeams = useMemo(() => Object.values(teams).sort((a, b) => b.score - a.score), [teams]);
    const topTeam = sortedTeams[0];

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="relative z-10 w-full h-screen bg-[#1a1814] text-[#ffbf00] font-mono overflow-hidden p-8 flex flex-col uppercase select-none">

            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 pointer-events-none grayscale sepia mix-blend-overlay"
                style={{ backgroundImage: 'url("/images/universes/postapo.png")' }}
            />

            {/* CRT Overlay */}
            <div className="pointer-events-none absolute inset-0 z-50">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(255,191,0,0.05)_1px,rgba(255,191,0,0.05)_2px)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(20,10,0,0.8)_100%)]" />
            </div>

            {/* HEADER - PipBoy Style */}
            <header className="relative z-10 border-b-2 border-[#ffb300] pb-2 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-widest text-shadow-amber font-['VT323',_monospace]">
                        SYSTÈME VAULT-TEC v1.0
                    </h1>
                    <div className="text-sm opacity-80 typing-effect">TERMINAL DU SUPERVISEUR // ACCÈS AUTORISÉ</div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold animate-pulse">STATUT RÉGION : CRITIQUE</div>
                    <div className="text-sm">{new Date().toLocaleTimeString()}</div>
                </div>
            </header>

            {/* MAIN GRID */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 relative z-10">

                {/* COL 1: SURVIVOR LIST (Leaderboard) */}
                <div className="col-span-3 border-r-2 border-[#ffb300]/50 pr-4 flex flex-col">
                    <h2 className="text-2xl border-b border-[#ffb300] mb-4 text-shadow-amber">// SURVIVANTS</h2>
                    <div className="mb-4 text-sm opacity-70">
                        COMPTE : {Object.keys(teams).length} <br />
                        STATUT : VIVANT
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        <AnimatePresence>
                            {sortedTeams.map((team, idx) => (
                                <motion.div
                                    key={team.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className={`
                                        p-2 border border-[#ffb300]/30 hover:bg-[#ffb300]/10 cursor-crosshair relative
                                        ${idx === 0 ? 'bg-[#ffb300]/20 font-bold' : ''}
                                    `}
                                >
                                    <div className="flex justify-between">
                                        <span>#{idx + 1} {team.name}</span>
                                        <span>{team.score} CAPSULES</span>
                                    </div>
                                    {/* Scanline on specific item */}
                                    {idx === 0 && <div className="absolute inset-0 bg-[#ffb300]/5 animate-pulse pointer-events-none" />}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* COL 2: MONITOR (Top Team & Timer) */}
                <div className="col-span-6 flex flex-col items-center justify-center relative">
                    {/* CRT Screen Effect Container */}
                    <div className="w-full h-full border-4 border-[#ffb300]/30 rounded-lg p-6 flex flex-col items-center justify-between bg-[#1a1200] relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                        {/* Static Noise Overlay */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,...")' }} />

                        {/* Top Team Display */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            {topTeam ? (
                                <motion.div
                                    className="text-center"
                                    animate={{ skewX: [0, -2, 2, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, repeatDelay: 2 }}
                                >
                                    <div className="text-6xl mb-4">☢️</div>
                                    <h2 className="text-5xl font-bold mb-2 text-shadow-amber uppercase tracking-wider">{topTeam.name}</h2>
                                    <div className="text-xl bg-[#ffb300] text-black px-4 py-1 inline-block font-bold">
                                        LÉGENDE DES TERRES DÉSOLÉES
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-2xl animate-pulse text-center">
                                    SCAN DES FRÉQUENCES...<br />
                                    <span className="text-sm opacity-50">AUCUN SIGNAL</span>
                                </div>
                            )}
                        </div>

                        {/* Radiation / Timer */}
                        <div className="w-full border-t-2 border-[#ffb300]/30 pt-4 mt-8 flex justify-between items-end">
                            <div>
                                <div className="text-xs uppercase">Temps avant Fusion</div>
                                <div className="text-5xl font-bold font-mono tracking-widest">{formatTime(globalTimer)}</div>
                            </div>

                            {/* Geiger Counter Visual */}
                            <div className="text-right">
                                <div className="text-xs uppercase mb-1">Niveau de Radiation</div>
                                <div className="flex items-end gap-1 h-8">
                                    {[...Array(10)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 bg-[#ffb300]"
                                            animate={{ height: ['20%', `${Math.random() * 100}%`, '20%'] }}
                                            transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COL 3: LOGS & QR */}
                <div className="col-span-3 border-l-2 border-[#ffb300]/50 pl-4 flex flex-col">
                    <h2 className="text-xl border-b border-[#ffb300] mb-4 text-shadow-amber">// JOURNAL SYSTÈME</h2>

                    <div className="flex-1 overflow-hidden relative mb-4">
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar text-xs font-mono space-y-1">
                            {history.slice(0, 15).map((log, i) => (
                                <div key={i} className="opacity-80 hover:opacity-100 hover:bg-[#ffb300]/20">
                                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log.message}
                                </div>
                            ))}
                            <div className="animate-pulse">_</div>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="border border-[#ffb300] p-2 flex flex-col items-center bg-[#ffb300]/5">
                        <QRCodeSVG value={NEXUS_URL} size={80} bgColor="transparent" fgColor="#ffb300" />
                        <div className="text-[10px] mt-1 text-center uppercase">Scan pour Accès au Refuge</div>
                    </div>
                </div>
            </div>

            <style>{`
                .text-shadow-amber { text-shadow: 0 0 10px rgba(255, 191, 0, 0.6); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #ffbf00; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1a1814; }
            `}</style>
        </div>
    );
}
