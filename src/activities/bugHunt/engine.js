/**
 * 🎮 Moteur de Jeu "BUG HUNT" - Mobile First V3
 * - Tap to Shoot instantané (pas de crosshair lag).
 * - Hitbox généreuses pour le tactile.
 * - Gestion assets personnalisés.
 */

// Configuration des insectes
const BUGS_CONFIG = {
    small: { speed: 4.5, hp: 1, score: 50, color: '#ef4444', size: 50, type: 'small', sprite: 'warrior' }, // Size augmenté 40->50
    tank: { speed: 2.0, hp: 3, score: 100, color: '#f59e0b', size: 80, type: 'tank', sprite: 'tank' },
    jumper: { speed: 6.0, hp: 1, score: 150, color: '#a3e635', size: 45, type: 'jumper', sprite: 'warrior' }
};

// Configuration du jeu
const GAME_CONFIG = {
    MAX_LIVES: 3,
    MAX_AMMO: 6,
    SPAWN_BASE_RATE: 2000,
    DIFFICULTY_SCALE: 0.9,
    GRAVITY: 0.2
};

export class BugHuntEngine {
    constructor(canvas, callbacks = {}) {
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.canvas = canvas;
        this.callbacks = callbacks;
        this.audioCtx = null;

        // Initialisation de la taille du canvas
        this.width = canvas.width;
        this.height = canvas.height;

        // Assets
        this.assets = {
            bg: new Image(),
            warrior: new Image(),
            tank: new Image()
        };

        // Chemins
        this.assets.bg.src = '/images/bughunt/background.jpg';
        this.assets.warrior.src = '/images/bughunt/warrior.png';
        this.assets.tank.src = '/images/bughunt/tank.png';

        // State
        this.state = {
            running: false,
            paused: false,
            lastTime: 0,
            score: 0,
            combo: 0,
            lives: GAME_CONFIG.MAX_LIVES,
            ammo: GAME_CONFIG.MAX_AMMO,
            difficulty: 1,
            timeSinceStart: 0,
            nextSpawnTime: 0
        };

        this.bugs = [];
        this.particles = [];
        this.nests = [];

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);

        this.loop = this.loop.bind(this);
        this.visibilityHandler = () => {
            if (document.hidden) this.pause();
            else this.resume();
        };

