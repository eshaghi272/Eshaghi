import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import GroupedTabLayout from './GroupedTabLayout';

const Layout = ({ onColorChange, colorOptions, primaryColor }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Navbar 
        onToggleSidebar={toggleSidebar} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode}
        primaryColor={primaryColor}
      />

      <div className="flex h-[calc(100vh-64px)] pt-1">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={toggleSidebar}
          isDarkMode={isDarkMode} 
        />

        <main className="flex-1 overflow-y-auto transition-all duration-300 pt-8">
          <div className="bg-white dark:bg-gray-800 h-full dark:text-gray-200">
            {/* ✅ نمایش تب‌ها قبل از Outlet */}
            <GroupedTabLayout />
            <Outlet />
          </div>
        </main>
      </div>

      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default Layout;
