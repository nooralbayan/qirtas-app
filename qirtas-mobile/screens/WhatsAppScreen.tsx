import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MessageCircle, Phone, Send } from 'lucide-react-native';
import { API_BASE_URL } from '../api';

export default function WhatsAppScreen() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSend = async () => {
    if (!phone || !message) {
      setStatus({ type: 'error', text: 'الرجاء إدخال رقم الهاتف والرسالة' });
      return;
    }
    
    setLoading(true);
    setStatus({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/wa-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: 'success', text: 'تم إرسال الرسالة بنجاح' });
        setMessage('');
      } else {
        setStatus({ type: 'error', text: data.error || 'فشل الإرسال' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم' });
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <MessageCircle color="#25D366" size={32} />
            </View>
            <Text style={styles.headerTitle}>بوابة واتساب</Text>
            <Text style={styles.headerSubtitle}>إرسال رسائل سريعة لأولياء الأمور أو المعلمين</Text>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.card}>
            {status.text ? (
              <View style={[styles.statusBox, status.type === 'error' ? styles.statusError : styles.statusSuccess]}>
                <Text style={styles.statusText}>{status.text}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>رقم الهاتف</Text>
            <View style={styles.inputContainer}>
              <Phone color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="09X XXX XXXX"
                placeholderTextColor="#6b7280"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>

            <Text style={styles.inputLabel}>الرسالة</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor="#6b7280"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.sendBtnText}>إرسال الرسالة</Text>
                    <Send color="#fff" size={20} style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' },
  statusSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10b981' },
  statusText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  textAreaContainer: { height: 120, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16, height: '100%', fontFamily: 'sans-serif' },
  textArea: { flex: 1, color: '#fff', fontSize: 16, height: '100%', width: '100%', fontFamily: 'sans-serif' },
  sendBtn: { marginTop: 8, borderRadius: 12, overflow: 'hidden', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  sendGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
