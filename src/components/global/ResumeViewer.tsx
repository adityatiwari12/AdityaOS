import { lazy, Suspense, useEffect } from 'react';
import { userConfig } from '../../config/index';
import { trackResumeDownload } from '../../lib/analytics';
import DraggableWindow from './DraggableWindow';

const PdfViewer = lazy(() => import('./PdfViewer'));

interface ResumeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeViewer({ isOpen, onClose }: ResumeViewerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const { localPath, downloadName } = userConfig.resume;

  return (
    <DraggableWindow
      title="Resume.pdf"
      onClose={onClose}
      initialPosition={{
        x: Math.floor(window.innerWidth * 0.4),
        y: Math.floor(window.innerHeight * 0.2),
      }}
      className="w-[90%] h-[90%] max-w-5xl"
      initialSize={{ width: 800, height: 600 }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Loading viewer…
          </div>
        }
      >
        <PdfViewer
          src={localPath}
          title="Resume"
          downloadName={downloadName}
          theme="light"
          onDownload={trackResumeDownload}
        />
      </Suspense>
    </DraggableWindow>
  );
}
