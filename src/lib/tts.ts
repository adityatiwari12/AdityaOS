let currentAudio: HTMLAudioElement | null = null;

export function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

function browserTTSFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92; utter.pitch = 0.9; utter.volume = 1;
    const preferred = ['Google UK English Male', 'Microsoft David', 'Daniel', 'Google US English'];
    for (const name of preferred) {
      const v = voices.find((v) => v.name.includes(name));
      if (v) { utter.voice = v; break; }
    }
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

/** Speak text and return a Promise that resolves when audio finishes. */
export async function speakAndWait(text: string, cancel?: { cancelled: boolean }): Promise<void> {
  if (cancel?.cancelled) return;
  stopAudio();
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('tts-error');
    const data = await res.json() as { audio?: string };
    if (!data.audio) throw new Error('no-audio');
    const binary = atob(data.audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      let pollId: ReturnType<typeof setInterval> | null = null;
      const done = () => {
        if (pollId) clearInterval(pollId);
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };
      const el = new Audio(url);
      el.onended = done;
      el.onerror = done;
      currentAudio = el;
      el.play().catch(done);
      if (cancel) {
        pollId = setInterval(() => { if (cancel.cancelled) { stopAudio(); done(); } }, 100);
      }
    });
  } catch {
    if (!cancel?.cancelled) await browserTTSFallback(text);
  }
}
