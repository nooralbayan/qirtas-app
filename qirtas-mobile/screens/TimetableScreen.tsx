import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Coffee, BookOpen, ChevronDown } from 'lucide-react-native';
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
  const { state, loading, user } = useAppContext();
  const [selectedDay, setSelectedDay] = useState('الأحد');
  const DAYS = ['الخميس', 'الأربعاء', 'الثلاثاء', 'الإثنين', 'الأحد']; // Reversed for RTL horizontal scroll visual

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const role = user?.role || 'admin';
  const isParent = role === 'parent';

  let defaultClassKey = '';
  
  if (isParent) {
    // Parent logic: Find their child's class
    const childId = user?.studentId;
    const child = state.students?.find((s: any) => s.id === childId || s._id === childId);
    if (child && child.classRoom) {
      defaultClassKey = child.classRoom;
    }
  } else {
    // Admin logic: First available class
    if (state.timetables) {
      const keys = Object.keys(state.timetables);
      if (keys.length > 0) defaultClassKey = keys[0];
    }
  }

  const entries = state.timetables?.[defaultClassKey] || [];
  const dayEntries = entries.filter((e: any) => e.day === selectedDay);
  const getSubject = (periodId: number) => dayEntries.find((e: any) => e.periodId === periodId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgCircle} />

      <View style={styles.header}>
        <Text style={styles.title}>الجدول الدراسي</Text>
        <TouchableOpacity style={styles.classSelector}>
          <Text style={styles.classSelectorText}>
            {defaultClassKey ? `الفصل: ${defaultClassKey}` : 'لم يتم تحديد فصل'}
          </Text>
          {!isParent && <ChevronDown color="#4f46e5" size={20} />}
        </TouchableOpacity>
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
                  <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.dayTabActive}>
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
              <LinearGradient key={`break-${index}`} colors={['#fef9c3', '#fef08a']} style={styles.breakCard}>
                <Text style={styles.breakText}>{period.label} ({period.time})</Text>
                <Coffee color="#d97706" size={20} style={{ marginLeft: 12 }} />
              </LinearGradient>
            );
          }

          const entry = getSubject(period.id);

          return (
            <View key={period.id} style={styles.periodCard}>
              <View style={styles.timeCol}>
                <Clock color="#94a3b8" size={16} style={{ marginBottom: 4 }} />
                <Text style={styles.timeText}>{period.time}</Text>
                <Text style={styles.periodLabel}>{period.label}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoCol}>
                {entry ? (
                  <>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 }}>
                      <BookOpen color="#4f46e5" size={18} style={{ marginLeft: 8 }} />
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
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(56, 189, 248, 0.08)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16, alignItems: 'flex-end', backgroundColor: 'transparent' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 },
  classSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  classSelectorText: { fontSize: 16, color: '#4f46e5', fontWeight: 'bold', marginRight: 8 },
  daysSelector: { paddingVertical: 12, marginBottom: 8 },
  dayTab: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginHorizontal: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dayTabActive: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginHorizontal: 6, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  dayTabText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
  dayTabTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list: { paddingHorizontal: 24, paddingBottom: 120 },
  periodCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3, borderRightWidth: 4, borderRightColor: '#4f46e5', alignItems: 'center' },
  timeCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  periodLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  divider: { width: 1, height: '80%', backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  infoCol: { flex: 2, alignItems: 'flex-end', justifyContent: 'center' },
  subjectText: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  teacherText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  breakCard: { flexDirection: 'row', borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#d97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  breakText: { fontSize: 16, fontWeight: 'bold', color: '#b45309' }
});
