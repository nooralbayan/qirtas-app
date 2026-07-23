import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CreditCard, Calendar, FileText, ArrowRight, Plus } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ExpensesScreen({ navigation }: any) {
  const { state } = useAppContext();
  const expenses = state?.expenses || [];
  const totalExpenses = expenses.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

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
            <Text style={styles.headerTitle}>سجل المصروفات</Text>
            <Text style={styles.headerSubtitle}>إجمالي المصروفات: {totalExpenses} د.ل</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {expenses.map((expense: any, index: number) => (
            <BlurView intensity={30} tint="dark" style={styles.expenseCard} key={expense.id || index}>
              <View style={styles.expenseHeader}>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountText}>{expense.amount} د.ل</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{expense.category || 'عام'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.expenseDetails}>
                <View style={styles.detailItem}>
                  <FileText color="#94a3b8" size={16} />
                  <Text style={styles.detailText} numberOfLines={1}>{expense.description || 'بدون وصف'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Calendar color="#94a3b8" size={16} />
                  <Text style={styles.detailText}>{new Date(expense.date).toLocaleDateString('ar-SA')}</Text>
                </View>
              </View>
            </BlurView>
          ))}

          {expenses.length === 0 && (
            <View style={styles.emptyState}>
              <CreditCard color="#475569" size={48} />
              <Text style={styles.emptyText}>لا توجد مصروفات مسجلة</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#ef4444', '#b91c1c']}
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
  headerSubtitle: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  expenseCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', overflow: 'hidden' },
  expenseHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  amountContainer: {},
  amountText: { fontSize: 22, fontWeight: 'bold', color: '#ef4444' },
  badge: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fca5a5', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  expenseDetails: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 },
  detailText: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 60, height: 60, borderRadius: 30, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});
