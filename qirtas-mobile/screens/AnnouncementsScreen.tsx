import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, ArrowRight, Calendar, Info } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function AnnouncementsScreen({ navigation }: any) {
  const { state, user } = useAppContext();
  const role = user?.role || 'admin';
  const isParent = role === 'parent';
  
  const announcements = (state?.announcements || [])
    .filter((a: any) => role === 'admin' || role === 'accountant' || a.target === 'الكل' || a.target === (isParent ? 'أولياء الأمور' : 'المعلمين'))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            <Text style={styles.headerTitle}>التعاميم والإعلانات</Text>
            <Text style={styles.headerSubtitle}>{announcements.length} إعلان متاح</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {announcements.map((ann: any, index: number) => (
            <BlurView intensity={30} tint="dark" style={styles.card} key={ann.id || index}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: ann.priority === 'عاجل' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)' }]}>
                  <Text style={[styles.badgeText, { color: ann.priority === 'عاجل' ? '#ef4444' : '#cbd5e1' }]}>{ann.priority}</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{new Date(ann.date).toLocaleDateString('ar-SA')}</Text>
                  <Calendar color="#94a3b8" size={14} />
                </View>
              </View>

              <Text style={styles.title}>{ann.title}</Text>
              
              <View style={styles.divider} />

              <Text style={styles.content}>{ann.content}</Text>

              <View style={styles.footer}>
                <Info color="#64748b" size={14} />
                <Text style={styles.footerText}>الجمهور المستهدف: {ann.target}</Text>
              </View>
            </BlurView>
          ))}

          {announcements.length === 0 && (
            <View style={styles.emptyState}>
              <Bell color="#475569" size={48} />
              <Text style={styles.emptyText}>لا توجد تعاميم جديدة</Text>
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
  headerSubtitle: { fontSize: 14, color: '#8b5cf6', fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  card: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  dateContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, color: '#94a3b8' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  content: { fontSize: 15, color: '#e2e8f0', textAlign: 'right', lineHeight: 24 },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 16 },
  footerText: { fontSize: 12, color: '#64748b' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16, fontWeight: 'bold' }
});
