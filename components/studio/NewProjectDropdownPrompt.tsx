'use client';

import { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';

interface NewProjectDropdownPromptProps {
  onDone?: () => void;
  buttonClassName?: string;
}

export function NewProjectDropdownPrompt({
  onDone,
  buttonClassName = 'w-full text-left px-3 py-2 hover:bg-surface-700',
}: NewProjectDropdownPromptProps) {
  const newProject = useStudioStore((s) => s.newProject);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const reset = () => {
    setNaming(false);
    setName('');
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    newProject(trimmed);
    reset();
    onDone?.();
  };

  if (!naming) {
    return (
      <button
        type="button"
        className={buttonClassName}
        onClick={() => {
          setNaming(true);
          setName('');
        }}
      >
        New project
      </button>
    );
  }

  return (
    <div className="px-3 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500">
        Project name
      </label>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) handleCreate();
          if (e.key === 'Escape') reset();
        }}
        placeholder="Untitled Project"
        className="w-full bg-surface-700 border border-surface-600 rounded-lg px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-3 py-1.5 text-xs rounded-lg border border-surface-600 bg-surface-700 hover:bg-surface-600 text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
