import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, Check, X } from 'lucide-react';

type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'orange';

const ThemeSelector: React.FC = () => {
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const colorOptions: { value: ColorScheme; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: '#3B82F6' },
    { value: 'green', label: 'Green', color: '#10B981' },
    { value: 'purple', label: 'Purple', color: '#8B5CF6' },
    { value: 'red', label: 'Red', color: '#EF4444' },
    { value: 'orange', label: 'Orange', color: '#F59E0B' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
        aria-label="Theme settings"
      >
        <Palette className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-64 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-white">Theme Settings</h4>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mode</p>
            <div className="flex gap-2">
              <button
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Color Scheme</p>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setColorScheme(option.value)}
                  className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: option.color }}
                  aria-label={`Set color to ${option.label}`}
                >
                  {colorScheme === option.value && (
                    <Check className="absolute inset-0 m-auto w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
