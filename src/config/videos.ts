/**
 * Project demo videos (embedded from YouTube)
 * Add more entries here and they'll appear in the Project Videos window.
 */

import type { ProjectVideo } from '../types';

export const videos: readonly ProjectVideo[] = [
  {
    title: 'Sanjivani — AI Medication Safety & Health Monitoring',
    youtubeId: 'OEvaYEFmdmQ',
    description:
      'On-device OCR medicine scanning, RxNorm drug-interaction checks, and an ESP32 vitals wearable with an emergency Health Resume.',
  },
  {
    title: 'Dharohar — Safeguarding India\u2019s Indigenous Wisdom',
    youtubeId: 'bM6pTAqDl5Q',
    description:
      'AWS AI for Bharat Hackathon project preserving India\u2019s cultural heritage with digital sovereignty and AI.',
  },
  {
    title: 'Stellar3D — Interactive 3D Solar System',
    youtubeId: 'Qjwey3h0pR4',
    description:
      'A cinematic, interactive 3D solar system experience built with Three.js \u2014 explore planets, orbits, and lunar eclipses in real time.',
  },
] as const;
