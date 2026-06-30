/**
 * Research & Publications configuration
 * Add your papers, preprints, and research recognitions here
 */

import type { Publication } from '../types';

export const publications: readonly Publication[] = [
  {
    title:
      'Integrating Renewable Energy Converters into ASIC-Based Cryptocurrency Mining: A Sustainable Paradigm for Enhanced Energy Efficiency and Reduced Environmental Impact',
    authors: 'Tiwari, A., et al.',
    venue: 'TechRxiv Preprint',
    year: '2025',
    doi: '10.36227/techrxiv.174803735.50889856/v1',
    url: 'https://doi.org/10.36227/techrxiv.174803735.50889856/v1',
  },
  {
    title:
      'K-Dimensional Trees for Efficient Face Detection: Reducing Time Complexity from O(n) to O(log n)',
    authors: 'Tiwari, A., et al.',
    venue: 'TechRxiv Preprint',
    year: '2025',
    doi: '10.36227/techrxiv.174803737.71813266/v1',
    url: 'https://doi.org/10.36227/techrxiv.174803737.71813266/v1',
  },
  {
    title: 'Research Awards',
    venue: 'Best Research Paper Recognitions',
    year: '2025 – 2026',
    description: 'Recognized for best research paper across multiple conferences.',
    awards: [
      'Best Research Paper Award — IEEE Ignite',
      'Best Research Paper Award — NSSAFE 2025',
      'Best Research Paper Award — RAMSITA 2026',
    ],
  },
] as const;
