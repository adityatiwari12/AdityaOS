import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsVolumeMuteFill, BsVolumeUpFill, BsEnvelopeFill, BsDownload } from 'react-icons/bs';
import { useTourStore } from '../../stores/tourStore';
import VirtualCursor, { type CursorHandle } from './VirtualCursor';
import { runTourScript } from '../../os/tourScript';

function FinalCTAOverlay() {
  const skipTour = useTourStore((s) => s.skipTour);

  const emailHref =
    'mailto:tiwariaditya005@gmail.com?subject=Let%27s%20Build%20Together&body=Hi%20Aditya%2C%0A%0AI%20just%20explored%20AdityaOS%20and%20would%20love%20to%20connect%20regarding...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9970] flex items-center justify-center bg-black/55 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative w-full max-w-sm mx-4 rounded-3xl border border-white/15 bg-black/75 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center text-center gap-5"
      >
        <img
          src="/images/profile/aditya.png"
          alt="Aditya"
          className="w-16 h-16 rounded-full object-cover object-top ring-2 ring-white/20 shadow-lg"
        />

        <div>
          <p className="text-lg font-bold text-white mb-1">That's the quick tour.</p>
          <p className="text-sm text-white/65 leading-relaxed">
            You've seen the projects, research, startup, and achievements — the way I like to build.
            If you think we'd build great things together, I'd love to hear from you.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <a
            href={emailHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-sm font-semibold"
          >
            <BsEnvelopeFill size={14} />
            Email Aditya
          </a>
          <a
            href="/resume.pdf"
            download="Aditya_Tiwari_Resume.pdf"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-sm font-medium"
          >
            <BsDownload size={14} />
            Download Resume
          </a>
        </div>

        <button
          onClick={skipTour}
          className="text-xs text-white/35 hover:text-white/60 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

let currentAudio: HTMLAudioElement | null = null;

function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

function browserTTSFallback(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92; utter.pitch = 0.9; utter.volume = 1;
  const preferred = ['Google UK English Male', 'Microsoft David', 'Daniel', 'Google US English'];
  for (const name of preferred) {
    const v = voices.find((v) => v.name.includes(name));
    if (v) { utter.voice = v; break; }
  }
  window.speechSynthesis.speak(utter);
}

async function speakWithSarvam(text: string): Promise<void> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('sarvam-error');
    const { audio } = await res.json() as { audio?: string };
    if (!audio) throw new Error('no-audio');
    // Decode base64 WAV → blob → Audio element
    const binary = atob(audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    stopAudio();
    const el = new Audio(url);
    el.onended = () => URL.revokeObjectURL(url);
    currentAudio = el;
    await el.play();
  } catch {
    browserTTSFallback(text);
  }
}

export default function GuidedTour() {
  const running = useTourStore((s) => s.running);
  const step = useTourStore((s) => s.step);
  const totalSteps = useTourStore((s) => s.totalSteps);
  const captionTitle = useTourStore((s) => s.captionTitle);
  const captionBody = useTourStore((s) => s.captionBody);
  const muted = useTourStore((s) => s.muted);
  const showFinal = useTourStore((s) => s.showFinal);
  const skipTour = useTourStore((s) => s.skipTour);
  const toggleMute = useTourStore((s) => s.toggleMute);

  const cursorRef = useRef<CursorHandle | null>(null);
  const cancelRef = useRef({ cancelled: false });

  // TTS — speak each caption via Sarvam (server proxy), fall back to browser TTS
  useEffect(() => {
    if (!running || muted || !captionBody) return;
    const text = captionTitle ? captionTitle + '. ' + captionBody : captionBody;
    speakWithSarvam(text);
    return () => { stopAudio(); };
  }, [captionTitle, captionBody, muted, running]);

  // Stop TTS when tour ends or user skips
  useEffect(() => {
    if (!running && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [running]);

  useEffect(() => {
    if (!running) return;
    cancelRef.current = { cancelled: false };
    runTourScript({ cursor: cursorRef, cancel: cancelRef.current });
    return () => { cancelRef.current.cancelled = true; };
  }, [running]);

  if (!running && !showFinal) return null;

  return (
    <AnimatePresence>
      <>
        {running && <VirtualCursor ref={cursorRef} />}

        {/* Caption box */}
        {running && captionTitle && (
          <motion.div
            key={captionTitle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9980] flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/15 shadow-2xl max-w-md w-[calc(100%-2rem)]"
          >
            <img
              src="/images/profile/aditya.png"
              alt="Aditya AI"
              className="w-9 h-9 rounded-full object-cover object-top ring-1 ring-white/20 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">{captionTitle}</p>
              <p className="text-xs text-white/60 leading-snug mt-0.5 line-clamp-2">{captionBody}</p>
            </div>
            <button
              onClick={toggleMute}
              className="shrink-0 text-white/40 hover:text-white/70 transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <BsVolumeMuteFill size={14} /> : <BsVolumeUpFill size={14} />}
            </button>
          </motion.div>
        )}

        {/* Progress */}
        {running && (
          <div className="fixed top-12 left-4 z-[9980] text-[11px] text-white/50 bg-black/35 px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
            {step + 1} / {totalSteps}
          </div>
        )}

        {/* Skip */}
        {running && (
          <button
            onClick={skipTour}
            className="fixed top-12 right-4 z-[9980] text-[11px] text-white/55 hover:text-white bg-black/35 hover:bg-black/55 px-3 py-1 rounded-full backdrop-blur-sm transition-all"
          >
            Skip tour ✕
          </button>
        )}

        {/* Final CTA */}
        {showFinal && <FinalCTAOverlay />}
      </>
    </AnimatePresence>
  );
}
