import { useState } from 'react';
import { userConfig } from '../../config/index';
import { useOSStore } from '../../stores/osStore';
import type { AppWindowProps } from '../../os/types';
import { BsFolder2, BsFileEarmark, BsFileEarmarkText, BsGrid3X3Gap, BsListUl, BsColumnsGap, BsArrowLeft } from 'react-icons/bs';
import MediaGallery from '../os/MediaGallery';
import InstagramEmbed from '../os/InstagramEmbed';
import { hackathonGallery } from '../../config/content/index';
import { extraCurricularActivities } from '../../config/extracurricular';

type ViewMode = 'grid' | 'list' | 'column';

interface FinderItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  appId?: string;
  payload?: Record<string, unknown>;
  children?: FinderItem[];
  /** Render the media gallery (thumbnails + slideshow) when opened */
  gallery?: boolean;
  /** Render Instagram reel preview when opened */
  reel?: boolean;
  /** Render a plain-text document viewer when opened */
  text?: { title: string; body: string };
}

const podcastEpisodes = extraCurricularActivities.filter((a) => a.instagramUrl);

const ROOT: FinderItem[] = [
  {
    id: 'projects', name: 'Projects', type: 'folder', children: userConfig.projects.flatMap((p) => {
      const items: FinderItem[] = [
        { id: p.id, name: p.title, type: 'file' as const, appId: 'github', payload: { projectId: p.id } },
      ];
      if (p.longDescription) {
        const shortName = p.title.split(/[—–-]/)[0].trim().replace(/\s+/g, '');
        items.push({
          id: `${p.id}-readme`,
          name: `${shortName}.txt`,
          type: 'file' as const,
          text: { title: p.title, body: p.longDescription },
        });
      }
      return items;
    }),
  },
  { id: 'research', name: 'Research Papers', type: 'folder', appId: 'research-center' },
  { id: 'awards', name: 'Awards', type: 'folder', appId: 'notes', payload: { section: 'competitions' } },
  { id: 'publications', name: 'Publications', type: 'folder', appId: 'research-center' },
  { id: 'resume', name: 'Resume', type: 'file', appId: 'resume' },
  { id: 'architecture', name: 'Architecture', type: 'folder', appId: 'architecture-viewer', payload: { projectId: 'talkwithdb' } },
  { id: 'podcasts', name: 'Podcasts', type: 'folder', reel: true },
  { id: 'certificates', name: 'Certificates', type: 'folder', appId: 'notes', payload: { section: 'certifications' } },
  { id: 'media-kit', name: 'Media Kit', type: 'folder', gallery: true },
  { id: 'notes', name: 'Notes', type: 'folder', appId: 'notes' },
  { id: 'downloads', name: 'Downloads', type: 'folder', children: [
    { id: 'resume-pdf', name: 'resume.pdf', type: 'file', appId: 'resume' },
  ]},
];

