import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SONGS = [
    {
        title: "Le Roi Lion",
        text: ["Hakuna", "Matata,", "mais", "quelle", "phrase", "__________", "!"],
        missing: "magnifique",
        options: ["fantastique", "magique", "magnifique", "sympathique"]
    },
    {
        title: "La Reine des Neiges",
        text: ["Libérée,", "délivrée,", "je", "ne", "__________", "plus", "jamais"],
        missing: "mentirai",
        options: ["reviendrai", "pleurerai", "mentirai", "sourirai"]
    },
    {
        title: "Aladdin",
        text: ["Ce", "rêve", "bleu,", "c'est", "un", "__________", "monde"],
        missing: "nouveau",
        options: ["beau", "grand", "nouveau", "vrai"]
    },
    {
        title: "Mulan",
        text: ["Comme", "un", "homme,", "sois", "plus", "__________", "que", "le", "cours", "du", "torrent"],
        missing: "violent",
        options: ["puissant", "rapide", "violent", "grand"]
    }
];

export default function LionKingLyrics({ onComplete, onExit }) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedWord, setSelectedWord] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null); // true, false, null

    const currentSong = SONGS[index];

    const handleSelect = (word) => {
        if (isCorrect !== null) return;

        setSelectedWord(word);
        const correct = word === currentSong.missing;
        setIsCorrect(correct);

        if (correct) {
            setScore(s => s + 1);
        }

        setTimeout(() => {
            if (index < SONGS.length - 1) {
                setIndex(prev => prev + 1);
                setSelectedWord(null);
                setIsCorrect(null);
            } else {
                finishGame();
            }
        }, 1500);
    };

    const finishGame = () => {
        const finalScore = Math.round((score / SONGS.length) * 300);
        onComplete(finalScore);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#1e1b4b] text-[#fbbf24] flex flex-col font-sans p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-[#fbbf24]/30 pb-4">
                <button onClick={onExit} className="text-sm hover:text-white">✕ QUITTER</button>
                <div className="font-bold text-lg">KARAOKÉ MAGIQUE</div>
                <div className="font-mono">{score}/{index}</div>
            </div>

            {/* Song Card */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="w-full bg-[#312e81] p-8 rounded-2xl shadow-xl border border-[#fbbf24]/20 text-center"
                    >
                        <div className="text-sm text-blue-300 uppercase tracking-widest mb-4">
                            🎵 {currentSong.title}
                        </div>

                        <div className="text-xl md:text-2xl font-serif leading-relaxed min-h-[100px] flex flex-wrap justify-center gap-2 items-center">
                            {currentSong.text.map((word, i) => (
                                <span key={i} className={word === "__________" ? "text-transparent relative px-4" : ""}>
                                    {word === "__________" && (
                                        <span className="absolute inset-0 border-b-2 border-white/50 flex items-center justify-center text-[#fbbf24] font-bold">
                                            {selectedWord || "?"}
                                        </span>
                                    )}
                                    {word !== "__________" ? word : ""}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                    {currentSong.options.map((option, i) => (
                        <motion.button
                            key={option}
                            onClick={() => handleSelect(option)}
                            disabled={isCorrect !== null}
                            whileTap={{ scale: 0.95 }}
                            className={`p-4 rounded-xl font-bold text-lg transition-all border-2
                                ${isCorrect !== null && option === currentSong.missing
                                    ? 'bg-green-500 border-green-400 text-white'
                                    : isCorrect !== null && option === selectedWord && option !== currentSong.missing
                                        ? 'bg-red-500 border-red-400 text-white'
                                        : 'bg-[#fbbf24]/10 border-[#fbbf24]/30 hover:bg-[#fbbf24]/20 text-[#fbbf24]'
                                }
                            `}
                        >
                            {option}
                        </motion.button>
                    ))}
                </div>

                {/* Feedback */}
                {isCorrect !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}
                    >
                        {isCorrect ? "✨ CORRECT !" : "❌ FAUX !"}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
