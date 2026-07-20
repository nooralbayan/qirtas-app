import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import StudentsListScreen from '../screens/StudentsListScreen';
import TimetableScreen from '../screens/TimetableScreen';

const Tab = createBottomTabNavigator();

// Placeholder components for the other tabs until we build them
const PlaceholderScreen = () => null;

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'الرئيسية') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'الطلاب') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'الجدول') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'الإعدادات') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#d97706',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'System',
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="الإعدادات" component={PlaceholderScreen} />
      <Tab.Screen name="الجدول" component={TimetableScreen} />
      <Tab.Screen name="الطلاب" component={StudentsListScreen} />
      <Tab.Screen name="الرئيسية" component={DashboardScreen} />
    </Tab.Navigator>
  );
}
