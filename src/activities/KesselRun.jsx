import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityShell from '../components/activity/ActivityShell';
import { useActivityScore } from '../hooks/useActivityScore';
import { useGame as useGlobalGame } from '../context/GameContext';

// =============================================================================
// 🚀 ENGINE CONFIGURATION
// =============================================================================

const SCROLL_SPEED_BASE = 150;
const SCROLL_ACCEL = 5; // Speed increases over time
const PLAYER_SPEED = 300;
const SPAWN_RATE = 1.2;

// Visuals
const STAR_LAYERS = 3;
const EXHAUST_RATE = 0.05;

// =============================================================================
// 🔊 AUDIO ENGINE
// =============================================================================

function useSoundEngine() {
    const ctxRef = useRef(null);
    const getCtx = useCallback(() => {
        if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        return ctxRef.current;
    }, []);

    const play = useCallback((type) => {
        try {
            const ctx = getCtx();
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const s = {
                laser: { f: 800, type: 'square', vol: 0.1, dur: 0.1, slide: -400 },
                explosion: { f: 100, type: 'sawtooth', vol: 0.2, dur: 0.3, slide: -80 },
                hit: { f: 150, type: 'sawtooth', vol: 0.15, dur: 0.1, slide: -50 },
                collect: { f: 1200, type: 'sine', vol: 0.1, dur: 0.15, slide: 200 },
                win: { f: 600, type: 'sine', vol: 0.2, dur: 0.5, slide: 0 },
            }[type] || { f: 440, type: 'sine', vol: 0.1, dur: 0.1, slide: 0 };

            osc.type = s.type;
            osc.frequency.setValueAtTime(s.f, t);
            if (s.slide) osc.frequency.linearRampToValueAtTime(Math.max(0, s.f + s.slide), t + s.dur);

            gain.gain.setValueAtTime(s.vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + s.dur);

            osc.start(t);
            osc.stop(t + s.dur);
        } catch (e) { }
    }, [getCtx]);

    return play;
}

// =============================================================================
// 🎮 GAME COMPONENT
// =============================================================================

