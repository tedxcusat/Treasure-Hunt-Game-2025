'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Play, BookOpen } from 'lucide-react';

const STORY_PAGES = [
    {
        title: "INITIALIZING LINK...",
        text: "Welcome, Operative. The system has recognized your biometric signature. You are now accessing the secure archive of CUSAT'S hidden history."
    },
    {
        title: "THE ANOMALY",
        text: "Decades regarding academic excellence have masked a subtle frequency. A signal hidden in the architecture itself. We call it... The Echo."
    },
    {
        title: "YOUR OBJECTIVE",
        text: "The Echo has fractured into 6 distinct zones across the campus. Each zone holds a fragment of the code. A piece of the truth."
    },
    {
        title: "THE PROTOCOL",
        text: "You are tasked to physically locate these anomalies. Trust your scanner. Trust your instincts. The interface will guide you, but your eyes must verify."
    },
    {
        title: "WARNING",
        text: "Time is a luxury we do not have. The signal is decaying. You have 30 minutes per sector before the data is lost forever. Stay sharp."
    }
];

export default function StoryPage() {
    const router = useRouter();
    const [pageIndex, setPageIndex] = useState(0);
    const isLastPage = pageIndex === STORY_PAGES.length;

    const handleNext = () => {
        setPageIndex(prev => prev + 1);
    };

    const handleRestart = () => {
        setPageIndex(0);
    };

    const handleStartGame = () => {
        router.push('/game');
    };

    return (
        <div className="relative h-full min-h-screen flex flex-col items-center justify-center p-8 bg-white overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-30" />
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent z-10" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10" />

            {/* Global Red Border */}
            <div className="absolute inset-0 pointer-events-none border-[3px] border-mission-red rounded-[2rem] z-40 m-1" />

            <div className="relative z-20 w-full max-w-sm flex flex-col h-full justify-center min-h-[60vh]">

                <AnimatePresence mode="wait">
                    {!isLastPage ? (
                        <motion.div
                            key={pageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-8"
                        >
                            {/* Header / Sequence Indicator */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                <div className="h-px w-12 bg-mission-red" />
                                <span className="text-xs font-black tracking-[0.2em] text-mission-red uppercase">
                                    Sequence 0{pageIndex + 1} / 0{STORY_PAGES.length}
                                </span>
                            </motion.div>

                            {/* Title with Glitch/Reveal Effect */}
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="text-5xl font-black text-black uppercase leading-[0.85] tracking-tighter"
                            >
                                {STORY_PAGES[pageIndex].title}
                            </motion.h1>

                            {/* Typewriter Body Text */}
                            <div className="min-h-[120px]">
                                <motion.p
                                    key={pageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="text-xl font-medium text-gray-800 leading-relaxed font-mono"
                                >
                                    {STORY_PAGES[pageIndex].text.split("").map((char, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 + (i * 0.02) }}
                                        >
                                            {char}
                                        </motion.span>
                                    ))}
                                </motion.p>
                            </div>

                            {/* Custom 'Next' Interaction */}
                            <motion.button
                                onClick={handleNext}
                                whileHover={{ scale: 1.05, x: 10 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-12 group flex items-center gap-4 self-start"
                            >
                                <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                                <span className="font-black tracking-widest text-sm uppercase group-hover:underline decoration-2 underline-offset-4">
                                    Proceed
                                </span>
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="final"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                        >
                            {/* Header - Floating */}
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-8"
                            >
                                <div className="text-[10px] font-bold text-gray-400 tracking-[0.5em] uppercase mb-2">Decrypted Data</div>
                                <h2 className="text-4xl font-black text-mission-red uppercase tracking-tighter scale-y-110">
                                    YOUR CLUE
                                </h2>
                            </motion.div>

                            {/* Text Content - Minimalist with Decorative Lines */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="relative py-8 px-4"
                            >
                                {/* Decorative "Brackets" */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-mission-red/20" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-mission-red/20" />

                                <div className="max-h-[50vh] overflow-y-auto hide-scrollbar">
                                    <p className="font-medium text-gray-800 text-sm leading-8 whitespace-pre-line font-mono selection:bg-mission-red/20">
                                        Seek the realm where <span className="font-black text-mission-red">young minds thrive</span>,<br />
                                        In <span className="font-black text-mission-red">Cusat's bounds</span>, knowledge comes alive.<br /><br />

                                        A place of wonders, where <span className="font-black text-mission-red">science is king</span>,<br />
                                        Where <span className="font-black text-mission-red">labs and parks</span> make learning sing.<br /><br />

                                        Look for the key where <span className="font-black text-mission-red">space's secrets unfold</span>,<br />
                                        Amongst <span className="font-black text-mission-red">statues tall</span> and models bold.<br /><br />

                                        The treasure's hidden, <span className="font-black text-mission-red">close at hand</span>,<br />
                                        <span className="font-black text-mission-red">Solve the puzzle</span>, fulfill your plan.<br /><br />

                                        Let <span className="font-black text-mission-red">curiosity</span> be your guide,<br />
                                        To find the prize, let <span className="font-black text-mission-red">wisdom</span> be your stride.<br /><br />

                                        Where students play and <span className="font-black text-mission-red">knowledge gleams</span>,<br />
                                        <span className="font-black text-mission-red">Unlock the secret</span>, fulfill your dreams.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Buttons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-8 w-full max-w-xs space-y-4"
                            >
                                <button
                                    onClick={handleStartGame}
                                    className="group w-full bg-black text-white text-lg font-black py-5 rounded-full shadow-xl shadow-red-500/10 flex items-center justify-center gap-2 hover:bg-mission-red transition-all active:scale-95"
                                >
                                    <span>START GAME</span>
                                    <Play className="w-4 h-4 fill-current group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button
                                    onClick={handleRestart}
                                    className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                                >
                                    Read Story Again
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
