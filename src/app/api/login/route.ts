import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { accessCode } = body;

        if (!accessCode) {
            return NextResponse.json({ error: 'Code Required' }, { status: 400 });
        }

        // MOCK MODE
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || accessCode === '1234') {
            // Allow '1234' as universal mock if no DB or if explicitly used.
            if (accessCode === '1234') {
                return NextResponse.json({
                    success: true,
                    teamId: 'mock-team-' + Date.now(),
                    name: 'MOCK SQUAD'
                });
            }
            // If Mock Mode but wrong code (and no DB), fail
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
                return NextResponse.json({ error: 'Invalid Mock Code (Try 1234)' }, { status: 401 });
            }
        }

        // SUPABASE MODE
        const { data: team, error } = await supabase
            .from('teams')
            .select('*')
            .or(`leader_verified_code.eq.${accessCode},member1_verified_code.eq.${accessCode},member2_verified_code.eq.${accessCode},member3_verified_code.eq.${accessCode},member4_verified_code.eq.${accessCode}`)
            .single();

        if (error || !team) {
            return NextResponse.json({ error: 'Invalid Access Code' }, { status: 401 });
        }

        // Determine Role & Update Active Status
        let updateColumn = null;
        if (String(team.leader_verified_code) === String(accessCode)) {
            updateColumn = 'leader_is_active';
        }
        else if (String(team.member1_verified_code) === String(accessCode)) {
            updateColumn = 'member1_is_active';
        }
        else if (String(team.member2_verified_code) === String(accessCode)) {
            updateColumn = 'member2_is_active';
        }
        else if (String(team.member3_verified_code) === String(accessCode)) {
            updateColumn = 'member3_is_active';
        }
        else if (String(team.member4_verified_code) === String(accessCode)) {
            updateColumn = 'member4_is_active';
        }

        if (updateColumn) {
            await supabase.from('teams').update({ [updateColumn]: true }).eq('id', team.id);
        }

        return NextResponse.json({
            success: true,
            teamId: team.id,
            name: team.team_name
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
