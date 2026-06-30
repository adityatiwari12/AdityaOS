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
  downloadName: 'Aditya_Tiwari_Resume.pdf',
};

export const pitchDeck: ResumeConfig = {
  url: '/tokenistt-pitch-deck.pdf',
  localPath: '/tokenistt-pitch-deck.pdf',
  downloadName: 'Tokenistt_Pitch_Deck.pdf',
};
