'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, LayoutGroup } from 'framer-motion';
import { Lightbulb, ChevronRight, ArrowRight } from 'lucide-react';

import { STORY_PAGES } from '@/lib/storyData';

const LongArrowRight = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 16" fill="none" className={className}>
        <path d="M0 8H62M62 8L54 1M62 8L54 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LongArrowLeft = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 16" fill="none" className={className}>
        <path d="M64 8H2M2 8L10 1M2 8L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SwipeButton = ({ onComplete }: { onComplete: () => void }) => {
    const [dragged, setDragged] = useState(false);
    const x = useMotionValue(0);
    const controls = useAnimation();

    const handleDragEnd = async (_: any, info: any) => {
        if (info.offset.x > 150) {
            setDragged(true);
            onComplete();
        } else {
            controls.start({ x: 0 });
        }
    };

    return (
        <div className="relative w-full h-16 bg-[#FFC0CB] rounded-full flex items-center p-1.5 border-[4px] border-[#4A0404] overflow-hidden">
            <motion.div className="absolute inset-0 flex items-center justify-center text-black font-bold tracking-widest text-sm font-clash uppercase pointer-events-none z-0 pl-8">
                SWIPE TO START GAME
            </motion.div>
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 200 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="w-12 h-12 bg-[#D00000] rounded-full flex items-center justify-center z-10 cursor-grab active:cursor-grabbing shadow-sm"
            >
                <ArrowRight className="w-6 h-6 text-white stroke-[2.5]" />
            </motion.div>
        </div>
    );
};

export default function StoryPage() {
    const router = useRouter();
    const [pageIndex, setPageIndex] = useState(0);
    const isLastPage = pageIndex === STORY_PAGES.length;

    const handleNext = () => {
        if (pageIndex < STORY_PAGES.length) {
            setPageIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (pageIndex > 0) setPageIndex(prev => prev - 1);
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-white text-black font-clash overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-center p-6 pt-12">
                <span className="text-[10px] font-bold text-zinc-400 uppercase font-orbitron tracking-[0.3em]">TEDXCUSAT - 2026</span>
            </header>

            {!isLastPage ? (
                <>
                    {/* Stepper Area */}
                    <div className="px-6 mt-4 mb-8 w-full">
                        <LayoutGroup>
                            <div className="flex items-center w-full gap-1">
                                {STORY_PAGES.map((_, idx) => {
                                    const isActive = idx === pageIndex;
                                    const isPast = idx < pageIndex;

                                    return (
                                        <div key={idx} className="contents">
                                            <motion.div
                                                layout
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                className={`rounded-full flex items-center justify-center text-sm font-bold font-orbitron z-10
                                                ${isActive ? 'w-9 h-9 bg-mission-red text-white shadow-lg shadow-red-500/30' :
                                                        isPast ? 'w-8 h-8 bg-zinc-600 text-zinc-300' : 'w-8 h-8 bg-zinc-400 text-white'}`}
                                            >
                                                {idx + 1}
                                            </motion.div>

                                            {isActive && (
                                                <motion.div
                                                    layoutId="stepper-line"
                                                    className="flex-1 h-[1px] bg-zinc-300 mx-2 min-w-[20px]"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Bulb Icon */}
                                <motion.div layout className="text-zinc-400 ml-auto pl-2">
                                    <Lightbulb className="w-6 h-6 stroke-[1.5]" />
                                </motion.div>
                            </div>
                        </LayoutGroup>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col px-6 relative justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pageIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="space-y-6"
                            >
                                <h1 className="text-[2.75rem] font-black uppercase font-orbitron tracking-tighter leading-[0.9] text-black">
                                    {STORY_PAGES[pageIndex].title}
                                </h1>
                                <p className="text-xl leading-relaxed text-zinc-800 font-medium font-clash tracking-wide max-w-sm">
                                    {STORY_PAGES[pageIndex].text}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Navigation */}
                    <div className="px-8 pb-12 pt-4 flex items-center justify-between mt-auto w-full">
                        <button
                            onClick={handleBack}
                            disabled={pageIndex === 0}
                            className={`flex flex-col items-center gap-2 group transition-opacity ${pageIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <LongArrowLeft className="w-16 h-4 text-black group-hover:-translate-x-2 transition-transform" />
                            <span className="text-[10px] font-bold uppercase font-clash text-zinc-500 tracking-[0.2em] group-hover:text-black">back</span>
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <LongArrowRight className="w-16 h-4 text-black group-hover:translate-x-2 transition-transform" />
                            <span className="text-[10px] font-bold uppercase font-clash text-zinc-500 tracking-[0.2em] group-hover:text-black">
                                next
                            </span>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* FINAL PAGE - CLUE & START */}
                    {/* Stepper Area (Completed) */}
                    <div className="px-6 mt-4 mb-4 w-full">
                        <div className="flex items-center w-full gap-1">
                            {STORY_PAGES.map((_, idx) => (
                                <div
                                    key={idx}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-orbitron bg-zinc-700 text-white opacity-60"
                                >
                                    {idx + 1}
                                </div>
                            ))}
                            <div className="flex-1 h-[1px] bg-zinc-300 mx-2 opacity-60" />
                            <Lightbulb className="w-6 h-6 text-mission-red fill-mission-red ml-auto" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col px-6 relative mt-4 overflow-hidden">
                        <div className="shrink-0 mb-6">
                            <h1 className="text-4xl font-black uppercase font-orbitron tracking-tighter leading-none text-black mb-1">
                                YOUR CLUE
                            </h1>
                            <p className="text-sm font-bold text-mission-red lowercase tracking-wider font-clash">
                                decoded data
                            </p>
                        </div>

                        {/* Scrollable Text Area */}
                        <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide mask-fade-bottom">
                            <p className="text-lg leading-loose text-zinc-800 font-clash font-normal">
                                Seek the realm where <span className="font-bold text-black">young minds thrive</span>,
                                In <span className="font-bold text-black">Cusat's bounds</span>, knowledge comes alive.<br /><br />

                                A place of wonders, where <span className="font-bold text-black">science is king</span>,
                                Where <span className="font-bold text-black">labs and parks</span> make learning sing.<br /><br />

                                Look for the key where <span className="font-bold text-black">space's secrets unfold</span>,
                                Amongst <span className="font-bold text-black">statues tall</span> and models bold.<br /><br />

                                The treasure's hidden, <span className="font-bold text-black">close at hand</span>,
                                Solve the puzzle, fulfill your plan.<br /><br />

                                Let <span className="font-bold text-black">curiosity</span> be your guide,
                                To find the prize, let wisdom be your stride.
                            </p>
                        </div>

                        {/* Swipe to Start */}
                        <div className="mt-6 mb-8 shrink-0">
                            <SwipeButton onComplete={() => router.push('/game')} />
                            <div className="text-center mt-6">
                                <button onClick={() => setPageIndex(0)} className="text-[13px] text-zinc-800 font-medium border-b border-zinc-800 pb-0.5 font-clash tracking-wide">
                                    Go back to the story ?
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
