import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENTS = [
    { id: '1885', year: 1885, text: "Doc et Clara dans le Far West" },
    { id: '1955a', year: 1955.1, text: "Doc tombe de ses toilettes (5 Nov)" },
    { id: '1955b', year: 1955.9, text: "La foudre frappe l'Horloge (12 Nov)" },
    { id: '1985', year: 1985, text: "Einstein voyage une minute dans le futur" },
    { id: '2015', year: 2015, text: "Marty achète l'Almanach des Sports" }
];

// Fisher-Yates shuffle
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

export default function TimelineParadox({ onComplete, onExit }) {
    const [items, setItems] = useState(() => shuffle([...EVENTS]));
    const [selectedId, setSelectedId] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSelect = (id) => {
        if (success) return;

        if (selectedId === null) {
            setSelectedId(id);
        } else {
            if (selectedId === id) {
                setSelectedId(null);
                return;
            }

            // Swap
            const newItems = [...items];
            const indexA = newItems.findIndex(i => i.id === selectedId);
            const indexB = newItems.findIndex(i => i.id === id);

            [newItems[indexA], newItems[indexB]] = [newItems[indexB], newItems[indexA]];
            setItems(newItems);
            setSelectedId(null);

            checkWin(newItems);
        }
    };

    const checkWin = (currentItems) => {
        const sorted = [...EVENTS].sort((a, b) => a.year - b.year);
        const isCorrect = currentItems.every((item, index) => item.id === sorted[index].id);

        if (isCorrect) {
            setSuccess(true);
            setTimeout(() => {
                onComplete(400); // Max points
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0f0a1a] text-[#a855f7] flex flex-col font-mono p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-[#a855f7]/30 pb-4">
                <button onClick={onExit} className="text-sm hover:text-white">RETOUR</button>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    PARADOXE TEMPOREL
                </h1>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#a855f7] to-transparent z-0 opacity-30" />

                <div className="space-y-4 relative z-10">
                    <AnimatePresence>
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0, scale: selectedId === item.id ? 1.05 : 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelect(item.id)}
                                className={`
                                    relative p-4 rounded-xl border-2 flex items-center gap-4 cursor-pointer backdrop-blur-sm transition-all
                                    ${selectedId === item.id
                                        ? 'border-[#ec4899] bg-[#ec4899]/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                                        : success
                                            ? 'border-green-500 bg-green-900/20'
                                            : 'border-[#a855f7]/30 bg-[#1a0f2a]/80 hover:bg-[#2d1b4e]'
                                    }
                                `}
                            >
                                {/* Year Bubble */}
                                <div className={`
                                    w-16 h-16 rounded-full flex items-center justify-center font-bold text-sm border-2 shrink-0 bg-[#0f0a1a]
                                    ${success ? 'border-green-500 text-green-400' : 'border-[#a855f7] text-[#a855f7]'}
                                `}>
                                    {Math.floor(item.year)}
                                </div>

                                {/* Text */}
                                <div className="flex-1 text-sm md:text-base text-gray-300">
                                    {item.text}
                                </div>

                                {/* Selection Indicator */}
                                {selectedId === item.id && (
                                    <motion.div
                                        layoutId="selection"
                                        className="absolute -right-2 w-4 h-4 rounded-full bg-[#ec4899]"
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Instruction Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
                {success
                    ? <span className="text-green-400 font-bold animate-pulse">FLUX TEMPOREL RESTAURÉ !</span>
                    : "Touchez deux événements pour les intervertir et rétablir la chronologie."
                }
            </div>
        </div>
    );
}
