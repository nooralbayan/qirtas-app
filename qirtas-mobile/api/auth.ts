import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './index';

export const TOKEN_KEY = 'qirtas_auth_token';
export const USER_KEY = 'qirtas_user_data';

// Login for Admin/Staff
export async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    }
    
    return { success: false, error: data.error || 'فشل تسجيل الدخول' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}

// Login for Parents
export async function loginParent(enrollmentNumber, phone) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/parent-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enrollmentNumber, phone }),
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    }
    
    return { success: false, error: data.error || 'فشل تسجيل الدخول كولي أمر' };
  } catch (error) {
    console.error('Parent Login error:', error);
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}

export async function logoutUser() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getAuthToken() {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function getCurrentUser() {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}
