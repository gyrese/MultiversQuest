/**
 * WarRoom 3D Scene — Version robuste
 * 
 * Canvas R3F minimaliste (Stars + Cam) + Effets visuels en CSS overlay
 * pilotés par GSAP. Pas de postprocessing (incompatible React 19).
 */

import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// =============================================================================
// 3D SCENE CONTENT (inside Canvas)
// =============================================================================

const SceneContent = forwardRef((props, ref) => {
    const { camera } = useThree();
    const starsRef = useRef();
    const gridRef = useRef();

    // Valeurs animables (ne provoquent pas de re-render React)
    const anim = useRef({
        starSpeed: 0.5,
        fov: 45,
        shakeIntensity: 0,
        shakeTime: 0,
    });

    // Cycle de rendu (60fps)
    useFrame((state, delta) => {
        const a = anim.current;

        // Stars rotation (warp effect)
        if (starsRef.current) {
            starsRef.current.rotation.y += delta * 0.05 * a.starSpeed;
            starsRef.current.rotation.z += delta * 0.02 * a.starSpeed;
        }

        // Grid animation
        if (gridRef.current) {
            gridRef.current.rotation.z += delta * 0.01;
        }

        // Camera FOV pulse
        if (Math.abs(camera.fov - a.fov) > 0.1) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, a.fov, 0.08);
            camera.updateProjectionMatrix();
        }

        // Camera shake (manual implementation)
        if (a.shakeIntensity > 0.01) {
            a.shakeTime += delta * 30;
            camera.position.x = Math.sin(a.shakeTime * 1.7) * a.shakeIntensity * 0.1;
            camera.position.y = Math.cos(a.shakeTime * 2.3) * a.shakeIntensity * 0.1;
        } else {
            // Retour à la position par défaut
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.1);
        }
    });

    // Expose l'API d'animation via ref (pour le parent)
    useImperativeHandle(ref, () => ({
        getAnim: () => anim.current
    }));

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.8} color="#8b5cf6" />
            <pointLight position={[-10, -10, -10]} intensity={0.4} color="#06b6d4" />

            {/* Champ d'étoiles */}
            <group ref={starsRef}>
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade={true} speed={1} />
            </group>

            {/* Grille de fond subtile */}
            <group ref={gridRef} position={[0, -10, 0]} rotation={[0.3, 0, 0]}>
                <gridHelper args={[120, 60, 0x4c1d95, 0x1a0a3e]} />
            </group>
        </>
    );
});

// =============================================================================
// CSS OVERLAY EFFECTS (outside Canvas, reliable)
// =============================================================================

function CSSOverlayEffects({ overlayRef }) {
    return (
        <div ref={overlayRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Vignette permanente */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                data-effect="vignette"
                style={{
                    boxShadow: 'inset 0 0 150px rgba(0,0,0,0.7)',
                    opacity: 1
                }}
            />

            {/* Bloom / Glow overlay */}
            <div
                className="absolute inset-0"
                data-effect="bloom"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.0) 0%, transparent 70%)',
                    opacity: 0,
                    mixBlendMode: 'screen',
                    transition: 'none'
                }}
            />

            {/* Flash overlay (Alert) */}
            <div
                className="absolute inset-0"
                data-effect="flash"
                style={{
                    backgroundColor: 'rgba(220, 38, 38, 0)',
                    transition: 'none'
                }}
            />

            {/* Scanlines (Glitch) */}
            <div
                className="absolute inset-0"
                data-effect="scanlines"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                    opacity: 0,
                    transition: 'none'
                }}
            />

            {/* Noise grain (Glitch) */}
            <div
                className="absolute inset-0"
                data-effect="noise"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    opacity: 0.03,
                    mixBlendMode: 'overlay',
                    transition: 'none'
                }}
            />

            {/* Chromatic aberration simulation */}
            <div
                className="absolute inset-0"
                data-effect="aberration"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,0,0,0.0) 0%, transparent 50%, rgba(0,255,255,0.0) 100%)',
                    opacity: 0,
                    mixBlendMode: 'screen',
                    transition: 'none'
                }}
            />
        </div>
    );
}

