'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Leader/Team Info, 2: Member Management
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        teamName: '',
        leaderName: '',
        leaderPhone: '',
        leaderEmail: ''
    });

    const [members, setMembers] = useState<string[]>([]); // Additional members (excluding leader)
    const [newMemberName, setNewMemberName] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addMember = () => {
        if (!newMemberName.trim()) return;
        if (members.length + 1 >= 4) return; // Max 4 (1 Leader + 3 Members)

        setMembers([...members, newMemberName]);
        setNewMemberName('');
    };

    const removeMember = (index: number) => {
        const updated = [...members];
        updated.splice(index, 1);
        setMembers(updated);
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamName: formData.teamName,
                    members: [formData.leaderName, ...members] // Combine Leader + Members
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Registration Failed');

            // Save Session
            localStorage.setItem('teamId', data.teamId);
            localStorage.setItem('accessCode', data.accessCode);

            alert(`REGISTRATION SUCCESSFUL!\nMISSION CODE: ${data.accessCode}`);
            router.push('/story');

        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Validation
    const isTeamFull = members.length + 1 >= 4; // Leader + Members
    const isValidSize = members.length + 1 >= 2; // Min 2

    return (
        <div className="relative h-full flex flex-col p-6 bg-white overflow-y-auto hide-scrollbar">

            {/* Header */}
            <div className="relative z-10 flex items-center mb-8">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-black" />
                </Link>
                <h1 className="text-2xl font-black text-black ml-2 tracking-tight">SQUAD REGISTRATION</h1>
            </div>

            <div className="relative z-10 space-y-6 pb-10">

                {/* Step 1: Team Details */}
                <section>
                    <h2 className="text-xs font-bold text-mission-red font-mission mb-4 border-b border-gray-100 pb-2">01. TEAM INTEL</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">TEAM NAME</label>
                            <input
                                name="teamName"
                                value={formData.teamName}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-black focus:border-mission-red focus:outline-none focus:bg-white"
                                placeholder=""
                            />
                        </div>
                    </div>
                </section>

                {/* Step 2: Leader Details */}
                <section>
                    <h2 className="text-xs font-bold text-mission-red font-mission mb-4 border-b border-gray-100 pb-2">02. LEADER (OPERATOR)</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">FULL NAME</label>
                            <input
                                name="leaderName"
                                value={formData.leaderName}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-black focus:border-mission-red focus:outline-none focus:bg-white"
                                placeholder=""
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">PHONE</label>
                                <input
                                    name="leaderPhone"
                                    value={formData.leaderPhone}
                                    onChange={handleInputChange}
                                    type="tel"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-black focus:border-mission-red focus:outline-none focus:bg-white"
                                    placeholder=""
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">EMAIL</label>
                                <input
                                    name="leaderEmail"
                                    value={formData.leaderEmail}
                                    onChange={handleInputChange}
                                    type="email"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-black focus:border-mission-red focus:outline-none focus:bg-white"
                                    placeholder=""
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            Security Code will be sent to this email.
                        </p>
                    </div>
                </section>

                {/* Step 3: Squad Members */}
                <section>
                    <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                        <h2 className="text-xs font-bold text-mission-red font-mission">03. RECRUITS</h2>
                        <span className={`text-xs font-bold ${isTeamFull ? 'text-red-500' : 'text-gray-400'}`}>
                            {members.length + 1} / 4 MAX
                        </span>
                    </div>

                    {/* List */}
                    <div className="space-y-3 mb-4">
                        {/* Leader (Static) */}
                        <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg opacity-70">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-bold text-gray-600 text-sm">{formData.leaderName || 'Leader'} (You)</span>
                        </div>

                        {members.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="font-bold text-black text-sm">{m}</span>
                                </div>
                                <button onClick={() => removeMember(idx)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Input */}
                    {!isTeamFull ? (
                        <div className="flex gap-2">
                            <input
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-black focus:border-mission-red focus:outline-none"
                                placeholder="New Member Name"
                                onKeyDown={(e) => e.key === 'Enter' && addMember()}
                            />
                            <button
                                onClick={addMember}
                                disabled={!newMemberName}
                                className="bg-black text-white p-3 rounded-xl disabled:opacity-50 hover:bg-gray-800"
                            >
                                <UserPlus className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100">
                            MAXIMUM SQUAD SIZE REACHED (4)
                        </div>
                    )}

                    {!isValidSize && (
                        <p className="text-[10px] text-red-500 mt-2 font-bold text-center">
                            * MINIMUM 2 MEMBERS REQUIRED TO DEPLOY
                        </p>
                    )}
                </section>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || !isValidSize || !formData.teamName || !formData.leaderName || !formData.leaderEmail}
                    className="w-full btn-press bg-mission-red text-white font-black text-lg p-5 rounded-2xl shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none"
                >
                    {loading ? 'PROCESSING...' : 'CONFIRM REGISTRATION'}
                </button>

            </div>
        </div>
    );
}
