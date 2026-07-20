import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = () => {
    // Basic simulation for now
    if (username && password) {
      navigation.replace('Main'); // Navigate to the bottom tabs
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fallback majestic background color and elements */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>قرطاس</Text>
          <Text style={styles.subtitle}>النظام المدرسي المتكامل</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.loginText}>تسجيل الدخول</Text>
          
          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم"
            placeholderTextColor="#9ca3af"
            value={username}
            onChangeText={setUsername}
            textAlign="right"
          />
          
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>دخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Majestic deep slate
  },
  bgGlow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(217, 119, 6, 0.15)', // Gold glow
  },
  bgGlow2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(37, 99, 235, 0.15)', // Blue glow
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#d97706', // Gold
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: '#d97706',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