export default function KesselRun({ universeId = 'odyssee_spatiale', onComplete, onExit }) {
    // 🌍 Global State for Leaderboard
    const { sortedTeams, currentTeam } = useGlobalGame();

    const { isPlaying, isCompleted, score, bonus, startActivity, finalizeActivity } = useActivityScore(universeId, 'kessel_run', {
        maxPoints: 1000,
        activityType: 'arcade',
        onComplete
    });

    const [gameState, setGameState] = useState('intro'); // intro, playing, gameover, victory
    const [stats, setStats] = useState({ health: 100, score: 0, distance: 0 });

    const canvasRef = useRef(null);
    const loopRef = useRef(null);
    const assetsRef = useRef({});

    // 📱 RESPONSIVE ENGINE
    const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });

    // Scale factor based on a reference height
    const scaleRef = useRef(1);
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setDimensions({ w, h });

            // Base scale: on mobile portrait (narrow width), we want entities readable but not huge.
            // On desktop, we want them standard.
            // Strategy: Fit to width on portrait, fit to height on landscape?
            // Actually, min(w, h) based logic for size consistency.
            scaleRef.current = Math.min(w / 400, h / 800) * (w < h ? 1.2 : 1.0); // Boost size slightly on portrait

            if (canvasRef.current) {
                canvasRef.current.width = w * dpr;
                canvasRef.current.height = h * dpr;
            }

            if (engine.current) {
                engine.current.w = w;
                engine.current.h = h;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🏗️ GAME STATE ENGINE
    const engine = useRef({
        running: false,
        time: 0,
        scrollSpeed: SCROLL_SPEED_BASE,
        w: window.innerWidth,
        h: window.innerHeight,
        trauma: 0,
        // Game Logic State
        health: 100,
        score: 0,
        distance: 0,
        // Physics State
        player: { x: 50, y: window.innerHeight / 2, vy: 0, w: 60, h: 40, rot: 0 },
        entities: [],
        particles: [],
        stars: [],
        input: { active: false, autoFire: true },
        nextSpawn: 0,
        nextExhaust: 0,
        lastShot: 0
    });

    const playSound = useSoundEngine();

    // 🖼️ ASSET LOADING
    useEffect(() => {
        const load = (src) => {
            const img = new Image();
            img.src = src;
            return img;
        };
        assetsRef.current = {
            falcon: load('/images/Games/Kessel/Falcon.png'),
            tie: load('/images/Games/Kessel/tie.png'),
            asteroid: load('/images/Games/Kessel/asteroid.png'),
            coaxium: load('/images/Games/Kessel/coaxium.png'),
        };
    }, []);

    // 🌀 GAME LOOP
    const startGame = () => {
        const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        if (ctxAudio.state === 'suspended') ctxAudio.resume();

        setGameState('playing');
        startActivity();

        // Reset Engine with current dimensions
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = scaleRef.current;

        engine.current = {
            running: true,
            w, h,
            time: 0,
            scrollSpeed: SCROLL_SPEED_BASE * scale, // Scale speed
            trauma: 0,
            health: 100,
            score: 0,
            distance: 0,
            level: 1,
            parsecs: 0,
            levelTime: 20, // 20 seconds per level
            player: { x: w * 0.15, y: h / 2, vy: 0, w: 60 * scale, h: 40 * scale, rot: 0 }, // Player slightly more forward
            entities: [],
            particles: [],
            stars: Array(50).fill().map(() => ({
                x: Math.random() * w,
                y: Math.random() * h,
                z: Math.random() * 2 + 0.5,
                size: (Math.random() * 2 + 1) * scale
            })),
            input: { active: false, autoFire: true },
            nextSpawn: 0,
            nextExhaust: 0,
            lastShot: 0
        };

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
        loopRef.current = requestAnimationFrame(tick);
    };

    const tick = (now) => {
        const eng = engine.current;
        if (!eng.running) return;

        const dt = 0.016;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // High DPI handling
        ctx.resetTransform();
        ctx.scale(dpr, dpr);

        update(dt, now);
        render(ctx);

        // Sync UI
        setStats({
            health: eng.health,
            score: eng.score,
            distance: eng.distance,
            level: eng.level,
            parsecs: eng.parsecs,
            levelTime: eng.levelTime
        });

        if (eng.health > 0 && eng.level <= 4) {
            loopRef.current = requestAnimationFrame(tick);
        } else {
            endGame(eng.health > 0);
        }
    };

    const render = (ctx) => {
        const eng = engine.current;
        const assets = assetsRef.current;

        // Clear
        ctx.fillStyle = '#050b14';
        ctx.fillRect(0, 0, eng.w, eng.h);

        // Screen Shake
        ctx.save();
        if (eng.trauma > 0) {
            const shake = eng.trauma * eng.trauma * 15;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        }

        // Stars (Hyperspace Effect)
        ctx.fillStyle = eng.inHyperspace ? '#a5f3fc' : 'rgba(255, 255, 255, 0.8)';
        eng.stars.forEach(s => {
            ctx.globalAlpha = Math.min(1, s.z * 0.4);
            if (eng.inHyperspace) {
                // Streak effect
                ctx.fillRect(s.x, s.y, s.size * 20 + eng.scrollSpeed * 0.05, s.size);
            } else {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;

        // Entities
        eng.entities.forEach(e => {
            if (e.type === 'laser') {
                ctx.fillStyle = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'red';
                ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.shadowBlur = 0;
            }
            else if (e.type === 'coaxium') drawAsset(ctx, assets.coaxium, e.x, e.y, e.w, e.h, 0, true);
            else if (e.type === 'tie') drawAsset(ctx, assets.tie, e.x, e.y, e.w, e.h, 0);
            else if (e.type === 'asteroid') drawAsset(ctx, assets.asteroid, e.x, e.y, e.w, e.h, e.rot);
        });

        // Player (Hidden in full hyperspace flash?)
        drawAsset(ctx, assets.falcon, eng.player.x, eng.player.y, eng.player.w, eng.player.h, eng.player.rot);

        // Particles
        eng.particles.forEach(p => {
            ctx.fillStyle = p.color || 'white';
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Hyperspace Flash Overlay
        if (eng.inHyperspace) {
            const progress = (3.0 - eng.hyperspaceTimer) / 3.0; // 0 to 1 (3 seconds duration)
            // Flash white at start and end
            if (progress < 0.1 || progress > 0.9) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
                ctx.fillRect(0, 0, eng.w, eng.h);
            }
            // Speed lines overlay ?
        }

        // Trauma Flash
        if (eng.trauma > 0.5) {
            ctx.fillStyle = `rgba(255, 0, 0, ${eng.trauma * 0.1})`;
            ctx.fillRect(0, 0, eng.w, eng.h);
        }

        ctx.restore();
    };

    // ⚙️ LOGIC UPDATE
    const update = (dt, now) => {
        const eng = engine.current;
        const input = eng.input;
        const scale = scaleRef.current;
        const MAX_LEVELS = 4;
        const LEVEL_DURATION = 20;

        eng.time += dt;

        // HYPERSPACE LOGIC
        if (eng.inHyperspace) {
            eng.hyperspaceTimer -= dt;

            // Accelerate Scroll Speed
            eng.scrollSpeed = lerp(eng.scrollSpeed, 5000 * scale, dt * 2);

            // Update Stars Only (Super fast)
            updateStars(eng, dt);

            // Move Player to Center
            eng.player.y = lerp(eng.player.y, eng.h / 2, dt * 5);
            eng.player.vy = 0;
            eng.player.rot = 0;

            if (eng.hyperspaceTimer <= 0) {
                // EXIT HYPERSPACE -> NEXT LEVEL
                eng.inHyperspace = false;
                eng.level = eng.nextLevelTarget;
                eng.parsecs += 3;
                eng.levelTime = LEVEL_DURATION;
                eng.scrollSpeed = (SCROLL_SPEED_BASE + (eng.level - 1) * 50) * scale;
                eng.entities = []; // clear enemies

                if (eng.level > MAX_LEVELS) {
                    endGame(true);
                }
            }
            return; // Skip normal update
        }

        // NORMAL GAMEPLAY
        eng.distance += eng.scrollSpeed * dt * 0.1;
        eng.levelTime -= dt;

        if (eng.levelTime <= 0) {
            // TRIGGER HYPERSPACE
            eng.inHyperspace = true;
            eng.hyperspaceTimer = 3.0; // 3 seconds sequence
            eng.nextLevelTarget = eng.level + 1;
            playSound('collect'); // Or hyperspace sound
        }

        // Speed ramp
        eng.scrollSpeed += SCROLL_ACCEL * dt * scale;

        // 1. Shake Decay
        eng.trauma = Math.max(0, eng.trauma - dt * 2);

        // 2. Physics
        const GRAVITY = 1000 * scale;
        const THRUST = 2000 * scale;
        const TERMINAL_VELOCITY = 600 * scale;

        eng.player.vy += GRAVITY * dt;

        if (input.active) {
            eng.player.vy -= THRUST * dt;
            if (now > eng.nextExhaust) {
                addParticle(eng, eng.player.x - 20 * scale, eng.player.y + 10, 'rocket_smoke');
                eng.nextExhaust = now + 40;
            }
        }

        eng.player.vy = Math.max(Math.min(eng.player.vy, TERMINAL_VELOCITY), -TERMINAL_VELOCITY);
        eng.player.y += eng.player.vy * dt;
        eng.player.rot = Math.min(Math.max(eng.player.vy * 0.001, -0.5), 0.5);

        // Bounds
        if (eng.player.y < 0) { eng.player.y = 0; eng.player.vy = 0; }
        if (eng.player.y > eng.h - eng.player.h) { eng.player.y = eng.h - eng.player.h; eng.player.vy = 0; }

        // 4. Spawning
        const currentSpawnRate = SPAWN_RATE + (eng.level * 0.3);
        if (now > eng.nextSpawn) {
            spawnEntity(eng, scale);
            eng.nextSpawn = now + (1000 / (currentSpawnRate + eng.scrollSpeed * 0.0005));
        }

        // 5. Shooting (Auto-fire)
        // Rate limited to 400ms (Slower)
        if (eng.player.y < eng.h && eng.player.y > 0) {
            if (!eng.lastShot || now - eng.lastShot > 400) {
                eng.entities.push({
                    type: 'laser', x: eng.player.x + eng.player.w / 2, y: eng.player.y + eng.player.h / 2,
                    w: 20 * scale, h: 4 * scale, vx: 800 * scale, vy: 0
                });
                eng.lastShot = now;
                playSound('laser');
            }
        }

        // 6. Updates
        updateEntities(eng, dt, scale);
        updateParticles(eng, dt);
        updateStars(eng, dt);
    };

    // Helper for Lerp
    const lerp = (a, b, t) => a + (b - a) * t;

    const updateEntities = (eng, dt, scale) => {
        // Move
        eng.entities.forEach(e => {
            if (e.type === 'laser') e.x += e.vx * dt;
            else e.x -= (eng.scrollSpeed + (e.speed || 0)) * dt;

            if (e.float) e.y += Math.sin(eng.time * e.float) * 0.5 * scale;
            if (e.rotSpeed) e.rot += e.rotSpeed * dt;
        });

        // Collision mask (smaller than visual)
        const pRect = {
            x: eng.player.x - eng.player.w / 2 + 10,
            y: eng.player.y - eng.player.h / 2 + 10,
            w: eng.player.w - 20,
            h: eng.player.h - 20
        };

        eng.entities = eng.entities.filter(e => {
            if (e.dead) return false;
            if (e.x < -100 || e.x > eng.w + 100) return false;

            const eRect = { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };

            if (['asteroid', 'tie', 'coaxium'].includes(e.type)) {
                if (rectCollide(pRect, eRect)) {
                    if (e.type === 'coaxium') {
                        eng.score += 100;
                        playSound('collect');
                        createExplosion(eng, e.x, e.y, 'sparkle');
                    } else {
                        eng.health -= 20;
                        eng.trauma = 1.0;
                        playSound('hit');
                        createExplosion(eng, e.x, e.y, 'fire');
                    }
                    return false;
                }
            }
            // Laser Collision
            if (e.type === 'laser') {
                const target = eng.entities.find(t => ['asteroid', 'tie'].includes(t.type) && rectCollide({ x: e.x, y: e.y, w: e.w, h: e.h }, { x: t.x - t.w / 2, y: t.y - t.h / 2, w: t.w, h: t.h }));
                if (target) {
                    // Hit Logic
                    if (target.type === 'tie') {
                        target.hp = (target.hp || 1) - 1;
                        if (target.hp <= 0) {
                            target.dead = true;
                            createExplosion(eng, target.x, target.y, 'fire');
                            eng.score += 100; // More points for tough enemy
                            playSound('explosion');
                        } else {
                            // Hit effect but not dead
                            createExplosion(eng, target.x, target.y, 'sparkle');
                            playSound('hit');
                        }
                    } else {
                        // Asteroid or other 1-hit kill
                        target.dead = true;
                        createExplosion(eng, target.x, target.y, 'fire');
                        eng.score += 50;
                        playSound('explosion');
                    }
                    return false; // Destroy laser
                }
            }
            return true;
        });
    };

    const updateParticles = (eng, dt) => {
        eng.particles.forEach(p => {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.size *= 0.95;
        });
        eng.particles = eng.particles.filter(p => p.life > 0);
    };

    const updateStars = (eng, dt) => {
        eng.stars.forEach(s => {
            s.x -= (eng.scrollSpeed * s.z * 0.05) * dt;
            if (s.x < 0) s.x = eng.w;
        });
    };

    const spawnEntity = (eng, scale) => {
        const type = Math.random();

        // Full height span (0 to h)
        // Ensure entity is fully within screen or just spawns at center point
        // Let's spawn so center is within screen
        const margin = 30 * scale;
        let y = margin + Math.random() * (eng.h - margin * 2);

        // Anti-camping: 25% chance to target player Y directly plus slight offset
        if (Math.random() < 0.25) {
            y = eng.player.y + (Math.random() * 100 - 50) * scale;
        }

        const x = eng.w + 100;

        if (type < 0.15) {
            eng.entities.push({ type: 'coaxium', x, y, w: 30 * scale, h: 30 * scale, speed: 0, float: 3 });
        } else if (type < 0.50) {
            // TIE Fighter: HP based on level? Always 2 hits.
            // Level 4: TIEs move faster?
            const tieSpeed = (eng.level === 4) ? 250 : 150;
            eng.entities.push({ type: 'tie', x, y, w: 50 * scale, h: 50 * scale, speed: tieSpeed * scale, float: 2, hp: 2 });
        } else {
            // Asteroid
            let speedBonus = Math.random() * 200 * scale;
            // Level 4 Difficulty: Faster Asteroids
            if (eng.level === 4) speedBonus += 200 * scale;

            const rotSpeed = (Math.random() - 0.5) * 5;
            eng.entities.push({ type: 'asteroid', x, y, w: 60 * scale, h: 60 * scale, speed: speedBonus, rot: 0, rotSpeed });
        }
    };

    const addParticle = (eng, x, y, type) => {
        const p = { x, y, life: 1.0, vx: 0, vy: 0, size: 10, type };
        const scale = scaleRef.current;
        if (type === 'rocket_smoke') {
            p.vx = -100 * scale - Math.random() * 50 * scale;
            p.life = 0.5;
            p.size = (5 + Math.random() * 5) * scale;
            p.color = `rgba(100, 200, 255, ${0.5 + Math.random() * 0.5})`;
        } else if (type === 'fire') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 * scale;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 0.4;
            p.color = '#fbbf24';
        } else if (type === 'sparkle') {
            p.life = 0.6;
            p.color = '#e879f9';
            p.vy = -50 * scale;
        }
        eng.particles.push(p);
    };

    const createExplosion = (eng, x, y, type) => {
        for (let i = 0; i < 8; i++) addParticle(eng, x, y, type);
    };



    const drawAsset = (ctx, img, x, y, w, h, rot, glow = false) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        if (glow) {
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 15;
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            // Placeholder
            ctx.fillStyle = glow ? '#d8b4fe' : '#64748b';
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }
        ctx.restore();
    };

    // 🏁 END GAME
    const endGame = (win) => {
        engine.current.running = false;
        setGameState(win ? 'victory' : 'gameover');
        playSound(win ? 'win' : 'explosion');

        // Secure score calculation to prevent NaN
        const baseScore = Number(engine.current?.score) || 0;
        const winBonus = win ? 500 : 0;
        const finalScore = baseScore + winBonus;

        // Pass 'true' (success) to force score saving, but use local gameState for UI (victory/failure)
        finalizeActivity(true, finalScore);

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };

    // 🎮 CONTROLS (Responsive)
    const handleTouch = (e) => {
        // Prevent default to stop scrolling
        // e.preventDefault(); // (React synthetic event issues, usually handled by CSS touch-action: none)
        const y = e.touches[0].clientY;
        const cy = engine.current.h / 2;
        engine.current.input.up = y < cy;
        engine.current.input.down = y >= cy;
    };

    const rectCollide = (r1, r2) => {
        return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
    };

    return (
        <div
            className="fixed inset-0 bg-black overflow-hidden touch-none font-sans text-white select-none"
            style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitUserSelect: 'none',
                userSelect: 'none'
            }}
        >
            {/* GAME CANVAS LAYER */}
            <canvas
                ref={canvasRef}
                width={dimensions.w}
                height={dimensions.h}
                className="absolute inset-0 w-full h-full block"
                style={{ touchAction: 'none' }}
            />

            {/* HEADER LAYER (recreated from ActivityShell) */}
            <header className="absolute top-0 left-0 right-0 z-40 px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 pointer-events-none">
                <div className="flex items-center justify-between max-w-7xl mx-auto pointer-events-auto">
                    <button
                        onClick={onExit}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium border border-white/5 transition-colors backdrop-blur-md"
                    >
                        ← RETOUR
                    </button>
                    <div className="text-center">
                        <h1 className="font-orbitron font-bold text-lg text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                            KESSEL RUN
                        </h1>
                    </div>
                    <div className="w-[60px] flex justify-end">
                        {isCompleted && (
                            <span className="text-green-400 font-mono font-bold">+{score}</span>
                        )}
                    </div>
                </div>
            </header>

            {/* INTERACTION LAYER */}
            <div
                className="absolute inset-0 z-30 outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onTouchStart={(e) => {
                    // e.preventDefault(); // handled by touch-none
                    engine.current.input.active = true;
                }}
                onTouchEnd={() => { engine.current.input.active = false; }}
                onMouseDown={() => { engine.current.input.active = true; }}
                onMouseUp={() => { engine.current.input.active = false; }}
                onMouseLeave={() => { engine.current.input.active = false; }}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* HUD LAYER */}
            <div className="absolute top-16 left-0 right-0 px-4 flex justify-between font-orbitron text-yellow-400 z-30 pointer-events-none select-none">
                <div className="flex flex-col gap-1">
                    <div className="flex gap-2 text-sm md:text-base">
                        <div className="border border-green-500/50 bg-green-900/40 px-2 py-1 rounded backdrop-blur-sm shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                            HP: <span className={stats.health < 30 ? 'text-red-500 animate-pulse font-bold' : 'text-green-400'}>{stats.health}%</span>
                        </div>
                        <div className="border border-yellow-500/50 bg-yellow-900/40 px-2 py-1 rounded backdrop-blur-sm">
                            SCORE: {stats.score}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="border border-purple-500/50 bg-purple-900/40 px-2 py-1 rounded backdrop-blur-sm text-purple-300 text-xs md:text-sm font-bold flex gap-3">
                        <span>SECTEUR {Math.min(4, stats.level)}/4</span>
                        <span>|</span>
                        <span>{stats.parsecs}<span className="text-[10px] ml-1">pc</span></span>
                    </div>
                    <div className="border border-cyan-500/50 bg-cyan-900/40 px-2 py-1 rounded w-32 md:w-40 relative overflow-hidden backdrop-blur-sm h-6 flex items-center justify-center">
                        {/* Charging Bar: Empty to Full over 20s */}
                        <div className="absolute inset-0 bg-cyan-500/30 transition-all duration-300 origin-left"
                            style={{ transform: `scaleX(${Math.max(0, (20 - (stats.levelTime || 20)) / 20)})` }}
                        />
                        <span className="relative z-10 text-cyan-300 text-[10px] md:text-xs font-bold tracking-widest drop-shadow-md">
                            SAUT DANS: {Math.max(0, Math.ceil(stats.levelTime || 0))}s
                        </span>
                    </div>
                </div>
            </div>

            {/* INTRO/MENU LAYER */}
            <AnimatePresence>
                {gameState === 'intro' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center p-6 border-y-2 border-yellow-500 bg-black/90 max-w-md w-full shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                        >
                            <h1 className="text-3xl md:text-5xl font-black text-yellow-400 font-orbitron mb-2 tracking-widest">KESSEL RUN</h1>
                            <div className="h-px w-20 bg-yellow-600 mx-auto mb-6"></div>

                            <div className="text-gray-300 mb-8 font-mono text-xs md:text-sm space-y-2">
                                <p>MISSION: TRAVERSER 4 SECTEURS.</p>
                                <p>MENACE: IMPÉRIALE & ASTÉROÏDES.</p>
                                <p className="text-yellow-500 font-bold pt-2 animate-pulse">
                                    APPUYEZ POUR VOLER
                                </p>
                            </div>

                            <button
                                onClick={startGame}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black text-lg py-3 rounded uppercase tracking-wider transition-all shadow-lg shadow-yellow-900/40 active:scale-95 translate-y-0 hover:-translate-y-1"
                            >
                                DÉCOLLER
                            </button>
                        </motion.div>
                    </div>
                )}

                {['victory', 'gameover'].includes(gameState) && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center w-full max-w-lg border border-white/10 p-8 rounded-xl bg-black/80 shadow-2xl"
                        >
                            <h2 className={`text-3xl md:text-5xl font-black mb-2 font-orbitron ${gameState === 'victory' ? 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
                                {gameState === 'victory' ? 'MISSION ACCOMPLIE' : 'ÉCHEC CRITIQUE'}
                            </h2>
                            <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest">
                                {gameState === 'victory' ? 'Route de Kessel validée' : 'Vaisseau détruit'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8 font-mono">
                                <div className="bg-white/5 p-4 rounded border border-white/10">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-2xl text-yellow-400 font-bold">{stats.score}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded border border-white/10">
                                    <div className="text-xs text-gray-500">DISTANCE</div>
                                    <div className="text-2xl text-purple-400 font-bold">{Math.min(12, stats.parsecs)} <span className="text-sm">pc</span></div>
                                </div>
                            </div>

                            {/* LEADERBOARD */}
                            <div className="mb-6 w-full max-w-md mx-auto bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-yellow-500 font-bold mb-2 text-[10px] sm:text-xs font-orbitron tracking-widest border-b border-white/10 pb-1 text-center">
                                    CLASSEMENT GALACTIQUE
                                </h3>
                                <div className="space-y-1.5 max-h-32 sm:max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {sortedTeams && sortedTeams.length > 0 ? (
                                        sortedTeams.slice(0, 5).map((team, index) => (
                                            <div
                                                key={team.id || index}
                                                className={`flex justify-between items-center text-[10px] sm:text-xs p-1.5 rounded ${currentTeam === team.id ? 'bg-yellow-900/40 border border-yellow-500/30' : 'bg-white/5 hover:bg-white/10'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-mono font-bold w-5 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                                                        #{index + 1}
                                                    </span>
                                                    <span className={`truncate max-w-[100px] ${currentTeam === team.id ? 'text-white font-bold' : 'text-gray-300'}`}>
                                                        {team.name}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-yellow-200">{team.score} pts</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 text-xs italic text-center py-2">Envoi du score...</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded text-white font-bold transition-colors uppercase text-sm tracking-wider"
                                >
                                    Réessayer
                                </button>
                                <button
                                    onClick={onExit}
                                    className={`px-6 py-3 rounded text-black font-bold transition-colors uppercase text-sm tracking-wider shadow-lg ${gameState === 'victory' ? 'bg-green-500 hover:bg-green-400 shadow-green-900/30' : 'bg-red-500 hover:bg-red-400 shadow-red-900/30'}`}
                                >
                                    Quitter
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
