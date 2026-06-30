import { useEffect, useRef, useState, useCallback } from 'react';
import { BsCameraFill, BsArrowCounterclockwise, BsDownload, BsX } from 'react-icons/bs';

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setReady(false);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch {
      setError('Camera access denied or unavailable. Allow camera permission and try again.');
    }
  }, [facing, stopStream]);

  useEffect(() => {
    if (!photo) startStream();
    return () => stopStream();
  }, [facing, photo, startStream, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/png'));
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    stopStream();
  };

  const retake = () => {
    setPhoto(null);
  };

  const download = () => {
    if (!photo) return;
    const a = document.createElement('a');
    a.href = photo;
    a.download = `photo-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {error ? (
        <div className="text-center text-gray-300 px-6">
          <p className="mb-3">{error}</p>
          <button
            onClick={startStream}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
          >
            Retry
          </button>
        </div>
      ) : photo ? (
        <img src={photo} alt="Captured" className="max-h-full max-w-full object-contain" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-h-full max-w-full object-contain"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
        />
      )}

      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white pointer-events-none" />}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 pb-8 pt-6"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}
      >
        {photo ? (
          <>
            <button
              onClick={retake}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Retake"
            >
              <BsArrowCounterclockwise size={20} />
            </button>
            <button
              onClick={download}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-lg active:scale-95 transition-transform"
              aria-label="Save photo"
            >
              <BsDownload size={22} />
            </button>
            <div className="w-12 h-12" />
          </>
        ) : (
          <>
            <button
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Switch camera"
            >
              <BsArrowCounterclockwise size={20} />
            </button>
            <button
              onClick={capture}
              disabled={!ready}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-30"
              aria-label="Take photo"
            >
              <BsCameraFill size={22} className="text-black" />
            </button>
            <div className="w-12 h-12 flex items-center justify-center text-white/30">
              <BsX size={20} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
