'use client';

import { useDarkModeStore } from '@/store/useDarkModeStore';

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
}

export function PageHeader({ label, title, description }: PageHeaderProps) {
  const isDark = useDarkModeStore(s => s.isDark);

  return (
    <div>
      {label && (
        <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">
          {label}
        </p>
      )}
      <h2 className={`text-[28px] md:text-3xl leading-8 font-extrabold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>
        {title}
      </h2>
      {description && (
        <p className={`text-sm mt-1 md:text-base max-w-xl leading-relaxed transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          {description}
        </p>
      )}
    </div>
  );
}

