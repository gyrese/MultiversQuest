import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Morse Code Dictionary
const MORSE_CODE = {
    'S': '...',
    'T': '-',
    'A': '.-',
    'Y': '-.--',
    'G': '--.',
    'O': '---',
    'H': '....',
    'E': '.',
    'L': '.-..',
    'P': '.--.'
};

const LEVELS = [
    { word: "STAY", hint: "Murf..." },
    { word: "GHOST", hint: "Ce n'est pas un fantôme" },
    { word: "HELP", hint: "SOS" }
];

export default function InterstellarMorse({ onComplete, onExit }) {
    const [levelIndex, setLevelIndex] = useState(0);
    const [input, setInput] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSignal, setShowSignal] = useState(false); // Visual feedback for dot/dash

    const currentLevel = LEVELS[levelIndex];
    const targetWord = currentLevel.word;

    // Play Sequence
    const playSequence = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        setInput("");

        for (let char of targetWord) {
            const code = MORSE_CODE[char];
            // Play char code
            for (let symbol of code) {
                setShowSignal(true);
                // Vibrate if possible
                if (navigator.vibrate) navigator.vibrate(symbol === '.' ? 100 : 300);

                // Wait for symbol duration
                await new Promise(r => setTimeout(r, symbol === '.' ? 200 : 600));
                setShowSignal(false);

                // Gap between symbols
                await new Promise(r => setTimeout(r, 200));
            }
            // Gap between letters
            await new Promise(r => setTimeout(r, 800));
        }
        setIsPlaying(false);
    };

    const handleInput = (char) => {
        if (isPlaying) return;

        const newInput = input + char;
        if (newInput.length <= targetWord.length) {
            setInput(newInput);

            if (newInput === targetWord) {
                // Correct!
                setTimeout(() => {
                    if (levelIndex < LEVELS.length - 1) {
                        setLevelIndex(prev => prev + 1);
                        setInput("");
                    } else {
                        onComplete(350);
                    }
                }, 1000);
            } else if (newInput.length === targetWord.length) {
                // Wrong
                setTimeout(() => setInput(""), 500);
                // Shake effect logic here (implied via UI feedback)
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white font-mono flex flex-col items-center justify-center p-6 select-none">
            {/* Background Dust */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10">
                <div className="text-gray-400 text-xs">TESSERACT LINK: ACTIVE</div>
                <button onClick={onExit} className="text-xs border border-white/20 px-2 py-1">ABORT</button>
            </div>

            {/* Main Visual - The Bookshelf / Tesseract lines */}
            <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center gap-8 relative">

                {/* Signal Light */}
                <div className={`w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center transition-all duration-100 
                    ${showSignal ? 'bg-white shadow-[0_0_50px_white]' : 'bg-transparent'}
                `}>
                    <div className="text-6xl opacity-50">🧭</div>
                </div>

                {/* Message Display */}
                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-500 uppercase tracking-widest">{currentLevel.hint}</p>

                    <div className="flex gap-2 justify-center text-4xl font-bold tracking-widest min-h-[60px]">
                        {targetWord.split('').map((_, i) => (
                            <span key={i} className={`border-b-2 border-white/50 w-10 text-center ${input[i] ? 'text-white' : 'text-transparent'}`}>
                                {input[i] || '_'}
                            </span>
                        ))}
                    </div>

                    <button
                        onClick={playSequence}
                        disabled={isPlaying}
                        className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                        {isPlaying ? 'TRANSMISSION...' : '▶ REJOUER LE MESSAGE'}
                    </button>
                </div>

                {/* Keyboard */}
                <div className="grid grid-cols-5 gap-2 w-full mt-8">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(char => {
                        // Only show letters needed for current level to make it playable without knowing morse perfectly?
                        // Or show all but highlight? Let's show all for "Expert", but maybe filter for ease.
                        // For simplicity and playability, let's just show relevant letters + some decoys.
                        const relevant = "STAYGHOELP".includes(char);
                        return (
                            <button
                                key={char}
                                onClick={() => handleInput(char)}
                                disabled={!relevant && false} // Keep all active for difficulty? Or disable? Let's keep active.
                                className={`h-12 border border-white/20 rounded hover:bg-white/20 active:bg-white active:text-black transition-colors ${!relevant ? 'opacity-30' : 'font-bold'}`}
                            >
                                {char}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setInput(prev => prev.slice(0, -1))} className="w-full py-3 border border-red-500/30 text-red-400 hover:bg-red-900/20">
                    EFFACER
                </button>
            </div>
        </div>
    );
}
