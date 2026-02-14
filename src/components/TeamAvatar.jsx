import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Global Caches
const avatarUrlCache = new Map(); // Stores final URLs
const activeGenerations = new Map(); // Stores running Promises

// DiceBear : avatar instantané et fiable basé sur le nom
const getDiceBearUrl = (name) => {
    const encoded = encodeURIComponent(name || 'team');
    return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encoded}&backgroundColor=0a0a0f,1a1a2e,16213e&backgroundType=gradientLinear`;
};

// Génération IA via notre proxy serveur (comme generate.php)
const tryAIGeneration = async (name) => {
    try {
        const prompt = name;

        // Appel vers notre propre serveur (pas de CORS, pas de rate-limit externe)
        const response = await fetch('/api/generate-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) return null;

        const blob = await response.blob();
        // Vérifier que c'est une vraie image (>5KB)
        if (blob.size > 5000) {
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e) {
        console.warn("AI avatar generation failed:", e);
        return null;
    }
};

// Manager pour la génération
const getAvatarForTeam = (name) => {
    if (!name) return Promise.resolve(null);
    if (avatarUrlCache.has(name)) return Promise.resolve(avatarUrlCache.get(name));
    if (activeGenerations.has(name)) return activeGenerations.get(name);

    // On met immédiatement le DiceBear en cache (instantané)
    const diceBearUrl = getDiceBearUrl(name);
    avatarUrlCache.set(name, diceBearUrl);

    // Puis on lance la génération IA en arrière-plan via notre serveur
    const promise = tryAIGeneration(name)
        .then(aiUrl => {
            activeGenerations.delete(name);
            if (aiUrl) {
                avatarUrlCache.set(name, aiUrl);
                return aiUrl;
            }
            return diceBearUrl;
        })
        .catch(() => {
            activeGenerations.delete(name);
            return diceBearUrl;
        });

    activeGenerations.set(name, promise);
    return promise;
};

export default function TeamAvatar({ name, className = "", size = 128 }) {
    const [imageSrc, setImageSrc] = useState(
        avatarUrlCache.get(name) || getDiceBearUrl(name)
    );
    const [isAI, setIsAI] = useState(false);
    const mountedRef = useRef(true);
    const debounceRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;

        if (!name) return;

        // Afficher immédiatement le DiceBear (pas de loading !)
        const currentCached = avatarUrlCache.get(name);
        if (currentCached) {
            setImageSrc(currentCached);
            setIsAI(currentCached.startsWith('blob:'));
        } else {
            setImageSrc(getDiceBearUrl(name));
        }

        // Debounce la tentative IA en arrière-plan
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            getAvatarForTeam(name).then(url => {
                if (mountedRef.current && url) {
                    setImageSrc(url);
                    setIsAI(url.startsWith('blob:'));
                }
            });
        }, 1500);

        return () => {
            mountedRef.current = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [name]);

    return (
        <div className={`relative ${className}`} style={{ overflow: 'hidden' }}>
            <motion.img
                key={imageSrc}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={imageSrc}
                alt={name}
                className="w-full h-full"
                style={{ objectFit: 'cover' }}
            />
            {/* Indicateur discret de génération IA en cours */}
            {activeGenerations.has(name) && !isAI && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-mono py-0.5"
                    style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
                >
                    <span className="text-cyan-400">⚡ IA...</span>
                </motion.div>
            )}
        </div>
    );
}
