import MediaGallery from '../os/MediaGallery';
import { hackathonGallery } from '../../config/content/index';

export default function Photos() {
  return (
    <div className="h-full overflow-y-auto text-gray-200 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-bold">Photos</h1>
        <span className="text-xs text-gray-500">{hackathonGallery.length} items</span>
      </div>
      <MediaGallery items={hackathonGallery} />
    </div>
  );
}
