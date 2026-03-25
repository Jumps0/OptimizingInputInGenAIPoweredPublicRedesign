// Import images from assets/images
import edited1_v1 from '@/assets/images/edited1_v1.jpg';
import edited1_v2 from '@/assets/images/edited1_v2.jpg';
import edited2_v1 from '@/assets/images/edited2_v1.jpeg';
import edited2_v2 from '@/assets/images/edited2_v2.jpg';
import edited3_v1 from '@/assets/images/edited3_v1.avif';
import edited3_v2 from '@/assets/images/edited3_v2.jpg';
import edited4_v1 from '@/assets/images/edited4_v1.avif';
import edited4_v2 from '@/assets/images/edited4_v2.jpg';
import original1 from '@/assets/images/original1.webp';
import original2 from '@/assets/images/original2.jpg';
import original3 from '@/assets/images/original3.webp';
import original4 from '@/assets/images/original4.jpg';

// Import images from assets/nordcrafts
import nc_edited from '@/assets/nordcrafts/edited.jpg';
import nc_edited2 from '@/assets/nordcrafts/edited2.jpg';
import nc_real from '@/assets/nordcrafts/real.webp';
import nc_real2 from '@/assets/nordcrafts/real2.webp';
import nc_real3 from '@/assets/nordcrafts/real3.jpg';

export const suggestionImages = [
  edited1_v1,
  edited1_v2,
  edited2_v1,
  edited2_v2,
  edited3_v1,
  edited3_v2,
  edited4_v1,
  edited4_v2,
  nc_edited,
  nc_edited2,
];

export const initialSuggestions = [
  original1,
  original2,
  original3,
  original4,
  nc_real,
  nc_real2,
  nc_real3,
];

export const getRandomSuggestions = (count: number = 4) => {
  const shuffled = [...suggestionImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getRandomInitialSuggestions = (count: number = 4) => {
  const shuffled = [...initialSuggestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
