import React from 'react';
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
  <Stack.Navigator screenOptions={{ headerStyle:{ backgroundColor:'#4f46e5' }, headerTintColor:'#fff' }}>
    <Stack.Screen name="AdminDashboard"  component={AdminDashboardScreen}  options={{ title:'Admin Dashboard' }} />
    <Stack.Screen name="ManageProducts"  component={ManageProductsScreen}  options={{ title:'Manage Products' }} />
    <Stack.Screen name="StlOrdersAdmin"  component={StlOrdersAdminScreen}  options={{ title:'STL Orders' }} />
    <Stack.Screen name="ShopOrdersAdmin" component={ShopOrdersAdminScreen} options={{ title:'Shop Orders' }} />
    <Stack.Screen name="CostCalculator"  component={CostCalculatorScreen}  options={{ title:'Cost Calculator' }} />
    <Stack.Screen name="AddEditProduct"  component={AddEditProductScreen}  options={{ title:'Product' }} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { totalItems } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = { Home: 'home', Browse: 'grid', Upload: 'cloud-upload', Cart: 'cart', Account: 'person' };
          return (
            <Ionicons
              name={focused ? icons[route.name] : `${icons[route.name]}-outline`}
              size={focused ? size + 2 : size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          paddingBottom: 6,
          paddingTop: 4,
          height: 60,
          shadowColor: '#6366f1',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 1 },
        tabBarItemStyle: { paddingVertical: 2 },
        headerStyle: { backgroundColor: '#1e1b4b' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.3 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}      options={{ title: 'Ceylon 3D', headerShown: false }} />
      <Tab.Screen name="Browse"  component={BrowseScreen}    options={{ title: 'Browse', headerShown: false }} />
      <Tab.Screen name="Upload"  component={STLUploadScreen} options={{ title: 'Upload STL' }} />
      <Tab.Screen name="Cart"    component={CartScreen}      options={{ title: 'Cart', headerShown: false, tabBarBadge: totalItems > 0 ? totalItems : undefined, tabBarBadgeStyle: { backgroundColor: '#ef4444', fontSize: 10, fontWeight: '800' } }} />
      <Tab.Screen name="Account" component={MyAccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle:{ backgroundColor:'#6366f1' }, headerTintColor:'#fff' }}>
    <Stack.Screen name="Login"    component={LoginScreen}    options={{ title:'Sign In' }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title:'Create Account' }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main"           component={MainTabs} />
            <Stack.Screen name="ProductDetail"  component={ProductDetailScreen} options={{ headerShown:true, title:'Product', headerStyle:{ backgroundColor:'#6366f1' }, headerTintColor:'#fff' }} />
            <Stack.Screen name="AdminStack"     component={AdminStack} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
