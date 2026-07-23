import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, CreditCard, Calendar, CheckCircle2, Plus, Edit, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function ExpensesScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const { state, loading } = useAppContext();
  const scrollY = new Animated.Value(0);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const allExpenses = state.expenses || [];
  const totalExpenses = allExpenses.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
  
  const filteredExpenses = allExpenses.filter((e: any) => 
    (e.description && e.description.includes(search)) || 
    (e.category && e.category.includes(search))
  );

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>{item.amount} <Text style={{fontSize: 14}}>د.ل</Text></Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category || 'عام'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.expenseDetails}>
            <View style={styles.detailItem}>
              <CheckCircle2 color="#64748b" size={16} style={{ marginLeft: 6 }} />
              <Text style={styles.detailText}>{item.status || 'معتمد'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar color="#64748b" size={16} style={{ marginLeft: 6 }} />
              <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString('ar-SA')}</Text>
            </View>
          </View>

          <Text style={styles.descText} numberOfLines={2}>
            التفاصيل: {item.description || 'مصروف عام'}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Edit color="#3b82f6" size={16} />
              <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>تعديل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Trash2 color="#ef4444" size={16} />
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>حذف</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgCircle} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#0f172a" size={28} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>سجل المصروفات</Text>
            <Text style={styles.subtitle}>إجمالي المنصرف: {totalExpenses} د.ل</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث بالتفاصيل أو التصنيف..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      </View>

      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <CreditCard color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا توجد مصروفات مسجلة</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredExpenses}
          keyExtractor={(item, idx) => (item.id || idx).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        />
      )}

      <TouchableOpacity style={styles.fab}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.fabGradient}>
          <Plus color="#fff" size={32} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(239, 68, 68, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#ef4444', fontWeight: 'bold', textAlign: 'right' },
  
  searchSection: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 24, borderRadius: 20, paddingHorizontal: 16,
    height: 56, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#e2e8f0', zIndex: 10
  },
  searchIcon: { marginLeft: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', fontFamily: 'sans-serif', fontWeight: '500' },
  
  list: { paddingHorizontal: 24, paddingBottom: 120 },
  cardContainer: { marginBottom: 16 },
  card: {
    padding: 20, borderRadius: 24,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#fff'
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  amountContainer: {},
  amountText: { fontSize: 24, fontWeight: '900', color: '#ef4444' },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  badgeText: { color: '#64748b', fontSize: 13, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  
  expenseDetails: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center' },
  detailText: { color: '#334155', fontSize: 15, fontWeight: 'bold' },
  descText: { color: '#64748b', fontSize: 14, textAlign: 'right', lineHeight: 22, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },

  actionRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 16 },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 64, height: 64, borderRadius: 32, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});
