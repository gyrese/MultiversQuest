import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityShell from '../components/activity/ActivityShell';
import { useActivityScore } from '../hooks/useActivityScore';
import roverLocations from '../data/rover_locations.json';

// -----------------------------------------------------------------------------
// 🔊 AUDIO SYSTEM (Synthesized Sonar)
// -----------------------------------------------------------------------------
const useSonarAudio = (distance, isScanning) => {
    const audioContextRef = useRef(null);
    const nextBeepTimeRef = useRef(null);

    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
            nextBeepTimeRef.current = audioContextRef.current.currentTime;
        }
        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    useEffect(() => {
        if (!audioContextRef.current || !isScanning) return;

        // Resume context
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(() => { });
        }

        const beepInterval = Math.max(0.15, Math.min(2.0, distance / 40));

        const scheduleBeep = () => {
            const ctx = audioContextRef.current;
            if (!ctx) return;
            const time = ctx.currentTime;

            if (time >= nextBeepTimeRef.current) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                // Frequency
                const frequency = 1500 - (Math.min(distance, 100) * 10);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, time);

                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(time);
                osc.stop(time + 0.15);

                nextBeepTimeRef.current = time + beepInterval;
            }
            requestAnimationFrame(scheduleBeep);
        };
        const animationId = requestAnimationFrame(scheduleBeep);
        return () => cancelAnimationFrame(animationId);
    }, [distance, isScanning]);
};

// -----------------------------------------------------------------------------
// 🌌 CINEMATIC CANVAS RADAR
// -----------------------------------------------------------------------------
const MarsRadarCanvas = ({
    targetAngle,
    targetDistance,
    isScanning,
    isTargetVisible,
    onTargetClick,
    lockProgress
}) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const targetScreenPos = useRef({ x: 0, y: 0, visible: false });

    const config = useMemo(() => ({
        gridSize: 40,
        sweepSpeed: 2,
        particleCount: 150,
        scanLineColor: '#00ffee',
        scanLineShadow: '#00cccc',
        bgColor: '#050101',
    }), []);

    const state = useRef({
        sweepAngle: 0,
        particles: [],
        blipEnergy: 0,
        time: 0,
    });

    // Resize Observer
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Init Particles
    useEffect(() => {
        state.current.particles = Array.from({ length: config.particleCount }).map(() => ({
            x: Math.random() * 800,
            y: Math.random() * 800,
            speed: Math.random() * 0.5 + 0.1,
            size: Math.random() * 2,
            alpha: Math.random() * 0.5,
            drift: (Math.random() - 0.5) * 0.2
        }));
    }, [config.particleCount]);

    const handleCanvasClick = (e) => {
        if (!targetScreenPos.current.visible) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const dx = clickX - targetScreenPos.current.x;
        const dy = clickY - targetScreenPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            onTargetClick();
        }
    };

    const animate = useCallback((time) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.45;

        // Clear
        ctx.fillStyle = 'rgba(5, 1, 1, 0.15)';
        ctx.fillRect(0, 0, width, height);

        state.current.time = time / 1000;

        if (isScanning) {
            state.current.sweepAngle = (state.current.sweepAngle + 0.03) % (Math.PI * 2);
        }

        // Particles
        state.current.particles.forEach(p => {
            p.y -= p.speed;
            p.x += p.drift;
            if (p.y < 0) {
                p.y = height;
                p.x = Math.random() * width;
            }
            if (p.alpha > 0.01) {
                ctx.fillStyle = `rgba(255, 100, 50, ${p.alpha})`;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });

        // Rings
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 238, 0.5)';
        ctx.strokeStyle = 'rgba(0, 255, 238, 0.3)';

        for (let i = 1; i <= 4; i++) {
            const r = (maxRadius * i) / 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
            // Ticks
            for (let j = 0; j < 12; j++) {
                const angle = (j / 12) * Math.PI * 2;
                const inner = r - 5;
                const outer = r + 5;
                ctx.beginPath();
                ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
                ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
                ctx.stroke();
            }
        }

        // Sweep
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(state.current.sweepAngle);

        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(maxRadius, 0);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gradient Trail
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.rotate(-0.015);
            ctx.moveTo(0, 0);
            ctx.lineTo(maxRadius, 0);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(0, 255, 238, ${0.15 * (1 - i / 40)})`;
            ctx.stroke();
        }
        ctx.restore();

        // Target Logic
        const radAngle = (targetAngle - 90) * (Math.PI / 180);
        const pxDistance = (targetDistance / 100) * maxRadius;

        const blipX = centerX + Math.cos(radAngle) * pxDistance;
        const blipY = centerY + Math.sin(radAngle) * pxDistance;

        let normSweep = state.current.sweepAngle % (Math.PI * 2);
        let normTarget = radAngle % (Math.PI * 2);
        if (normSweep < 0) normSweep += Math.PI * 2;
        if (normTarget < 0) normTarget += Math.PI * 2;

        const angleDiff = Math.abs(normSweep - normTarget);
        const diff = Math.min(angleDiff, 2 * Math.PI - angleDiff);

        // Visibility Check
        if (diff < 0.4 && isScanning) {
            state.current.blipEnergy = 1.0;
        } else {
            state.current.blipEnergy *= 0.96;
        }

        targetScreenPos.current = { x: blipX, y: blipY, visible: state.current.blipEnergy > 0.2 };

        if (state.current.blipEnergy > 0.01) {
            ctx.save();
            ctx.translate(blipX, blipY);
            ctx.globalAlpha = state.current.blipEnergy;

            // Glitch position
            if (Math.random() > 0.9) {
                ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
            }

            // Lock Ring
            if (lockProgress > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, (lockProgress / 100) * Math.PI * 2);
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 10;
                ctx.stroke();
            }

            // Blip Render
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = lockProgress === 100 ? '#00ff00' : '#ff3333';
            ctx.shadowColor = lockProgress === 100 ? '#00ff00' : '#ff0000';
            ctx.shadowBlur = 20;
            ctx.fill();

            // Ping
            ctx.beginPath();
            const pingSize = (time % 800) / 800 * 40;
            ctx.arc(0, 0, pingSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 50, 50, ${1 - (time % 800) / 800})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.shadowBlur = 0;
            ctx.globalAlpha = state.current.blipEnergy;
            ctx.fillText(lockProgress === 100 ? 'LOCKED' : 'SIGNAL', 20, -15);
            // ctx.fillText(...) removed redundant text

            ctx.restore();
        }

        // Glitch Overlay
        if (Math.random() > 0.99) {
            const y = Math.random() * height;
            const h = Math.random() * 20 + 2;
            ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.15})`;
            ctx.fillRect(0, y, width, h);
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [isScanning, isTargetVisible, targetAngle, targetDistance, lockProgress]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 cursor-crosshair touch-none mix-blend-screen"
            onClick={handleCanvasClick}
        />
    );
};

