import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Easing, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LogIn, User, Lock, Phone, Hash } from 'lucide-react-native';
import { loginUser, loginParent } from '../api/auth';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { checkAuth } = useAppContext();
  
  // State
  const [activeTab, setActiveTab] = useState<'admin' | 'parent'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current; // 0 for Admin, 1 for Parent

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.exp), useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const switchTab = (tab: 'admin' | 'parent') => {
    setActiveTab(tab);
    setError('');
    Animated.spring(tabSlideAnim, {
      toValue: tab === 'admin' ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
      tension: 50
    }).start();
  };

  const handleLogin = async () => {
    setError('');
    
    if (activeTab === 'admin' && (!username || !password)) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    if (activeTab === 'parent' && (!enrollment || !phone)) {
      setError('الرجاء إدخال رقم القيد ورقم الهاتف');
      return;
    }

    setLoading(true);
    let result;
    
    if (activeTab === 'admin') {
      result = await loginUser(username, password);
    } else {
      result = await loginParent(enrollment, phone);
    }
    
    setLoading(false);
    
    if (result.success) {
      await checkAuth();
    } else {
      setError(result.error || 'فشل تسجيل الدخول');
    }
  };

  const tabIndicatorLeft = tabSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%']
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Dynamic Gradient Background */}
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#0f172a']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Animated Glowing Orbs */}
        <Animated.View style={[styles.glowOrb, { top: -height * 0.1, right: -width * 0.2, backgroundColor: 'rgba(56, 189, 248, 0.25)', transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.glowOrb, { bottom: -height * 0.1, left: -width * 0.2, backgroundColor: 'rgba(99, 102, 241, 0.25)', transform: [{ scale: pulseAnim }] }]} />

        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient colors={['#38bdf8', '#4f46e5']} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.logoText}>ش</Text>
                </LinearGradient>
              </View>
              <Text style={styles.title}>قرطاس</Text>
              <Text style={styles.subtitle}>بوابتك التعليمية الذكية</Text>
            </View>

            {/* Glassmorphism Card */}
            <BlurView intensity={40} tint="dark" style={styles.glassCard}>
              
              {/* Tabs */}
              <View style={styles.tabContainer}>
                <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
                <TouchableOpacity style={styles.tabButton} onPress={() => switchTab('admin')} activeOpacity={0.8}>
                  <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>الإدارة والمعلمين</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton} onPress={() => switchTab('parent')} activeOpacity={0.8}>
                  <Text style={[styles.tabText, activeTab === 'parent' && styles.tabTextActive]}>أولياء الأمور</Text>
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <View style={styles.formContainer}>
                {activeTab === 'admin' ? (
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.inputContainer}>
                      <User color="#94a3b8" size={20} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="اسم المستخدم"
                        placeholderTextColor="#64748b"
                        value={username}
                        onChangeText={setUsername}
                        textAlign="right"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="كلمة المرور"
                        placeholderTextColor="#64748b"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        textAlign="right"
                      />
                    </View>
                  </Animated.View>
                ) : (
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.inputContainer}>
                      <Hash color="#94a3b8" size={20} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="رقم القيد"
                        placeholderTextColor="#64748b"
                        value={enrollment}
                        onChangeText={setEnrollment}
                        keyboardType="numeric"
                        textAlign="right"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Phone color="#94a3b8" size={20} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="رقم هاتف الأب أو الأم"
                        placeholderTextColor="#64748b"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        textAlign="right"
                      />
                    </View>
                  </Animated.View>
                )}
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.9} disabled={loading}>
                <LinearGradient
                  colors={['#4f46e5', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>دخول آمن</Text>
                      <LogIn color="#fff" size={20} style={{ marginLeft: 12 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
            </BlurView>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowOrb: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    filter: 'blur(60px)', 
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  glassCard: {
    borderRadius: 32,
    padding: 24,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    marginBottom: 28,
    position: 'relative',
    padding: 4,
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    minHeight: 140,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
    fontFamily: 'sans-serif',
  },
  loginBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  loginGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#f87171',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
