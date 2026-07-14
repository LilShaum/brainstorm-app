import { useState, useEffect, useRef } from 'react';
import type { BrainstormNode } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ColorPicker from '@/components/ui/ColorPicker';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#1e293b',
];

interface EditNodeModalProps {
  isOpen: boolean;
  node: BrainstormNode | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<BrainstormNode>) => void;
}

export default function EditNodeModal({ isOpen, node, onClose, onUpdate }: EditNodeModalProps) {
  const [text, setText] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[5]);
  const [shape, setShape] = useState<BrainstormNode['shape']>('rounded');
  const [size, setSize] = useState<BrainstormNode['size']>('medium');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && node) {
      setText(node.text);
      setColor(node.color);
      setShape(node.shape);
      setSize(node.size);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, node]);

  if (!node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim() || node.text;
    onUpdate(node.id, { text: trimmedText, color, shape, size });
    onClose();
  };

  const SHAPE_OPTIONS: { value: BrainstormNode['shape']; label: string; icon: React.ReactNode }[] = [
    {
      value: 'circle',
      label: 'Circle',
      icon: (
        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center" />
      ),
    },
    {
      value: 'rounded',
      label: 'Rounded',
      icon: (
        <div className="w-8 h-8 rounded-xl border-2 border-current flex items-center justify-center" />
      ),
    },
    {
      value: 'square',
      label: 'Square',
      icon: (
        <div className="w-8 h-8 rounded-md border-2 border-current flex items-center justify-center" />
      ),
    },
  ];

  const SIZE_OPTIONS: { value: BrainstormNode['size']; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Node" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Text */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Text</label>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Node text"
            className="w-full px-3 py-2 text-sm rounded-soft border border-border dark:border-border-dark
              bg-white dark:bg-surface-dark text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              resize-none"
            rows={2}
            maxLength={200}
          />
        </div>

        {/* Color */}
        <ColorPicker
          label="Color"
          value={color}
          onChange={setColor}
          presetColors={COLOR_PALETTE}
        />

        {/* Shape */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Shape</label>
          <div className="flex gap-2">
            {SHAPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-soft border-2 transition-all duration-200
                  ${shape === opt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-border dark:border-border-dark text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                onClick={() => setShape(opt.value)}
              >
                {opt.icon}
                <span className="text-2xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Size</label>
          <div className="flex gap-2">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex-1 py-2 rounded-soft border-2 text-sm font-medium transition-all duration-200
                  ${size === opt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-border dark:border-border-dark text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                onClick={() => setSize(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" onClick={onClose} variant="secondary" size="sm">
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
