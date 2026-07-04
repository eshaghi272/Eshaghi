import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorTheme = 'pink' | 'blue' | 'purple' | 'green' | 'rose' | 'teal';

interface ThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ColorThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('pink');

  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') as ColorTheme;
    if (savedTheme) {
      setColorTheme(savedTheme);
      document.documentElement.setAttribute('data-color-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-color-theme', 'pink');
    }
  }, []);

  const updateTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
    localStorage.setItem('color-theme', theme);
    document.documentElement.setAttribute('data-color-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useColorTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
};