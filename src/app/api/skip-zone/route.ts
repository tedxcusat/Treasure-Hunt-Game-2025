
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { teamId } = body;

        if (!teamId) {
            return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });
        }

        // 1. Fetch Team State
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('current_zone, remaining_zones, unlocked_clues_count')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return NextResponse.json({ error: 'Team not found in Game DB' }, { status: 404 });
        }

        // 2. Unlock Next Clue
        const currentClueCount = team.unlocked_clues_count || 0;
        const nextClueNumber = currentClueCount + 1;

        // 3. Game Progression Logic
        let updates: any = {
            unlocked_clues_count: nextClueNumber
        };
        let nextZoneId = null;

        if (team.remaining_zones && team.remaining_zones.length > 0) {
            // Move to next zone
            nextZoneId = team.remaining_zones[0];
            const newRemaining = team.remaining_zones.slice(1);

            updates.current_zone = nextZoneId;
            updates.remaining_zones = newRemaining;
        } else {
            // NO ZONES LEFT -> VICTORY
            updates.game_end_time = new Date().toISOString();
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
            action_type: 'ZONE_SKIPPED',
            is_correct: true // Technically true as we allowed the skip
        }]);

        // 4. Get Next Zone Name (for UI Feedback)
        let nextZoneName = null;
        if (nextZoneId) {
            const { data: zData } = await supabase
                .from('zones')
                .select('name')
                .eq('id', nextZoneId)
                .single();
            if (zData) nextZoneName = zData.name;
        }

        // Return Result
        return NextResponse.json({
            success: true,
            message: 'Zone Skipped',
            completed: !nextZoneId,
            nextZone: nextZoneId,
            nextZoneName: nextZoneName
        });

    } catch (error: any) {
        console.error('Skip Zone Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
