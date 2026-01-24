'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface TeamRank {
    name: string;
    rank: number;
    time: string; // Formatted HH:MM
    isCurrentUser: boolean;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<TeamRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [myRank, setMyRank] = useState<TeamRank | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const myTeamId = localStorage.getItem('teamId');

            // Fetch all COMPLETED teams, ordered by game_end_time (asc)
            const { data, error } = await supabase
                .from('teams')
                .select('id, team_name, game_start_time, game_end_time')
                .not('game_end_time', 'is', null)
                .order('game_end_time', { ascending: true });

            if (error) throw error;

            console.log('Raw Leaderboard Data:', data);

            // Process rankings
            // Sorting Logic: Lowest Duration (game_end_time - game_start_time)

            const processed = (data || []).map((team) => {
                const start = new Date(team.game_start_time).getTime();
                const end = new Date(team.game_end_time).getTime();
                const durationMs = end - start;

                return {
                    id: team.id,
                    name: team.team_name,
                    durationMs,
                    isCurrentUser: team.id === myTeamId
                };
            });

            // Sort by duration
            processed.sort((a, b) => a.durationMs - b.durationMs);

            // Map to Display Format
            const final = processed.map((team, idx) => {
                const hours = Math.floor(team.durationMs / 3600000);
                const mins = Math.floor((team.durationMs % 3600000) / 60000);
                const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

                const rankItem = {
                    name: team.name,
                    rank: idx + 1,
                    time: timeStr,
                    isCurrentUser: team.isCurrentUser
                };

                if (team.isCurrentUser) {
                    setMyRank(rankItem);
                }
                return rankItem;
            });

            setLeaderboard(final);
        } catch (err) {
            console.error('Leaderboard Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-full min-h-screen bg-white text-black font-sans p-6">
            {/* Background Grid */}
            <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-50" />

            <div className="relative z-10 max-w-md mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-black uppercase tracking-wider">Live Standings</h1>
                </div>

                {/* Current User Rank Banner */}
                {myRank ? (
                    <div className="bg-mission-red text-white p-4 rounded-xl shadow-lg shadow-red-500/20 mb-8 flex items-center justify-between animate-in slide-in-from-top-4 fade-in duration-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xs font-bold opacity-80 uppercase">Your Rank</div>
                                <div className="font-black text-lg max-w-[150px] truncate">{myRank.name}</div>
                            </div>
                        </div>
                        <div className="text-3xl font-black">#{myRank.rank}</div>
                    </div>
                ) : (
                    !loading && (
                        <div className="bg-gray-100 text-gray-400 p-4 rounded-xl mb-8 text-center text-xs font-bold uppercase tracking-widest border border-gray-200 border-dashed">
                            Mission Not Completed Yet
                        </div>
                    )
                )}

                {/* Table */}
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 flex-col gap-3 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-mono uppercase">Syncing Leaderboard...</span>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="flex items-center justify-center h-48 flex-col gap-3 text-gray-400 text-center p-6">
                            <Trophy className="w-8 h-8 opacity-20" />
                            <span className="text-xs font-mono uppercase">No completions yet.<br />Be the first!</span>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-100">
                                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-16">Rank</th>
                                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Squad</th>
                                    <th className="py-4 px-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leaderboard.map((row, idx) => (
                                    <tr key={idx} className={row.isCurrentUser ? 'bg-red-50' : idx === 0 ? 'bg-yellow-50/50' : ''}>
                                        <td className="py-4 px-4 text-sm font-black text-gray-800">
                                            {idx === 0 ? <Trophy className="w-4 h-4 text-yellow-500 inline mr-1" /> : `#${row.rank}`}
                                        </td>
                                        <td className={`py-4 px-4 text-sm font-bold ${row.isCurrentUser ? 'text-mission-red' : 'text-gray-800'}`}>
                                            {row.name} {row.isCurrentUser && '(YOU)'}
                                        </td>
                                        <td className="py-4 px-4 text-right text-sm font-mono font-medium text-gray-500 bg-gray-50/50">{row.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
}
