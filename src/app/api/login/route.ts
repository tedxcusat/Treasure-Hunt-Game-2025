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
            .select('id, name')
            .eq('access_code', accessCode)
            .single();

        if (error || !team) {
            return NextResponse.json({ error: 'Invalid Access Code' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            teamId: team.id,
            name: team.name
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
