import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BarChart, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { user } = useAppContext();

  const renderStatCard = (icon: any, title: string, value: string, trend: string, isPositive: boolean) => (
    <BlurView intensity={40} tint="dark" style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={[styles.trendText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
          {trend}
        </Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </BlurView>
  );

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
            <Text style={styles.headerSubtitle}>نظرة عامة على أداء المدرسة</Text>
          </View>

          <View style={styles.statsGrid}>
            {renderStatCard(<Users color="#f59e0b" size={24} />, 'إجمالي الطلاب', '1,245', '+12%', true)}
            {renderStatCard(<DollarSign color="#10b981" size={24} />, 'الإيرادات (د.ل)', '45,200', '+5%', true)}
            {renderStatCard(<BarChart color="#3b82f6" size={24} />, 'نسبة الحضور', '92%', '-2%', false)}
            {renderStatCard(<Calendar color="#8b5cf6" size={24} />, 'الدروس المنجزة', '340', '+18%', true)}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الأداء الشهري</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>عرض التفاصيل</Text>
              </TouchableOpacity>
            </View>
            
            <BlurView intensity={30} tint="dark" style={styles.chartContainer}>
              {/* Fake Chart representation for Native Feel */}
              <View style={styles.chartBars}>
                {[40, 70, 45, 90, 65, 85].map((height, index) => (
                  <View key={index} style={styles.barWrapper}>
                    <View style={[styles.bar, { height: `${height}%` }]}>
                      <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        style={StyleSheet.absoluteFillObject}
                        borderRadius={6}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.chartLabels}>
                {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'].map((month, index) => (
                  <Text key={index} style={styles.chartLabel}>{month}</Text>
                ))}
              </View>
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أحدث الأنشطة</Text>
            <BlurView intensity={30} tint="dark" style={styles.activityCard}>
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <TrendingUp color="#3b82f6" size={20} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>تم تسجيل طالب جديد</Text>
                    <Text style={styles.activityTime}>منذ ساعتين</Text>
                  </View>
                </View>
              ))}
            </BlurView>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  statHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'right',
  },
  statTitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#f59e0b',
  },
  chartContainer: {
    borderRadius: 24,
    padding: 20,
    height: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  barWrapper: {
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  chartLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 11,
    color: '#9ca3af',
    width: 30,
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  activityInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activityTitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  }
});
