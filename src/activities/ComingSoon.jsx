import React from 'react';
import { motion } from 'framer-motion';

export default function ComingSoon({ universeId, onExit }) {
    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-white font-sans">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-[#161620] border border-cyan-500/30 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(0,212,255,0.1)]"
            >
                <div className="text-5xl mb-6">🚧</div>
                <h2 className="text-2xl font-bold mb-2 font-Orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    Développement en cours
                </h2>
                <p className="text-gray-400 mb-8">
                    Cette activité est en cours de construction par nos ingénieurs du Multivers. Revenez plus tard !
                </p>

                <motion.button
                    onClick={onExit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-cyan-900/40 border border-cyan-500/50 rounded-full text-cyan-300 font-bold hover:bg-cyan-900/60 transition-colors"
                >
                    Retour au Nexus
                </motion.button>
            </motion.div>
        </div>
    );
}
