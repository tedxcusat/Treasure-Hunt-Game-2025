'use client';

import { Trophy, Clock, ArrowRight, ListOrdered } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
    const router = useRouter();

    return (
        <div className="relative h-full min-h-screen flex flex-col items-center justify-center p-6 bg-white text-black font-sans">
            {/* Background Grid */}
            <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-50" />

            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-sm">

                {/* Icon */}
                <div className="w-24 h-24 mx-auto bg-mission-red/5 rounded-full flex items-center justify-center border-2 border-mission-red mb-8">
                    <Trophy className="w-10 h-10 text-mission-red" />
                </div>

                {/* Headings */}
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                    MISSION<br />COMPLETE
                </h1>
                <p className="text-gray-500 font-medium tracking-wide text-sm mb-12">
                    ALL ZONES SECURED SUCCESSFULLY
                </p>

                {/* Stats Card */}
                <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">PERFORMANCE REPORT</div>
                    <div className="flex justify-between items-center px-4">
                        <div className="text-center">
                            <div className="text-3xl font-black text-black">14:20</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Total Time</div>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div className="text-center">
                            <div className="text-3xl font-black text-mission-red">#1</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Current Rank</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/leaderboard')}
                        className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
                    >
                        <ListOrdered className="w-5 h-5" />
                        VIEW LEADERBOARD
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        RETURN TO BASE
                    </button>
                </div>

            </div>
        </div>
    );
}
