import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { IoArrowUp } from 'react-icons/io5';
import { BsVolumeUpFill, BsVolumeMuteFill, BsStopCircleFill } from 'react-icons/bs';
import { speakAndWait, stopAudio } from '../../lib/tts';
import { userConfig } from '../../config/index';
import { useOSStore } from '../../stores/osStore';
import { handleEasterEgg } from '../../lib/easterEggs';
import DraggableWindow from './DraggableWindow';
import MediaGallery from '../os/MediaGallery';
import InstagramEmbed from '../os/InstagramEmbed';
import { hackathonGallery } from '../../config/content/index';
import { extraCurricularActivities } from '../../config/extracurricular';
import { defaultWindowLayout } from '../../lib/windowLayout';
import { createContext } from '../../lib/copilot';
import type { ConvContext } from '../../lib/copilot';
import type { AppId, MediaKind, WindowPayload } from '../../os/types';

const REEL_URL = extraCurricularActivities.find((a) => a.instagramUrl)?.instagramUrl;

// OAuth client IDs (public, safe to expose). Empty until configured in env.
const GOOGLE_CLIENT_ID = (import.meta.env.PUBLIC_GOOGLE_CLIENT_ID as string | undefined) || undefined;
const GITHUB_CLIENT_ID = (import.meta.env.PUBLIC_GITHUB_CLIENT_ID as string | undefined) || undefined;

// NOTE: Prompt limits, the auth gate, and rate limiting are all enforced
// server-side (/api/copilot, keyed by a hash of IP + User-Agent). Nothing here
// is trusted as a security boundary — clearing cookies/localStorage cannot
// reset quota or unlock the gate.

/** Deterministic media-intent detection so "show my wins / play the reel" always works. */
function detectMediaIntent(input: string): MediaKind | undefined {
  const q = input.toLowerCase();
  const wantsShow = /\b(show|see|display|view|play|pull up|let me see|can i see)\b/.test(q);
  const photoWords = /\b(hackathon|win|wins|won|trophy|trophies|award|awards|picture|pictures|photo|photos|gallery|memories)\b/.test(q);
  const reelWords = /\b(reel|podcast|instagram|insta|cyber\s*security|cybersecurity|video podcast)\b/.test(q);
  if (reelWords && (wantsShow || /\b(reel|podcast)\b/.test(q))) return 'reel';
  if (photoWords && (wantsShow || /\b(picture|photo|gallery)\b/.test(q))) return 'photos';
  return undefined;
}

function openExternal(url: string) {
  if (typeof window === 'undefined') return;
  if (url.startsWith('mailto:')) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  media?: MediaKind;
};

type ChatHistory = {
  messages: Message[];
  input: string;
};

interface MacTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true, the terminal opens as the Intro window: it auto-types a greeting
   *  before the user can chat, and uses the Intro window's position/size/title. */
  introMode?: boolean;
}

const INTRO_TYPE_SPEED = 26; // ms per character

// Customize these placeholder messages for the input field
const SUGGESTED_PROMPTS = [
  'Open Tokenistt',
  'Show healthcare projects',
  'Show my hackathon wins',
  'Summarize my achievements',
];

const PLACEHOLDER_MESSAGES = [
  'Type your question...',
  'What are you building at Tokenistt?',
  'Tell me about your research papers',
  'What hackathons have you won?',
  'What is your AI/ML experience?',
];

