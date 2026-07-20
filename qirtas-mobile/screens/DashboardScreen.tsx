import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

export default function DashboardScreen() {
  const { state, loading } = useAppContext();

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  const studentCount = state.students?.filter((s: any) => !s.wasWithdrawn).length || 0;
  const teacherCount = state.teachers?.length || 0;
  
  // Calculate total classes
  let classCount = 0;
  Object.values(state.classRooms || {}).forEach((classes: any) => {
    classCount += classes.length;
  });

  const recentAnnouncements = (state.announcements || [])
    .filter((a: any) => a.target === 'الكل' || a.target === 'أولياء الأمور')
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>الرئيسية</Text>
          <Text style={styles.subtitle}>مرحباً بك في {state.schoolName || 'نظام قرطاس'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.statLabel}>إجمالي الطلاب</Text>
            <Text style={styles.statValue}>{studentCount}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.statLabel}>المعلمين</Text>
            <Text style={styles.statValue}>{teacherCount}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.statLabel}>الفصول</Text>
            <Text style={styles.statValue}>{classCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>آخر التعاميم والإعلانات</Text>
        {recentAnnouncements.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 20 }}>لا توجد إعلانات حالية</Text>
        ) : (
          recentAnnouncements.map((ann: any) => (
            <View key={ann.id} style={styles.announcementCard}>
              <View style={[styles.badge, { backgroundColor: ann.priority === 'عاجل' ? '#fee2e2' : '#e0f2fe' }]}>
                <Text style={[styles.badgeText, { color: ann.priority === 'عاجل' ? '#ef4444' : '#0284c7' }]}>{ann.priority}</Text>
              </View>
              <Text style={styles.announcementTitle}>{ann.title}</Text>
              <Text style={styles.announcementBody}>{ann.content}</Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'right',
  },
  announcementCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'right',
  },
  announcementBody: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 24,
  }
});
