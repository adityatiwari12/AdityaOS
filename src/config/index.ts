/**
 * Main configuration file
 * This file combines all modular configuration files into a single userConfig export
 * 
 * To customize your portfolio, edit the individual files in src/config/
 * instead of editing this file directly:
 * - personal.ts: Personal information
 * - social.ts: Social media links
 * - contact.ts: Contact information
 * - education.ts: Education and courses
 * - experience.ts: Work experience
 * - skills.ts: Technical skills
 * - extracurricular.ts: Leadership roles and activities
 * - competitions.ts: Competitions and achievements
 * - projects.ts: Project imports
 * - apps.ts: Spotify and resume configuration
 * - site.ts: SEO and theme configuration
 */

import type { UserConfig } from '../types';

import { personal } from './personal';
import { social } from './social';
import { contact } from './contact';
import { education, courses } from './education';
import { experience } from './experience';
import { skills } from './skills';
import { extraCurricularRoles, extraCurricularActivities } from './extracurricular';
import { competitions } from './competitions';
import { projects } from './projects';
import { publications } from './publications';
import { certifications } from './certifications';
import { videos } from './videos';
export { hackathons, knowledgeNotes, founderHQ, careerGoals, nowStatus } from './content/index';
import { spotify, resume, pitchDeck } from './apps';
import { seo, theme } from './site';

/**
 * Combined user configuration
 * This is the main configuration object used throughout the application
 */
export const userConfig: UserConfig = {
  // Personal Information
  ...personal,

  // Social & Contact
  social,
  contact,

  // Configuration
  spotify,
  resume,
  seo,
  theme,

  // Content
  education,
  courses,
  skills,
  extraCurricularRoles,
  extraCurricularActivities,
  competitions,
  experience,
  projects,
  publications,
  certifications,
  videos,
} as const;

// Export individual modules for granular imports if needed
export { personal, social, contact, education, courses, experience, skills, extraCurricularRoles, extraCurricularActivities, competitions, projects, publications, certifications, videos, spotify, resume, pitchDeck, seo, theme };