// =============================================================================
// MAIN EXPORTED COMPONENT
// =============================================================================

export default function WarRoom3DScene({ onCueRef }) {
    const scene3DRef = useRef();
    const overlayRef = useRef();

    // Helper: get a specific overlay effect div
    const getEffect = (name) => {
        if (!overlayRef.current) return null;
        return overlayRef.current.querySelector(`[data-effect="${name}"]`);
    };

    // Assigner l'API triggerCue à la ref du parent
    useEffect(() => {
        if (!onCueRef) return;

        onCueRef.current = {
            triggerCue: (cue, payload) => {
                console.log('🎬 CUE:', cue, payload);

                // Récupère les valeurs animables 3D
                const a = scene3DRef.current?.getAnim();
                if (!a) return;

                switch (cue) {
                    // =============================================================
                    // 🚨 ALERTE ROUGE
                    // =============================================================
                    case 'TRIGGER_ALERT': {
                        // 3D: Camera shake + FOV pulse
                        gsap.to(a, {
                            shakeIntensity: 2, duration: 0.15, onComplete: () => {
                                gsap.to(a, { shakeIntensity: 0, duration: 0.8, ease: 'power2.out' });
                            }
                        });
                        gsap.to(a, { fov: 50, duration: 0.1, yoyo: true, repeat: 1 });
                        gsap.to(a, { starSpeed: 3, duration: 0.3, yoyo: true, repeat: 1 });

                        // CSS: Flash rouge pulsé
                        const flash = getEffect('flash');
                        if (flash) {
                            gsap.fromTo(flash,
                                { backgroundColor: 'rgba(220,38,38,0.4)' },
                                { backgroundColor: 'rgba(220,38,38,0)', duration: 0.3, repeat: 3, yoyo: true }
                            );
                        }

                        // CSS: Bloom violet
                        const bloom = getEffect('bloom');
                        if (bloom) {
                            gsap.to(bloom, { opacity: 0.6, duration: 0.1 });
                            gsap.to(bloom, { opacity: 0, duration: 1.5, delay: 0.3 });
                        }

                        // CSS: Vignette plus sombre
                        const vig = getEffect('vignette');
                        if (vig) {
                            gsap.to(vig, {
                                boxShadow: 'inset 0 0 250px rgba(220,38,38,0.6)',
                                duration: 0.2, yoyo: true, repeat: 3,
                                onComplete: () => gsap.to(vig, { boxShadow: 'inset 0 0 150px rgba(0,0,0,0.7)', duration: 0.5 })
                            });
                        }
                        break;
                    }

                    // =============================================================
                    // 🔮 GLITCH / MATRIX
                    // =============================================================
                    case 'TRIGGER_GLITCH': {
                        const dur = (payload?.duration || 3000) / 1000;

                        // 3D: Camera stutter
                        gsap.to(a, { shakeIntensity: 0.8, duration: 0.05, yoyo: true, repeat: 7 });
                        gsap.to(a, { starSpeed: 4, duration: 0.1, yoyo: true, repeat: 5 });

                        // CSS: Scanlines
                        const scan = getEffect('scanlines');
                        if (scan) {
                            gsap.to(scan, { opacity: 0.8, duration: 0.05 });
                            gsap.to(scan, { opacity: 0, duration: 0.3, delay: dur });
                        }

                        // CSS: Noise grain
                        const noise = getEffect('noise');
                        if (noise) {
                            gsap.to(noise, { opacity: 0.15, duration: 0.05 });
                            gsap.to(noise, { opacity: 0.03, duration: 0.3, delay: dur });
                        }

                        // CSS: Chromatic aberration
                        const aberr = getEffect('aberration');
                        if (aberr) {
                            gsap.fromTo(aberr,
                                { opacity: 0, x: 0 },
                                {
                                    opacity: 0.5, x: 5, duration: 0.05, yoyo: true, repeat: 9,
                                    onComplete: () => gsap.to(aberr, { opacity: 0, x: 0, duration: 0.2 })
                                }
                            );
                        }
                        break;
                    }

                    // =============================================================
                    // 🌌 UNLOCK / DECOUVERTE
                    // =============================================================
                    case 'SHOW_UNLOCK': {
                        // 3D: Dolly in doux
                        gsap.to(a, {
                            fov: 40, duration: 1.5, ease: 'power2.inOut',
                            onComplete: () => gsap.to(a, { fov: 45, duration: 2, ease: 'power2.out' })
                        });
                        gsap.to(a, {
                            starSpeed: 0.2, duration: 1.5,
                            onComplete: () => gsap.to(a, { starSpeed: 0.5, duration: 2 })
                        });

                        // CSS: Bloom doux montée
                        const bloom = getEffect('bloom');
                        if (bloom) {
                            gsap.to(bloom, { opacity: 0.4, duration: 1.5, ease: 'power2.inOut' });
                            gsap.to(bloom, { opacity: 0, duration: 2, delay: 2 });
                        }
                        break;
                    }

                    // =============================================================
                    // 🚀 WARP / HYPERESPACE
                    // =============================================================
                    case 'WARP_JUMP': {
                        // 3D: Stars ultra rapides + FOV stretch
                        gsap.to(a, { starSpeed: 12, duration: 0.8, ease: 'expo.in' });
                        gsap.to(a, { starSpeed: 0.5, duration: 2.5, delay: 1.5, ease: 'expo.out' });
                        gsap.to(a, {
                            fov: 70, duration: 0.8, ease: 'expo.in',
                            onComplete: () => gsap.to(a, { fov: 45, duration: 1.5, ease: 'elastic.out(1, 0.5)' })
                        });

                        // CSS: Flash blanc + aberration
                        const flash = getEffect('flash');
                        if (flash) {
                            gsap.fromTo(flash,
                                { backgroundColor: 'rgba(255,255,255,0)' },
                                {
                                    backgroundColor: 'rgba(255,255,255,0.6)', duration: 0.8, ease: 'expo.in',
                                    onComplete: () => gsap.to(flash, { backgroundColor: 'rgba(255,255,255,0)', duration: 0.5 })
                                }
                            );
                        }

                        const aberr = getEffect('aberration');
                        if (aberr) {
                            gsap.to(aberr, { opacity: 0.3, duration: 0.5, yoyo: true, repeat: 3 });
                        }
                        break;
                    }

                    // =============================================================
                    // 🏁 EPILOGUE
                    // =============================================================
                    case 'EPILOGUE': {
                        // 3D: Calme, lent
                        gsap.to(a, { starSpeed: 0.1, duration: 3, ease: 'power2.out' });

                        // CSS: Bloom doré stable
                        const bloom = getEffect('bloom');
                        if (bloom) {
                            bloom.style.background = 'radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, transparent 70%)';
                            gsap.to(bloom, { opacity: 0.5, duration: 3 });
                        }

                        // CSS: Vignette douce
                        const vig = getEffect('vignette');
                        if (vig) {
                            gsap.to(vig, { boxShadow: 'inset 0 0 200px rgba(0,0,0,0.5)', duration: 3 });
                        }
                        break;
                    }

                    default:
                        console.log('Cue inconnue:', cue);
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {/* 3D Canvas — Stars + Grid + Camera uniquement */}
            <div className="fixed inset-0 pointer-events-none bg-black" style={{ zIndex: 0 }}>
                <Canvas
                    dpr={[1, 1.5]}
                    gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
                >
                    <color attach="background" args={['#030712']} />
                    <fog attach="fog" args={['#030712', 5, 40]} />
                    <SceneContent ref={scene3DRef} />
                </Canvas>
            </div>

            {/* CSS Overlay Effects — Bloom, Glitch, Flash, etc. */}
            <CSSOverlayEffects overlayRef={overlayRef} />
        </>
    );
}
