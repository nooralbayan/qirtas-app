import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Users, Phone, BookOpen, Plus, ArrowRight } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function TeachersScreen({ navigation }: any) {
  const { state } = useAppContext();
  const teachers = state?.teachers || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowRight color="#fff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>الكادر التعليمي</Text>
            <Text style={styles.headerSubtitle}>{teachers.length} معلم وموظف</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {teachers.map((teacher: any, index: number) => (
            <BlurView intensity={30} tint="dark" style={styles.teacherCard} key={teacher.id || index}>
              <View style={styles.teacherHeader}>
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherName}>{teacher.name}</Text>
                  <Text style={styles.teacherRole}>{teacher.subject || 'معلم عام'}</Text>
                </View>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{teacher.name.charAt(0)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.teacherDetails}>
                <View style={styles.detailItem}>
                  <Phone color="#94a3b8" size={16} />
                  <Text style={styles.detailText}>{teacher.phone || 'غير متوفر'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <BookOpen color="#94a3b8" size={16} />
                  <Text style={styles.detailText}>{teacher.type || 'أساسي'}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>عرض الملف</Text>
              </TouchableOpacity>
            </BlurView>
          ))}

          {teachers.length === 0 && (
            <View style={styles.emptyState}>
              <Users color="#475569" size={48} />
              <Text style={styles.emptyText}>لا يوجد معلمين مسجلين</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#4f46e5', '#3b82f6']}
            style={styles.fabGradient}
          >
            <Plus color="#fff" size={24} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#38bdf8', fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  teacherCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  teacherHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  teacherInfo: { flex: 1, alignItems: 'flex-end', marginRight: 16 },
  teacherName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  teacherRole: { fontSize: 14, color: '#94a3b8' },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(59, 130, 246, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#60a5fa' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  teacherDetails: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16 },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  detailText: { color: '#cbd5e1', fontSize: 14 },
  actionButton: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 60, height: 60, borderRadius: 30, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});
