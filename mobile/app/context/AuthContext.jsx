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
