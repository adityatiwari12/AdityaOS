import type { HackathonEntry, KnowledgeNote } from '../../types/content';

export const hackathons: HackathonEntry[] = [
  {
    id: 'ieee-think-tank-2026',
    title: 'IEEE Think Tank 2026',
    year: '2026',
    achievement: 'Winner — National innovation & technology strategy',
    problem: 'Strategic technology roadmap for institutional innovation.',
    team: 'Solo / IEEE AITR team',
    approach: 'Systems thinking + product strategy for scalable tech adoption.',
    impact: 'National-level recognition for innovation leadership.',
    certificateUrl: '/images/hackathons/ieee-think-tank.jpg',
  },
  {
    id: 'smart-india-2025',
    title: 'Smart India Hackathon 2025',
    year: '2025',
    achievement: 'Finalist — Government of India',
    problem: 'Forest Rights Act digitization for tribal communities.',
    team: 'Ministry of Tribal Affairs collaboration',
    approach: 'OCR + NER + RAG for policy interpretation across states.',
    impact: 'Official GoI recognition; deployment across MP, Odisha, Telangana, Tripura.',
    certificateUrl: '/images/hackathons/sih-2025.jpg',
  },
  {
    id: 'aws-ai-bharat',
    title: 'AWS AI for Bharat',
    year: '2025',
    achievement: 'International Top-5 Finalist',
    problem: 'AI for social good at scale.',
    team: 'Cross-functional engineering team',
    approach: 'Production AI pipelines for underserved communities.',
    impact: 'International finalist recognition.',
  },
  {
    id: 'canhacks-2026',
    title: 'CanHacks 2026',
    year: '2026',
    achievement: 'International Top-5 Finalist',
    problem: 'Cross-border product innovation challenge.',
    team: 'International hackathon team',
    approach: 'Full-stack AI product with rapid prototyping.',
    impact: 'Canada-based international competition finalist.',
  },
  {
    id: 'laserhack-2025',
    title: 'LaserHack 2025',
    year: '2025',
    achievement: 'International Top-5 Finalist',
    problem: 'Product innovation at international scale.',
    team: 'Engineering + design',
    approach: 'Hardware-software integrated solution.',
    impact: 'International product innovation recognition.',
  },
  {
    id: 'ieee-eureka',
    title: 'IEEE Eureka Idea Pitching',
    year: '2025',
    achievement: 'Winner — National entrepreneurship pitching',
    problem: 'Pitching startup ideas with technical depth.',
    team: 'Tokenistt / solo ventures',
    approach: 'Founder narrative + technical moat articulation.',
    impact: 'National winner for entrepreneurship pitching.',
  },
];

export const knowledgeNotes: KnowledgeNote[] = [
  {
    id: 'rag-patterns',
    title: 'RAG Pipeline Patterns',
    category: 'Artificial Intelligence',
    tags: ['RAG', 'LLM', 'Vector DB'],
    content: 'Schema-aware retrieval, hybrid search, re-ranking, and governance for production RAG systems.',
    links: ['talkwithdb', 'tokenistt'],
  },
  {
    id: 'llm-observability',
    title: 'LLM Observability & Governance',
    category: 'Artificial Intelligence',
    tags: ['Tokenistt', 'Observability'],
    content: 'Token analytics, model routing, prompt caching, and enterprise governance controls.',
    links: ['tokenistt'],
  },
  {
    id: 'system-design',
    title: 'Distributed Systems Notes',
    category: 'System Design',
    tags: ['Microservices', 'Docker', 'CI/CD'],
    content: 'REST APIs, JWKS auth, RSA/AES security, reliability engineering at Mythos.',
    links: ['mythos'],
  },
  {
    id: 'product-leadership',
    title: 'Leading Technical Teams',
    category: 'Leadership',
    tags: ['IEEE', 'Product'],
    content: 'Cross-functional coordination, roadmap prioritization, stakeholder alignment.',
    links: [],
  },
];

export interface HackathonPhoto {
  src: string;
  caption: string;
  type?: 'image' | 'video';
}

/**
 * Media kit gallery — hackathon & competition memories.
 * Files live in public/images/gallery/. Add { type: 'video', src: '/images/gallery/x.mp4' }
 * entries for videos and the gallery will play them inline.
 */
