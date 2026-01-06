import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamName, members } = body;

        if (!teamName) {
            return NextResponse.json({ error: 'Team Name is required' }, { status: 400 });
        }

        // Mock Mode Check
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.log('Running in Mock Mode (No Supabase Keys)');
            const mockId = 'mock-team-' + Math.random().toString(36).substring(7);
            const mockCode = '1234'; // Simple Mock Code
            return NextResponse.json({
                success: true,
                teamId: mockId,
                accessCode: mockCode,
                name: teamName
            });
        }

        // Generate a random 4-digit numeric access code
        const accessCode = Math.floor(1000 + Math.random() * 9000).toString();

        const { data, error } = await supabase
            .from('teams')
            .insert([
                {
                    name: teamName,
                    members: members || [],
                    access_code: accessCode,
                    current_level: 1
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            teamId: data.id,
            accessCode: data.access_code,
            name: data.name
        });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
