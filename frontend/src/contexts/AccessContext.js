import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../services/api';

const AccessContext = createContext(null);

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess debe usarse dentro de AccessProvider');
  }
  return context;
};

export const AccessProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(sessionStorage.getItem('authToken') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (!token) {
          const visitor = await authAPI.visitorToken();
          const visitorToken = visitor.data.token;
          sessionStorage.setItem('authToken', visitorToken);
          sessionStorage.setItem('authUser', JSON.stringify(visitor.data.user));
          setToken(visitorToken);
          setUser(visitor.data.user);
          return;
        }

        if (user?.role === 'VISITOR') {
          return;
        }

        const profile = await authAPI.me();
        sessionStorage.setItem('authUser', JSON.stringify(profile.data));
        setUser(profile.data);
      } catch (_error) {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
        const visitor = await authAPI.visitorToken();
        const visitorToken = visitor.data.token;
        sessionStorage.setItem('authToken', visitorToken);
        sessionStorage.setItem('authUser', JSON.stringify(visitor.data.user));
        setToken(visitorToken);
        setUser(visitor.data.user);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token, user?.role]);

  const login = async (username, password) => {
    setError('');
    try {
      const response = await authAPI.login(username, password);
      sessionStorage.setItem('authToken', response.data.token);
      sessionStorage.setItem('authUser', JSON.stringify(response.data.user));
      setToken(response.data.token);
      setUser(response.data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible iniciar sesion');
      return false;
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    const visitor = await authAPI.visitorToken();
    sessionStorage.setItem('authToken', visitor.data.token);
    sessionStorage.setItem('authUser', JSON.stringify(visitor.data.user));
    setToken(visitor.data.token);
    setUser(visitor.data.user);
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role || 'VISITOR',
      isAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'LEAGUE_ADMIN',
      token,
      loading,
      error,
      setError,
      login,
      logout,
    }),
    [error, loading, token, user],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};
