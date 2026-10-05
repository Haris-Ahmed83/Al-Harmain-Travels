'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 transition-all duration-200 cursor-pointer active:scale-95 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? 'Light Theme' : 'Dark Theme'}
        </span>
      )}
    </button>
  );
}
