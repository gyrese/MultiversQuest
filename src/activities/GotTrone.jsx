import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const EVENTS = [
    { text: "Le peuple a faim.", yes: { gold: -10, pop: 20 }, no: { gold: 0, pop: -20 } },
    { text: "Une guerre éclate au Nord.", yes: { army: -30, gold: -10 }, no: { army: 10, pop: -30 } },
    { text: "Un dragon demande un tribut.", yes: { gold: -50, army: 0 }, no: { army: -50, pop: 10 } },
    { text: "Mariage royal coûteux ?", yes: { gold: -40, pop: 10 }, no: { pop: -10, gold: 10 } },
    { text: "Executer un traître public ?", yes: { pop: 10, army: -10 }, no: { pop: -20, army: 10 } },
    { text: "Construire un mur géant ?", yes: { gold: -60, army: 20 }, no: { army: -20, pop: 0 } },
    { text: "Accepter l'aide des banquiers ?", yes: { gold: 50, pop: -10 }, no: { gold: -20, pop: 10 } },
    { text: "Fête du printemps ?", yes: { gold: -20, pop: 20 }, no: { pop: -20 } },
    { text: "Recruter des mercenaires ?", yes: { army: 30, gold: -30 }, no: { army: -10 } },
    { text: "Pardonner aux rebelles ?", yes: { pop: 30, army: -20 }, no: { pop: -30, army: 20 } },
];

export default function GotTrone({ onComplete, onExit }) {
    const [index, setIndex] = useState(0);
    const [stats, setStats] = useState({ gold: 50, pop: 50, army: 50 });
    const [gameOver, setGameOver] = useState(false);

    // Drag logic
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacityYes = useTransform(x, [0, 150], [0, 1]);
    const opacityNo = useTransform(x, [-150, 0], [1, 0]);

    const handleDragEnd = (_, info) => {
        if (info.offset.x > 100) {
            handleChoice(true); // YES (Right)
        } else if (info.offset.x < -100) {
            handleChoice(false); // NO (Left)
        }
    };

    const handleChoice = (isYes) => {
        const event = EVENTS[index];
        const impacts = isYes ? event.yes : event.no;

        setStats(prev => {
            const newStats = {
                gold: Math.min(100, Math.max(0, prev.gold + (impacts.gold || 0))),
                pop: Math.min(100, Math.max(0, prev.pop + (impacts.pop || 0))),
                army: Math.min(100, Math.max(0, prev.army + (impacts.army || 0)))
            };

            if (newStats.gold === 0 || newStats.pop === 0 || newStats.army === 0) {
                setGameOver(true);
            }
            return newStats;
        });

        if (index < EVENTS.length - 1) {
            setIndex(prev => prev + 1);
            x.set(0);
        } else {
            finishGame(true);
        }
    };

    const finishGame = (survived) => {
        const score = survived ? Math.round(((stats.gold + stats.pop + stats.army) / 300) * 400) : 0;
        onComplete(score);
    };

    if (gameOver) {
        return (
            <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center text-center p-8 z-50">
                <h1 className="text-4xl font-serif text-red-600 mb-4">VOUS ÊTES MORT</h1>
                <p className="mb-8 font-serif italic">Votre règne a été court et sanglant.</p>
                <button onClick={() => onComplete(0)} className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                    TERMINER
                </button>
            </div>
        );
    }

    if (index >= EVENTS.length) return null;

    return (
        <div className="fixed inset-0 bg-[#1a0f00] text-[#E5D5BC] z-50 flex flex-col font-serif select-none overflow-hidden">
            {/* Header / Stats */}
            <div className="p-4 flex justify-between items-center bg-[#2d1810] border-b border-[#C89B3C] shadow-lg">
                <div className="flex gap-4 text-xs md:text-sm">
                    <span className={stats.gold < 20 ? 'text-red-500 animate-pulse' : ''}>💰 {stats.gold}</span>
                    <span className={stats.pop < 20 ? 'text-red-500 animate-pulse' : ''}>❤️ {stats.pop}</span>
                    <span className={stats.army < 20 ? 'text-red-500 animate-pulse' : ''}>⚔️ {stats.army}</span>
                </div>
                <button onClick={onExit} className="text-xs opacity-50">QUITTER</button>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex items-center justify-center relative p-6">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 0h2v2H5V1zm4 0h2v2H9V1z' fill='%23C89B3C' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
                />

                {/* Card Stack */}
                <div className="relative w-full max-w-sm aspect-[3/4]">
                    {/* The Card */}
                    <motion.div
                        className="absolute inset-0 bg-[#2d1810] border-4 border-[#C89B3C] rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center cursor-grab active:cursor-grabbing"
                        style={{ x, rotate }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="text-6xl mb-8">👑</div>
                        <p className="text-xl md:text-2xl font-bold leading-relaxed relative z-10 drop-shadow-md">
                            "{EVENTS[index].text}"
                        </p>

                        {/* Overlays for Yes/No */}
                        <motion.div
                            style={{ opacity: opacityYes }}
                            className="absolute top-8 right-8 text-4xl font-bold text-green-500 border-4 border-green-500 rounded-lg px-4 py-2 rotate-12"
                        >
                            OUI
                        </motion.div>
                        <motion.div
                            style={{ opacity: opacityNo }}
                            className="absolute top-8 left-8 text-4xl font-bold text-red-500 border-4 border-red-500 rounded-lg px-4 py-2 -rotate-12"
                        >
                            NON
                        </motion.div>

                        <div className="absolute bottom-8 opacity-50 text-sm">
                            <EventHint event={EVENTS[index]} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Controls hint */}
            <div className="p-8 text-center text-sm opacity-50">
                GLISSEZ GAUCHE (NON) ou DROITE (OUI)
            </div>
        </div>
    );
}

function EventHint({ event }) {
    // Shows what stats might be affected
    const yesKeys = Object.keys(event.yes).map(k => k === 'gold' ? '💰' : k === 'pop' ? '❤️' : '⚔️');
    const noKeys = Object.keys(event.no).map(k => k === 'gold' ? '💰' : k === 'pop' ? '❤️' : '⚔️');

    return (
        <div className="flex gap-8">
            <div className="text-red-400">NON: {noKeys.join(' ')}</div>
            <div className="text-green-400">OUI: {yesKeys.join(' ')}</div>
        </div>
    );
}
