import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityShell from '../components/activity/ActivityShell';
import { useActivityScore } from '../hooks/useActivityScore';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TOTAL_PARSECS = 12;
const SECONDS_PER_PARSEC = 4;
const MAX_TIME = TOTAL_PARSECS * SECONDS_PER_PARSEC; // 48s
const CANVAS_W = 400;
const CANVAS_H = 700;
const SHIP_W = 52;
const SHIP_H = 56;
const BOOST_DURATION = 2000; // ms
const BOOST_COOLDOWN = 6000; // ms

// Difficulté par parsec
const PARSEC_CONFIG = [
    // 1-3 : Facile — débris lents
    { debris: 2, shots: 0, gravity: false, corridors: 1, speed: 1.0 },
    { debris: 3, shots: 0, gravity: false, corridors: 1, speed: 1.0 },
    { debris: 3, shots: 0, gravity: false, corridors: 0, speed: 1.1 },
    // 4-6 : Moyen — débris + tirs
    { debris: 3, shots: 1, gravity: false, corridors: 1, speed: 1.2 },
    { debris: 4, shots: 2, gravity: false, corridors: 0, speed: 1.3 },
    { debris: 4, shots: 2, gravity: false, corridors: 1, speed: 1.3 },
    // 7-9 : Difficile — champs gravitationnels
    { debris: 3, shots: 2, gravity: true, corridors: 1, speed: 1.4 },
    { debris: 4, shots: 3, gravity: true, corridors: 0, speed: 1.5 },
    { debris: 5, shots: 3, gravity: true, corridors: 1, speed: 1.5 },
    // 10-11 : Très dur — ennemis + tirs croisés
    { debris: 5, shots: 4, gravity: true, corridors: 0, speed: 1.6 },
    { debris: 6, shots: 5, gravity: true, corridors: 1, speed: 1.7 },
    // 12 : Final — corridor étroit + boost obligatoire
    { debris: 4, shots: 3, gravity: false, corridors: 2, speed: 1.8 },
];

// =============================================================================
// SOUND ENGINE (WebAudio)
// =============================================================================

function useSoundEngine() {
    const ctxRef = useRef(null);

    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctxRef.current;
    }, []);

    const play = useCallback((type) => {
        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const sounds = {
                engine: { freq: 120, dur: 0.08, wave: 'sawtooth', vol: 0.03 },
                boost: { freq: 800, dur: 0.15, wave: 'square', vol: 0.06 },
                hit: { freq: 80, dur: 0.25, wave: 'sawtooth', vol: 0.08 },
                bigHit: { freq: 50, dur: 0.4, wave: 'sawtooth', vol: 0.1 },
                corridor: { freq: 1200, dur: 0.1, wave: 'sine', vol: 0.05 },
                parsec: { freq: 600, dur: 0.12, wave: 'sine', vol: 0.04 },
                success: { freq: 880, dur: 0.3, wave: 'sine', vol: 0.06 },
                fail: { freq: 100, dur: 0.5, wave: 'sawtooth', vol: 0.08 },
                alarm: { freq: 200, dur: 0.15, wave: 'square', vol: 0.04 },
            };

            const s = sounds[type] || sounds.engine;
            osc.type = s.wave;
            osc.frequency.value = s.freq;
            gain.gain.setValueAtTime(s.vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);
            osc.start();
            osc.stop(ctx.currentTime + s.dur);
        } catch (e) { /* ignore */ }
    }, [getCtx]);

    return play;
}

// =============================================================================
// GYROSCOPE / TOUCH CONTROLS HOOK
// =============================================================================

