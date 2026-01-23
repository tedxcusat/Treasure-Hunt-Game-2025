import { useCallback } from 'react';

type SoundType = 'click' | 'scope';

export const useSound = () => {
    const playSound = useCallback((type: SoundType) => {
        try {
            // Map types to specific files
            const filename = type === 'click' ? 'click.wav' : 'scope.mp3';
            const audio = new Audio(`/sounds/${filename}`);

            audio.volume = type === 'click' ? 0.3 : 0.5; // Lower volume for click
            audio.play().catch(err => console.error("Audio play failed:", err));
        } catch (error) {
            console.error("Audio initialization failed:", error);
        }
    }, []);

    return { playSound };
};