export default function MacTerminal({ isOpen, onClose, introMode = false }: MacTerminalProps) {
  const [mounted, setMounted] = useState(false);
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const computedAge = currentDate.getFullYear() - userConfig.yearOfBirth;

  const INTRO_GREETING = `Hi, I'm ${userConfig.name} 👋 — a ${computedAge}-year-old developer, founder & engineer. I think in products, build for impact, and ship fast. Ask me anything about my work, research, or journey.`;
  const [introTyped, setIntroTyped] = useState('');
  const [introDone, setIntroDone] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    messages: [],
    input: '',
  });
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAiMsgRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // ---- Lead gate: the server requires OAuth sign-in after the free prompts.
  // The gate UI here is opened in response to the server's AUTH_REQUIRED code;
  // it is never the security boundary itself. authUser is for display only.
  const [authUser, setAuthUser] = useState<{ name: string; email: string } | null>(null);
  const authedRef = useRef(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateName, setGateName] = useState('');
  const [gateEmail, setGateEmail] = useState('');
  const [gateCompany, setGateCompany] = useState(''); // honeypot
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const pendingInputRef = useRef<string | null>(null);
  // True after the daily limit is hit, while we wait for the visitor to say
  // "yes" to booking a call. Lets us open the Calendly widget locally without
  // another (rate-limited) server round-trip.
  const awaitingCallRef = useRef(false);
  const [dailyLimitHit, setDailyLimitHit] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleHandlerRef = useRef<((resp: { credential?: string }) => void) | null>(null);
  const submitMessageRef = useRef<((raw: string) => void) | null>(null);
  const completeAuthRef = useRef<((user: { name: string; email: string }) => void) | null>(null);
  const oauthConfigured = Boolean(GOOGLE_CLIENT_ID || GITHUB_CLIENT_ID);

  // iOS Safari keyboard awareness: visualViewport shrinks when keyboard opens.
  // Pad content so the composer stays above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(kb);
      if (kb > 50) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('adityaos-copilot-user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setAuthUser(parsed);
          authedRef.current = true;
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Intro mode: auto-type the greeting one character at a time on open.
  useEffect(() => {
    if (!introMode || !mounted || !isOpen) return;
    let charIdx = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      charIdx += 1;
      setIntroTyped(INTRO_GREETING.slice(0, charIdx));
      if (charIdx < INTRO_GREETING.length) {
        timer = setTimeout(tick, INTRO_TYPE_SPEED);
      } else {
        setIntroDone(true);
      }
    };
    timer = setTimeout(tick, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introMode, mounted, isOpen]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const currentMessage = PLACEHOLDER_MESSAGES[currentPlaceholderIndex];

    const animatePlaceholder = () => {
      if (isDeleting) {
        if (placeholder.length === 0) {
          setIsDeleting(false);
          setCurrentPlaceholderIndex(
            (prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length
          );
          timeout = setTimeout(animatePlaceholder, 400);
        } else {
          setPlaceholder((prev) => prev.slice(0, -1));
          timeout = setTimeout(animatePlaceholder, 80);
        }
      } else {
        if (placeholder.length === currentMessage.length) {
          timeout = setTimeout(() => setIsDeleting(true), 1500);
        } else {
          setPlaceholder(currentMessage.slice(0, placeholder.length + 1));
          timeout = setTimeout(animatePlaceholder, 120);
        }
      }
    };

    timeout = setTimeout(animatePlaceholder, 100);

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, currentPlaceholderIndex]);

  // Listen for the GitHub OAuth popup result (posted by the callback page).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'github-oauth') return;
      setGateLoading(false);
      const payload = e.data.payload || {};
      if (!payload.ok || !payload.user) {
        setGateError(payload.error || 'GitHub sign-in failed.');
        return;
      }
      let expected: string | null = null;
      try {
        expected = sessionStorage.getItem('gh_oauth_state');
      } catch {
        // ignore
      }
      if (expected && payload.state && expected !== payload.state) {
        setGateError('Sign-in could not be verified. Please try again.');
        return;
      }
      completeAuthRef.current?.({ name: payload.user.name, email: payload.user.email });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Load Google Identity Services and render its button while the gate is open.
  useEffect(() => {
    if (!gateOpen || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    const init = () => {
      const g = (window as any).google;
      if (cancelled || !g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential?: string }) => googleHandlerRef.current?.(resp),
      });
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        g.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 280,
        });
      }
    };

    if ((window as any).google?.accounts?.id) {
      init();
    } else {
      const existing = document.getElementById('gis-script') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', init);
      } else {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.id = 'gis-script';
        s.onload = init;
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [gateOpen]);

  // Customize the system prompt with your personal information
  // Lean system prompt. The offline engine answers all common, structured
  // questions for free; the LLM is only hit for low-confidence/unusual phrasing,
  // so this is a compact fact sheet + persona rather than the full résumé. Keeps
  // per-call input tokens (and cost) low while staying grounded and human.
  const topProjects = userConfig.projects
    .slice(0, 4)
    .map((p) => `${p.title}: ${p.description}`)
    .join(' | ');
  const recentExp = userConfig.experience
    .slice(0, 3)
    .map((e) => `${e.title} @ ${e.company} (${e.period})`)
    .join(' | ');

  const systemPrompt = `You ARE ${userConfig.name}. Always speak in first person ("I", "my"). Never refer to yourself in third person. Today is ${formattedDate}.

VOICE: Warm, human, and concise — like a sharp, friendly founder-engineer talking to a visitor. 2–5 sentences for most answers. Use light markdown (bold, short lists) when it helps. Sound genuinely enthusiastic, never robotic or salesy. Vary your phrasing.

FACTS (ground every claim in these; if you don't know something, say so honestly — never invent dates, employers, metrics, or tech):
- ${computedAge}yo ${userConfig.role} in ${userConfig.location}. ${userConfig.roleFocus}
- ${userConfig.summary ?? ''}
- Email ${userConfig.contact.email}; GitHub ${userConfig.social.github}; LinkedIn ${userConfig.social.linkedin}.
- Skills: ${userConfig.skills.slice(0, 14).join(', ')}.
- Experience: ${recentExp}.
- Education: ${userConfig.education[0].degree}${userConfig.education[0].major ? ` in ${userConfig.education[0].major}` : ''}, ${userConfig.education[0].institution} (${userConfig.education[0].year}).
- Projects: ${topProjects}.
- Startup: Tokenistt (YC S26 applicant), co-founded with Aryan Singh & Akshay Khanna — the operating system for production AI (observability, governance, ops). Site tokenistt.com.
- Track record: 6× national hackathon winner, 3× international finalist; published researcher.

OUTPUT: ALWAYS reply with valid JSON: {"message": "<first-person reply>", "actions": [], "mode": "chat"}.
You may add ONE or more actions to control this macOS-style desktop ("AdityaOS"):
- {"type":"showMedia","media":"photos"} — show hackathon win photos inline (use for "show wins/pictures")
- {"type":"showMedia","media":"reel"} — play my cybersecurity podcast reel inline
- {"type":"openWindow","appId":"founder-hq"} — Tokenistt HQ (use for "explain/show Tokenistt")
- {"type":"openWindow","appId":"github","payload":{"projectId":"talkwithdb"}} — TalkWithDB
- {"type":"openWindow","appId":"github","payload":{"projectId":"sanjivani"}} — Sanjivani
- {"type":"openWindow","appId":"github"} — all projects
- {"type":"openWindow","appId":"research-center"} — research
- {"type":"openWindow","appId":"resume"} — resume
- {"type":"openWindow","appId":"videos"} — demo videos
- {"type":"openWindow","appId":"photos"} — Photos app
- {"type":"openWindow","appId":"notes"} — competitions/certs/activities
- {"type":"openWindow","appId":"collaboration"} — book a meeting
- {"type":"openLink","url":"<url>"} — for GitHub/LinkedIn, mailto:${userConfig.contact.email}, https://www.tokenistt.com, or my Medium blog https://medium.com/@tiwariaditya005

When an action fits, pair it with a short warm confirmation in "message". If a question is unrelated to me or my work, answer briefly and set actions to [].`;

  useEffect(() => {
    const count = chatHistory.messages.length;
    const lastMsg = chatHistory.messages[count - 1];

    if (isTyping) {
      // User just sent — scroll to bottom to reveal typing indicator
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (count > prevMsgCount.current && lastMsg?.role === 'assistant') {
      // New AI answer — scroll to the TOP so user reads from the beginning
      lastAiMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevMsgCount.current = count;
  }, [chatHistory.messages, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatHistory((prev) => ({ ...prev, input: e.target.value }));
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const executeCopilotActions = useOSStore((s) => s.executeCopilotActions);

  // Per-session conversational memory (follow-ups, response variation). The
  // engine runs server-side; we keep this object in sync from each response so
  // multi-turn context works without trusting the client for anything.
  const copilotContext = useRef<ConvContext>(createContext());

  /** Dispatch server-returned actions to the OS (open apps / external links). */
  const dispatchActions = (actions: any[]) => {
    if (!Array.isArray(actions)) return;
    const osActions: { type: 'openWindow'; appId: AppId; payload?: WindowPayload }[] = [];
    actions.forEach((a) => {
      if (a?.type === 'openWindow' && a.appId) {
        osActions.push({ type: 'openWindow', appId: a.appId, payload: a.payload });
      }
    });
    if (osActions.length) executeCopilotActions(osActions);
    actions.forEach((a) => {
      if (a?.type === 'openLink' && a.url) openExternal(a.url);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(chatHistory.input);
  };

  const submitMessage = async (raw: string) => {
    const userInput = raw.trim();

    if (!userInput || isTyping) return;

    // After the daily limit, we invited the visitor to book a call. If their
    // reply sounds like a "yes", open the booking widget right here — they're
    // rate-limited, so we can't (and shouldn't) hit the server again.
    if (awaitingCallRef.current) {
      awaitingCallRef.current = false;
      const affirmative =
        /\b(yes|yeah|yep|yup|ya|sure|ok|okay|kk|sounds?\s*(good|great|nice|perfect)|that\s*works|lets?\s*do\s*it|let'?s\s*go|definitely|absolutely|of\s*course|why\s*not|i'?m\s*in|im\s*in|book\s*it|go\s*ahead|please\s*do|gladly|love\s*to|i'?d\s*love|id\s*love|down\s*for\s*it)\b/i.test(
          userInput,
        );
      if (affirmative) {
        setChatHistory((prev) => ({
          messages: [
            ...prev.messages,
            { role: 'user', content: userInput },
            {
              role: 'assistant',
              content:
                "Amazing — let's make it happen! 🎉 I'm pulling up my calendar now; grab whichever slot works best for you and I'll see you there.",
            },
          ],
          input: '',
        }));
        executeCopilotActions([{ type: 'openWindow', appId: 'collaboration' }]);
        return;
      }
      // Not a clear yes — fall through to normal handling (the server will
      // re-issue the friendly limit + booking nudge).
    }

    // Easter eggs are handled locally (canned, non-LLM, no quota).
    const egg = handleEasterEgg(userInput);
    if (egg.handled) {
      setChatHistory((prev) => ({
        messages: [
          ...prev.messages,
          { role: 'user', content: userInput },
          { role: 'assistant', content: egg.message ?? '…' },
        ],
        input: '',
      }));
      egg.action?.();
      return;
    }

    // Snapshot history BEFORE echoing, used to build the LLM transcript.
    const priorMessages = chatHistory.messages;

    // Optimistically echo the user's message.
    setChatHistory((prev) => ({
      messages: [...prev.messages, { role: 'user', content: userInput }],
      input: '',
    }));
    setIsTyping(true);

    // Cap history to the last few turns to keep input tokens (and cost) low —
    // the LLM only needs recent context, not the whole transcript.
    const recentHistory = priorMessages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }));

    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory,
      { role: 'user' as const, content: userInput },
    ];

    try {
      // Single authoritative endpoint: it enforces the auth gate, daily cap and
      // rate limit server-side (keyed by IP+UA), runs the offline engine, and
      // defers to the LLM only when needed. Nothing here can be bypassed by
      // clearing client storage.
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userInput,
          context: copilotContext.current,
          messages: apiMessages,
        }),
      });

      const data = await response.json().catch(() => null);

      // ---- Gate responses (server-authoritative) -------------------------
      if (data && data.ok === false) {
        if (data.code === 'AUTH_REQUIRED') {
          // Pull back the echoed message and resume it after sign-in.
          setChatHistory((prev) => ({ ...prev, messages: prev.messages.slice(0, -1) }));
          pendingInputRef.current = userInput;
          setGateError(null);
          setGateOpen(true);
          setIsTyping(false);
          return;
        }

        if (data.code === 'DAILY_LIMIT') {
          awaitingCallRef.current = true;
          setDailyLimitHit(true);
        }

        const notice =
          data.code === 'DAILY_LIMIT'
            ? "Honestly, I've loved talking with you. 💛 Let's make it a proper one-on-one — how about we book a call? Just say *\"yes\"* (or \"sounds good\") and I'll pull up my calendar."
            : data.code === 'RATE_LIMIT'
              ? "You're sending messages a little too fast — give me a few seconds and try again. ⏳"
              : data.message || 'Something went wrong. Please try again.';
        setChatHistory((prev) => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: notice }],
        }));
        setIsTyping(false);
        return;
      }

      if (!response.ok || !data || !data.ok) {
        throw new Error(`Copilot request failed (${response.status})`);
      }

      // ---- Successful answer --------------------------------------------
      if (data.context && typeof data.context === 'object') {
        copilotContext.current = data.context;
      }
      dispatchActions(data.actions);

      const media: MediaKind | undefined =
        data.media === 'photos' || data.media === 'reel'
          ? data.media
          : detectMediaIntent(userInput);

      setChatHistory((prev) => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: data.reply, media }],
      }));
    } catch {
      setChatHistory((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'assistant',
            content:
              "I'm having trouble reaching my brain right now. Please check your connection and try again in a moment.",
          },
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  // Keep a stable reference to the latest submitMessage for resume-after-auth.
  submitMessageRef.current = submitMessage;

  // Finalize a successful sign-in: persist, unlock, and resume the pending Q.
  const completeAuth = (user: { name: string; email: string }) => {
    try {
      localStorage.setItem('adityaos-copilot-user', JSON.stringify(user));
    } catch {
      // ignore storage failures
    }
    setAuthUser(user);
    authedRef.current = true;
    setGateOpen(false);
    setGateError(null);
    const resume = pendingInputRef.current;
    pendingInputRef.current = null;
    if (resume) submitMessageRef.current?.(resume);
  };
  completeAuthRef.current = completeAuth;

  // Google: verify the ID token server-side, then unlock.
  const handleGoogleCredential = async (resp: { credential?: string }) => {
    const credential = resp?.credential;
    if (!credential) return;
    setGateLoading(true);
    setGateError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, message: pendingInputRef.current ?? '' }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Google sign-in failed.');
      completeAuth({ name: data.user.name, email: data.user.email });
    } catch (err: any) {
      setGateError(err?.message || 'Google sign-in failed.');
    } finally {
      setGateLoading(false);
    }
  };
  googleHandlerRef.current = handleGoogleCredential;

  // GitHub: open the authorize popup; the callback posts the result back.
  const startGithub = () => {
    if (!GITHUB_CLIENT_ID) {
      setGateError('GitHub sign-in is not configured yet.');
      return;
    }
    const state = Math.random().toString(36).slice(2);
    try {
      sessionStorage.setItem('gh_oauth_state', state);
    } catch {
      // ignore
    }
    const redirect = `${window.location.origin}/api/auth/github/callback`;
    const authUrl =
      `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${encodeURIComponent('read:user user:email')}&state=${state}`;
    const w = 520;
    const h = 640;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    window.open(authUrl, 'github-oauth', `width=${w},height=${h},left=${left},top=${top}`);
    setGateLoading(true);
    setGateError(null);
  };

  // Manual fallback (only used when no OAuth provider is configured).
  const submitGate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    const name = gateName.trim();
    const email = gateEmail.trim();
    if (!name || !email) {
      setGateError('Please enter your name and email.');
      return;
    }
    if (!/.+@.+\..+/.test(email)) {
      setGateError('Please enter a valid email address.');
      return;
    }

    setGateLoading(true);
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message: pendingInputRef.current ?? '',
          company: gateCompany,
          source: 'copilot',
        }),
      }).catch(() => null);
      completeAuth({ name, email });
    } finally {
      setGateLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const md = '[&_p]:my-0 [&_p+p]:mt-3 [&_a]:text-[#7eb6ff] [&_a]:underline [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3';
  const showEmptyState = !introMode && chatHistory.messages.length === 0 && !isTyping;
  const showChips = chatHistory.messages.length === 0;

  const Avatar = (
    <img
      src="/images/profile/aditya.png"
      alt={userConfig.name}
      className="w-8 h-8 rounded-full object-cover object-top shrink-0 ring-1 ring-white/15 bg-white/5"
    />
  );

  const Media = ({ kind }: { kind?: MediaKind }) => (
    <>
      {kind === 'photos' && (
        <div className='mt-3 p-3 rounded-xl bg-white/5 border border-white/10'>
          <p className='text-[12px] text-gray-400 mb-2'>🏆 Hackathon wins & milestones — click any tile</p>
          <MediaGallery items={hackathonGallery} />
        </div>
      )}
      {kind === 'reel' && REEL_URL && (
        <div className='mt-3 p-3 rounded-xl bg-white/5 border border-white/10'>
          <p className='text-[12px] text-gray-400 mb-2'>🎙️ Cybersecurity awareness podcast</p>
          <InstagramEmbed url={REEL_URL} title='Cybersecurity Awareness Podcast' />
        </div>
      )}
    </>
  );

  return (
    <DraggableWindow
      title="AI Copilot"
      onClose={onClose}
      initialPosition={introMode ? defaultWindowLayout('intro').position : (() => {
        if (typeof window === 'undefined') return { x: 260, y: 140 };
        const w = 720, h = 560;
        return {
          x: Math.round((window.innerWidth - w) / 2),
          y: Math.round((window.innerHeight - 40 - 110 - h) / 2) + 40,
        };
      })()}
      initialSize={introMode ? defaultWindowLayout('intro').size : { width: 720, height: 560 }}
      className="bg-[#212121]"
    >
      <div className='relative flex flex-col h-full bg-[#212121] text-[#ececec]' style={keyboardOffset > 0 ? { paddingBottom: keyboardOffset } : undefined}>
        {/* Conversation */}
        <div className='flex-1 overflow-y-auto no-scrollbar' aria-live="polite" aria-atomic="false">
          {showEmptyState ? (
            <div className='h-full flex flex-col items-center justify-center px-6 text-center'>
              {Avatar}
              <h2 className='mt-4 text-2xl font-semibold tracking-tight'>How can I help you?</h2>
              <p className='mt-2 text-sm text-gray-400 max-w-sm'>
                Ask me anything about {userConfig.name.split(' ')[0]} — my projects, research, startup, or experience. I can also open apps for you.
              </p>
            </div>
          ) : (
            <div className='max-w-3xl mx-auto w-full px-4 py-6 space-y-6'>
              {introMode && (
                <div className='flex gap-3'>
                  {Avatar}
                  <div className={`flex-1 min-w-0 text-[15px] leading-7 ${md}`}>
                    <ReactMarkdown components={{ a: (p) => <a {...p} target='_blank' rel='noopener noreferrer' /> }}>
                      {introTyped}
                    </ReactMarkdown>
                    {!introDone && (
                      <span className='inline-block w-2 h-4 -mb-0.5 ml-0.5 bg-[#ececec] animate-pulse' aria-hidden='true' />
                    )}
                  </div>
                </div>
              )}

              {chatHistory.messages.map((msg, index) => {
                const isLastAi = msg.role === 'assistant' && index === chatHistory.messages.length - 1;
                return msg.role === 'user' ? (
                  <div key={index} className='flex justify-end'>
                    <div className='max-w-[80%] rounded-3xl bg-[#303030] px-4 py-2.5 text-[15px] leading-6 whitespace-pre-wrap break-words'>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={index} ref={isLastAi ? lastAiMsgRef : undefined} className='flex gap-3'>
                    {Avatar}
                    <div className={`flex-1 min-w-0 text-[15px] leading-7 ${md}`}>
                      <ReactMarkdown components={{ a: (p) => <a {...p} target='_blank' rel='noopener noreferrer' /> }}>
                        {msg.content}
                      </ReactMarkdown>
                      <Media kind={msg.media} />
                      <button
                        onClick={async () => {
                          if (speakingIndex === index) {
                            stopAudio();
                            setSpeakingIndex(null);
                          } else {
                            stopAudio();
                            setSpeakingIndex(index);
                            const clean = msg.content
                              .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                              .replace(/\s+/g, ' ').trim();
                            await speakAndWait(clean);
                            setSpeakingIndex(null);
                          }
                        }}
                        className='mt-1.5 flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors'
                        aria-label={speakingIndex === index ? 'Stop speaking' : 'Read aloud'}
                      >
                        {speakingIndex === index
                          ? <BsStopCircleFill size={12} className='text-emerald-400' />
                          : <BsVolumeUpFill size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className='flex gap-3'>
                  {Avatar}
                  <div className='flex items-center space-x-1 pt-2'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Daily limit banner */}
        {dailyLimitHit && (
          <div className='mx-3 mb-2 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium' style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><line x1="6.5" y1="4" x2="6.5" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6.5" cy="9" r="0.7" fill="currentColor"/></svg>
            Daily limit reached — replies paused until midnight
          </div>
        )}

        {/* Composer */}
        <div className='px-3 pb-3 pt-1'>
          <div className='max-w-3xl mx-auto w-full'>
            {showChips && (
              <div className='flex flex-wrap gap-2 mb-2.5 justify-center'>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type='button'
                    onClick={() => submitMessage(p)}
                    className='text-[13px] px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors'
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className='flex items-end gap-2 rounded-[26px] bg-[#303030] border border-white/10 px-3 py-2 shadow-lg'>
              <textarea
                ref={inputRef}
                rows={1}
                value={chatHistory.input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className='flex-1 bg-transparent outline-none resize-none px-2 py-1.5 text-[15px] placeholder-gray-500 leading-6 max-h-[140px] no-scrollbar'
                placeholder={placeholder || 'Ask anything'}
                aria-label='Message AI Copilot'
                name='copilot-input'
                autoComplete='off'
                inputMode='text'
                enterKeyHint='send'
              />
              <button
                type='submit'
                disabled={!chatHistory.input.trim() || isTyping}
                aria-label='Send'
                className='shrink-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors'
              >
                <IoArrowUp size={18} />
              </button>
            </form>
            <p className='text-[11px] text-gray-500 text-center mt-2'>
              {authUser
                ? `Signed in as ${authUser.email} · `
                : ''}
              AI Copilot answers as {userConfig.name.split(' ')[0]} and can open apps. It may occasionally be wrong.
            </p>
          </div>
        </div>

        {/* Lead gate overlay — shown after the free prompts are used */}
        {gateOpen && (
          <div className='absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md'>
            <div className='w-full max-w-sm rounded-2xl bg-[#2a2a2a] border border-white/10 shadow-2xl p-6'>
              <div className='flex flex-col items-center text-center'>
                {Avatar}
                <h3 className='mt-3 text-lg font-semibold'>Let's keep the conversation going</h3>
                <p className='mt-1.5 text-sm text-gray-400'>
                  Sign in so {userConfig.name.split(' ')[0]} can follow up — then ask away. Takes one tap.
                </p>
              </div>

              {oauthConfigured ? (
                <div className='mt-5 flex flex-col items-stretch gap-3'>
                  {GOOGLE_CLIENT_ID && (
                    <div className='flex justify-center min-h-[44px]'>
                      <div ref={googleBtnRef} />
                    </div>
                  )}

                  {GOOGLE_CLIENT_ID && GITHUB_CLIENT_ID && (
                    <div className='flex items-center gap-3 text-[11px] text-gray-500'>
                      <span className='h-px flex-1 bg-white/10' />
                      or
                      <span className='h-px flex-1 bg-white/10' />
                    </div>
                  )}

                  {GITHUB_CLIENT_ID && (
                    <button
                      type='button'
                      onClick={startGithub}
                      disabled={gateLoading}
                      className='w-full flex items-center justify-center gap-2 rounded-full bg-[#24292f] hover:bg-[#2f363d] text-white font-medium py-2.5 text-sm disabled:opacity-50 transition-colors border border-white/10'
                    >
                      <svg viewBox='0 0 16 16' width='18' height='18' fill='currentColor' aria-hidden='true'>
                        <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z' />
                      </svg>
                      {gateLoading ? 'Opening…' : 'Continue with GitHub'}
                    </button>
                  )}

                  {gateError && (
                    <p className='text-[13px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2'>{gateError}</p>
                  )}
                  <p className='text-[11px] text-gray-500 text-center'>
                    We only use your verified name &amp; email to reach back out. No posts, no spam.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitGate} className='mt-5 space-y-3'>
                  <input
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    placeholder='Your name'
                    autoComplete='name'
                    disabled={gateLoading}
                    className='w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60 placeholder-gray-500'
                  />
                  <input
                    type='email'
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                    disabled={gateLoading}
                    className='w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/60 placeholder-gray-500'
                  />
                  <div className='hidden' aria-hidden='true'>
                    <input value={gateCompany} onChange={(e) => setGateCompany(e.target.value)} tabIndex={-1} autoComplete='off' />
                  </div>
                  {gateError && (
                    <p className='text-[13px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2'>{gateError}</p>
                  )}
                  <button
                    type='submit'
                    disabled={gateLoading}
                    className='w-full rounded-xl bg-white text-black font-medium py-2.5 text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors'
                  >
                    {gateLoading ? 'Unlocking…' : 'Continue chatting'}
                  </button>
                  <p className='text-[11px] text-gray-500 text-center'>
                    Your details are kept private and used only to reach back out.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
