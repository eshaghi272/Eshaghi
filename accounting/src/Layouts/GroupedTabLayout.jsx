import { useEffect, useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';

const GroupedTabLayout = () => {
  const [tabGroups, setTabGroups] = useState({});
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const activeGroup = searchParams.get('group') || 'accounting';

  useEffect(() => {
    fetch('http://localhost:5000/api/layout/tabs/grouped')
      .then((res) => res.json())
      .then((data) => setTabGroups(data))
      .catch((err) => console.error('❌ خطا در دریافت تب‌ها:', err));
  }, []);

  const activeTabs = tabGroups[activeGroup] || [];

  return (
    <div className="w-full border-b border-gray-300 dark:border-gray-600" dir="rtl">
      {activeTabs.length > 0 ? (
        <div className="mb-2">
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200 px-4 py-1">
            گروه: {activeGroup}
          </div>
          <div className="flex flex-wrap gap-2 px-4 py-2">
            {activeTabs.map(({ label, to }) => (
              <NavLink
                key={to}
                to={`${to}?group=${activeGroup}`} // 👈 این خط مهمه
                className={({ isActive }) =>
                  `px-3 py-1 rounded text-sm transition ${
                    isActive || location.pathname.startsWith(to)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-red-600 px-4 py-2">
          ⚠️ هیچ تبی برای گروه <strong>{activeGroup}</strong> یافت نشد.
        </div>
      )}
    </div>
  );
};

export default GroupedTabLayout;
