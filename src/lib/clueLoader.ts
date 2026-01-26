// Utility to load clues from story_clues folder
// Clues are stored in public/story_clues/clue_X/ folders

export interface ClueData {
    number: number;
    text: string;
    images: string[]; // Array of image filenames
}

export async function loadClue(clueNumber: number): Promise<ClueData | null> {
    try {
        // Load text file
        const textResponse = await fetch(`/story_clues/clue_${clueNumber}/clue_${clueNumber}.txt`);
        if (!textResponse.ok) {
            console.error(`Clue ${clueNumber} text not found`);
            return null;
        }
        const text = await textResponse.text();

        // Check for images in the clue folder
        // We'll need to know which images exist - for now, we'll try common patterns
        // In production, you might want to maintain a manifest file
        const images: string[] = [];
        
        // Try to detect images - this is a simple approach
        // You might want to create a manifest.json in each clue folder
        const possibleImages = [
            `WIN_20250910_20_56_21_Pro.jpg`,
            `WIN_20250910_20_56_21_Pro copy.jpg`,
            `WIN_20250910_20_56_21_Pro copy 2.jpg`,
            `WIN_20250910_20_56_21_Pro copy 3.jpg`,
        ];

        // For now, we'll return the clue with a placeholder for images
        // The actual image detection will be handled by checking if files exist
        return {
            number: clueNumber,
            text: text.trim(),
            images: [] // Will be populated by checking actual files
        };
    } catch (error) {
        console.error(`Error loading clue ${clueNumber}:`, error);
        return null;
    }
}

// Get all image files for a clue (helper function)
// Files should be in public/story_clues/ folder for Next.js to serve them
export function getClueImagePath(clueNumber: number, imageName: string): string {
    return `/story_clues/clue_${clueNumber}/${imageName}`;
}

// Predefined image lists for each clue (based on folder structure)
export const CLUE_IMAGES: Record<number, string[]> = {
    1: ['WIN_20250910_20_56_21_Pro.jpg'],
    2: [], // No images
    3: ['WIN_20250910_20_56_21_Pro copy 2.jpg'],
    4: [], // No images
    5: ['WIN_20250910_20_56_21_Pro copy.jpg', 'WIN_20250910_20_56_21_Pro copy 3.jpg'],
    6: [], // No images
};
