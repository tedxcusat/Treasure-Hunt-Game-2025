'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Map as MapIcon, Target, Power, FileText, X, HelpCircle, CheckCircle, Download, RefreshCw, BookOpen, RefreshCcw, Crosshair, AlertTriangle } from 'lucide-react';
import { STORY_PAGES } from '@/lib/storyData';

// Dynamically import Map to prevent SSR issues with Leaflet
const GameMap = dynamic(() => import('@/components/Map/GameMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center text-mission-red animate-pulse">INITIALIZING SAT-LINK...</div>
});



// Dynamically import AR View for performance & no-SSR
const ARView = dynamic(() => import('@/components/AR/ARView'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center text-mission-red animate-pulse">INITIALIZING OPTICS...</div>
});



interface Zone {
    id: number;
    name: string;
    lat: number;
    lng: number;
    clue: string;
    question: string;
    options: string[];
    radius_meters?: number;
}


import { useSound } from '@/hooks/useSound';

export default function GamePage() {
    const router = useRouter();
    const { playSound } = useSound();
    const [viewMode, setViewMode] = useState<'MAP' | 'AR'>('MAP');
    const [teamId, setTeamId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState<string>('');

    // Data State
    const [currentZone, setCurrentZone] = useState<Zone | null>(null);
    const [loadingZone, setLoadingZone] = useState(true);
    const [gameCompleted, setGameCompleted] = useState(false);

    // Timer State
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Modals
    const [showQuitModal, setShowQuitModal] = useState(false);
    const [showClueModal, setShowClueModal] = useState(false);

    // Game Flow State
    const [showChallenge, setShowChallenge] = useState(false); // Code Entry
    const [inputCode, setInputCode] = useState('');
    const [challengeStatus, setChallengeStatus] = useState<'IDLE' | 'CHECKING' | 'SUCCESS' | 'ERROR'>('IDLE');

    // AR State
    const [isNearTarget, setIsNearTarget] = useState(false);
    const [showARButton, setShowARButton] = useState(false);

    // Global GPS State (Hoisted for speed)
    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const handleCapture = () => {
        const canvas = document.querySelector('canvas.a-canvas') as HTMLCanvasElement;
        const video = document.querySelector('video') as HTMLVideoElement;

        if (canvas && video) {
            // Create a temporary canvas for composition
            const composite = document.createElement('canvas');
            const width = canvas.width;
            const height = canvas.height;

            composite.width = width;
            composite.height = height;

            const ctx = composite.getContext('2d');
            if (!ctx) return;

            // 1. Draw Camera Feed (Video)
            // Note: We assume the video and canvas are aligned. 
            // In some AR.js modes, video is larger (to cover). We simply draw it to fill.
            ctx.drawImage(video, 0, 0, width, height);

            // 2. Draw AR Content (Canvas)
            ctx.drawImage(canvas, 0, 0, width, height);

            // 3. Save
            const dataUrl = composite.toDataURL('image/png');
            setCapturedImage(dataUrl);

            // Optional: Play shutter sound or haptic here
            if (navigator.vibrate) navigator.vibrate(50);
            playSound('scope');
        } else if (canvas) {
            // Fallback if video not found (e.g. desktop debug)
            setCapturedImage(canvas.toDataURL('image/png'));
        } else {
            showToast('CAMERA SYSTEM OBSCURED', 'error');
        }
    };

    const [verifying, setVerifying] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleVerify = async () => {
        if (!capturedImage || !currentZone || !teamId) return;
        setVerifying(true);

        try {
            // Convert Base64 to Blob
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            const file = new File([blob], "capture.png", { type: "image/png" });

            const formData = new FormData();
            formData.append('image', file);
            formData.append('zoneId', currentZone.id.toString());
            // Added teamId to request as per user requirement
            formData.append('teamId', teamId);

            // Call Proxy API
            const verifyRes = await fetch('/api/verify-image', {
                method: 'POST',
                body: formData
            });

            const data = await verifyRes.json();

            if (data.success) {
                // Determine Success
                setCapturedImage(null);
                showToast("TARGET VERIFIED! EXCELLENT WORK.", 'success');
                playSound('success');

                if (data.completed) {
                    setTimeout(() => router.push('/success'), 1000);
                } else {
                    // Refresh data for next zone
                    setTimeout(() => fetchZoneData(teamId), 1000);
                }
            } else {
                showToast("VERIFICATION FAILED: TARGET NOT IDENTIFIED.", 'error');
                playSound('error');
            }

        } catch (err) {
            console.error(err);
            showToast("UPLINK ERROR: RETRY VERIFICATION", 'error');
        } finally {
            setVerifying(false);
        }
    };

    const handleQuitConfirm = async () => {
        playSound('click');
        if (teamId) {
            const code = localStorage.getItem('accessCode');
            if (code) {
                // Best effort API call
                try {
                    await fetch('/api/quit', {
                        method: 'POST',
                        body: JSON.stringify({ teamId, accessCode: code })
                    });
                } catch (e) {
                    console.error("Quit API Failed:", e);
                }
            }
        }
        localStorage.removeItem('teamId');
        localStorage.removeItem('teamName');
        localStorage.removeItem('accessCode');
        router.push('/quit');
    };

    const downloadImage = () => {
        if (!capturedImage) return;
        const link = document.createElement('a');
        link.href = capturedImage;
        link.download = `mission-capture-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. Initial Load & Auth Check
    useEffect(() => {
        const storedTeamId = localStorage.getItem('teamId');
        if (!storedTeamId) {
            router.push('/');
            return;
        }
        setTeamId(storedTeamId);
        setTeamName(localStorage.getItem('teamName') || 'UNKNOWN SQUAD');
        fetchZoneData(storedTeamId);
    }, []);

    // 2. Fetch Zone Data
    const fetchZoneData = async (tid: string) => {
        setLoadingZone(true);
        try {
            const res = await fetch(`/api/game?teamId=${tid}`);
            const data = await res.json();

            if (data.error && data.error.includes("Team not found")) {
                showToast('SESSION EXPIRED: LOGGING OUT', 'error');
                localStorage.removeItem('teamId');
                localStorage.removeItem('teamName');
                router.push('/');
                return;
            }

            if (data.completed) {
                setGameCompleted(true);
                router.push('/success');
                return;
            }

            if (data.aborted) {
                router.push('/quit');
                return;
            }

            if (data.zone) {
                setCurrentZone(data.zone);
                setViewMode('MAP');
            } else {
                console.warn('No Zone Data Returned', data);
                // If not completed and no zone, something is wrong.
                showToast('DATA ERROR: ZONE NOT FOUND', 'error');
            }

            // Set Global Timer Start
            if (data.startTime) {
                const start = new Date(data.startTime).getTime();
                setStartTime(start);
                setIsTimerRunning(true);
            } else {
                // Fallback if DB doesn't have time (Shouldn't happen, but safe)
                console.warn("No Start Time Found - Defaulting to Now");
                setStartTime(Date.now());
                setIsTimerRunning(true);
            }
        } catch (err) {
            console.error(err);
            showToast('CONNECTION FAILURE', 'error');
        } finally {
            setLoadingZone(false);
        }
    };

    // GPS Watcher
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation && currentZone) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setUserLoc({ lat: latitude, lng: longitude });

                    // Check Proximity (Mocked locally for UI feedback, but Server verifies)
                    // We keep client check for "Engage AR" button enabling
                    const dist = calculateDistance(latitude, longitude, currentZone.lat, currentZone.lng);
                    const isNear = dist < 200; // 200m Threshold
                    setIsNearTarget(isNear);
                    setShowARButton(isNear);
                },
                (err) => console.error(err),
                { enableHighAccuracy: true, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [currentZone]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Timer Logic: Count UP from Global Start Time
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && startTime) {
            // Update immediately
            const now = Date.now();
            setElapsedSeconds(Math.floor((now - startTime) / 1000));

            interval = setInterval(() => {
                const currentNow = Date.now();
                setElapsedSeconds(Math.floor((currentNow - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, startTime]);

    // Format: HH:MM:SS
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Clue Logic
    // Interaction Handlers

    // Interaction Handlers
    const handleModelClick = useCallback(() => {
        setIsNearTarget(true);
        setShowChallenge(true);
    }, []);

    const verifyCode = async () => {
        if (!teamId || !currentZone) return;
        setChallengeStatus('CHECKING');

        try {
            const res = await fetch('/api/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId,
                    code: inputCode,
                    userLat: userLoc?.lat,
                    userLng: userLoc?.lng
                })
            });
            const data = await res.json();

            if (data.success) {
                setChallengeStatus('SUCCESS');
                setTimeout(() => {
                    setShowChallenge(false);
                    setInputCode('');
                    setChallengeStatus('IDLE');
                }, 1000);
            } else {
                setChallengeStatus('ERROR');
                showToast(data.message || 'INVALID CODE', 'error');
                setTimeout(() => setChallengeStatus('IDLE'), 2000);
            }
        } catch (err) {
            setChallengeStatus('ERROR');
            setTimeout(() => setChallengeStatus('IDLE'), 2000);
        }
    };



    // GPS Error State
    const [gpsError, setGpsError] = useState(false);

    // 3. GPS Watcher (Standard OS Prompt)
    useEffect(() => {
        let watchId: number;

        // Timeout to flag simplified error state
        const timeoutId = setTimeout(() => {
            if (!userLoc) setGpsError(true);
        }, 5000);

        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGpsError(false); // Clear error on success
                },
                (err) => {
                    console.error('GPS Error:', err);
                    setGpsError(true);
                },
                { enableHighAccuracy: true, maximumAge: 0 }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            clearTimeout(timeoutId);
        };
    }, []);

    const retryGPS = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGpsError(false);
            },
            () => showToast('Please enable Location in Browser Settings', 'error'),
            { enableHighAccuracy: true }
        );
    };



    if (loadingZone || !currentZone) {
        return (
            <div className="h-full w-full bg-black flex items-center justify-center flex-col gap-4">
                <div className="w-16 h-16 border-4 border-mission-red border-t-transparent rounded-full animate-spin" />
                <p className="text-mission-red font-mono animate-pulse">ESTABLISHING SECURE UPLINK...</p>
            </div>
        );
    }



    return (
        <div className="relative h-[100dvh] w-full bg-black overflow-hidden flex flex-col font-sans">


            {/* TOAST NOTIFICATION */}
            {/* TOAST NOTIFICATION - DYNAMIC ISLAND STYLE */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`absolute top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm px-6 py-4 rounded-[2rem] shadow-2xl flex items-center justify-between pointer-events-none backdrop-blur-xl ${toast.type === 'success'
                            ? 'bg-green-500/90 shadow-[0_5px_20px_rgba(34,197,94,0.4)]'
                            : 'bg-mission-red/90 shadow-[0_5px_20px_rgba(220,38,38,0.4)]'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-white/20' : 'bg-black/20'}`}>
                                {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
                            </div>
                            <span className="font-bold text-white text-sm tracking-wide">{toast.msg}</span>
                        </div>
                        {toast.type === 'success' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* HUD Layer */}
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">

                <div className="flex justify-between items-start relative z-50 gap-2">
                    <button
                        onClick={() => {
                            playSound('click');
                            setShowQuitModal(true);
                        }}
                        className="pointer-events-auto w-12 h-12 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform backdrop-blur-md hover:border-red-500"
                    >
                        <Power className="w-5 h-5" />
                    </button>

                    <div className="px-6 py-2 bg-black/80 border border-mission-red rounded-full flex items-center gap-2 text-white font-mono text-xl backdrop-blur-md shadow-lg">
                        {formatTime(elapsedSeconds)}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                playSound('click');
                                router.push('/archive');
                            }}
                            className="pointer-events-auto w-12 h-12 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform backdrop-blur-md hover:border-blue-400"
                        >
                            <BookOpen className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => {
                                playSound('click');
                                setShowClueModal(true);
                            }}
                            className="pointer-events-auto w-12 h-12 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform backdrop-blur-md hover:border-yellow-400"
                        >
                            <FileText className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* GPS WARNING BANNER */}
                {gpsError && !userLoc && (
                    <button
                        onClick={retryGPS}
                        className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto bg-red-600/90 backdrop-blur text-white px-6 py-3 rounded-full font-black text-xs shadow-[0_0_20px_rgba(220,0,0,0.5)] animate-pulse z-50 border border-white/20 flex items-center gap-2"
                    >
                        <Target className="w-4 h-4" />
                        NO GPS SIGNAL - TAP TO ENABLE
                    </button>
                )}

                {/* CAPTURE REVIEW OVERLAY */}
                {capturedImage && (
                    <div className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-2 border-mission-red shadow-[0_0_30px_rgba(220,38,38,0.5)] bg-black">
                            {/* HUD CORNERS */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-mission-red z-20" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-mission-red z-20" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-mission-red z-20" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-mission-red z-20" />

                            {/* SCAN LINE ANIMATION */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mission-red/20 to-transparent z-10 animate-scan pointer-events-none" />

                            <img src={capturedImage} alt="Capture" className="w-full h-full object-cover opacity-80" />

                            {/* PREVIEW ACTIONS */}
                            <div className="absolute bottom-6 w-full px-6 flex items-center justify-between z-30">
                                {/* RETAKE (Circular) */}
                                <button
                                    onClick={() => {
                                        playSound('click');
                                        setCapturedImage(null);
                                    }}
                                    className="w-14 h-14 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-90 hover:bg-white/10 transition-all group"
                                >
                                    <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                                </button>

                                {/* VERIFY (Hero Pill) */}
                                <button
                                    onClick={() => {
                                        playSound('click');
                                        handleVerify();
                                    }}
                                    disabled={verifying}
                                    className="flex-1 ml-4 h-14 bg-mission-red text-white font-black text-lg uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-600 border border-white/20"
                                >
                                    {verifying ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Crosshair className="w-5 h-5" />
                                            INITIATE UPLINK
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="text-mission-red font-mono text-xs mt-4 animate-pulse uppercase tracking-[0.2em]">CONFIRM TARGET DATA INTEGRITY</p>
                    </div>
                )}

                {!capturedImage && (
                    <div className="flex justify-between items-end relative z-[60] w-full pointer-events-none">
                        {/* ZONE INDICATOR (Left) - Hide in AR or specific style */}
                        <div className={`flex flex-col gap-1 transition-opacity duration-300 ${viewMode === 'AR' ? 'opacity-50 scale-90 origin-bottom-left' : 'opacity-100'}`}>
                            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">OPERATIVE SQUAD</div>
                            <div className="text-xl font-black text-white font-orbitron tracking-wider truncate max-w-[150px]">{teamName}</div>
                            <div className="bg-black/90 border-l-4 border-mission-red px-4 py-2 skew-x-[-10deg] ml-2 backdrop-blur-md">
                                <div className="skew-x-[10deg] flex items-baseline gap-2">
                                    <span className="text-white font-black text-2xl uppercase italic">ZONE {currentZone?.id?.toString().padStart(2, '0')}</span>
                                    <span className="text-mission-red text-[10px] font-bold animate-pulse">• ACTIVE</span>
                                </div>
                            </div>
                        </div>

                        {/* SWITCH VIEW / CAMERA CONTROLS (Right/Center) */}
                        <div className="flex flex-col items-center gap-2 pointer-events-auto">
                            {viewMode === 'MAP' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center gap-2 mr-4 mb-4"
                                >
                                    <motion.button
                                        onClick={async () => {
                                            playSound('click');
                                            // iOS Safari requires a direct user interaction to prompt for camera.
                                            // We request it here to "prime" the permission, then IMMEDIATELY RELEASE it
                                            // so AR.js can claim the hardware without "Device Busy" errors.
                                            try {
                                                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                                                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                                                    // Critical: Stop the stream immediately to free hardware for AR.js
                                                    stream.getTracks().forEach(track => track.stop());
                                                }
                                            } catch (err) {
                                                console.warn("Camera permission pre-check failed:", err);
                                            }
                                            setViewMode('AR');
                                        }}
                                        whileHover="hover"
                                        whileTap="tap"
                                        initial="idle"
                                        className="w-20 h-20 relative flex items-center justify-center focus:outline-none"
                                    >
                                        {/* Outer Ripple Ring */}
                                        <motion.div
                                            variants={{
                                                idle: { scale: 1, opacity: 0.2 },
                                                hover: { scale: 1.2, opacity: 0.4 },
                                                tap: { scale: 0.9, opacity: 0.6 }
                                            }}
                                            transition={{ duration: 0.4 }}
                                            className="absolute inset-0 bg-mission-red/20 rounded-full border border-mission-red/50"
                                        />

                                        {/* Main Button Body (Red Camera) */}
                                        <motion.div
                                            variants={{
                                                idle: { scale: 1 },
                                                hover: { scale: 1.05 },
                                                tap: { scale: 0.95 }
                                            }}
                                            className="relative w-16 h-16 bg-mission-red rounded-full flex items-center justify-center border-4 border-white/20 shadow-[0_0_20px_rgba(220,38,38,0.6)] z-10"
                                        >
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                                            <Camera className="w-7 h-7 text-white drop-shadow-md" />
                                        </motion.div>

                                        {/* Rotating Reticle Ring */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-1 border-[1px] border-dashed border-white/30 rounded-full z-0"
                                        />
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}

                {/* CAPTURE REVIEW OVERLAY */}
                {capturedImage && (
                    <div className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 pointer-events-auto">
                        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)] bg-black">
                            {/* HUD CORNERS */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 z-20" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 z-20" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 z-20" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 z-20" />

                            {/* Grid Pattern & Scan Line - Visible only when VERIFYING */}
                            {verifying && (
                                <>
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.2)_1px,transparent_1px)] bg-[size:20px_20px] z-20 pointer-events-none" />
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)] animate-[scan_2s_linear_infinite] z-20 pointer-events-none" />
                                    <div className="absolute inset-0 flex items-center justify-center z-30">
                                        <p className="text-green-500 font-mono text-lg tracking-widest animate-pulse font-bold bg-black/50 px-4 py-1 backdrop-blur-sm">ANALYZING BIOMETRICS...</p>
                                    </div>
                                </>
                            )}

                            {/* Standard Static Scan Element (Always there for style) */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent z-10 pointer-events-none" />

                            <img src={capturedImage} alt="Capture" className="w-full h-full object-cover opacity-80" />

                            {/* CLOSE (Top Left) */}
                            <button
                                onClick={() => {
                                    playSound('click');
                                    setCapturedImage(null);
                                }}
                                className="absolute top-4 left-4 z-40 w-12 h-12 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-90 hover:bg-white/10 transition-all group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>

                            {/* RETAKE (Top Right) */}
                            <button
                                onClick={() => {
                                    playSound('click');
                                    setCapturedImage(null);
                                }}
                                className="absolute top-4 right-4 z-40 w-12 h-12 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-90 hover:bg-white/10 transition-all group"
                            >
                                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            </button>

                            {/* PREVIEW ACTIONS */}
                            <div className="absolute bottom-6 w-full px-6 flex items-center justify-center z-30">
                                {/* VERIFY (Hero Pill) */}
                                <button
                                    onClick={() => {
                                        playSound('click');
                                        handleVerify();
                                    }}
                                    disabled={verifying}
                                    className="w-full h-14 bg-green-600 text-white font-black text-lg uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-green-500 border border-white/20"
                                >
                                    {verifying ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Crosshair className="w-5 h-5" />
                                            UPLOAD OBJECT
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="text-green-500 font-mono text-xs mt-4 animate-pulse uppercase tracking-[0.2em]">CONFIRM TARGET DATA INTEGRITY</p>
                    </div>
                )}

                {/* AR SPECIFIC OVERLAY (Absolute Full Screen) */}
                <AnimatePresence>
                    {viewMode === 'AR' && (
                        <>
                            {/* TOP LEFT CLOSE BUTTON */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onClick={() => setViewMode('MAP')}
                                className="absolute top-24 left-6 pointer-events-auto z-[70] w-12 h-12 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                            >
                                <X className="w-6 h-6" />
                            </motion.button>

                            {/* CENTER RETICLE */}
                            <motion.div
                                initial={{ opacity: 0, scale: 1.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                            >
                                <div className="w-64 h-64 border border-white/20 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/60" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/60" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/60" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/60" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-1 h-1 bg-white/50 rounded-full" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* BOTTOM CENTER SHUTTER BUTTON */}
                            <div className="absolute bottom-12 left-0 right-0 z-[70] flex justify-center pointer-events-none">
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 50 }}
                                    onClick={handleCapture}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="pointer-events-auto w-24 h-24 relative flex items-center justify-center focus:outline-none"
                                >
                                    <div className="absolute inset-0 bg-white/10 rounded-full border border-white/30 animate-pulse" />
                                    <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] z-10 transition-colors hover:bg-gray-100">
                                        <div className="w-18 h-18 rounded-full border-2 border-dashed border-gray-400 opacity-50" />
                                    </div>
                                </motion.button>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Main View Area */}
            <div className="absolute inset-0 z-0">
                {viewMode === 'MAP' ? (
                    <GameMap targetLocation={currentZone} userLoc={userLoc} />
                ) : (
                    <ARView targetLocation={currentZone} modelUrl="" onModelClick={handleModelClick} />
                )}
            </div>

            {/* CLUE MODAL */}
            {showClueModal && currentZone && (
                <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="w-full max-w-xs bg-white rounded-[2rem] p-6 text-center shadow-2xl border-4 border-mission-red relative pointer-events-auto">
                        <h3 className="text-mission-red font-black text-lg uppercase tracking-wider mb-6">CURRENT CLUE</h3>
                        <p className="text-gray-800 font-bold text-lg mb-8 leading-relaxed">
                            {currentZone.clue}
                        </p>
                        <div className="h-px bg-gray-200 w-full mb-6" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-4">FIND THE LOCATION</p>
                        <button
                            onClick={() => setShowClueModal(false)}
                            className="w-full bg-mission-red text-white font-black py-4 rounded-xl shadow-lg active:scale-95"
                        >
                            GOT IT
                        </button>
                    </div>
                </div>
            )}

            {/* CHALLENGE MODAL: CODE ENTRY */}
            {showChallenge && (
                <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white border-4 border-white shadow-2xl rounded-[2rem] p-8 text-center relative pointer-events-auto">
                        <button onClick={() => setShowChallenge(false)} className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 hover:bg-gray-200">
                            <X className="w-4 h-4 text-black" />
                        </button>
                        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Target className="w-10 h-10 text-mission-red animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-black mb-2 uppercase italic tracking-tighter">Artifact Found</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium">Enter the 5-digit code from sticker.</p>
                        <input
                            type="text"
                            maxLength={5}
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            className="w-full bg-gray-100/50 border-b-4 border-gray-200 text-black text-4xl font-black text-center py-4 tracking-[0.2em] focus:outline-none focus:border-mission-red placeholder-gray-300 mb-8 transition-colors rounded-t-xl"
                            placeholder="#####"
                        />
                        <button
                            onClick={verifyCode}
                            disabled={challengeStatus === 'CHECKING'}
                            className={`w-full py-4 font-black text-white text-lg rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest ${challengeStatus === 'ERROR' ? 'bg-red-500' :
                                challengeStatus === 'SUCCESS' ? 'bg-green-500' : 'bg-mission-red hover:bg-black'
                                }`}
                        >
                            {challengeStatus === 'CHECKING' ? 'VERIFYING...' :
                                challengeStatus === 'SUCCESS' ? 'CLEARED' :
                                    challengeStatus === 'ERROR' ? 'INVALID' : 'UNLOCK'}
                        </button>
                    </div>
                </div>
            )}




            {showQuitModal && (
                <div className="absolute inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl pointer-events-auto">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Power className="w-8 h-8 text-mission-red" />
                        </div>
                        <h3 className="text-2xl font-black text-black mb-2 uppercase">ABORT MISSION?</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium">Progress will be lost.</p>
                        <div className="space-y-3">
                            <button onClick={handleQuitConfirm} className="w-full py-4 font-black text-white bg-mission-red rounded-xl shadow-lg active:scale-95">YES, QUIT</button>
                            <button onClick={() => { playSound('click'); setShowQuitModal(false); }} className="w-full py-4 font-bold text-gray-600 bg-gray-100 rounded-xl">CANCEL</button>
                        </div>
                    </div>
                </div>
            )}





            {/* Global Red Border Overlay - Tuned for rounded corners */}
            <div className="absolute inset-0 pointer-events-none border-[3px] border-mission-red rounded-[2rem] z-40 m-1" />
        </div>
    );
}
