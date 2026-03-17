import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// CONFIG
// ============================================
const G = 800;
const DT = 1 / 60;
const TRAIL_LENGTH = 100;
const PROBE_RADIUS = 8;
const STAR_RADIUS = 12;
const TARGET_RADIUS = 28;
const LAUNCH_POWER = 0.35;
const W = 800;
const H = 800;

// Apollo 13 palette
const C = {
  bg: '#060a10',
  grid: 'rgba(20,45,20,0.12)',
  amber: '#d4a017',
  amberDim: '#7a5a10',
  amberGlow: 'rgba(212,160,23,',
  green: '#33cc33',
  greenDim: '#1a661a',
  greenGlow: 'rgba(51,204,51,',
  red: '#cc3333',
  cream: '#d8cbb8',
  steel: '#8899aa',
};

// Sprite paths (fallback to canvas if not loaded)
const SPRITE_PATHS = {
  capsule: '/assets/slingshot/capsule.png',
  earth: '/assets/slingshot/earth.png',
  moon: '/assets/slingshot/moon.png',
  mars: '/assets/slingshot/mars.png',
  planet: '/assets/slingshot/planet.png',
  blackhole: '/assets/slingshot/blackhole.png',
  station: '/assets/slingshot/station.png',
  beacon: '/assets/slingshot/beacon.png',
  explosion: '/assets/slingshot/explosion.png',
  debris: '/assets/slingshot/debris.png',
};

