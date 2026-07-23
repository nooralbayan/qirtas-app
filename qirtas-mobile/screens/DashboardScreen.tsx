import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, GraduationCap, School, Bell, ArrowLeft, TrendingUp, Calendar, Award, Wallet, CreditCard, Banknote, Clock, Megaphone, FileText, Settings, Database, Trash2, PieChart } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { state, loading, user } = useAppContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (!loading && state) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
      ]).start();
    }
  }, [loading, state]);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 16, color: '#94a3b8', fontFamily: 'sans-serif', fontWeight: 'bold' }}>جاري تهيئة لوحة التحكم...</Text>
      </View>
    );
  }

  const role = user?.role || 'admin';
  const isParent = role === 'parent';
  const isTeacher = role === 'teacher';

  // Stats calculation
  const studentCount = state.students?.filter((s: any) => !s.wasWithdrawn).length || 0;
  const teacherCount = state.teachers?.length || 0;
  let classCount = 0;
  Object.values(state.classRooms || {}).forEach((classes: any) => { classCount += classes.length; });

  const totalCollected = (state.receipts || []).reduce((acc: number, r: any) => acc + (Number(r.paidAmount) || Number(r.amount) || 0), 0);
  const totalExpenses = (state.expenses || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'طاب مساؤك';
  };

  const menuItems = [
    { id: 'Students', label: 'الطلاب', icon: GraduationCap, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)', roles: ['admin', 'student_affairs', 'viewer'] },
    { id: 'Classrooms', label: 'الفصول', icon: School, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', roles: ['admin', 'student_affairs', 'viewer'] },
    { id: 'Teachers', label: 'المعلمون', icon: Users, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', roles: ['admin', 'hr', 'viewer'] },
    { id: 'Attendance', label: 'الغياب', icon: Clock, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', roles: ['admin', 'student_affairs', 'hr', 'viewer'] },
    { id: 'Timetable', label: 'الجدول', icon: Calendar, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', roles: ['admin', 'student_affairs', 'viewer'] },
    { id: 'Results', label: 'النتائج', icon: Award, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', roles: ['admin', 'student_affairs', 'viewer'] },
    { id: 'Receipts', label: 'السندات', icon: Banknote, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', roles: ['admin', 'accountant', 'viewer'] },
    { id: 'Expenses', label: 'المصروفات', icon: CreditCard, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', roles: ['admin', 'accountant', 'viewer'] },
    { id: 'Payroll', label: 'الرواتب', icon: Wallet, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', roles: ['admin', 'hr', 'accountant', 'viewer'] },
    { id: 'Announcements', label: 'الإعلانات', icon: Megaphone, color: '#d946ef', bg: 'rgba(217, 70, 239, 0.1)', roles: ['admin', 'student_affairs', 'hr', 'viewer'] },
    { id: 'Reports', label: 'التقارير', icon: FileText, color: '#0891b2', bg: 'rgba(8, 145, 178, 0.1)', roles: ['admin', 'accountant', 'viewer'] },
    { id: 'Analytics', label: 'الإحصائيات', icon: PieChart, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', roles: ['admin', 'accountant', 'viewer'] },
    { id: 'Withdrawn', label: 'المنسحبون', icon: TrendingUp, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', roles: ['admin', 'student_affairs', 'viewer'] },
    { id: 'Users', label: 'المستخدمين', icon: Database, color: '#475569', bg: 'rgba(71, 85, 105, 0.1)', roles: ['admin'] },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFillObject} />
      
      {/* Background Decor */}
      <View style={[styles.bgCircle, { top: -100, right: -100, backgroundColor: 'rgba(79, 70, 229, 0.08)' }]} />
      <View style={[styles.bgCircle, { bottom: 100, left: -100, backgroundColor: 'rgba(14, 165, 233, 0.08)' }]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.title}>{user?.name || 'مرحباً بك'}</Text>
              <Text style={styles.schoolName}>{state.schoolName || 'نظام إدارة المدرسة'}</Text>
            </View>
            <View style={styles.profileAvatar}>
              <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.avatarGradient}>
                <Text style={styles.profileAvatarText}>{user?.name ? user.name.charAt(0) : 'ش'}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {isParent ? (
             <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Parent view remains relatively simple as per original */}
                <View style={styles.parentCard}>
                  <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.parentCardGradient}>
                    <View style={styles.parentCardHeader}>
                      <GraduationCap color="#38bdf8" size={32} />
                      <View>
                        <Text style={styles.parentCardTitle}>متابعة الأبناء</Text>
                        <Text style={styles.parentCardSub}>السجل الأكاديمي المباشر</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
             </Animated.View>
          ) : (
            <>
              {/* ADMIN DASHBOARD KPI */}
              <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {(role === 'admin' || role === 'accountant') && (
                  <View style={styles.kpiContainer}>
                    <LinearGradient colors={['#0056b3', '#003d82']} style={styles.kpiCard} start={{x:0, y:0}} end={{x:1, y:1}}>
                      <View>
                        <Text style={styles.kpiLabel}>الإيرادات</Text>
                        <Text style={styles.kpiValue}>{totalCollected} <Text style={{fontSize: 14}}>د.ل</Text></Text>
                      </View>
                      <View style={{opacity: 0.5}}><Banknote color="#fff" size={32} /></View>
                    </LinearGradient>

                    <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.kpiCard} start={{x:0, y:0}} end={{x:1, y:1}}>
                      <View>
                        <Text style={styles.kpiLabel}>المصروفات</Text>
                        <Text style={styles.kpiValue}>{totalExpenses} <Text style={{fontSize: 14}}>د.ل</Text></Text>
                      </View>
                      <View style={{opacity: 0.5}}><CreditCard color="#fff" size={32} /></View>
                    </LinearGradient>

                    <LinearGradient colors={['#10b981', '#059669']} style={styles.kpiCard} start={{x:0, y:0}} end={{x:1, y:1}}>
                      <View>
                        <Text style={styles.kpiLabel}>السيولة الصافية</Text>
                        <Text style={styles.kpiValue}>{netProfit} <Text style={{fontSize: 14}}>د.ل</Text></Text>
                      </View>
                      <View style={{opacity: 0.5}}><Wallet color="#fff" size={32} /></View>
                    </LinearGradient>
                  </View>
                )}
                
                <View style={styles.kpiContainer}>
                   <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.kpiCard} start={{x:0, y:0}} end={{x:1, y:1}}>
                      <View>
                        <Text style={styles.kpiLabel}>الطلاب المقيدين</Text>
                        <Text style={styles.kpiValue}>{studentCount}</Text>
                      </View>
                      <View style={{opacity: 0.5}}><GraduationCap color="#fff" size={32} /></View>
                    </LinearGradient>
                </View>

              </Animated.View>

              {/* GRID MENU */}
              <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, { marginBottom: 32 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>الوصول السريع</Text>
                </View>
                <View style={styles.menuGrid}>
                  {menuItems.filter(item => {
                      if (role === 'admin' || role === 'viewer') return true;
                      if (user?.permissions) return user.permissions.includes(item.id.toLowerCase());
                      return item.roles.includes(role);
                  }).map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.menuCard}
                        onPress={() => navigation.navigate(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                          <Icon color={item.color} size={28} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, filter: 'blur(50px)' },
  scroll: { padding: 24 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarGradient: { flex: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  greeting: { fontSize: 15, color: '#64748b', textAlign: 'right', marginBottom: 4, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', textAlign: 'right', letterSpacing: -0.5 },
  schoolName: { fontSize: 16, color: '#4f46e5', textAlign: 'right', fontWeight: 'bold', marginTop: 2 },
  
  // KPI
  statsGrid: { marginBottom: 24 },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  kpiLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 },
  kpiValue: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'right' },

  // Grid Menu
  sectionHeader: { marginBottom: 16, alignItems: 'flex-end' },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  menuGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: -6 },
  menuCard: {
    width: '33.33%',
    padding: 6,
    alignItems: 'center',
  },
  menuIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },

  parentCard: { marginBottom: 36, borderRadius: 28, overflow: 'hidden', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  parentCardGradient: { padding: 24 },
  parentCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  parentCardTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  parentCardSub: { fontSize: 14, color: '#94a3b8', textAlign: 'right', marginTop: 4 },
});
