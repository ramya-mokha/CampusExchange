import React, { useContext } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';

// Import Context
import { AuthProvider, AuthContext } from './context/AuthContext';
import { THEME } from './config';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import BrowseScreen from './screens/BrowseScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import AddProductScreen from './screens/AddProductScreen';
import WishlistScreen from './screens/WishlistScreen';
import ChatsScreen from './screens/ChatsScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigation
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: THEME.background }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// App Bottom Tabs Navigation
function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.cardBg,
          borderTopWidth: 1,
          borderTopColor: THEME.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          let emoji = '📦';
          if (route.name === 'Browse') emoji = '🔍';
          else if (route.name === 'Wishlist') emoji = '❤️';
          else if (route.name === 'Post Item') emoji = '➕';
          else if (route.name === 'Chats') emoji = '💬';
          else if (route.name === 'Profile') emoji = '👤';
          return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
        },
      })}
    >
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Post Item" component={AddProductScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Core App Navigation
function MainNavigator() {
  const { user, token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>Campus Exchange</Text>
        <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: THEME.background }
        }}
      >
        {token && user ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="MainTabs" component={AppTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          </>
        ) : (
          // Unauthenticated Stack
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 1,
  },
});
