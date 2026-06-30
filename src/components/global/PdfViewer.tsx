import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BsChevronLeft,
  BsChevronRight,
  BsDownload,
  BsZoomIn,
  BsZoomOut,
  BsBoxArrowUpRight,
} from 'react-icons/bs';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2] as const;

type PdfJsModule = typeof import('pdfjs-dist');

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PDF.js requires a browser'));
  }
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, workerModule]) => {
      pdfjs.GlobalWorkerOptions.workerSrc =
        (workerModule as { default: string }).default;
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

export interface PdfViewerProps {
  src: string;
  title: string;
  downloadName?: string;
  theme?: 'light' | 'dark';
  className?: string;
  onDownload?: () => void;
}

export default function PdfViewer({
  src,
  title,
  downloadName,
  theme = 'light',
  className = '',
  onDownload,
}: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderToken = useRef(0);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const isDark = theme === 'dark';
  const zoom = ZOOM_STEPS[zoomIndex];
  const fileName = downloadName ?? title;

  const renderPages = useCallback(async (pdf: PDFDocumentProxy, width: number, zoomLevel: number) => {
    if (!width || typeof window === 'undefined') return;
    const token = ++renderToken.current;
    const contentWidth = Math.max(width - 32, 200);

    for (let i = 1; i <= pdf.numPages; i++) {
      if (token !== renderToken.current) return;

      const canvas = canvasRefs.current[i - 1];
      if (!canvas) continue;

      const page = await pdf.getPage(i);
      if (token !== renderToken.current) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const fitScale = contentWidth / baseViewport.width;
      const scale = fitScale * zoomLevel;
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');
      if (!context) continue;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      await page.render({ canvas, canvasContext: context, viewport }).promise;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let destroyTask: (() => void) | undefined;

    setLoading(true);
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    pdfRef.current = null;
    renderToken.current++;

    loadPdfJs()
      .then((pdfjs) => {
        if (cancelled) return;
        const pdfUrl = src.startsWith('http') ? src : new URL(src, window.location.origin).href;
        const task = pdfjs.getDocument({ url: pdfUrl });
        destroyTask = () => task.destroy();
        return task.promise;
      })
      .then((pdf) => {
        if (cancelled || !pdf) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        pageRefs.current = Array.from({ length: pdf.numPages }, () => null);
        canvasRefs.current = Array.from({ length: pdf.numPages }, () => null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('[PdfViewer] Failed to load PDF:', err);
        setError('Could not load this PDF.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      destroyTask?.();
    };
  }, [src]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof window === 'undefined') return;

    const measure = () => setContainerWidth(el.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, numPages]);

  useLayoutEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loading || numPages === 0 || typeof window === 'undefined') return;

    let cancelled = false;
    let frame = 0;

    const attemptRender = () => {
      if (cancelled) return;
      const width = scrollRef.current?.clientWidth ?? containerWidth;
      const hasCanvas = canvasRefs.current.some(Boolean);
      if (!width || !hasCanvas) {
        frame = requestAnimationFrame(attemptRender);
        return;
      }
      if (width !== containerWidth) setContainerWidth(width);
      void renderPages(pdf, width, zoom);
    };

    frame = requestAnimationFrame(attemptRender);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [containerWidth, zoom, loading, numPages, renderPages]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || numPages === 0 || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const index = pageRefs.current.findIndex((ref) => ref === top.target);
        if (index >= 0) setCurrentPage(index + 1);
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [numPages, loading]);

  const scrollToPage = (page: number) => {
    const target = pageRefs.current[page - 1];
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(page);
  };

  const toolbarBtn = isDark
    ? 'p-1.5 rounded-md text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors'
    : 'p-1.5 rounded-md text-gray-600 hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none transition-colors';

  const actionBtn = isDark
    ? 'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 transition-colors'
    : 'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-900/5 hover:bg-gray-900/10 text-gray-700 transition-colors';

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      <div
        className={`shrink-0 flex items-center gap-2 px-3 py-2 border-b ${
          isDark ? 'bg-[#1c1c1e]/90 border-white/10' : 'bg-[#f5f5f7] border-black/10'
        }`}
      >
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            aria-label="Previous page"
          >
            <BsChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages || loading || numPages === 0}
            aria-label="Next page"
          >
            <BsChevronRight size={16} />
          </button>
        </div>

        <span className={`text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {loading ? 'Loading…' : numPages > 0 ? `Page ${currentPage} of ${numPages}` : '—'}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={zoomIndex <= 0 || loading}
            aria-label="Zoom out"
          >
            <BsZoomOut size={15} />
          </button>
          <span className={`text-xs w-10 text-center tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIndex >= ZOOM_STEPS.length - 1 || loading}
            aria-label="Zoom in"
          >
            <BsZoomIn size={15} />
          </button>
        </div>

        <div className={`w-px h-5 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        <a
          href={src}
          download={fileName}
          className={actionBtn}
          onClick={onDownload}
        >
          <BsDownload size={13} />
          Download
        </a>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className={actionBtn}
        >
          <BsBoxArrowUpRight size={13} />
          Open
        </a>
      </div>

      <div
        ref={scrollRef}
        className={`flex-1 min-h-0 overflow-y-auto no-scrollbar ${
          isDark ? 'bg-[#0d0d0f]' : 'bg-[#e8e8ed]'
        }`}
      >
        {loading && (
          <div className={`flex items-center justify-center h-full text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Loading {title}…
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className={isDark ? 'text-orange-400 hover:text-orange-300 text-sm' : 'text-blue-600 hover:underline text-sm'}
            >
              Open {title} in a new tab
            </a>
          </div>
        )}

        {!loading && !error && numPages > 0 && (
          <div className="flex flex-col items-center gap-4 py-4 px-4">
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => { pageRefs.current[i] = el; }}
                className={`rounded-lg overflow-hidden shadow-lg ring-1 ${
                  isDark ? 'ring-white/10 shadow-black/40' : 'ring-black/10 shadow-black/20'
                }`}
              >
                <canvas ref={(el) => { canvasRefs.current[i] = el; }} className="block max-w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