function useControls() {
    const shipX = useRef(CANVAS_W / 2);
    const gyroAvailable = useRef(false);
    const touchStartX = useRef(null);

    useEffect(() => {
        // Gyroscope
        const handleOrientation = (e) => {
            if (e.gamma !== null) {
                gyroAvailable.current = true;
                // gamma: -90..90, map to 0..CANVAS_W
                const normalized = Math.max(-30, Math.min(30, e.gamma)) / 30; // -1..1
                const targetX = (CANVAS_W / 2) + normalized * (CANVAS_W / 2 - SHIP_W);
                shipX.current += (targetX - shipX.current) * 0.15;
            }
        };

        // Try to listen for orientation
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires permission
            DeviceOrientationEvent.requestPermission()
                .then(state => {
                    if (state === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                }).catch(() => { });
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    // Touch fallback
    const onTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const onTouchMove = useCallback((e) => {
        if (touchStartX.current === null) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        shipX.current = Math.max(SHIP_W / 2, Math.min(CANVAS_W - SHIP_W / 2, shipX.current + dx * 0.4));
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const onTouchEnd = useCallback(() => {
        touchStartX.current = null;
    }, []);

    return { shipX, gyroAvailable, onTouchStart, onTouchMove, onTouchEnd };
}

// =============================================================================
// GAME ENTITY GENERATORS
// =============================================================================

function spawnDebris(parsecConfig, offsetY) {
    const entities = [];
    for (let i = 0; i < parsecConfig.debris; i++) {
        const size = 12 + Math.random() * 20;
        entities.push({
            type: 'debris',
            x: 20 + Math.random() * (CANVAS_W - 40),
            y: offsetY - Math.random() * (CANVAS_H * 2),
            w: size,
            h: size,
            speed: (0.8 + Math.random() * 0.6) * parsecConfig.speed,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            big: size > 24,
        });
    }
    return entities;
}

function spawnShots(parsecConfig, offsetY) {
    const entities = [];
    for (let i = 0; i < parsecConfig.shots; i++) {
        const fromLeft = Math.random() > 0.5;
        entities.push({
            type: 'shot',
            x: fromLeft ? -10 : CANVAS_W + 10,
            y: offsetY - Math.random() * (CANVAS_H * 1.5),
            vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 3) * parsecConfig.speed,
            vy: 1 + Math.random() * 2,
            w: 16,
            h: 4,
        });
    }
    return entities;
}

function spawnCorridors(parsecConfig, offsetY) {
    const entities = [];
    for (let i = 0; i < parsecConfig.corridors; i++) {
        const cx = 60 + Math.random() * (CANVAS_W - 120);
        entities.push({
            type: 'corridor',
            x: cx,
            y: offsetY - CANVAS_H * 0.5 - Math.random() * CANVAS_H,
            w: 70,
            h: 30,
            collected: false,
        });
    }
    return entities;
}

// =============================================================================
// MILLENNIUM FALCON SPRITE (pixel art image)
// =============================================================================

// Pre-load the sprite image (cached across renders)
let falconImg = null;
let falconImgLoading = false;

function loadFalconSprite() {
    if (falconImg || falconImgLoading) return;
    falconImgLoading = true;
    const img = new Image();
    img.src = '/images/Games/Kessel/FM.png';
    img.onload = () => {
        falconImg = img;
        console.log('🛸 Falcon sprite loaded:', img.width, 'x', img.height);
    };
    img.onerror = () => {
        console.warn('⚠️ Could not load falcon.png — using fallback');
        falconImgLoading = false;
    };
}

// Call on module load
loadFalconSprite();

function drawMillenniumFalcon(ctx, cx, cy, isBoosting) {
    const spriteW = SHIP_W;
    const spriteH = SHIP_H;

    // ── ENGINE GLOW (behind ship) ──────────────────────
    const glowColor = isBoosting ? '#facc15' : '#6366f1';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isBoosting ? 25 : 12;
    ctx.fillStyle = glowColor;

    // Engine glow ellipses at bottom of ship
    const engineY = cy + spriteH / 2 - 4;
    const enginePositions = [-10, -4, 4, 10];
    enginePositions.forEach(ex => {
        ctx.beginPath();
        ctx.ellipse(cx + ex, engineY, 3, isBoosting ? 7 : 4, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Boost thrust streaks
    if (isBoosting) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fef08a';
        enginePositions.forEach(ex => {
            const streakLen = 10 + Math.random() * 12;
            ctx.fillRect(cx + ex - 1.5, engineY, 3, streakLen);
        });
        ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;

    // ── DRAW SPRITE ────────────────────────────────────
    if (falconImg) {
        // Draw the pixel art image, centered, with imageSmoothingEnabled = false for crisp pixels
        ctx.save();
        ctx.imageSmoothingEnabled = false; // Keep pixel art crisp!
        ctx.drawImage(
            falconImg,
            cx - spriteW / 2,
            cy - spriteH / 2,
            spriteW,
            spriteH
        );

        // Boost golden overlay
        if (isBoosting) {
            ctx.globalAlpha = 0.2;
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - spriteW / 2, cy - spriteH / 2, spriteW, spriteH);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    } else {
        // Fallback: simple circle if image not loaded
        ctx.fillStyle = isBoosting ? '#facc15' : '#9ca3af';
        ctx.beginPath();
        ctx.ellipse(cx, cy, spriteW / 2, spriteH / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cockpit dot
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(cx + 10, cy - 6, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function KesselRun({ universeId = 'star_wars', onComplete, onExit }) {
    const {
        isPlaying,
        isCompleted,
        score,
        bonus,
        startActivity,
        recordAction,
        finalizeActivity
    } = useActivityScore(universeId, 'kessel_run', {
        maxPoints: 600,
        activityType: 'navigation',
        onComplete
    });

    // Game state
    const [phase, setPhase] = useState('intro'); // intro, running, success, fail
    const [currentParsec, setCurrentParsec] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [collisions, setCollisions] = useState(0);
    const [bigCollisions, setBigCollisions] = useState(0);
    const [timePenalty, setTimePenalty] = useState(0);
    const [timeBonus, setTimeBonus] = useState(0);
    const [boostActive, setBoostActive] = useState(false);
    const [boostCooldown, setBoostCooldown] = useState(0);
    const [showParsecFlash, setShowParsecFlash] = useState(0);
    const [hitFlash, setHitFlash] = useState(false);

    // Refs
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const animFrameRef = useRef(null);

    // Controls
    const { shipX, gyroAvailable, onTouchStart, onTouchMove, onTouchEnd } = useControls();
    const playSound = useSoundEngine();

    // =========================================================================
    // GAME LOOP
    // =========================================================================

    const startGame = useCallback(() => {
        startActivity();
        setPhase('running');
        setCurrentParsec(1);
        setElapsedTime(0);
        setCollisions(0);
        setBigCollisions(0);
        setTimePenalty(0);
        setTimeBonus(0);
        setBoostActive(false);
        setBoostCooldown(0);
        shipX.current = CANVAS_W / 2;

        // Initialize game state
        const config = PARSEC_CONFIG[0];
        gameRef.current = {
            startTime: Date.now(),
            lastParsecTime: Date.now(),
            parsec: 1,
            shipY: CANVAS_H - 100,
            entities: [
                ...spawnDebris(config, 0),
                ...spawnShots(config, 0),
                ...spawnCorridors(config, 0),
            ],
            stars: Array.from({ length: 80 }, () => ({
                x: Math.random() * CANVAS_W,
                y: Math.random() * CANVAS_H,
                speed: 0.5 + Math.random() * 2,
                size: Math.random() * 2,
            })),
            boost: false,
            boostEndTime: 0,
            boostCooldownEnd: 0,
            collisions: 0,
            bigCollisions: 0,
            timePenalty: 0,
            timeBonus: 0,
            dead: false,
            invincible: 0, // invincibility frames after hit
        };

        playSound('engine');
    }, [startActivity, shipX, playSound]);

    // Main render loop
    useEffect(() => {
        if (phase !== 'running') return;
        const game = gameRef.current;
        if (!game) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let lastTime = performance.now();

        const loop = (now) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
            lastTime = now;

            // ─── TIME ────────────────────────────────────
            const elapsed = (Date.now() - game.startTime) / 1000 + game.timePenalty - game.timeBonus;
            const effectiveTime = Math.max(0, elapsed);
            setElapsedTime(effectiveTime);

            // Parsec tracking (every 4 seconds of real time)
            const realElapsed = (Date.now() - game.startTime) / 1000;
            const newParsec = Math.min(TOTAL_PARSECS, Math.floor(realElapsed / SECONDS_PER_PARSEC) + 1);
            if (newParsec !== game.parsec && newParsec <= TOTAL_PARSECS) {
                game.parsec = newParsec;
                setCurrentParsec(newParsec);
                setShowParsecFlash(newParsec);
                setTimeout(() => setShowParsecFlash(0), 1200);
                playSound('parsec');

                // Spawn new entities for new parsec
                const config = PARSEC_CONFIG[Math.min(newParsec - 1, PARSEC_CONFIG.length - 1)];
                game.entities.push(
                    ...spawnDebris(config, -CANVAS_H),
                    ...spawnShots(config, -CANVAS_H),
                    ...spawnCorridors(config, -CANVAS_H),
                );
            }

            // ─── WIN / LOSE ──────────────────────────────
            if (realElapsed >= MAX_TIME) {
                // Time's up — check distance
                if (game.parsec >= TOTAL_PARSECS) {
                    // Made it!
                    endGame(true, effectiveTime);
                } else {
                    endGame(false, effectiveTime);
                }
                return;
            }
            if (game.bigCollisions >= 3) {
                endGame(false, effectiveTime);
                return;
            }
            if (game.parsec >= TOTAL_PARSECS && realElapsed >= (TOTAL_PARSECS * SECONDS_PER_PARSEC)) {
                endGame(true, effectiveTime);
                return;
            }

            // ─── BOOST ──────────────────────────────────
            if (game.boost && Date.now() > game.boostEndTime) {
                game.boost = false;
                game.boostCooldownEnd = Date.now() + BOOST_COOLDOWN;
                setBoostActive(false);
            }
            if (game.boostCooldownEnd > 0 && Date.now() < game.boostCooldownEnd) {
                setBoostCooldown(Math.ceil((game.boostCooldownEnd - Date.now()) / 1000));
            } else {
                setBoostCooldown(0);
            }

            // ─── INVINCIBILITY ───────────────────────────
            if (game.invincible > 0) game.invincible -= dt;

            const speedMult = game.boost ? 1.4 : 1.0;
            const baseSpeed = 200; // px/s

            // ─── STARS ──────────────────────────────────
            game.stars.forEach(s => {
                s.y += s.speed * speedMult * baseSpeed * dt * 0.3;
                if (s.y > CANVAS_H) {
                    s.y = -5;
                    s.x = Math.random() * CANVAS_W;
                }
            });

            // ─── ENTITIES UPDATE ─────────────────────────
            const shipRect = {
                x: shipX.current - SHIP_W / 2,
                y: game.shipY - SHIP_H / 2,
                w: SHIP_W,
                h: SHIP_H
            };

            game.entities = game.entities.filter(e => {
                // Move
                if (e.type === 'debris') {
                    e.y += e.speed * speedMult * baseSpeed * dt;
                    e.rotation += e.rotSpeed;
                    // Gravity field effect (parsec 7-9)
                    const parsecIdx = game.parsec - 1;
                    if (parsecIdx >= 0 && parsecIdx < PARSEC_CONFIG.length && PARSEC_CONFIG[parsecIdx].gravity) {
                        const dx = shipX.current - e.x;
                        e.x += dx * 0.003; // slight attraction
                    }
                } else if (e.type === 'shot') {
                    e.x += e.vx * speedMult * 60 * dt;
                    e.y += e.vy * speedMult * 60 * dt;
                } else if (e.type === 'corridor') {
                    e.y += 0.7 * speedMult * baseSpeed * dt;
                }

                // Remove if off-screen
                if (e.y > CANVAS_H + 60 || e.x < -60 || e.x > CANVAS_W + 60) return false;

                // Collision check
                if (game.invincible <= 0) {
                    if (e.type === 'debris' || e.type === 'shot') {
                        const eRect = { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
                        if (rectsOverlap(shipRect, eRect)) {
                            // Hit!
                            game.invincible = 1.0; // 1s invincibility
                            if (e.type === 'debris' && e.big) {
                                game.timePenalty += 2;
                                game.bigCollisions++;
                                setBigCollisions(game.bigCollisions);
                                setTimePenalty(game.timePenalty);
                                playSound('bigHit');
                                vibrate(200);
                            } else {
                                game.timePenalty += 1;
                                setTimePenalty(game.timePenalty);
                                playSound('hit');
                                vibrate(100);
                            }
                            game.collisions++;
                            setCollisions(game.collisions);
                            setHitFlash(true);
                            setTimeout(() => setHitFlash(false), 200);
                            return false; // remove entity
                        }
                    } else if (e.type === 'corridor' && !e.collected) {
                        const eRect = { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
                        if (rectsOverlap(shipRect, eRect)) {
                            e.collected = true;
                            game.timeBonus += 2;
                            setTimeBonus(game.timeBonus);
                            playSound('corridor');
                            return false;
                        }
                    }
                }

                return true;
            });

            // ─── RENDER ─────────────────────────────────
            // Clear
            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Stars
            game.stars.forEach(s => {
                const brightness = 0.3 + s.speed * 0.3;
                ctx.fillStyle = `rgba(255,255,255,${brightness})`;
                const streakLen = game.boost ? s.speed * 8 : s.speed * 2;
                ctx.fillRect(s.x, s.y, s.size, streakLen);
            });

            // Grid lines (subtle)
            ctx.strokeStyle = 'rgba(139,92,246,0.06)';
            ctx.lineWidth = 1;
            for (let gx = 0; gx < CANVAS_W; gx += 40) {
                ctx.beginPath();
                ctx.moveTo(gx, 0);
                ctx.lineTo(gx, CANVAS_H);
                ctx.stroke();
            }

            // Entities
            game.entities.forEach(e => {
                if (e.type === 'debris') {
                    ctx.save();
                    ctx.translate(e.x, e.y);
                    ctx.rotate(e.rotation);
                    ctx.fillStyle = e.big ? '#92400e' : '#6b7280';
                    ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
                    // Rock texture
                    ctx.fillStyle = e.big ? '#78350f' : '#4b5563';
                    ctx.fillRect(-e.w / 4, -e.h / 4, e.w / 2, e.h / 2);
                    ctx.restore();
                } else if (e.type === 'shot') {
                    ctx.fillStyle = '#ef4444';
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 8;
                    ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
                    ctx.shadowBlur = 0;
                } else if (e.type === 'corridor') {
                    // Boost corridor — glowing gates
                    ctx.strokeStyle = '#22d3ee';
                    ctx.shadowColor = '#22d3ee';
                    ctx.shadowBlur = 12;
                    ctx.lineWidth = 3;
                    ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
                    ctx.shadowBlur = 0;
                    // inner glow
                    ctx.fillStyle = 'rgba(34,211,238,0.08)';
                    ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
                    // label
                    ctx.fillStyle = '#22d3ee';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚡ BOOST', e.x, e.y + 3);
                }
            });

            // Ship — Millennium Falcon
            const sx = shipX.current;
            const sy = game.shipY;
            const blinking = game.invincible > 0 && Math.floor(game.invincible * 10) % 2 === 0;

            if (!blinking) {
                drawMillenniumFalcon(ctx, sx, sy, game.boost);
            }

            // ─── HUD on canvas ──────────────────────────
            // Parsec progress bar at top
            const progress = realElapsed / MAX_TIME;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, CANVAS_W, 6);
            ctx.fillStyle = effectiveTime > 44 ? '#ef4444' : effectiveTime > 40 ? '#f59e0b' : '#22d3ee';
            ctx.fillRect(0, 0, CANVAS_W * progress, 6);

            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [phase, playSound, shipX]);

    // =========================================================================
    // END GAME
    // =========================================================================

    const endGame = useCallback((success, effectiveTime) => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        if (success) {
            setPhase('success');
            playSound('success');

            // Calculate score
            let bonusPoints = 0;
            const game = gameRef.current;
            if (effectiveTime < 40) bonusPoints += 300;
            else if (effectiveTime < 44) bonusPoints += 150;

            if (game && game.collisions === 0) bonusPoints += 200; // Perfect run

            finalizeActivity(true, bonusPoints);
        } else {
            setPhase('fail');
            playSound('fail');
            vibrate(300);
            finalizeActivity(false, 0);
        }
    }, [playSound, finalizeActivity]);

    // =========================================================================
    // BOOST BUTTON
    // =========================================================================

    const activateBoost = useCallback(() => {
        const game = gameRef.current;
        if (!game || game.boost || game.dead) return;
        if (Date.now() < game.boostCooldownEnd) return;

        game.boost = true;
        game.boostEndTime = Date.now() + BOOST_DURATION;
        setBoostActive(true);
        playSound('boost');
        vibrate(50);
    }, [playSound]);

    // =========================================================================
    // HELPERS
    // =========================================================================

    function rectsOverlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function vibrate(ms) {
        if (navigator.vibrate) navigator.vibrate(ms);
    }

    // =========================================================================
    // RENDER
    // =========================================================================

    const effectiveDisplay = Math.max(0, elapsedTime).toFixed(1);
    const remaining = Math.max(0, MAX_TIME - elapsedTime).toFixed(1);

    return (
        <ActivityShell
            title="La Route de Kessel"
            subtitle="12 parsecs à travers le champ d'astéroïdes"
            universeColor="#f59e0b"
            onExit={onExit}
            isCompleted={isCompleted}
            score={score}
            bonus={bonus}
            background={
                <div className="absolute inset-0 bg-black">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0b1221_0%,_black_70%)] opacity-40" />
                </div>
            }
        >
            <div className="w-full flex flex-col items-center gap-3 relative select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* ═══ INTRO ═══ */}
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8"
                    >
                        <div className="text-6xl mb-4">🚀</div>
                        <h2 className="text-2xl font-bold text-yellow-400 font-orbitron mb-2">
                            KESSEL RUN
                        </h2>
                        <p className="text-white/70 mb-1">12 parsecs. 48 secondes max.</p>
                        <p className="text-white/50 text-sm mb-6">
                            Inclinez votre téléphone ou glissez pour piloter.<br />
                            Évitez les débris. Passez dans les corridors boost ⚡
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-sm text-white/60 mb-6 max-w-xs mx-auto">
                            <div className="bg-white/5 p-2 rounded">🪨 Petit débris = -1s</div>
                            <div className="bg-white/5 p-2 rounded">💥 Gros débris = -2s</div>
                            <div className="bg-white/5 p-2 rounded">⚡ Corridor = +2s</div>
                            <div className="bg-white/5 p-2 rounded">3 gros impacts = 💀</div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={startGame}
                            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl text-lg shadow-lg shadow-yellow-500/30"
                        >
                            Lancer l'hyperespace !
                        </motion.button>
                    </motion.div>
                )}

                {/* ═══ RUNNING ═══ */}
                {phase === 'running' && (
                    <>
                        {/* HUD */}
                        <div className="w-full max-w-[420px] flex items-center justify-between text-xs font-mono px-2">
                            <div className="text-yellow-400">
                                PARSEC {currentParsec}/{TOTAL_PARSECS}
                            </div>
                            <div className={`font-bold text-lg ${elapsedTime > 44 ? 'text-red-400' : elapsedTime > 40 ? 'text-orange-400' : 'text-cyan-400'}`}>
                                {remaining}s
                            </div>
                            <div className="flex items-center gap-2">
                                {bigCollisions > 0 && (
                                    <span className="text-red-400">
                                        {'💔'.repeat(bigCollisions)}
                                    </span>
                                )}
                                {timePenalty > 0 && <span className="text-red-400">-{timePenalty}s</span>}
                                {timeBonus > 0 && <span className="text-green-400">+{timeBonus}s</span>}
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="relative rounded-xl overflow-hidden border border-white/10"
                            style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}
                        >
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                style={{ width: '100%', height: '100%', display: 'block' }}
                            />

                            {/* Hit flash overlay */}
                            <AnimatePresence>
                                {hitFlash && (
                                    <motion.div
                                        initial={{ opacity: 0.6 }}
                                        animate={{ opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute inset-0 bg-red-500/40 pointer-events-none"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Parsec flash */}
                            <AnimatePresence>
                                {showParsecFlash > 0 && (
                                    <motion.div
                                        initial={{ opacity: 1, scale: 0.5 }}
                                        animate={{ opacity: 0, scale: 1.5 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.2 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="text-yellow-400 font-orbitron text-3xl font-bold drop-shadow-lg">
                                            PARSEC {showParsecFlash}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Boost button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={activateBoost}
                            disabled={boostActive || boostCooldown > 0}
                            className={`
                                w-full max-w-[420px] py-4 rounded-xl font-bold text-lg
                                ${boostActive
                                    ? 'bg-yellow-500 text-black animate-pulse'
                                    : boostCooldown > 0
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white active:from-cyan-500 active:to-blue-500'
                                }
                            `}
                        >
                            {boostActive
                                ? '🔥 BOOST ACTIF'
                                : boostCooldown > 0
                                    ? `⏳ Recharge (${boostCooldown}s)`
                                    : '🚀 BOOST !'}
                        </motion.button>

                        {/* Controls hint */}
                        {!gyroAvailable.current && (
                            <div className="text-white/30 text-xs text-center">
                                👆 Glissez sur l'écran pour diriger · Tapez BOOST pour accélérer
                            </div>
                        )}
                    </>
                )}

                {/* ═══ SUCCESS ═══ */}
                {phase === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <motion.div
                            className="text-8xl mb-4"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                        >
                            🏆
                        </motion.div>
                        <h2 className="text-3xl font-bold text-yellow-400 font-orbitron mb-2">
                            KESSEL RUN COMPLÉTÉ !
                        </h2>
                        <p className="text-white/70 mb-1">
                            {elapsedTime.toFixed(1)} secondes effectives
                        </p>
                        <div className="text-sm text-white/50 space-y-1 mb-4">
                            {collisions === 0 && <div className="text-green-400">✨ Perfect Run ! +200 pts</div>}
                            {elapsedTime < 40 && <div className="text-yellow-400">⚡ Speed Demon ! +300 pts</div>}
                            {elapsedTime >= 40 && elapsedTime < 44 && <div className="text-cyan-400">🚀 Quick Run ! +150 pts</div>}
                        </div>
                        <div className="text-4xl font-mono font-bold text-white mb-6">
                            {score} pts
                        </div>
                    </motion.div>
                )}

                {/* ═══ FAIL ═══ */}
                {phase === 'fail' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                    >
                        <div className="text-6xl mb-4">💥</div>
                        <h2 className="text-2xl font-bold text-red-400 font-orbitron mb-2">
                            MISSION ÉCHOUÉE
                        </h2>
                        <p className="text-white/50 mb-4">
                            {bigCollisions >= 3
                                ? 'Trop de dégâts critiques — vaisseau détruit !'
                                : `Temps écoulé : ${elapsedTime.toFixed(1)}s (max ${MAX_TIME}s)`
                            }
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setPhase('intro'); }}
                            className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                        >
                            Réessayer
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </ActivityShell>
    );
}
