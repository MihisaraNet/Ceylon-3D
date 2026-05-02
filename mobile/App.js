import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './app/context/AuthContext';
import { CartProvider } from './app/context/CartContext';
import AppNavigator from './app/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
