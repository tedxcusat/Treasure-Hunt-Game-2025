'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Target, Navigation } from 'lucide-react';

// Fix for default Leaflet icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

// Custom Mission Icon
// Custom Mission Icon (Scanner Style from Screenshot)
const userIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="relative flex items-center justify-center w-[120px] h-[120px] pointer-events-none">
            <!-- Center Dot (The User) -->
            <div class="relative w-3 h-3 bg-mission-red border-[1.5px] border-white rounded-full shadow-[0_0_8px_rgba(220,38,38,1)] z-20"></div>
            
            <!-- Proximity Ring (Scanner Scope) -->
            <div class="absolute w-[80px] h-[80px] rounded-full border border-mission-red/50 bg-mission-red/5 shadow-[0_0_15px_rgba(220,38,38,0.15)] z-10"></div>
            
            <!-- Subtle Pulse for "Live" feel -->
            <div class="absolute w-[80px] h-[80px] rounded-full border border-mission-red/30 animate-pulse opacity-50 z-0"></div>
           </div>`,
    iconSize: [120, 120], // Large container for ring
    iconAnchor: [60, 60], // Center exactly
});

interface GameMapProps {
    targetLocation?: { lat: number; lng: number };
    userLoc: { lat: number; lng: number } | null;
}

function MapController({ coords }: { coords: { lat: number, lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([coords.lat, coords.lng], map.getZoom());
    }, [coords, map]);
    return null;
}

export default function GameMap({ targetLocation, userLoc }: GameMapProps) {
    const [jitteredTarget, setJitteredTarget] = useState<{ lat: number; lng: number } | null>(null);

    // Apply Jitter to Target (Re-calculate whenever target changes)
    useEffect(() => {
        if (targetLocation) {
            // Add ~10m offset
            const offsetLat = (Math.random() - 0.5) * 0.0002;
            const offsetLng = (Math.random() - 0.5) * 0.0002;
            setJitteredTarget({
                lat: targetLocation.lat + offsetLat,
                lng: targetLocation.lng + offsetLng
            });
        }
    }, [targetLocation]);

    if (!userLoc) return <div className="flex h-full items-center justify-center text-mission-red animate-pulse">ACQUIRING GPS SIGNAL...</div>;

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            {/* HUD Elements */}
            <MapContainer
                center={[userLoc.lat, userLoc.lng]}
                zoom={18}
                minZoom={16}
                maxZoom={19}
                style={{ height: '100%', width: '100%', background: '#000000' }}
                zoomControl={false}
                attributionControl={false}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                    {/* No Popup for user, just icon */}
                </Marker>

                <MapController coords={userLoc} />

                {/* Target Zone (Jittered) */}
                {jitteredTarget && (
                    <Circle
                        center={[jitteredTarget.lat, jitteredTarget.lng]}
                        radius={60}
                        pathOptions={{
                            color: '#E60000',
                            fillColor: '#E60000',
                            fillOpacity: 0.1,
                            dashArray: '10, 10'
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}
