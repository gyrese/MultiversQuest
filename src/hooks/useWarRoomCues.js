
import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

/**
 * Hook qui écoute les commandes WarRoom (Socket + BroadcastChannel)
 * et déclenche les effets visuels sur la Scène 3D via une Ref.
 */
export function useWarRoomCues(sceneRef) {
    const { socket } = useGame();

    useEffect(() => {
        // -------------------------------------------------------------
        // 1. Gestionnaire unique des commandes
        // -------------------------------------------------------------
        const handleCommand = (command) => {
            if (!command || !command.type) return;

            console.log('⚡ WarRoom Command:', command.type, command.payload);

            // Transmettre à la scène 3D si disponible
            if (sceneRef.current && sceneRef.current.triggerCue) {
                sceneRef.current.triggerCue(command.type, command.payload);
            }
        };

        // -------------------------------------------------------------
        // 2. Écoute du BroadcastChannel (Commandes locales / Admin)
        // -------------------------------------------------------------
        const channel = new BroadcastChannel('warroom_controls');
        channel.onmessage = (event) => {
            handleCommand(event.data);
        };

        // -------------------------------------------------------------
        // 3. Écoute du Socket.IO (Commandes serveurs / Distantes)
        // -------------------------------------------------------------
        let socketOff = null;
        if (socket) {
            const onSocketCommand = (cmd) => handleCommand(cmd);
            socket.on('warroom:command', onSocketCommand);
            socketOff = () => socket.off('warroom:command', onSocketCommand);
        }

        // Cleanup
        return () => {
            channel.close();
            if (socketOff) socketOff();
        };
    }, [socket, sceneRef]);
}
