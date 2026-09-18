import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../utils/useTheme';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isAr = typeof document !== 'undefined' && document.documentElement.lang === 'ar';
  const nextLabel = theme === 'dark'
    ? (isAr ? 'الوضع الفاتح (أبيض)' : 'Mode clair (blanc)')
    : (isAr ? 'الوضع الداكن (أخضر)' : 'Mode sombre (vert)');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-lg border border-gold-500/40 bg-chip text-on-surface hover:bg-chip-strong transition-colors cursor-pointer shrink-0 ${
        compact ? 'p-1.5' : 'gap-1.5 px-2.5 py-1.5 text-xs font-semibold'
      } ${className}`}
      title={nextLabel}
      aria-label={nextLabel}
      aria-pressed={theme === 'light'}
    >
      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      {!compact && (
        <span className="hidden sm:inline">
          {theme === 'dark' ? (isAr ? 'فاتح' : 'Clair') : isAr ? 'داكن' : 'Sombre'}
        </span>
      )}
    </button>
  );
};