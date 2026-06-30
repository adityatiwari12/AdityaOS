/**
 * Competitions and achievements configuration
 * Add your competition achievements and awards here
 */

import type { Competition } from '../types';

export const competitions: readonly Competition[] = [
  {
    title: 'IEEE Think Tank 2026',
    description: 'National-level innovation & technology strategy competition',
    achievement: 'Winner',
    year: '2026',
  },
  {
    title: 'IEEE Eureka Idea Pitching Competition',
    description: 'National-level entrepreneurship pitching competition',
    achievement: 'Winner',
    year: '2026',
  },
  {
    title: 'Six-Time National Hackathon Winner',
    description: 'Recognized across multiple national technology and innovation competitions',
    achievement: '6× National Hackathon Winner',
    year: '2024 – 2026',
  },
  {
    title: 'AWS AI for Bharat',
    description: 'International AI-for-social-good competition',
    achievement: 'International Top-5 Finalist',
    year: '2026',
  },
  {
    title: 'CanHacks 2026',
    description: 'Canada-based international hackathon',
    achievement: 'International Top-5 Finalist',
    year: '2026',
  },
  {
    title: 'LaserHack 2025',
    description: 'International product innovation competition',
    achievement: 'International Top-5 Finalist',
    year: '2025',
  },
  {
    title: 'Smart India Hackathon 2025',
    description: 'Government of India national grand challenge',
    achievement: 'Finalist — received official recognition from the Government of India',
    year: '2025',
  },
  {
    title: 'AI Fusion 2026',
    description: 'AI innovation hackathon — my very first hackathon win',
    achievement: 'Winner (1st Place)',
    year: '2026',
  },
  {
    title: 'INNOVIK 5.0 Hackathon',
    description: 'National-level innovation hackathon',
    achievement: '1st Runner-Up',
    year: '2026',
  },
  {
    title: 'MEDI<VERSE> Hackathon',
    description: 'Healthcare & medical technology hackathon',
    achievement: 'Winner (1st Place)',
    year: '2026',
  },
  {
    title: 'HackChrono — Chandigarh University',
    description: 'National-level hackathon hosted at Chandigarh University',
    achievement: 'Top 10 Finalist',
    year: '2026',
  },
  {
    title: 'Ministry of Tribal Affairs Hackathon 2.0',
    description: 'Government of India hackathon on tribal welfare & forest rights governance',
    achievement: 'Winner (1st Place)',
    year: '2026',
  },
  {
    title: 'Kriyeta 5.0 Hackathon',
    description: 'National-level innovation & product hackathon',
    achievement: 'Winner (1st Place)',
    year: '2026',
  },
  {
    title: 'BGI Hackathon',
    description: 'National-level hackathon',
    achievement: '2nd Runner-Up',
    year: '2026',
  },
] as const;
