import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ColorPicker from '@/components/ui/ColorPicker';
import Button from '@/components/ui/Button';

const COLOR_OPTIONS = [
  '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6b7280',
];

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, color: string) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setColor(COLOR_OPTIONS[0]);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate(trimmedName, description.trim(), color);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Name */}
        <Input
          ref={nameInputRef}
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My brainstorm session"
          maxLength={100}
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Description <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this project about?"
            className="w-full px-3 py-2 text-sm rounded-soft border border-border dark:border-border-dark
              bg-white dark:bg-surface-dark text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              resize-none"
            rows={2}
            maxLength={300}
          />
        </div>

        {/* Color theme */}
        <ColorPicker
          label="Color theme"
          value={color}
          onChange={setColor}
          presetColors={COLOR_OPTIONS}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" onClick={onClose} variant="secondary" size="sm">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim()}
            size="sm"
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
