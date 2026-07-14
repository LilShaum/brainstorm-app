import { useEffect, useRef, useState, useCallback } from 'react';

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Focus the menu on mount and reset active index
  useEffect(() => {
    menuRef.current?.focus();
    setActiveIndex(0);
  }, []);

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[activeIndex]) {
            items[activeIndex].onClick();
            onClose();
          }
          break;
        case 'Tab':
          // Trap focus within the menu
          e.preventDefault();
          if (e.shiftKey) {
            setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          } else {
            setActiveIndex((prev) => (prev + 1) % items.length);
          }
          break;
      }
    },
    [items, activeIndex, onClose]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, handleKeyDown]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-soft-lg border border-gray-100 py-1 min-w-[160px] animate-scale-in"
      style={{ left: x, top: y }}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
    >
      {items.map((item, index) => (
        <button
          key={index}
          role="menuitem"
          aria-current={index === activeIndex ? 'true' : undefined}
          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors
            ${item.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-700 hover:bg-gray-50'
            }
            ${index === activeIndex ? 'bg-gray-100' : ''}
          `}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
