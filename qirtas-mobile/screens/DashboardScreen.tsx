import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, GraduationCap, School, Bell, ArrowLeft } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { state, loading } = useAppContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!loading && state) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
      ]).start();
    }
  }, [loading, state]);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ marginTop: 16, color: '#9ca3af', fontFamily: 'sans-serif' }}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  const studentCount = state.students?.filter((s: any) => !s.wasWithdrawn).length || 0;
  const teacherCount = state.teachers?.length || 0;
  let classCount = 0;
  Object.values(state.classRooms || {}).forEach((classes: any) => {
    classCount += classes.length;
  });

  const recentAnnouncements = (state.announcements || [])
    .filter((a: any) => a.target === 'الكل' || a.target === 'أولياء الأمور')
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'طاب مساؤك';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.title}>{state.schoolName || 'نظام قرطاس'}</Text>
            </View>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>أ</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statCardFull}>
              <View style={styles.statIconBox}><GraduationCap color="#fff" size={24} /></View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabelLight}>إجمالي الطلاب</Text>
                <Text style={styles.statValueLight}>{studentCount}</Text>
              </View>
            </LinearGradient>

            <View style={styles.rowGrid}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.statCardHalf}>
                <View style={styles.statIconBox}><Users color="#fff" size={20} /></View>
                <Text style={styles.statValueLight}>{teacherCount}</Text>
                <Text style={styles.statLabelLight}>المعلمين</Text>
              </LinearGradient>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statCardHalf}>
                <View style={styles.statIconBox}><School color="#fff" size={20} /></View>
                <Text style={styles.statValueLight}>{classCount}</Text>
                <Text style={styles.statLabelLight}>الفصول</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.sectionHeader}>
              <ArrowLeft color="#9ca3af" size={20} />
              <Text style={styles.sectionTitle}>آخر التعاميم</Text>
            </View>

            {recentAnnouncements.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell color="#cbd5e1" size={48} />
                <Text style={styles.emptyStateText}>لا توجد إعلانات حالية</Text>
              </View>
            ) : (
              recentAnnouncements.map((ann: any, index: number) => (
                <View key={ann.id} style={[styles.announcementCard, { marginTop: index === 0 ? 0 : 16 }]}>
                  <View style={styles.announcementHeader}>
                    <View style={[styles.badge, { backgroundColor: ann.priority === 'عاجل' ? '#fee2e2' : '#e0f2fe' }]}>
                      <Text style={[styles.badgeText, { color: ann.priority === 'عاجل' ? '#ef4444' : '#0284c7' }]}>{ann.priority}</Text>
                    </View>
                    <Text style={styles.announcementDate}>{new Date(ann.date).toLocaleDateString('ar-SA')}</Text>
                  </View>
                  <Text style={styles.announcementTitle}>{ann.title}</Text>
                  <Text style={styles.announcementBody} numberOfLines={2}>{ann.content}</Text>
                </View>
              ))
            )}
          </Animated.View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 24 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  profileAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#f59e0b' },
  greeting: { fontSize: 16, color: '#64748b', textAlign: 'right', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', textAlign: 'right', letterSpacing: -0.5 },
  statsGrid: { marginBottom: 32 },
  statCardFull: {
    flexDirection: 'row-reverse', alignItems: 'center',
    padding: 24, borderRadius: 24, marginBottom: 16,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  statIconBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 16,
  },
  statTextContainer: { flex: 1, alignItems: 'flex-start' },
  statLabelLight: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontWeight: '500' },
  statValueLight: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  rowGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statCardHalf: {
    width: (width - 64) / 2, padding: 20, borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyStateText: { marginTop: 16, fontSize: 16, color: '#9ca3af', fontWeight: '500' },
  announcementCard: {
    backgroundColor: '#fff', padding: 20, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  announcementHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  announcementDate: { fontSize: 13, color: '#94a3b8' },
  announcementTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'right', marginBottom: 8 },
  announcementBody: { fontSize: 15, color: '#475569', textAlign: 'right', lineHeight: 24 },
});
