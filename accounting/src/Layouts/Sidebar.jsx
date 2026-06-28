import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarItems, setSidebarItems] = useState([]);

  const pathToGroupMap = {
    '/ledger': 'accounting',
    '/balance': 'accounting',
    '/reports': 'reports',
    '/settings': 'settings',
    '/base': 'base',
    '/goods': 'goods',
    '/assets': 'assets',
    '/accounting': 'accounting',
    '/payroll': 'payroll'
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/layout/sidebar')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSidebarItems(data);
        } else {
          console.error('❌ داده‌ی سایدبار باید آرایه باشد:', data);
        }
      })
      .catch((err) => {
        console.error('❌ خطا در دریافت آیتم‌های سایدبار:', err);
      });
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleClick = (path) => {
    const groupKey = pathToGroupMap[path];
    const query = groupKey ? `?group=${groupKey}` : '';
    navigate(`${path}${query}`);
    if (window.innerWidth < 768 && onToggle) onToggle();
  };

  return (
    <>
      {isOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 dark:bg-opacity-70"
          onClick={onToggle}
        />
      )}

      <aside
        className={`bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-16'
        } h-full`}
      >
        <div className="flex justify-start items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            title={isOpen ? 'بستن سایدبار' : 'باز کردن سایدبار'}
          >
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${
                isOpen ? 'rotate-0' : 'rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {isOpen && (
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mr-3">
              منوی کلینیک
            </h2>
          )}
        </div>

        <div className="p-4 h-[calc(100%-80px)] overflow-y-auto">
          <nav className="space-y-2">
            {sidebarItems.map(({ path, label, icon }) => (
              <button
                key={path}
                onClick={() => handleClick(path)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600 dark:bg-gray-700 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                } ${isOpen ? 'justify-start' : 'justify-center'}`}
                title={!isOpen ? label : ''}
              >
                <span className="text-lg">{icon || '❓'}</span>
                {isOpen && <span className="font-medium mr-3">{label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
