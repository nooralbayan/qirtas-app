import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './index';

export const TOKEN_KEY = 'qirtas_auth_token';
export const USER_KEY = 'qirtas_user_data';

// Login for Admin/Staff
export async function loginUser(username, password) {
  // DEMO BYPASS
  if (username === 'demo' && password === 'demo') {
    const demoUser = { id: 'demo_id', username: 'demo', name: 'حساب تجريبي (مدير)', role: 'admin' };
    await AsyncStorage.setItem(TOKEN_KEY, 'demo_token_123');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    return { success: true, token: 'demo_token_123', user: demoUser };
  }

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
  // DEMO PARENT BYPASS
  if (enrollmentNumber === 'demo' && phone === 'demo') {
    const demoUser = { id: 'demo_parent_id', studentId: 'demo_student', name: 'حساب تجريبي (ولي أمر)', role: 'parent' };
    await AsyncStorage.setItem(TOKEN_KEY, 'demo_token_parent_123');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    return { success: true, token: 'demo_token_parent_123', user: demoUser };
  }

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
