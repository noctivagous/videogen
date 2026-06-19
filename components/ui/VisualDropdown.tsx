'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import type { VisualDropdownOption } from '@/lib/constants/field-size-options';

export type VisualDropdownTriggerVariant = 'thumbnailRight' | 'backgroundFill' | 'textOnly';
export type VisualDropdownMenuVariant = 'grid' | 'list' | 'columns';
export type VisualDropdownSize = 'sm' | 'md' | 'lg';

export interface VisualDropdownProps<T extends string = string> {
  label?: string;
  labelClassName?: string;
  value: T;
  onChange: (value: T) => void;
  options: VisualDropdownOption<T>[];
  triggerVariant?: VisualDropdownTriggerVariant;
  menuVariant?: VisualDropdownMenuVariant;
  size?: VisualDropdownSize;
  menuColumns?: number;
  cellWidth?: number;
  cellHeight?: number;
  disabled?: boolean;
  className?: string;
  uiSection?: Record<string, string>;
}

function optionImage(option: VisualDropdownOption): string | undefined {
  return option.backgroundUrl ?? option.imageUrl;
}

function isCssGradient(value: string): boolean {
  return value.startsWith('linear-gradient') || value.startsWith('radial-gradient');
}

function optionBackgroundStyle(option: VisualDropdownOption): CSSProperties | undefined {
  const bg = option.backgroundUrl ?? option.imageUrl;
  if (!bg) return undefined;
  if (isCssGradient(bg)) return { background: bg };
  return { backgroundImage: `url(${bg})` };
}

export function VisualDropdown<T extends string>({
  label,
  labelClassName = '',
  value,
  onChange,
  options,
  triggerVariant = 'thumbnailRight',
  menuVariant = 'grid',
  size = 'md',
  menuColumns = 2,
  cellWidth = 96,
  cellHeight = 88,
  disabled = false,
  className = '',
  uiSection,
}: VisualDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex] ?? options[0];

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      close();
    },
    [close, onChange, options],
  );

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, selectedIndex]);

  const moveActive = (delta: number) => {
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return options.length - 1;
      if (next >= options.length) return 0;
      return next;
    });
  };

  const moveGrid = (rowDelta: number, colDelta: number) => {
    setActiveIndex((prev) => {
      const row = Math.floor(prev / menuColumns);
      const col = prev % menuColumns;
      const totalRows = Math.ceil(options.length / menuColumns);
      const nextRow = Math.min(Math.max(row + rowDelta, 0), totalRows - 1);
      let nextCol = col + colDelta;
      if (nextCol < 0) nextCol = menuColumns - 1;
      if (nextCol >= menuColumns) nextCol = 0;
      let nextIndex = nextRow * menuColumns + nextCol;
      if (nextIndex >= options.length) {
        nextIndex = Math.min(nextRow * menuColumns + col, options.length - 1);
      }
      return nextIndex;
    });
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectIndex(activeIndex);
      return;
    }
    if (menuVariant === 'grid' || menuVariant === 'columns') {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveGrid(0, 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveGrid(0, -1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveGrid(1, 0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveGrid(-1, 0);
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    }
  };

  const triggerImage = optionImage(selected);
  const menuStyle = {
    '--vd-cell-w': `${cellWidth}px`,
    '--vd-cell-h': `${cellHeight}px`,
  } as CSSProperties;

  const menuClass =
    menuVariant === 'list'
      ? 'visual-dropdown__list'
      : menuVariant === 'columns'
        ? 'visual-dropdown__grid visual-dropdown__grid--columns'
        : 'visual-dropdown__grid';

  return (
    <div
      ref={rootRef}
      className={`visual-dropdown parameter-enclosure ${className}`.trim()}
      style={menuStyle}
      {...uiSection}
    >
      {label ? (
        <label
          className={`text-xs text-gray-400 mb-2 block ${labelClassName}`.trim()}
          id={`${listboxId}-label`}
        >
          {label}
        </label>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        className={[
          'visual-dropdown__trigger',
          `visual-dropdown__trigger--${size}`,
          `visual-dropdown__trigger--${triggerVariant}`,
          open ? 'visual-dropdown__trigger--open' : '',
        ].filter(Boolean).join(' ')}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? `${listboxId}-label` : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        {triggerVariant === 'backgroundFill' && selected ? (
          <span
            className="visual-dropdown__trigger-bg"
            style={optionBackgroundStyle(selected)}
            aria-hidden
          />
        ) : null}

        {triggerVariant === 'thumbnailRight' && selected ? (
          <>
            <span
              className="visual-dropdown__trigger-thumb"
              style={optionBackgroundStyle(selected)}
              aria-hidden
            />
            <span className="visual-dropdown__trigger-shade" aria-hidden />
          </>
        ) : null}

        <span className="visual-dropdown__trigger-label">{selected?.label ?? value}</span>
        <span className="visual-dropdown__chevron" aria-hidden>▾</span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label ?? 'Options'}
          className="visual-dropdown__menu"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          ref={(el) => el?.focus()}
        >
          <div
            className={menuClass}
            style={{ gridTemplateColumns: `repeat(${menuColumns}, minmax(0, 1fr))` }}
          >
            {options.map((option, index) => {
              const image = optionImage(option);
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'visual-dropdown__cell',
                    isSelected ? 'visual-dropdown__cell--selected' : '',
                    isActive ? 'visual-dropdown__cell--active' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectIndex(index)}
                >
                  {image ? (
                    <span className="visual-dropdown__cell-thumb-wrap">
                      {isCssGradient(image) ? (
                        <span
                          className="visual-dropdown__cell-thumb visual-dropdown__cell-thumb--css"
                          style={optionBackgroundStyle(option)}
                          aria-hidden
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={image} alt="" className="visual-dropdown__cell-thumb" />
                      )}
                    </span>
                  ) : (
                    <span className="visual-dropdown__cell-thumb-wrap visual-dropdown__cell-thumb-wrap--empty" />
                  )}
                  <span className="visual-dropdown__cell-short">{option.shortLabel ?? option.value}</span>
                  <span className="visual-dropdown__cell-label">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}