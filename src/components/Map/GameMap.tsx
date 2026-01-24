import { useEffect, useState, useRef, useMemo } from 'react';
import { Compass, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSound } from '@/hooks/useSound';

// Fix for default Leaflet icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

interface GameMapProps {
    targetLocation?: { lat: number; lng: number };
    userLoc: { lat: number; lng: number } | null;
}

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
    webkitCompassHeading?: number;
    requestPermission?: () => Promise<'granted' | 'denied'>;
}

function MapController({ coords, zoom, followUser, onUserInteraction }: { coords: { lat: number, lng: number }, zoom: number, followUser: boolean, onUserInteraction: () => void }) {
    const map = useMap();

    // 1. Handle Zoom Updates (Always works, regardless of lock)
    useEffect(() => {
        if (map.getZoom() !== zoom) {
            map.setZoom(zoom, { animate: true });
        }
    }, [zoom, map]);

    // 2. Handle Auto-Centering (Only when locked)
    useEffect(() => {
        if (followUser) {
            map.panTo([coords.lat, coords.lng], { animate: true });
        }
    }, [coords, followUser, map]);

    // Detect Manual Interaction
    useEffect(() => {
        const handleInteraction = () => {
            onUserInteraction();
        };

        map.on('dragstart', handleInteraction);
        map.on('zoomstart', handleInteraction); // Optional: if zooming should also break lock

        return () => {
            map.off('dragstart', handleInteraction);
            map.off('zoomstart', handleInteraction);
        };
    }, [map, onUserInteraction]);

    return null;
}

