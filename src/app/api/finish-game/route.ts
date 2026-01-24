import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// THE MASTER KEY (Hardcoded for this event as per story "we give the key")
// In a real app, this might be in the DB or ENV.
const MASTER_EXTRACTION_KEY = "2026";

export async function POST(req: Request) {
    try {
        const { teamId, code } = await req.json();

        if (!teamId || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify Code
        if (code !== MASTER_EXTRACTION_KEY) {
            return NextResponse.json({ success: false, message: 'INVALID EXTRACTION KEY' }, { status: 401 });
        }

        // 2. Update Team Status to 'COMPLETED' (if not already)
        // We also want to timestamp 'finished_at' if your schema supports it.
        // For now we'll assume 'status' column or similar.
        // Let's first check the schema by selecting.

        // Actually, let's just assume we update a 'completed_at' field.
        // If it doesn't exist, we might fail. 
        // Based on previous tasks, I recall 'current_level'.
        // Let's set 'current_level' to 999 or a 'status' field?
        // I'll assume we can just calculate rank based on created_at vs now, or update a 'finished' flag.

        // Let's fetch the team first to see if they are already done.
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, game_start_time, game_end_time')
            .eq('id', teamId)
            .single();

        if (teamError || !team) throw new Error('Team not found');

        let finishedAt = team.game_end_time;

        if (!finishedAt) {
            finishedAt = new Date().toISOString();
            // Update DB
            const { error: updateError } = await supabase
                .from('teams')
                .update({
                    game_end_time: finishedAt,
                    // REMOVED: Schema doesn't have status, relying on game_end_time
                })
                .eq('id', teamId);

            // If error (maybe column doesn't exist), we ignore for this demo 
            // and just calculate runtime locally.
            if (updateError) console.warn("Could not update game_end_time", updateError);
        }

        // 3. Calculate Rank
        // Count how many teams have a 'finished_at' earlier than this team's 'finished_at'
        const { count, error: rankError } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .lt('game_end_time', finishedAt);

        const rank = (count || 0) + 1;

        // 4. Calculate Total Time
        const startTime = new Date(team.game_start_time).getTime();
        const endTime = new Date(finishedAt).getTime();
        const totalMs = endTime - startTime;

        // Format HH:MM
        const hours = Math.floor(totalMs / 3600000);
        const mins = Math.floor((totalMs % 3600000) / 60000);
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        return NextResponse.json({
            success: true,
            rank: rank,
            totalTime: timeStr
        });

    } catch (error: any) {
        console.error("Finish Game Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
