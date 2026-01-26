# Mission Archive Clue System Setup

## Overview
The mission archive system unlocks story clues sequentially (clue_1, clue_2, etc.) every time a zone object is verified, regardless of zone order.

## Database Schema Update Required

Add the following column to the `teams` table in Supabase:

```sql
ALTER TABLE teams ADD COLUMN IF NOT EXISTS unlocked_clues_count INTEGER DEFAULT 0;
```

## File Structure

The `story_clues` folder should be accessible in two ways:

1. **For Server-Side Reading (Text Files)**: 
   - Keep `story_clues/` in project root (current location)
   - API routes can read `.txt` files from here

2. **For Client-Side Access (Images)**:
   - Copy or symlink `story_clues/` to `public/story_clues/`
   - Images need to be accessible via URL: `/story_clues/clue_X/image.jpg`

### Recommended Setup:
```bash
# Option 1: Copy entire folder to public
cp -r story_clues public/

# Option 2: Create symlink (if supported)
ln -s ../story_clues public/story_clues
```

## How It Works

1. **Zone Verification**: When a zone object is verified successfully:
   - `unlocked_clues_count` is incremented
   - Next clue (clue_1, clue_2, etc.) is unlocked

2. **Archive Display**: 
   - Archive page fetches unlocked clues via `/api/archive?teamId=...`
   - Clues are displayed in order with text and clickable images
   - Images open in new tab when clicked

3. **Clue Structure**:
   - Each clue folder: `clue_X/clue_X.txt` (text content)
   - Images: `clue_X/image.jpg` (optional, multiple images supported)

## Image Configuration

Images are defined in `src/lib/clueLoader.ts` in the `CLUE_IMAGES` object:
- Clue 1: 1 image
- Clue 2: No images
- Clue 3: 1 image
- Clue 4: No images
- Clue 5: 2 images
- Clue 6: No images

Update this object if you add/remove images from clue folders.
