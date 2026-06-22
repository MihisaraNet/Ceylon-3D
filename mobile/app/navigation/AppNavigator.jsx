/**
 * AppNavigator.jsx — Main Navigation Configuration
 * Modern, simple, minimalist theme.
 */
import React from 'react';
import { Platform, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

// Auth screens
import LandingScreen  from '../screens/auth/LandingScreen';
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Shop screens
import HomeScreen          from '../screens/shop/HomeScreen';
import BrowseScreen        from '../screens/shop/BrowseScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';
import CartScreen          from '../screens/shop/CartScreen';
import ReviewScreen        from '../screens/shop/ReviewScreen';

// Account
import MyAccountScreen  from '../screens/account/MyAccountScreen';

// Upload
import STLUploadScreen from '../screens/upload/STLUploadScreen';

// Admin
import AdminDashboardScreen   from '../screens/admin/AdminDashboardScreen';
import ManageProductsScreen   from '../screens/admin/ManageProductsScreen';
import StlOrdersAdminScreen   from '../screens/admin/StlOrdersAdminScreen';
import ShopOrdersAdminScreen  from '../screens/admin/ShopOrdersAdminScreen';
import CostCalculatorScreen   from '../screens/admin/CostCalculatorScreen';
import AddEditProductScreen   from '../screens/admin/AddEditProductScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const AdminStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle:{ backgroundColor: theme.headerBg }, headerTintColor: theme.text, headerShadowVisible: false, headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="AdminDashboard"  component={AdminDashboardScreen}  options={{ title:'Dashboard' }} />
      <Stack.Screen name="ManageProducts"  component={ManageProductsScreen}  options={{ title:'Products' }} />
      <Stack.Screen name="StlOrdersAdmin"  component={StlOrdersAdminScreen}  options={{ title:'STL Orders' }} />
      <Stack.Screen name="ShopOrdersAdmin" component={ShopOrdersAdminScreen} options={{ title:'Shop Orders' }} />
      <Stack.Screen name="CostCalculator"  component={CostCalculatorScreen}  options={{ title:'Calculator' }} />
      <Stack.Screen name="AddEditProduct"  component={AddEditProductScreen}  options={{ title:'Product' }} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const { totalItems } = useCart();
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = { Home: 'home', Browse: 'search', Upload: 'cloud-upload', Cart: 'cart', Account: 'person' };
          return (
            <Ionicons
              name={focused ? icons[route.name] : `${icons[route.name]}-outline`}
              size={focused && route.name === 'Upload' ? size + 10 : size}
              color={focused && route.name === 'Upload' ? theme.primary : color}
            />
          );
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.icon,
        tabBarStyle: {
          backgroundColor: theme.headerBg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        headerStyle: { backgroundColor: theme.headerBg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.5 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}      options={{ title: 'Home', headerShown: false }} />
      <Tab.Screen name="Browse"  component={BrowseScreen}    options={{ title: 'Explore', headerShown: false }} />
      <Tab.Screen name="Upload"  component={STLUploadScreen} options={{ title: 'Upload', tabBarLabel: () => null }} />
      <Tab.Screen name="Cart"    component={CartScreen}      options={{ title: 'Cart', headerShown: false, tabBarBadge: totalItems > 0 ? totalItems : undefined, tabBarBadgeStyle: { backgroundColor: theme.accent, color: '#ffffff', fontSize: 10, fontWeight: '800' } }} />
      <Tab.Screen name="Account" component={MyAccountScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle:{ backgroundColor: theme.headerBg }, headerTintColor: theme.text, headerShadowVisible: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="Landing"  component={LandingScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="Login"    component={LoginScreen}    options={{ title:'Sign In' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title:'Create Account' }} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="Main"          component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown:true, title:'', headerStyle:{ backgroundColor: theme.headerBg }, headerTintColor: theme.text, headerShadowVisible: false }} />
      <Stack.Screen name="Review"        component={ReviewScreen}        options={{ headerShown:false }} />
      <Stack.Screen name="AdminStack"    component={AdminStack} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
