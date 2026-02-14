import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INGREDIENTS = [
    { id: 'spider', emoji: '🕷️', name: 'Patte d\'Araignée', color: '#1a1a1a' },
    { id: 'eye', emoji: '👁️', name: 'Oeil de Triton', color: '#00ff00' },
    { id: 'blood', emoji: '🩸', name: 'Sang de Dragon', color: '#ff0000' },
    { id: 'moon', emoji: '🌙', name: 'Pierre de Lune', color: '#ffffcc' },
    { id: 'feather', emoji: '🪶', name: 'Plume de Phénix', color: '#ffcc00' },
];

const RECIPES = [
    { name: "Polynectar", needs: ['spider', 'eye', 'blood'] },
    { name: "Felix Felicis", needs: ['moon', 'feather', 'blood'] },
    { name: "Veritaserum", needs: ['eye', 'moon', 'feather'] }
];

export default function CoursPotions({ onComplete, onExit }) {
    const [recipeIndex, setRecipeIndex] = useState(0);
    const [cauldron, setCauldron] = useState([]);
    const [mixtureColor, setMixtureColor] = useState('#2d1b4e'); // Dark purple base
    const [isComplete, setIsComplete] = useState(false);

    const currentRecipe = RECIPES[recipeIndex];

    const handleAdd = (ingredient) => {
        if (isComplete) return;

        const newCauldron = [...cauldron, ingredient.id];
        setCauldron(newCauldron);

        // Mix color simply by taking the last ingredient's color with some opacity mix
        // (Visual only, simple approximation)
        setMixtureColor(ingredient.color);

        // Check if recipe is spoiled (wrong ingredient or too many)
        if (!currentRecipe.needs.includes(ingredient.id)) {
            // Spoiled!
            setMixtureColor('#5c4033'); // Brown poop color
            setTimeout(() => {
                alert("Explosion ! Mauvais ingrédient !");
                setCauldron([]);
                setMixtureColor('#2d1b4e');
            }, 500);
            return;
        }

        // Check if complete
        const successful = currentRecipe.needs.every(req => newCauldron.includes(req));
        if (successful && newCauldron.length === currentRecipe.needs.length) {
            if (recipeIndex < RECIPES.length - 1) {
                setTimeout(() => {
                    setRecipeIndex(prev => prev + 1);
                    setCauldron([]);
                    setMixtureColor('#2d1b4e');
                }, 1000);
            } else {
                setIsComplete(true);
                setTimeout(() => onComplete(400), 2000);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-[#1a120b] font-serif text-[#d4c5a3] flex flex-col overflow-hidden touch-none select-none">
            {/* Background Dungeon */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brick-wall.png')]" />

            {/* Header */}
            <div className="p-4 flex justify-between items-start z-10">
                <div>
                    <h2 className="text-xl font-bold mb-1">Potions : {recipeIndex + 1}/{RECIPES.length}</h2>
                    <div className="bg-black/50 p-2 rounded border border-[#d4c5a3]/30">
                        <p className="text-sm uppercase tracking-widest mb-2 border-b border-[#d4c5a3]/20 pb-1">Recette : {currentRecipe.name}</p>
                        <div className="flex gap-2">
                            {currentRecipe.needs.map(id => {
                                const ing = INGREDIENTS.find(i => i.id === id);
                                const added = cauldron.includes(id);
                                return (
                                    <div key={id} className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${added ? 'bg-[#d4c5a3]/20 border-[#d4c5a3]' : 'border-[#d4c5a3]/30 opacity-50'}`}>
                                        {ing.emoji}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <button onClick={onExit} className="border border-[#d4c5a3]/50 px-3 py-1 rounded hover:bg-[#d4c5a3]/10">QUITTER</button>
            </div>

            {/* Cauldron Area */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Cauldron */}
                <div className="w-64 h-48 bg-gray-900 rounded-b-full border-4 border-gray-700 relative flex justify-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    {/* Liquid */}
                    <motion.div
                        animate={{ height: `${(cauldron.length / 3) * 80}%`, backgroundColor: mixtureColor }}
                        className="absolute bottom-0 w-full transition-all duration-500 opacity-80"
                    />

                    {/* Bubbles */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute bottom-4 left-10 text-2xl opacity-50"
                    >🫧</motion.div>
                    <motion.div
                        animate={{ y: [0, -30, 0] }}
                        transition={{ repeat: Infinity, duration: 3, delay: 1 }}
                        className="absolute bottom-4 right-10 text-xl opacity-50"
                    >🫧</motion.div>

                </div>
                {/* Fire */}
                <div className="absolute top-[60%] w-40 h-20 bg-orange-500 blur-xl animate-pulse opacity-50 -z-10" />
            </div>

            {/* Ingredients Shelf */}
            <div className="bg-[#0f0a06] p-4 pb-8 border-t-4 border-[#3e2723] shadow-2xl z-20">
                <p className="text-center text-sm opacity-50 mb-4">TOUCHEZ POUR AJOUTER</p>
                <div className="flex justify-around items-center">
                    {INGREDIENTS.map(ing => (
                        <motion.button
                            key={ing.id}
                            whileTap={{ scale: 1.2, y: -20 }}
                            onClick={() => handleAdd(ing)}
                            className="flex flex-col items-center gap-2 w-16"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                                {ing.emoji}
                            </div>
                            <span className="text-[10px] text-center leading-tight opacity-70">{ing.name}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Victory Overlay */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-[#d4c5a3]"
                    >
                        <div className="text-6xl mb-4">⚗️</div>
                        <h1 className="text-3xl font-bold mb-2">MAÎTRE DES POTIONS !</h1>
                        <p className="text-sm opacity-70">Rogue est impressionné.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
