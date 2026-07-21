import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Coffee, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

const PERIODS_TEMPLATE = [
  { id: 1, label: 'الحصة الأولى', time: '08:00 - 08:45' },
  { id: 2, label: 'الحصة الثانية', time: '08:50 - 09:35' },
  { id: 3, label: 'الحصة الثالثة', time: '09:40 - 10:25' },
  { id: 0, label: 'استراحة', time: '10:25 - 10:45', isBreak: true },
  { id: 4, label: 'الحصة الرابعة', time: '10:45 - 11:30' },
  { id: 5, label: 'الحصة الخامسة', time: '11:35 - 12:20' },
  { id: 6, label: 'الحصة السادسة', time: '12:25 - 13:10' },
];

export default function TimetableScreen() {
  const { state, loading } = useAppContext();
  const [selectedDay, setSelectedDay] = useState('الأحد');
  const DAYS = ['الخميس', 'الأربعاء', 'الثلاثاء', 'الإثنين', 'الأحد']; // Reversed for RTL horizontal scroll visual

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  let defaultClassKey = '';
  if (state.timetables) {
    const keys = Object.keys(state.timetables);
    if (keys.length > 0) defaultClassKey = keys[0];
  }

  const entries = state.timetables?.[defaultClassKey] || [];
  const dayEntries = entries.filter((e: any) => e.day === selectedDay);

  const getSubject = (periodId: number) => dayEntries.find((e: any) => e.periodId === periodId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>الجدول الدراسي</Text>
        <Text style={styles.subtitle}>{defaultClassKey ? `فصل ${defaultClassKey}` : 'لم يتم إعداد جداول بعد'}</Text>
      </View>

      <View style={styles.daysSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, flexDirection: 'row-reverse' }}>
          {DAYS.map(day => {
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity 
                key={day} 
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.dayTabActive}>
                    <Text style={styles.dayTabTextActive}>{day}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.dayTab}>
                    <Text style={styles.dayTabText}>{day}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {PERIODS_TEMPLATE.map((period, index) => {
          if (period.isBreak) {
            return (
              <LinearGradient key={`break-${index}`} colors={['#fef3c7', '#fde68a']} style={styles.breakCard}>
                <Text style={styles.breakText}>{period.label} ({period.time})</Text>
                <Coffee color="#d97706" size={20} style={{ marginLeft: 12 }} />
              </LinearGradient>
            );
          }

          const entry = getSubject(period.id);

          return (
            <View key={period.id} style={styles.periodCard}>
              <View style={styles.timeCol}>
                <Clock color="#9ca3af" size={16} style={{ marginBottom: 4 }} />
                <Text style={styles.timeText}>{period.time}</Text>
                <Text style={styles.periodLabel}>{period.label}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoCol}>
                {entry ? (
                  <>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 }}>
                      <BookOpen color="#3b82f6" size={18} style={{ marginLeft: 8 }} />
                      <Text style={styles.subjectText}>{entry.subject}</Text>
                    </View>
                    <Text style={styles.teacherText}>{entry.teacher}</Text>
                  </>
                ) : (
                  <Text style={[styles.teacherText, { fontStyle: 'italic', color: '#cbd5e1' }]}>- فراغ -</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '700',
  },
  daysSelector: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  dayTab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  dayTabActive: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 6,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  dayTabText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 15,
  },
  dayTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for Bottom Tab Bar
  },
  periodCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    borderRightWidth: 4,
    borderRightColor: '#3b82f6',
    alignItems: 'center',
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 'bold',
  },
  periodLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  infoCol: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  teacherText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  breakCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  breakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b45309',
  }
});
