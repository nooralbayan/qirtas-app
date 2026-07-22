import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home, Users, CalendarDays, Settings, BarChart, MessageCircle } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import StudentsListScreen from '../screens/StudentsListScreen';
import TimetableScreen from '../screens/TimetableScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import WhatsAppScreen from '../screens/WhatsAppScreen';
import { useAppContext } from '../context/AppContext';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={70} tint="light" style={styles.tabBarBlur}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let IconComponent;
          if (route.name === 'الرئيسية') IconComponent = Home;
          else if (route.name === 'الطلاب' || route.name === 'أبنائي') IconComponent = Users;
          else if (route.name === 'الجدول') IconComponent = CalendarDays;
          else if (route.name === 'التقارير') IconComponent = BarChart;
          else if (route.name === 'واتساب') IconComponent = MessageCircle;
          else if (route.name === 'الإعدادات') IconComponent = Settings;
          else IconComponent = Home;

          const color = isFocused ? '#4f46e5' : '#94a3b8';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemFocused]}
            >
              <IconComponent color={color} size={24} strokeWidth={isFocused ? 2.5 : 2} />
              {isFocused && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function BottomTabNavigator() {
  const { user } = useAppContext();
  const role = user?.role || 'admin';
  const isParent = role === 'parent';

  return (
    <Tab.Navigator
      initialRouteName="الرئيسية"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="الإعدادات" component={SettingsScreen} />
      
      {!isParent && (
        <Tab.Screen name="واتساب" component={WhatsAppScreen} />
      )}
      
      {!isParent && (
        <Tab.Screen name="التقارير" component={ReportsScreen} />
      )}

      <Tab.Screen name="الجدول" component={TimetableScreen} />
      
      <Tab.Screen name={isParent ? "أبنائي" : "الطلاب"} component={StudentsListScreen} />
      
      <Tab.Screen name="الرئيسية" component={DashboardScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    width: width - 32,
    left: 16,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tabBarBlur: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItemFocused: {
    transform: [{ scale: 1.1 }],
  },
  indicator: {
    position: 'absolute',
    bottom: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4f46e5',
  },
});
