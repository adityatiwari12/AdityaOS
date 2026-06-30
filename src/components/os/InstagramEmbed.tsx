interface InstagramEmbedProps {
  url: string;
  title?: string;
}

export default function InstagramEmbed({ url, title = 'Instagram embed' }: InstagramEmbedProps) {
  const embedSrc = `${url.replace(/\/?$/, '/')}embed`;

  return (
    <div>
      <div className="mx-auto w-full max-w-[400px] rounded-xl overflow-hidden bg-black/40 border border-white/10">
        <iframe
          src={embedSrc}
          title={title}
          loading="lazy"
          className="w-full"
          style={{ height: 560, border: 'none' }}
          scrolling="no"
          allow="encrypted-media; clipboard-write"
          allowFullScreen
        />
      </div>
      <div className="text-center mt-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-pink-300 hover:text-pink-200 underline underline-offset-2"
        >
          View on Instagram →
        </a>
      </div>
    </div>
  );
}
