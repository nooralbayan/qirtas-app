import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Award, User, BookOpen, ArrowRight, Star } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ResultsScreen({ navigation }: any) {
  const { state } = useAppContext();
  const results = state?.studentResults || {};
  const students = state?.students || [];

  const resultsList = useMemo(() => {
    let list: any[] = [];
    Object.keys(results).forEach(studentId => {
      const student = students.find((s: any) => s.id === studentId || s.id === Number(studentId));
      if (student) {
        list.push({
          studentName: student.name,
          grade: student.grade,
          subjects: results[studentId]
        });
      }
    });
    return list;
  }, [results, students]);

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
            <Text style={styles.headerTitle}>النتائج المدرسية</Text>
            <Text style={styles.headerSubtitle}>{resultsList.length} طالب له نتائج</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {resultsList.map((result: any, index: number) => (
            <BlurView intensity={30} tint="dark" style={styles.resultCard} key={index}>
              <View style={styles.resultHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{result.studentName}</Text>
                  <Text style={styles.studentGrade}>{result.grade}</Text>
                </View>
                <View style={styles.iconContainer}>
                  <Award color="#f59e0b" size={24} />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.subjectsList}>
                {Object.keys(result.subjects).map((subject, idx) => (
                  <View key={idx} style={styles.subjectItem}>
                    <Text style={styles.subjectScore}>{result.subjects[subject]}</Text>
                    <Text style={styles.subjectName}>{subject}</Text>
                  </View>
                ))}
              </View>
            </BlurView>
          ))}

          {resultsList.length === 0 && (
            <View style={styles.emptyState}>
              <Star color="#475569" size={48} />
              <Text style={styles.emptyText}>لم يتم رصد نتائج حتى الآن</Text>
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
  headerSubtitle: { fontSize: 14, color: '#f59e0b', fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  resultCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', overflow: 'hidden' },
  resultHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  studentInfo: { flex: 1, alignItems: 'flex-end', marginRight: 16 },
  studentName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  studentGrade: { fontSize: 14, color: '#94a3b8' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  subjectsList: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 12 },
  subjectItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8 },
  subjectName: { color: '#cbd5e1', fontSize: 14 },
  subjectScore: { color: '#f59e0b', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16, fontWeight: 'bold' }
});
