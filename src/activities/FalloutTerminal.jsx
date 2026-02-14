import { useState, useEffect, useRef } from 'react';
import { useActivityScore } from '../hooks/useActivityScore';
import ActivityShell from '../components/activity/ActivityShell';

// Configuration
const WORD_LENGTH = 5;
const ATTEMPTS = 4;
const ROW_COUNT = 17;
const COL_WIDTH = 12;

// Dictionnaire Français (Thème SF/Fallout - 5 lettres)
const DICTIONARY = [
    'ROBOT', 'LASER', 'BOMBE', 'RADIO', 'ACIER', 'METAL', 'VIRUS',
    'ALPHA', 'OMEGA', 'DELTA', 'FORCE', 'ELITE', 'TITAN', 'ARMES',
    'BALLE', 'CHAOS', 'CRANE', 'FUSIL', 'PIEGE', 'PLOMB', 'PORTE',
    'RADAR', 'RAYON', 'ROUTE', 'SANTE', 'SERUM', 'SONDE', 'TENUE',
    'TITRE', 'TOTAL', 'TRACE', 'TUEUR', 'UNITE', 'USINE', 'ZONE!',
    'VIVRE', 'MORT!', 'TESTS', 'SCAN!', 'CODES', 'PUCE!', 'BASE!',
    'DATA!', 'HACK!', 'LINK!', 'NET!!', 'BIOS!', 'RAM!!', 'CPU!!'
].filter(w => w.length === WORD_LENGTH);

const GARBAGE = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '{', '}', '[', ']', '<', '>', '/', '?', '.', ',', ';', ':'];

