/**
 * Projects configuration
 * Import all project JSON files here
 */

import type { Project } from '../types';

import talkwithdb from './projects/talkwithdb.json';
import sanjivani from './projects/sanjivani.json';

export const projects: readonly Project[] = [
  talkwithdb,
  sanjivani,
] as Project[];
