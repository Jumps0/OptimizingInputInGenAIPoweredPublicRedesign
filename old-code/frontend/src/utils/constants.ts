export const AVATARS = Array.from({ length: 10 }, (_, i) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=citizen${i + 1}`
);

export const METHODS = ['voice', 'text', 'inpainting', 'dragdrop'] as const;
