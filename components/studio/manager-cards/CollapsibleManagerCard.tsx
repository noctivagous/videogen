'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface CollapsibleManagerCardProps {
  name: string;
  itemCount: number;
  itemLabelSingular: string;
  itemLabelPlural?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  primary: ReactNode;
  children: ReactNode;
  expandTitle: string;
  collapseTitle: string;
  deleteTitle: string;
  className?: string;
  onPrimaryClick?: () => void;
}

export function CollapsibleManagerCard({
  name,
  itemCount,
  itemLabelSingular,
  itemLabelPlural,
  expanded,
  onExpandedChange,
  onRename,
  onDelete,
  primary,
  children,
  expandTitle,
  collapseTitle,
  deleteTitle,
  className,
  onPrimaryClick,
}: CollapsibleManagerCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setNameValue(name);
  }, [name]);

  const itemLabel = itemCount === 1 ? itemLabelSingular : (itemLabelPlural ?? `${itemLabelSingular}s`);

  const toggleExpanded = () => onExpandedChange(!expanded);

  const commitName = () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
      return;
    }
    setNameValue(name);
  };

  return (
    <div className={`bg-surface-800 border border-surface-600 rounded-xl overflow-hidden ${className ?? ''}`.trim()}>
      <div
        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
          expanded
            ? 'bg-surface-700/50 border-b border-surface-700 hover:bg-surface-700/60'
            : 'hover:bg-surface-700/20'
        }`}
        onClick={toggleExpanded}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPrimaryClick?.();
            if (!expanded) onExpandedChange(true);
          }}
          className="flex-shrink-0"
        >
          {primary}
        </button>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              type="text"
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              onBlur={commitName}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitName();
                if (event.key === 'Escape') {
                  setEditingName(false);
                  setNameValue(name);
                }
              }}
              className="w-full bg-surface-700 border border-brand-500 rounded px-2 py-0.5 text-sm text-gray-100 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!expanded) {
                  onExpandedChange(true);
                  return;
                }
                setEditingName(true);
              }}
              className="text-sm font-medium text-gray-100 truncate hover:text-brand-300 transition-colors text-left w-full"
              title="Click to rename"
            >
              {name}
            </button>
          )}
          <p className="text-[10px] text-gray-500 mt-0.5">
            {itemCount} {itemLabel}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded();
            }}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors"
            title={expanded ? collapseTitle : expandTitle}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="px-2 py-1 text-[10px] bg-surface-700 text-gray-400 rounded hover:bg-surface-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setConfirmDelete(true);
              }}
              className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-500 hover:text-red-400 transition-colors"
              title={deleteTitle}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
