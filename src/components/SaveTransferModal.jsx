import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from "react-qr-code";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { useGame as usePlayerGame } from '../context/PlayerContext';

export default function SaveTransferModal({ isOpen, onClose, mode = 'import', onImportSuccess }) {
    const { state, actions } = usePlayerGame();
    const [scanError, setScanError] = useState(null);
    const scannerRef = useRef(null);

    // Données à exporter (JSON minifié pour QR)
    let exportData = '';
    try {
        if (mode === 'export' && state) {
            exportData = JSON.stringify({
                teamName: state.teamName,
                avatarStyle: state.avatarStyle,
                points: state.points || 0,
                fragments: state.fragments || 0,
                // On simplifie les univers pour gagner de la place (juste status et activities status)
                universes: state.universes ? Object.keys(state.universes).reduce((acc, key) => {
                    acc[key] = {
                        status: state.universes[key].status,
                        activities: state.universes[key].activities // Attention si trop gros
                    };
                    return acc;
                }, {}) : {},
                inventory: state.inventory || [],
                timestamp: Date.now()
            });
        }
    } catch (e) {
        console.error("Erreur génération QR:", e);
        exportData = 'ERROR';
    }

    useEffect(() => {
        if (isOpen && mode === 'import') {
            // Démarrer le scanner après l'animation d'ouverture
            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
                );

                scanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = scanner;
            }, 500);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    try { scannerRef.current.clear(); } catch (e) { }
                }
            };
        }
    }, [isOpen, mode]);

    const onScanSuccess = (decodedText) => {
        try {
            // Arrêter le scanner
            if (scannerRef.current) scannerRef.current.clear();

            // Importer
            const result = actions.importSave(decodedText);
            if (result.success) {
                if (onImportSuccess) onImportSuccess(JSON.parse(decodedText));
                onClose();
            } else {
                setScanError("QR Code invalide : " + result.error);
            }
        } catch (e) {
            setScanError("Erreur de lecture : " + e.message);
        }
    };

    const onScanFailure = (error) => {
        // Ignorer les erreurs frame par frame
        // console.warn(error);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[#1a1a2e] border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,255,255,0.2)] max-h-[85vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>

                    <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 font-orbitron">
                        {mode === 'export' ? 'SAUVEGARDE DU PROFIL' : 'CHARGER UN PROFIL'}
                    </h2>

                    {mode === 'export' ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-white p-4 rounded-xl" style={{ height: "auto", margin: "0 auto", maxWidth: 256, width: "100%" }}>
                                {exportData && exportData !== 'ERROR' ? (
                                    exportData.length < 2000 ? (
                                        <QRCode
                                            size={256}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            value={exportData}
                                            viewBox={`0 0 256 256`}
                                        />
                                    ) : (
                                        <div className="text-gray-800 text-center p-4">
                                            <p className="font-bold mb-2">Sauvegarde trop volumineuse pour un QR</p>
                                            <p className="text-sm">Votre progression est sauvegardée sur le <span className="text-blue-600 font-bold">Cloud</span>.</p>
                                            <p className="text-xs mt-2 text-gray-500">Connectez-vous simplement sur l'autre appareil.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-red-500 font-bold p-4 text-center">ERREUR GÉNÉRATION QR</div>
                                )}
                            </div>
                            <p className="text-center text-sm text-cyan-200/70 font-mono">
                                Scannez ce QR Code avec votre nouvel appareil pour transférer votre progression.
                            </p>
                            <div className="text-xs text-gray-500 mt-2">
                                Contient : Score, Inventaire, Univers débloqués
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div id="reader" className="w-full h-64 bg-black rounded-xl overflow-hidden border-2 border-cyan-500/30"></div>

                            {scanError && (
                                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded w-full text-center border border-red-500/30">
                                    ⚠️ {scanError}
                                </div>
                            )}

                            <p className="text-center text-sm text-cyan-200/70 font-mono">
                                Placez le QR Code de l'ancien appareil devant la caméra.
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
