import type { AppWindowProps } from '../../os/types';
import SpotifyPlayer from '../../components/global/SpotifyPlayer';
import { userConfig } from '../../config/index';

export default function SpotifyApp({ onClose }: AppWindowProps) {
  return (
    <SpotifyPlayer
      isOpen
      onClose={onClose}
      playlistId={userConfig.spotify.playlistId}
    />
  );
}
