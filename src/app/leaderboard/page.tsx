'use client';

import { ArrowLeft, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
    const router = useRouter();

    // Mock Leaderboard Data
    const leaderboard = [
        { rank: 1, team: 'ALPHA SQUAD', time: '14:20' },
        { rank: 2, team: 'NET RUNNERS', time: '16:45' },
        { rank: 3, team: 'CYBER PUNKS', time: '18:10' },
        { rank: 4, team: 'DATA MINERS', time: '21:30' },
        { rank: 5, team: 'CODE BREAKERS', time: '24:55' },
        { rank: 6, team: 'PIXEL PIRATES', time: '28:10' },
    ];

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
                <div className="bg-mission-red text-white p-4 rounded-xl shadow-lg shadow-red-500/20 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xs font-bold opacity-80 uppercase">Your Rank</div>
                            <div className="font-black text-lg">ALPHA SQUAD</div>
                        </div>
                    </div>
                    <div className="text-2xl font-black">#1</div>
                </div>

                {/* Table */}
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
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
                                <tr key={idx} className={idx === 0 ? 'bg-yellow-50/50' : ''}>
                                    <td className="py-4 px-4 text-sm font-black text-gray-800">
                                        {idx === 0 ? <Trophy className="w-4 h-4 text-yellow-500 inline mr-1" /> : `#${row.rank}`}
                                    </td>
                                    <td className="py-4 px-4 text-sm font-bold text-gray-800">{row.team}</td>
                                    <td className="py-4 px-4 text-right text-sm font-mono font-medium text-gray-500">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
