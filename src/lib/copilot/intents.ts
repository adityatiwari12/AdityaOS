/**
 * Intent registry — the offline copilot's "brain".
 *
 * Each intent declares example utterances + keywords (for semantic matching)
 * and a `respond` builder that returns text + optional actions/media. Multiple
 * response variations are provided and rotated via `pick` to avoid sounding
 * scripted. Add new capabilities by appending intents here only.
 */

import {
  identity, skillsByGroup, experience, education, publications,
  certifications, findProject, projectFacetText, findApp, PROJECT_KB,
  hackathonWins, hackathonFinalists, hackathonSummary,
  TOKENISTT_URL, BLOG_URL,
} from './knowledgeBase';
import type { Intent, OfflineAction } from './types';

const NAV_VERBS = /\b(open|launch|show|go to|goto|take me to|navigate|view|display|pull up|bring up|see|visit|start)\b/;
const hasNavVerb = (s: string) => NAV_VERBS.test(s.toLowerCase());

const skillsText = () =>
  skillsByGroup.map((g) => `**${g.group}:** ${g.items.join(', ')}`).join('\n');

const experienceText = () =>
  experience
    .map((e) => `**${e.title} — ${e.company}** (${e.period})\n${e.description}`)
    .join('\n\n');

const linkAction = (url: string): OfflineAction => ({ type: 'openLink', url });

