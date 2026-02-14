import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UNIVERSES } from '../data/universes';

// ------------------------------------------------------------------
// DATA: QUESTIONS PAR UNIVERS (Exemple avec 5 questions pour démarrer)
// ------------------------------------------------------------------
const QUIZ_DATA = {
    odyssee_spatiale: [
        { q: "Quel est le nom du vaisseau dans Alien (1979) ?", a: ["Nostromo", "Sulaco", "Prometheus", "Covenant"], correct: 0 },
        { q: "Dans Star Wars, qui est le père de Luke ?", a: ["Obi-Wan", "Palpatine", "Vador", "Yoda"], correct: 2 },
        { q: "Quelle est la durée d'une heure sur la planète Miller dans Interstellar ?", a: ["1 an", "7 ans", "10 ans", "1 jour"], correct: 1 },
        { q: "Quel est le nom du robot dans Seul sur Mars ?", a: ["TARS", "CASE", "Pathfinder", "Sojourner"], correct: 2 }, // Pathfinder est la sonde
        { q: "Qui a réalisé 2001: L'Odyssée de l'espace ?", a: ["Spielberg", "Lucas", "Kubrick", "Scott"], correct: 2 },
    ],
    royaumes_legendaires: [
        { q: "Combien d'anneaux de pouvoir ont été donnés aux Nains ?", a: ["3", "7", "9", "1"], correct: 1 },
        { q: "Quel est le sort de déverrouillage dans Harry Potter ?", a: ["Alohomora", "Lumos", "Expelliarmus", "Accio"], correct: 0 },
        { q: "Comment s'appelle l'épée de Frodon ?", a: ["Anduril", "Glamdring", "Dard", "Orcrist"], correct: 2 },
        { q: "Quelle maison n'existe pas à Poudlard ?", a: ["Griffondor", "Poufsouffle", "Serdaigle", "DragonRouge"], correct: 3 },
        { q: "Dans Game of Thrones, qui est la Mère des Dragons ?", a: ["Cersei", "Sansa", "Daenerys", "Arya"], correct: 2 },
    ],
    // Fallback pour les autres univers (à compléter)
    default: [
        { q: "Question bonus : Quelle est la réponse à la vie ?", a: ["42", "24", "12", "0"], correct: 0 },
        { q: "Question bonus : Qui a créé ce jeu ?", a: ["Une IA", "Un Humain", "Un Chat", "Un Alien"], correct: 0 },
    ]
};

export default function GenericQuiz({ universeId, onComplete, onExit }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswerValidated, setIsAnswerValidated] = useState(false);

    // Charger les questions de l'univers ou utiliser celles par défaut
    const questions = QUIZ_DATA[universeId] || QUIZ_DATA.default;
    const activeQuestion = questions[currentQuestion];

    const handleAnswer = (index) => {
        if (isAnswerValidated) return;

        setSelectedAnswer(index);
        setIsAnswerValidated(true);

        if (index === activeQuestion.correct) {
            setScore(prev => prev + 1);
        } // Pas de pénalité pour l'instant

        // Passer à la suivante après délai
        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedAnswer(null);
                setIsAnswerValidated(false);
            } else {
                setShowResult(true);
            }
        }, 1500);
    };

    const handleFinish = () => {
        // Calcul du score final (max 400 pts comme défini dans universes.js)
        const totalPoints = Math.round((score / questions.length) * 400);
        onComplete(totalPoints);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col font-sans text-white">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-[#12121a]">
                <button onClick={onExit} className="text-gray-400 hover:text-white">✕ Quitter</button>
                <div className="font-bold text-cyan-400">
                    Question {currentQuestion + 1}/{questions.length}
                </div>
                <div className="text-sm font-mono">{score} pts</div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
                {!showResult ? (
                    <div className="w-full space-y-8">
                        {/* Question Card */}
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[#1e1e2d] p-6 rounded-2xl border border-cyan-500/20 shadow-lg text-center"
                        >
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                                {activeQuestion.q}
                            </h2>
                        </motion.div>

                        {/* Answers Grid */}
                        <div className="grid grid-cols-1 gap-3">
                            {activeQuestion.a.map((answer, index) => {
                                let bgClass = "bg-[#252535] border-white/10 hover:bg-[#303040]";
                                if (isAnswerValidated) {
                                    if (index === activeQuestion.correct) bgClass = "bg-green-600 border-green-400";
                                    else if (index === selectedAnswer) bgClass = "bg-red-600 border-red-400";
                                    else bgClass = "bg-[#252535] opacity-50";
                                }

                                return (
                                    <motion.button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={isAnswerValidated}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${bgClass}`}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="opacity-50 mr-2">{String.fromCharCode(65 + index)}.</span>
                                        {answer}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Result Screen */
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="text-6xl">🏆</div>
                        <h2 className="text-3xl font-bold text-white">Quiz Terminé !</h2>
                        <div className="text-xl text-gray-300">
                            Votre score : <span className="text-cyan-400 font-bold">{score}/{questions.length}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            {(score / questions.length) > 0.5 ? "Bien joué, aventurier !" : "Révisez vos classiques !"}
                        </p>
                        <motion.button
                            onClick={handleFinish}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-white shadow-lg shadow-cyan-500/30"
                        >
                            Valider la mission
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* Progress Bar */}
            {!showResult && (
                <div className="h-2 bg-gray-800 w-full">
                    <motion.div
                        className="h-full bg-cyan-500"
                        animate={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
