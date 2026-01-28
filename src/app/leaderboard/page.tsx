'use client';

import { useState, useEffect } from 'react';
import { Trophy, Loader2, Target, Shield, Crosshair, Medal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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

            // Fetch all COMPLETED teams
            const { data, error } = await supabase
                .from('teams')
                .select('id, team_name, game_start_time, game_end_time')
                .not('game_end_time', 'is', null)
                .order('game_end_time', { ascending: true });

            if (error) throw error;

            console.log('Raw Leaderboard Data:', data);

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
        <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative p-6">
            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />

            <div className="relative z-10 max-w-md mx-auto pb-12">

                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 text-center"
                >
                    <h1 className="text-3xl font-black uppercase font-orbitron tracking-tighter text-white glow-text">
                        GLOBAL<br /><span className="text-green-500">INTELLIGENCE</span>
                    </h1>
                </motion.div>

                {/* My Rank Card */}
                <AnimatePresence>
                    {myRank && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-green-900/20 border border-green-500 rounded-lg p-5 mb-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-20"><Target className="w-12 h-12 text-green-500" /></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Your Unit Status</div>
                                    <div className="text-xl font-bold uppercase text-white truncate max-w-[150px]">{myRank.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black font-orbitron text-green-400">#{myRank.rank}</div>
                                    <div className="text-xs font-mono text-green-500/80">{myRank.time} HRS</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rankings List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-green-500/50">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-mono tracking-widest animate-pulse">DECRYPTING DATABASE...</span>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/50">
                            <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">No Missions Completed</p>
                        </div>
                    ) : (
                        leaderboard.map((team, idx) => (
                            <motion.div
                                key={team.name}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                className={`
                                    relative flex items-center justify-between p-4 rounded border 
                                    ${team.isCurrentUser
                                        ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                        : 'bg-black/40 border-gray-800'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center font-black rounded font-orbitron text-sm
                                        ${idx === 0 ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/50' :
                                            idx === 1 ? 'text-gray-300 bg-gray-300/10 border border-gray-300/50' :
                                                idx === 2 ? 'text-orange-400 bg-orange-400/10 border border-orange-400/50' :
                                                    'text-gray-600 border border-gray-800'}
                                    `}>
                                        {idx < 3 ? <Medal className="w-4 h-4" /> : `#${team.rank}`}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold uppercase tracking-wide ${team.isCurrentUser ? 'text-white' : 'text-gray-400'}`}>
                                            {team.name}
                                        </span>
                                        {team.isCurrentUser && <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">You</span>}
                                    </div>
                                </div>

                                <div className="font-mono text-sm font-medium text-gray-500">
                                    {team.time}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Footer Decor */}
                <div className="mt-12 text-center opacity-30">
                    <Crosshair className="w-6 h-6 mx-auto text-green-500 mb-2" />
                    <p className="text-[8px] uppercase tracking-[0.5em] text-green-500">Secure Connection Verified</p>
                </div>

            </div>
        </div>
    );
}
