import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home, Users, CalendarDays, Settings } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import StudentsListScreen from '../screens/StudentsListScreen';
import TimetableScreen from '../screens/TimetableScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Placeholder components for the other tabs until we build them
const PlaceholderScreen = () => <View style={{flex:1, backgroundColor:'#0f172a'}}/>;

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={60} tint="dark" style={styles.tabBarBlur}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

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
          else if (route.name === 'الطلاب') IconComponent = Users;
          else if (route.name === 'الجدول') IconComponent = CalendarDays;
          else if (route.name === 'الإعدادات') IconComponent = Settings;
          else IconComponent = Home;

          const color = isFocused ? '#f59e0b' : '#9ca3af';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemFocused]}
            >
              <IconComponent color={color} size={24} strokeWidth={isFocused ? 2.5 : 2} />
              {isFocused && (
                <View style={styles.indicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="الرئيسية"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="الإعدادات" component={PlaceholderScreen} />
      <Tab.Screen name="الجدول" component={TimetableScreen} />
      <Tab.Screen name="الطلاب" component={StudentsListScreen} />
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
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBarBlur: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
});
