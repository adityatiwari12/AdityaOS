import { useEffect, useState } from 'react';
import { userConfig } from '../../config/index';
import DraggableWindow from './DraggableWindow';
import { defaultWindowLayout } from '../../lib/windowLayout';

interface ProjectVideosProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectVideos({ isOpen, onClose }: ProjectVideosProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const videos = userConfig.videos || [];

  return (
    <DraggableWindow
      title="Project Videos"
      onClose={onClose}
      initialPosition={defaultWindowLayout('videos').position}
      initialSize={defaultWindowLayout('videos').size}
      className="bg-[#1d1d1f]"
    >
      <div className="h-full overflow-y-auto no-scrollbar p-4 space-y-6">
        <h2 className="text-xl font-bold text-gray-100">Project Demos</h2>
        {videos.map((video, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-base font-semibold text-gray-200">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-gray-400">{video.description}</p>
            )}
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                title={video.title}
                loading="lazy"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        ))}
      </div>
    </DraggableWindow>
  );
}
