import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Clock, User, Calendar, ArrowRight, Filter } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function AttendanceScreen({ navigation }: any) {
  const { state } = useAppContext();
  const attendanceRecords = state?.attendanceRecords || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowRight color="#fff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>سجل الغياب والحضور</Text>
            <Text style={styles.headerSubtitle}>{attendanceRecords.length} سجل متاح</Text>
          </View>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color="#94a3b8" size={16} />
            <Text style={styles.filterText}>تصفية حسب التاريخ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {attendanceRecords.map((record: any, index: number) => (
            <BlurView intensity={30} tint="dark" style={styles.recordCard} key={record.id || index}>
              <View style={styles.recordHeader}>
                <View style={styles.dateContainer}>
                  <Calendar color="#38bdf8" size={16} />
                  <Text style={styles.dateText}>{record.date}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: record.status === 'حاضر' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                  <Text style={[styles.badgeText, { color: record.status === 'حاضر' ? '#10b981' : '#ef4444' }]}>
                    {record.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.recordDetails}>
                <View style={styles.detailItem}>
                  <User color="#94a3b8" size={16} />
                  <Text style={styles.detailText}>{record.studentName || 'غير متوفر'}</Text>
                </View>
                {record.reason && (
                  <Text style={styles.reasonText} numberOfLines={2}>
                    السبب: {record.reason}
                  </Text>
                )}
              </View>
            </BlurView>
          ))}

          {attendanceRecords.length === 0 && (
            <View style={styles.emptyState}>
              <Clock color="#475569" size={48} />
              <Text style={styles.emptyText}>لا توجد سجلات غياب مسجلة</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#38bdf8', fontWeight: '600' },
  filterBar: { flexDirection: 'row-reverse', paddingHorizontal: 24, marginBottom: 16 },
  filterButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  recordCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)', overflow: 'hidden' },
  recordHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  dateContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#e2e8f0' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  recordDetails: { alignItems: 'flex-end' },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailText: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  reasonText: { color: '#94a3b8', fontSize: 13, textAlign: 'right', marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16, fontWeight: 'bold' }
});
