import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import AddStudentScreen from './screens/AddStudentScreen';
import TeachersScreen from './screens/TeachersScreen';
import ReceiptsScreen from './screens/ReceiptsScreen';
import ExpensesScreen from './screens/ExpensesScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import ResultsScreen from './screens/ResultsScreen';
import AnnouncementsScreen from './screens/AnnouncementsScreen';
import ClassroomsScreen from './screens/ClassroomsScreen';
import PayrollScreen from './screens/PayrollScreen';
import WithdrawnScreen from './screens/WithdrawnScreen';
import SubjectsScreen from './screens/SubjectsScreen';
import UsersScreen from './screens/UsersScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import RecycleBinScreen from './screens/RecycleBinScreen';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import { AppProvider, useAppContext } from './context/AppContext';

// Force RTL layout
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token, loading } = useAppContext();

  // If AppContext is loading the initial state/auth, show a loader
  if (loading && token === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="AddStudent" component={AddStudentScreen} />
            <Stack.Screen name="Teachers" component={TeachersScreen} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
            <Stack.Screen name="Classrooms" component={ClassroomsScreen} />
            <Stack.Screen name="Payroll" component={PayrollScreen} />
            <Stack.Screen name="Withdrawn" component={WithdrawnScreen} />
            <Stack.Screen name="Subjects" component={SubjectsScreen} />
            <Stack.Screen name="Users" component={UsersScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="RecycleBin" component={RecycleBinScreen} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
