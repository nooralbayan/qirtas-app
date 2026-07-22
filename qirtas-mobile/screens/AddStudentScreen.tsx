import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Hash, ChevronRight, Save, BookOpen, GraduationCap } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { updateState } from '../api';

export default function AddStudentScreen({ navigation }: any) {
  const { state, refreshData } = useAppContext();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    nationalId: '',
    enrollmentNumber: '',
    grade: '',
    classRoom: ''
  });

  const handleSave = async () => {
    if (!form.name || !form.nationalId || !form.enrollmentNumber || !form.grade || !form.classRoom) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    
    // Create new student object
    const newStudent = {
      id: Date.now(),
      _id: Date.now().toString(),
      name: form.name,
      nationalId: form.nationalId,
      enrollmentNumber: form.enrollmentNumber,
      grade: form.grade,
      classRoom: form.classRoom,
      wasWithdrawn: false,
      totalFees: 0,
      createdAt: new Date().toISOString()
    };

    const currentStudents = state?.students || [];
    const updatedStudents = [...currentStudents, newStudent];

    // Push to server
    const res = await updateState('students', updatedStudents);
    
    setLoading(false);
    
    if (res.success) {
      await refreshData();
      Alert.alert('نجاح', 'تم تسجيل الطالب بنجاح!', [
        { text: 'حسناً', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('خطأ', 'فشل في حفظ البيانات: ' + (res.error || 'حدث خطأ غير معروف'));
    }
  };

  const InputField = ({ icon: Icon, placeholder, value, onChangeText, keyboardType = 'default' }: any) => (
    <View style={styles.inputContainer}>
      <Icon color="#94a3b8" size={20} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        textAlign="right"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f1f5f9', '#e2e8f0']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronRight color="#4f46e5" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>تسجيل طالب جديد</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              
              <Text style={styles.sectionTitle}>البيانات الأساسية</Text>
              
              <InputField 
                icon={User} 
                placeholder="اسم الطالب الرباعي" 
                value={form.name} 
                onChangeText={(text: string) => setForm({...form, name: text})} 
              />
              
              <InputField 
                icon={Hash} 
                placeholder="الرقم الوطني" 
                value={form.nationalId} 
                onChangeText={(text: string) => setForm({...form, nationalId: text})} 
                keyboardType="numeric"
              />
              
              <InputField 
                icon={Hash} 
                placeholder="رقم القيد (للتسجيل)" 
                value={form.enrollmentNumber} 
                onChangeText={(text: string) => setForm({...form, enrollmentNumber: text})} 
                keyboardType="numeric"
              />

              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>البيانات الأكاديمية</Text>
              
              <InputField 
                icon={GraduationCap} 
                placeholder="الصف الدراسي (مثال: الأول ابتدائي)" 
                value={form.grade} 
                onChangeText={(text: string) => setForm({...form, grade: text})} 
              />
              
              <InputField 
                icon={BookOpen} 
                placeholder="الفصل (مثال: أ)" 
                value={form.classRoom} 
                onChangeText={(text: string) => setForm({...form, classRoom: text})} 
              />
              
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSave} 
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4f46e5', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.saveBtnText}>حفظ وتأكيد البيانات</Text>
                      <Save color="#fff" size={20} style={{ marginLeft: 12 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
            </View>
          </ScrollView>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#64748b', marginBottom: 16, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#0f172a', fontSize: 16, height: '100%', fontFamily: 'sans-serif' },
  saveBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  saveBtnGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
