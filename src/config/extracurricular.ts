/**
 * Extracurricular activities configuration
 * Add your leadership roles and activities here
 */

import type { ExtraCurricularRole, ExtraCurricularActivity } from '../types';

export const extraCurricularRoles: readonly ExtraCurricularRole[] = [
  {
    role: 'Vice Chairperson',
    institution: 'IEEE Student Branch, AITR',
    location: 'Indore, India',
    year: 'Dec 2024 – Jan 2026',
  },
  {
    role: 'Advisor',
    institution: 'IEEE Technology & Engineering Management Society (TEMS), AITR',
    location: 'Indore, India',
    year: 'Jan 2026 – Present',
  },
  {
    role: 'International Service Director',
    institution: 'Rotaract Club of Acropolis Royals, RID 3040',
    location: 'Indore, India',
    year: 'July 2024 – July 2025',
  },
  {
    role: 'Campus Ambassador',
    institution: 'GeeksforGeeks',
    location: 'India',
    year: '2025 – 2026',
  },
] as const;

export const extraCurricularActivities: readonly ExtraCurricularActivity[] = [
  {
    title: 'Founder — AI for Impact (Flagship Hackathon)',
    description:
      "Founded the IEEE Student Branch's flagship virtual innovation hackathon; drew 200+ participants across multiple colleges with themes spanning women's safety, mental health, education, and traffic management. Now a legacy event of the IEEE Student Branch, AITR.",
    institution: 'IEEE Student Branch, AITR',
    location: 'Indore, India',
    year: '2025',
  },
  {
    title: "Founder — Readers' Round Table",
    description:
      'Conceptualized and led a cross-club literary dialogue series; inaugural session drew 100+ participants from 30+ clubs across RID 3040. Scaled to multiple sessions including international collaborations; now institutionalized as a legacy event.',
    institution: 'Rotaract Club of Acropolis Royals',
    location: 'RID 3040',
    year: '2024 – Present',
  },
  {
    title: 'Founder — Paws & Claws: Feeding with Love',
    description:
      'Founded a recurring campus animal welfare program sustained across multiple sessions over two semesters; now a legacy event embedding long-term compassionate community practice.',
    institution: 'Rotaract Club of Acropolis Royals',
    location: 'Indore, India',
    year: '2024 – Present',
  },
  {
    title: 'Public Outreach — Cybersecurity Video Podcast',
    description:
      'Self-initiated and hosted a video podcast with the Additional Deputy Commissioner of Police (Crime Branch), Indore, on digital literacy and cybersecurity awareness — covering cyber theft, online fraud, and practical digital safety. Published episodically on Instagram, reaching thousands of viewers.',
    institution: 'Independent Initiative',
    location: 'Indore, India',
    year: 'June 2025',
    instagramUrl: 'https://www.instagram.com/p/DRdsLfOiMC1/',
  },
  {
    title: 'Indian Sign Language (ISL) Awareness Session',
    description:
      'Moderated a joint ISL awareness session co-hosted with Rotaract Club of Mysore, bringing together 90+ participants aged 6–60 from 20+ Rotaract clubs, 2 Interact clubs, and Rotarians.',
    institution: 'Rotaract Club of Acropolis Royals',
    location: 'India',
    year: 'Sept 2024',
  },
] as const;