// Helper: Haversine Distance (in meters)
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export default function GameMap({ targetLocation, userLoc }: GameMapProps) {
    const { playSound } = useSound();
    const [jitteredTarget, setJitteredTarget] = useState<{ lat: number; lng: number } | null>(null);
    const [zoomLevel, setZoomLevel] = useState(17);
    // Adjusted: 15 (Wide) / 18 (Close). Avoid 19+ as it causes tile loading issues on some devices.

    // ... jitter effect ...
    useEffect(() => {
        if (!targetLocation) {
            setJitteredTarget(null);
            return;
        }
        const offsetLat = (Math.random() - 0.5) * 0.0002;
        const offsetLng = (Math.random() - 0.5) * 0.0002;
        setJitteredTarget({
            lat: targetLocation.lat + offsetLat,
            lng: targetLocation.lng + offsetLng
        });
    }, [targetLocation]);


    const [heading, setHeading] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [followUser, setFollowUser] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
            // Safe cast to iOS-specific type using helper interface
            const DeviceOrientationEventIOS = DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<'granted' | 'denied'>;
            };

            // Check if permission is needed (iOS 13+)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (typeof DeviceOrientationEventIOS.requestPermission === 'function') {
                setPermissionGranted(false);
            } else {
                setPermissionGranted(true);
            }
        }
    }, []);



    const requestCompassPermission = () => {
        // Safe cast to iOS-specific type
        const DeviceOrientationEventIOS = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };

        if (typeof DeviceOrientationEventIOS.requestPermission === 'function') {
            DeviceOrientationEventIOS.requestPermission()
                .then((response) => {
                    if (response === 'granted') {
                        setPermissionGranted(true);
                    } else {
                        alert('Permission denied');
                    }
                })
                .catch(console.error);
        }
    };

    // Compass Logic
    // Compass Logic
    useEffect(() => {
        if (!permissionGranted) return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            const castedE = e as DeviceOrientationEventiOS;

            // Priority 1: iOS
            if (castedE.webkitCompassHeading) {
                setHeading(castedE.webkitCompassHeading);
                return;
            }

            // Priority 3: Standard Fallback (if Absolute not supported)
            if (!('ondeviceorientationabsolute' in window) && e.alpha) {
                setHeading(360 - e.alpha);
            }
        };

        const handleAbsoluteOrientation = (e: DeviceOrientationEvent) => {
            // Priority 2: Chrome Android Absolute
            if (e.alpha) {
                setHeading(360 - e.alpha);
            }
        };

        // iOS & Standard
        window.addEventListener('deviceorientation', handleOrientation);

        // Chrome Android (Absolute)
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            if ('ondeviceorientationabsolute' in window) {
                window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation);
            }
        };
    }, [permissionGranted]);

    const [routePath, setRoutePath] = useState<[number, number][]>([]);

    // Ref to hold current routePath for useEffect reading without dependency loop
    const routePathRef = useRef<[number, number][]>([]);
    useEffect(() => {
        routePathRef.current = routePath;
    }, [routePath]);

    const lastFetchedLoc = useRef<{ lat: number; lng: number } | null>(null);



    // Responsive Route Trimming (Memoized for atomic updates)
    // Runs synchronously during render -> No flicker/lag
    const displayPath = useMemo(() => {
        if (!userLoc || routePath.length === 0) {
            return [];
        }

        // Find the closest point on the route to the user
        let minDist = Infinity;
        let closestIdx = 0;

        for (let i = 0; i < routePath.length; i++) {
            const d = getDistance(userLoc.lat, userLoc.lng, routePath[i][0], routePath[i][1]);
            if (d < minDist) {
                minDist = d;
                closestIdx = i;
            }
        }

        // Slice existing route from the closest point onwards
        const relevantPath = routePath.slice(closestIdx);

        // Connect user location to that point for a seamless line
        return [[userLoc.lat, userLoc.lng], ...relevantPath] as [number, number][];

    }, [userLoc, routePath]);

    // OSRM Routing Logic (Optimized: Debounced & Thresholded)
    useEffect(() => {
        if (!userLoc || !jitteredTarget) return;

        // Debounce: Wait 1s after movement stops before potentially fetching
        const timer = setTimeout(() => {

            // Threshold Check: Only fetch if moved > 10m from last fetch
            if (lastFetchedLoc.current) {
                const dist = getDistance(
                    userLoc.lat, userLoc.lng,
                    lastFetchedLoc.current.lat, lastFetchedLoc.current.lng
                );
                // If moved less than 10 meters AND we have a route, skip fetch
                if (dist < 10 && routePathRef.current.length > 0) return;
            }

            const fetchRoute = async () => {
                try {
                    // OSRM Public Demo API (Walking Profile)
                    const url = `https://router.project-osrm.org/route/v1/walking/${userLoc.lng},${userLoc.lat};${jitteredTarget.lng},${jitteredTarget.lat}?overview=full&geometries=geojson`;

                    const res = await fetch(url);
                    const data = await res.json();

                    if (data.routes && data.routes.length > 0) {
                        // OSRM returns [lon, lat], Leaflet needs [lat, lon]
                        const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                        setRoutePath(coordinates);
                        lastFetchedLoc.current = userLoc; // Update reference point
                    }
                    // Note: If API fails/returns no routes, we intentionally DO NOT clear the old route.
                    // This prevents "blinking" or disappearing routes during temporary glitches.
                } catch (err) {
                    console.error("Routing Error:", err);
                    // Silent fail - keep existing route
                }
            };

            fetchRoute();

        }, 1000); // 1000ms Debounce

        return () => clearTimeout(timer);
    }, [userLoc, jitteredTarget]);

    // Dynamic User Icon ("The Detective's Torch")
    const userIcon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="relative flex items-center justify-center w-[200px] h-[200px] pointer-events-none">
                <!-- Pulsing "Sonar" Ring -->
                <div class="absolute w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                
                <!-- Rotating Container -->
                <div style="transform: rotate(${heading}deg); transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);" class="relative w-full h-full flex items-center justify-center z-20">
                     <!-- Flashlight Beam (Gradient Cone) -->
                     <svg width="200" height="200" viewBox="0 0 200 200" class="absolute top-0 left-0 overflow-visible opacity-90">
                        <defs>
                            <linearGradient id="beam-grad" x1="0.5" y1="1" x2="0.5" y2="0">
                                <stop offset="0%" stop-color="rgba(250, 204, 21, 0)" />
                                <stop offset="20%" stop-color="rgba(250, 204, 21, 0.4)" />
                                <stop offset="100%" stop-color="rgba(250, 204, 21, 0)" />
                            </linearGradient>
                             <filter id="yellow-glow">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        
                        <!-- The Beam (Wider & Longer) -->
                        <path d="M100 100 L60 20 A 50 50 0 0 1 140 20 Z" fill="url(#beam-grad)" />
                        
                        <!-- Sharp Directional Arrow -->
                        <path d="M100 95 L92 108 L100 104 L108 108 Z" fill="#FACC15" filter="url(#yellow-glow)" />
                    </svg>
                </div>
                
                <!-- Core Dot (Static) -->
                <div class="absolute w-4 h-4 bg-yellow-400 border-2 border-white rounded-full shadow-[0_0_15px_#facc15] z-30"></div>
               </div>`,
        iconSize: [200, 200],
        iconAnchor: [100, 100],
    });

    // Memoize the Target Icon to prevent flickering/restarting animations on re-renders
    const targetIcon = useMemo(() => L.divIcon({
        className: 'bg-transparent',
        html: `<div class="relative flex items-center justify-center w-[160px] h-[160px] pointer-events-none">
            <!-- SVG Container for Smooth Animation -->
            <svg width="160" height="160" viewBox="0 0 160 160" class="absolute inset-0">
                <defs>
                    <!-- High Intensity Glow -->
                    <filter id="neon-glow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                <!-- Rotating Outer Ring (Dashed, Bright Red) -->
                <g class="animate-[spin_10s_linear_infinite]" style="transform-origin: 80px 80px;">
                    <circle cx="80" cy="80" r="78" fill="none" stroke="#FF0000" stroke-width="2" stroke-dasharray="10 10" opacity="0.8" filter="url(#neon-glow)" />
                </g>
                
                <!-- Counter-Rotating Inner Brackets (Bright Red) -->
                <g class="animate-[spin_4s_linear_infinite_reverse]" style="transform-origin: 80px 80px;">
                    <path d="M 80 10 A 70 70 0 0 1 150 80" fill="none" stroke="#FF0000" stroke-width="3" opacity="1" filter="url(#neon-glow)" />
                    <path d="M 80 150 A 70 70 0 0 1 10 80" fill="none" stroke="#FF0000" stroke-width="3" opacity="1" filter="url(#neon-glow)" />
                </g>

                <!-- Scanner Pulse -->
                <circle cx="80" cy="80" r="70" fill="url(#grad-bright)" class="animate-pulse" opacity="0.3">
                    <linearGradient id="grad-bright" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" style="stop-color:rgba(255,0,0,0.3);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgba(255,0,0,0);stop-opacity:1" />
                    </linearGradient>
                </circle>
            </svg>

            <!-- Center Target Label -->
            <div class="absolute -top-6 bg-black/90 backdrop-blur border border-red-500/80 px-2 py-0.5 rounded text-[10px] text-red-500 font-mono font-bold tracking-widest shadow-[0_0_15px_rgba(255,0,0,0.6)] z-20">
                TARGET_ZONE
            </div>

            <!-- Core Dot -->
            <div class="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] z-10"></div>
            <div class="absolute w-full h-full border border-red-500/40 rounded-full scale-50 animate-ping"></div>
           </div>`,
        iconSize: [160, 160],
        iconAnchor: [80, 80]
    }), []); // Empty dependency array as it's static HTML

    if (!userLoc) return <div className="flex h-full items-center justify-center text-mission-red animate-pulse">ACQUIRING GPS SIGNAL...</div>;

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            {/* Compass Permission Button (If needed) */}
            {/* Compass Permission Button (iOS Requirement) */}
            {!permissionGranted && (
                <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
                    <button
                        onClick={requestCompassPermission}
                        className="pointer-events-auto bg-black/80 text-mission-red border border-mission-red/50 px-6 py-4 rounded-xl flex items-center gap-3 backdrop-blur-md font-mono text-sm font-bold animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                    >
                        <Compass className="w-6 h-6" />
                        <span>NO COMPASS SIGNAL<br /><span className="text-[10px] text-gray-400 font-normal opacity-80">TAP TO CALIBRATE</span></span>
                    </button>
                </div>
            )}

            {/* RECENTER BUTTON (Shows when map is moved) */}
            {!followUser && (
                <button
                    onClick={() => {
                        playSound('click');
                        setFollowUser(true);
                    }}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[400] bg-black/60 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg font-mono font-bold text-xs active:scale-95 transition-all animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-auto hover:bg-black/80 hover:border-mission-red/50"
                >
                    <Navigation className="w-3 h-3" />
                    RECENTER
                </button>
            )}

            {/* HUD Elements */}

            {/* ROTATING MAP CONTAINER (Course-Up) */}

            {/* ZOOM CONTROLS (HUD - Static) */}
            {/* ZOOM CONTROL (HUD - Static) - SINGLE TOGGLE */}
            <div className="absolute right-4 bottom-32 z-50 pointer-events-auto">
                <button
                    onClick={() => {
                        playSound('scope');
                        // Toggle between 15 (Wide) and 18 (Close)
                        setZoomLevel(prev => prev === 15 ? 18 : 15);
                    }}
                    className="relative w-16 h-16 flex items-center justify-center group focus:outline-none active:scale-95 transition-transform duration-200"
                >
                    {/* Scope Container - Always Active Style */}
                    <div className="absolute inset-0 rounded-full border-2 border-mission-red bg-black/80 shadow-[0_0_15px_rgba(220,38,38,0.6)]">

                        {/* Crosshair Ticks (SVG) */}
                        <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 100 100">
                            {/* Top Tick */}
                            <line x1="50" y1="0" x2="50" y2="15" stroke="#EF4444" strokeWidth="8" />
                            {/* Bottom Tick */}
                            <line x1="50" y1="100" x2="50" y2="85" stroke="#EF4444" strokeWidth="8" />
                            {/* Left Tick */}
                            <line x1="0" y1="50" x2="15" y2="50" stroke="#EF4444" strokeWidth="8" />
                            {/* Right Tick */}
                            <line x1="100" y1="50" x2="85" y2="50" stroke="#EF4444" strokeWidth="8" />
                        </svg>
                    </div>

                    {/* Text Label - Shows Current Level */}
                    <span className="relative z-10 font-black font-mono text-[10px] text-white tracking-tighter">
                        {zoomLevel === 15 ? 'WIDE' : 'ZOOM'}
                    </span>
                </button>
            </div>

            <div
                className={`absolute top-1/2 left-1/2 origin-center transition-transform will-change-transform ${followUser ? 'duration-200 ease-linear' : 'duration-500 ease-out'}`}
                style={{
                    width: '150vmax',
                    height: '150vmax',
                    transform: `translate(-50%, -50%) rotate(${followUser ? -heading : 0}deg)`
                }}
            >
                <MapContainer
                    center={[userLoc.lat, userLoc.lng]}
                    zoom={18}
                    minZoom={16}
                    maxZoom={20}
                    style={{ height: '100%', width: '100%', background: '#000000' }}
                    zoomControl={false}
                    attributionControl={false}
                    className="z-0"
                    // Mobile Zoom Fixes
                    touchZoom="center"      // Ignores rotation-skewed touch anchors, zooms to center (stable)
                    zoomSnap={0}           // Fluid zoom (not steps)
                    zoomDelta={0.05}       // Micro-steps for smoothness
                    wheelPxPerZoomLevel={120}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        maxNativeZoom={18}
                    />

                    <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                        {/* No Popup for user, just icon */}
                    </Marker>

                    <MapController
                        coords={userLoc}
                        zoom={zoomLevel}
                        followUser={followUser}
                        onUserInteraction={() => setFollowUser(false)}
                    />

                    {/* Navigation Route (Computed Path) */}
                    {jitteredTarget && displayPath.length > 0 && (
                        <>
                            {/* Route: Brighter "Neon" Effect */}
                            {/* Outer Glow (Vivid Red) */}
                            <Polyline
                                positions={displayPath}
                                pathOptions={{
                                    color: '#FF0000', // Pure Red
                                    weight: 8,
                                    opacity: 0.6,
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                    className: 'drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]' // Enhanced Glow
                                }}
                            />
                            {/* Inner Core (White/Pinkish for contrast) */}
                            <Polyline
                                positions={displayPath}
                                pathOptions={{
                                    color: '#FF4444', // Bright Lighter Red
                                    weight: 3,
                                    opacity: 1,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />

                            {/* High-Detail Target Zone Marker (SVG Optimized & Bright) */}
                            <Marker
                                position={[jitteredTarget.lat, jitteredTarget.lng]}
                                icon={targetIcon}
                            />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