// ============================================
// LEVELS
// ============================================
const LEVELS = [
  {
    id: 1,
    name: 'Decollage — Cap Canaveral',
    brief: 'Houston, on a un lancement. Guidez le module vers le relais orbital.',
    probe: { x: 80, y: 400 },
    target: { x: 700, y: 400 },
    planets: [
      { x: 400, y: 350, mass: 3000, radius: 30, sprite: 'earth', label: 'TERRE' },
    ],
    stars: [{ x: 300, y: 300 }, { x: 500, y: 450 }],
    par: 1, timeLimit: 25,
  },
  {
    id: 2,
    name: 'Assistance Gravitationnelle',
    brief: "Utilisez l'attraction lunaire pour courber votre trajectoire.",
    probe: { x: 80, y: 600 },
    target: { x: 700, y: 100 },
    planets: [
      { x: 400, y: 400, mass: 5000, radius: 40, sprite: 'moon', label: 'LUNE' },
    ],
    stars: [{ x: 250, y: 500 }, { x: 500, y: 200 }, { x: 350, y: 300 }],
    par: 2, timeLimit: 25,
  },
  {
    id: 3,
    name: 'Systeme Terre-Lune',
    brief: 'Naviguez entre la Terre et la Lune. Trouvez le point de Lagrange.',
    probe: { x: 80, y: 400 },
    target: { x: 720, y: 400 },
    planets: [
      { x: 350, y: 250, mass: 3500, radius: 32, sprite: 'earth', label: 'TERRE' },
      { x: 450, y: 550, mass: 3500, radius: 32, sprite: 'moon', label: 'LUNE' },
    ],
    stars: [{ x: 400, y: 400 }, { x: 250, y: 350 }, { x: 550, y: 450 }],
    par: 2, timeLimit: 30,
  },
  {
    id: 4,
    name: 'Panne Moteur — "Houston..."',
    brief: 'Le moteur est HS. Trois corps celestes. Precision maximale.',
    probe: { x: 60, y: 700 },
    target: { x: 740, y: 80 },
    planets: [
      { x: 250, y: 500, mass: 2800, radius: 28, sprite: 'mars', label: 'MARS' },
      { x: 500, y: 600, mass: 3200, radius: 30, sprite: 'earth', label: 'TERRE' },
      { x: 400, y: 250, mass: 2500, radius: 26, sprite: 'planet', label: 'VENUS' },
    ],
    stars: [{ x: 350, y: 400 }, { x: 600, y: 350 }, { x: 200, y: 300 }, { x: 550, y: 150 }],
    par: 3, timeLimit: 30,
  },
  {
    id: 5,
    name: 'Ceinture de Debris',
    brief: 'Debris en orbite! Evitez les zones rouges.',
    probe: { x: 80, y: 200 },
    target: { x: 700, y: 600 },
    planets: [
      { x: 300, y: 400, mass: 4000, radius: 35, sprite: 'earth', label: 'TERRE' },
      { x: 550, y: 300, mass: 2000, radius: 22, sprite: 'planet', label: 'ASTEROIDE' },
    ],
    hazards: [{ x: 400, y: 150, radius: 50 }, { x: 500, y: 500, radius: 45 }, { x: 200, y: 600, radius: 40 }],
    stars: [{ x: 350, y: 300 }, { x: 450, y: 500 }, { x: 600, y: 400 }],
    par: 3, timeLimit: 30,
  },
  {
    id: 6,
    name: 'Singularite',
    brief: 'Anomalie gravitationnelle detectee. Ne vous faites pas aspirer!',
    probe: { x: 80, y: 100 },
    target: { x: 720, y: 700 },
    planets: [
      { x: 400, y: 400, mass: 8000, radius: 20, isBlackHole: true },
      { x: 200, y: 600, mass: 2000, radius: 24, sprite: 'planet', label: 'IO' },
      { x: 600, y: 200, mass: 2000, radius: 24, sprite: 'planet', label: 'EUROPA' },
    ],
    stars: [{ x: 250, y: 300 }, { x: 550, y: 500 }, { x: 350, y: 600 }, { x: 500, y: 300 }],
    par: 3, timeLimit: 35,
  },
  {
    id: 7,
    name: 'Odyssee Jovienne',
    brief: '4 lunes de Jupiter. Timing et angle critiques.',
    probe: { x: 60, y: 400 },
    target: { x: 740, y: 400 },
    planets: [
      { x: 200, y: 250, mass: 2200, radius: 22, sprite: 'mars', label: 'IO' },
      { x: 350, y: 550, mass: 3000, radius: 28, sprite: 'planet', label: 'EUROPA' },
      { x: 500, y: 200, mass: 2800, radius: 26, sprite: 'planet', label: 'GANYMEDE' },
      { x: 650, y: 500, mass: 2500, radius: 24, sprite: 'moon', label: 'CALLISTO' },
    ],
    stars: [{ x: 280, y: 400 }, { x: 420, y: 350 }, { x: 580, y: 300 }, { x: 300, y: 150 }, { x: 600, y: 600 }],
    par: 4, timeLimit: 35,
  },
  {
    id: 8,
    name: 'Retour sur Terre',
    brief: "Niveau final. Ramenez l'equipage a la maison. Bonne chance, Houston.",
    probe: { x: 60, y: 750 },
    target: { x: 740, y: 50 },
    planets: [
      { x: 200, y: 600, mass: 3000, radius: 28, sprite: 'mars', label: 'MARS' },
      { x: 400, y: 400, mass: 6000, radius: 18, isBlackHole: true },
      { x: 600, y: 200, mass: 3500, radius: 30, sprite: 'earth', label: 'TERRE' },
      { x: 300, y: 200, mass: 2000, radius: 22, sprite: 'moon', label: 'LUNE' },
      { x: 550, y: 600, mass: 2500, radius: 25, sprite: 'planet', label: 'VENUS' },
    ],
    hazards: [{ x: 150, y: 350, radius: 40 }, { x: 650, y: 450, radius: 45 }],
    stars: [{ x: 250, y: 400 }, { x: 450, y: 250 }, { x: 550, y: 550 }, { x: 350, y: 650 }, { x: 150, y: 150 }, { x: 700, y: 300 }],
    par: 4, timeLimit: 40,
  },
];

// ============================================
// PHYSICS (unchanged)
// ============================================
function computeGravity(probe, planets) {
  let ax = 0, ay = 0;
  for (const p of planets) {
    const dx = p.x - probe.x;
    const dy = p.y - probe.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    if (dist < p.radius * 0.5) return null;
    const force = G * p.mass / distSq;
    ax += force * dx / dist;
    ay += force * dy / dist;
  }
  return { ax, ay };
}

function simulateStep(probe, planets) {
  const g = computeGravity(probe, planets);
  if (!g) return null;
  const vx = probe.vx + g.ax * DT;
  const vy = probe.vy + g.ay * DT;
  return { x: probe.x + vx * DT, y: probe.y + vy * DT, vx, vy };
}