export const intents: Intent[] = [
  // ---- Greetings & small talk -------------------------------------------
  {
    id: 'greeting',
    utterances: ['hello', 'hi', 'hey there', 'good morning', 'good evening', 'yo', 'whats up', 'howdy'],
    keywords: ['hello', 'hi', 'hey'],
    respond: ({ pick }) => ({
      text: pick('greeting', [
        `Hey! I'm ${identity.firstName} 👋 Ask me anything about my work, projects, research, or startup — or tell me to open an app.`,
        `Hi there! Great to meet you. Want to hear about my projects, my startup Tokenistt, or should I open something for you?`,
        `Hello! I'm ${identity.firstName}'s copilot — and I speak as ${identity.firstName}. What would you like to know?`,
      ]),
    }),
  },
  {
    id: 'howareyou',
    utterances: ['how are you', 'how is it going', 'how do you do', 'hows life', 'whats up with you'],
    keywords: ['how are you', 'how is it going'],
    respond: ({ pick }) => ({
      text: pick('howareyou', [
        `Doing great — shipping fast as always. Currently building Tokenistt and interning at Mythos. What can I show you?`,
        `Pretty good! Deep in startup mode with Tokenistt. Want to explore my projects or research?`,
      ]),
    }),
  },
  {
    id: 'thanks',
    utterances: ['thank you', 'thanks a lot', 'appreciate it', 'cheers', 'thx'],
    keywords: ['thanks', 'thank you'],
    respond: ({ pick }) => ({
      text: pick('thanks', [
        `Anytime! Anything else you'd like to explore?`,
        `Happy to help! Want me to open my projects or resume next?`,
        `You're welcome 🙌 Ask me anything else.`,
      ]),
    }),
  },

  // ---- Identity / about --------------------------------------------------
  {
    id: 'about',
    utterances: [
      'who are you', 'tell me about yourself', 'introduce yourself', 'what is your background',
      'tell me about aditya', 'your bio', 'your story', 'what do you do',
    ],
    keywords: ['who are you', 'about you', 'yourself', 'background', 'introduce'],
    weight: 1.1,
    respond: ({ pick }) => ({
      text: pick('about', [
        `I'm **${identity.name}**, a ${identity.age}-year-old ${identity.role} based in ${identity.location}. ${identity.summary}\n\nThe short version: I love turning hard AI problems into products people actually use. Want to hear about my startup, my projects, or my research?`,
        `Hey — I'm ${identity.firstName}. I'm a ${identity.age}-year-old ${identity.role} who builds AI-powered systems end to end. ${identity.roleFocus}\n\nA few things that define me: I'm a 6× national hackathon winner and 3× international finalist, and I co-founded **Tokenistt** (a YC S26 applicant). Ask me anything.`,
        `I'm ${identity.name}, ${identity.role} from ${identity.location}. ${identity.summary}\n\nRight now I'm co-founding Tokenistt and interning as an SDE at Mythos in Singapore. What would you like to dig into?`,
      ]),
    }),
  },

  // ---- Skills ------------------------------------------------------------
  {
    id: 'skills',
    utterances: [
      'what are your skills', 'what technologies do you know', 'your tech stack', 'what can you build',
      'what languages do you know', 'your expertise', 'are you good at react', 'do you know python',
    ],
    keywords: ['skills', 'tech stack', 'technologies', 'expertise', 'languages', 'know'],
    respond: ({ pick }) => ({
      text: `${pick('skills', [
        `Sure! I work across the whole stack, but my sweet spot is AI-powered products. Here's the toolkit:`,
        `Happy to share — I tend to live where AI meets full-stack and product. This is what I reach for:`,
        `My stack spans AI/ML, full-stack, and product work. Here's the breakdown:`,
      ])}\n\n${skillsText()}\n\nWant to know how I've used any of these in a real project? Just ask.`,
    }),
  },

  // ---- Experience --------------------------------------------------------
  {
    id: 'experience',
    utterances: [
      'what is your experience', 'where have you worked', 'your work experience', 'your jobs',
      'tell me about your career', 'your internship', 'are you working anywhere',
    ],
    keywords: ['experience', 'worked', 'career', 'job', 'internship', 'employment'],
    respond: ({ pick }) => ({
      text: `${pick('experience', [
        `Here's where I've spent my time so far — I tend to gravitate toward roles where I can ship real product:`,
        `My journey's been a mix of building startups and hands-on engineering. Here's the rundown:`,
        `Glad you asked — here's my professional experience:`,
      ])}\n\n${experienceText()}\n\nCurious about any role in particular? I'm happy to go deeper.`,
    }),
  },

  // ---- Education ---------------------------------------------------------
  {
    id: 'education',
    utterances: [
      'what is your education', 'where did you study', 'your degree', 'which college',
      'your academic background', 'are you a student',
    ],
    keywords: ['education', 'study', 'college', 'university', 'degree', 'cgpa'],
    respond: ({ pick }) => {
      const e = education[0];
      return {
        text: pick('education', [
          `I'm currently pursuing my **${e.degree}** in ${e.major} at ${e.institution} in ${e.location} (${e.year}). ${e.description} Most of what I know, though, I've learned by building and shipping.`,
          `I study ${e.major} — a **${e.degree}** at ${e.institution} (${e.year}). ${e.description} Honestly, hackathons and real projects have been just as formative as the classroom.`,
          `Academically, I'm doing my **${e.degree}** in ${e.major} at ${e.institution} (${e.year}). ${e.description}`,
        ]),
      };
    },
  },

  // ---- Contact -----------------------------------------------------------
  {
    id: 'contact',
    utterances: [
      'how can i contact you', 'whats your email', 'how do i reach you', 'i want to hire you',
      'lets connect', 'how to get in touch', 'can we collaborate', 'take me to contact',
    ],
    keywords: ['contact', 'email', 'reach', 'hire', 'connect', 'get in touch'],
    respond: ({ input, pick }) => {
      const actions: OfflineAction[] = [];
      if (hasNavVerb(input)) actions.push(linkAction(`mailto:${identity.email}`));
      return {
        text: pick('contact', [
          `You can reach me at **${identity.email}**, or connect on [LinkedIn](${identity.linkedin}) and [GitHub](${identity.github}). Want me to book a meeting? Just say "open calendar".`,
          `Let's connect! Email me at **${identity.email}** or find me on [LinkedIn](${identity.linkedin}). I'm always open to interesting conversations.`,
        ]),
        actions,
      };
    },
  },

  // ---- Book a meeting / call (Calendly widget) --------------------------
  {
    id: 'book_meeting',
    utterances: [
      'book a meeting', 'book a call', 'schedule a call', 'schedule a meeting',
      'lets arrange a chat', 'can we talk', 'set up an interview', 'schedule an interview',
      'lets connect on a call', 'arrange a meeting', 'book time with you', 'i want to meet you',
      'lets hop on a call', 'set up a meeting', 'can we schedule a call', 'lets jump on a call',
    ],
    keywords: ['book', 'meeting', 'call', 'interview', 'schedule', 'appointment', 'calendly'],
    weight: 1.15,
    respond: ({ pick }) => ({
      text: pick('book_meeting', [
        `Let's do it — opening my calendar so you can grab a time that works for you.`,
        `Happy to chat! Pick a slot that suits you — opening the booking widget now.`,
        `Sure thing — here's my calendar to book a call.`,
      ]),
      actions: [{ type: 'openWindow', appId: 'collaboration' }],
      confidence: 0.93,
    }),
  },

  // ---- Resume ------------------------------------------------------------
  {
    id: 'resume',
    utterances: ['show me your resume', 'open your cv', 'can i see your resume', 'download resume', 'your cv'],
    keywords: ['resume', 'cv', 'curriculum'],
    weight: 1.05,
    respond: ({ pick }) => ({
      text: pick('resume', [
        `Opening my resume now — you can read or download it there.`,
        `Sure! Here's my resume.`,
      ]),
      actions: [{ type: 'openWindow', appId: 'resume' }],
      confidence: 0.9,
    }),
  },

  // ---- Research ----------------------------------------------------------
  {
    id: 'research',
    utterances: [
      'tell me about your research', 'your publications', 'have you published papers',
      'your research papers', 'open research', 'academic work',
    ],
    keywords: ['research', 'paper', 'publication', 'published', 'journal'],
    respond: ({ input, pick }) => {
      const list = publications.length
        ? publications.map((p) => `- **${p.title}** (${p.venue}, ${p.year})${p.awards.length ? ` — ${p.awards.join('; ')}` : ''}`).join('\n')
        : '- Peer-reviewed work in AI infrastructure, RAG, and applied ML.';
      const actions: OfflineAction[] = hasNavVerb(input) ? [{ type: 'openWindow', appId: 'research-center' }] : [];
      return {
        text: `${pick('research', [
          `Yes — I genuinely enjoy the research side of things. Here's what I've published:`,
          `I do — alongside building, I've put out peer-reviewed work. Here it is:`,
          `Happy to share. My published research so far:`,
        ])}\n\n${list}\n\nWant me to open the Research Center for the full papers and award details?`,
        actions,
      };
    },
  },

  // ---- Startup / Tokenistt ----------------------------------------------
  {
    id: 'startup',
    utterances: [
      'tell me about tokenistt', 'what is your startup', 'explain tokenistt', 'your company',
      'what are you building', 'tell me about your venture', 'founder',
    ],
    keywords: ['tokenistt', 'startup', 'company', 'founder', 'venture'],
    weight: 1.1,
    respond: ({ input, pick }) => {
      const wantsSite = /\b(website|site|\.com|live)\b/.test(input.toLowerCase());
      const actions: OfflineAction[] = wantsSite
        ? [linkAction(TOKENISTT_URL)]
        : [{ type: 'openWindow', appId: 'founder-hq' }];
      return {
        text: pick('startup', [
          `**Tokenistt** is the startup I'm building with my friends Aryan Singh and Akshay Khanna — the operating system for production AI: observability, governance, and enterprise AI operations. We're a YC Summer 2026 applicant. ${wantsSite ? 'Opening the website…' : 'Opening Founder HQ so you can see the vision, deck, and roadmap.'}`,
          `I co-founded **Tokenistt** (YC S26 applicant) with Aryan Singh and Akshay Khanna. We give engineering teams the tools to monitor, govern, and trust the AI they run in production. ${wantsSite ? 'Taking you to the site…' : "Let me open Founder HQ."}`,
        ]),
        actions,
      };
    },
  },

  // ---- Achievements / hackathons ----------------------------------------
  {
    id: 'achievements',
    utterances: [
      'what are your achievements', 'your hackathon wins', 'awards you have won', 'show your wins',
      'how many hackathons have you won', 'your accomplishments', 'trophies',
    ],
    keywords: ['achievement', 'hackathon', 'award', 'win', 'won', 'accomplishment', 'trophy'],
    respond: ({ input, pick }) => {
      const wantsPhotos = /\b(show|see|picture|photo|gallery|display|view)\b/.test(input.toLowerCase());
      const wins = hackathonWins.map((c) => `- **${c.title}** — ${c.achievement}`).join('\n');
      const finalists = hackathonFinalists
        .map((c) => `- **${c.title}** — ${c.achievement}`)
        .join('\n');
      const intro = pick('achievements', [
        `${hackathonSummary}\n\n**Wins & podiums:**`,
        `Here are my hackathon wins and milestones:\n\n**Wins & podiums:**`,
        `I love building under pressure — here's the track record:\n\n**Wins & podiums:**`,
      ]);
      const finalistBlock = finalists ? `\n\n**Finalist / Top placements:**\n${finalists}` : '';
      return {
        text: `${intro}\n${wins}${finalistBlock}${
          wantsPhotos ? '\n\nHere are the pictures:' : '\n\nSay "show my hackathon wins" to see the photos.'
        }`,
        media: wantsPhotos ? 'photos' : undefined,
      };
    },
  },

  // ---- Projects: list ----------------------------------------------------
  {
    id: 'projects_overview',
    utterances: [
      'what projects have you built', 'show me your projects', 'your work', 'list your projects',
      'what have you made', 'portfolio of work', 'open projects',
    ],
    keywords: ['projects', 'work', 'built', 'portfolio', 'made'],
    weight: 1.05,
    gate: (e) => !e.projectId,
    respond: ({ input, pick }) => {
      const list = PROJECT_KB.map((p) => `- **${p.name}** — ${p.tagline}`).join('\n');
      const actions: OfflineAction[] = hasNavVerb(input) ? [{ type: 'openWindow', appId: 'github' }] : [];
      return {
        text: `${pick('projects_overview', [
          `These are the projects I'm most proud of — each one solved a problem I genuinely cared about:`,
          `I've shipped a few things worth talking about:`,
          `Happy to show you around — here's my main body of work:`,
        ])}\n\n${list}\n\nI can go as deep as you like — try "what tech does TalkWithDB use?", "what was the hardest part of Sanjivani?", or just "open Sanjivani".`,
        actions,
      };
    },
  },

  // ---- Projects: specific (gated on a project entity) --------------------
  {
    id: 'project_detail',
    utterances: [
      'tell me about', 'explain', 'what is', 'how does it work', 'what tech does it use',
      'what features', 'what challenges', 'the architecture', 'open it', 'show me',
    ],
    keywords: ['talkwithdb', 'sanjivani', 'healthcare', 'database', 'project'],
    weight: 1.15,
    gate: (e) => !!e.projectId,
    respond: ({ input, entities, pick }) => {
      const p = findProject(entities.projectId!)!;
      const navigate = hasNavVerb(input) && !entities.facet;
      if (navigate || entities.facet === 'demo') {
        const actions: OfflineAction[] = entities.facet === 'demo'
          ? [{ type: 'openWindow', appId: 'videos' }]
          : [{ type: 'openWindow', appId: 'github', payload: { projectId: p.id } }];
        return {
          text: pick(`open_${p.id}`, [
            `Opening **${p.name}** — ${p.tagline}`,
            `Here's **${p.name}**. ${p.tagline}`,
          ]),
          actions,
          topic: p.id,
          confidence: 0.9,
        };
      }
      return {
        text: projectFacetText(p, entities.facet ?? 'overview'),
        topic: p.id,
      };
    },
  },

  // ---- Media -------------------------------------------------------------
  {
    id: 'show_photos',
    utterances: ['show your hackathon photos', 'show me your pictures', 'see your gallery', 'win pictures', 'show me memories'],
    keywords: ['photos', 'pictures', 'gallery', 'memories'],
    respond: ({ pick }) => ({
      text: pick('show_photos', ['Here are my hackathon wins and milestones:', 'Sure — some of my favorite moments:']),
      media: 'photos',
      confidence: 0.88,
    }),
  },
  {
    id: 'show_reel',
    utterances: ['play your podcast', 'show the reel', 'cybersecurity video', 'your instagram reel', 'play the cybersecurity reel'],
    keywords: ['reel', 'podcast', 'cybersecurity', 'instagram'],
    respond: ({ pick }) => ({
      text: pick('show_reel', ["Here's my cybersecurity-awareness podcast:", 'Playing the reel for you:']),
      media: 'reel',
      confidence: 0.88,
    }),
  },

  // ---- External links ----------------------------------------------------
  {
    id: 'link_github',
    utterances: ['open your github', 'show github profile', 'your github account', 'github link'],
    keywords: ['github'],
    respond: ({ pick }) => ({
      text: pick('link_github', ['Opening my GitHub profile in a new tab.', 'Here\'s my GitHub →']),
      actions: [linkAction(identity.github)],
      confidence: 0.9,
    }),
  },
  {
    id: 'link_linkedin',
    utterances: ['open your linkedin', 'show linkedin profile', 'your linkedin', 'connect on linkedin'],
    keywords: ['linkedin'],
    respond: ({ pick }) => ({
      text: pick('link_linkedin', ['Opening my LinkedIn in a new tab.', 'Here\'s my LinkedIn →']),
      actions: [linkAction(identity.linkedin)],
      confidence: 0.9,
    }),
  },
  {
    id: 'link_email',
    utterances: ['email me', 'send you an email', 'open mail', 'mail you'],
    keywords: ['email', 'mail'],
    respond: ({ pick }) => ({
      text: pick('link_email', [`Opening your mail client to email me at ${identity.email}.`, `Let's talk — ${identity.email}`]),
      actions: [linkAction(`mailto:${identity.email}`)],
      confidence: 0.88,
    }),
  },
  {
    id: 'link_blog',
    utterances: ['read your blog', 'open your medium', 'your article', 'your writing', 'medium post'],
    keywords: ['blog', 'medium', 'article', 'writing'],
    respond: ({ pick }) => ({
      text: pick('link_blog', ['Opening my Medium article "When Machines Learned to Remember".', 'Here\'s my blog →']),
      actions: [linkAction(BLOG_URL)],
      confidence: 0.9,
    }),
  },

  // ---- App launching (gated on an app entity) ---------------------------
  {
    id: 'open_app',
    utterances: [
      'open', 'launch', 'show me', 'go to', 'take me to', 'open the app', 'navigate to', 'open settings',
    ],
    keywords: ['open', 'launch', 'go to'],
    weight: 1.05,
    gate: (e) => !!e.appId,
    respond: ({ input, entities, pick }) => {
      const app = findApp(input)!;
      return {
        text: pick(`open_${entities.appId}`, [
          `Opening **${app.title}** for you.`,
          `Here's **${app.title}**.`,
          `Launching **${app.title}** →`,
        ]),
        actions: [{ type: 'openWindow', appId: app.appId }],
        confidence: 0.92,
      };
    },
  },

  // ---- Capabilities / help ----------------------------------------------
  {
    id: 'capabilities',
    utterances: ['what can you do', 'help', 'what can i ask', 'how does this work', 'what can you help with'],
    keywords: ['what can you do', 'help', 'capabilities'],
    respond: ({ pick }) => ({
      text: pick('capabilities', [
        `Think of me as ${identity.firstName} himself — ask me anything about my background, skills, experience, research, or projects, and I'll answer in the first person. I can also open things up for you. A few to try:\n\n- "Tell me about Tokenistt"\n- "What was the hardest part of TalkWithDB?"\n- "Show my hackathon wins"\n- "What's your tech stack?"`,
        `Plenty! I can talk through my work, projects, startup, and research, or jump straight to an app — Projects, Resume, Photos, Founder HQ, you name it. For example:\n\n- "Explain Sanjivani"\n- "Open my resume"\n- "Book a meeting"\n- "Show healthcare projects"`,
      ]),
    }),
  },
];
