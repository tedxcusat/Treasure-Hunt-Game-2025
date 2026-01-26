'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [formData, setFormData] = useState({
        teamName: '',
        leaderName: '',
        email: '',
        phone: '',
        members: [''] // Start with 1 operative (Leader + 1 = 2 min team size)
    });

    const handleMemberChange = (index: number, value: string) => {
        const newMembers = [...formData.members];
        newMembers[index] = value;
        setFormData({ ...formData, members: newMembers });
    };

    const addMember = () => {
        // Max 4 Operatives (excluding leader) -> Total 5
        if (formData.members.length < 4) {
            setFormData({ ...formData, members: [...formData.members, ''] });
        }
    };

    const removeMember = (index: number) => {
        // Min 1 Operative (excluding leader) -> Total 2
        if (formData.members.length > 1) {
            const newMembers = formData.members.filter((_, i) => i !== index);
            setFormData({ ...formData, members: newMembers });
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async () => {
        // Basic Validation
        if (!formData.teamName || !formData.leaderName || !formData.email) {
            showToast('Please fill all team leader details.', 'error');
            return;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showToast('Please enter a valid LEADER email address.', 'error');
            return;
        }

        // Validate Member Emails
        for (let i = 0; i < formData.members.length; i++) {
            if (!formData.members[i].trim()) {
                showToast(`Please fill Operative ${i + 1} email.`, 'error');
                return;
            }
            if (!emailRegex.test(formData.members[i])) {
                showToast(`Invalid email for Operative ${i + 1}.`, 'error');
                return;
            }
        }

        setLoading(true);
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Success - CLEANER UI (No Code shown)
            showToast('REGISTRATION SUCCESSFUL. CHECK EMAIL.', 'success');

            // Wait a bit before redirect so they see the toast
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err: any) {
            showToast('REGISTRATION FAILED: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black p-6 font-clash flex flex-col items-center overflow-y-auto relative">

            {/* TOAST NOTIFICATION CONTAINER */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
                    >
                        <div className={`
                            pointer-events-auto
                            flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md
                            ${toast.type === 'success' ? 'bg-green-900/90 border-green-500/50 text-white' : ''}
                            ${toast.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-white' : ''}
                            ${toast.type === 'info' ? 'bg-gray-900/90 border-gray-500/50 text-white' : ''}
                        `}>
                            {toast.type === 'success' && <div className="p-1 bg-green-500 rounded-full"><CheckCircle className="w-5 h-5 text-black" strokeWidth={3} /></div>}
                            {toast.type === 'error' && <div className="p-1 bg-red-500 rounded-full"><X className="w-5 h-5 text-white" strokeWidth={3} /></div>}
                            {toast.type === 'info' && <div className="p-1 bg-gray-500 rounded-full"><AlertTriangle className="w-5 h-5 text-white" strokeWidth={3} /></div>}

                            <span className="font-bold font-orbitron tracking-wide text-sm">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back Button */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300 hover:bg-mission-red hover:text-white hover:border-mission-red transition-colors active:scale-95"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Header */}
            <h1 className="text-3xl font-black font-orbitron text-center mb-8 mt-12 tracking-tighter">
                <span className="text-black">SQUAD</span> <span className="text-mission-red">REGISTRY</span>
            </h1>

            <div className="w-full max-w-md space-y-8 pb-40">

                {/* Team Details */}
                <section className="bg-white p-6 rounded-[30px] border border-gray-400 shadow-sm relative">
                    <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-bold font-orbitron text-black uppercase tracking-[0.2em]">
                        TEAM DETAILS
                    </label>
                    <div className="mt-2">
                        <input
                            type="text" placeholder="Team Name"
                            className="w-full h-14 bg-gray-50 border border-gray-300 rounded-xl px-4 text-black text-lg font-bold font-orbitron placeholder:text-gray-400 focus:border-mission-red focus:border-2 focus:outline-none transition-all uppercase"
                            value={formData.teamName}
                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                        />
                    </div>
                </section>

                {/* Leader Details */}
                <section className="bg-white p-6 rounded-[30px] border border-gray-400 shadow-sm relative">
                    <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-bold font-orbitron text-black uppercase tracking-[0.2em]">
                        LEADER INTEL
                    </label>
                    <div className="space-y-4 mt-2">
                        <input
                            type="text" placeholder="Leader Name"
                            className="w-full h-14 bg-gray-50 border border-gray-300 rounded-xl px-4 text-black text-lg font-bold font-orbitron placeholder:text-gray-400 focus:border-mission-red focus:border-2 focus:outline-none transition-all uppercase"
                            value={formData.leaderName}
                            onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                        />
                        <input
                            type="email" placeholder="Email (For Access Code)"
                            className="w-full h-14 bg-gray-50 border border-gray-300 rounded-xl px-4 text-black text-lg font-bold font-clash placeholder:text-gray-400 focus:border-mission-red focus:border-2 focus:outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </section>

                {/* Members */}
                <section className="bg-white p-6 rounded-[30px] border border-gray-400 shadow-sm relative">
                    <div className="absolute -top-3 left-6 bg-white px-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold font-orbitron text-black uppercase tracking-[0.2em]">SQUAD EMAILS</span>
                        <span className="text-[10px] font-bold font-orbitron text-mission-red">{formData.members.length}/4</span>
                    </div>

                    <div className="space-y-3 mt-2">
                        {formData.members.map((member, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="email"
                                        placeholder={`Operative 0${idx + 1} Email`}
                                        className="w-full h-14 bg-gray-50 border border-gray-300 rounded-xl px-4 text-black text-lg font-bold font-clash placeholder:text-gray-400 focus:border-mission-red focus:border-2 focus:outline-none transition-all"
                                        value={member}
                                        onChange={(e) => handleMemberChange(idx, e.target.value)}
                                    />
                                </div>
                                {formData.members.length > 1 && (
                                    <button
                                        onClick={() => removeMember(idx)}
                                        className="w-14 h-14 shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-400 hover:text-white hover:bg-mission-red hover:border-mission-red transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {formData.members.length < 4 && (
                        <button
                            onClick={addMember}
                            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold font-clash flex items-center justify-center gap-2 hover:border-mission-red hover:text-mission-red transition-all hover:bg-red-50"
                        >
                            <Plus className="w-4 h-4" /> ADD OPERATIVE
                        </button>
                    )}
                </section>
            </div>

            {/* STICKY FOOTER ACTION */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-12 z-50">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-mission-red text-white h-16 rounded-full font-black font-orbitron text-xl uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? 'REGISTERING...' : <>CONFIRM SQUAD <ArrowRight className="w-6 h-6 stroke-[2.5]" /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
