
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { teamName, leaderName, email, phone, members } = body;

        if (!teamName || !leaderName || !email || !phone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for Placeholder Keys
        if (supabaseUrl.includes('placeholder')) {
            return NextResponse.json({
                error: 'SERVER CONFIG ERROR: Supabase Keys are missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
            }, { status: 500 });
        }

        // 1. Generate Unique 4-Digit Code
        let accessCode = '';
        let isUnique = false;

        // Retries to ensuring uniqueness
        for (let i = 0; i < 5; i++) {
            const potentialCode = Math.floor(1000 + Math.random() * 9000).toString();
            // Check if exists
            const { data } = await supabase.from('teams').select('id').eq('access_code', potentialCode).single();
            if (!data) {
                accessCode = potentialCode;
                isUnique = true;
                break;
            }
        }

        if (!isUnique) throw new Error('Failed to generate unique code. Please try again.');

        // 2. Insert into DB
        const { data: team, error } = await supabase
            .from('teams')
            .insert({
                name: teamName,
                leader_name: leaderName,
                email,
                phone,
                members,
                access_code: accessCode
            })
            .select()
            .single();

        if (error) {
            console.error('DB Error:', error);
            throw new Error(error.message);
        }

        // 3. Return the code to frontend (No Email)
        return NextResponse.json({
            success: true,
            accessCode: accessCode,
            teamId: team.id
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
