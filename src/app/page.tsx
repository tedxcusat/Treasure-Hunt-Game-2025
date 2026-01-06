'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Smartphone, ArrowRight } from 'lucide-react';

export default function Home() {
  const [code, setCode] = useState(['', '', '', '']);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleInitiate = async () => {
    // 1. Try Login with Code if entered
    const enteredCode = code.join('');
    if (enteredCode.length === 4) {
      setLoading(true);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: enteredCode })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Login Failed');

        // Save Session
        localStorage.setItem('teamId', data.teamId);
        localStorage.setItem('accessCode', enteredCode); // Use the entered code

        router.push('/story');
      } catch (err: any) {
        alert(err.message || 'INVALID CODE');
        setLoading(false);
      }
      return;
    }

    // 2. Normal Flow (Check Session or Register)
    const teamId = localStorage.getItem('teamId');
    if (teamId) {
      router.push('/story');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="relative h-full flex flex-col items-center justify-center p-6 text-center bg-white">
      {/* Background Grid */}
      <div className="bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* Red Viewfinder Corners */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-mission-red rounded-tl-lg" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-mission-red rounded-tr-lg" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-mission-red rounded-bl-lg" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-mission-red rounded-br-lg" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xs">

        {/* Logo Area */}
        <div className="mb-12">
          <div className="w-20 h-20 mx-auto bg-mission-red/10 rounded-full flex items-center justify-center border-2 border-mission-red mb-4 shadow-lg shadow-red-100">
            <Shield className="w-10 h-10 text-mission-red" />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-2">GEOQUEST</h1>
          <div className="inline-block bg-black text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest">
            MISSION ACCESS
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white border-2 border-gray-100 shadow-xl rounded-2xl p-6 mb-8 transform transition-all hover:scale-[1.02]">
          <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest text-left">Security Code</p>
          <div className="flex justify-between gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <input
                key={idx}
                id={`code-${idx}`}
                type="text"
                value={code[idx]}
                onChange={(e) => handleCodeChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                maxLength={1}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-mission-red focus:bg-white focus:outline-none transition-all text-black shadow-inner"
                placeholder=""
                inputMode="numeric"
              />
            ))}
          </div>
        </div>

        {/* Gamified Button */}
        <button
          onClick={handleInitiate}
          disabled={loading}
          className="btn-press w-full group relative overflow-hidden rounded-2xl bg-mission-red p-4 shadow-lg shadow-red-500/30 transition-all hover:bg-red-600 active:scale-95 mb-6"
        >
          <div className="relative z-10 flex items-center justify-center gap-3 font-bold text-white text-lg tracking-wide">
            {loading ? 'SYNCING...' : 'INITIATE MISSION'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </div>
          {/* Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
        </button>

        {/* Bottom Helper */}
        <p className="text-xs text-gray-400 font-medium">
          Don't have a squad? <button onClick={() => router.push('/register')} className="text-mission-red font-bold hover:underline">Register Here</button>
        </p>

      </div>
    </div>
  );
}
