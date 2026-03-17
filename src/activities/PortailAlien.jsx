import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const MAX_ROUNDS = 10;   // Séquence max avant victoire
const BASE_SCORE = 500;
const BASE_DELAY = 600;  // ms entre chaque flash (diminue avec les rounds)

// 4 symboles du portail alien — chacun avec couleur, son (fréquence), et glyphe
const GLYPHS = [
    { id: 0, label: '◈', colorOn: '#00ffff', colorOff: '#003333', glow: '0 0 30px #00ffff, 0 0 60px #00ffff44', freq: 261.6, name: 'KETH' },
    { id: 1, label: '◉', colorOn: '#ff00ff', colorOff: '#330033', glow: '0 0 30px #ff00ff, 0 0 60px #ff00ff44', freq: 329.6, name: 'ARYN' },
    { id: 2, label: '⬡', colorOn: '#ffff00', colorOff: '#333300', glow: '0 0 30px #ffff00, 0 0 60px #ffff0044', freq: 392.0, name: 'VOSS' },
    { id: 3, label: '✦', colorOn: '#ff4400', colorOff: '#330a00', glow: '0 0 30px #ff4400, 0 0 60px #ff440044', freq: 523.3, name: 'MAEL' },
];

// ─── WEB AUDIO TONE ──────────────────────────────────────────────────────────
let audioCtx = null;
function playTone(freq, duration = 250, type = 'sine') {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) { /* AudioContext non dispo (iOS sans interaction) */ }
}

function playError() {
    playTone(80, 600, 'sawtooth');
}

function playSuccess() {
    [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => playTone(f, 200), i * 150)
    );
}

