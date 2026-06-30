/**
 * Professional experience configuration
 * Add your work experience here
 */

import type { Experience } from '../types';

export const experience: readonly Experience[] = [
  {
    title: 'Co-Founder & CPO',
    company: 'Tokenistt (YC Summer 2026 Applicant)',
    location: 'Remote',
    period: 'Feb 2026 – Present',
    description:
      'AI Infrastructure Platform — LLM Observability, Governance & Enterprise AI Operations. Co-founded and led development of a platform serving engineering teams building production AI systems. Defined product vision, technical roadmap, and platform architecture from ideation through deployment; designed token-consumption analytics, model routing, prompt caching, and enterprise governance controls. Operated at the intersection of engineering leadership, product strategy, and business decision-making.',
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'LLMs'],
  },
  {
    title: 'Software Development Engineer Intern',
    company: 'Mythos',
    location: 'Singapore',
    period: 'Apr 2026 – Present',
    description:
      'Develop production-grade backend services and distributed systems supporting AI-powered automation products. Implemented RSA-2048 and AES-256-GCM security infrastructure and JWKS-based authentication; built REST APIs and microservices within a distributed engineering team, and contributed to CI/CD pipelines and reliability engineering for scalable backend architecture.',
    technologies: ['TypeScript', 'Python', 'PostgreSQL', 'Docker', 'Microservices', 'CI/CD'],
  },
  {
    title: 'Technical Contributor',
    company: 'Ministry of Tribal Affairs, Government of India',
    location: 'India',
    period: 'Sept 2025 – Feb 2026',
    description:
      'ASTITVA & NyayaSetu — AI-Powered Forest Rights Governance Platforms. Developed OCR and Named Entity Recognition pipelines to digitize legal and administrative records under India\'s Forest Rights Act, and built Retrieval-Augmented Generation (RAG) systems for policy interpretation and eligibility assessment. Contributed WebGIS-enabled spatial intelligence modules; supported deployment across Madhya Pradesh, Odisha, Telangana, and Tripura. Smart India Hackathon 2025 Finalist; awarded a Letter of Recommendation by the Deputy Secretary, Ministry of Tribal Affairs.',
    technologies: ['Python', 'OCR', 'NER', 'RAG', 'WebGIS', 'LLMs'],
  },
] as const;
