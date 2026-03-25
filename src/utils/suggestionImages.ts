/**
 * Suggestion images live in `src/assets/images/`.
 *
 * Why NOT use `/assets/images/...` strings?
 * Vite only serves the `public/` folder at the site root. Files under `src/`
 * are not available at arbitrary URL paths unless imported (or placed in `public/`).
 *
 * We use `import.meta.glob` so any image you add under `src/assets/images/`
 * is bundled and gets a correct hashed URL at build time.
 */

export type SuggestionItem = {
  url: string;
  /** Short label on the card */
  title: string;
  /** Supporting line — what the sample shows */
  description: string;
};

// Edited-style suggestions (name files edited1.jpg, edited2.png, edited1_v2.jpg, etc.)
const editedModules = import.meta.glob("../assets/images/edited*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  import: "default",
});

// Real / original photo suggestions (name files original1.webp, original2.jpg, etc.)
const originalModules = import.meta.glob("../assets/images/original*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  import: "default",
});

/** Curated copy aligned with demo content (see Features.tsx). Keys = filename without extension. */
const EDITED_CAPTIONS: Record<string, { title: string; description: string }> = {
  edited1: {
    title: "AI lighting & enhancement",
    description: "Balanced exposure and richer color — showcase look.",
  },
  edited1_v2: {
    title: "AI-powered enhancement",
    description: "Improved lighting, color, and detail across the frame.",
  },
  edited2: {
    title: "Clean object removal",
    description: "Distractions removed while texture stays natural.",
  },
  edited2_v2: {
    title: "Smart object removal",
    description: "Unwanted elements gone; background preserved.",
  },
  edited3: {
    title: "Cinematic color grade",
    description: "Film-style toning for a polished, pro finish.",
  },
  edited3_v2: {
    title: "Professional color grading",
    description: "Cinematic palette without crushing shadows.",
  },
  edited4: {
    title: "Sharpened detail",
    description: "Clarity boost where it matters most.",
  },
  edited4_v2: {
    title: "Detail restoration",
    description: "Sharper edges and recovered micro-detail.",
  },
  edited1_v1: {
    title: "Enhanced interior render",
    description: "Lifted exposure and cleaner color balance.",
  },
  edited2_v1: {
    title: "Clean scene edit",
    description: "Focused composition with refined contrast.",
  },
  edited3_v1: {
    title: "Rich tonal grade",
    description: "Deeper shadows and controlled highlights.",
  },
  edited4_v1: {
    title: "Polished finish",
    description: "Sharper detail with a cohesive look.",
  },
};

const ORIGINAL_CAPTIONS: Record<string, { title: string; description: string }> = {
  original1: {
    title: "Bright interior scene",
    description: "Natural light — ideal for enhancement demos.",
  },
  original2: {
    title: "Busy real-world shot",
    description: "Great for testing object-aware edits.",
  },
  original3: {
    title: "Mixed lighting interior",
    description: "Challenging tones — perfect for grading samples.",
  },
  original4: {
    title: "Soft daylight photo",
    description: "Balanced base for detail and clarity tweaks.",
  },
};

function basenameFromGlobKey(key: string): string {
  const name = key.split("/").pop() ?? "";
  return name.replace(/\.[^.]+$/, "");
}

function captionForEdited(basename: string): { title: string; description: string } {
  return (
    EDITED_CAPTIONS[basename] ?? {
      title: "Redesign sample",
      description: "AI-processed look — tap to try it as your next input.",
    }
  );
}

function captionForOriginal(basename: string): { title: string; description: string } {
  return (
    ORIGINAL_CAPTIONS[basename] ?? {
      title: "Photo sample",
      description: "Unedited capture — tap to use as your starting image.",
    }
  );
}

function globToItems(
  record: Record<string, unknown>,
  caption: (base: string) => { title: string; description: string }
): SuggestionItem[] {
  return Object.entries(record).map(([key, value]) => {
    const url = value as string;
    const base = basenameFromGlobKey(key);
    const { title, description } = caption(base);
    return { url, title, description };
  });
}

export const suggestionItemsEdited: SuggestionItem[] = globToItems(editedModules, captionForEdited);
export const suggestionItemsOriginal: SuggestionItem[] = globToItems(originalModules, captionForOriginal);

/** @deprecated use suggestionItemsEdited */
export const suggestionImages: string[] = suggestionItemsEdited.map((i) => i.url);
/** @deprecated use suggestionItemsOriginal */
export const initialSuggestions: string[] = suggestionItemsOriginal.map((i) => i.url);

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const getRandomSuggestions = (count: number = 4): SuggestionItem[] => {
  if (suggestionItemsEdited.length === 0) return [];
  return shuffle(suggestionItemsEdited).slice(0, Math.min(count, suggestionItemsEdited.length));
};

export const getRandomInitialSuggestions = (count: number = 4): SuggestionItem[] => {
  if (suggestionItemsOriginal.length === 0) return [];
  return shuffle(suggestionItemsOriginal).slice(0, Math.min(count, suggestionItemsOriginal.length));
};
