import { useState } from 'react';
import { useGame } from '../../context/PlayerContext';
import { UNIVERSES } from '../../data/universes';

export default function DebugPanel({ onLaunch }) {
    const { actions } = useGame();
    const [isOpen, setIsOpen] = useState(false);

    const handleWin = (universeId, activityId, maxPoints) => {
        if (actions && actions.completeActivity) {
            // Envoyer "victoire" au serveur
            actions.completeActivity(universeId, activityId, maxPoints || 100);
            alert(`✅ Victoire simulée pour ${activityId} (+${maxPoints || 100} pts)`);
        } else {
            console.error('Action completeActivity introuvable');
        }
    };

    const handleLaunch = (universeId, activityId) => {
        if (onLaunch) {
            onLaunch(universeId, activityId);
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 bg-red-600/80 text-white p-3 rounded-full shadow-lg border-2 border-white/20 hover:bg-red-500 transition-colors font-mono text-xs"
                title="Debug Mode"
            >
                🛠️ DEV
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-4 overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-black/80 p-2 border-b border-gray-700">
                <h2 className="text-red-500 font-bold text-lg">🔧 DEBUG CONSOLE</h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-red-400 p-2 text-xl"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-8 pb-20">
                {Object.values(UNIVERSES).map(universe => (
                    <div key={universe.id} className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                            <span className="text-2xl">{universe.icon}</span>
                            <span style={{ color: universe.colors?.primary || '#fff' }}>{universe.name}</span>
                        </h3>

                        <div className="grid gap-3">
                            {Object.values(universe.activities || {}).map(activity => (
                                <div key={activity.id} className="flex flex-col gap-2 bg-black/40 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 font-bold">{activity.name}</span>
                                        <span className="text-gray-500 text-[10px]">{activity.id}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <button
                                            onClick={() => handleLaunch(universe.id, activity.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded text-center transition-colors shadow-lg active:scale-95"
                                        >
                                            ▶️ LANCER
                                        </button>
                                        <button
                                            onClick={() => handleWin(universe.id, activity.id, activity.maxPoints)}
                                            className="bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded text-center transition-colors shadow-lg active:scale-95"
                                        >
                                            🏆 GAGNER
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
