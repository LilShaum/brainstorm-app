import { useState, useRef, useCallback, useEffect } from 'react';
import { CloseIcon } from './Icon';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#1e293b',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  label?: string;
  showInput?: boolean;
}

export default function ColorPicker({
  value,
  onChange,
  presetColors = PRESET_COLORS,
  label,
  showInput = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handlePresetClick = useCallback(
    (color: string) => {
      onChange(color);
      setInputValue(color);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      // Only update if it's a valid hex
      if (/^#[0-9a-f]{6}$/i.test(val)) {
        onChange(val);
      }
    },
    [onChange]
  );

  const handleInputBlur = useCallback(() => {
    // Reset to current value if invalid
    if (!/^#[0-9a-f]{6}$/i.test(inputValue)) {
      setInputValue(value);
    }
  }, [inputValue, value]);

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 w-full rounded-soft border border-border dark:border-border-dark
          bg-white dark:bg-surface-dark hover:border-gray-300 dark:hover:border-gray-600
          transition-colors duration-200 text-sm text-gray-900 dark:text-gray-100"
      >
        <span
          className="w-5 h-5 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700"
          style={{ backgroundColor: value }}
        />
        {showInput && (
          <span className="font-mono text-xs">{value}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-surface-dark rounded-soft shadow-soft-lg border border-border dark:border-border-dark p-3 animate-scale-in w-full min-w-[200px]">
          {/* Close button */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Pick a color</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <CloseIcon size="xs" />
            </button>
          </div>

          {/* Preset grid */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Select color ${color}`}
                className={`w-7 h-7 rounded-full transition-all duration-150 hover:scale-110
                  ${value === color
                    ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 dark:ring-offset-surface-dark scale-110'
                    : ''
                  }`}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
              />
            ))}
          </div>

          {/* Native color picker + hex input */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nativeInputRef.current?.click()}
              className="relative w-8 h-8 rounded-lg overflow-hidden border border-border dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <input
                ref={nativeInputRef}
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setInputValue(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full" style={{ backgroundColor: value }} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="flex-1 px-2 py-1 text-xs font-mono rounded border border-border dark:border-border-dark
                bg-white dark:bg-surface-dark text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="#000000"
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  );
}
