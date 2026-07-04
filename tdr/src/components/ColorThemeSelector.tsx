import React, { useState } from 'react';
import { useColorTheme, ColorTheme } from '../context/ThemeContext';

const themes: { value: ColorTheme; label: string; color: string }[] = [
  { value: 'pink', label: 'صورتی', color: '#ec4899' },
  { value: 'blue', label: 'آبی', color: '#3b82f6' },
  { value: 'purple', label: 'بنفش', color: '#8b5cf6' },
  { value: 'green', label: 'سبز', color: '#22c55e' },
  { value: 'rose', label: 'رز', color: '#f43f5e' },
  { value: 'teal', label: 'فیروزه‌ای', color: '#14b8a6' },
];

const ColorThemeSelector: React.FC = () => {
  const { colorTheme, setColorTheme } = useColorTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find(t => t.value === colorTheme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
        aria-label="انتخاب تم رنگی"
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: currentTheme.color }}
        />
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => {
                    setColorTheme(theme.value);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    colorTheme === theme.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800' : ''
                  }`}
                  style={{
                    ringColor: theme.color,
                  }}
                  aria-label={theme.label}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 mt-1 block">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColorThemeSelector;