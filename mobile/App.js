/**
 * App.js — Root Component of the Ceylon3D Mobile Application
 *
 * This is the top-level React Native component rendered by Expo.
 * It wraps the entire application with the required context providers
 * and sets up the navigation structure.
 *
 * Component tree:
 *   <AuthProvider>       — Provides user auth state (user, token, login, logout, isAdmin)
 *     <CartProvider>     — Provides shopping cart state (items, addToCart, totalPrice, etc.)
 *       <StatusBar>      — Sets the status bar style to "light"
 *       <AppNavigator /> — Handles all screen navigation (auth flow, main tabs, admin stack)
 *     </CartProvider>
 *   </AuthProvider>
 *
 * @module App
 */
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
