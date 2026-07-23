import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, GraduationCap, School, Bell, ArrowLeft, TrendingUp, Calendar, Award, Wallet, CreditCard, Banknote, Clock, Megaphone, FileText } from 'lucide-react-native';
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

  // Stats calculation
  const studentCount = state.students?.filter((s: any) => !s.wasWithdrawn).length || 0;
  const teacherCount = state.teachers?.length || 0;
  let classCount = 0;
  Object.values(state.classRooms || {}).forEach((classes: any) => { classCount += classes.length; });

  const recentAnnouncements = (state.announcements || [])
    .filter((a: any) => a.target === 'الكل' || a.target === (isParent ? 'أولياء الأمور' : 'المعلمين'))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const totalCollected = (state.receipts || []).reduce((acc: number, r: any) => acc + (Number(r.paidAmount) || Number(r.amount) || 0), 0);
  const totalExpenses = (state.expenses || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'طاب مساؤك';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f1f5f9', '#e2e8f0']} style={StyleSheet.absoluteFillObject} />
      
      {/* Background Decor */}
      <View style={[styles.bgCircle, { top: -100, right: -100, backgroundColor: 'rgba(79, 70, 229, 0.1)' }]} />
      <View style={[styles.bgCircle, { bottom: 100, left: -100, backgroundColor: 'rgba(14, 165, 233, 0.1)' }]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.title}>{user?.name || 'مرحباً بك'}</Text>
              <Text style={styles.schoolName}>{state.schoolName || 'نظام قرطاس'}</Text>
            </View>
            <View style={styles.profileAvatar}>
              <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.avatarGradient}>
                <Text style={styles.profileAvatarText}>{user?.name ? user.name.charAt(0) : 'أ'}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {isParent ? (() => {
            const childId = user?.studentId;
            const childEvals = (state.studentEvaluations || []).filter((e: any) => e.studentId === childId || e.studentId === Number(childId));
            const childBehaviors = (state.behaviorRecords || []).filter((b: any) => b.studentId === childId || b.studentId === Number(childId));
            const totalBehaviorPoints = childBehaviors.reduce((sum: number, b: any) => sum + (Number(b.points) || 0), 0);

            return (
            <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.parentCard}>
                <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.parentCardGradient}>
                  <View style={styles.parentCardHeader}>
                    <GraduationCap color="#38bdf8" size={32} />
                    <View>
                      <Text style={styles.parentCardTitle}>متابعة الأبناء</Text>
                      <Text style={styles.parentCardSub}>السجل الأكاديمي المباشر</Text>
                    </View>
                  </View>
                  
                  <View style={styles.parentStatsRow}>
                    <View style={styles.parentStatItem}>
                      <Award color="#cbd5e1" size={20} />
                      <Text style={[styles.parentStatValue, { color: totalBehaviorPoints >= 0 ? '#10b981' : '#ef4444', fontSize: 20 }]}>{totalBehaviorPoints > 0 ? '+' : ''}{totalBehaviorPoints}</Text>
                      <Text style={styles.parentStatLabel}>نقاط السلوك</Text>
                    </View>
                    <View style={styles.parentStatItem}>
                      <TrendingUp color="#cbd5e1" size={20} />
                      <Text style={[styles.parentStatValue, { color: '#38bdf8', fontSize: 20 }]}>{childEvals.length}</Text>
                      <Text style={styles.parentStatLabel}>التقييمات</Text>
                    </View>
                    <View style={styles.parentStatItem}>
                      <Calendar color="#cbd5e1" size={20} />
                      <Text style={[styles.parentStatValue, { color: '#f59e0b', fontSize: 20 }]}>{childBehaviors.length}</Text>
                      <Text style={styles.parentStatLabel}>السجلات</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
            );
          })() : (
            // ADMIN DASHBOARD
            <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              
              {(role === 'admin' || role === 'accountant') && (
                <>
                  <View style={styles.rowGrid}>
                    <TouchableOpacity onPress={() => navigation.navigate('Receipts')} style={{ width: '48%' }}>
                      <LinearGradient colors={['#10b981', '#059669']} style={[styles.statCardHalf, { width: '100%' }]}>
                        <View style={styles.statIconBoxSmall}><Banknote color="#fff" size={20} /></View>
                        <Text style={styles.statValueLight}>{totalCollected}</Text>
                        <Text style={styles.statLabelLight}>الإيرادات (د.ل)</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Expenses')} style={{ width: '48%' }}>
                      <LinearGradient colors={['#ef4444', '#dc2626']} style={[styles.statCardHalf, { width: '100%' }]}>
                        <View style={styles.statIconBoxSmall}><CreditCard color="#fff" size={20} /></View>
                        <Text style={styles.statValueLight}>{totalExpenses}</Text>
                        <Text style={styles.statLabelLight}>المصروفات (د.ل)</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.statCardFull} start={{x:0, y:0}} end={{x:1, y:1}}>
                    <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}><Wallet color="#10b981" size={28} /></View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statLabelLight}>السيولة الصافية</Text>
                      <Text style={[styles.statValueLight, { color: netProfit >= 0 ? '#34d399' : '#f87171' }]}>{netProfit} د.ل</Text>
                    </View>
                  </LinearGradient>
                </>
              )}

              <TouchableOpacity onPress={() => navigation.navigate('أبنائي')}>
                <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.statCardFull} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <View style={styles.statIconBox}><GraduationCap color="#fff" size={28} /></View>
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statLabelLight}>إجمالي الطلاب المقيّدين</Text>
                    <Text style={styles.statValueLight}>{studentCount}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.rowGrid}>
                <TouchableOpacity onPress={() => navigation.navigate('Teachers')} style={{ width: '48%' }}>
                  <LinearGradient colors={['#0ea5e9', '#0284c7']} style={[styles.statCardHalf, { width: '100%' }]}>
                    <View style={styles.statIconBoxSmall}><Users color="#fff" size={20} /></View>
                    <Text style={styles.statValueLight}>{teacherCount}</Text>
                    <Text style={styles.statLabelLight}>الكادر التعليمي</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={{ width: '48%' }}>
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={[styles.statCardHalf, { width: '100%' }]}>
                    <View style={styles.statIconBoxSmall}><School color="#fff" size={20} /></View>
                    <Text style={styles.statValueLight}>{classCount}</Text>
                    <Text style={styles.statLabelLight}>الفصول الدراسية</Text>
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>
          )}

          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, { marginBottom: 32 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الوصول السريع</Text>
            </View>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity onPress={() => navigation.navigate('Attendance')} style={styles.quickAccessCard}>
                <View style={[styles.qaIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Clock color="#ef4444" size={24} />
                </View>
                <Text style={styles.qaText}>الغياب والحضور</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Results')} style={styles.quickAccessCard}>
                <View style={[styles.qaIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Award color="#f59e0b" size={24} />
                </View>
                <Text style={styles.qaText}>النتائج المدرسية</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Announcements')} style={styles.quickAccessCard}>
                <View style={[styles.qaIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Megaphone color="#8b5cf6" size={24} />
                </View>
                <Text style={styles.qaText}>الإعلانات</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('التقارير')} style={styles.quickAccessCard}>
                <View style={[styles.qaIconContainer, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <FileText color="#38bdf8" size={24} />
                </View>
                <Text style={styles.qaText}>التقارير</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.sectionHeader}>
              <ArrowLeft color="#94a3b8" size={24} />
              <Text style={styles.sectionTitle}>أحدث التعاميم</Text>
            </View>

            {recentAnnouncements.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Bell color="#94a3b8" size={32} />
                </View>
                <Text style={styles.emptyStateText}>لا توجد تعاميم جديدة في الوقت الحالي</Text>
              </View>
            ) : (
              recentAnnouncements.map((ann: any, index: number) => (
                <View key={ann.id} style={[styles.announcementCard, { marginTop: index === 0 ? 0 : 16 }]}>
                  <View style={styles.announcementHeader}>
                    <View style={[styles.badge, { backgroundColor: ann.priority === 'عاجل' ? '#fee2e2' : '#f1f5f9' }]}>
                      <Text style={[styles.badgeText, { color: ann.priority === 'عاجل' ? '#ef4444' : '#64748b' }]}>{ann.priority}</Text>
                    </View>
                    <Text style={styles.announcementDate}>{new Date(ann.date).toLocaleDateString('ar-SA')}</Text>
                  </View>
                  <Text style={styles.announcementTitle}>{ann.title}</Text>
                  <Text style={styles.announcementBody} numberOfLines={3}>{ann.content}</Text>
                </View>
              ))
            )}
          </Animated.View>
          
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
    marginBottom: 32,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff',
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarGradient: { flex: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  greeting: { fontSize: 15, color: '#64748b', textAlign: 'right', marginBottom: 4, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', textAlign: 'right', letterSpacing: -0.5 },
  schoolName: { fontSize: 16, color: '#4f46e5', textAlign: 'right', fontWeight: 'bold', marginTop: 2 },
  
  // Stats
  statsGrid: { marginBottom: 36 },
  statCardFull: {
    flexDirection: 'row-reverse', alignItems: 'center',
    padding: 24, borderRadius: 28, marginBottom: 16,
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  statIconBox: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 20,
  },
  statTextContainer: { flex: 1, alignItems: 'flex-start' },
  statLabelLight: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 4, fontWeight: '600' },
  statValueLight: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  
  rowGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statCardHalf: {
    width: (width - 64) / 2, padding: 24, borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  statIconBoxSmall: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  
  // Parent Card
  parentCard: { marginBottom: 36, borderRadius: 28, overflow: 'hidden', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  parentCardGradient: { padding: 24 },
  parentCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  parentCardTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  parentCardSub: { fontSize: 14, color: '#94a3b8', textAlign: 'right', marginTop: 4 },
  parentStatsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16 },
  parentStatItem: { alignItems: 'center' },
  parentStatValue: { color: '#e2e8f0', marginTop: 8, fontWeight: 'bold', fontSize: 15 },
  parentStatLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  // Quick Access
  quickAccessGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickAccessCard: { width: (width - 64) / 2, backgroundColor: '#fff', padding: 16, borderRadius: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  qaIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  qaText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyStateText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  
  // Announcement
  announcementCard: {
    backgroundColor: '#fff', padding: 24, borderRadius: 24,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  announcementHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  announcementDate: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  announcementTitle: { fontSize: 19, fontWeight: 'bold', color: '#0f172a', textAlign: 'right', marginBottom: 10 },
  announcementBody: { fontSize: 16, color: '#475569', textAlign: 'right', lineHeight: 26 },
});
