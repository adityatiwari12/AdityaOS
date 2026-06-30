import type { AppWindowProps } from '../../os/types';
import GitHubContributions from '../../components/global/GitHubContributions';

export default function ContributionsApp({ onClose }: AppWindowProps) {
  return <GitHubContributions isOpen onClose={onClose} />;
}
