/**
 * AuthContext.jsx — Authentication State Management
 *
 * Provides global authentication state to the entire app via React Context.
 * Persists auth data (JWT token + user object) in AsyncStorage for session persistence.
 *
 * Provided values:
 *   - user    {Object|null} — Current user object { id, email, fullName, roles } or null
 *   - token   {string|null} — JWT token string or null
 *   - loading {boolean}     — True while restoring session from AsyncStorage on app start
 *   - login(token, user)    — Save auth data and update state
 *   - logout()              — Clear auth data from storage and state
 *   - isAdmin {boolean}     — Convenience flag: true if user has 'ROLE_ADMIN'
 *
 * Usage:
 *   import { useAuth } from './context/AuthContext';
 *   const { user, login, logout, isAdmin } = useAuth();
 *
 * @module context/AuthContext
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('authUser'),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    })();
  }, []);

  const login = async (tokenVal, userVal) => {
    await AsyncStorage.setItem('token', tokenVal);
    await AsyncStorage.setItem('authUser', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'authUser']);
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
