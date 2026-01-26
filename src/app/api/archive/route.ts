import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CLUE_IMAGES, getClueImagePath } from '@/lib/clueLoader';
import fs from 'fs';
import path from 'path';

// Server-side function to read clue text files
// Note: story_clues folder should be in project root for server-side access
function readClueText(clueNumber: number): string | null {
    try {
        // Try root directory first
        let cluePath = path.join(process.cwd(), 'story_clues', `clue_${clueNumber}`, `clue_${clueNumber}.txt`);
        if (!fs.existsSync(cluePath)) {
            // Fallback: try public directory
            cluePath = path.join(process.cwd(), 'public', 'story_clues', `clue_${clueNumber}`, `clue_${clueNumber}.txt`);
        }
        if (fs.existsSync(cluePath)) {
            return fs.readFileSync(cluePath, 'utf-8').trim();
        }
        return null;
    } catch (error) {
        console.error(`Error reading clue ${clueNumber}:`, error);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
        }

        // Fetch team's unlocked clues count
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('unlocked_clues_count')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const unlockedCount = team.unlocked_clues_count || 0;
        const clues = [];

        // Load all unlocked clues (1 to unlockedCount)
        for (let i = 1; i <= unlockedCount; i++) {
            const text = readClueText(i);
            const images = CLUE_IMAGES[i] || [];

            if (text !== null) {
                clues.push({
                    number: i,
                    text: text,
                    images: images.map(img => ({
                        name: img,
                        path: getClueImagePath(i, img)
                    }))
                });
            }
        }

        return NextResponse.json({
            success: true,
            clues: clues
        });

    } catch (error: any) {
        console.error('Archive API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
