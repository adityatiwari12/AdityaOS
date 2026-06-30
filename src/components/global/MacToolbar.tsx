import { useState, useEffect, useRef } from 'react';
import { MdWifi } from 'react-icons/md';
import { FaApple, FaGithub, FaLinkedin, FaEnvelope, FaWindowRestore } from 'react-icons/fa';
import {
  IoSearchSharp,
  IoBatteryHalfOutline,
  IoCellular,
  IoDocumentText,
  IoCodeSlash,
  IoMail,
  IoCall,
  IoHelpCircle,
} from 'react-icons/io5';
import { VscVscode } from 'react-icons/vsc';
import { userConfig } from '../../config/index';
import { useOSStore } from '../../stores/osStore';

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  submenu?: MenuItem[];
};

interface MacToolbarProps {
  onOpenSpotlight?: () => void;
  onOpenMissionControl?: () => void;
  onOpenContact?: () => void;
  onToggleShortcuts?: () => void;
  onCloseAllWindows?: () => void;
  onShuffleBackground?: () => void;
  extraRight?: React.ReactNode;
}

export default function MacToolbar({
  onOpenSpotlight,
  onOpenMissionControl,
  onOpenContact,
  onToggleShortcuts,
  onCloseAllWindows,
  onShuffleBackground,
  extraRight,
}: MacToolbarProps) {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const setCustomWallpaper = useOSStore((s) => s.setCustomWallpaper);
  const customWallpaper = useOSStore((s) => s.customWallpaper);

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCustomWallpaper(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const inDesktop = menuRef.current?.contains(event.target as Node);
      const inMobile = mobileMenuRef.current?.contains(event.target as Node);
      if (!inDesktop && !inMobile) setActiveMenu(null);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatIPhoneTime = (date: Date) => {
    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');

    hour = hour % 12;
    hour = hour ? hour : 12;

    return `${hour}:${minute}`;
  };

  const handleVSCodeClick = () => {
    window.location.href = 'vscode:/';
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
      setActiveMenu(null);
    }
  };

  // Menus collapse from least → most important as the screen narrows so the bar
  // never clips. File/Edit/View/Window survive longest; Go/Help drop first.
  const menuVisibility: Record<string, string> = {
    File: '',
    Edit: '',
    View: 'hidden sm:block',
    Window: 'hidden lg:block',
    Go: 'hidden xl:block',
    Help: 'hidden 2xl:block',
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      {
        label: 'Resume (PDF)',
        icon: <IoDocumentText size={16} />,
        action: () => window.open(userConfig.resume.url, '_blank'),
      },
      {
        label: 'Projects (GitHub)',
        icon: <IoCodeSlash size={16} />,
        action: () => window.open(userConfig.social.github, '_blank'),
      },
    ],
    Edit: [
      {
        label: 'Copy Email',
        icon: <IoMail size={16} />,
        action: () => {
          navigator.clipboard.writeText(userConfig.contact.email);
          alert('Email copied to clipboard!');
        },
      },
      {
        label: 'Copy Phone',
        icon: <IoCall size={16} />,
        action: () => {
          navigator.clipboard.writeText(userConfig.contact.phone);
          alert('Phone number copied to clipboard!');
        },
      },
    ],
    View: [
      {
        label: 'Spotlight Search…',
        icon: <IoSearchSharp size={16} />,
        action: () => onOpenSpotlight?.(),
      },
      {
        label: 'Mission Control',
        icon: <FaWindowRestore size={16} />,
        action: () => onOpenMissionControl?.(),
      },
      {
        label: 'Shortcuts Overlay',
        icon: <IoHelpCircle size={16} />,
        action: () => onToggleShortcuts?.(),
      },
    ],
    Window: [
      {
        label: 'Contact…',
        icon: <IoMail size={16} />,
        action: () => onOpenContact?.(),
      },
      {
        label: 'Close All Windows',
        icon: <IoDocumentText size={16} />,
        action: () => onCloseAllWindows?.(),
      },
      {
        label: 'Shuffle Background',
        icon: <IoDocumentText size={16} />,
        action: () => onShuffleBackground?.(),
      },
      {
        label: 'Set Wallpaper…',
        icon: <IoDocumentText size={16} />,
        action: () => wallpaperInputRef.current?.click(),
      },
      ...(customWallpaper
        ? [{
            label: 'Remove Custom Wallpaper',
            icon: <IoDocumentText size={16} />,
            action: () => setCustomWallpaper(null),
          }]
        : []),
    ],
    Go: [
      {
        label: 'GitHub',
        icon: <FaGithub size={16} />,
        action: () => window.open(userConfig.social.github, '_blank'),
      },
      {
        label: 'LinkedIn',
        icon: <FaLinkedin size={16} />,
        action: () => window.open(userConfig.social.linkedin, '_blank'),
      },
      {
        label: 'Email',
        icon: <FaEnvelope size={16} />,
        action: () => window.open(`mailto:${userConfig.contact.email}`),
      },
    ],
    Help: [
      {
        label: 'Keyboard Shortcuts',
        icon: <IoHelpCircle size={16} />,
        action: () => onToggleShortcuts?.(),
      },
    ],
  };

  const renderMenu = (menuItems: MenuItem[]) => (
    <div className="absolute top-full left-0 mt-1 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl py-1 min-w-[200px]" role="menu">
      {menuItems.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => handleAction(item.action)}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 flex items-center gap-2"
          >
            {item.icon}
            {item.label}
          </button>
          {item.submenu && (
            <div className="absolute left-full top-0 ml-1 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl py-1 min-w-[200px]" role="menu">
              {item.submenu.map((subItem, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => handleAction(subItem.action)}
                  role="menuitem"
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 flex items-center gap-2"
                >
                  {subItem.icon}
                  {subItem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <input
        ref={wallpaperInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleWallpaperUpload}
        aria-hidden="true"
      />
      {/* Single unified bar: time + menus + status icons */}
      <div className='w-full z-50 md:hidden bg-black/25 backdrop-blur-2xl backdrop-saturate-[180%] text-white h-14 px-3 flex items-center gap-2'>
        <span className='font-semibold tabular-nums text-base shrink-0'>
          {currentDateTime ? formatIPhoneTime(currentDateTime) : ''}
        </span>
        <div className='flex-1 flex items-center gap-3 text-[13px]' ref={mobileMenuRef}>
          {(['File', 'Edit', 'View', 'Window', 'Go'] as const).map((menu) => (
            <div key={menu} className='relative shrink-0'>
              <button
                onClick={() => handleMenuClick(menu)}
                className='text-white/75 py-1'
                aria-haspopup="menu"
                aria-expanded={activeMenu === menu}
              >
                {menu}
              </button>
              {activeMenu === menu && (
                <div className="absolute top-full left-0 mt-1 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl py-1.5 min-w-[190px] z-[300]" role="menu">
                  {menus[menu].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleAction(item.action)}
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-200 active:bg-white/10 flex items-center gap-2.5"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button onClick={() => onOpenSpotlight?.()} aria-label='Search' className='active:opacity-60'>
            <IoSearchSharp size={18} />
          </button>
          <IoCellular size={16} />
          <MdWifi size={17} />
          <IoBatteryHalfOutline size={20} />
        </div>
      </div>

      <div className='w-full z-50 hidden md:flex bg-black/25 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-white/[0.06] text-white h-7 px-3 items-center justify-between text-[13px] gap-2' role="menubar" aria-label="Application menu bar">
        <div className='flex items-center gap-2.5 min-w-0 flex-1 overflow-x-clip' ref={menuRef}>
          <FaApple size={16} className="shrink-0" />
          <div className="relative">
            <span 
              className='font-semibold hover:text-gray-300 transition-colors cursor-pointer'
              onMouseEnter={() => setShowSignature(true)}
              onMouseLeave={() => setShowSignature(false)}
            >
              {userConfig.name}
            </span>
            {showSignature && (
              <div className="absolute top-full left-0 mt-2 glass-strong rounded-2xl p-3 shadow-window z-[100] flex flex-col items-center gap-2 w-40">
                <img
                  src="/images/profile/aditya.png"
                  alt={userConfig.name}
                  className="w-28 h-28 rounded-full object-cover object-top ring-2 ring-white/20 bg-white/5"
                />
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-white leading-tight">{userConfig.name}</p>
                  <p className="text-[11px] text-gray-400">Founder • Engineer</p>
                </div>
              </div>
            )}
          </div>
          {Object.entries(menus).map(([menu, items]) => (
            <div key={menu} className={`relative shrink-0 ${menuVisibility[menu] ?? ''}`}>
              <button 
                className='cursor-pointer hover:text-gray-300 transition-colors'
                onClick={() => handleMenuClick(menu)}
                aria-haspopup="menu"
                aria-expanded={activeMenu === menu}
                aria-controls={`menu-${menu}`}
                role="menuitem"
              >
                {menu}
              </button>
              {activeMenu === menu && (
                <div id={`menu-${menu}`}>
                  {renderMenu(items)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className='flex items-center gap-2 shrink-0 max-w-[68vw] overflow-x-clip justify-end'>
          {extraRight}
          <VscVscode
            size={16}
            className='hidden xl:block cursor-pointer hover:opacity-80 transition-opacity'
            onClick={handleVSCodeClick}
            title='Open in VSCode'
          />
          <IoSearchSharp
            size={16}
            className='cursor-pointer hover:opacity-80 transition-opacity'
            onClick={() => onOpenSpotlight?.()}
            title='Search (Ctrl/Cmd+K)'
            role='button'
            aria-label='Open search'
          />
        </div>
      </div>
    </>
  );
}
