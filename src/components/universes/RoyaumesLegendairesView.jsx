import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Icons = {
    Tree: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">
            <path d="M12 21V9" />
            <path d="M7 17l5-4 5 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 9L8 5m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="5" r="1.5" className="fill-emerald-300" />
            <circle cx="8" cy="17" r="1" className="fill-emerald-300" />
            <circle cx="16" cy="17" r="1" className="fill-emerald-300" />
        </svg>
    ),
    Ring: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#C89B3C]">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" strokeOpacity="0.4" />
            <path d="M12 4v2m0 12v2m8-8h-2m-12 0H4" strokeOpacity="0.4" />
        </svg>
    ),
    Scroll: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#C89B3C]">
            <path d="M16 2H5C3.89 2 3 2.89 3 4v16c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V8l-5-6z" />
            <path d="M16 2v6h6" />
            <path d="M12 11h4" />
            <path d="M8 15h8" />
            <path d="M8 19h4" />
        </svg>
    ),
    Potion: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#5E3A8C]">
            <path d="M12 2v6" />
            <path d="M9 8h6" />
            <path d="M18.5 21a2.5 2.5 0 0 0 2.5-2.5V11a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7.5A2.5 2.5 0 0 0 5.5 21h13z" />
            <circle cx="10" cy="15" r="1" fill="currentColor" className="text-purple-400" />
            <circle cx="14" cy="17" r="1" fill="currentColor" className="text-purple-400" />
        </svg>
    ),
    Sword: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-stone-400">
            <path d="M14.5 4l-10 10 2 2 10-10-2-2z" />
            <path d="M21 7l-3.5 3.5" />
            <path d="M17.5 3.5L21 7" />
            <path d="M3 15.5l5 5" />
            <path d="M3 21l2.5-2.5" />
        </svg>
    ),
    Lock: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-stone-600">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Play: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#0F0B08]">
            <path d="M8 5v14l11-7z" />
        </svg>
    )
};

const EmberParticle = ({ delay }) => (
    <motion.div
        className="absolute w-1 h-1 bg-[#C89B3C] rounded-full blur-[1px] opacity-0"
        style={{
            left: `${Math.random() * 100}%`,
            top: '100%'
        }}
        animate={{
            y: [0, -window.innerHeight * 0.8],
            x: [0, (Math.random() - 0.5) * 50],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0]
        }}
        transition={{
            duration: 5 + Math.random() * 5,
            delay: delay,
            repeat: Infinity,
            ease: "easeOut"
        }}
    />
);

const ActivityCard = ({ title, subtitle, icon: Icon, points, difficulty, locked, active }) => (
    <motion.div
        whileHover={!locked ? { scale: 1.02, y: -2 } : {}}
        className={`
            relative p-4 rounded-lg border-2 overflow-hidden group
            ${locked
                ? 'border-stone-800 bg-[#0c0907] opacity-60 cursor-not-allowed grayscale'
                : active
                    ? 'border-[#C89B3C] bg-[#1a1410] shadow-[0_0_15px_rgba(200,155,60,0.15)] cursor-pointer'
                    : 'border-[#3a2e25] bg-[#14100c] hover:border-[#5E3A8C] hover:shadow-[0_0_15px_rgba(94,58,140,0.2)] cursor-pointer'
            }
        `}
    >
        {/* Stone Texture Overlay (CSS Pattern) */}
        {!locked && (
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239C92AC\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}
            />
        )}

        <div className="flex items-center gap-4 relative z-10">
            {/* Icon Box */}
            <div className={`
                w-14 h-14 rounded-lg flex items-center justify-center border
                ${locked
                    ? 'bg-stone-900 border-stone-800'
                    : 'bg-[#1e1a16] border-[#3a2e25] group-hover:border-[#5E3A8C] shadow-inner'
                }
            `}>
                {locked ? <Icons.Lock /> : <Icon />}
            </div>

            {/* Texts */}
            <div className="flex-1 min-w-0">
                <h3 className={`font-serif font-bold truncate ${locked ? 'text-stone-600' : 'text-[#C89B3C] text-lg'}`} style={{ fontFamily: 'Cinzel Decorative, serif' }}>
                    {title}
                </h3>
                <p className={`text-xs truncate font-mono ${locked ? 'text-stone-700' : 'text-stone-400'}`}>
                    {subtitle}
                </p>
            </div>

            {/* Right Side */}
            <div className="flex flex-col items-end gap-1">
                {!locked && (
                    <>
                        <div className="flex text-[#C89B3C] text-[10px] gap-0.5">
                            {'★'.repeat(difficulty)}{'☆'.repeat(5 - difficulty)}
                        </div>
                        <div className="text-xs font-bold text-[#E5D5BC]">{points} pts</div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 rounded-full bg-[#C89B3C] text-[#0F0B08] flex items-center justify-center mt-1 shadow-[0_0_10px_rgba(200,155,60,0.4)]"
                        >
                            <Icons.Play />
                        </motion.button>
                    </>
                )}
                {locked && (
                    <div className="text-xs text-stone-600 mt-2 font-mono">VERROUILLÉ</div>
                )}
            </div>
        </div>

        {/* Glow Effects */}
        {active && (
            <motion.div
                className="absolute inset-0 border-2 border-[#C89B3C] rounded-lg pointer-events-none"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
        )}
    </motion.div>
);