// -----------------------------------------------------------------------------
// 🛸 ROVER RADAR ACTIVITY (Main Component)
// -----------------------------------------------------------------------------
export default function RoverRadar({ onComplete, onExit }) {
    const [roverPosition, setRoverPosition] = useState({ angle: 0, distance: 80, realDistance: 0 });
    const [locationName, setLocationName] = useState('LOCALISATION DU SIGNAL...');
    const [lockProgress, setLockProgress] = useState(0);
    const [gpsLoading, setGpsLoading] = useState(false);

    // Activity Hook
    const {
        isPlaying,
        isCompleted,
        score,
        startActivity,
        finalizeActivity
    } = useActivityScore(
        'odyssee_spatiale',
        'seul_sur_mars',
        {
            maxPoints: 500,
            activityType: 'radar',
            onComplete
        }
    );

    // Pick target randomly
    const targetLocation = useMemo(() => {
        return roverLocations[Math.floor(Math.random() * roverLocations.length)];
    }, []);

    // Calculate Position function
    const calculateRadarData = (baseLat, baseLon) => {
        const R = 6371; // Earth Radius (km) - for Reality Game
        // const R = 3389.5; // Mars Radius

        const toRad = x => x * Math.PI / 180;

        const dLat = toRad(targetLocation.lat - baseLat);
        const dLon = toRad(targetLocation.lng - baseLon);
        const lat1 = toRad(baseLat);
        const lat2 = toRad(targetLocation.lat);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        // Bearing
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;

        // Visual Range: 0-100%
        // Adjust Max Range dynamically?
        // If distance is huge, put blip on edge. If close, near center.
        // Let's say Max Range is 100km for gameplay? Or 5000km?
        // Since user provided "Home" as reference, they probably want to search NEAR home?
        // But the target is also "Home"? Distance should be 0.
        // If distance is tiny, put blip very close.

        let visualDistance = 50;
        if (distanceKm < 1) visualDistance = 10;
        else if (distanceKm > 10000) visualDistance = 95;
        else visualDistance = Math.min((distanceKm / 1000) * 80 + 10, 90);

        setRoverPosition({
            angle: bearing,
            distance: visualDistance,
            realDistance: distanceKm
        });
        setLocationName(targetLocation.name ? targetLocation.name.toUpperCase() : 'UNKNOWN');
    };

    // Audio Hook
    useSonarAudio(roverPosition.distance, isPlaying && !isCompleted);

    const handleStart = () => {
        setGpsLoading(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                // console.log("GPS Found:", latitude, longitude);
                calculateRadarData(latitude, longitude);
                setGpsLoading(false);
                startActivity();
            }, (err) => {
                console.warn("GPS Fail, using Backup");
                // Backup: Fallback to arbitrary base if GPS fails
                calculateRadarData(0, 0);
                setGpsLoading(false);
                startActivity();
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        } else {
            // No GPS
            calculateRadarData(0, 0);
            setGpsLoading(false);
            startActivity();
        }
    };

    const handleTargetClick = () => {
        if (isCompleted || lockProgress > 0) return;

        // Start Locking Sequence
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setLockProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                finalizeActivity(true, 100); // Success + Bonus
            }
        }, 50);
    };

    // Helper for Distance Display
    const formatDistance = (km) => {
        if (!km) return "---";
        if (km < 1) return `${(km * 1000).toFixed(0)}m`;
        return `${km.toFixed(1)}km`;
    };

    return (
        <ActivityShell
            title="Sauvetage Martien"
            subtitle="Odyssée Spatiale"
            universeColor="#ef4444" // Mars Red
            maxPoints={500}
            onExit={onExit}
            isCompleted={isCompleted}
            score={score}
        >
            <div className="relative w-full max-w-lg aspect-square mx-auto bg-black rounded-full overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.3)] border-4 border-red-900/50 flex flex-col items-center justify-center">

                {/* Intro Overlay */}
                {!isPlaying && !isCompleted && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            disabled={gpsLoading}
                            className="bg-red-600/90 text-white font-bold font-mono py-4 px-8 rounded-none border border-red-400 shadow-[0_0_20px_red] text-xl tracking-widest clip-path-polygon disabled:opacity-50"
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                        >
                            {gpsLoading ? 'CALIBRAGE GPS...' : 'INITIALISER LE SCAN'}
                        </motion.button>
                    </div>
                )}

                <MarsRadarCanvas
                    targetAngle={roverPosition.angle}
                    targetDistance={roverPosition.distance} // %
                    isScanning={isPlaying && !isCompleted}
                    isTargetVisible={true}
                    onTargetClick={handleTargetClick}
                    lockProgress={lockProgress}
                />

                {/* Static HUD Elements */}
                <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-20 opacity-80">
                    <div className="text-cyan-500 text-[10px] tracking-[0.3em] font-bold mb-1">NASA // JPL // GPS LINK</div>
                    <h1 className="text-white text-2xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] font-mono">
                        ROVER TRACKER
                    </h1>
                </div>

                {/* Bottom HUD */}
                <div className="absolute bottom-12 w-full text-center pointer-events-none z-20">
                    <div className="text-4xl font-mono font-bold text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {lockProgress > 0 ? 'VERROUILLAGE...' : (isPlaying ? formatDistance(roverPosition.realDistance) : '---.-')}
                    </div>
                    <div className="text-[10px] text-cyan-500 tracking-[0.5em] mt-2 group uppercase">
                        {isCompleted ? 'FOUND' : (isPlaying ? locationName : 'STANDBY')}
                    </div>
                </div>
            </div>
        </ActivityShell>
    );
}
