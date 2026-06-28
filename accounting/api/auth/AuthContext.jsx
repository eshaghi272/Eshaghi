// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // {id, email, role, groupId, permissions}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchMe() {
    const res = await axios.get('/api/auth/me', { withCredentials: true });
    const user = res.data?.user ?? null;
    setUser(user);

  }

  useEffect(() => {
    fetchMe().catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function login({ email, password }) {
    await axios.post('/api/auth/login', { identifier: email, password }, { withCredentials: true });
    await fetchMe();
  }

  async function logout() {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
  }

  const value = { user, loading, error, setError, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth باید داخل AuthProvider استفاده شود');
  return ctx;
}
