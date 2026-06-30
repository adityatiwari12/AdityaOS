import type { AppWindowProps } from '../../os/types';
import MacTerminal from '../../components/global/MacTerminal';

export default function IntroApp({ onClose }: AppWindowProps) {
  return <MacTerminal isOpen introMode onClose={onClose} />;
}
