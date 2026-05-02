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
    // This part runs automatically when the app starts to check if the user is already logged in
    (async () => {
      // Fetch both the token and user profile concurrently from local phone storage
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('authUser'),
      ]);
      
      // If both exist, restore the user's session without requiring them to log in again
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      
      // Stop the initial loading spinner once the check is complete
      setLoading(false);
    })();
  }, []);

  // This function is called after a successful login/register to save the session
  const login = async (tokenVal, userVal) => {
    // Save to local storage so the session persists if the app is closed
    await AsyncStorage.setItem('token', tokenVal);
    await AsyncStorage.setItem('authUser', JSON.stringify(userVal));
    
    // Update the live state so the UI updates immediately
    setToken(tokenVal);
    setUser(userVal);
  };

  // This function completely wipes the user's session
  const logout = async () => {
    // Remove credentials from local phone storage
    await AsyncStorage.multiRemove(['token', 'authUser']);
    
    // Clear the live state, forcing the UI to revert to logged-out views
    setToken(null);
    setUser(null);
  };

  // This is a quick helper to determine if the currently logged-in user is an admin
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
