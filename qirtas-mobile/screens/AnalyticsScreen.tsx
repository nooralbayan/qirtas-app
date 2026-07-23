import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, BarChart2, TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function AnalyticsScreen({ navigation }: any) {
  const { state, loading } = useAppContext();

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <BarChart2 color="#8b5cf6" size={48} />
      </View>
    );
  }

  const totalStudents = state.students?.length || 0;
  const totalTeachers = state.teachers?.length || 0;
  
  const totalRevenue = (state.receipts || []).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
  const totalExpenses = (state.expenses || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgCircle} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#0f172a" size={28} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>التقارير والإحصائيات</Text>
            <Text style={styles.subtitle}>نظرة عامة على أداء المدرسة</Text>
          </View>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الملخص المالي</Text>
          <View style={styles.statsGrid}>
            <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <TrendingUp color="#16a34a" size={24} />
              </View>
              <Text style={styles.statValue}>{totalRevenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
            </LinearGradient>
            <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <TrendingUp color="#dc2626" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
              <Text style={styles.statValue}>{totalExpenses.toLocaleString()}</Text>
              <Text style={styles.statLabel}>إجمالي المصروفات</Text>
            </LinearGradient>
          </View>
          <LinearGradient colors={['#ffffff', '#f8fafc']} style={[styles.statCard, { width: '100%', marginTop: 16 }]}>
             <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                <DollarSign color="#4f46e5" size={24} />
              </View>
              <Text style={[styles.statValue, { color: netIncome >= 0 ? '#16a34a' : '#dc2626' }]}>
                {netIncome.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>صافي الدخل</Text>
          </LinearGradient>
        </View>

        {/* Academic Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الملخص الأكاديمي</Text>
          <View style={styles.statsGrid}>
            <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Users color="#d97706" size={24} />
              </View>
              <Text style={styles.statValue}>{totalStudents}</Text>
              <Text style={styles.statLabel}>عدد الطلاب</Text>
            </LinearGradient>
            <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                <BookOpen color="#9333ea" size={24} />
              </View>
              <Text style={styles.statValue}>{totalTeachers}</Text>
              <Text style={styles.statLabel}>عدد المعلمين</Text>
            </LinearGradient>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(139, 92, 246, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#8b5cf6', fontWeight: 'bold', textAlign: 'right' },
  
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 16, textAlign: 'right' },
  
  statsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#fff'
  },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' }
});
