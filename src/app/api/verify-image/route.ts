
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get('image');
        const teamId = formData.get('teamId');

        if (!image || !teamId) {
            return NextResponse.json({ error: 'Missing image or teamId' }, { status: 400 });
        }

        // 1. Fetch Team State - Get the zone assigned to this team from database
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('current_zone, remaining_zones')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return NextResponse.json({ error: 'Team not found in Game DB' }, { status: 404 });
        }

        // 2. Determine zone_id from team's current_zone (assigned by workflow)
        const zoneId = team.current_zone;

        if (!zoneId) {
            return NextResponse.json({ 
                success: false, 
                message: 'No zone assigned to team. Game may be completed.' 
            }, { status: 400 });
        }

        // 3. External Verification - Use team's current_zone from database
        // The workflow assigns zones to teams, and we verify against that assigned zone
        const externalUrl = `https://tinkerhub--treasure-hunt-zones-fastapi-app.modal.run/verify/zone_${zoneId}`;
        console.log(`Verifying Zone ${zoneId} for Team ${teamId} at ${externalUrl}...`);

        const backendFormData = new FormData();
        backendFormData.append('file', image);
        backendFormData.append('team_id', teamId as string);

        const backendRes = await fetch(externalUrl, {
            method: 'POST',
            body: backendFormData,
        });

        if (!backendRes.ok) {
            const text = await backendRes.text();
            console.error('Verification Provider Error:', text);
            // Pass through the error (likely 404 or 400 if invalid)
            return NextResponse.json({ success: false, message: 'Verification Failed' }, { status: backendRes.status });
        }

        const data = await backendRes.json();
        console.log('Verification Result:', data);

        // 4. Game Progression Logic (Supabase)
        // If verification was successful (assume backend returns success or 200 OK means success)

        let updates: any = {};
        let nextZoneId = null;

        if (team.remaining_zones && team.remaining_zones.length > 0) {
            // Move to next zone
            nextZoneId = team.remaining_zones[0];
            const newRemaining = team.remaining_zones.slice(1);

            updates = {
                current_zone: nextZoneId,
                remaining_zones: newRemaining
            };
        } else {
            // NO ZONES LEFT -> VICTORY
            updates = {
                game_end_time: new Date().toISOString()
            };
        }

        // Update DB
        const { error: updateError } = await supabase
            .from('teams')
            .update(updates)
            .eq('id', teamId);

        if (updateError) throw updateError;

        // Log Progress
        await supabase.from('progress').insert([{
            team_id: teamId,
            zone_id: team.current_zone,
            action_type: 'ZONE_VERIFIED',
            is_correct: true
        }]);

        // Return Combined Result
        return NextResponse.json({
            success: true,
            message: 'Zone Verified',
            completed: !nextZoneId,
            nextZone: nextZoneId
        });

    } catch (error: any) {
        console.error('Verify Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
