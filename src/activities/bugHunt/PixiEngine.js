
/**
 * BugHunt Game Engine — Canvas 2D Native
 * Style Pixel Art Néon : Fonctionne sur tous les appareils sans dépendances externes.
 * Architecture : Parallaxe multi-layers + Warrior sprite sheet animé + Particules.
 */

const CFG = {
    RES_W: 480,
    RES_H: 270,
    MAX_AMMO: 10,
    MAX_LIVES: 5,
};

const C = {
    BG: '#020008',
    GROUND: '#110a22',
    WARRIOR: '#ff0044',
    WARRIOR2: '#cc0033',
    HOPPER: '#cc00ff',
    BULLET: '#ffff44',
    STAR: '#ffffff',
    GRID: '#440066',
    SKY_TOP: '#020010',
    SKY_BOT: '#120030',
};

// ─── PARTICLE SYSTEM ──────────────────────────────────────────────────────────
class Particles {
    constructor() { this.pool = []; }

    explode(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const sz = Math.random() < 0.3 ? 4 : 2;
            const a = Math.random() * Math.PI * 2;
            const spd = Math.random() * 5 + 2;
            this.pool.push({
                x, y, sz,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                color, life: 1,
                decay: 0.04 + Math.random() * 0.04,
            });
        }
    }

    update() {
        for (let i = this.pool.length - 1; i >= 0; i--) {
            const p = this.pool[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.12;
            p.life -= p.decay;
            if (p.life <= 0) this.pool.splice(i, 1);
        }
    }

    draw(ctx) {
        this.pool.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x - p.sz / 2), Math.round(p.y - p.sz / 2), p.sz, p.sz);
        });
        ctx.globalAlpha = 1;
    }
}

// ─── SPRITE SHEET ANIMATION ───────────────────────────────────────────────────
class SpriteAnim {
    constructor(img, cols, rows, fps = 8) {
        this.img = img;
        this.cols = cols;
        this.rows = rows;
        this.fw = Math.floor(img.naturalWidth / cols);
        this.fh = Math.floor(img.naturalHeight / rows);
        this.fps = fps;
        this.frame = 0;
        this.t = 0;
        this.row = 0; // 0=walk, 1=attack
    }

    update(dt) {
        this.t += dt;
        if (this.t > 1000 / this.fps) {
            this.t = 0;
            this.frame = (this.frame + 1) % this.cols;
        }
    }

    draw(ctx, x, y, targetH, flipX = false) {
        const scale = targetH / this.fh;
        const dw = this.fw * scale;
        const dh = targetH;
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        if (flipX) { ctx.scale(-1, 1); }
        ctx.drawImage(
            this.img,
            this.frame * this.fw, this.row * this.fh,
            this.fw, this.fh,
            -dw / 2, -dh,      // centered X, bottom-aligned Y
            dw, dh,
        );
        ctx.restore();
    }
}

// ─── STAR FIELD ───────────────────────────────────────────────────────────────
function buildStars(n = 100) {
    return Array.from({ length: n }, () => ({
        x: Math.random() * CFG.RES_W * 3 - CFG.RES_W,
        y: Math.random() * CFG.RES_H * 0.65,
        r: Math.random() > 0.92 ? 1.5 : 0.8,
        a: Math.random() * 0.5 + 0.5,
    }));
}

// ─── ENGINE ───────────────────────────────────────────────────────────────────
export class PixiEngine {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cb = callbacks;
        this._dead = false;
        this._rafId = null;

        // Virtual resolution → we draw in 480×270 then scale
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.state = {
            running: false, score: 0,
            wave: 0, ammo: CFG.MAX_AMMO, lives: CFG.MAX_LIVES,
            camX: 0,
        };

        this.bugs = [];
        this.particles = new Particles();
        this.stars = buildStars();
        this.warriorAnim = null;  // set after loadAssets

        // Procedural mountain jags (built once)
        this._mtnFar = this._buildJag(0.55, 12);
        this._mtnNear = this._buildJag(0.65, 20);