export default function FalloutTerminal({ universeId = 'post_apo', onComplete, onExit }) {
    const [gameState, setGameState] = useState({
        leftCol: [],
        rightCol: [],
        password: '',
        attempts: ATTEMPTS,
        history: [],
        locked: false,
        words: []
    });

    const [hoveredWord, setHoveredWord] = useState(null);
    const [lastResult, setLastResult] = useState(null); // Feedback prominent

    const { isPlaying, isCompleted, score, bonus, startActivity, finalizeActivity } = useActivityScore(
        universeId,
        'fallout_hack',
        { maxPoints: 350, activityType: 'logic', onComplete }
    );

    useEffect(() => {
        if (isPlaying && !gameState.locked && gameState.leftCol.length === 0) {
            initGame();
        } else if (!isPlaying && !isCompleted) {
            startActivity();
        }
    }, [isPlaying]);

    const initGame = () => {
        const pool = [...DICTIONARY].sort(() => 0.5 - Math.random());
        const wordCount = 10 + Math.floor(Math.random() * 5);
        const gameWords = pool.slice(0, wordCount);
        const password = gameWords[Math.floor(Math.random() * gameWords.length)];

        // Generate Character Buffer
        const totalChars = ROW_COUNT * COL_WIDTH * 2;
        let buffer = new Array(totalChars).fill(null);

        for (let i = 0; i < totalChars; i++) {
            buffer[i] = { type: 'char', value: GARBAGE[Math.floor(Math.random() * GARBAGE.length)], id: `char-${i}` };
        }

        const insertedWords = [];
        gameWords.forEach(word => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 50) {
                const idx = Math.floor(Math.random() * (totalChars - WORD_LENGTH));
                let collide = false;
                for (let k = 0; k < WORD_LENGTH; k++) if (buffer[idx + k].type === 'word') collide = true;

                const charInRow = idx % COL_WIDTH;
                if (charInRow + WORD_LENGTH > COL_WIDTH) collide = true;

                if (!collide) {
                    for (let k = 0; k < WORD_LENGTH; k++) {
                        buffer[idx + k] = { type: 'word', value: word[k], wordRef: word, index: k, id: `word-${word}-${idx}` };
                    }
                    insertedWords.push(word);
                    placed = true;
                }
                attempts++;
            }
        });

        const leftBuffer = buffer.slice(0, ROW_COUNT * COL_WIDTH);
        const rightBuffer = buffer.slice(ROW_COUNT * COL_WIDTH);
        const startHex = Math.floor(Math.random() * 60000);

        const leftCol = [];
        for (let i = 0; i < ROW_COUNT; i++) {
            const hex = '0x' + (startHex + (i * COL_WIDTH)).toString(16).toUpperCase().padStart(4, '0');
            leftCol.push({ hex, content: leftBuffer.slice(i * COL_WIDTH, (i + 1) * COL_WIDTH) });
        }

        const rightCol = [];
        for (let i = 0; i < ROW_COUNT; i++) {
            const hex = '0x' + (startHex + (ROW_COUNT * COL_WIDTH) + (i * COL_WIDTH)).toString(16).toUpperCase().padStart(4, '0');
            rightCol.push({ hex, content: rightBuffer.slice(i * COL_WIDTH, (i + 1) * COL_WIDTH) });
        }

        setGameState({
            leftCol,
            rightCol,
            password,
            attempts: ATTEMPTS,
            locked: false,
            words: insertedWords,
            history: [
                '> ROBCO INDUSTRIES (TM) TERMLINK',
                '> INITIALISATION DU PROTOCOLE...',
                '> ENTREZ LE MOT DE PASSE',
            ]
        });
    };

    const handleItemEnter = (item) => {
        if (item.type === 'word') {
            setHoveredWord(item.wordRef);
        } else {
            setHoveredWord(null);
        }
    };

    const handleWordClick = (word) => {
        if (gameState.locked || isCompleted) return;

        const likeness = calculateLikeness(word, gameState.password);
        const newHistory = [...gameState.history, `> ${word}`];

        if (word === gameState.password) {
            newHistory.push('> MOT DE PASSE CORRECT.');
            newHistory.push('> ACCÈS SYSTÈME AUTORISÉ.');
            setGameState(prev => ({ ...prev, history: newHistory, locked: true }));
            finalizeActivity(true, 50 * gameState.attempts);
        } else {
            newHistory.push(`> ACCÈS REFUSÉ.`);
            newHistory.push(`> ${likeness}/${WORD_LENGTH} LETTRES BIEN PLACÉES.`);
            setLastResult({ word, likeness }); // Store score for UI
            const newAttempts = gameState.attempts - 1;

            if (newAttempts <= 0) {
                newHistory.push('> TERMINAL VERROUILLÉ.');
                newHistory.push(`> MOT DE PASSE REQUIS : ${gameState.password}`);
                newHistory.push('> CONTACTEZ L\'ADMINISTRATEUR.');
                setGameState(prev => ({ ...prev, attempts: 0, history: newHistory, locked: true }));
                setTimeout(() => initGame(), 3000);
            } else {
                setGameState(prev => ({ ...prev, attempts: newAttempts, history: newHistory }));
            }
        }
    };

    const calculateLikeness = (guess, target) => {
        let count = 0;
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] === target[i]) count++;
        }
        return count;
    };

    const historyRef = useRef(null);
    useEffect(() => {
        if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }, [gameState.history]);

    const [showIntro, setShowIntro] = useState(true);

    const startHack = () => {
        setShowIntro(false);
    };

    return (
        <ActivityShell
            title="Fuite de l'abri 111"
            subtitle="Terminal de Sécurité"
            universeColor="#10b981"
            onExit={onExit}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            background={
                <div className="absolute inset-0 bg-[#051105] font-mono overflow-hidden">
                    {/* Pip-Boy Background */}
                    <div
                        className="absolute inset-0 z-0 opacity-30"
                        style={{
                            backgroundImage: "url('/images/games/fallout/pipboy.png')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'sepia(1) hue-rotate(50deg) saturate(3) contrast(1.2)'
                        }}
                    />

                    {/* Scanlines */}
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-20"
                        style={{
                            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                            backgroundSize: '100% 2px, 3px 100%'
                        }}
                    />

                    {/* Vignette */}
                    <div className="absolute inset-0 z-20 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0) 60%, rgba(0, 10, 0, 0.8) 100%)' }} />
                </div>
            }
        >
            <div className="relative z-30 w-full h-full max-w-5xl mx-auto p-2 md:p-6 flex flex-col font-mono text-[#33ff33] text-shadow-glow select-none">

                {showIntro ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="border-4 border-[#33ff33] p-1 mb-8 shadow-[0_0_20px_rgba(51,255,51,0.5)] bg-black/80 backdrop-blur-sm max-w-2xl w-full">
                            <div className="border border-[#33ff33]/50 p-6 md:p-10 flex flex-col gap-6">
                                <h1 className="text-2xl md:text-3xl font-black tracking-widest animate-pulse border-b border-[#33ff33] pb-4 mb-2">
                                    ⚠️ ALERTE CONFINEMENT ⚠️
                                </h1>

                                <div className="text-left space-y-4 text-sm md:text-lg font-bold leading-relaxed px-4">
                                    <p className="typing-effect">{">"} DÉTECTION: INTRUSION NON AUTORISÉE.</p>
                                    <p className="typing-effect delay-100">{">"} STATUT: PORTES VERROUILLÉES.</p>
                                    <p className="typing-effect delay-200">{">"} OBJECTIF: PIRATER LE TERMINAL DU SUPERVISEUR POUR OUVRIR L'ABRI.</p>
                                    <p className="text-[#33ff33] mt-4 p-2 border border-dashed border-[#33ff33]/50 bg-[#33ff33]/10">
                                        {">"} INDICE: TROUVEZ LE MOT DE PASSE PARMI LES DONNÉES CORROMPUES.
                                    </p>
                                </div>

                                <button
                                    onClick={startHack}
                                    className="mt-8 px-8 py-4 bg-[#33ff33] text-black font-black text-xl hover:bg-[#22aa22] hover:scale-105 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(51,255,51,0.8)]"
                                >
                                    [ INITIALISER LE HACK ]
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="mb-4 shrink-0">
                            <h1 className="text-lg md:text-xl font-bold tracking-widest mb-1">ROBCO INDUSTRIES (TM) TERMLINK</h1>
                            <div className="flex justify-between items-end border-b-2 border-[#33ff33] pb-1 text-xs md:text-sm">
                                <div className="opacity-90 leading-tight">
                                    <div>COPYRIGHT 2075-2077 ROBCO IND.</div>
                                    <div className="text-[10px] text-[#33ff33]/50">DEBUG: {gameState.password}</div>
                                </div>
                                <div className="text-right font-bold animate-pulse">
                                    {isCompleted ? 'ACCÈS AUTORISÉ' : gameState.locked ? '!!! VERROUILLAGE !!!' : 'CONNEXION REQUISE'}
                                </div>
                            </div>
                        </div>

                        {isCompleted ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="text-6xl mb-6 animate-bounce">🔓</div>
                                <h2 className="text-4xl font-bold mb-4 tracking-widest">ACCÈS AUTORISÉ</h2>
                                <div className="text-xl mb-8">Privilèges Administrateur Restaurés</div>
                                <button onClick={onExit} className="px-8 py-3 border-2 border-[#33ff33] hover:bg-[#33ff33] hover:text-black font-bold tracking-wider transition-colors cursor-pointer">
                                    [ DÉCONNEXION ]
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 min-h-0">

                                {/* Terminal Grid */}
                                <div className="flex-1 overflow-hidden lg:mr-4">
                                    <div className="flex gap-4 md:gap-8 h-full text-xs md:text-sm lg:text-base leading-relaxed tracking-wider font-bold">
                                        {['leftCol', 'rightCol'].map(colKey => (
                                            <div key={colKey} className="flex flex-col">
                                                {gameState[colKey].map((row, rIdx) => (
                                                    <div key={rIdx} className="flex hover:bg-[#33ff33]/10">
                                                        <span className="mr-3 opacity-80 select-none">{row.hex}</span>
                                                        <div className="flex">
                                                            {row.content.map((item, cIdx) => (
                                                                <span
                                                                    key={cIdx}
                                                                    className={`
                                                                w-[1ch] text-center transition-colors cursor-default
                                                                ${item.type === 'word' ? 'cursor-pointer' : ''}
                                                                ${hoveredWord === item.wordRef && item.type === 'word' ? 'bg-[#33ff33] text-black' : ''}
                                                            `}
                                                                    onMouseEnter={() => handleItemEnter(item)}
                                                                    onMouseLeave={() => setHoveredWord(null)}
                                                                    onClick={() => item.type === 'word' && handleWordClick(item.wordRef)}
                                                                >
                                                                    {item.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Panel: Feedback & Rules */}
                                <div className="w-full lg:w-1/3 flex flex-col border-t-2 lg:border-t-0 lg:border-l-2 border-[#33ff33] pt-4 lg:pt-0 lg:pl-6 shrink-0 lg:h-full h-48">

                                    {/* Attempts */}
                                    <div className="mb-4">
                                        <div className="mb-2 text-sm">TENTATIVES RESTANTES :</div>
                                        <div className="flex gap-2">
                                            {[...Array(gameState.attempts)].map((_, i) => (
                                                <div key={i} className="w-4 h-4 bg-[#33ff33]" />
                                            ))}
                                            {[...Array(ATTEMPTS - gameState.attempts)].map((_, i) => (
                                                <div key={i} className="w-4 h-4 border border-[#33ff33]" />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hover Preview */}
                                    <div className="h-8 flex items-end font-bold text-lg mb-4 text-[#33ff33]">
                                        {hoveredWord ? `> ${hoveredWord}` : '> ...'}
                                    </div>

                                    {/* Prominent Feedback (Mobile-First) */}
                                    {lastResult && !gameState.locked && (
                                        <div className="bg-[#33ff33]/20 border border-[#33ff33] p-2 mb-2 text-center animate-pulse lg:hidden">
                                            <div className="text-[10px] md:text-xs">ANALYSE DE "{lastResult.word}"</div>
                                            <div className="text-xl font-bold">{lastResult.likeness}/{WORD_LENGTH} CORRECTES</div>
                                            <div className="text-[10px]">(BIEN PLACÉES)</div>
                                        </div>
                                    )}

                                    {/* Logs */}
                                    <div
                                        className="flex-1 overflow-y-auto font-mono text-sm space-y-1 pr-2 custom-scrollbar border-b border-[#33ff33]/30 pb-2 mb-2"
                                        ref={historyRef}
                                    >
                                        {gameState.history.map((line, i) => (
                                            <div key={i} className="break-words leading-tight">
                                                {line}
                                            </div>
                                        ))}
                                        {gameState.locked && (
                                            <div className="mt-4 text-center animate-pulse bg-[#33ff33] text-black p-1 font-bold">
                                                VERROUILLAGE EN COURS
                                            </div>
                                        )}
                                    </div>

                                    {/* Help / Rules - New Section (Hidden on small mobile) */}
                                    <div className="text-xs opacity-80 mt-auto pt-2 hidden md:block">
                                        <div className="font-bold underline mb-1">AIDE PROTOCOLE:</div>
                                        <p className="mb-1">{'>'} TROUVEZ LE MOT DE PASSE.</p>
                                        <p className="mb-1">{'>'} CORRESPONDANCE = NOMBRE DE LETTRES CORRECTES À LA BONNE PLACE.</p>
                                        <p>{'>'} EX: SI MOT=ROBOT ET CIBLE=RADAR, CORR=2 (R, O).</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style jsx global>{`
                .text-shadow-glow {
                    text-shadow: 0 0 2px rgba(51, 255, 51, 0.7), 0 0 5px rgba(51, 255, 51, 0.5);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #051105; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #33ff33; 
                    border: 1px solid #051105;
                }
            `}</style>
        </ActivityShell >
    );
}
