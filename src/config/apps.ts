/**
 * Application configuration (Spotify, Resume, etc.)
 */

import type { SpotifyConfig, ResumeConfig } from '../types';

export const spotify: SpotifyConfig = {
  playlistId: '37i9dQZF1DX5trt9i14X7j', // generic coding focus playlist — swap with your own
  playlistName: 'Coding Focus',
};

export const resume: ResumeConfig = {
  url: '/resume.pdf',
  localPath: '/resume.pdf',
};
