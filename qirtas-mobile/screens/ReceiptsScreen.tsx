import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Banknote, Calendar, User, ArrowRight, Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ReceiptsScreen({ navigation }: any) {
  const { state } = useAppContext();
  const receipts = state?.receipts || [];
  const totalCollected = receipts.reduce((acc: number, r: any) => acc + (Number(r.paidAmount) || Number(r.amount) || 0), 0);

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
            <Text style={styles.headerTitle}>سندات القبض</Text>
            <Text style={styles.headerSubtitle}>إجمالي الإيرادات: {totalCollected} د.ل</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {receipts.map((receipt: any, index: number) => (
            <BlurView intensity={30} tint="dark" style={styles.receiptCard} key={receipt.id || index}>
              <View style={styles.receiptHeader}>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountText}>{receipt.paidAmount || receipt.amount} د.ل</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>سند #{receipt.receiptNumber || receipt.id}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptDetails}>
                <View style={styles.detailItem}>
                  <User color="#94a3b8" size={16} />
                  <Text style={styles.detailText}>{receipt.studentName || 'غير محدد'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Calendar color="#94a3b8" size={16} />
                  <Text style={styles.detailText}>{new Date(receipt.date).toLocaleDateString('ar-SA')}</Text>
                </View>
              </View>

              <Text style={styles.reasonText} numberOfLines={2}>
                البيان: {receipt.reason || 'دفعة من الرسوم الدراسية'}
              </Text>
            </BlurView>
          ))}

          {receipts.length === 0 && (
            <View style={styles.emptyState}>
              <Banknote color="#475569" size={48} />
              <Text style={styles.emptyText}>لا توجد سندات قبض مسجلة</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.fabGradient}
          >
            <Plus color="#fff" size={24} />
          </LinearGradient>
        </TouchableOpacity>
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
  headerSubtitle: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  receiptCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', overflow: 'hidden' },
  receiptHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  amountContainer: {},
  amountText: { fontSize: 22, fontWeight: 'bold', color: '#10b981' },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  receiptDetails: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  detailText: { color: '#e2e8f0', fontSize: 14, fontWeight: 'bold' },
  reasonText: { color: '#94a3b8', fontSize: 13, textAlign: 'right', lineHeight: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 60, height: 60, borderRadius: 30, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});
