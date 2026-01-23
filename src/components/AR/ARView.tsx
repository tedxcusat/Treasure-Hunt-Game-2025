// @ts-nocheck
'use client';

import Script from 'next/script';
import { useEffect, useState, memo } from 'react';

interface ARViewProps {
    targetLocation: { lat: number; lng: number };
    modelUrl: string; // e.g., "/3dAssets/x.glb"
    onModelClick?: () => void;
}

function ARView({ targetLocation, modelUrl, onModelClick }: ARViewProps) {
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    useEffect(() => {
        // Instant check: If A-Frame is already in window (re-entry), skip loading state
        // @ts-ignore
        if (typeof window !== 'undefined' && window.AFRAME) {
            setScriptsLoaded(true);
        }
    }, []);

    useEffect(() => {
        // Custom click handler for A-Frame entities
        if (typeof window !== 'undefined') {
            // Register a-frame component to handle clicks if not exists
            // @ts-expect-error - AFRAME is loaded globally via script
            if (window.AFRAME && !window.AFRAME.components['click-handler']) {
                // @ts-expect-error - AFRAME is loaded globally via script
                window.AFRAME.registerComponent('click-handler', {
                    init: function () {
                        this.el.addEventListener('click', () => {
                            if (onModelClick) onModelClick();
                        });
                        this.el.addEventListener('touchstart', () => { // specific for mobile
                            if (onModelClick) onModelClick();
                        });
                    }
                });
            }
        }
    }, [scriptsLoaded, onModelClick]);

    useEffect(() => {
        // Aggressive cleanup: Find the video and force it to be invisible
        const cleanupVideo = () => {
            // AR.js usually appends a video tag to the body
            const videos = document.querySelectorAll('body > video');
            videos.forEach(v => {
                const video = v as HTMLVideoElement;

                // Force iOS compatibility (Critical)
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.muted = true;

                // We keep it in the DOM but make it effectively invisible and non-interactive
                video.style.opacity = '0';
                video.style.zIndex = '-9999';
                video.style.position = 'fixed';
                video.style.pointerEvents = 'none';
            });
        };

        const interval = setInterval(cleanupVideo, 500);

        // CLEANUP ON UNMOUNT: STOP CAMERA
        return () => {
            clearInterval(interval);
            const videos = document.querySelectorAll('video');
            videos.forEach(v => {
                const video = v as HTMLVideoElement;
                // Stop the Stream
                if (video.srcObject) {
                    const stream = video.srcObject as MediaStream;
                    const tracks = stream.getTracks();
                    tracks.forEach(track => track.stop());
                }
                // Remove from DOM
                video.remove();
            });
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden rounded-[2rem] bg-black">
            {/* Canvas Styling & Nuclear Video Fix */}
            <style jsx global>{`
                /* Hide the raw video element created by AR.js attached to body */
                body > video {
                    opacity: 0 !important;
                    z-index: -9999 !important;
                    position: fixed !important;
                    pointer-events: none !important;
                    /* Do not change width/height or display, let it run in background */
                }
                
                #arjs-video {
                    opacity: 0 !important;
                    z-index: -9999 !important;
                }

                /* Ensure canvas fits the container */
                .a-canvas {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    display: block !important;
                }
                /* Hide generic A-Frame Enter VR button */
                .a-enter-vr {
                    display: none !important;
                }
            `}</style>

            <Script
                src="https://aframe.io/releases/1.3.0/aframe.min.js"
                strategy="afterInteractive"
                onLoad={() => {
                    // Script loaded
                }}
            />
            {/* Using the standard build for Location Based AR */}
            <Script
                src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"
                strategy="afterInteractive"
                onLoad={() => setScriptsLoaded(true)}
            />

            {scriptsLoaded ? (
                // A-Frame elements are not standard JSX
                <a-scene
                    vr-mode-ui="enabled: false"
                    loading-screen="enabled: false"
                    arjs="sourceType: webcam; debugUIEnabled: false; videoTexture: true;"
                    renderer="antialias: true; alpha: true; precision: medium; preserveDrawingBuffer: true;"
                    embedded
                    className="z-10 w-full h-full block"
                >
                    {/* Camera with GPS - using basics for compatibility */}
                    <a-camera gps-camera rotation-reader></a-camera>

                    {/* glTF Model at GPS Location */}
                    <a-entity
                        gltf-model={modelUrl}
                        scale="1 1 1"
                        gps-new-entity-place={`latitude: ${targetLocation.lat}; longitude: ${targetLocation.lng}`}
                        click-handler
                        cursor="rayOrigin: mouse"
                    ></a-entity>
                </a-scene>
            ) : (
                <div className="flex items-center justify-center h-full w-full text-white animate-pulse">
                    INITIALIZING OPTICS...
                </div>
            )}

            {/* CAMERA PERMISSION FALLBACK */}
            {/* If the background is black for too long, user sees this */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${scriptsLoaded ? 'z-50' : 'hidden'}`}>
                {/* We use a simple CSS animation delay to show this button only if camera takes too long (3s) */}
                <button
                    onClick={() => {
                        // Critical Check: Is API available? (Fails on HTTP non-localhost)
                        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                            alert("Camera API not found. You might be on HTTP. Please use HTTPS.");
                            return;
                        }

                        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                            .then(() => window.location.reload()) // Reload to let AR.js attach to the fresh permission
                            .catch(e => {
                                console.error("Cam Error:", e);
                                alert("Camera blocked: " + e.message + ". Check Site Settings.");
                            });
                    }}
                    className="pointer-events-auto bg-mission-red text-white px-6 py-4 rounded-xl font-black tracking-widest uppercase shadow-2xl animate-in fade-in fill-mode-forwards opacity-0 duration-1000 delay-[4000ms]"
                    style={{ animationDelay: '4s' }}
                >
                    Enable Camera
                </button>
            </div>
        </div>
    );
}

export default memo(ARView);
