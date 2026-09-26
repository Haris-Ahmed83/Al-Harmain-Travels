'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`
        relative p-2.5 rounded-xl border transition-all duration-300 group
        ${isDark
          ? 'text-slate-400 hover:text-amber-300 bg-transparent hover:bg-slate-800 border-slate-800 hover:border-amber-500/40'
          : 'text-slate-500 hover:text-amber-500 bg-transparent hover:bg-amber-50 border-slate-200 hover:border-amber-300'
        }
      `}
    >
      {/* Animated icon swap */}
      <span
        className={`block transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75 absolute inset-0 m-auto'
        }`}
      >
        <Moon className="w-4 h-4" />
      </span>
      <span
        className={`block transition-all duration-300 ${
          isDark ? 'opacity-0 -rotate-90 scale-75 absolute inset-0 m-auto' : 'opacity-100 rotate-0 scale-100'
        }`}
      >
        <Sun className="w-4 h-4" />
      </span>
    </button>
  );
}
