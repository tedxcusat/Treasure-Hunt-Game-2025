import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MOCK_ZONES, DUMMY_CODE } from '@/lib/mockData';

// Helper: Haversine Distance (Meters)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// GET: Fetch Current Zone Data
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
        }

        // MOCK MODE
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || teamId.startsWith('mock-')) {
            // In mock mode, we just return Zone 1 or cycle if we could store state.
            // For simple demo, let's return Zone 1. 2, 3... based on some simple hash or just Zone 1.
            const zone = MOCK_ZONES[0];
            return NextResponse.json({
                startTime: new Date().toISOString(), // Mock Start Time (Now)
                zone: {
                    id: zone.id,
                    name: zone.name,
                    lat: zone.lat,
                    lng: zone.lng,
                    clue: zone.clue,
                    question: zone.question,
                    options: zone.options
                }
            });
        }

        // Supabase Mode
        // Get Team Level & Sequence & Start Time
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('current_level, zone_sequence, created_at')
            .eq('id', teamId)
            .single();

        if (teamError || !team) throw new Error('Team not found');

        // Determine Actual Zone ID
        let actualZoneId = team.current_level;
        if (team.zone_sequence && Array.isArray(team.zone_sequence) && team.zone_sequence.length >= team.current_level) {
            // Arrays are 0-indexed, levels are 1-indexed
            actualZoneId = team.zone_sequence[team.current_level - 1];
        }

        // Get Zone Data (Sanitized - NO Unlock Code returned)
        const { data: zone, error: zoneError } = await supabase
            .from('zones')
            .select('id, name, lat, lng, radius_meters, clues, question, options')
            // Note: In a real secure app, DO NOT return 'code' (unlock_code) here. 
            // However, the current GamePage logic relies on client-side verification for rapid feedback in this demo.
            // If we want strict server-side Verification, we should OMIT 'code' here and only check in POST.
            // The Plan says: "Send entered codes to /api/game for verification instead of local string comparison."
            // SO I WILL REMOVE 'code' from the select to enforce server-side check.
            .eq('id', actualZoneId)
            .single();

        if (zoneError || !zone) {
            // If no zone found, maybe game complete?
            return NextResponse.json({ completed: true });
        }

        // Sanitized Zone Data
        return NextResponse.json({
            startTime: team.created_at, // Send Start Time
            zone: {
                id: zone.id,
                name: zone.name,
                lat: zone.lat,
                lng: zone.lng,
                clue: zone.clues ? zone.clues[0] : "No clue available",
                question: zone.question,
                options: zone.options // JSON array
                // CODE IS HIDDEN
            }
        });

    } catch (error: any) {
        console.error('Game Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Verify Code & Location
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, code, userLat, userLng } = body;

        // MOCK MODE
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || teamId.startsWith('mock-')) {
            if (code === DUMMY_CODE) {
                return NextResponse.json({ success: true, message: 'Code Verified (MOCK)' });
            }
            return NextResponse.json({ success: false, message: 'Invalid Code (Try ' + DUMMY_CODE + ')' });
        }

        // SUPABASE MODE (Existing Logic)
        // Get Team & Current Level
        const { data: team } = await supabase
            .from('teams')
            .select('current_level, zone_sequence')
            .eq('id', teamId)
            .single();
        if (!team) throw new Error('Team not found');

        // Determine Actual Zone ID
        let actualZoneId = team.current_level;
        if (team.zone_sequence && Array.isArray(team.zone_sequence) && team.zone_sequence.length >= team.current_level) {
            actualZoneId = team.zone_sequence[team.current_level - 1];
        }

        // Get Zone Secrets
        const { data: zone } = await supabase
            .from('zones')
            .select('unlock_code, lat, lng, radius_meters')
            .eq('id', actualZoneId)
            .single();

        if (!zone) throw new Error('Zone not found');

        // 1. Check Code
        if (code !== zone.unlock_code) {
            return NextResponse.json({ success: false, message: 'Invalid Code' });
        }

        // 2. Check Geo-Proximity (Optional Security Layer)
        if (userLat && userLng) {
            const distance = calculateDistance(userLat, userLng, zone.lat, zone.lng);
            // Allow a bit more buffer for server-side check (e.g. 500m) to account for GPS drift
            const maxRadius = zone.radius_meters ? zone.radius_meters + 300 : 500;

            if (distance > maxRadius) {
                return NextResponse.json({ success: false, message: `Too far from target! (${Math.round(distance)}m)` });
            }
        }

        // Log Success
        await supabase.from('progress').insert([{
            team_id: teamId,
            zone_id: team.current_level,
            action_type: 'CODE_SUBMIT',
            is_correct: true
        }]);

        return NextResponse.json({ success: true, message: 'Code Verified' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
