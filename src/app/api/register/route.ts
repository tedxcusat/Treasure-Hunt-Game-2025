
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

import { sendTeamCode } from '@/lib/email';


export async function POST(req: Request) {
    console.log("🟢 REGISTER API - VERCEL REDEPLOY TRIGGER");
    console.log("ENV CHECK - SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING");
    console.log("ENV CHECK - GMAIL:", process.env.GMAIL_USER ? "SET" : "MISSING");

    try {
        const body = await req.json();
        const { teamName, leaderName, email, phone, members } = body; // members is array of strings (names)

        if (!teamName || !leaderName || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if Team/Email already exists (Idempotency for Retries)
        const { data: existingTeam } = await supabase
            .from('teams')
            .select('id, leader_verified_code, team_name')
            .or(`team_name.eq.${teamName},leader_email.eq.${email}`)
            .single();

        if (existingTeam) {
            // If team exists, return their code (Recover session)
            // If team exists, return their code (Recover session)
            return NextResponse.json({
                success: true,
                teamId: existingTeam.id,
                accessCode: existingTeam.leader_verified_code,
                message: 'Team already registered. retrieving details.'
            });
        }

        // 2. Generate Unique 4-Digit Codes for Leader + 4 Members
        const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

        // Generate a set of unique codes for this team
        const teamCodes = new Set<string>();
        while (teamCodes.size < 5) {
            teamCodes.add(generateCode());
        }
        const codes = Array.from(teamCodes);
        const leaderCode = codes[0];
        const memberCodes = codes.slice(1); // 4 codes for members

        // 3. Generate Random Zone Sequence (1-6)
        const zones = [1, 2, 3, 4, 5, 6];
        const shuffledZones = shuffleArray([...zones]);
        const startZone = shuffledZones[0];
        const remainingZones = shuffledZones.slice(1);

        // 4. Prepare Payload
        const payload: any = {
            team_name: teamName,
            leader_name: leaderName,
            leader_email: email,
            leader_verified_code: leaderCode,
            leader_is_active: true,

            // Members Emails & Codes
            member1_email: members[0] || 'N/A',
            member1_verified_code: members[0] ? memberCodes[0] : null,

            member2_email: members[1] || null,
            member2_verified_code: members[1] ? memberCodes[1] : null,

            member3_email: members[2] || null,
            member3_verified_code: members[2] ? memberCodes[2] : null,

            member4_email: members[3] || null,
            member4_verified_code: members[3] ? memberCodes[3] : null,

            // Random Sequence Logic
            current_zone: startZone,
            remaining_zones: remainingZones,

            game_start_time: new Date().toISOString()
        };

        // 5. Insert into DB
        const { data: team, error } = await supabase
            .from('teams')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Registration DB Error:', error);
            // Fallback collision check
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Team Name or Email already exists. Please login.' }, { status: 400 });
            }
            throw new Error(error.message);
        }

        // 6. Send Individual Emails (Best Effort)
        try {
            const recipients = [
                { email: email, code: leaderCode },
                ...members.map((m: string, i: number) => ({ email: m, code: memberCodes[i] }))
            ].filter(r => r.email);

            // Don't await strictly if performance is issue, but Vercel freezes lambda.
            // We await but catch error so we return success to user regardless.
            // UPDATE: Removing await to fix "Fetch Failed" timeout on mobile. 
            // Vercel might kill this, but UI success > Email success.
            sendTeamCode(recipients, teamName).catch(err => console.error("Background Email Error:", err));
        } catch (emailErr) {
            console.error("Email sending failed (non-critical):", emailErr);
        }

        // 7. Return Success
        return NextResponse.json({
            success: true,
            teamId: team.id,
            accessCode: leaderCode
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
