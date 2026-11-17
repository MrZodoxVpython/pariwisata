import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import adminApi, { getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    adminApi
      .me()
      .then((payload) => {
        if (active) setUser(payload.user);
      })
      .catch(() => {
        setToken('');
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken('');
      setUser(null);
    };
    window.addEventListener('cb-admin-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('cb-admin-unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const payload = await adminApi.login(email, password);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      /* stateless token: clearing locally is enough */
    }
    setToken('');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      setUser,
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}