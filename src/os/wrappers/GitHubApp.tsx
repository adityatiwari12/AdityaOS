import type { AppWindowProps } from '../../os/types';
import GitHubViewer from '../../components/global/GitHubViewer';

export default function GitHubApp({ onClose, payload }: AppWindowProps) {
  return (
    <GitHubViewer
      isOpen
      onClose={onClose}
      selectedProjectId={payload?.projectId as string | undefined}
    />
  );
}
