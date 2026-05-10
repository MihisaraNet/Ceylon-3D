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

// Auth screens
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

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle:{ backgroundColor:'#ffffff' }, headerTintColor:'#0f172a', headerShadowVisible: false, headerTitleStyle: { fontWeight: '700' } }}>
    <Stack.Screen name="AdminDashboard"  component={AdminDashboardScreen}  options={{ title:'Dashboard' }} />
    <Stack.Screen name="ManageProducts"  component={ManageProductsScreen}  options={{ title:'Products' }} />
    <Stack.Screen name="StlOrdersAdmin"  component={StlOrdersAdminScreen}  options={{ title:'STL Orders' }} />
    <Stack.Screen name="ShopOrdersAdmin" component={ShopOrdersAdminScreen} options={{ title:'Shop Orders' }} />
    <Stack.Screen name="CostCalculator"  component={CostCalculatorScreen}  options={{ title:'Calculator' }} />
    <Stack.Screen name="AddEditProduct"  component={AddEditProductScreen}  options={{ title:'Product' }} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { totalItems } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = { Home: 'home', Browse: 'grid', Upload: 'add-circle', Cart: 'bag', Account: 'person' };
          return (
            <Ionicons
              name={focused ? icons[route.name] : `${icons[route.name]}-outline`}
              size={focused && route.name === 'Upload' ? size + 10 : size}
              color={focused && route.name === 'Upload' ? '#0f172a' : color}
            />
          );
        },
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0f172a',
        headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.5 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}      options={{ title: 'Home', headerShown: false }} />
      <Tab.Screen name="Browse"  component={BrowseScreen}    options={{ title: 'Explore', headerShown: false }} />
      <Tab.Screen name="Upload"  component={STLUploadScreen} options={{ title: 'Upload', tabBarLabel: () => null }} />
      <Tab.Screen name="Cart"    component={CartScreen}      options={{ title: 'Cart', headerShown: false, tabBarBadge: totalItems > 0 ? totalItems : undefined, tabBarBadgeStyle: { backgroundColor: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: '700' } }} />
      <Tab.Screen name="Account" component={MyAccountScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle:{ backgroundColor:'#ffffff' }, headerTintColor:'#0f172a', headerShadowVisible: false }}>
    <Stack.Screen name="Login"    component={LoginScreen}    options={{ title:'Sign In' }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title:'Create Account' }} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main"          component={MainTabs} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown:true, title:'', headerStyle:{ backgroundColor:'#ffffff' }, headerTintColor:'#0f172a', headerShadowVisible: false }} />
    <Stack.Screen name="Review"        component={ReviewScreen}        options={{ headerShown:false }} />
    <Stack.Screen name="AdminStack"    component={AdminStack} />
  </Stack.Navigator>
);

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
