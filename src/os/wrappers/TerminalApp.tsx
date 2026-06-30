import type { AppWindowProps } from '../../os/types';
import MacTerminal from '../../components/global/MacTerminal';

export default function TerminalApp({ onClose }: AppWindowProps) {
  return <MacTerminal isOpen onClose={onClose} />;
}
