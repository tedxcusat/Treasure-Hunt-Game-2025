'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, ArrowRight, ListOrdered, Target, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function SuccessPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'EXTRACTION' | 'VERIFYING' | 'VICTORY'>('EXTRACTION');
    const [code, setCode] = useState(['', '', '', '']);
    const [stats, setStats] = useState<{ rank: number; totalTime: string } | null>(null);

    // Load team ID
    const [teamId, setTeamId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        setTeamId(localStorage.getItem('teamId'));
    }, []);

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 3) document.getElementById(`final-code-${index + 1}`)?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            document.getElementById(`final-code-${index - 1}`)?.focus();
        }
    };

    const verifyExtraction = async () => {
        const finalCode = code.join('');
        if (finalCode.length !== 4) return;
        setStatus('VERIFYING');

        try {
            const res = await fetch('/api/finish-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, code: finalCode })
            });
            const data = await res.json();

            if (data.success) {
                setStats({ rank: data.rank, totalTime: data.totalTime });
                setStatus('VICTORY');
                triggerConfetti();
            } else {
                alert('INVALID EXTRACTION KEY. ACCESS DENIED.');
                setStatus('EXTRACTION');
                setCode(['', '', '', '']);
            }
        } catch (err) {
            alert('CONNECTION FAILURE');
            setStatus('EXTRACTION');
        }
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        // Create a canvas specifically for confetti to contain it if needed, 
        // but typically 'inside mobile ui' means not overflowing or feeling like it's outside.
        // I will adjust defaults to be less 'explosive' outward and more contained.

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // Confetti from top corners
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    if (status === 'EXTRACTION' || status === 'VERIFYING') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-full max-w-sm space-y-8">
                    <div className="w-20 h-20 bg-mission-red/20 rounded-full flex items-center justify-center mx-auto animate-pulse border-2 border-mission-red">
                        <Lock className="w-8 h-8 text-mission-red" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-black uppercase font-orbitron text-mission-red mb-2">FINAL EXTRACTION</h1>
                        <p className="text-gray-400 font-mono text-sm leading-relaxed">
                            Proceeed to the <strong className="text-white">Amenity Centre</strong>.<br />
                            Locate the Operative.<br />
                            Obtain the Master Key to complete mission.
                        </p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">ENTER MASTER KEY</label>
                        <div className="flex justify-between gap-2">
                            {[0, 1, 2, 3].map((idx) => (
                                <input
                                    key={idx}
                                    id={`final-code-${idx}`}
                                    type="text"
                                    value={code[idx]}
                                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    maxLength={1}
                                    className="w-12 h-14 rounded-lg bg-black border border-gray-700 text-center text-2xl font-bold font-mono focus:border-mission-red focus:outline-none transition-colors text-white"
                                    inputMode="numeric"
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={verifyExtraction}
                        disabled={status === 'VERIFYING' || code.join('').length !== 4}
                        className="w-full bg-mission-red text-white h-16 rounded-xl font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                        {status === 'VERIFYING' ? 'VERIFYING...' : 'CONFIRM EXTRACTION'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full min-h-screen flex flex-col items-center justify-center p-6 bg-white text-black font-sans overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />


            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-sm animate-in zoom-in duration-500">

                {/* Icon */}
                <div className="w-24 h-24 mx-auto bg-yellow-50 rounded-full flex items-center justify-center border-4 border-yellow-400 mb-8 shadow-xl">
                    <Trophy className="w-10 h-10 text-yellow-600" />
                </div>

                {/* Headings */}
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-black">
                    MISSION<br /><span className="text-mission-red">ACCOMPLISHED</span>
                </h1>
                <p className="text-gray-500 font-medium tracking-wide text-sm mb-12">
                    EXCELLENT WORK, OPERATIVES.
                </p>

                {/* Stats Card */}
                <div className="bg-black text-white rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-mission-red to-transparent opacity-50" />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">FINAL DEBRIEF</div>
                    <div className="flex justify-between items-center px-2">
                        <div className="text-center">
                            <div className="text-3xl font-black font-mono">{stats?.totalTime || '--:--'}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Total Time</div>
                        </div>
                        <div className="h-10 w-px bg-gray-800" />
                        <div className="text-center relative">
                            <div className="text-4xl font-black text-yellow-400 drop-shadow-lg">#{stats?.rank || '?'}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Global Rank</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/leaderboard')}
                        className="w-full bg-mission-red text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors uppercase tracking-wider"
                    >
                        <ListOrdered className="w-5 h-5" />
                        VIEW LIVE STANDINGS
                    </button>
                </div>

            </div>
        </div>
    );
}
