import { useEffect, useRef, useState, useCallback } from 'react';
import { BsCameraFill, BsArrowCounterclockwise, BsDownload, BsX } from 'react-icons/bs';

const WATERMARK_NAME = 'AdityaOS';
const WATERMARK_LINK = 'adityatiwari.work';

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, logo: HTMLImageElement | null) {
  const logoSize = Math.max(22, width * 0.045);
  const pad = logoSize * 0.5;
  ctx.font = `600 ${logoSize * 0.62}px -apple-system, system-ui, sans-serif`;
  const nameWidth = ctx.measureText(WATERMARK_NAME).width;
  ctx.font = `${logoSize * 0.46}px -apple-system, system-ui, sans-serif`;
  const linkWidth = ctx.measureText(WATERMARK_LINK).width;
  const textWidth = Math.max(nameWidth, linkWidth);

  const boxW = logoSize + pad * 2.5 + textWidth;
  const boxH = logoSize + pad * 1.2;
  const x = width - boxW - pad * 1.5;
  const y = height - boxH - pad * 1.5;
  const radius = boxH / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + boxW, y, x + boxW, y + boxH, radius);
  ctx.arcTo(x + boxW, y + boxH, x, y + boxH, radius);
  ctx.arcTo(x, y + boxH, x, y, radius);
  ctx.arcTo(x, y, x + boxW, y, radius);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  const logoX = x + pad * 0.6;
  const logoY = y + (boxH - logoSize) / 2;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    const lr = logoSize * 0.28;
    ctx.moveTo(logoX + lr, logoY);
    ctx.arcTo(logoX + logoSize, logoY, logoX + logoSize, logoY + logoSize, lr);
    ctx.arcTo(logoX + logoSize, logoY + logoSize, logoX, logoY + logoSize, lr);
    ctx.arcTo(logoX, logoY + logoSize, logoX, logoY, lr);
    ctx.arcTo(logoX, logoY, logoX + logoSize, logoY, lr);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }

  const textX = logoX + logoSize + pad * 0.8;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${logoSize * 0.62}px -apple-system, system-ui, sans-serif`;
  ctx.fillText(WATERMARK_NAME, textX, y + boxH * 0.38);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `${logoSize * 0.46}px -apple-system, system-ui, sans-serif`;
  ctx.fillText(WATERMARK_LINK, textX, y + boxH * 0.72);
  ctx.restore();
}

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://github.com/adityatiwari12.png';
    img.onload = () => { logoRef.current = img; };
  }, []);

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
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    const container = containerRef.current;
    if (!video || !canvas || !container) return;

    // Crop to match the on-screen object-cover framing, not the raw sensor frame.
    const targetAspect = container.clientWidth / container.clientHeight;
    const videoAspect = video.videoWidth / video.videoHeight;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (videoAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    drawWatermark(ctx, canvas.width, canvas.height, logoRef.current);
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
    <div ref={containerRef} className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
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
        <img src={photo} alt="Captured" className="h-full w-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
        />
      )}

      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white pointer-events-none" />}

      {/* Brand watermark badge */}
      {!error && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur-sm pointer-events-none select-none">
          <img src="https://github.com/adityatiwari12.png" alt="" className="w-6 h-6 rounded-lg object-cover" />
          <div className="leading-tight">
            <p className="text-white text-[11px] font-semibold">AdityaOS</p>
            <p className="text-white/70 text-[9px]">adityatiwari.work</p>
          </div>
        </div>
      )}

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
