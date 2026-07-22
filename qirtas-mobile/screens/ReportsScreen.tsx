import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BarChart, TrendingUp, Users, DollarSign, Calendar, BookOpen, Star, AlertCircle } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { state, loading } = useAppContext();

  const renderStatCard = (icon: any, title: string, value: string, trend: string, isPositive: boolean) => (
    <BlurView intensity={40} tint="dark" style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.iconContainer}>{icon}</View>
        {trend ? (
          <Text style={[styles.trendText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
            {trend}
          </Text>
        ) : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </BlurView>
  );

  // Computations
  const stats = useMemo(() => {
    if (!state) return null;

    const students = state.students?.filter((s: any) => !s.wasWithdrawn).length || 0;
    
    // Revenue
    const totalRevenue = (state.receipts || []).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
    
    // Lessons
    const lessonsCount = state.lessonLogs?.length || 0;
    
    // Evaluations and Behaviors
    const evalsCount = (state.studentEvaluations?.length || 0) + (state.behaviorRecords?.length || 0);

    // Latest Activity (combine logs, receipts, announcements)
    let activities: any[] = [];
    
    (state.lessonLogs || []).forEach((log: any) => {
      activities.push({ id: log.id, title: `درس جديد: ${log.subject}`, date: new Date(log.date), type: 'lesson' });
    });
    
    (state.receipts || []).forEach((r: any) => {
      activities.push({ id: r.id, title: `إيصال مالي: ${r.amount} د.ل`, date: new Date(r.date), type: 'receipt' });
    });
    
    (state.behaviorRecords || []).forEach((b: any) => {
      activities.push({ id: b.id, title: `تحديث سلوك (${b.points > 0 ? '+' : ''}${b.points} نقطة)`, date: new Date(b.date), type: 'behavior' });
    });

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    const latestActivities = activities.slice(0, 5);

    // Monthly Chart for Receipts (last 6 months)
    const monthlyData = [0, 0, 0, 0, 0, 0];
    const monthLabels = ['', '', '', '', '', ''];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels[5 - i] = targetDate.toLocaleDateString('ar-SA', { month: 'short' });
      
      const sum = (state.receipts || []).filter((r: any) => {
        const d = new Date(r.date);
        return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
      }).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      
      monthlyData[5 - i] = sum;
    }

    const maxChartValue = Math.max(...monthlyData, 1); // prevent div by zero

    return { students, totalRevenue, lessonsCount, evalsCount, latestActivities, monthlyData, monthLabels, maxChartValue };
  }, [state]);

  if (loading || !stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'lesson': return <BookOpen color="#3b82f6" size={20} />;
      case 'receipt': return <DollarSign color="#10b981" size={20} />;
      case 'behavior': return <Star color="#f59e0b" size={20} />;
      default: return <AlertCircle color="#8b5cf6" size={20} />;
    }
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>التقارير والإحصائيات</Text>
            <Text style={styles.headerSubtitle}>نظرة فعلية على أداء النظام</Text>
          </View>

          <View style={styles.statsGrid}>
            {renderStatCard(<Users color="#f59e0b" size={24} />, 'الطلاب المقيّدين', stats.students.toString(), '', true)}
            {renderStatCard(<DollarSign color="#10b981" size={24} />, 'إجمالي الإيرادات (د.ل)', stats.totalRevenue.toLocaleString(), '', true)}
            {renderStatCard(<BookOpen color="#3b82f6" size={24} />, 'الدروس المسجلة', stats.lessonsCount.toString(), '', true)}
            {renderStatCard(<Star color="#8b5cf6" size={24} />, 'التقييمات والسلوك', stats.evalsCount.toString(), '', true)}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الإيرادات الشهرية</Text>
            </View>
            
            <BlurView intensity={30} tint="dark" style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {stats.monthlyData.map((val: number, index: number) => {
                  const heightPerc = (val / stats.maxChartValue) * 100;
                  return (
                    <View key={index} style={styles.barWrapper}>
                      <View style={[styles.bar, { height: `${Math.max(heightPerc, 5)}%` }]}>
                        <LinearGradient
                          colors={['#10b981', '#059669']}
                          style={StyleSheet.absoluteFillObject}
                          borderRadius={6}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartLabels}>
                {stats.monthLabels.map((month: string, index: number) => (
                  <Text key={index} style={styles.chartLabel}>{month}</Text>
                ))}
              </View>
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أحدث سجلات النظام</Text>
            {stats.latestActivities.length === 0 ? (
              <BlurView intensity={30} tint="dark" style={[styles.activityCard, { alignItems: 'center', padding: 30 }]}>
                <Text style={{ color: '#9ca3af', fontWeight: 'bold' }}>لا توجد سجلات بعد</Text>
              </BlurView>
            ) : (
              <BlurView intensity={30} tint="dark" style={styles.activityCard}>
                {stats.latestActivities.map((act: any, index: number) => (
                  <View key={`${act.id}-${index}`} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      {getActivityIcon(act.type)}
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activityTime}>{act.date.toLocaleDateString('ar-SA')}</Text>
                    </View>
                  </View>
                ))}
              </BlurView>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24, alignItems: 'flex-end' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#38bdf8', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: (width - 56) / 2, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  statHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  trendText: { fontSize: 14, fontWeight: 'bold' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'right' },
  statTitle: { fontSize: 13, color: '#9ca3af', textAlign: 'right' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  chartContainer: { borderRadius: 24, padding: 20, height: 220, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  chartBars: { flex: 1, flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  barWrapper: { width: 24, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 6, overflow: 'hidden' },
  chartLabels: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  chartLabel: { fontSize: 11, color: '#9ca3af', width: 40, textAlign: 'center' },
  activityCard: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  activityItem: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16 },
  activityIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  activityInfo: { flex: 1, alignItems: 'flex-end' },
  activityTitle: { fontSize: 15, color: '#fff', fontWeight: '500', marginBottom: 4, textAlign: 'right' },
  activityTime: { fontSize: 12, color: '#6b7280' }
});