        this.init();
    }

    init() {
        this.resize();
        this.setupInputs();
        document.addEventListener('visibilitychange', this.visibilityHandler);

        if (!this.width) this.width = window.innerWidth;
        if (!this.height) this.height = window.innerHeight;

        const step = this.width / 7;
        for (let i = 1; i <= 6; i++) {
            this.nests.push({ x: step * i, y: this.height - 20 });
        }
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        const step = this.width / 7;
        this.nests = [];
        for (let i = 1; i <= 6; i++) {
            this.nests.push({ x: step * i, y: this.height - 20 });
        }
    }

    setupInputs() {
        // MOBILE : Touch Start = Shoot immédiat
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Empêche scroll/zoom et mouse emulation
            if (!this.state.running || this.state.paused) return;

            const rect = this.canvas.getBoundingClientRect();
            // On gère le premier doigt
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.shoot(x, y);
        }, { passive: false });

        // DESKTOP : Mouse Down = Shoot
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.state.running || this.state.paused) return;
            const rect = this.canvas.getBoundingClientRect();
            this.shoot(e.clientX - rect.left, e.clientY - rect.top);
        });
    }

    destroy() {
        this.stop();
        this.resizeObserver.disconnect();
        // Remove listeners not easy without named functions, but instance destroying handles memory mostly
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        if (this.audioCtx) this.audioCtx.close();
    }

    start() {
        if (this.state.running) return;
        this.state.running = true;
        this.state.lastTime = performance.now();
        this.state.lives = GAME_CONFIG.MAX_LIVES;
        this.state.score = 0;
        this.state.ammo = GAME_CONFIG.MAX_AMMO;
        this.bugs = [];
        this.particles = [];

        if (this.callbacks.onLives) this.callbacks.onLives(this.state.lives);
        if (this.callbacks.onScore) this.callbacks.onScore(0, 0);
        if (this.callbacks.onAmmo) this.callbacks.onAmmo(this.state.ammo);

        requestAnimationFrame(this.loop);
    }

    stop() {
        this.state.running = false;
    }

    pause() {
        this.state.paused = true;
    }

    resume() {
        this.state.paused = false;
        this.state.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    playSound(type) {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;

            switch (type) {
                case 'shoot':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                case 'hit':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
                case 'empty':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(800, now);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;
            }
        } catch (e) { }
    }

    spawnBug() {
        const nest = this.nests[Math.floor(Math.random() * this.nests.length)];
        const types = Object.keys(BUGS_CONFIG);
        const typeKey = types[Math.floor(Math.random() * types.length)];
        const config = BUGS_CONFIG[typeKey];

        const angle = -Math.PI / 2 + (Math.random() * 0.8 - 0.4);
        const speed = config.speed * this.state.difficulty;

        this.bugs.push({
            x: nest.x,
            y: nest.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            ...config,
            id: Date.now() + Math.random(),
            spawnTime: Date.now()
        });
    }

    shoot(x, y) {
        if (this.state.ammo <= 0) {
            this.playSound('empty');
            return;
        }

        this.state.ammo--;
        if (this.callbacks.onAmmo) this.callbacks.onAmmo(this.state.ammo);
        this.playSound('shoot');

        // Particule de tir (muzzle flash à l'endroit du tir)
        this.particles.push({ x, y, vx: 0, vy: 0, life: 0.5, color: '#ffff00', type: 'flash' });

        let hit = false;
        for (let i = this.bugs.length - 1; i >= 0; i--) {
            const bug = this.bugs[i];

            // HITBOX TACTILE GENEREUSE (+50% du rayon visuel + 20px marge)
            const hitboxRadius = (bug.size / 2) * 1.5 + 20;

            const dx = x - bug.x;
            const dy = y - bug.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < hitboxRadius) {
                this.hitBug(bug, i);
                hit = true;
                break;
            }
        }

        if (!hit) {
            this.state.combo = 0;
            if (this.callbacks.onScore) this.callbacks.onScore(this.state.score, 0);
        }
    }

    hitBug(bug, index) {
        bug.hp--;
        this.playSound('hit');

        // Sparkles
        for (let k = 0; k < 5; k++) {
            this.particles.push({
                x: bug.x, y: bug.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: '#fff'
            });
        }

        if (bug.hp <= 0) {
            this.bugs.splice(index, 1);
            this.state.combo++;
            const points = bug.score * (1 + (this.state.combo * 0.1));
            this.state.score += Math.floor(points);

            if (this.callbacks.onScore) this.callbacks.onScore(this.state.score, this.state.combo);

            // Gore
            for (let k = 0; k < 15; k++) {
                this.particles.push({
                    x: bug.x, y: bug.y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1.0,
                    color: '#22c55e'
                });
            }
        } else {
            bug.flash = 5;
        }
    }

    update(dt) {
        this.state.timeSinceStart += dt;
        if (this.state.timeSinceStart > 10000 * this.state.difficulty) {
            this.state.difficulty *= 1.1;
        }

        this.state.nextSpawnTime -= dt;
        if (this.state.nextSpawnTime <= 0) {
            this.spawnBug();
            this.state.nextSpawnTime = GAME_CONFIG.SPAWN_BASE_RATE / this.state.difficulty;
        }

        for (let i = this.bugs.length - 1; i >= 0; i--) {
            const bug = this.bugs[i];
            bug.x += bug.vx;
            bug.y += bug.vy;
            if (bug.flash > 0) bug.flash--;

            if (bug.x < -100 || bug.x > this.width + 100 || bug.y < -100 || bug.y > this.height + 100) {
                this.bugs.splice(i, 1);
                this.loseLife();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.type === 'flash') {
                p.life -= 0.2; // Flash rapide
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.05;
            }
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    loseLife() {
        this.state.lives--;
        if (this.callbacks.onLives) this.callbacks.onLives(this.state.lives);
        this.state.combo = 0;
        if (this.callbacks.onScore) this.callbacks.onScore(this.state.score, 0);
        if (this.state.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.state.running = false;
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.state.score);
    }

    draw() {
        const { ctx, width, height } = this;

        // Background
        if (this.assets.bg.complete && this.assets.bg.naturalWidth > 0) {
            ctx.drawImage(this.assets.bg, 0, 0, width, height);
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, width, height);

            // Grid lines
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            for (let i = 0; i < width; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
            for (let i = 0; i < height; i += 50) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
            ctx.stroke();
        }

        // Insectes
        this.bugs.forEach(bug => {
            ctx.save();
            ctx.translate(bug.x, bug.y);

            if (bug.vx < 0) ctx.scale(-1, 1);

            if (bug.flash > 0) {
                ctx.filter = 'brightness(500%) sepia(100%) hue-rotate(-50deg)';
                ctx.globalAlpha = 0.8;
            }

            const img = this.assets[bug.sprite];
            if (img && img.complete && img.naturalWidth > 0) {
                const scale = bug.type === 'tank' ? 2.0 : 1.8;
                const s = bug.size * scale;
                ctx.drawImage(img, -s / 2, -s / 2, s, s);
            } else {
                // FALLBACK si sprite manquant (Rond coloré)
                ctx.fillStyle = bug.color;
                ctx.beginPath();
                ctx.arc(0, 0, bug.size / 2, 0, Math.PI * 2);
                ctx.fill();

                // Yeux pour direction
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(bug.size / 4, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            if (bug.flash > 0) ctx.filter = 'none';
            ctx.restore();

            // HP Bar
            if (bug.hp > 1) {
                const maxHp = BUGS_CONFIG[bug.type].hp;
                const ratio = bug.hp / maxHp;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(bug.x - 20, bug.y - 50, 40, 6);
                ctx.fillStyle = ratio > 0.5 ? '#22c55e' : '#ef4444';
                ctx.fillRect(bug.x - 20, bug.y - 50, 40 * ratio, 6);
            }
        });

        // Particules
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            if (p.type === 'flash') {
                ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
            } else {
                ctx.arc(p.x, p.y, p.color === '#fff' ? 3 : 5, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // PLUS DE CROSSHAIR (Mobile)
    }

    loop(timestamp) {
        if (!this.state.running || this.state.paused) return;
        if (!this.width || !this.height) this.resize();

        try {
            const dt = timestamp - this.state.lastTime;
            this.state.lastTime = timestamp;
            this.update(dt);
            this.draw();
            requestAnimationFrame(this.loop);
        } catch (e) {
            console.error('Game fatal', e);
            this.stop();
        }
    }
}
