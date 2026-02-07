import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

// ═══════════════════════════════════════════════════════════════════════════
// THEME DATA - Each is a completely different visual identity
// ═══════════════════════════════════════════════════════════════════════════

const THEMES = ['starwars', 'jurassic', 'mario', 'harry', 'matrix'];

export default function Dashboard() {
    const { gameState, identify } = useGame();
    const { teams, history, status, globalTimer } = gameState;
    const [themeIndex, setThemeIndex] = useState(0);
    const currentTheme = THEMES[themeIndex];

    // Generate Nexus URL for QR code - Use network IP for mobile access
    const nexusUrl = 'http://192.168.1.13:5174/nexus';

    useEffect(() => { identify('DASHBOARD'); }, [identify]);

    useEffect(() => {
        const interval = setInterval(() => {
            setThemeIndex(prev => (prev + 1) % THEMES.length);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const sortedTeams = useMemo(() =>
        Object.values(teams).sort((a, b) => b.score - a.score), [teams]
    );

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ═══════════════════════════════════════════════════════════════════════════
    // STAR WARS THEME - Imperial Control Room
    // ═══════════════════════════════════════════════════════════════════════════
    if (currentTheme === 'starwars') {
        return (
            <div className="min-h-screen text-gray-300 font-['Orbitron'] overflow-hidden relative"
                style={{
                    background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('https://cdn.midjourney.com/a8783584-25b7-455d-9961-01a3516011d4/0_1.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>


                {/* Imperial Holographic HUD */}
                <div className="relative z-10 h-screen flex flex-col p-6">

                    {/* Top Bar - Imperial Style */}
                    <div className="flex justify-between items-center mb-6 border-b-2 border-yellow-500/30 pb-4">
                        <div className="flex items-center gap-4">
                            {/* Imperial Logo */}
                            <svg className="w-16 h-16 text-yellow-500" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                                <circle cx="50" cy="50" r="20" fill="currentColor" />
                                <path d="M50 5 L50 30 M50 70 L50 95 M5 50 L30 50 M70 50 L95 50" stroke="currentColor" strokeWidth="3" />
                            </svg>
                            <div>
                                <h1 className="text-4xl font-black text-yellow-500 tracking-[0.2em]">DEATH STAR</h1>
                                <div className="text-xs text-gray-500 tracking-[0.5em]">IMPERIAL COMMAND CENTER</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-600 tracking-widest">OPERATION TIMER</div>
                            <div className="text-6xl font-black text-yellow-500 tabular-nums tracking-tight"
                                style={{ textShadow: '0 0 30px rgba(255,232,31,0.5)' }}>
                                {formatTime(globalTimer)}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Holographic Panels */}
                    <div className="flex-1 grid grid-cols-12 gap-6">

                        {/* Left Panel - Targeting Computer Style Rankings */}
                        <div className="col-span-3 border border-yellow-500/30 bg-black/80 p-4 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
                            <h3 className="text-yellow-500 text-sm tracking-[0.3em] mb-4 border-b border-yellow-500/20 pb-2">
                                ◈ SQUADRON RANKS
                            </h3>
                            <div className="space-y-2">
                                {sortedTeams.map((team, i) => (
                                    <div key={team.id} className={`p-3 border-l-2 ${i < 3 ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-900/50'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">TIE-{String(i + 1).padStart(2, '0')}</span>
                                            <span className="font-bold">{team.score.toLocaleString()}</span>
                                        </div>
                                        <div className="font-bold text-lg truncate">{team.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center - Holographic Podium Display */}
                        <div className="col-span-6 border border-yellow-500/30 bg-black/60 relative overflow-hidden">
                            {/* Scan lines */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none" />

                            <div className="absolute top-4 left-4 text-xs text-yellow-500/60 tracking-[0.3em]">
                                ◈ HOLOGRAPHIC DISPLAY ACTIVE
                            </div>

                            {/* Podium - Equal distribution */}
                            <div className="h-full flex items-end justify-center pb-8 pt-16">
                                {/* 2nd */}
                                <div className="flex-1 flex flex-col items-center text-center">
                                    {sortedTeams[1] && <>
                                        <div className="text-2xl font-black text-gray-400 mb-2">{sortedTeams[1].name}</div>
                                        <div className="text-3xl font-black text-yellow-500">{sortedTeams[1].score}</div>
                                        <div className="w-28 h-36 mt-4 bg-gradient-to-t from-yellow-500/20 to-transparent border border-yellow-500/40 flex items-end justify-center pb-4">
                                            <span className="text-5xl font-black text-yellow-500/30">II</span>
                                        </div>
                                    </>}
                                </div>

                                {/* 1st - Larger, glowing */}
                                <div className="flex-1 flex flex-col items-center text-center">
                                    {sortedTeams[0] && <>
                                        <div className="text-xs tracking-[0.5em] text-yellow-500 mb-2">◈ SUPREME COMMANDER ◈</div>
                                        <div className="text-4xl font-black text-yellow-500 mb-2"
                                            style={{ textShadow: '0 0 20px rgba(255,232,31,0.8)' }}>
                                            {sortedTeams[0].name}
                                        </div>
                                        <div className="text-5xl font-black text-yellow-500">{sortedTeams[0].score}</div>
                                        <div className="w-36 h-48 mt-4 bg-gradient-to-t from-yellow-500/40 to-transparent border-2 border-yellow-500 flex items-end justify-center pb-4"
                                            style={{ boxShadow: '0 0 50px rgba(255,232,31,0.3), inset 0 0 30px rgba(255,232,31,0.1)' }}>
                                            <span className="text-7xl font-black text-yellow-500/50">I</span>
                                        </div>
                                    </>}
                                </div>

                                {/* 3rd */}
                                <div className="flex-1 flex flex-col items-center text-center">
                                    {sortedTeams[2] && <>
                                        <div className="text-2xl font-black text-gray-400 mb-2">{sortedTeams[2].name}</div>
                                        <div className="text-3xl font-black text-yellow-500">{sortedTeams[2].score}</div>
                                        <div className="w-28 h-28 mt-4 bg-gradient-to-t from-yellow-500/20 to-transparent border border-yellow-500/40 flex items-end justify-center pb-4">
                                            <span className="text-4xl font-black text-yellow-500/30">III</span>
                                        </div>
                                    </>}
                                </div>
                            </div>

                            <div className="absolute bottom-4 right-4 text-[10px] text-yellow-500/40 tracking-widest">
                                SECTOR 7G // AUTHORIZED PERSONNEL ONLY
                            </div>
                        </div>

                        {/* Right - Transmission Log + QR Code */}
                        <div className="col-span-3 border border-yellow-500/30 bg-black/80 p-4 flex flex-col">
                            <h3 className="text-yellow-500 text-sm tracking-[0.3em] mb-4 border-b border-yellow-500/20 pb-2">
                                ◈ TRANSMISSIONS
                            </h3>
                            <div className="space-y-2 text-xs font-mono flex-1 overflow-auto max-h-48">
                                {history.slice(0, 6).map((log, i) => (
                                    <div key={i} className="border-l-2 border-gray-700 pl-2 py-1 opacity-70">
                                        <span className="text-yellow-500/60">[{new Date(log.time).toLocaleTimeString()}]</span>
                                        <div className="text-gray-400">{log.message}</div>
                                    </div>
                                ))}
                            </div>

                            {/* QR Code */}
                            <div className="mt-4 pt-4 border-t border-yellow-500/20 text-center">
                                <div className="text-yellow-500/60 text-xs tracking-[0.2em] mb-2">REJOINDRE L'EMPIRE</div>
                                <div className="bg-white p-2 rounded inline-block">
                                    <QRCodeSVG value={nexusUrl} size={80} level="M" />
                                </div>
                                <div className="text-gray-500 text-[10px] mt-2 font-mono">Scanner pour s'enrôler</div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
                `}</style>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // JURASSIC PARK THEME - InGen Security Terminal
    // ═══════════════════════════════════════════════════════════════════════════
    if (currentTheme === 'jurassic') {
        return (
            <div className="min-h-screen text-green-400 font-mono overflow-hidden"
                style={{
                    background: `linear-gradient(rgba(10,26,10,0.85), rgba(10,26,10,0.9)), url('https://cdn.midjourney.com/abcb1ffa-b1d7-45ed-bd10-2a1d69ad116e/0_3.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                {/* CRT Scanlines */}
                <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_3px] pointer-events-none z-50" />
                {/* CRT Glow */}
                <div className="fixed inset-0 shadow-[inset_0_0_150px_rgba(0,255,0,0.1)] pointer-events-none z-40" />

                <div className="relative z-10 h-screen flex flex-col">

                    {/* Warning Header Bar */}
                    <div className="h-12 bg-[repeating-linear-gradient(-45deg,#1a1a1a,#1a1a1a_20px,#c4a000_20px,#c4a000_40px)] flex items-center justify-center">
                        <span className="bg-black px-6 py-1 text-yellow-500 font-bold tracking-[0.3em] text-lg">
                            ⚠ INGEN SECURITY SYSTEMS ⚠
                        </span>
                    </div>

                    <div className="flex-1 p-6 grid grid-cols-12 gap-4">

                        {/* Left Terminal */}
                        <div className="col-span-4 bg-black/80 border-4 border-green-900 p-4">
                            <div className="text-green-500 text-sm mb-4 border-b border-green-900 pb-2">
                                {'>'} SITE_B://security/personnel.log
                            </div>
                            <div className="space-y-2">
                                {sortedTeams.map((team, i) => (
                                    <div key={team.id} className="flex items-center gap-2 text-green-400">
                                        <span className="text-yellow-500">[{String(i + 1).padStart(2, '0')}]</span>
                                        <span className="flex-1 truncate">{team.name}</span>
                                        <span className="text-green-300 font-bold">{team.score}</span>
                                        <span className="text-green-700">pts</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-green-700 animate-pulse">█</div>
                        </div>

                        {/* Center - Main Display */}
                        <div className="col-span-4 bg-black/80 border-4 border-green-900 p-4 flex flex-col">
                            <div className="text-yellow-500 text-center text-2xl mb-2 tracking-widest">
                                ═══ TOP SURVIVORS ═══
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                {sortedTeams[0] && (
                                    <div className="text-center border-2 border-yellow-600 bg-yellow-900/20 p-6 w-full">
                                        <div className="text-yellow-500 text-sm">🦖 ALPHA PREDATOR</div>
                                        <div className="text-4xl font-bold text-green-400 my-2">{sortedTeams[0].name}</div>
                                        <div className="text-5xl font-bold text-yellow-500">{sortedTeams[0].score}</div>
                                    </div>
                                )}
                                <div className="flex gap-4 w-full">
                                    {sortedTeams[1] && (
                                        <div className="flex-1 text-center border border-green-800 bg-green-900/10 p-4">
                                            <div className="text-green-600 text-xs">RANK 02</div>
                                            <div className="text-xl text-green-400 truncate">{sortedTeams[1].name}</div>
                                            <div className="text-2xl text-green-500 font-bold">{sortedTeams[1].score}</div>
                                        </div>
                                    )}
                                    {sortedTeams[2] && (
                                        <div className="flex-1 text-center border border-green-800 bg-green-900/10 p-4">
                                            <div className="text-green-600 text-xs">RANK 03</div>
                                            <div className="text-xl text-green-400 truncate">{sortedTeams[2].name}</div>
                                            <div className="text-2xl text-green-500 font-bold">{sortedTeams[2].score}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right - System Status */}
                        <div className="col-span-4 bg-black/80 border-4 border-green-900 p-4 flex flex-col">
                            <div className="text-green-500 text-sm mb-4 border-b border-green-900 pb-2">
                                {'>'} SYSTEM_STATUS
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700">PERIMETER_FENCE:</span>
                                    <span className="text-red-500 animate-pulse">OFFLINE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">TIMER_COUNTDOWN:</span>
                                    <span className="text-yellow-500 text-2xl font-bold">{formatTime(globalTimer)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">ACTIVE_TEAMS:</span>
                                    <span className="text-green-400">{Object.keys(teams).length}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-green-900">
                                <div className="text-green-600 text-xs mb-2">{'>'} ACTIVITY_LOG:</div>
                                <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                                    {history.slice(0, 4).map((log, i) => (
                                        <div key={i} className="text-green-600">
                                            [{new Date(log.time).toLocaleTimeString()}] {log.message}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="mt-4 pt-4 border-t border-green-900 text-center">
                                <div className="text-yellow-500 text-xs mb-2">{'>'} PERSONNEL_REGISTRATION</div>
                                <div className="bg-green-900/30 border border-green-700 p-2 inline-block">
                                    <QRCodeSVG value={nexusUrl} size={70} level="M" fgColor="#22c55e" bgColor="#0a1a0a" />
                                </div>
                                <div className="text-green-600 text-[10px] mt-2">SCAN_TO_REGISTER</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Warning */}
                    <div className="h-8 bg-[repeating-linear-gradient(-45deg,#1a1a1a,#1a1a1a_20px,#c4a000_20px,#c4a000_40px)]" />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MARIO THEME - 8-Bit Retro Arcade
    // ═══════════════════════════════════════════════════════════════════════════
    if (currentTheme === 'mario') {
        return (
            <div className="min-h-screen overflow-hidden" style={{
                background: 'linear-gradient(180deg, #5c94fc 0%, #5c94fc 70%, #8bac0f 70%)',
                fontFamily: '"Press Start 2P", monospace',
                imageRendering: 'pixelated'
            }}>
                {/* Clouds */}
                <div className="fixed top-10 left-10 text-white text-6xl opacity-80">☁</div>
                <div className="fixed top-20 right-20 text-white text-4xl opacity-60">☁</div>
                <div className="fixed top-5 right-40 text-white text-5xl opacity-70">☁</div>

                <div className="relative z-10 h-screen flex flex-col p-4">

                    {/* Header - Coin Counter Style */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="bg-black text-white p-4 border-4 border-white" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.3)' }}>
                            <div className="text-yellow-400 text-sm">★ WORLD 1-1 ★</div>
                            <div className="text-2xl">MULTIVERS</div>
                            <div className="text-red-500 text-2xl">QUEST</div>
                        </div>
                        <div className="bg-black text-white p-4 border-4 border-white text-center" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.3)' }}>
                            <div className="text-yellow-400 text-xs">TIME</div>
                            <div className="text-4xl">{formatTime(globalTimer)}</div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 grid grid-cols-3 gap-6">

                        {/* Left - High Scores */}
                        <div className="bg-black border-4 border-white p-4 text-white" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.3)' }}>
                            <div className="text-yellow-400 text-center mb-4 text-sm">- HIGH SCORES -</div>
                            <div className="space-y-3">
                                {sortedTeams.map((team, i) => (
                                    <div key={team.id} className="flex items-center gap-2 text-xs">
                                        <span className={`${i < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                            {i + 1}.
                                        </span>
                                        <span className="flex-1 truncate">{team.name}</span>
                                        <span className="text-yellow-400">{team.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center - Podium (Question Blocks) */}
                        <div className="flex flex-col items-center justify-end pb-8">
                            <div className="text-white text-center mb-4 text-xl bg-black px-4 py-2 border-4 border-white">
                                ★ TOP PLAYERS ★
                            </div>

                            <div className="flex items-end w-full">
                                {/* 2nd */}
                                <div className="flex-1 flex flex-col items-center text-center">
                                    {sortedTeams[1] && <>
                                        <div className="text-white text-xs mb-2 bg-black px-2 py-1">{sortedTeams[1].name}</div>
                                        <div className="text-yellow-400 text-lg mb-2">{sortedTeams[1].score}</div>
                                    </>}
                                    <div className="w-24 h-24 bg-gradient-to-b from-orange-400 to-orange-600 border-4 border-black flex items-center justify-center"
                                        style={{ boxShadow: 'inset -4px -4px 0 #8b5a00, inset 4px 4px 0 #ffcc00' }}>
                                        <span className="text-4xl text-orange-900 opacity-50">?</span>
                                    </div>
                                </div>

                                {/* 1st - Mario Star */}
                                <div className="flex-1 flex flex-col items-center text-center">
                                    {sortedTeams[0] && <>
                                        <div className="text-yellow-400 text-2xl animate-bounce">★</div>
                                        <div className="text-white text-sm mb-2 bg-red-600 px-3 py-1 border-2 border-white">
                                            {sortedTeams[0].name}
                                        </div>
                                        <div className="text-yellow-400 text-2xl mb-2">{sortedTeams[0].score}</div>
                                    </>}
                                    <div className="w-32 h-36 bg-gradient-to-b from-yellow-400 to-orange-500 border-4 border-black flex items-center justify-center"
                                        style={{ boxShadow: 'inset -4px -4px 0 #8b5a00, inset 4px 4px 0 #ffcc00' }}>
                                        <span className="text-5xl text-orange-900 opacity-50">?</span>
                                    </div>
                                </div>

                                {/* 3rd */}
                                <div className="flex-1 flex flex-col items-center text-center">
                                    {sortedTeams[2] && <>
                                        <div className="text-white text-xs mb-2 bg-black px-2 py-1">{sortedTeams[2].name}</div>
                                        <div className="text-yellow-400 text-lg mb-2">{sortedTeams[2].score}</div>
                                    </>}
                                    <div className="w-20 h-16 bg-gradient-to-b from-orange-400 to-orange-600 border-4 border-black flex items-center justify-center"
                                        style={{ boxShadow: 'inset -4px -4px 0 #8b5a00, inset 4px 4px 0 #ffcc00' }}>
                                        <span className="text-3xl text-orange-900 opacity-50">?</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right - Activity + QR */}
                        <div className="bg-black border-4 border-white p-4 text-white flex flex-col" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.3)' }}>
                            <div className="text-yellow-400 text-center mb-4 text-sm">- COIN LOG -</div>
                            <div className="space-y-2 text-[10px] flex-1 max-h-32 overflow-auto">
                                {history.slice(0, 4).map((log, i) => (
                                    <div key={i} className="border-b border-gray-800 pb-1">
                                        <div className="text-yellow-400">{new Date(log.time).toLocaleTimeString()}</div>
                                        <div className="text-gray-300">{log.message}</div>
                                    </div>
                                ))}
                            </div>

                            {/* QR Code */}
                            <div className="mt-4 pt-4 border-t-4 border-white text-center">
                                <div className="text-yellow-400 text-xs mb-2">★ JOIN GAME ★</div>
                                <div className="bg-white p-2 inline-block border-4 border-yellow-400">
                                    <QRCodeSVG value={nexusUrl} size={60} level="M" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ground */}
                    <div className="h-12 bg-[#8b5a2b] border-t-4 border-[#654321] mt-auto" />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HARRY POTTER THEME - Marauder's Map / Hogwarts
    // ═══════════════════════════════════════════════════════════════════════════
    if (currentTheme === 'harry') {
        return (
            <div className="min-h-screen overflow-hidden" style={{
                background: 'linear-gradient(135deg, #2d1810 0%, #1a0f0a 50%, #2d1810 100%)',
                fontFamily: '"Cinzel Decorative", serif'
            }}>
                {/* Parchment Texture Overlay */}
                <div className="fixed inset-0 opacity-10 pointer-events-none"
                    style={{ background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

                <div className="relative z-10 h-screen flex flex-col p-8">

                    {/* Header - Ornate */}
                    <div className="text-center mb-8">
                        <div className="text-amber-200/60 text-sm tracking-[0.5em]">✦ MINISTRY OF MAGIC ✦</div>
                        <h1 className="text-5xl text-amber-400 my-4" style={{ textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>
                            The Marauder's Quest
                        </h1>
                        <div className="text-amber-200/40 text-sm italic">"I solemnly swear that I am up to no good"</div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-8">

                        {/* Left - House Rankings */}
                        <div className="bg-amber-900/20 border border-amber-700/30 p-6 relative">
                            <div className="absolute top-2 right-2 text-amber-500/30">✦</div>
                            <h3 className="text-amber-400 text-xl mb-6 border-b border-amber-700/30 pb-2">
                                ✧ House Rankings ✧
                            </h3>
                            <div className="space-y-4">
                                {sortedTeams.map((team, i) => (
                                    <div key={team.id} className="flex items-center gap-3 text-amber-200/80">
                                        <span className={`text-2xl ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : ''}`}>
                                            {i < 3 ? '⚜' : '◇'}
                                        </span>
                                        <span className="flex-1 truncate font-sans">{team.name}</span>
                                        <span className="text-amber-400 font-bold">{team.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center - House Cup */}
                        <div className="bg-amber-900/20 border border-amber-700/30 p-6 flex flex-col items-center justify-center relative">
                            <div className="absolute inset-4 border border-amber-700/20 pointer-events-none" />

                            <div className="text-amber-400/60 text-sm tracking-[0.3em] mb-4">✦ THE HOUSE CUP ✦</div>

                            {sortedTeams[0] && (
                                <div className="text-center mb-8">
                                    <div className="text-6xl mb-4">🏆</div>
                                    <div className="text-3xl text-amber-400" style={{ textShadow: '0 0 15px rgba(212,175,55,0.5)' }}>
                                        {sortedTeams[0].name}
                                    </div>
                                    <div className="text-4xl text-amber-500 font-bold mt-2">
                                        {sortedTeams[0].score} points
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-8 mt-4">
                                {sortedTeams[1] && (
                                    <div className="text-center">
                                        <div className="text-2xl text-gray-400">🥈</div>
                                        <div className="text-amber-200/70">{sortedTeams[1].name}</div>
                                        <div className="text-amber-400">{sortedTeams[1].score}</div>
                                    </div>
                                )}
                                {sortedTeams[2] && (
                                    <div className="text-center">
                                        <div className="text-2xl text-amber-600">🥉</div>
                                        <div className="text-amber-200/70">{sortedTeams[2].name}</div>
                                        <div className="text-amber-400">{sortedTeams[2].score}</div>
                                    </div>
                                )}
                            </div>

                            {/* Timer as hourglass */}
                            <div className="mt-8 text-center">
                                <div className="text-2xl">⏳</div>
                                <div className="text-3xl text-amber-400">{formatTime(globalTimer)}</div>
                            </div>
                        </div>

                        {/* Right - Magical Activity + QR */}
                        <div className="bg-amber-900/20 border border-amber-700/30 p-6 relative flex flex-col">
                            <div className="absolute top-2 left-2 text-amber-500/30">✦</div>
                            <h3 className="text-amber-400 text-xl mb-6 border-b border-amber-700/30 pb-2">
                                ✧ Magical Dispatches ✧
                            </h3>
                            <div className="space-y-4 font-sans text-sm flex-1 max-h-40 overflow-auto">
                                {history.slice(0, 4).map((log, i) => (
                                    <div key={i} className="text-amber-200/60 italic border-b border-amber-900/30 pb-2">
                                        <span className="text-amber-500/40 text-xs">{new Date(log.time).toLocaleTimeString()}</span>
                                        <div>{log.message}</div>
                                    </div>
                                ))}
                            </div>

                            {/* QR Code */}
                            <div className="mt-4 pt-4 border-t border-amber-700/30 text-center">
                                <div className="text-amber-400 text-sm mb-2 italic">✧ Enrollment Scroll ✧</div>
                                <div className="bg-amber-100 p-2 inline-block border-2 border-amber-600 rounded">
                                    <QRCodeSVG value={nexusUrl} size={70} level="M" fgColor="#78350f" bgColor="#fef3c7" />
                                </div>
                                <div className="text-amber-200/40 text-xs mt-2 italic">Scan to join thy house</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-amber-200/30 text-sm italic">
                        "Mischief Managed"
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MATRIX THEME - Digital Rain / The Construct
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-black text-green-500 font-mono overflow-hidden relative">
            {/* Matrix Rain */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div key={i} className="absolute text-green-500 text-xs whitespace-nowrap opacity-30"
                        style={{
                            left: (i * 3.33) + '%',
                            animation: `rain ${Math.random() * 5 + 5}s linear infinite`,
                            animationDelay: Math.random() * 5 + 's'
                        }}>
                        {[...Array(50)].map((_, j) => (
                            <div key={j} style={{ opacity: Math.random() }}>
                                {String.fromCharCode(0x30A0 + Math.random() * 96)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Scanlines */}
            <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_2px] pointer-events-none z-40" />

            <div className="relative z-10 h-screen flex flex-col p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-green-900 pb-4">
                    <div>
                        <div className="text-xs text-green-700 tracking-widest">ZION MAINFRAME // CONSTRUCT ACTIVE</div>
                        <h1 className="text-4xl font-bold" style={{ textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41' }}>
                            THE MATRIX
                        </h1>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-green-700">SYSTEM_TIME</div>
                        <div className="text-5xl font-bold" style={{ textShadow: '0 0 10px #00ff41' }}>
                            {formatTime(globalTimer)}
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-6">

                    {/* Left - Operatives */}
                    <div className="bg-black/80 border border-green-900 p-4">
                        <div className="text-green-700 text-sm mb-4">{'>'}_ OPERATIVES.list</div>
                        <div className="space-y-2">
                            {sortedTeams.map((team, i) => (
                                <div key={team.id} className="flex items-center gap-2 text-sm">
                                    <span className={i < 3 ? 'text-green-400' : 'text-green-700'}>[{String(i + 1).padStart(2, '0')}]</span>
                                    <span className="flex-1 truncate">{team.name}</span>
                                    <span className="text-green-400 font-bold">{team.score}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-green-700 animate-pulse">_</div>
                    </div>

                    {/* Center - The One */}
                    <div className="bg-black/80 border border-green-900 p-4 flex flex-col items-center justify-center">
                        <div className="text-green-700 text-sm mb-6">{'>'}_ ANOMALY.detected()</div>

                        {sortedTeams[0] && (
                            <div className="text-center mb-8">
                                <div className="text-green-700 text-xs tracking-widest mb-2">THE ONE</div>
                                <div className="text-4xl font-bold mb-2" style={{ textShadow: '0 0 15px #00ff41' }}>
                                    {sortedTeams[0].name}
                                </div>
                                <div className="text-5xl font-bold text-green-400">{sortedTeams[0].score}</div>
                            </div>
                        )}

                        <div className="flex gap-8">
                            {sortedTeams[1] && (
                                <div className="text-center text-green-600">
                                    <div className="text-xs">MORPHEUS</div>
                                    <div className="text-xl">{sortedTeams[1].name}</div>
                                    <div className="font-bold">{sortedTeams[1].score}</div>
                                </div>
                            )}
                            {sortedTeams[2] && (
                                <div className="text-center text-green-600">
                                    <div className="text-xs">TRINITY</div>
                                    <div className="text-xl">{sortedTeams[2].name}</div>
                                    <div className="font-bold">{sortedTeams[2].score}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - System Log + QR */}
                    <div className="bg-black/80 border border-green-900 p-4 flex flex-col">
                        <div className="text-green-700 text-sm mb-4">{'>'}_ SYSTEM.log</div>
                        <div className="space-y-2 text-xs flex-1 max-h-40 overflow-auto">
                            {history.slice(0, 6).map((log, i) => (
                                <div key={i} className="text-green-700">
                                    <span className="text-green-900">[{new Date(log.time).toLocaleTimeString()}]</span> {log.message}
                                </div>
                            ))}
                        </div>

                        {/* QR Code */}
                        <div className="mt-4 pt-4 border-t border-green-900 text-center">
                            <div className="text-green-500 text-xs mb-2">{'>'}_ JACK_IN</div>
                            <div className="bg-black p-2 inline-block border border-green-700">
                                <QRCodeSVG value={nexusUrl} size={70} level="M" fgColor="#22c55e" bgColor="#000000" />
                            </div>
                            <div className="text-green-900 text-[10px] mt-2">FOLLOW THE WHITE RABBIT</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-green-900 text-xs tracking-widest">
                    WAKE UP, NEO... THE MATRIX HAS YOU
                </div>
            </div>

            <style>{`
                @keyframes rain { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
            `}</style>
        </div>
    );
}
