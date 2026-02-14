import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
    { id: 1, name: "Woody", x: 20, y: 60, emoji: "🤠" },
    { id: 2, name: "Buzz", x: 80, y: 30, emoji: "🚀" },
    { id: 3, name: "Rex", x: 40, y: 80, emoji: "🦖" },
    { id: 4, name: "Mr Patate", x: 10, y: 30, emoji: "🥔" },
    { id: 5, name: "Bayonne", x: 90, y: 70, emoji: "🐷" },
];

export default function ToyStoryAndy({ onComplete, onExit }) {
    const [found, setFound] = useState([]);

    const handleFind = (id) => {
        if (!found.includes(id)) {
            const newFound = [...found, id];
            setFound(newFound);
            if (newFound.length === ITEMS.length) {
                setTimeout(() => onComplete(300), 1000);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-[#87CEEB] overflow-auto touch-pan-x touch-pan-y no-scrollbar">
            {/* Cloud Wallpaper Pattern */}
            <div className="absolute inset-0 z-0 opacity-50"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)',
                    backgroundSize: '50px 50px'
                }}
            />

            <div className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between bg-white/80 backdrop-blur-sm border-b border-blue-200">
                <button onClick={onExit} className="text-blue-600 font-bold text-sm">RETOUR</button>
                <div className="font-bold text-blue-500">
                    JOUETS: {found.length}/{ITEMS.length}
                </div>
            </div>

            {/* Game World (Larger than screen) */}
            <div className="relative w-[150vw] h-[150vh] bg-gradient-to-b from-[#87CEEB] to-[#e0f2fe]">

                {/* Room Decor (Simulated) */}
                <div className="absolute bottom-0 w-full h-32 bg-[#8B4513] border-t-8 border-[#5D2906]" /> {/* Floor */}
                <div className="absolute top-[20%] left-[10%] w-[40%] h-[30%] bg-blue-400 rounded-xl border-4 border-white shadow-xl" /> {/* Bed */}

                {ITEMS.map(item => (
                    <motion.button
                        key={item.id}
                        onClick={() => handleFind(item.id)}
                        initial={{ opacity: found.includes(item.id) ? 0 : 1, scale: 1 }}
                        animate={{
                            opacity: found.includes(item.id) ? 0 : 1,
                            scale: found.includes(item.id) ? 1.5 : 1
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute text-4xl p-4 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    >
                        {item.emoji}
                    </motion.button>
                ))}

            </div>

            {/* Found Notifications */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                {found.map(id => (
                    <motion.div
                        key={id}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-green-400"
                    >
                        ✅
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
