import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useFiscalYear } from "../context/FiscalYearContext";

const Navbar = ({ onToggleSidebar, isDarkMode, onToggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { years, activeYear, setActiveYear } = useFiscalYear();

  const navItems = [
    { path: "/", label: "خانه", icon: "🏠" },
    { path: "/about", label: "درباره ما", icon: "ℹ️" },
    { path: "/services", label: "خدمات", icon: "⚙️" },
    { path: "/contact", label: "تماس با ما", icon: "📞" },
    { path: "/test", label: "تست", icon: "🧪" },
  ];

  const ROLE_LABELS = {
    1: "ادمین",
    2: "مدیر مالی",
    3: "کارشناس",
    4: "حسابدار",
  };

  const getRoleLabel = (role) => ROLE_LABELS[role] || "نامشخص";

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-between items-center h-16">
          {/* سمت راست: لوگو و منو */}
          <div className="flex items-center space-x-8 rtl:space-x-reverse">
            <button
              onClick={onToggleSidebar}
              className="text-white p-2 rounded-lg hover:bg-primary-500 transition-colors dark:hover:bg-gray-700"
              title="باز/بستن منو"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Link
              to="/"
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <span className="text-2xl">🚀</span>
              <span className="text-white text-xl font-bold dark:text-gray-100">
                سامانه حسابداری
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-primary-700 text-white shadow-md dark:bg-gray-700"
                      : "text-primary-100 hover:bg-primary-500 hover:text-white dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* سمت چپ: سلکت سال مالی + دارک مود + پروفایل */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* سلکت سال مالی */}
            <label className=" text-white"> سال مالی</label>
            <select
              value={activeYear || ""}
              onChange={(e) => setActiveYear(Number(e.target.value))}
              className="px-2 py-1 rounded bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {years.map((y) => (
                <option key={y.FiscalYearId} value={y.FiscalYearId}>
                  {y.YearCode}
                </option>
              ))}
            </select>

            {/* آیکن دارک مود */}
            <button
              onClick={onToggleDarkMode}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              title={isDarkMode ? "تغییر به تم روز" : "تغییر به تم شب"}
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5 text-yellow-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* نام کاربر و دکمه ورود/خروج */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${user.role}/${user.userId}`}
                  className="hidden md:flex flex-col text-right hover:underline"
                  title="پروفایل"
                >
                  <span className="text-white dark:text-gray-200 font-semibold">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-xs text-primary-100 dark:text-gray-400">
                    🎓 {getRoleLabel(user.role)}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm dark:bg-red-500 dark:hover:bg-red-600"
                >
                  خروج
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                ورود
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
