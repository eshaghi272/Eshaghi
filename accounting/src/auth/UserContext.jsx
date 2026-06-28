//scr/auth/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { user } = useAuth();
console.log("UserProvider is active");
  useEffect(() => {
    if (user && user.role === 2) {
      setSelectedUserId(user.id); 
    } else {
      setSelectedUserId(null);
    }
  }, [user]); // Fixed dependency array

  return (
    <UserContext.Provider value={{ selectedUserId, setSelectedUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}