import MediaGallery from '../os/MediaGallery';
import { hackathonGallery } from '../../config/content/index';
import type { AppWindowProps } from '../../os/types';

export default function Photos({ payload }: AppWindowProps) {
  const initialIndex = typeof payload?.photoIndex === 'number' ? payload.photoIndex : undefined;
  return (
    <div className="h-full overflow-y-auto text-gray-200 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-bold">Photos</h1>
        <span className="text-xs text-gray-500">{hackathonGallery.length} items</span>
      </div>
      <MediaGallery items={hackathonGallery} initialIndex={initialIndex} />
    </div>
  );
}
