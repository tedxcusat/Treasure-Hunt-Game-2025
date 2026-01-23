import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

function MapController({ coords }: { coords: { lat: number, lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([coords.lat, coords.lng], map.getZoom());
    }, [coords, map]);
    return null;
}

export default function GameMap({ targetLocation, userLoc }: GameMapProps) {
    // Memoize jittered target to avoid useEffect state updates
    // Use useState lazy initializer to ensure randomness only happens once per target change (if we key by target, but here we just want it once per mount or we use useEffect)
    // Actually, simple useState with effect is better if target changes.
    // Let's use useMemo but with a seed? No.
    // React docs suggest: data generation should happen in effects or event handlers, not during render.
    // So let's revert to useEffect but use a ref to check if changed?
    // Or just use `useMemo` is fine if we accept it's not strictly pure? No, React 18 strict mode double invokes.
    // Best: useState for the offset.

    const [jitteredTarget, setJitteredTarget] = useState<{ lat: number; lng: number } | null>(null);

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
    const [routePath, setRoutePath] = useState<[number, number][]>([]);

    // Ref to hold current routePath for useEffect reading without dependency loop
    const routePathRef = useRef<[number, number][]>([]);
    useEffect(() => {
        routePathRef.current = routePath;
    }, [routePath]);

    // Compass Logic
    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            const castedE = e as DeviceOrientationEventiOS;
            if (castedE.webkitCompassHeading) {
                // iOS
                setHeading(castedE.webkitCompassHeading);
            } else if (e.alpha) {
                // Android / Standard (Approximate)
                setHeading(360 - e.alpha);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const lastFetchedLoc = useRef<{ lat: number; lng: number } | null>(null);

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
        html: `<div class="relative flex items-center justify-center w-[160px] h-[160px] pointer-events-none">
                <!-- Pulsing "Sonar" Ring -->
                <div class="absolute w-4 h-4 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
                
                <!-- Rotating Container -->
                <div style="transform: rotate(${heading}deg); transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);" class="relative w-full h-full flex items-center justify-center z-20">
                     <!-- Flashlight Beam (Gradient Cone) -->
                     <svg width="160" height="160" viewBox="0 0 160 160" class="absolute top-0 left-0 overflow-visible opacity-80">
                        <defs>
                            <linearGradient id="beam-grad" x1="0.5" y1="1" x2="0.5" y2="0">
                                <stop offset="0%" stop-color="rgba(34, 211, 238, 0)" />
                                <stop offset="20%" stop-color="rgba(34, 211, 238, 0.3)" />
                                <stop offset="100%" stop-color="rgba(34, 211, 238, 0)" />
                            </linearGradient>
                             <filter id="cyan-glow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        
                        <!-- The Beam -->
                        <path d="M80 80 L50 20 A 40 40 0 0 1 110 20 Z" fill="url(#beam-grad)" />
                        
                        <!-- Sharp Directional Arrow -->
                        <path d="M80 75 L75 85 L80 82 L85 85 Z" fill="#22D3EE" filter="url(#cyan-glow)" />
                    </svg>
                </div>
                
                <!-- Core Dot (Static) -->
                <div class="absolute w-3 h-3 bg-cyan-400 border-2 border-white rounded-full shadow-[0_0_10px_#22d3ee] z-30"></div>
               </div>`,
        iconSize: [160, 160],
        iconAnchor: [80, 80],
    });

    if (!userLoc) return <div className="flex h-full items-center justify-center text-mission-red animate-pulse">ACQUIRING GPS SIGNAL...</div>;

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            {/* HUD Elements */}

            {/* ROTATING MAP CONTAINER (Course-Up) */}
            <div
                className="absolute top-1/2 left-1/2 origin-center transition-transform duration-200 ease-linear will-change-transform"
                style={{
                    width: '150vmax',
                    height: '150vmax',
                    transform: `translate(-50%, -50%) rotate(${-heading}deg)`
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
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        maxNativeZoom={18}
                    />

                    <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                        {/* No Popup for user, just icon */}
                    </Marker>

                    <MapController coords={userLoc} />

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
                                icon={L.divIcon({
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
                                            <g class="origin-center animate-[spin_10s_linear_infinite]">
                                                <circle cx="80" cy="80" r="78" fill="none" stroke="#FF0000" stroke-width="2" stroke-dasharray="10 10" opacity="0.8" filter="url(#neon-glow)" />
                                            </g>
                                            
                                            <!-- Counter-Rotating Inner Brackets (Bright Red) -->
                                            <g class="origin-center animate-[spin_4s_linear_infinite_reverse]">
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
                                })}
                            />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