export default function RoyaumesLegendairesView({ onBack }) {
    const [scrolled, setScrolled] = useState(false);

    return (
        <div className="w-full min-h-screen bg-[#0F0B08] text-[#E5D5BC] relative overflow-hidden font-serif selection:bg-[#C89B3C] selection:text-black">

            {/* BACKGROUND LAYERS */}
            {/* Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-[#0F0B08]/90 pointer-events-none" /> {/* Darken */}

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none" />

            {/* Floating Embers */}
            {[...Array(20)].map((_, i) => (
                <EmberParticle key={i} delay={Math.random() * 5} />
            ))}

            {/* CONTENT CONTAINER */}
            <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-12 min-h-screen flex flex-col">

                {/* 🧭 HEADER CARD - 15% HEIGHT (Approx) */}
                <motion.header
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative border-y-2 border-[#C89B3C]/50 bg-[#16120e] p-6 md:p-8 mb-12 shadow-2xl"
                >
                    {/* Corner Decorations (CSS Borders) */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#C89B3C]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#C89B3C]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#C89B3C]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#C89B3C]" />

                    {/* Rune Border Top/Bottom */}
                    <div className="absolute top-1 left-0 right-0 h-[10px] flex justify-center opacity-20 text-[8px] tracking-[5px] select-none text-[#C89B3C]">
                        ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ
                    </div>
                    <div className="absolute bottom-1 left-0 right-0 h-[10px] flex justify-center opacity-20 text-[8px] tracking-[5px] select-none text-[#C89B3C]">
                        ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* LEFT: Emblem & Title */}
                        <div className="flex items-center gap-6">
                            <div className="relative w-20 h-20 rounded-full border-2 border-[#C89B3C] bg-[#0F0B08] flex items-center justify-center shadow-[0_0_20px_rgba(200,155,60,0.2)]">
                                <div className="w-12 h-12">
                                    <Icons.Tree />
                                </div>
                                {/* Rotating Rune Ring */}
                                <motion.div
                                    className="absolute inset-0 border border-dashed border-[#C89B3C]/30 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                />
                            </div>

                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold text-[#E5D5BC] leading-none mb-1 drop-shadow-lg" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
                                    ROYAUMES <span className="text-[#C89B3C]">LÉGENDAIRES</span>
                                </h1>
                                <p className="text-[#9C92AC] font-serif italic text-sm tracking-wide">
                                    Magie et aventures épiques
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Progress */}
                        <div className="flex flex-col items-end min-w-[200px]">
                            <div className="text-[#C89B3C] font-bold font-serif mb-2 tracking-widest text-sm">
                                0 / 4 QUÊTES ACCOMPLIES
                            </div>
                            <div className="w-full h-3 bg-[#0F0B08] border border-[#3a2e25] rounded-full overflow-hidden relative">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#5E3A8C] to-[#C89B3C]"
                                    initial={{ width: 0 }}
                                    animate={{ width: '15%' }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                />
                                {/* Sparkle on bar */}
                                <motion.div
                                    className="absolute top-0 bottom-0 w-[2px] bg-white blur-[2px]"
                                    style={{ left: '15%' }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* 📜 SECTION TITLE */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-8 relative"
                >
                    <h2 className="text-2xl text-[#C89B3C] font-serif inline-block relative px-8 py-2" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl opacity-50">❖</span>
                        SÉLECTIONNEZ UNE ACTIVITÉ
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl opacity-50">❖</span>
                    </h2>
                    <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#C89B3C] to-transparent mx-auto mt-2" />
                </motion.div>

                {/* ⚔️ ACTIVITY CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pb-20">
                    <ActivityCard
                        title="La Quête de l'Anneau"
                        subtitle="Seigneur des Anneaux • Aventure"
                        icon={Icons.Ring}
                        points="500"
                        difficulty={3}
                        active={true}
                    />
                    <ActivityCard
                        title="Secrets de Poudlard"
                        subtitle="Harry Potter • Énigmes"
                        icon={Icons.Potion}
                        points="400"
                        difficulty={2}
                    />
                    <ActivityCard
                        title="Trône de Fer"
                        subtitle="Game of Thrones • Stratégie"
                        icon={Icons.Sword}
                        points="600"
                        difficulty={4}
                        locked={true}
                    />
                    <ActivityCard
                        title="Le Grimoire Ancien"
                        subtitle="Légendes • Quiz"
                        icon={Icons.Scroll}
                        points="300"
                        difficulty={1}
                        locked={true}
                    />
                </div>
            </div>
        </div>
    );
}
