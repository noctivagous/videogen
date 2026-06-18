'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PromptMentionOption } from '@/lib/studio/prompt-mentions';

interface MentionState {
  open: boolean;
  start: number;
  query: string;
  selectedIndex: number;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  mentionOptions: PromptMentionOption[];
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  mentionOptions,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<MentionState | null>(null);

  const filtered = useMemo(() => {
    if (!mention?.open) return [];
    const q = mention.query.toLowerCase();
    if (!q) return mentionOptions;
    return mentionOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.token.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    );
  }, [mention, mentionOptions]);

  const closeMention = useCallback(() => setMention(null), []);

  const detectMention = useCallback((text: string, caret: number) => {
    const before = text.slice(0, caret);
    const atMatch = before.match(/(?:^|[\s([{"'])@([^\s@]*)$/);
    if (!atMatch) {
      setMention(null);
      return;
    }
    const query = atMatch[1] ?? '';
    const start = caret - query.length - 1;
    setMention({ open: true, start, query, selectedIndex: 0 });
  }, []);

  const insertMention = useCallback(
    (option: PromptMentionOption) => {
      const el = textareaRef.current;
      if (!el || !mention) return;

      const caret = el.selectionStart;
      const before = value.slice(0, mention.start);
      const after = value.slice(caret);
      const insertion = `${option.token} `;
      const next = before + insertion + after;
      onChange(next);
      const nextCaret = before.length + insertion.length;
      setMention(null);

      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
      });
    },
    [mention, onChange, value],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    detectMention(e.target.value, e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mention?.open) return;

    const count = filtered.length;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMention();
      return;
    }

    if (e.key === 'ArrowDown' && count > 0) {
      e.preventDefault();
      setMention((m) =>
        m ? { ...m, selectedIndex: (m.selectedIndex + 1) % count } : m,
      );
      return;
    }

    if (e.key === 'ArrowUp' && count > 0) {
      e.preventDefault();
      setMention((m) =>
        m ? { ...m, selectedIndex: (m.selectedIndex - 1 + count) % count } : m,
      );
      return;
    }

    if ((e.key === 'Enter' || e.key === 'Tab') && count > 0) {
      e.preventDefault();
      insertMention(filtered[mention.selectedIndex]);
    }
  };

  const handleClick = () => {
    const el = textareaRef.current;
    if (el) detectMention(value, el.selectionStart);
  };

  useEffect(() => {
    if (!mention?.open || filtered.length === 0) return;
    if (mention.selectedIndex >= filtered.length) {
      setMention((m) => (m ? { ...m, selectedIndex: 0 } : m));
    }
  }, [filtered.length, mention]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={() => setTimeout(closeMention, 150)}
        placeholder={placeholder}
        className={className}
      />

      {mention?.open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] max-w-sm overflow-hidden rounded-lg border border-surface-600 bg-surface-800 shadow-xl"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              Add an image to a reference slot to mention it here.
            </div>
          ) : (
            filtered.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={i === mention.selectedIndex}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
                  i === mention.selectedIndex
                    ? 'bg-brand-500/20 text-white'
                    : 'text-gray-300 hover:bg-surface-700'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(opt);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={opt.url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded object-cover bg-surface-600"
                />
                <span className="flex-1 truncate font-medium">{opt.label}</span>
                <span className="shrink-0 text-xs text-brand-400">{opt.token}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}