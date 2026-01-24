import { useCallback } from 'react';

type SoundType = 'click' | 'scope' | 'success' | 'error';

export const useSound = () => {
    const playSound = useCallback((type: SoundType) => {
        try {
            // Map types to specific files
            let filename = 'click.wav';
            if (type === 'scope') filename = 'scope.mp3';
            if (type === 'success') filename = 'success.mp3';
            if (type === 'error') filename = 'error.mp3';
            const audio = new Audio(`/sounds/${filename}`);

            audio.volume = type === 'click' ? 0.3 : 0.5; // Lower volume for click
            audio.play().catch(err => console.error("Audio play failed:", err));
        } catch (error) {
            console.error("Audio initialization failed:", error);
        }
    }, []);

    return { playSound };
};