        // Texture holders  
        this._bgTextures = { sky: null, mtnFar: null, mtnNear: null, ground: null };
        this._texOffsets = { sky: 0, mtnFar: 0, mtnNear: 0, ground: 0 };

        // Bind loop
        this._loop = this._loop.bind(this);
        this._lastTS = 0;

        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._bindInput();
    }

    // ─── ASYNC INIT (load assets) ─────────────────────────────────────────────
    async init() {
        await this._loadAssets();
        console.log('✅ Canvas2D Engine ready');
    }

    async _loadAssets() {
        const load = (src) => new Promise((res) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = () => res(null);
            img.src = src;
        });

        const [sky, mtnFar, mtnNear, ground, warrior] = await Promise.all([
            load('/assets/bughunt/sky.png'),
            load('/assets/bughunt/mountains_far.png'),
            load('/assets/bughunt/mountains_near.png'),
            load('/assets/bughunt/ground.png'),
            load('/assets/bughunt/warrior.png'),
        ]);

        this._bgTextures = { sky, mtnFar, mtnNear, ground };

        if (warrior) {
            this.warriorAnim = new SpriteAnim(warrior, 6, 2, 8);
            console.log(`✅ Warrior ${warrior.naturalWidth}×${warrior.naturalHeight}`);
        }
    }

    // ─── CANVAS SIZING ────────────────────────────────────────────────────────
    _resize() {
        const canvas = this.canvas;
        // Match CSS layout dimensions
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        canvas.width = w * this.dpr;
        canvas.height = h * this.dpr;
        this._screenW = w;
        this._screenH = h;

        // Scale factor: how much to scale 480×270 to fill the screen
        this._scale = Math.max(w / CFG.RES_W, h / CFG.RES_H) * this.dpr;
        this._offX = (canvas.width - CFG.RES_W * this._scale) / 2;
        this._offY = (canvas.height - CFG.RES_H * this._scale) / 2;
    }

    // ─── LIFECYCLE ────────────────────────────────────────────────────────────
    start() {
        if (this._dead || this.state.running) return;
        this.state.running = true;
        this._lastTS = performance.now();
        this._rafId = requestAnimationFrame(this._loop);
        this.nextWave();
    }

    stop() {
        this.state.running = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }

    destroy() {
        this._dead = true;
        this.stop();
    }

    // ─── WAVE LOGIC ───────────────────────────────────────────────────────────
    nextWave() {
        this.state.wave++;
        this.cb.onWave?.(this.state.wave);
        const n = 3 + this.state.wave * 2;
        for (let i = 0; i < n; i++) {
            setTimeout(() => { if (!this._dead) this._spawnBug(); }, i * 1500);
        }
    }

    _spawnBug() {
        const side = Math.random() > 0.5 ? 1 : -1;
        const spd = (0.5 + Math.random() * 0.5) * -side;
        this.bugs.push({
            x: (CFG.RES_W / 2 + 80) * side,
            y: CFG.RES_H * 0.70,
            spd, hp: 2,
            t: Math.random() * 10,
            anim: this.warriorAnim ? new SpriteAnim(
                this.warriorAnim.img, 6, 2, 8
            ) : null,
            flipX: side > 0, // Coming from right → flip to face left
        });
    }

    // ─── INPUT ────────────────────────────────────────────────────────────────
    _bindInput() {
        let lastX = 0, down = false, t0 = 0;
        const cx = (e) => (e.touches ? e.touches[0] : e).clientX;
        const cy = (e) => (e.touches ? e.touches[0] : e).clientY;

        const onDown = (e) => { e.preventDefault(); down = true; lastX = cx(e); t0 = Date.now(); };
        const onMove = (e) => {
            if (!down) return;
            e.preventDefault();
            const dx = cx(e) - lastX;
            lastX = cx(e);
            this.state.camX = Math.max(-CFG.RES_W, Math.min(CFG.RES_W, this.state.camX - dx * 0.4));
        };
        const onUp = (e) => {
            down = false;
            if (Date.now() - t0 < 250) {
                const src = e.changedTouches ? e.changedTouches[0] : e;
                this._shoot(src.clientX, src.clientY);
            }
        };

        this.canvas.addEventListener('touchstart', onDown, { passive: false });
        this.canvas.addEventListener('touchmove', onMove, { passive: false });
        this.canvas.addEventListener('touchend', onUp);
        this.canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    _shoot(clientX, clientY) {
        // Convert screen coords → virtual world coords
        const vx = (clientX * this.dpr - this._offX) / this._scale - this.state.camX;
        const vy = (clientY * this.dpr - this._offY) / this._scale;

        this.particles.explode(vx + this.state.camX, vy, C.BULLET, 8);

        for (let i = this.bugs.length - 1; i >= 0; i--) {
            const b = this.bugs[i];
            if (Math.abs(b.x - vx) < 32 && Math.abs(b.y - vy) < 40) {
                b.hp--;
                if (b.hp <= 0) {
                    this.particles.explode(b.x + this.state.camX, b.y, '#ff4422', 20);
                    this.bugs.splice(i, 1);
                    this.state.score += 100;
                    this.cb.onScore?.(this.state.score);
                }
                break;
            }
        }
        this.state.ammo = Math.max(0, this.state.ammo - 1);
        this.cb.onAmmo?.(this.state.ammo);
    }

    // ─── MAIN LOOP ────────────────────────────────────────────────────────────
    _loop(ts) {
        if (this._dead || !this.state.running) return;
        this._rafId = requestAnimationFrame(this._loop);

        const dt = Math.min((ts - this._lastTS) / 16.67, 3); // Normalized to 60fps
        this._lastTS = ts;

        // Update
        this.particles.update();
        const now = ts * 0.006;
        for (const b of this.bugs) {
            b.x += b.spd * dt;
            b.y = CFG.RES_H * 0.70 + Math.sin(now + b.t) * 3;
            if (b.anim) b.anim.update(dt * 16.67);
        }

        // Draw
        this._render();
    }

    // ─── RENDER ───────────────────────────────────────────────────────────────
    _render() {
        const { ctx } = this;
        const { camX } = this.state;
        const { _scale: sc, _offX: ox, _offY: oy } = this;

        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // ── Enter virtual coordinate space ────────────────────────────────────
        ctx.translate(ox, oy);
        ctx.scale(sc, sc);

        // ── Sky ───────────────────────────────────────────────────────────────
        if (this._bgTextures.sky) {
            const { sky } = this._bgTextures;
            const tw = sky.naturalWidth;
            const th = sky.naturalHeight;
            const off = ((-camX * 0.05) % tw + tw) % tw; // Wrap offset
            for (let x = -off; x < CFG.RES_W; x += tw) {
                ctx.drawImage(sky, x, 0, tw, th);
            }
        } else {
            // Procedural gradient sky
            const grd = ctx.createLinearGradient(0, 0, 0, CFG.RES_H * 0.75);
            grd.addColorStop(0, C.SKY_TOP);
            grd.addColorStop(1, C.SKY_BOT);
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, CFG.RES_W, CFG.RES_H * 0.75);
            // Stars (scroll slowly)
            const starOff = ((-camX * 0.05) % CFG.RES_W + CFG.RES_W) % CFG.RES_W;
            this.stars.forEach(s => {
                ctx.globalAlpha = s.a;
                ctx.fillStyle = C.STAR;
                ctx.fillRect((s.x + starOff) % (CFG.RES_W * 2), s.y, s.r * 2, s.r * 2);
            });
            ctx.globalAlpha = 1;
        }

        // ── Mountains Far ─────────────────────────────────────────────────────
        this._drawBgLayer(this._bgTextures.mtnFar, 0.15, 0.65);
        if (!this._bgTextures.mtnFar) this._drawJag(ctx, this._mtnFar, '#1a0a38', 0.15);

        // ── Mountains Near ────────────────────────────────────────────────────
        this._drawBgLayer(this._bgTextures.mtnNear, 0.35, 0.72);
        if (!this._bgTextures.mtnNear) this._drawJag(ctx, this._mtnNear, '#2a0a20', 0.35);

        // ── Ground ────────────────────────────────────────────────────────────
        if (this._bgTextures.ground) {
            this._drawBgLayer(this._bgTextures.ground, 1.0, 0.75);
        } else {
            this._drawGround(ctx);
        }

        // ── Entities (in camera space) ─────────────────────────────────────
        ctx.save();
        ctx.translate(-camX, 0); // Shift world by camera

        // Bugs
        this.bugs.forEach(b => {
            if (b.anim) {
                b.anim.draw(ctx, b.x, b.y, 60, b.flipX);
            } else {
                // Procedural placeholder
                ctx.fillStyle = C.WARRIOR;
                ctx.fillRect(b.x - 8, b.y - 20, 16, 20);
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(b.x - 5, b.y - 17, 3, 3);
                ctx.fillRect(b.x + 2, b.y - 17, 3, 3);
            }
        });

        // Particles
        this.particles.draw(ctx);

        ctx.restore();

        // ── Vignette ─────────────────────────────────────────────────────────
        const vgrd = ctx.createRadialGradient(
            CFG.RES_W / 2, CFG.RES_H / 2, CFG.RES_H * 0.2,
            CFG.RES_W / 2, CFG.RES_H / 2, CFG.RES_H * 0.85
        );
        vgrd.addColorStop(0, 'transparent');
        vgrd.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = vgrd;
        ctx.fillRect(0, 0, CFG.RES_W, CFG.RES_H);

        ctx.restore(); // ← Back to screen space
    }

    _drawBgLayer(img, parallax, yRatio) {
        if (!img) return;
        const ctx = this.ctx;
        const tw = img.naturalWidth;
        const th = img.naturalHeight;
        const off = ((-this.state.camX * parallax) % tw + tw) % tw;
        const y = CFG.RES_H * yRatio - th;
        for (let x = -off; x < CFG.RES_W + tw; x += tw) {
            ctx.drawImage(img, Math.round(x), Math.round(y), tw, th);
        }
    }

    _drawGround(ctx) {
        const hy = CFG.RES_H * 0.70;
        ctx.fillStyle = C.GROUND;
        ctx.fillRect(0, hy, CFG.RES_W, CFG.RES_H - hy);
        // Neon grid lines
        ctx.strokeStyle = C.GRID;
        ctx.lineWidth = 0.5;
        const vp = { x: CFG.RES_W / 2, y: hy };
        for (let x = -CFG.RES_W; x <= CFG.RES_W * 2; x += 32) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, hy);
            ctx.lineTo(vp.x + (x - vp.x) * 4, CFG.RES_H + 50);
            ctx.stroke();
        }
        for (let r = 0; r < 7; r++) {
            const t = r / 6;
            const y = hy + t * (CFG.RES_H - hy + 20);
            ctx.globalAlpha = 0.5 - r * 0.06;
            ctx.beginPath();
            ctx.moveTo(0, y); ctx.lineTo(CFG.RES_W, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    _buildJag(yRatio, heights) {
        const pts = [];
        const n = 20;
        for (let i = 0; i <= n; i++) {
            pts.push({ x: (i / n) * CFG.RES_W, y: CFG.RES_H * yRatio - Math.random() * heights });
        }
        return pts;
    }

    _drawJag(ctx, pts, color, parallax) {
        const off = -this.state.camX * parallax;
        ctx.save();
        ctx.translate(off, 0);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(CFG.RES_W, CFG.RES_H);
        ctx.lineTo(0, CFG.RES_H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Legacy
    calibrate() { }
    enableGyro() { }
}
