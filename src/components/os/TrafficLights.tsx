interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onZoom?: () => void;
  onTileLeft?: () => void;
  onTileRight?: () => void;
  zoomed?: boolean;
}

/**
 * Authentic macOS window traffic lights. Glyphs (×, −, zoom arrows) reveal only
 * when hovering the group. Hovering the green button reveals a window menu with
 * Fill Screen / Tile Left / Tile Right, matching modern macOS behavior.
 */
export default function TrafficLights({ onClose, onMinimize, onZoom, onTileLeft, onTileRight, zoomed }: TrafficLightsProps) {
  const glyph = 'pointer-events-none absolute inset-0 m-auto opacity-0 group-hover/tl:opacity-100 transition-opacity';
  const stroke = 'rgba(0,0,0,0.55)';
  const hasTiling = !!(onTileLeft || onTileRight);

  return (
    <div className="group/tl flex items-center gap-[9px]">
      <button
        onClick={onClose}
        aria-label="Close"
        className="relative w-[15px] h-[15px] rounded-full bg-[var(--tl-close)] ring-[0.5px] ring-black/20 active:brightness-90"
      >
        <svg viewBox="0 0 12 12" width="15" height="15" className={glyph}>
          <path d="M3.6 3.6l4.8 4.8M8.4 3.6l-4.8 4.8" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <button
        onClick={onMinimize}
        aria-label="Minimize"
        className="relative w-[15px] h-[15px] rounded-full bg-[var(--tl-min)] ring-[0.5px] ring-black/20 active:brightness-90"
      >
        <svg viewBox="0 0 12 12" width="15" height="15" className={glyph}>
          <path d="M3.2 6h5.6" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative group/zoom">
        <button
          onClick={onZoom}
          aria-label={zoomed ? 'Restore' : 'Zoom'}
          className="relative w-[15px] h-[15px] rounded-full bg-[var(--tl-zoom)] ring-[0.5px] ring-black/20 active:brightness-90 block"
        >
          <svg viewBox="0 0 12 12" width="15" height="15" className={glyph}>
            <path d="M4.2 4.2h3.6v3.6z" fill={stroke} transform="rotate(180 6 6)" />
            <path d="M4.2 4.2h3.6v3.6z" fill={stroke} />
          </svg>
        </button>

        {hasTiling && (
          <div
            className="absolute left-0 top-[15px] pt-2 z-[300] hidden group-hover/zoom:block"
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
