import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

export default function TabLayout() {
  const [tabs, setTabs] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const groupKey = location.pathname.split('/')[2] || '';

  useEffect(() => {
    fetch(`http://localhost:5000/api/tabs?groupKey=${groupKey}`)
      .then(res => res.json())
      .then(setTabs)
      .catch(err => console.error('❌ خطا در دریافت تب‌ها:', err));
  }, [groupKey]);

  const currentPath = location.pathname;
  const activeTab = tabs.find(({ routePath }) =>
    currentPath === routePath || currentPath.startsWith(routePath + '/')
  )?.routePath ?? tabs[0]?.routePath ?? '';

  const handleChange = (newTo) => {
    navigate(newTo);
  };

  return (
    <div className="w-full" dir="rtl">
      {tabs.length > 1 && (
        <div className="flex border-b border-gray-300 dark:border-gray-600 overflow-x-auto">
          {tabs.map(({ tabLabel, routePath }) => (
            <button
              key={routePath}
              onClick={() => handleChange(routePath)}
              className={`px-4 py-2 whitespace-nowrap transition border-b-2 ${
                activeTab === routePath
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Outlet key={currentPath} />
      </div>
    </div>
  );
}
