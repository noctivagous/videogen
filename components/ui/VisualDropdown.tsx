'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type {
  VisualDropdownGroup,
  VisualDropdownOption,
} from '@/lib/constants/field-size-options';

export type VisualDropdownTriggerVariant = 'thumbnailRight' | 'backgroundFill' | 'textOnly';
export type VisualDropdownMenuVariant = 'grid' | 'list' | 'columns';
export type VisualDropdownSize = 'sm' | 'md' | 'lg';

export interface VisualDropdownProps<T extends string = string> {
  label?: string;
  labelClassName?: string;
  value: T;
  onChange: (value: T) => void;
  options: VisualDropdownOption<T>[];
  groups?: VisualDropdownGroup<T>[];
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

function isSelectable<T extends string>(option: VisualDropdownOption<T>): boolean {
  return !option.disabled;
}

const MENU_PAD_PX = 12;
const GRID_GAP_PX = 6;

function menuColumnsThatFit(
  containerWidth: number,
  desiredColumns: number,
  cellWidth: number,
): number {
  for (let columns = desiredColumns; columns > 1; columns--) {
    const needed = columns * cellWidth + (columns - 1) * GRID_GAP_PX + MENU_PAD_PX;
    if (containerWidth >= needed) return columns;
  }
  return 1;
}

export function VisualDropdown<T extends string>({
  label,
  labelClassName = '',
  value,
  onChange,
  options,
  groups,
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
  const [effectiveColumns, setEffectiveColumns] = useState(menuColumns);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const flatOptions = useMemo(() => options, [options]);

  const selectedIndex = Math.max(0, flatOptions.findIndex((o) => o.value === value));
  const selected = flatOptions[selectedIndex] ?? flatOptions[0];

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const option = flatOptions[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      close();
    },
    [close, flatOptions, onChange],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || menuVariant === 'list') return;

    const updateColumns = () => {
      const width = root.getBoundingClientRect().width;
      setEffectiveColumns(menuColumnsThatFit(width, menuColumns, cellWidth));
    };

    updateColumns();
    const observer = new ResizeObserver(updateColumns);
    observer.observe(root);
    return () => observer.disconnect();
  }, [cellWidth, menuColumns, menuVariant]);

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
      const len = flatOptions.length;
      if (len === 0) return 0;
      let next = prev;
      for (let i = 0; i < len; i++) {
        next = (next + delta + len) % len;
        if (isSelectable(flatOptions[next])) break;
      }
      return next;
    });
  };

  const moveGrid = (rowDelta: number, colDelta: number) => {
    setActiveIndex((prev) => {
      const columns = effectiveColumns;
      const row = Math.floor(prev / columns);
      const col = prev % columns;
      const totalRows = Math.ceil(flatOptions.length / columns);
      const nextRow = Math.min(Math.max(row + rowDelta, 0), totalRows - 1);
      let nextCol = col + colDelta;
      if (nextCol < 0) nextCol = columns - 1;
      if (nextCol >= columns) nextCol = 0;
      let nextIndex = nextRow * columns + nextCol;
      if (nextIndex >= flatOptions.length) {
        nextIndex = Math.min(nextRow * columns + col, flatOptions.length - 1);
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

  const renderOption = (option: VisualDropdownOption<T>, index: number) => {
    const image = optionImage(option);
    const isSelected = option.value === value;
    const isActive = index === activeIndex;
    const optionDisabled = Boolean(option.disabled);
    const displayLabel = optionDisabled ? `${option.label} (soon)` : option.label;

    return (
      <button
        key={option.value}
        type="button"
        role="option"
        aria-selected={isSelected}
        aria-disabled={optionDisabled || undefined}
        disabled={optionDisabled}
        className={[
          'visual-dropdown__cell',
          isSelected ? 'visual-dropdown__cell--selected' : '',
          isActive ? 'visual-dropdown__cell--active' : '',
          optionDisabled ? 'visual-dropdown__cell--disabled' : '',
        ].filter(Boolean).join(' ')}
        onMouseEnter={() => !optionDisabled && setActiveIndex(index)}
        onClick={() => selectIndex(index)}
      >
        {menuVariant !== 'list' && (
          image ? (
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
          )
        )}
        {menuVariant !== 'list' && (
          <span className="visual-dropdown__cell-short">{option.shortLabel ?? option.value}</span>
        )}
        <span className="visual-dropdown__cell-label">{displayLabel}</span>
      </button>
    );
  };

  const menuContent: ReactNode = groups?.length ? (
    groups.map((group) => (
      <div key={group.label} className="visual-dropdown__group">
        <div className="visual-dropdown__group-label" aria-hidden>
          {group.label}
        </div>
        {group.options.map((option) => {
          const index = flatOptions.findIndex((o) => o.value === option.value);
          return renderOption(option, index);
        })}
      </div>
    ))
  ) : (
    flatOptions.map((option, index) => renderOption(option, index))
  );

  const triggerLabel = selected?.shortLabel ?? selected?.label ?? value;

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

        <span className="visual-dropdown__trigger-label">{triggerLabel}</span>
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
            style={
              menuVariant === 'grid' || menuVariant === 'columns'
                ? {
                    gridTemplateColumns: `repeat(${effectiveColumns}, minmax(var(--vd-cell-w, 6rem), 1fr))`,
                  }
                : undefined
            }
          >
            {menuContent}
          </div>
        </div>
      )}
    </div>
  );
}
