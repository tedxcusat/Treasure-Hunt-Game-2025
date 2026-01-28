'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, ArrowRight, ListOrdered, Target, Lock, Shield, ShieldCheck, FileText, Binary, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuccessPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'EXTRACTION' | 'VERIFYING' | 'VICTORY'>('EXTRACTION');
    const [code, setCode] = useState(['', '', '', '']);
    const [stats, setStats] = useState<{ rank: number; totalTime: string } | null>(null);

    // Load team ID
    const [teamId, setTeamId] = useState<string | null>(null);
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
                setTimeout(() => {
                    setStatus('VICTORY');
                    triggerConfetti();
                }, 1500); // Add suspense delay
            } else {
                alert('ACCESS DENIED. INVALID CREDENTIALS.');
                setStatus('EXTRACTION');
                setCode(['', '', '', '']);
            }
        } catch (err) {
            alert('NETWORK ERROR. RETRY UPLINK.');
            setStatus('EXTRACTION');
        }
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FF0000', '#FFFFFF', '#00FF00'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FF0000', '#FFFFFF', '#00FF00'] });
        }, 250);
    };

    return (
        <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative">
            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />

            <AnimatePresence mode="wait">
                {status === 'VICTORY' ? (
                    <motion.div
                        key="victory"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10"
                    >
                        {/* Background Data Stream */}
                        <div className="absolute inset-0 opacity-10 font-bold text-[10px] break-all pointer-events-none overflow-hidden leading-tight">
                            {Array(500).fill(0).map((i) => Math.random() > 0.5 ? '1' : '0').join(' ')}
                        </div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="text-center mb-8 relative"
                        >
                            <div className="w-32 h-32 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)] relative mb-6">
                                <div className="absolute inset-0 border-t-2 border-green-400 rounded-full animate-spin" />
                                <ShieldCheck className="w-16 h-16 text-green-500" />
                            </div>
                            <h1 className="text-4xl font-black uppercase font-orbitron text-green-500 tracking-tighter mb-2 glow-text">
                                MISSION<br />COMPLETE
                            </h1>
                            <p className="text-green-400/80 text-xs tracking-[0.3em] font-bold uppercase">
                                STATUS: EXTRACTION SUCCESSFUL
                            </p>
                        </motion.div>

                        {/* Dossier Card */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="w-full max-w-sm bg-gray-900 border border-green-500/30 rounded-lg p-6 relative group"
                        >

                            <div className="flex justify-between items-end mb-6 border-b border-green-500/20 pb-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Finish Time</div>
                                    <div className="text-3xl font-black text-white font-mono">{stats?.totalTime}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Standing</div>
                                    <div className="text-3xl font-black text-yellow-400 font-orbitron">#{stats?.rank}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/leaderboard')}
                                className="w-full bg-green-600/10 border border-green-500/50 text-green-500 h-14 rounded font-bold uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-3 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            >
                                <ListOrdered className="w-4 h-4" />
                                Access Leaderboard
                            </button>
                        </motion.div>

                    </motion.div>
                ) : (
                    <motion.div
                        key="extraction"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10"
                    >
                        <div className="w-full max-w-sm">
                            <motion.div
                                initial={{ y: -20 }}
                                animate={{ y: 0 }}
                                className="mb-12 text-center"
                            >
                                <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/50 mb-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                                    <Lock className="w-8 h-8 text-red-500 relative z-10" />
                                </div>
                                <h2 className="text-red-500 font-bold tracking-[0.5em] text-xs uppercase mb-2">
                                    FINAL SECURITY LAYER
                                </h2>
                                <h1 className="text-3xl font-black text-white font-orbitron uppercase tracking-widest">
                                    ENTER KEY
                                </h1>
                            </motion.div>

                            <div className="relative mb-12">
                                <div className="absolute -inset-4 bg-red-500/5 blur-xl rounded-full" />
                                <div className="flex justify-between gap-3 relative z-10">
                                    {[0, 1, 2, 3].map((idx) => (
                                        <div key={idx} className="relative group">
                                            <input
                                                id={`final-code-${idx}`}
                                                type="text"
                                                value={code[idx]}
                                                onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                maxLength={1}
                                                className={`w-14 h-20 bg-black border-2 ${code[idx] ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-gray-800 text-gray-500'} text-center text-4xl font-black font-mono focus:border-red-400 focus:outline-none focus:shadow-[0_0_20px_rgba(248,113,113,0.3)] transition-all rounded-sm`}
                                                inputMode="numeric"
                                                disabled={status === 'VERIFYING'}
                                            />
                                            {/* Blinking Cursor for Empty Active */}
                                            {!code[idx] && idx === code.findIndex(c => !c) && (
                                                <div className="absolute inset-x-0 bottom-4 h-1 bg-red-500 animate-pulse mx-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={verifyExtraction}
                                disabled={status === 'VERIFYING' || code.join('').length !== 4}
                                className={`w-full h-16 relative overflow-hidden group ${status === 'VERIFYING' ? 'bg-red-900 border-red-700' : 'bg-transparent border border-red-500 hover:bg-red-500'} border transition-all duration-300`}
                            >
                                <div className={`absolute inset-0 flex items-center justify-center gap-2 font-bold tracking-[0.2em] uppercase ${status === 'VERIFYING' ? 'text-red-300' : 'text-red-500 group-hover:text-black'}`}>
                                    {status === 'VERIFYING' ? (
                                        <>
                                            <Binary className="w-5 h-5 animate-spin" />
                                            DECRYPTING...
                                        </>
                                    ) : (
                                        <>
                                            UNLOCK SYSTEM <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>

                            <div className="mt-8 text-center">
                                <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                                    SECURE UPLINK ESTABLISHED<br />
                                    ID: {teamId || 'UNKNOWN'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
