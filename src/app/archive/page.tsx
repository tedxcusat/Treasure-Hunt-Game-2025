'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, X, ChevronLeft, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { STORY_PAGES } from '@/lib/storyData';
import { useSound } from '@/hooks/useSound';

interface ClueImage {
    name: string;
    path: string;
}

interface ArchiveClue {
    number: number;
    text: string;
    images: ClueImage[];
}

export default function ArchivePage() {
    const router = useRouter();
    const { playSound } = useSound();
    const [unlockedClues, setUnlockedClues] = useState<ArchiveClue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUnlockedClues();
    }, []);

    const fetchUnlockedClues = async () => {
        try {
            const teamId = localStorage.getItem('teamId');
            if (!teamId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/archive?teamId=${teamId}`);
            const data = await res.json();

            if (data.success && data.clues) {
                setUnlockedClues(data.clues);
            }
        } catch (error) {
            console.error('Error fetching clues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageClick = (imagePath: string) => {
        window.open(imagePath, '_blank');
    };

    return (
        <div className="h-[100dvh] w-full bg-black flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-mission-red/20 to-transparent border-b border-mission-red/30 p-6 flex justify-between items-center shrink-0 safe-top">
                <div className="flex items-center gap-3 text-mission-red">
                    <BookOpen className="w-6 h-6 animate-pulse" />
                    <span className="font-black font-orbitron uppercase tracking-[0.2em] text-sm text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">MISSION ARCHIVE</span>
                </div>
                <button
                    onClick={() => {
                        playSound('click');
                        router.back();
                    }}
                    className="bg-black/50 border border-white/10 p-2 rounded-full hover:bg-mission-red hover:border-mission-red group transition-all duration-300"
                >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>
            </div>

            {/* Content Scroll */}
            <div className="flex-1 overflow-y-auto p-8 space-y-16 scrollbar-hide pb-32">
                {/* Original Story Pages */}
                {STORY_PAGES.map((page, idx) => (
                    <div key={idx} className="relative pl-8 border-l border-dashed border-white/20 group animate-in slide-in-from-bottom-8 fade-in duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                        {/* Animated Timeline Node */}
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-black border border-mission-red rounded-full group-hover:bg-mission-red group-hover:shadow-[0_0_10px_#ef4444] transition-all duration-500" />

                        <h4 className="text-mission-red font-bold uppercase text-xs tracking-[0.3em] mb-3 font-mono opacity-80">
                            // LOG_ENTRY_0{idx + 1}
                        </h4>
                        <h3 className="text-3xl font-black text-white mb-4 uppercase font-orbitron tracking-tighter leading-none">
                            {page.title}
                        </h3>
                        <p className="text-base text-gray-300 font-medium leading-relaxed font-mono tracking-wide border-l-2 border-transparent group-hover:border-mission-red/50 pl-0 group-hover:pl-4 transition-all duration-300">
                            {page.text}
                        </p>
                    </div>
                ))}

                {/* Unlocked Mission Clues */}
                {loading ? (
                    <div className="relative pl-8 border-l border-dashed border-white/20">
                        <div className="text-mission-red font-mono text-sm animate-pulse">LOADING ARCHIVE...</div>
                    </div>
                ) : unlockedClues.length > 0 ? (
                    unlockedClues.map((clue, idx) => (
                        <div key={clue.number} className="relative pl-8 border-l border-dashed border-green-500/50 group animate-in slide-in-from-bottom-8 fade-in duration-700" style={{ animationDelay: `${(STORY_PAGES.length + idx) * 100}ms` }}>
                            {/* Animated Timeline Node */}
                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-black border border-green-500 rounded-full group-hover:bg-green-500 group-hover:shadow-[0_0_10px_#22c55e] transition-all duration-500" />

                            <h4 className="text-green-500 font-bold uppercase text-xs tracking-[0.3em] mb-3 font-mono opacity-80">
                                // CLUE_{clue.number.toString().padStart(2, '0')}
                            </h4>
                            <p className="text-base text-gray-300 font-medium leading-relaxed font-mono tracking-wide border-l-2 border-transparent group-hover:border-green-500/50 pl-0 group-hover:pl-4 transition-all duration-300 whitespace-pre-line">
                                {clue.text}
                            </p>

                            {/* Images Section */}
                            {clue.images && clue.images.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {clue.images.map((image, imgIdx) => (
                                        <button
                                            key={imgIdx}
                                            onClick={() => {
                                                playSound('click');
                                                handleImageClick(image.path);
                                            }}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-black/40 border border-green-500/30 rounded-lg hover:bg-green-500/10 hover:border-green-500/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ImageIcon className="w-5 h-5 text-green-500 group-hover:text-green-400" />
                                                <span className="text-sm text-gray-300 font-mono group-hover:text-white">
                                                    {image.name}
                                                </span>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-green-500/50 group-hover:text-green-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="relative pl-8 border-l border-dashed border-white/20">
                        <p className="text-gray-500 font-mono text-sm">No clues unlocked yet. Complete zones to unlock diary entries.</p>
                    </div>
                )}

                {/* Spacer for bottom safe area */}
                <div className="h-10" />
            </div>

            {/* Footer */}
            <div className="p-6 bg-black border-t border-white/10 shrink-0 text-center relative overflow-hidden safe-bottom">
                <div className="absolute inset-0 bg-repeat opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1v1H5zM0 5h1v1H0z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
                <button
                    onClick={() => {
                        playSound('click');
                        router.back();
                    }}
                    className="relative w-full py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] rounded-xl active:scale-95 transition-all text-sm hover:bg-mission-red hover:border-mission-red hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3"
                >
                    <ChevronLeft className="w-4 h-4" />
                    RETURN TO OPERATIONS
                </button>
            </div>
        </div>
    );
}
