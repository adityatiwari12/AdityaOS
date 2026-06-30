import type { AppWindowProps } from '../../os/types';
import NotesApp from '../../components/global/NotesApp';
import type { Section } from '../../components/global/NotesApp';

export default function NotesAppWrapper({ onClose, payload }: AppWindowProps) {
  return (
    <NotesApp
      isOpen
      onClose={onClose}
      section={payload?.section as Section | undefined}
    />
  );
}
