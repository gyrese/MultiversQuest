/**
 * 🔫 FIREBASE ENGINE — Starship Troopers
 * Mobile Infantry vs Arachnid Threat on Klendathu
 * Panoramic Gyroscope FPS — Production Grade
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const CFG = {
    FOV: 75,                // degrees visible horizontally
    HORIZON: 0.40,          // fraction of canvas height (horizon line)
    CAM_SENSITIVITY: 1.2,   // gyro sensitivity multiplier
    TILT_SENSITIVITY: 0.6,  // vertical tilt sensitivity
    TILT_RANGE: 0.25,       // max fraction of screen tiltable vertically
    SPAWN_DEPTH: 0.02,      // depth at spawn (just past horizon)
    GAMEOVER_DEPTH: 0.98,   // bug reaches player
    MAX_LIVES: 5,
    MAX_AMMO: 8,
    RELOAD_TIME: 1800,      // ms to reload full clip
    WAVE_BREAK: 3000,       // ms between waves
};

// ─── ARACHNID TYPES ───────────────────────────────────────────────────────────
const ARACHNIDS = {
    warrior: {
        hp: 1, score: 100, speed: 0.28, baseSize: 55,
        color: '#cc2200', accentColor: '#ff4400',
        behavior: 'charge', legs: 6,
    },
    plasma: {
        hp: 1, score: 150, speed: 0.42, baseSize: 40,
        color: '#ff6600', accentColor: '#ffcc00',
        behavior: 'strafe', legs: 4,
    },
    tanker: {
        hp: 5, score: 400, speed: 0.12, baseSize: 110,
        color: '#6b0000', accentColor: '#cc0000',
        behavior: 'charge', legs: 8,
    },
    hopper: {
        hp: 1, score: 200, speed: 0.35, baseSize: 45,
        color: '#880088', accentColor: '#dd00dd',
        behavior: 'zigzag', legs: 4,
    },
};

// ─── WAVE DEFINITIONS ─────────────────────────────────────────────────────────
const WAVES = [
    { label: 'VAGUE 1', bugs: [{ type: 'warrior', count: 6 }], interval: 3200 },
    { label: 'VAGUE 2', bugs: [{ type: 'warrior', count: 8 }, { type: 'plasma', count: 2 }], interval: 2800 },
    { label: 'VAGUE 3', bugs: [{ type: 'warrior', count: 6 }, { type: 'hopper', count: 4 }], interval: 2500 },
    { label: 'VAGUE 4', bugs: [{ type: 'warrior', count: 5 }, { type: 'plasma', count: 3 }, { type: 'tanker', count: 1 }], interval: 2200 },
    { label: 'VAGUE 5 — FINALE', bugs: [{ type: 'warrior', count: 8 }, { type: 'hopper', count: 4 }, { type: 'tanker', count: 2 }], interval: 2000 },
];

// ─── STARS SEED ───────────────────────────────────────────────────────────────
const STAR_COUNT = 180;
const generateStars = () =>
    Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random(),   // 0-1 of world width (normalized)
        y: Math.random() * 0.85,  // 0-1 of sky height
        r: Math.random() * 1.6 + 0.3,
        brightness: Math.random() * 0.6 + 0.4,
        twinkle: Math.random() * Math.PI * 2,
    }));

const STARS = generateStars();

// ─── MOUNTAIN LAYERS ──────────────────────────────────────────────────────────
const generateMountainLayer = (seed, count, amplitude) => {
    const pts = [];
    const step = 1 / (count - 1);
    for (let i = 0; i < count; i++) {
        pts.push(0.5 + amplitude * Math.sin(i * seed * 2.3 + seed) * Math.cos(i * 0.7));
    }
    return pts;
};

const MOUNTAINS = [
    { pts: generateMountainLayer(1.3, 24, 0.18), color: '#0d0308', parallax: 0.05, yBase: 0.95 },
    { pts: generateMountainLayer(2.1, 20, 0.14), color: '#150608', parallax: 0.10, yBase: 0.97 },
    { pts: generateMountainLayer(3.7, 16, 0.10), color: '#200a0a', parallax: 0.18, yBase: 0.99 },
];

// ─── MAIN ENGINE CLASS ────────────────────────────────────────────────────────
export class FirebaseEngine {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.cb = callbacks;

        // Camera state (driven by gyroscope)
        this.camera = { angle: 0, tilt: 0, calibAngle: null, calibTilt: null };
        this.gyroAvailable = false;
        this.fallbackDrag = { active: false, lastX: 0 };

        // Game state
        this.state = {
            running: false,
            paused: false,
            score: 0, combo: 0, kills: 0,
            lives: CFG.MAX_LIVES, ammo: CFG.MAX_AMMO,
            wave: 0, waveKills: 0, waveTotal: 0,
            shake: 0,
            reloading: false, reloadProgress: 0,
            t: 0, // total time ms
        };

        this.bugs = [];
        this.particles = [];

        // Audio
        this.audioCtx = null;

        // Texture cache
        this.groundGrad = null;
        this.skyGrad = null;

        // Bind only the handlers still used as named method references
        this._onGyro = this._onGyro.bind(this);
        this._visibilityChange = this._visibilityChange.bind(this);
        this._loop = this._loop.bind(this);
        this._raf = null;
        this._inputListeners = []; // populated by _setupInputs

        this._resize();
        new ResizeObserver(() => this._resize()).observe(canvas);
        document.addEventListener('visibilitychange', this._visibilityChange);
    }

    // ── RESIZE ──────────────────────────────────────────────────────────────────
    _resize() {
        // Fallback dimensions (au moins 320x240 pour éviter crash)
        let rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            rect = { width: window.innerWidth || 320, height: window.innerHeight || 480 };
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = rect.width;
        this.h = rect.height;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Reset context
        this.ctx.resetTransform(); // Important !
        this.ctx.scale(dpr, dpr);

        this.horizonY = this.h * CFG.HORIZON;

        // Invalidate gradient cache
        this.groundGrad = null;
        this.skyGrad = null;
    }

    // ── GYROSCOPE ───────────────────────────────────────────────────────────────
    enableGyro() {
        window.addEventListener('deviceorientation', this._onGyro, true);
        this.gyroAvailable = true;
    }

    calibrate() {
        // Force une calibration sur le prochain event gyro reçu
        this.camera.calibPending = true;
    }

    _onGyro(e) {
        // ── Sélection de l'axe horizontal ──────────────────────────────────────
        // e.alpha : boussole (0-360) — null sur certains Android sans boussole
        // e.gamma : tilt gauche/droite (-90 à 90) — TOUJOURS disponible
        // On préfère gamma car il fonctionne sur tous les appareils, sans permissions.
        // Pour un FPS portrait, gamma = rotation autour de l'axe vertical du téléphone.
        const hasAlpha = e.alpha !== null && e.alpha !== undefined && e.alpha !== 0;
        const rawH = e.gamma ?? 0; // Horizontal : gauche/droite (-90 to +90)
        const rawV = e.beta ?? 0; // Vertical   : avant/arrière (-180 to +180)

        this.camera.rawAngle = rawH;
        this.camera.rawTilt = rawV;
        this.gyroHasData = true;

        // ── Calibration au premier event ────────────────────────────────────────
        if (this.camera.calibPending) {
            this.camera.calibAngle = rawH;
            this.camera.calibTilt = rawV;
            this.camera.calibPending = false;
            console.log('🎯 Gyro calibrated — gamma:', rawH.toFixed(1), 'beta:', rawV.toFixed(1));
        }

        // ── Application des deltas ──────────────────────────────────────────────
        if (this.camera.calibAngle !== null) {
            // Horizontal : gamma va de -90 à +90 → pas de wrap 360°
            const dH = rawH - this.camera.calibAngle;
            this.camera.angle = Math.max(-130, Math.min(130, dH * CFG.CAM_SENSITIVITY));

            // Vertical : beta — on se concentre sur la plage 60°-120° (téléphone tenu verticalement)
            const dV = rawV - this.camera.calibTilt;
            const clampedV = Math.max(-40, Math.min(40, dV));
            this.camera.tilt = (clampedV / 40) * CFG.TILT_RANGE * CFG.TILT_SENSITIVITY;
        }
    }

    // ── TOUCH : tap = tir, glisser = caméra ─────────────────────────────────────
    // Séparation claire : on détecte le tap sur touchend (fin du toucher)
    // pour distinguer un tap court d'un glissement de caméra.

    _shoot(sx, sy) {
        if (this.state.ammo <= 0) { this._playSound('empty'); return; }
        this.state.ammo--;
        this.cb.onAmmo?.(this.state.ammo, CFG.MAX_AMMO);
        this._playSound('shoot');
        this._spawnMuzzleFlash(sx, sy);
        this.state.shake = Math.min(this.state.shake + 5, 8);

        let hit = false;
        for (let i = this.bugs.length - 1; i >= 0; i--) {
            const bug = this.bugs[i];
            const { sx: bsx, sy: bsy, radius } = bug._screen;
            const hitR = radius * 1.6 + 22; // generous touch hitbox
            const dx = sx - bsx, dy = sy - bsy;
            if (dx * dx + dy * dy < hitR * hitR) {
                this._hitBug(bug, i);
                hit = true;
                break; // one bullet, one hit
            }
        }

        if (!hit) {
            this.state.combo = 0;
            this.cb.onCombo?.(0);
        }

        if (this.state.ammo <= 0) this._startReload();
    }

    _hitBug(bug, idx) {
        bug.flashTimer = 6;
        bug.hp--;
        this._playSound('hit');
        this._spawnBlood(bug._screen.sx, bug._screen.sy, bug._screen.radius);

        if (bug.hp <= 0) {
            // Kill
            this.state.kills++;
            this.state.waveKills++;
            this.state.combo++;
            const mult = 1 + Math.floor(this.state.combo / 3) * 0.5;
            const pts = Math.round(ARACHNIDS[bug.type].score * mult);
            this.state.score += pts;
            this._spawnKillBurst(bug._screen.sx, bug._screen.sy, bug._screen.radius, bug.type);
            this._playSound('kill');
            if (this.state.combo >= 3) this._playSound('combo');
            this.bugs.splice(idx, 1);
            this.cb.onScore?.(this.state.score, this.state.combo);
            this.cb.onKill?.(this.state.kills, bug.type, pts, this.state.combo);

            // Wave complete?
            if (this.state.waveKills >= this.state.waveTotal && this._spawnQueue.length === 0) {
                this._onWaveComplete();
            }
        }
    }

    _startReload() {
        if (this.state.reloading) return;
        this.state.reloading = true;
        this.state.reloadProgress = 0;
        this.cb.onReload?.(true, 0);
        this._playSound('reload');
    }

    _tickReload(dt) {
        if (!this.state.reloading) return;
        this.state.reloadProgress = Math.min(1, this.state.reloadProgress + dt / CFG.RELOAD_TIME);
        this.cb.onReload?.(true, this.state.reloadProgress);
        if (this.state.reloadProgress >= 1) {
            this.state.reloading = false;
            this.state.ammo = CFG.MAX_AMMO;
            this.cb.onAmmo?.(this.state.ammo, CFG.MAX_AMMO);
            this.cb.onReload?.(false, 1);
        }
    }

    // ── WAVE MANAGEMENT ─────────────────────────────────────────────────────────
    _spawnQueue = [];
    _spawnTimer = 0;

    startWave(waveIndex) {
        const wave = WAVES[waveIndex];
        if (!wave) { this._onVictory(); return; }
        this.state.wave = waveIndex;
        this.state.waveKills = 0;
        this.state.waveTotal = wave.bugs.reduce((s, b) => s + b.count, 0);
        this._spawnQueue = [];
        wave.bugs.forEach(({ type, count }) => {
            for (let i = 0; i < count; i++) this._spawnQueue.push(type);
        });
        // Shuffle
        for (let i = this._spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._spawnQueue[i], this._spawnQueue[j]] = [this._spawnQueue[j], this._spawnQueue[i]];
        }
        this._spawnTimer = wave.interval;
        this.cb.onWave?.(waveIndex, wave.label);
    }

    _tickSpawn(dt) {
        if (this._spawnQueue.length === 0) return;
        this._spawnTimer -= dt;
        if (this._spawnTimer <= 0) {
            const type = this._spawnQueue.shift();
            this._spawnBug(type);
            const wave = WAVES[this.state.wave];
            this._spawnTimer = wave ? wave.interval : 2500;
        }
    }

    _spawnBug(type) {
        const cfg = ARACHNIDS[type];
        // Random angle within ±90° of camera center
        const spawnAngle = (Math.random() - 0.5) * 160;
        const bug = {
            type, hp: cfg.hp,
            angle: spawnAngle, depth: CFG.SPAWN_DEPTH,
            lateralSpeed: (Math.random() - 0.5) * 0.15,
            flashTimer: 0,
            id: Math.random(),
            // zigzag phase
            phase: Math.random() * Math.PI * 2,
            _screen: { sx: 0, sy: 0, radius: 1 },
        };
        this.bugs.push(bug);
    }

    _tickBugs(dt) {
        const dtS = dt / 1000;
        for (let i = this.bugs.length - 1; i >= 0; i--) {
            const bug = this.bugs[i];
            const cfg = ARACHNIDS[bug.type];

            // Advance depth (move toward player)
            bug.depth += cfg.speed * dtS * (0.8 + bug.depth * 0.5);

            // Lateral movement
            if (cfg.behavior === 'strafe') {
                bug.angle += dtS * 20 * (Math.sin(bug.depth * 8) > 0 ? 1 : -1);
            } else if (cfg.behavior === 'zigzag') {
                bug.phase += dtS * 3;
                bug.angle += Math.sin(bug.phase) * dtS * 25;
            }

            if (bug.flashTimer > 0) bug.flashTimer--;

            // Bug reached player
            if (bug.depth >= CFG.GAMEOVER_DEPTH) {
                this.bugs.splice(i, 1);
                this._loseLife();
            }
        }
    }

    _loseLife() {
        if (!this.state.running) return;
        this.state.lives--;
        this.state.combo = 0;
        this.state.shake += 18;
        this._playSound('damage');
        this.cb.onLives?.(this.state.lives);
        this.cb.onCombo?.(0);
        if (this.state.lives <= 0) this._onGameOver();
    }

    _onWaveComplete() {
        if (this.state.wave >= WAVES.length - 1) {
            this._onVictory();
        } else {
            this._playSound('waveComplete');
            this.bugs = [];

            // WAIT STATE — on attend que l'utilisateur clique "Continuer"
            this.state.waitingNextWave = true;
            this.cb.onWaveComplete?.(this.state.wave, this.state.score);

            // PLUS DE TIMEOUT AUTOMATIQUE
        }
    }

    // Appelée par React
    nextWave() {
        if (!this.state.waitingNextWave) return;
        this.state.waitingNextWave = false;
        this.startWave(this.state.wave + 1);
    }

    _onGameOver() {
        this.state.running = false;
        this.cb.onGameOver?.(this.state.score, this.state.kills, false);
    }

    _onVictory() {
        this.state.running = false;
        this._playSound('victory');
        this.cb.onGameOver?.(this.state.score, this.state.kills, true);
    }

    // ── PARTICLES ────────────────────────────────────────────────────────────────
    _spawnMuzzleFlash(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: 0.18,
                r: 3 + Math.random() * 4,
                color: `${['#ffdd00', '#ff8800', '#ffffff'][Math.floor(Math.random() * 3)]}`,
                type: 'flash',
            });
        }
        // Central glow
        this.particles.push({ x, y, vx: 0, vy: 0, life: 1, decay: 0.35, r: 18, color: '#ffaa00', type: 'glow' });
    }

    _spawnBlood(x, y, radius) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4;
            this.particles.push({
                x: x + (Math.random() - 0.5) * radius,
                y: y + (Math.random() - 0.5) * radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 1,
                life: 1, decay: 0.05,
                r: 2 + Math.random() * 3,
                color: '#cc0000', type: 'blood',
                gravity: 0.15,
            });
        }
    }

    _spawnKillBurst(x, y, radius, type) {
        // Couleurs plus saturées pour l'effet "lighter"
        const colors = { warrior: '#ff5500', tanker: '#ff0000', plasma: '#ffcc00', hopper: '#ff00ff' };
        const c = colors[type] || '#ff0000';

        // Explosion principale (rapide)
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: 0.04 + Math.random() * 0.02,
                r: 4 + Math.random() * 6, // Plus grosses
                color: c, type: 'burst',
                gravity: 0.1,
            });
        }

        // Glow persistant (lent)
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: 0.02, // Plus lent
                r: 10 + Math.random() * 15, // Enorme glow
                color: c, type: 'glow',
                gravity: -0.05, // Flotte vers le haut
            });
        }
    }

    _tickParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.vx *= 0.92;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    // ── PROJECTION HELPERS ───────────────────────────────────────────────────────
    _project(bug) {
        // Normalisation d'angle robuste (différence modulo 360 centré sur 0)
        let da = (bug.angle - this.camera.angle + 540) % 360 - 180;

        const screenX = (da / (CFG.FOV / 2)) * (this.w / 2) + this.w / 2;
        const tiltOffset = this.camera.tilt * this.h;
        const horizon = this.horizonY + tiltOffset;
        const groundH = this.h - horizon;

        // Clamp depth to avoid negative/weird values
        const depth = Math.max(0, bug.depth);
        const screenY = horizon + depth * groundH * 0.92;

        // Scale relative to reference height 700px
        const size = ARACHNIDS[bug.type].baseSize * (0.08 + depth * 0.95) * (this.h / 700);

        bug._screen = { sx: screenX, sy: screenY, radius: size };
    }

    // ── RENDER ────────────────────────────────────────────────────────────────────
    // ── RENDER : TACTICAL VISIONS ────────────────────────────────────────────────
    _drawSky() {
        const { ctx, w, h } = this;
        // Fond noir tactique
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, w, h);
    }

    _drawStars() {
        const { ctx, w, h } = this;
        const horizon = this.horizonY + this.camera.tilt * this.h;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 255, 65, 0.4)'; // Vert terminal
        STARS.forEach(s => {
            const px = ((s.x + this.camera.angle * -0.002 / 360) % 1 + 1) % 1 * w;
            const py = s.y * horizon;
            if (Math.random() > 0.95) {
                ctx.globalAlpha = Math.random();
                ctx.fillRect(px, py, 1.5, 1.5);
            }
        });
        ctx.restore();
    }

    _drawGround() {
        const { ctx, w, h } = this;
        const horizon = this.horizonY + this.camera.tilt * this.h;

        // Sol dégradé sombre
        const g = ctx.createLinearGradient(0, horizon, 0, h);
        g.addColorStop(0, '#001100');
        g.addColorStop(1, '#000000');
        ctx.fillStyle = g;
        ctx.fillRect(0, horizon, w, h - horizon);

        // Grille perspective "Tron" / Tactical
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        const groundH = h - horizon;
        // Lignes horizontales exponentielles pour la profondeur
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const y = horizon + (t * t * t) * groundH;
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }

        // Lignes verticales fuyantes
        const fovScale = 4;
        const vanishX = w / 2 + (this.camera.angle * -4);

        for (let i = -20; i <= 20; i++) {
            const x = w / 2 + i * (w / 10);
            ctx.moveTo(vanishX, horizon);
            ctx.lineTo(x + (x - vanishX) * fovScale, h);
        }
        ctx.stroke();
        ctx.restore();

        // Ligne d'horizon brillante
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff41';
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        ctx.lineTo(w, horizon);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }


    _drawBug(bug) {
        const { ctx } = this;
        const { sx, sy, radius } = bug._screen;
        if (sx < -radius * 2 || sx > this.w + radius * 2) return;

        ctx.save();
        ctx.translate(sx, sy);

        // Effet de scan "Holographique"
        const scan = Math.sin(this.state.t * 0.02 + bug.id * 10) * 0.5 + 0.5;
        // Glow global de la cible
        ctx.shadowBlur = 15;
        ctx.shadowColor = ARACHNIDS[bug.type].accentColor;

        // Flash si touché (Bright White)
        if (bug.flashTimer > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
            // Reset comp op pour le reste
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.globalAlpha = 0.8 + scan * 0.2;

        // Draw by type (Geometry Style)
        switch (bug.type) {
            case 'tanker': this._drawTanker(ctx, radius, ARACHNIDS[bug.type]); break;
            case 'hopper': this._drawHopper(ctx, radius, ARACHNIDS[bug.type]); break;
            default: this._drawWarrior(ctx, radius, ARACHNIDS[bug.type], bug.type === 'plasma'); break;
        }

        // RETICULE DE VISEE (LOCK)
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = ARACHNIDS[bug.type].accentColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const r = radius * 1.2;
        ctx.moveTo(-r, -r / 2); ctx.lineTo(-r, -r); ctx.lineTo(-r / 2, -r);
        ctx.moveTo(r, -r / 2); ctx.lineTo(r, -r); ctx.lineTo(r / 2, -r);
        ctx.moveTo(-r, r / 2); ctx.lineTo(-r, r); ctx.lineTo(-r / 2, r);
        ctx.moveTo(r, r / 2); ctx.lineTo(r, r); ctx.lineTo(r / 2, r);
        ctx.stroke();

        ctx.restore();
    }

    _drawWarrior(ctx, r, cfg, isPlasma) {
        const col = cfg.accentColor;
        ctx.fillStyle = isPlasma ? '#ffaa00' : '#ff0000';

        // Triangle agressif
        ctx.beginPath();
        ctx.moveTo(0, r);       // Pointe bas
        ctx.lineTo(-r * 0.8, -r * 0.6); // Haut gauche
        ctx.lineTo(r * 0.8, -r * 0.6);  // Haut droite
        ctx.closePath();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `${col}44`; // Semi-transparent fill
        ctx.fill();

        // Yeux brillants
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.2, r * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    _drawTanker(ctx, r, cfg) {
        // Hexagone lourd
        const col = cfg.accentColor;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = `${col}66`;
        ctx.fill();

        // Core instable
        const pulse = Math.sin(this.state.t * 0.01) * 0.2 + 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
    }

    _drawHopper(ctx, r, cfg) {
        // Forme rapide (diamant)
        const col = cfg.accentColor;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.6, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.6, 0);
        ctx.closePath();

        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ailes rapides
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, 0); ctx.lineTo(-r * 1.5, -r * 0.5);
        ctx.moveTo(r * 0.6, 0); ctx.lineTo(r * 1.5, -r * 0.5);
        ctx.strokeStyle = `${col}88`;
        ctx.stroke();
    }

    _drawParticles() {
        const { ctx } = this;
        // ADDITIVE BLENDING FOR GLOW
        ctx.globalCompositeOperation = 'lighter';

        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            // Particules plus grosses pour effet bokeh
            ctx.arc(p.x, p.y, p.r * 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalCompositeOperation = 'source-over';
    }

    _drawVignette() {
        const { ctx, w, h } = this;
        // HUD Overlay tactique
        // (La vignette sombre est moins nécessaire avec le fond noir, on garde juste l'alerte rouge)

        // Danger vignette when low HP
        if (this.state.lives <= 1) {
            const pulse = 0.2 + 0.15 * Math.sin(this.state.t * 0.006);
            const dg = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.7);
            dg.addColorStop(0, 'transparent');
            dg.addColorStop(1, `rgba(200,0,0,${pulse})`);
            ctx.fillStyle = dg;
            ctx.fillRect(0, 0, w, h);
        }
    }

    _render() {
        const { ctx, w, h } = this;
        // Effacer propre au début
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, w, h);

        try {
            // Camera shake
            const shakeX = this.state.shake > 0 ? (Math.random() - 0.5) * this.state.shake : 0;
            const shakeY = this.state.shake > 0 ? (Math.random() - 0.5) * this.state.shake : 0;
            if (this.state.shake > 0) {
                ctx.save();
                ctx.translate(shakeX, shakeY);
            }

            this._drawSky();
            this._drawStars();
            this._drawGround();

            // Project and sort bugs (far to near)
            this.bugs.forEach(b => {
                try { this._project(b); } catch (e) { }
            });

            const sorted = [...this.bugs].sort((a, b) => a.depth - b.depth);
            sorted.forEach(b => {
                try { this._drawBug(b); } catch (e) { }
            });

            try { this._drawParticles(); } catch (e) { }
            try { this._drawVignette(); } catch (e) { }

            if (this.state.shake > 0) ctx.restore();

        } catch (err) {
            // Panic screen on mobile
            ctx.fillStyle = 'red';
            ctx.font = '20px monospace';
            ctx.fillText('GPU ERROR: ' + err.message, 20, h / 2);
            console.error(err);
        }
    }

    // ── MAIN LOOP ────────────────────────────────────────────────────────────────
    _loop(ts) {
        if (!this.state.running || this.state.paused) return;

        const dt = Math.min(ts - (this._lastTs || ts), 50); // cap at 50ms
        this._lastTs = ts;

        try {
            this.state.t += dt;
            this.state.shake = Math.max(0, this.state.shake - 0.8);

            this._tickSpawn(dt);
            this._tickBugs(dt);
            this._tickParticles(dt);
            this._tickReload(dt);

            this._render();
        } catch (e) {
            console.error("🔥 FIREBASE ENGINE CRASH:", e);
        }

        this._raf = requestAnimationFrame(this._loop);
    }

    // ── PUBLIC API ───────────────────────────────────────────────────────────────
    start() {
        this.state.running = true;
        this.state.score = 0; this.state.kills = 0; this.state.combo = 0;
        this.state.lives = CFG.MAX_LIVES; this.state.ammo = CFG.MAX_AMMO;
        this.state.t = 0;
        this.bugs = [];
        this.particles = [];
        this._spawnQueue = [];

        this._setupInputs();

        this.cb.onAmmo?.(CFG.MAX_AMMO, CFG.MAX_AMMO);
        this.cb.onLives?.(CFG.MAX_LIVES);
        this.cb.onScore?.(0, 0);

        this.startWave(0);
        this._lastTs = performance.now();
        this._raf = requestAnimationFrame(this._loop);
    }

    pause() { this.state.paused = true; cancelAnimationFrame(this._raf); }
    resume() {
        this.state.paused = false;
        this._lastTs = performance.now();
        this._raf = requestAnimationFrame(this._loop);
    }

    stop() {
        this.state.running = false;
        cancelAnimationFrame(this._raf);
    }

    destroy() {
        this.stop();
        window.removeEventListener('deviceorientation', this._onGyro, true);
        document.removeEventListener('visibilitychange', this._visibilityChange);
        // Supprimer tous les listeners via les refs stockées
        if (this._inputListeners) {
            this._inputListeners.forEach(([evt, fn]) => this.canvas.removeEventListener(evt, fn));
            this._inputListeners = [];
        }
        if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null; }
    }

    _setupInputs() {
        // État interne du toucher courant
        let _touch = { x: 0, y: 0, t: 0, moved: false };

        // ── MOBILE : touchstart / touchmove / touchend ────────────────────────
        const onTouchStart = (e) => {
            const t = e.touches[0];
            _touch = { x: t.clientX, y: t.clientY, t: Date.now(), moved: false };
            this.fallbackDrag.active = true;
            this.fallbackDrag.lastX = t.clientX;
        };

        const onTouchMove = (e) => {
            if (!this.fallbackDrag.active) return;
            const t = e.touches[0];
            const dx = t.clientX - this.fallbackDrag.lastX;
            this.fallbackDrag.lastX = t.clientX;
            const dist = Math.abs(t.clientX - _touch.x) + Math.abs(t.clientY - _touch.y);
            if (dist > 10) _touch.moved = true;
            // Panoramique caméra seulement si pas de gyro
            if (!this.gyroAvailable && _touch.moved) {
                this.camera.angle += dx * 0.3;
                this.camera.angle = Math.max(-140, Math.min(140, this.camera.angle));
            }
        };

        const onTouchEnd = (e) => {
            this.fallbackDrag.active = false;
            const ct = e.changedTouches[0];
            const elapsed = Date.now() - _touch.t;
            const dist = Math.hypot(ct.clientX - _touch.x, ct.clientY - _touch.y);
            // Tap = court (<350ms) et peu de mouvement (<20px)
            if (elapsed < 350 && dist < 20 && !_touch.moved) {
                if (!this.state.running || this.state.paused || this.state.reloading) return;
                const rect = this.canvas.getBoundingClientRect();
                this._shoot(ct.clientX - rect.left, ct.clientY - rect.top);
            }
        };

        // ── DESKTOP : mousedown / mousemove / mouseup ─────────────────────────
        let _mouseDown = false, _mouseMoved = false, _mouseStart = { x: 0, y: 0 };

        const onMouseDown = (e) => {
            _mouseDown = true;
            _mouseMoved = false;
            _mouseStart = { x: e.clientX, y: e.clientY };
            this.fallbackDrag.active = true;
            this.fallbackDrag.lastX = e.clientX;
        };

        const onMouseMove = (e) => {
            if (!_mouseDown) return;
            const dx = e.clientX - this.fallbackDrag.lastX;
            this.fallbackDrag.lastX = e.clientX;
            if (Math.abs(e.clientX - _mouseStart.x) > 5) _mouseMoved = true;
            if (!this.gyroAvailable && _mouseMoved) {
                this.camera.angle += dx * 0.3;
                this.camera.angle = Math.max(-140, Math.min(140, this.camera.angle));
            }
        };

        const onMouseUp = (e) => {
            _mouseDown = false;
            this.fallbackDrag.active = false;
            // Si pas de drag significatif = clic = tirer
            if (!_mouseMoved) {
                if (!this.state.running || this.state.paused || this.state.reloading) return;
                const rect = this.canvas.getBoundingClientRect();
                this._shoot(e.clientX - rect.left, e.clientY - rect.top);
            }
            _mouseMoved = false;
        };

        this._inputListeners = [
            ['touchstart', onTouchStart, { passive: true }],
            ['touchmove', onTouchMove, { passive: true }],
            ['touchend', onTouchEnd, { passive: true }],
            ['mousedown', onMouseDown],
            ['mousemove', onMouseMove],
            ['mouseup', onMouseUp],
        ];
        this._inputListeners.forEach(([evt, fn, opts]) =>
            this.canvas.addEventListener(evt, fn, opts)
        );
    }

    _visibilityChange() {
        if (document.hidden) this.pause();
        else if (this.state.running) this.resume();
    }

    // ── AUDIO ────────────────────────────────────────────────────────────────────
    _getAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        return this.audioCtx;
    }

    _playSound(type) {
        try {
            const ac = this._getAudio();
            const now = ac.currentTime;
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);

            switch (type) {
                case 'shoot':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
                    gain.gain.setValueAtTime(0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                    osc.start(now); osc.stop(now + 0.12);
                    break;
                case 'hit':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now); osc.stop(now + 0.15);
                    break;
                case 'kill':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.setValueAtTime(350, now + 0.05);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    osc.start(now); osc.stop(now + 0.25);
                    break;
                case 'combo':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.setValueAtTime(900, now + 0.08);
                    osc.frequency.setValueAtTime(1200, now + 0.16);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now); osc.stop(now + 0.3);
                    break;
                case 'empty':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.setValueAtTime(200, now + 0.05);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now); osc.stop(now + 0.08);
                    break;
                case 'damage':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(100, now);
                    gain.gain.setValueAtTime(0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    osc.start(now); osc.stop(now + 0.4);
                    break;
                case 'reload':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.setValueAtTime(600, now + CFG.RELOAD_TIME / 2000);
                    osc.frequency.setValueAtTime(800, now + CFG.RELOAD_TIME / 1000);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + CFG.RELOAD_TIME / 1000);
                    osc.start(now); osc.stop(now + CFG.RELOAD_TIME / 1000);
                    break;
                case 'waveComplete':
                    [500, 700, 900, 1100].forEach((freq, i) => {
                        const o2 = ac.createOscillator();
                        const g2 = ac.createGain();
                        o2.connect(g2); g2.connect(ac.destination);
                        o2.type = 'sine';
                        o2.frequency.value = freq;
                        g2.gain.setValueAtTime(0.12, now + i * 0.1);
                        g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                        o2.start(now + i * 0.1); o2.stop(now + i * 0.1 + 0.25);
                    });
                    break;
                case 'victory':
                    [500, 700, 900, 1200, 1500].forEach((freq, i) => {
                        const o2 = ac.createOscillator();
                        const g2 = ac.createGain();
                        o2.connect(g2); g2.connect(ac.destination);
                        o2.type = 'square';
                        o2.frequency.value = freq;
                        g2.gain.setValueAtTime(0.15, now + i * 0.12);
                        g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
                        o2.start(now + i * 0.12); o2.stop(now + i * 0.12 + 0.2);
                    });
                    break;
            }
        } catch (e) { /* audio ctx not available */ }
    }
}
