import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MOCK_ZONES } from '@/lib/mockData';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, answer } = body;

        // MOCK MODE
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || teamId.startsWith('mock-')) {
            // For demo, we just verify against Zone 1's answer
            const zone = MOCK_ZONES[0];
            if (answer.toLowerCase().trim() === zone.answer.toLowerCase().trim()) {
                return NextResponse.json({ success: true, nextLevel: 2, message: 'Level Cleared (MOCK)' });
            }
            return NextResponse.json({ success: false, message: 'Incorrect Answer' });
        }

        // SUPABASE MODE
        // Get Team & Level
        const { data: team } = await supabase.from('teams').select('current_level').eq('id', teamId).single();
        if (!team) throw new Error('Team not found');

        // Get Correct Answer
        const { data: zone } = await supabase
            .from('zones')
            .select('answer')
            .eq('id', team.current_level)
            .single();

        if (!zone) throw new Error('Zone Data Missing');

        // Verify Answer (Case Insensitive)
        if (answer.toLowerCase().trim() !== zone.answer.toLowerCase().trim()) {
            return NextResponse.json({ success: false, message: 'Incorrect Answer' });
        }

        // CORRECT: Level Up!
        const nextLevel = team.current_level + 1;

        // 1. Update Team Level
        const { error: updateError } = await supabase
            .from('teams')
            .update({ current_level: nextLevel, completed_at: nextLevel > 6 ? new Date() : null })
            .eq('id', teamId);

        if (updateError) throw updateError;

        // 2. Log Progress
        await supabase.from('progress').insert([{
            team_id: teamId,
            zone_id: team.current_level,
            action_type: 'LORE_ANSWER',
            is_correct: true
        }]);

        return NextResponse.json({ success: true, nextLevel, message: 'Level Cleared' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
