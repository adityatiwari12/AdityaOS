/**
 * Education and courses configuration
 * Add your educational background and courses here
 */

import type { Education, Course } from '../types';

export const education: readonly Education[] = [
  {
    degree: 'Bachelor of Technology (B.Tech.)',
    major: 'Computer Science & Information Technology',
    institution: 'Acropolis Institute of Technology & Research (RGPV Bhopal)',
    location: 'Indore, India',
    year: '2023 – 2027',
    description:
      'CGPA: 7.2 / 10.0 (Expected Graduation: June 2027). Relevant coursework: Data Structures & Algorithms, Database Management Systems, Operating Systems, Computer Networks, Artificial Intelligence, Machine Learning, Data Science, Distributed Systems, Software Engineering & Agile, and Object-Oriented Programming.',
  },
] as const;

// Hands-on programs / structured learning (certifications live in certifications.ts)
export const courses: readonly Course[] = [] as const;
