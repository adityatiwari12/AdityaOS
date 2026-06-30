import type { AppWindowProps } from '../../os/types';
import ResumeViewer from '../../components/global/ResumeViewer';

export default function ResumeApp({ onClose }: AppWindowProps) {
  return <ResumeViewer isOpen onClose={onClose} />;
}