// ─── COMPOSANT GLYPH BUTTON ──────────────────────────────────────────────────
function GlyphButton({ glyph, isActive, isDisabled, onPress }) {
    return (
        <motion.button
            id={`glyph-${glyph.id}`}
            className="relative w-36 h-36 rounded-2xl flex flex-col items-center justify-center select-none cursor-pointer border-2 transition-none"
            style={{
                backgroundColor: isActive ? glyph.colorOn + '40' : glyph.colorOff,
                borderColor: isActive ? glyph.colorOn : glyph.colorOn + '40',
                boxShadow: isActive ? glyph.glow : 'none',
                opacity: isDisabled && !isActive ? 0.5 : 1,
            }}
            animate={isActive ? { scale: 1.08 } : { scale: 1 }}
            transition={{ duration: 0.05 }}
            onPointerDown={isDisabled ? undefined : onPress}
            disabled={isDisabled}
        >
            <span
                className="text-5xl mb-1 font-bold leading-none select-none"
                style={{ color: isActive ? glyph.colorOn : glyph.colorOn + '88' }}
            >
                {glyph.label}
            </span>
            <span
                className="text-[10px] tracking-[0.3em] font-mono"
                style={{ color: isActive ? glyph.colorOn : glyph.colorOn + '66' }}
            >
                {glyph.name}
            </span>

            {/* Scan line animation when active */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: `linear-gradient(180deg, transparent 40%, ${glyph.colorOn}20 100%)` }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                />
            )}
        </motion.button>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PortailAlien({ onComplete, onExit }) {
    const [phase, setPhase] = useState('INTRO');   // INTRO | SHOW | INPUT | WIN | LOSE
    const [sequence, setSequence] = useState([]);
    const [userInput, setUserInput] = useState([]);
    const [round, setRound] = useState(0);
    const [activeGlyph, setActiveGlyph] = useState(null);   // ID du glyph allumé
    const [message, setMessage] = useState('');
    const [energy, setEnergy] = useState(0);         // 0-100%, progression visuelle
    const [mistakes, setMistakes] = useState(0);
    const [shakePortal, setShakePortal] = useState(false);

    const isPlayingRef = useRef(false);

    // ─── FLASH UN GLYPH (pendant la séquence de démo) ────────────────────────
    const flashGlyph = useCallback((glyphId, duration = 500) => {
        return new Promise(resolve => {
            const g = GLYPHS[glyphId];
            playTone(g.freq, duration - 80);
            setActiveGlyph(glyphId);
            setTimeout(() => {
                setActiveGlyph(null);
                setTimeout(resolve, 120); // Pause between flashes
            }, duration);
        });
    }, []);

    // ─── JOUER LA SÉQUENCE COMPLÈTE ──────────────────────────────────────────
    const playSequence = useCallback(async (seq, roundNum) => {
        if (isPlayingRef.current) return;
        isPlayingRef.current = true;
        setPhase('SHOW');

        const delay = Math.max(BASE_DELAY - roundNum * 30, 280); // Accélère légèrement
        const flashDur = Math.max(520 - roundNum * 20, 300);

        setMessage(`SÉQUENCE ${roundNum} / ${MAX_ROUNDS} — MÉMORISEZ…`);
        await new Promise(r => setTimeout(r, 800));

        for (const glyphId of seq) {
            await flashGlyph(glyphId, flashDur);
            await new Promise(r => setTimeout(r, delay));
        }

        setMessage('REPRODUISEZ LA SÉQUENCE');
        setPhase('INPUT');
        setUserInput([]);
        isPlayingRef.current = false;
    }, [flashGlyph]);

    // ─── LANCER UN NOUVEAU ROUND ─────────────────────────────────────────────
    const startRound = useCallback((prevSeq, roundNum) => {
        const newGlyph = Math.floor(Math.random() * GLYPHS.length);
        const newSeq = [...prevSeq, newGlyph];
        setSequence(newSeq);
        setRound(roundNum);
        setEnergy(((roundNum - 1) / MAX_ROUNDS) * 100);
        setTimeout(() => playSequence(newSeq, roundNum), 600);
    }, [playSequence]);

    // ─── GESTION DU CLIC JOUEUR ──────────────────────────────────────────────
    const handleGlyphPress = useCallback(async (glyphId) => {
        if (phase !== 'INPUT' || isPlayingRef.current) return;

        // Flash immédiat du glyph pour feedback
        const g = GLYPHS[glyphId];
        playTone(g.freq, 180);
        setActiveGlyph(glyphId);
        setTimeout(() => setActiveGlyph(null), 200);

        const newInput = [...userInput, glyphId];
        setUserInput(newInput);
        const pos = newInput.length - 1;

        // ── MAUVAISE TOUCHE ───────────────────────────────────────────────────
        if (newInput[pos] !== sequence[pos]) {
            playError();
            setMistakes(m => m + 1);
            setShakePortal(true);
            setTimeout(() => setShakePortal(false), 600);

            if (mistakes + 1 >= 3) {
                // 3 erreurs → Game Over
                setPhase('LOSE');
                setMessage('SÉQUENCE INCORRECTE — PORTAIL REJETÉ');
            } else {
                // Peut réessayer ce round
                setMessage(`ERREUR ! (${3 - mistakes - 1} essai(s) restant) — Recommencez…`);
                await new Promise(r => setTimeout(r, 1500));
                playSequence(sequence, round);
            }
            return;
        }

        // ── BONNE TOUCHE ──────────────────────────────────────────────────────
        if (newInput.length === sequence.length) {
            // Séquence complète
            if (round >= MAX_ROUNDS) {
                // VICTOIRE !
                playSuccess();
                setEnergy(100);
                setPhase('WIN');
                setMessage('PORTAIL ACTIVÉ — ACCÈS ACCORDÉ');
                const score = BASE_SCORE + (3 - mistakes) * 200 + (MAX_ROUNDS * 50);
                setTimeout(() => onComplete(score), 3000);
            } else {
                // Prochain round
                setMessage('✓ SÉQUENCE VALIDÉE');
                setEnergy((round / MAX_ROUNDS) * 100);
                playTone(880, 200);
                await new Promise(r => setTimeout(r, 800));
                startRound(sequence, round + 1);
            }
        }
    }, [phase, userInput, sequence, round, mistakes, playSequence, startRound, onComplete]);

    // ─── DÉMARRAGE ───────────────────────────────────────────────────────────
    const handleStart = () => {
        setMistakes(0);
        setSequence([]);
        setUserInput([]);
        setRound(1);
        startRound([], 1);
    };

    // ─── RÉESSAYER ───────────────────────────────────────────────────────────
    const handleRetry = () => {
        setPhase('INTRO');
        setSequence([]);
        setUserInput([]);
        setRound(0);
        setEnergy(0);
        setMistakes(0);
        setMessage('');
    };

    // ─── RENDER ──────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-[#030015] flex flex-col items-center justify-between overflow-hidden select-none">

            {/* ── Background animated grid ─────────────────────────────────── */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,200,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }} />

            {/* ── Rotating outer rings ─────────────────────────────────────── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    className="w-96 h-96 rounded-full border border-cyan-500/10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{ boxShadow: '0 0 40px rgba(0,255,255,0.05)' }}
                />
                <motion.div
                    className="absolute w-80 h-80 rounded-full border border-purple-500/10"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <div className="z-10 w-full flex flex-col items-center pt-8 px-4">
                <p className="text-cyan-600 text-[10px] tracking-[0.4em] font-mono mb-1">SYSTÈME XENOS-7 // PORTAIL DIMENSIONNEL</p>
                <h1 className="text-2xl font-black tracking-widest text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">
                    ACTIVATION DE PORTAIL
                </h1>

                {/* Barre d'énergie */}
                <div className="mt-3 w-64 h-2 bg-cyan-900/50 rounded-full border border-cyan-800 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #0ff, #a0f)' }}
                        animate={{ width: `${energy}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
                <p className="text-cyan-700 text-[9px] tracking-widest font-mono mt-1">
                    ÉNERGIE DU PORTAIL : {Math.round(energy)}% — ROUND {round}/{MAX_ROUNDS}
                </p>
            </div>

            {/* ── MESSAGE CENTRAL ────────────────────────────────────────────── */}
            <div className="z-10 h-12 flex items-center justify-center px-4">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={message}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-sm font-mono tracking-widest"
                        style={{
                            color: phase === 'LOSE' ? '#ff4444'
                                : phase === 'WIN' ? '#00ffaa'
                                    : phase === 'SHOW' ? '#ffff44'
                                        : '#88ccff',
                        }}
                    >
                        {message}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* ── PORTAIL — 2×2 Glyphs ───────────────────────────────────────── */}
            <motion.div
                className="z-10 grid grid-cols-2 gap-5"
                animate={shakePortal
                    ? { x: [0, -12, 12, -8, 8, 0], transition: { duration: 0.4 } }
                    : {}}
            >
                {GLYPHS.map(g => (
                    <GlyphButton
                        key={g.id}
                        glyph={g}
                        isActive={activeGlyph === g.id}
                        isDisabled={phase !== 'INPUT'}
                        onPress={() => handleGlyphPress(g.id)}
                    />
                ))}
            </motion.div>

            {/* ── INDICATEUR INPUT (petits points) ────────────────────────────── */}
            <div className="z-10 flex gap-2 h-8 items-center">
                {sequence.map((_, i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full transition-all duration-200"
                        style={{
                            background: i < userInput.length
                                ? GLYPHS[sequence[i]].colorOn
                                : 'rgba(255,255,255,0.15)',
                            boxShadow: i < userInput.length
                                ? `0 0 6px ${GLYPHS[sequence[i]].colorOn}`
                                : 'none',
                        }}
                    />
                ))}
            </div>

            {/* ── FOOTER ACTIONS ───────────────────────────────────────────────── */}
            <div className="z-10 w-full flex justify-between items-end pb-8 px-8">
                <button
                    onClick={onExit}
                    className="text-xs text-red-700 border border-red-900/50 px-4 py-2 rounded font-mono hover:bg-red-900/20 hover:text-red-500 transition-colors"
                >
                    ABORT
                </button>

                <div className="text-right text-[10px] text-cyan-800 font-mono">
                    <div>GLYPHS : {GLYPHS.map(g => g.name).join(' · ')}</div>
                    <div>ERREURS : {mistakes} / 3</div>
                </div>
            </div>

            {/* ── INTRO OVERLAY ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {phase === 'INTRO' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-8"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center max-w-sm"
                        >
                            <div className="text-5xl mb-4">◈◉⬡✦</div>
                            <h2 className="text-2xl font-black text-cyan-300 tracking-widest mb-2">PORTAIL ALIEN</h2>
                            <p className="text-cyan-600 text-sm font-mono mb-6 leading-relaxed">
                                Pour activer le portail dimensionnel, vous devez reproduire la séquence de glyphes aliens exactement dans le bon ordre.
                                <br /><br />
                                <span className="text-yellow-500">La séquence s'allonge à chaque round.</span>
                                <br />
                                3 erreurs = portail fermé.
                            </p>
                            <div className="flex gap-2 justify-center text-xs text-cyan-800 font-mono mb-6">
                                {GLYPHS.map(g => (
                                    <div key={g.id} className="flex flex-col items-center">
                                        <span style={{ color: g.colorOn }} className="text-2xl">{g.label}</span>
                                        <span>{g.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleStart}
                                className="px-10 py-4 bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold tracking-widest text-sm rounded hover:bg-cyan-500/40 transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                            >
                                ACTIVER LE PORTAIL
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── WIN OVERLAY ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {phase === 'WIN' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                        style={{ background: 'radial-gradient(circle, rgba(0,255,150,0.15) 0%, #000 70%)' }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-center"
                        >
                            <div className="text-7xl mb-4">◈◉⬡✦</div>
                            <h2 className="text-4xl font-black text-emerald-400 tracking-widest drop-shadow-[0_0_30px_rgba(0,255,150,0.8)]">
                                PORTAIL ACTIVÉ
                            </h2>
                            <p className="text-emerald-600 font-mono text-sm mt-2">ACCÈS DIMENSIONNEL ACCORDÉ</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── LOSE OVERLAY ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {phase === 'LOSE' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
                    >
                        <motion.div
                            animate={{ x: [0, -5, 5, -3, 3, 0] }}
                            transition={{ duration: 0.5 }}
                            className="text-center px-8"
                        >
                            <div className="text-6xl mb-4 opacity-50 grayscale">◈◉⬡✦</div>
                            <h2 className="text-3xl font-black text-red-500 tracking-widest mb-2 drop-shadow-[0_0_20px_red]">
                                PORTAIL REJETÉ
                            </h2>
                            <p className="text-red-700 font-mono text-sm mb-8">
                                SÉQUENCE INCORRECTE — SYSTÈME VERROUILLÉ
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleRetry}
                                    className="px-8 py-3 border border-cyan-700 text-cyan-500 font-bold font-mono text-sm hover:bg-cyan-900/30 transition-all"
                                >
                                    RÉESSAYER
                                </button>
                                <button
                                    onClick={onExit}
                                    className="px-8 py-3 border border-red-900 text-red-700 font-mono text-sm hover:bg-red-900/20 transition-all"
                                >
                                    ABANDONNER
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
