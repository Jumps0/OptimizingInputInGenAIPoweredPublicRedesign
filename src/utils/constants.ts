export const AVATARS = Array.from({ length: 10 }, (_, i) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=citizen${i + 1}`
);

export const METHODS = ['text', 'voice', 'inpainting', 'dragdrop'] as const;

export type AssignedMethod = (typeof METHODS)[number];

/** Uniform random choice for UX study condition assignment (new participants only). */
export function pickRandomAssignedMethod(): AssignedMethod {
  return METHODS[Math.floor(Math.random() * METHODS.length)];
}
