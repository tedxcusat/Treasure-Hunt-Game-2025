
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { teamId, accessCode } = await req.json();

        if (!teamId || !accessCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

        if (teamError || !team) throw new Error('Team not found');

        // 2. Identify User & Update Active Status
        let updateColumn = null;
        if (team.leader_verified_code === accessCode) updateColumn = 'leader_is_active';
        else if (team.member1_verified_code === accessCode) updateColumn = 'member1_is_active';
        else if (team.member2_verified_code === accessCode) updateColumn = 'member2_is_active';
        else if (team.member3_verified_code === accessCode) updateColumn = 'member3_is_active';
        else if (team.member4_verified_code === accessCode) updateColumn = 'member4_is_active';

        if (!updateColumn) {
            return NextResponse.json({ error: 'Invalid Access Code for this Team' }, { status: 403 });
        }

        // Set THIS user to inactive
        const updates: any = { [updateColumn]: false };

        // 3. Check if ALL *Registered* members are now inactive
        // We simulate the state *after* this update
        const nextState = { ...team, [updateColumn]: false };

        const isLeaderActive = nextState.leader_is_active;
        const isMem1Active = nextState.member1_email ? nextState.member1_is_active : false; // If member exists, check status. If not, treat as 'inactive/irrelevant' (false)
        const isMem2Active = nextState.member2_email ? nextState.member2_is_active : false;
        const isMem3Active = nextState.member3_email ? nextState.member3_is_active : false;
        const isMem4Active = nextState.member4_email ? nextState.member4_is_active : false;

        // "All Quits" means NO ONE is active.
        const anyoneActive = isLeaderActive || isMem1Active || isMem2Active || isMem3Active || isMem4Active;

        if (!anyoneActive) {
            // EVERYONE HAS QUIT -> STOP TIMER
            if (!team.game_end_time) {
                updates.game_end_time = new Date().toISOString();
                console.log(`Team ${teamId} has fully quit. Timer stopped.`);
            }
        }

        // 4. Update DB
        const { error: updateError } = await supabase
            .from('teams')
            .update(updates)
            .eq('id', teamId);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            gameEnded: !anyoneActive
        });

    } catch (error: any) {
        console.error("Quit API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