export const hackathonGallery: HackathonPhoto[] = [
  { src: '/images/gallery/sih-journey-video.mp4', caption: 'Smart India Hackathon — Journey', type: 'video' },
  { src: '/images/gallery/thinktank-win.jpeg', caption: 'IEEE Think Tank 2026 — Winner' },
  { src: '/images/gallery/sih-pitch.jpeg', caption: 'Smart India Hackathon — Pitch' },
  { src: '/images/gallery/sih-picture.jpeg', caption: 'Smart India Hackathon — Team' },
  { src: '/images/gallery/ministry-hackathon-win.jpeg', caption: 'Ministry of Tribal Affairs — Hackathon Win' },
  { src: '/images/gallery/ministry-pitch-grant.jpeg', caption: 'Ministry Pitch — Won the Grant' },
  { src: '/images/gallery/ministry-cheque.jpeg', caption: 'Ministry — Grant Cheque' },
  { src: '/images/gallery/bgi-hackathon-win.jpeg', caption: 'BGI Hackathon — Winner' },
  { src: '/images/gallery/innovik-hackathon-win.jpeg', caption: 'Innovik Hackathon — Winner' },
  { src: '/images/gallery/chandigarh-hackathon.jpeg', caption: 'Chandigarh University — Hackathon' },
  { src: '/images/gallery/ai-fusion-win.jpeg', caption: 'AI Fusion — Winner' },
  { src: '/images/gallery/mediverse-win.jpeg', caption: 'Mediverse — Winner' },
  { src: '/images/gallery/kriyeta-win.jpg', caption: 'Kriyeta — Winner' },
  { src: '/images/gallery/kriyeta-pitching.jpg', caption: 'Kriyeta — Pitching' },
  { src: '/images/gallery/solve-x-pitch.jpeg', caption: 'Solve-X — Pitch' },
  { src: '/images/gallery/best-research-paper-award.jpeg', caption: 'Best Research Paper Award' },
  { src: '/images/gallery/best-research-paper.jpeg', caption: 'Best Research Paper' },
  { src: '/images/gallery/letter-of-recommendation.jpeg', caption: 'Letter of Recommendation — Govt. of India' },
  { src: '/images/gallery/pitching-education-minister.jpeg', caption: 'Pitching to the Education Minister' },
  { src: '/images/gallery/podcast-thumbnail.jpeg', caption: 'Cybersecurity Awareness Podcast' },
];

export const founderHQ = {
  vision: 'Build the operating system for production AI — observability, governance, and enterprise AI ops.',
  roadmap: [
    { quarter: 'Q1 2026', item: 'MVP launch — token analytics & model routing', status: 'done' },
    { quarter: 'Q2 2026', item: 'Enterprise governance controls', status: 'in-progress' },
    { quarter: 'Q3 2026', item: 'YC Summer 2026 application', status: 'in-progress' },
    { quarter: 'Q4 2026', item: 'Scale to 50+ engineering teams', status: 'planned' },
  ],
  metrics: [
    { label: 'Platform Status', value: 'Beta', trend: 'up' },
    { label: 'YC Application', value: 'S26', trend: 'neutral' },
    { label: 'Tech Stack', value: 'React/TS/Node/PG', trend: 'up' },
    { label: 'Focus', value: 'LLM Ops', trend: 'up' },
  ],
  traction: [
    'Co-founded Tokenistt — AI infrastructure for engineering teams',
    'Full-stack platform: React, TypeScript, Node.js, PostgreSQL, Docker',
    'Product vision from ideation through deployment',
  ],
  ycJourney: 'YC Summer 2026 applicant — building LLM observability & governance platform.',
};

export const careerGoals = {
  currentFocus: 'Tokenistt (YC S26) + Mythos SDE Internship',
  currentStartup: 'Tokenistt — AI Infrastructure',
  reading: 'AI Product Management, System Design',
  learning: 'Distributed systems, LLM governance',
  building: 'TalkwithDB, Tokenistt platform',
  mastersTimeline: '2027 graduation → Masters applications',
  greProgress: 0,
  ieltsProgress: 0,
  upcomingHackathons: ['IEEE events', 'Smart India Hackathon 2026'],
  goals: ['Ship Tokenistt MVP', 'Publish more research', 'Masters abroad'],
};

export const nowStatus = {
  listening: 'Focus playlist',
  reading: 'AI Product Management',
  watching: 'System design talks',
  building: 'AdityaOS portfolio',
  thinking: 'LLM observability patterns',
  recentWins: ['IEEE Think Tank 2026 Winner', 'Mythos internship'],
  upcomingEvents: ['YC application', 'Tokenistt beta launch'],
  currentGoals: ['Ship AdityaOS', 'Tokenistt beta'],
};
