'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { ArrowRight } from 'lucide-react';

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
    const enteredCode = code.join('');
    if (enteredCode.length !== 4) return;

    // --- DEVELOPER BACKDOOR ---
    if (enteredCode === '1234') {
      localStorage.setItem('teamId', 'dev-team-id');
      localStorage.setItem('teamName', 'Dev Squad');
      router.push('/story');
      return;
    }

    setLoading(true);

    // Direct Supabase query for Shared Code Login
    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('access_code', enteredCode)
      .single();

    if (error || !data) {
      alert('ACCESS DENIED: INVALID CODE');
      setLoading(false);
      return;
    }

    // Success - Save Session
    localStorage.setItem('teamId', data.id);
    localStorage.setItem('teamName', data.name);

    // Redirect
    router.push('/story');
  };

  return (
    <div className="relative h-full flex flex-col items-center justify-center p-6 text-center bg-white text-black font-clash">

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center gap-10">

        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4">
          {/* Placeholder Square Element from mockup */}
          <div className="w-24 h-24 bg-gray-200 mb-2" />

          <div className="text-center">
            <h1 className="text-[2.5rem] font-black tracking-tighter font-orbitron leading-none">
              <span className="text-black">GEO</span>
              <span className="text-mission-red">QUEST</span>
            </h1>
            <p className="text-xl font-clash text-black font-medium mt-1 tracking-tight">
              Mission Access
            </p>
          </div>
        </div>

        {/* Input Card */}
        <div className="w-full bg-white border border-gray-400 rounded-[30px] p-6 pb-10 shadow-sm relative">
          <label className="block text-[10px] font-bold text-black mb-6 uppercase tracking-[0.2em] font-orbitron text-center">
            SECURITY CODE
          </label>
          <div className="flex justify-between items-center px-1">
            {[0, 1, 2, 3].map((idx) => (
              <input
                key={idx}
                id={`code-${idx}`}
                type="text"
                value={code[idx]}
                onChange={(e) => handleCodeChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                maxLength={1}
                className="w-14 h-14 rounded-full border border-black text-center text-2xl font-bold font-orbitron focus:border-mission-red focus:border-2 focus:outline-none transition-all text-black bg-transparent p-0"
                placeholder=""
                inputMode="numeric"
                autoComplete="off"
              />
            ))}
          </div>
        </div>

        {/* Action Area */}
        <div className="w-full space-y-6 mt-2">
          <button
            onClick={handleInitiate}
            disabled={loading}
            className="w-full bg-mission-red text-white h-16 rounded-full font-clash text-xl uppercase font-medium flex items-center justify-center gap-3 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            {loading ? 'VERIFYING...' : (
              <>
                INITIATE MISSION <ArrowRight className="w-6 h-6 stroke-[1.5]" />
              </>
            )}
          </button>

          <p className="text-base font-clash text-black">
            Don't have a squad? <button onClick={() => router.push('/register')} className="text-mission-red font-semibold hover:underline">Register here</button>
          </p>
        </div>

      </div>
    </div>
  );
}