export default function Finder({ payload }: AppWindowProps) {
  const openWindow = useOSStore((s) => s.openWindow);
  const [path, setPath] = useState<FinderItem[]>([]);
  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<FinderItem | null>(null);
  const [quickLook, setQuickLook] = useState<FinderItem | null>(null);
  const [textDoc, setTextDoc] = useState<{ title: string; body: string; name: string } | null>(null);

  const current = path.length ? path[path.length - 1].children ?? [] : ROOT;
  const filtered = current.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const inGallery = path.length > 0 && path[path.length - 1].gallery;
  const inReel = path.length > 0 && path[path.length - 1].reel;

  const openItem = (item: FinderItem) => {
    if (item.text) {
      setTextDoc({ title: item.text.title, body: item.text.body, name: item.name });
      return;
    }
    if (item.type === 'folder') {
      if (item.gallery || item.reel || item.children) {
        setPath([...path, item]);
      } else if (item.appId) {
        openWindow(item.appId as never, item.name, item.payload);
      }
    } else if (item.appId) {
      openWindow(item.appId as never, item.name, item.payload);
    }
  };

  return (
    <div className="h-full flex flex-col text-gray-200 text-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20">
        <button onClick={() => setPath([])} className="hover:text-white">AdityaOS</button>
        {path.map((p, i) => (
          <span key={p.id}>
            <span className="text-gray-500 mx-1">/</span>
            <button onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-white">{p.name}</button>
          </span>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="ml-auto bg-white/5 rounded px-2 py-1 text-xs w-24 sm:w-40 outline-none"
        />
        <div className="flex gap-1">
          {(['grid', 'list', 'column'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`p-1 rounded ${view === v ? 'bg-white/10' : ''}`}>
              {v === 'grid' ? <BsGrid3X3Gap /> : v === 'list' ? <BsListUl /> : <BsColumnsGap />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {view === 'column' && (
          <div className="w-48 border-r border-white/10 overflow-y-auto p-2">
            {ROOT.map((item) => (
              <button key={item.id} onClick={() => { setPath([item]); setPreview(item); }} className="block w-full text-left px-2 py-1 rounded hover:bg-white/5 truncate">
                {item.name}
              </button>
            ))}
          </div>
        )}
        {textDoc ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/20">
              <button onClick={() => setTextDoc(null)} className="flex items-center gap-1 text-xs text-gray-300 hover:text-white">
                <BsArrowLeft /> Back
              </button>
              <span className="ml-2 flex items-center gap-2 text-xs text-gray-400">
                <BsFileEarmarkText className="text-blue-300" /> {textDoc.name}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">{textDoc.title}</h2>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300 max-w-3xl">{textDoc.body}</pre>
            </div>
          </div>
        ) : inGallery ? (
          <div className="flex-1 overflow-y-auto p-4">
            <MediaGallery items={hackathonGallery} />
          </div>
        ) : inReel ? (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-semibold mb-1">Podcasts</h2>
            <p className="text-xs text-gray-500 mb-6">Cybersecurity awareness & public outreach — hosted on Instagram.</p>
            <div className="space-y-8">
              {podcastEpisodes.map((episode) => (
                <section key={episode.title} className="max-w-xl">
                  <h3 className="font-medium text-gray-100 mb-1">{episode.title}</h3>
                  <p className="text-xs text-gray-400 mb-1">{episode.institution} · {episode.year}</p>
                  <p className="text-sm text-gray-300 mb-4">{episode.description}</p>
                  {episode.instagramUrl && (
                    <InstagramEmbed url={episode.instagramUrl} title={episode.title} />
                  )}
                </section>
              ))}
            </div>
          </div>
        ) : (
        <div className={`flex-1 overflow-y-auto no-scrollbar p-4 ${view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : ''}`}>
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              onMouseEnter={() => setPreview(item)}
              onDoubleClick={() => setQuickLook(item)}
              className={`flex ${view === 'list' ? 'flex-row items-center gap-3 w-full p-2 hover:bg-white/5 rounded' : 'flex-col items-center gap-2 p-3 hover:bg-white/5 rounded-lg'}`}
            >
              {item.type === 'folder' ? <BsFolder2 size={view === 'grid' ? 48 : 24} className="text-blue-400" /> : item.text ? <BsFileEarmarkText size={view === 'grid' ? 48 : 24} className="text-blue-300" /> : <BsFileEarmark size={view === 'grid' ? 48 : 24} className="text-gray-400" />}
              <span className="text-xs text-center truncate max-w-full">{item.name}</span>
            </button>
          ))}
        </div>
        )}
        {preview && !inGallery && !inReel && !textDoc && (
          <div className="w-56 border-l border-white/10 p-4 hidden lg:block">
            <h3 className="font-semibold mb-2">{preview.name}</h3>
            <p className="text-xs text-gray-400">{preview.type === 'folder' ? 'Folder' : 'File'}</p>
            <button onClick={() => openItem(preview)} className="mt-4 text-xs bg-blue-600 px-3 py-1 rounded">Open</button>
          </div>
        )}
      </div>
      {quickLook && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center" onClick={() => setQuickLook(null)}>
          <div className="bg-gray-900 rounded-xl p-8 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">{quickLook.name}</h2>
            <p className="text-gray-400 text-sm mb-4">Quick Look preview</p>
            <button onClick={() => { openItem(quickLook); setQuickLook(null); }} className="bg-blue-600 px-4 py-2 rounded">Open</button>
          </div>
        </div>
      )}
    </div>
  );
}