function simulateTrajectory(x, y, vx, vy, planets, steps = 200) {
  const pts = [];
  let p = { x, y, vx, vy };
  for (let i = 0; i < steps; i++) {
    const n = simulateStep(p, planets);
    if (!n) break;
    p = n;
    pts.push({ x: p.x, y: p.y });
    if (p.x < -100 || p.x > 900 || p.y < -100 || p.y > 900) break;
  }
  return pts;
}

// ============================================
// SPRITE LOADER
// ============================================
function useSprites() {
  const sprites = useRef({});
  const loaded = useRef(false);

  useEffect(() => {
    let mounted = true;
    const entries = Object.entries(SPRITE_PATHS);
    let count = 0;

    entries.forEach(([key, path]) => {
      const img = new Image();
      img.onload = () => {
        if (!mounted) return;
        sprites.current[key] = img;
        count++;
        if (count === entries.length) loaded.current = true;
      };
      img.onerror = () => {
        count++;
        if (count === entries.length) loaded.current = true;
      };
      img.src = path;
    });

    return () => { mounted = false; };
  }, []);

  return sprites;
}

// ============================================
// PRE-RENDER STATIC BACKGROUND (offscreen canvas)
// ============================================
function renderStaticBg(levelIdx) {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d');

  // Solid bg
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Stars
  const seed = levelIdx * 100;
  for (let i = 0; i < 120; i++) {
    const sx = (seed + i * 137) % W;
    const sy = (seed + i * 251) % H;
    const b = 0.15 + ((i * 17) % 50) / 100;
    ctx.fillStyle = `rgba(180,195,210,${b})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.3 + (i % 3) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner brackets
  ctx.strokeStyle = C.greenDim + '44';
  ctx.lineWidth = 1;
  const b = 18;
  ctx.beginPath(); ctx.moveTo(4, b); ctx.lineTo(4, 4); ctx.lineTo(b, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - b, 4); ctx.lineTo(W - 4, 4); ctx.lineTo(W - 4, b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, H - b); ctx.lineTo(4, H - 4); ctx.lineTo(b, H - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - b, H - 4); ctx.lineTo(W - 4, H - 4); ctx.lineTo(W - 4, H - b); ctx.stroke();

  // Border
  ctx.strokeStyle = C.greenDim + '30';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  return off;
}

// ============================================
// DRAW HELPERS
// ============================================
function drawPlanet(ctx, p, sprites, time) {
  if (p.isBlackHole) {
    const spr = sprites.current?.blackhole;
    if (spr) {
      const s = p.radius * 4;
      ctx.drawImage(spr, p.x - s / 2, p.y - s / 2, s, s);
    } else {
      // Fallback: simple filled circle + ring
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.amber + '88';
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = C.amberDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }

  // Gravity range (dashed)
  const gR = Math.sqrt(p.mass) * 1.2;
  ctx.strokeStyle = C.greenDim + '25';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, gR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sprite or fallback
  const spr = sprites.current?.[p.sprite];
  const d = p.radius * 2.2;
  if (spr) {
    ctx.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
  } else {
    // Simple flat planet
    ctx.fillStyle = getPlanetColor(p.sprite);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    // Shadow crescent
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(p.x + p.radius * 0.3, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    // Refill lit side
    ctx.fillStyle = getPlanetColor(p.sprite);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    // Simple highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(p.x - p.radius * 0.25, p.y - p.radius * 0.25, p.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label
  if (p.label) {
    ctx.fillStyle = C.greenDim;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x, p.y + p.radius + 13);
  }
}

function getPlanetColor(sprite) {
  switch (sprite) {
    case 'earth': return '#4a7ab5';
    case 'moon': return '#a0998a';
    case 'mars': return '#b56a3a';
    default: return '#b5a070';
  }
}

function drawHazard(ctx, hz, sprites, time) {
  const spr = sprites.current?.debris;
  if (spr) {
    const d = hz.radius * 2.2;
    ctx.globalAlpha = 0.7;
    ctx.drawImage(spr, hz.x - d / 2, hz.y - d / 2, d, d);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(180,40,30,0.08)';
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // Always draw warning border
  ctx.strokeStyle = C.red + '44';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Cross
  ctx.strokeStyle = C.red + '55';
  ctx.lineWidth = 1;
  const s = 6;
  ctx.beginPath();
  ctx.moveTo(hz.x - s, hz.y - s); ctx.lineTo(hz.x + s, hz.y + s);
  ctx.moveTo(hz.x + s, hz.y - s); ctx.lineTo(hz.x - s, hz.y + s);
  ctx.stroke();
}

function drawBeacon(ctx, star, sprites, pulse) {
  const spr = sprites.current?.beacon;
  if (spr) {
    const s = 24 * (0.85 + pulse * 0.15);
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    ctx.drawImage(spr, star.x - s / 2, star.y - s / 2, s, s);
    ctx.globalAlpha = 1;
  } else {
    // Diamond
    ctx.fillStyle = C.amber;
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(Math.PI / 4);
    const sz = 5 + pulse * 1.5;
    ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawTarget(ctx, tx, ty, sprites, pulse) {
  const spr = sprites.current?.station;
  if (spr) {
    const s = TARGET_RADIUS * 2.4;
    ctx.drawImage(spr, tx - s / 2, ty - s / 2, s, s);
  } else {
    // Crosshair
    ctx.strokeStyle = `${C.greenGlow}${(0.4 + pulse * 0.4).toFixed(2)})`;
    ctx.lineWidth = 1.5;
    const cs = TARGET_RADIUS * 1.2;
    const gap = TARGET_RADIUS * 0.4;
    ctx.beginPath();
    ctx.moveTo(tx - cs, ty); ctx.lineTo(tx - gap, ty);
    ctx.moveTo(tx + gap, ty); ctx.lineTo(tx + cs, ty);
    ctx.moveTo(tx, ty - cs); ctx.lineTo(tx, ty - gap);
    ctx.moveTo(tx, ty + gap); ctx.lineTo(tx, ty + cs);
    ctx.stroke();
    ctx.strokeStyle = `${C.greenGlow}${(0.3 + pulse * 0.3).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tx, ty, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Ping
  const pingR = TARGET_RADIUS * (1.5 + pulse * 0.5);
  ctx.strokeStyle = `${C.greenGlow}${(0.08 + pulse * 0.08).toFixed(2)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tx, ty, pingR, 0, Math.PI * 2);
  ctx.stroke();
  // Label
  ctx.fillStyle = C.greenDim;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DOCK', tx, ty + TARGET_RADIUS + 12);
}

function drawProbe(ctx, probe, phase, sprites) {
  const spr = sprites.current?.capsule;
  const angle = Math.atan2(probe.vy || 0, probe.vx || 0);

  if (spr) {
    ctx.save();
    ctx.translate(probe.x, probe.y);
    ctx.rotate(angle);
    const s = PROBE_RADIUS * 4;
    ctx.drawImage(spr, -s / 2, -s / 2, s, s);
    ctx.restore();
  } else {
    // Capsule polygon
    ctx.save();
    ctx.translate(probe.x, probe.y);
    ctx.rotate(angle);
    ctx.fillStyle = C.steel;
    ctx.beginPath();
    ctx.moveTo(PROBE_RADIUS + 2, 0);
    ctx.lineTo(-PROBE_RADIUS, -PROBE_RADIUS * 0.7);
    ctx.lineTo(-PROBE_RADIUS - 1, 0);
    ctx.lineTo(-PROBE_RADIUS, PROBE_RADIUS * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.cream + '66';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  // Green blip
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.arc(probe.x, probe.y, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function GravitySlingshot({ onComplete, onExit }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef(null);
  const bgRef = useRef(null);
  const sprites = useSprites();

  const [phase, setPhase] = useState('intro');
  const [lvlIdx, setLvlIdx] = useState(0);
  const [launches, setLaunches] = useState(0);
  const [starsGot, setStarsGot] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [totalLaunches, setTotalLaunches] = useState(0);
  const [scores, setScores] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [preview, setPreview] = useState([]);
  const [showBrief, setShowBrief] = useState(false);

  const level = LEVELS[lvlIdx];

  // ---- Canvas coords ----
  const toCanvas = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * W / r.width, y: (t.clientY - r.top) * H / r.height };
  }, []);

  // ---- Init level ----
  const initLevel = useCallback((idx) => {
    const lvl = LEVELS[idx];
    stateRef.current = {
      probe: { x: lvl.probe.x, y: lvl.probe.y, vx: 0, vy: 0 },
      trail: [],
      collected: new Set(),
      timer: 0,
      alive: true,
    };
    bgRef.current = renderStaticBg(idx);
    setLaunches(0);
    setStarsGot(0);
    setDragStart(null);
    setDragEnd(null);
    setPreview([]);
    setShowBrief(true);
    setTimeout(() => { setShowBrief(false); setPhase('aiming'); }, 2200);
  }, []);

  const startGame = useCallback(() => {
    setLvlIdx(0);
    setTotalStars(0);
    setTotalLaunches(0);
    setScores([]);
    setElapsed(0);
    initLevel(0);
  }, [initLevel]);

  const launchProbe = useCallback((vx, vy) => {
    if (!stateRef.current) return;
    const lvl = LEVELS[lvlIdx];
    stateRef.current.probe = { x: lvl.probe.x, y: lvl.probe.y, vx: vx * LAUNCH_POWER, vy: vy * LAUNCH_POWER };
    stateRef.current.trail = [];
    stateRef.current.timer = 0;
    stateRef.current.alive = true;
    setLaunches(n => n + 1);
    setPhase('flying');
    setDragStart(null);
    setDragEnd(null);
    setPreview([]);
  }, [lvlIdx]);

  const resetAim = useCallback(() => {
    if (!stateRef.current) return;
    const lvl = LEVELS[lvlIdx];
    stateRef.current.probe = { x: lvl.probe.x, y: lvl.probe.y, vx: 0, vy: 0 };
    stateRef.current.trail = [];
    stateRef.current.timer = 0;
    stateRef.current.alive = true;
    setPhase('aiming');
  }, [lvlIdx]);

  const abortFlight = useCallback(() => {
    if (!stateRef.current) return;
    stateRef.current.alive = false;
    resetAim();
  }, [resetAim]);

  const calcScore = useCallback((stars, lnch, lvl) => {
    return stars * 30 + (lnch <= lvl.par ? 50 : Math.max(0, 50 - (lnch - lvl.par) * 15)) + 20;
  }, []);

  const nextLevel = useCallback(() => {
    const next = lvlIdx + 1;
    if (next >= LEVELS.length) setPhase('complete');
    else { setLvlIdx(next); initLevel(next); }
  }, [lvlIdx, initLevel]);

  const finalScore = useCallback(() => Math.min(500, scores.reduce((a, b) => a + b, 0)), [scores]);

  // ---- Pointer handlers ----
  const onDown = useCallback((e) => {
    if (phase !== 'aiming') return;
    e.preventDefault();
    const p = toCanvas(e);
    setDragStart(p);
    setDragEnd(p);
  }, [phase, toCanvas]);

  const onMove = useCallback((e) => {
    if (!dragStart || phase !== 'aiming') return;
    e.preventDefault();
    const p = toCanvas(e);
    setDragEnd(p);
    const lvl = LEVELS[lvlIdx];
    const vx = (dragStart.x - p.x) * LAUNCH_POWER;
    const vy = (dragStart.y - p.y) * LAUNCH_POWER;
    setPreview(simulateTrajectory(lvl.probe.x, lvl.probe.y, vx, vy, lvl.planets));
  }, [dragStart, phase, toCanvas, lvlIdx]);

  const onUp = useCallback((e) => {
    if (!dragStart || !dragEnd || phase !== 'aiming') return;
    e.preventDefault();
    const vx = dragStart.x - dragEnd.x;
    const vy = dragStart.y - dragEnd.y;
    if (Math.sqrt(vx * vx + vy * vy) < 15) {
      setDragStart(null); setDragEnd(null); setPreview([]);
      return;
    }
    launchProbe(vx, vy);
  }, [dragStart, dragEnd, phase, launchProbe]);

  // ---- Physics loop ----
  useEffect(() => {
    if (phase !== 'flying' || !stateRef.current) return;
    const lvl = LEVELS[lvlIdx];
    let running = true;

    const tick = () => {
      if (!running || !stateRef.current) return;
      const st = stateRef.current;

      for (let i = 0; i < 3; i++) {
        if (!st.alive) break;
        const next = simulateStep(st.probe, lvl.planets);
        if (!next) { st.alive = false; setPhase('crash'); return; }
        st.probe = next;
        st.trail.push({ x: next.x, y: next.y });
        if (st.trail.length > TRAIL_LENGTH) st.trail.shift();
      }

      if (st.probe.x < -80 || st.probe.x > W + 80 || st.probe.y < -80 || st.probe.y > H + 80) {
        st.alive = false; setPhase('crash'); return;
      }

      (lvl.stars || []).forEach((star, idx) => {
        if (st.collected.has(idx)) return;
        const dx = st.probe.x - star.x, dy = st.probe.y - star.y;
        if (dx * dx + dy * dy < (PROBE_RADIUS + STAR_RADIUS + 4) ** 2) {
          st.collected.add(idx);
          setStarsGot(st.collected.size);
        }
      });

      (lvl.hazards || []).forEach((hz) => {
        const dx = st.probe.x - hz.x, dy = st.probe.y - hz.y;
        if (dx * dx + dy * dy < (PROBE_RADIUS + hz.radius) ** 2) {
          st.alive = false; setPhase('crash');
        }
      });

      const tdx = st.probe.x - lvl.target.x, tdy = st.probe.y - lvl.target.y;
      if (tdx * tdx + tdy * tdy < (PROBE_RADIUS + TARGET_RADIUS) ** 2) {
        st.alive = false;
        const sc = calcScore(st.collected.size, launches, lvl);
        setScores(prev => [...prev, sc]);
        setTotalStars(prev => prev + st.collected.size);
        setTotalLaunches(prev => prev + launches);
        setPhase('success');
        return;
      }

      st.timer += DT * 3;
      if (st.timer > (lvl.timeLimit || 20)) { st.alive = false; setPhase('timeout'); return; }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase, lvlIdx, launches, calcScore]);

  // ---- Elapsed timer ----
  useEffect(() => {
    if (phase === 'intro' || phase === 'complete') return;
    const id = setInterval(() => setElapsed(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ---- RENDER LOOP (optimized) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let running = true;

    const render = () => {
      if (!running) return;

      // Resize only when needed
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(targetW / W, 0, 0, targetH / H, 0, 0);

      // Draw cached background
      if (bgRef.current) {
        ctx.drawImage(bgRef.current, 0, 0);
      } else {
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, H);
      }

      if (!level) { requestAnimationFrame(render); return; }

      const time = Date.now();
      const pulse = 0.5 + Math.sin(time / 500) * 0.5;

      // Hazards
      (level.hazards || []).forEach(hz => drawHazard(ctx, hz, sprites, time));

      // Planets
      level.planets.forEach(p => drawPlanet(ctx, p, sprites, time));

      // Beacons
      const st = stateRef.current;
      (level.stars || []).forEach((star, idx) => {
        if (st?.collected?.has(idx)) return;
        const p = Math.sin(time / 400 + idx) * 0.5 + 0.5;
        drawBeacon(ctx, star, sprites, p);
      });

      // Target
      drawTarget(ctx, level.target.x, level.target.y, sprites, pulse);

      // Preview path
      if (preview.length > 1 && phase === 'aiming') {
        ctx.strokeStyle = C.amber + '40';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(preview[0].x, preview[0].y);
        for (let i = 1; i < preview.length; i++) ctx.lineTo(preview[i].x, preview[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Trail
      if (st?.trail?.length > 1) {
        for (let i = 1; i < st.trail.length; i++) {
          const a = i / st.trail.length;
          ctx.strokeStyle = `${C.amberGlow}${(a * 0.5).toFixed(2)})`;
          ctx.lineWidth = a * 2;
          ctx.beginPath();
          ctx.moveTo(st.trail[i - 1].x, st.trail[i - 1].y);
          ctx.lineTo(st.trail[i].x, st.trail[i].y);
          ctx.stroke();
        }
      }

      // Probe
      if (st?.probe) {
        drawProbe(ctx, st.probe, phase, sprites);
      }

      // Drag arrow
      if (dragStart && dragEnd && phase === 'aiming') {
        const dx = dragStart.x - dragEnd.x;
        const dy = dragStart.y - dragEnd.y;
        const power = Math.sqrt(dx * dx + dy * dy);
        const max = 150;
        const clamped = Math.min(power, max);
        const ang = Math.atan2(dy, dx);
        const ex = level.probe.x + Math.cos(ang) * clamped;
        const ey = level.probe.y + Math.sin(ang) * clamped;
        const t = clamped / max;
        const col = t < 0.5 ? C.green : t < 0.8 ? C.amber : C.red;

        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(level.probe.x, level.probe.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrowhead
        const hl = 9;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(ang - 0.4), ey - hl * Math.sin(ang - 0.4));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(ang + 0.4), ey - hl * Math.sin(ang + 0.4));
        ctx.stroke();

        // Power %
        ctx.fillStyle = col;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(t * 100)}%`, ex, ey - 10);
      }

      requestAnimationFrame(render);
    };

    const id = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(id); };
  }, [level, lvlIdx, phase, preview, dragStart, dragEnd, sprites]);

  // ---- Helpers ----
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleComplete = useCallback(() => {
    if (onComplete) onComplete(finalScore());
  }, [finalScore, onComplete]);

  // ============================================
  // JSX
  // ============================================
  return (
    <div className="fixed inset-0 text-white flex flex-col overflow-hidden select-none"
      style={{ fontFamily: "'Courier New', Consolas, monospace", background: C.bg }}>

      {/* HUD */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 text-[11px] tracking-wider"
        style={{ background: '#0a1a0a', borderBottom: '1px solid #1a3a1a' }}>
        <button onClick={onExit}
          className="px-3 py-1 rounded transition-opacity hover:opacity-70"
          style={{ border: '1px solid #1a661a', color: C.green, background: 'transparent' }}>
          ← ABORT
        </button>
        <div className="flex items-center gap-4" style={{ color: C.green }}>
          <span>MISSION {lvlIdx + 1}/{LEVELS.length}</span>
          <span style={{ color: C.amber }}>SIG:{totalStars + starsGot}</span>
          <span>LAUNCH:{launches}</span>
          <span style={{ color: C.amberDim }}>T+{fmt(elapsed)}</span>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full touch-none"
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />

        {/* Abort button during flight */}
        <AnimatePresence>
          {phase === 'flying' && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={abortFlight}
              className="absolute bottom-4 right-4 px-4 py-2 rounded text-[11px] tracking-wider backdrop-blur-sm"
              style={{ background: 'rgba(80,20,20,0.7)', border: `1px solid ${C.red}`, color: C.red }}>
              ABORT ✕
            </motion.button>
          )}
        </AnimatePresence>

        {/* Aiming hint */}
        <AnimatePresence>
          {phase === 'aiming' && !dragStart && !showBrief && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <span className="px-4 py-2 rounded text-[11px] tracking-wider"
                style={{ background: 'rgba(10,26,10,0.85)', border: '1px solid #1a3a1a', color: C.green }}>
                DRAG FROM MODULE TO LAUNCH
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Briefing overlay */}
        <AnimatePresence>
          {showBrief && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(6,10,16,0.88)' }}>
              <motion.div initial={{ scale: 0.85, y: 15 }} animate={{ scale: 1, y: 0 }} className="text-center p-6">
                <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: C.amberDim }}>
                  MISSION {level.id}/{LEVELS.length}
                </div>
                <h2 className="text-lg font-bold mb-3" style={{ color: C.amber }}>{level.name}</h2>
                <p className="text-sm max-w-xs mx-auto" style={{ color: C.cream + 'aa' }}>{level.brief}</p>
                <div className="mt-3 flex justify-center gap-5 text-[10px]" style={{ color: C.greenDim }}>
                  <span>SIG: {(level.stars || []).length}</span>
                  <span>PAR: {level.par}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crash / timeout */}
        <AnimatePresence>
          {(phase === 'crash' || phase === 'timeout') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(25,8,8,0.82)' }}>
              <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                className="text-center p-6 rounded-lg" style={{ background: 'rgba(15,5,5,0.92)', border: `1px solid ${C.red}30` }}>
                <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: C.red }}>!! WARNING !!</div>
                <p className="font-bold text-base mb-1" style={{ color: C.red }}>
                  {phase === 'crash' ? 'SIGNAL LOST' : 'TIMEOUT'}
                </p>
                <p className="text-[11px] mb-4" style={{ color: C.cream + '77' }}>
                  {phase === 'crash' ? 'Collision detected. Recalculating...' : 'Module drifted beyond range.'}
                </p>
                <button onClick={resetAim} className="px-5 py-2 rounded text-sm tracking-wider hover:opacity-80"
                  style={{ background: C.amber, color: '#000', fontWeight: 'bold' }}>
                  RELAUNCH
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {phase === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(4,16,4,0.82)' }}>
              <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                className="text-center p-6 rounded-lg" style={{ background: 'rgba(4,12,4,0.92)', border: `1px solid ${C.greenDim}` }}>
                <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: C.green }}>DOCKING CONFIRMED</div>
                <p className="font-bold text-base mb-3" style={{ color: C.green }}>"Houston, we have docking."</p>
                <div className="flex justify-center gap-5 text-sm mb-3" style={{ color: C.amber }}>
                  <span>SIG: {starsGot}/{(level.stars || []).length}</span>
                  <span>LAUNCHES: {launches} (par: {level.par})</span>
                </div>
                <p className="text-[11px] mb-4" style={{ color: C.greenDim }}>
                  +{scores[scores.length - 1] || 0} PTS
                </p>
                <button onClick={nextLevel} className="px-5 py-2 rounded text-sm tracking-wider hover:opacity-80"
                  style={{ background: C.green, color: '#000', fontWeight: 'bold' }}>
                  {lvlIdx + 1 >= LEVELS.length ? 'MISSION DEBRIEF' : 'NEXT MISSION →'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* INTRO */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6" style={{ background: C.bg }}>
            <motion.div initial={{ y: 25 }} animate={{ y: 0 }} className="text-center max-w-md">
              <div className="text-[10px] tracking-[0.4em] mb-5" style={{ color: C.greenDim }}>
                NASA — MISSION CONTROL — HOUSTON
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: C.amber }}>GRAVITATIONAL SLINGSHOT</h1>
              <p className="text-sm mb-1" style={{ color: C.cream + '99' }}>Apollo 13 — "Houston, we've had a problem."</p>
              <p className="text-[11px] mb-5" style={{ color: C.greenDim }}>April 1970 — Free-return trajectory</p>

              <div className="my-4 p-4 rounded text-left text-sm space-y-2"
                style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', color: C.cream + 'bb' }}>
                <p><span style={{ color: C.green }}>MISSION</span> — Guide the module to the docking station using gravity assists.</p>
                <p><span style={{ color: C.green }}>CONTROLS</span> — Drag from module to set vector &amp; thrust.</p>
                <p><span style={{ color: C.amber }}>SIGNALS</span> — Collect beacons for bonus points.</p>
                <p><span style={{ color: C.red }}>HAZARDS</span> — Avoid planets, debris, and anomalies.</p>
              </div>

              <p className="text-[10px] mb-5" style={{ color: C.amberDim }}>8 MISSIONS — ~5-8 MIN</p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={startGame}
                className="px-7 py-3 rounded text-base tracking-wider"
                style={{ background: C.amber, color: '#000', fontWeight: 'bold', boxShadow: `0 0 20px ${C.amber}30` }}>
                INITIATE LAUNCH
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPLETE */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6" style={{ background: C.bg }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="text-center max-w-sm w-full">
              <div className="text-[10px] tracking-[0.4em] mb-3" style={{ color: C.greenDim }}>MISSION DEBRIEF</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: C.green }}>CREW SAFELY HOME</h2>
              <p className="text-sm mb-5" style={{ color: C.cream + '88' }}>"Welcome home."</p>

              <div className="space-y-2 mb-5 text-sm">
                {[
                  ['Signals', totalStars, C.amber],
                  ['Launches', totalLaunches, C.green],
                  ['Time', fmt(elapsed), C.cream],
                ].map(([label, val, col]) => (
                  <div key={label} className="flex justify-between p-2 rounded"
                    style={{ background: '#0a1a0a', border: '1px solid #1a3a1a' }}>
                    <span style={{ color: C.cream + '77' }}>{label}</span>
                    <span style={{ color: col }} className="font-bold">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between p-2 rounded"
                  style={{ background: 'rgba(8,25,8,0.8)', border: `1px solid ${C.green}55` }}>
                  <span style={{ color: C.green }} className="font-bold">SCORE</span>
                  <span style={{ color: C.green }} className="font-bold text-lg">{finalScore()} PTS</span>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleComplete}
                className="w-full py-3 rounded text-base tracking-wider"
                style={{ background: C.green, color: '#000', fontWeight: 'bold', boxShadow: `0 0 20px ${C.green}30` }}>
                VALIDATE — {finalScore()} PTS
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
