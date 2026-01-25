'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const [code, setCode] = useState(['', '', '', '']);
  const [teamName, setTeamName] = useState('');
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

    // --- DEVELOPER BACKDOOR ---
    if (enteredCode === '1234') {
      localStorage.setItem('teamId', 'mock-team-id');
      localStorage.setItem('teamName', 'Dev Squad');
      router.push('/story');
      return;
    }

    if (enteredCode.length !== 4 || !teamName.trim()) {
      alert('Please enter Squad Name and Code.');
      return;
    }

    setLoading(true);

    // Direct Supabase query for Any Member Code Login
    // 1. Fetch Team by Name (Case Insensitive)
    const { data: team, error } = await supabase
      .from('teams')
      .select('*') // create strict RLS later if needed, but for now we need to check codes
      .ilike('team_name', teamName.trim())
      .single();

    if (error || !team) {
      alert('TEAM NOT FOUND. CHECK SPELLING.');
      setLoading(false);
      return;
    }

    // 2. Verify Code Locally (More Reliable)
    const validCodes = [
      team.leader_verified_code,
      team.member1_verified_code,
      team.member2_verified_code,
      team.member3_verified_code,
      team.member4_verified_code
    ];

    if (!validCodes.includes(enteredCode)) {
      alert('INVALID ACCESS CODE FOR THIS TEAM.');
      setLoading(false);
      return;
    }

    // Success - Use 'team' object directly
    const data = team;

    if (error || !data) {
      alert('ACCESS DENIED: INVALID NAME OR CODE');
      setLoading(false);
      return;
    }

    // Success - Save Session
    localStorage.setItem('teamId', data.id);
    localStorage.setItem('teamName', data.team_name);

    // Check if story already seen
    const hasSeenStory = localStorage.getItem(`story_seen_${data.id}`);

    if (hasSeenStory) {
      router.push('/game');
    } else {
      router.push('/story');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white text-black font-clash py-10">

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center gap-10">

        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4">


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

        {/* Inputs Container */}
        <div className="w-full space-y-6">

          {/* Team Name Input */}
          <div className="w-full bg-white border border-gray-400 rounded-[20px] p-4 shadow-sm relative text-left">
            <label className="block text-[10px] font-bold text-black mb-2 uppercase tracking-[0.2em] font-orbitron pl-1">
              SQUAD IDENTITY
            </label>
            <input
              type="text"
              placeholder="ENTER TEAM NAME"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-black text-lg font-bold font-orbitron placeholder:text-gray-400 focus:border-mission-red focus:border-2 focus:outline-none transition-all uppercase"
            />
          </div>

          {/* Code Input */}
          <div className="w-full bg-white border border-gray-400 rounded-[20px] p-6 pb-8 shadow-sm relative">
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

          <div className="pt-4">
            <button
              onClick={() => router.push('/register')}
              className="w-full h-14 border-2 border-gray-300 rounded-full font-clash text-lg font-bold uppercase text-gray-500 hover:border-mission-red hover:text-mission-red transition-all active:scale-95"
            >
              REGISTER NEW SQUAD
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
