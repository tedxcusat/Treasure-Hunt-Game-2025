'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Power } from 'lucide-react';

export default function QuitPage() {
    const router = useRouter();

    return (
        <div className="relative h-full flex flex-col items-center justify-center p-6 text-center bg-white min-h-screen">


            {/* Red Viewfinder Frame */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-mission-red rounded-tl-xl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-mission-red rounded-br-xl" />

            {/* Icon */}
            <div className="bg-red-50 p-6 rounded-full mb-6 animate-pulse">
                <ShieldAlert className="w-12 h-12 text-mission-red" />
            </div>

            {/* Text */}
            <h1 className="text-4xl font-black text-black mb-2 tracking-tighter uppercase">MISSION<br />ABORTED</h1>
            <p className="text-gray-500 font-bold mb-12">Connection Terminated</p>

            {/* Button */}
            <button
                onClick={() => router.push('/')}
                className="w-full max-w-xs bg-mission-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
                <Power className="w-5 h-5" />
                RETURN TO LOGIN
            </button>
        </div>
    );
}
