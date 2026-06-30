interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onZoom?: () => void;
  onTileLeft?: () => void;
  onTileRight?: () => void;
  zoomed?: boolean;
}

/** macOS-style traffic lights — ×, −, and zoom glyphs always visible on the dots. */
export default function TrafficLights({ onClose, onMinimize, onZoom, onTileLeft, onTileRight, zoomed }: TrafficLightsProps) {
  const dot = 'relative w-[18px] h-[18px] rounded-full ring-[0.5px] ring-black/20 active:brightness-90 shrink-0';
  const glyph = 'pointer-events-none absolute inset-0 m-auto opacity-100';
  const stroke = 'rgba(0,0,0,0.55)';
  const hasTiling = !!(onTileLeft || onTileRight);

  return (
    <div className="flex items-center gap-[10px]">
      <button
        onClick={onClose}
        aria-label="Close"
        className={`${dot} bg-[var(--tl-close)]`}
      >
        <svg viewBox="0 0 12 12" width="14" height="14" className={glyph}>
          <path d="M3.6 3.6l4.8 4.8M8.4 3.6l-4.8 4.8" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <button
        onClick={onMinimize}
        aria-label="Minimize"
        className={`${dot} bg-[var(--tl-min)]`}
      >
        <svg viewBox="0 0 12 12" width="14" height="14" className={glyph}>
          <path d="M3.2 6h5.6" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative group/zoom">
        <button
          onClick={onZoom}
          aria-label={zoomed ? 'Restore' : 'Zoom'}
          className={`${dot} bg-[var(--tl-zoom)] block`}
        >
          <svg viewBox="0 0 12 12" width="14" height="14" className={glyph}>
            <path d="M4.2 4.2h3.6v3.6z" fill={stroke} transform="rotate(180 6 6)" />
            <path d="M4.2 4.2h3.6v3.6z" fill={stroke} />
          </svg>
        </button>

        {hasTiling && (
          <div
            className="absolute left-0 top-[18px] pt-2 z-[300] hidden group-hover/zoom:block"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="w-44 rounded-xl glass-strong shadow-window p-1.5 text-[13px] text-white/90">
              <button
                onClick={onZoom}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--accent)] hover:text-white text-left"
              >
                <span className="w-4 h-3 rounded-[2px] border border-current inline-block" />
                {zoomed ? 'Restore' : 'Fill Screen'}
              </button>
              <button
                onClick={onTileLeft}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--accent)] hover:text-white text-left"
              >
                <span className="w-4 h-3 rounded-[2px] border border-current inline-flex">
                  <span className="w-1/2 h-full bg-current rounded-l-[1px]" />
                </span>
                Tile Left
              </button>
              <button
                onClick={onTileRight}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--accent)] hover:text-white text-left"
              >
                <span className="w-4 h-3 rounded-[2px] border border-current inline-flex justify-end">
                  <span className="w-1/2 h-full bg-current rounded-r-[1px]" />
                </span>
                Tile Right
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
