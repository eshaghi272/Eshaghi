// مسیر: client/src/auth/AuthProvider.jsx
import { createContext, useContext, useState, useMemo } from 'react';

// تعریف کانتکس احراز هویت
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // جلوگیری از رندرهای غیرضروری با useMemo
  const value = useMemo(() => ({ user, setUser }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// هوک سفارشی برای استفاده از کانتکس
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth باید داخل AuthProvider استفاده شود');
  }
  return context;
}
