import type { AppWindowProps } from '../../os/types';
import ProjectVideos from '../../components/global/ProjectVideos';

export default function VideosApp({ onClose }: AppWindowProps) {
  return <ProjectVideos isOpen onClose={onClose} />;
}
