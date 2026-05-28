'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Trash2 } from 'lucide-react';

export type CustomSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  align?: 'left' | 'right';
  icon?: React.ReactNode;
  /** field = full-width trigger; icon = compact square button (e.g. filter) */
  variant?: 'field' | 'icon';
  onDeleteOption?: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  disabled = false,
  className = '',
  triggerClassName = '',
  align = 'left',
  icon,
  variant = 'field',
  onDeleteOption,
  searchable = false,
  searchPlaceholder = 'Cari...',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [isMobile] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const triggerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 220);
    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

    const maxMenuHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openUp = spaceBelow < 160 && rect.top > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      left,
      width: menuWidth,
      maxHeight: Math.min(maxMenuHeight, openUp ? rect.top - 16 : spaceBelow),
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      zIndex: 9999,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDropdown();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeDropdown]);

  const handleSelect = (next: string) => {
    onChange(next);
    closeDropdown();
  };

  const optionList = (
    <div className="overflow-y-auto overscroll-contain py-1.5">
      {filteredOptions.length === 0 ? (
        <p className="px-5 py-3 text-sm text-slate-500">Tidak ada opsi ditemukan</p>
      ) : (
        filteredOptions.map(opt => {
          const active = opt.value === value;
          return (
            <div
              key={opt.value}
              className={`w-full flex items-center justify-between px-5 py-2 transition-colors ${
                active ? 'bg-slate-50 text-crimson font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(opt.value)}
                className="flex-1 text-left min-w-0 py-1"
              >
                <span className="block text-sm truncate">{opt.label}</span>
                {opt.description && (
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5 truncate">{opt.description}</span>
                )}
              </button>
              {onDeleteOption && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDropdown();
                    onDeleteOption(opt.value);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-crimson hover:bg-rose-50 active:scale-95 transition-all ml-2 shrink-0"
                  title={`Hapus ${opt.label}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const menu =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <>
        <div className="fixed inset-0 z-[9998]" aria-hidden onClick={closeDropdown} />
        <div
          role="listbox"
          style={menuStyle}
          className="z-[9999] bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Mobile: search inside portal */}
          {searchable && isMobile && (
            <div className="px-3 pt-3 pb-1 shrink-0">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 text-slate-800 placeholder-slate-400 bg-slate-50"
              />
            </div>
          )}
          {optionList}
        </div>
      </>,
      document.body,
    );

  const isIcon = variant === 'icon';

  return (
    <div ref={triggerRef} className={`relative ${isIcon ? 'shrink-0' : ''} ${className}`}>
      {/* Desktop searchable: replace trigger with input */}
      {!isIcon && open && searchable && !isMobile ? (
        <div className="relative w-full">
          {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-crimson shrink-0 z-10">{icon}</span>}
          <input
            type="text"
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all border-crimson ring-1 ring-crimson outline-none text-slate-800 bg-white ${
              icon ? 'pl-11' : ''
            } ${triggerClassName}`}
            placeholder={selected?.label ?? placeholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 text-slate-400 rotate-180 cursor-pointer"
            onClick={closeDropdown}
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(v => !v)}
          className={
            isIcon
              ? `border p-3.5 md:p-4 rounded-2xl md:rounded-3xl active:scale-95 transition-all flex items-center justify-center
                ${open ? 'bg-red-50 border-crimson text-crimson' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
                ${triggerClassName}`
              : `w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all
                ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'bg-white hover:border-slate-300 active:scale-[0.99]'}
                ${open ? 'border-crimson ring-1 ring-crimson' : 'border-slate-200'}
                ${!selected && !disabled ? 'text-slate-400' : 'text-slate-800'}
                ${triggerClassName}`
          }
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={isIcon ? displayLabel : undefined}
        >
          {isIcon ? (
            icon
          ) : (
            <>
              {icon && <span className="shrink-0 text-crimson">{icon}</span>}
              <span className="flex-1 min-w-0 truncate">{displayLabel}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>
      )}
      {menu}
    </div>
  );
}
