import { useState, useRef, useEffect } from 'react';
import { nextZIndex } from '../../lib/zIndex';
import TrafficLights from '../os/TrafficLights';

// Minimum window dimensions
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

interface DraggableWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  className?: string;
}

export default function DraggableWindow({
  title,
  onClose,
  children,
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 400, height: 300 },
  className = '',
}: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'bottom' | 'right' | 'bottom-right' | 'left' | 'bottom-left' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(() => nextZIndex());
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const prevGeom = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const toggleMinimize = () => setIsMinimized((m) => !m);

  const TOP_INSET = 36; // clears the fixed menu bar
  const BOTTOM_INSET = 96; // leaves room for the dock

  const toggleZoom = () => {
    if (isMobile) return;
    if (isZoomed && prevGeom.current) {
      setPosition(prevGeom.current.position);
      setSize(prevGeom.current.size);
      setIsZoomed(false);
    } else {
      prevGeom.current = { position, size };
      // Start just below the menu bar so the traffic lights stay visible, but
      // fill the rest of the screen (full width, all the way to the bottom).
      setPosition({ x: 0, y: TOP_INSET });
      setSize({ width: window.innerWidth, height: window.innerHeight - TOP_INSET });
      setIsZoomed(true);
    }
    bringToFront();
  };

  const tile = (side: 'left' | 'right') => {
    if (isMobile) return;
    if (!isZoomed) prevGeom.current = { position, size };
    const halfW = Math.floor(window.innerWidth / 2);
    const h = window.innerHeight - TOP_INSET - BOTTOM_INSET;
    setPosition({ x: side === 'left' ? 0 : halfW, y: TOP_INSET });
    setSize({ width: halfW, height: h });
    setIsZoomed(true);
    bringToFront();
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Focus the window when it mounts for better keyboard accessibility
  useEffect(() => {
    windowRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const bringToFront = () => {
    setZIndex(nextZIndex());
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    
    if (e.target instanceof HTMLElement) {
      bringToFront();

      if (e.target.closest('.window-header')) {
        setIsDragging(true);
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
        e.preventDefault();
      } else if (e.target.closest('.resize-handle')) {
        setIsResizing(true);
        setResizeDirection(e.target.getAttribute('data-direction') as 'bottom' | 'right' | 'bottom-right' | 'left' | 'bottom-left');
        e.preventDefault();
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isMobile) return;
    
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const windowWidth = windowRef.current?.offsetWidth || 0;
      const windowHeight = windowRef.current?.offsetHeight || 0;
      
      const maxX = window.innerWidth - (windowWidth / 2);
      const maxY = window.innerHeight - (windowHeight / 2);
      const minX = -windowWidth / 2;
      const minY = 24;
      
      setPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
      });
    } else if (isResizing) {
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        const newSize = { ...size };
        const newPosition = { ...position };
        
        if (resizeDirection?.includes('right')) {
          newSize.width = Math.max(MIN_WIDTH, e.clientX - rect.left);
        }
        
        if (resizeDirection?.includes('left')) {
          const newWidth = Math.max(MIN_WIDTH, rect.right - e.clientX);
          newSize.width = newWidth;
          newPosition.x = rect.right - newWidth;
        }
        
        if (resizeDirection?.includes('bottom')) {
          newSize.height = Math.max(MIN_HEIGHT, e.clientY - rect.top);
        }
        
        if (resizeDirection?.includes('bottom-left')) {
          const newWidth = Math.max(MIN_WIDTH, rect.right - e.clientX);
          newSize.width = newWidth;
          newPosition.x = rect.right - newWidth;
          newSize.height = Math.max(MIN_HEIGHT, e.clientY - rect.top);
        }
        
        setSize(newSize);
        setPosition(newPosition);
      }
    }
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  useEffect(() => {
    bringToFront();
    if (isMobile) return;
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, resizeDirection, dragOffset, isMobile]);

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="window-title"
      tabIndex={0}
      className={`${
        isMobile 
          ? (isMinimized ? 'fixed top-14 left-2 right-2 rounded-[16px]' : 'fixed left-2 right-2 top-14 rounded-[16px] ring-[0.5px] ring-white/15')
          : 'absolute rounded-[11px] ring-[0.5px] ring-black/30'
      } bg-[var(--window-bg)] shadow-window overflow-hidden p-0 transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-default'
      } ${className}`}
      style={{
        ...(isMobile
          ? (isMinimized
              ? { height: '44px' }
              : { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' })
          : {
              left: position.x,
              top: position.y,
              width: size.width,
              height: isMinimized ? '38px' : size.height,
            }),
        zIndex,
        transition: (isDragging || isResizing) ? 'none' : 'all 0.2s ease-out',
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    >
      <div
        className="window-header apple-titlebar h-[38px] flex items-center gap-2 px-3.5 rounded-t-[11px] sticky top-0 left-0 right-0 z-10"
        onDoubleClick={toggleZoom}
      >
        <TrafficLights
          onClose={onClose}
          onMinimize={toggleMinimize}
          onZoom={toggleZoom}
          onTileLeft={isMobile ? undefined : () => tile('left')}
          onTileRight={isMobile ? undefined : () => tile('right')}
          zoomed={isZoomed}
        />
        <span id="window-title" className="text-[13px] text-white/85 flex-grow text-center font-medium truncate">
          {title}
        </span>
        <span className="w-[63px]" aria-hidden="true" />
      </div>
      <div className={`relative h-[calc(100%-38px)] ${isMinimized ? 'hidden' : ''}`}>
        {children}
        {!isMobile && !isMinimized && (
          <>
            <div 
              className="resize-handle absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
              data-direction="bottom"
            />
            <div 
              className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
              data-direction="right"
            />
            <div 
              className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
              data-direction="left"
            />
            <div 
              className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
              data-direction="bottom-right"
            />
            <div 
              className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize"
              data-direction="bottom-left"
            />
          </>
        )}
      </div>
    </div>
  );
} 