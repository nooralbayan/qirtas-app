import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Find a class to show timetable for, e.g. the first one available
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
        <Text style={styles.subtitle}>{defaultClassKey || 'لم يتم إعداد جداول بعد'}</Text>
      </View>

      <View style={styles.daysSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {DAYS.map(day => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <ScrollView contentContainerStyle={styles.list}>
        {PERIODS_TEMPLATE.map((period, index) => {
          if (period.isBreak) {
            return (
              <View key={`break-${index}`} style={styles.breakCard}>
                <Ionicons name="cafe" size={20} color="#d97706" style={{ marginLeft: 8 }} />
                <Text style={styles.breakText}>{period.label} ({period.time})</Text>
              </View>
            );
          }

          const entry = getSubject(period.id);

          return (
            <View key={period.id} style={styles.periodCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{period.time}</Text>
                <Text style={styles.periodLabel}>{period.label}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoCol}>
                {entry ? (
                  <>
                    <Text style={styles.subjectText}>{entry.subject}</Text>
                    <Text style={styles.teacherText}>{entry.teacher}</Text>
                  </>
                ) : (
                  <Text style={styles.teacherText}>- فراغ -</Text>
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
    padding: 20,
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#3b82f6',
    marginTop: 4,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  periodCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderRightWidth: 4,
    borderRightColor: '#3b82f6',
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
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
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  infoCol: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  teacherText: {
    fontSize: 14,
    color: '#64748b',
  },
  breakCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  breakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
  },
  daysSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  dayTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
  },
  dayTabActive: {
    backgroundColor: '#3b82f6',
  },
  dayTabText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  dayTabTextActive: {
    color: '#fff',
  }
});
