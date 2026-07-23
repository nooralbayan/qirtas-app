import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, Clock, Calendar, User, UserCheck, UserMinus, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function AttendanceScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const { state, loading } = useAppContext();
  const scrollY = new Animated.Value(0);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const allRecords = state.attendanceRecords || [];
  
  const filteredRecords = allRecords.filter((r: any) => 
    (r.studentName && r.studentName.includes(search)) || 
    (r.date && r.date.includes(search))
  );

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });
    
    const isPresent = item.status === 'حاضر';

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
              <Calendar color="#64748b" size={18} style={{ marginLeft: 6 }} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isPresent ? '#d1fae5' : '#fee2e2', borderColor: isPresent ? '#a7f3d0' : '#fecaca' }]}>
              {isPresent ? (
                <UserCheck color="#059669" size={14} style={{ marginLeft: 4 }} />
              ) : (
                <UserMinus color="#dc2626" size={14} style={{ marginLeft: 4 }} />
              )}
              <Text style={[styles.badgeText, { color: isPresent ? '#059669' : '#dc2626' }]}>
                {item.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.recordDetails}>
            <View style={styles.detailItem}>
              <User color="#64748b" size={16} style={{ marginLeft: 6 }} />
              <Text style={styles.detailText}>{item.studentName || 'غير متوفر'}</Text>
            </View>
          </View>

          {!isPresent && item.reason && (
            <Text style={styles.reasonText} numberOfLines={2}>
              سبب الغياب: {item.reason}
            </Text>
          )}
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
            <Text style={styles.title}>سجل الحضور والغياب</Text>
            <Text style={styles.subtitle}>{allRecords.length} سجل متاح</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث باسم الطالب أو التاريخ..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      </View>

      {filteredRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا توجد سجلات مسجلة</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredRecords}
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
        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.fabGradient}>
          <Plus color="#fff" size={32} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(59, 130, 246, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#3b82f6', fontWeight: 'bold', textAlign: 'right' },
  
  searchSection: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 24, borderRadius: 20, paddingHorizontal: 16,
    height: 56, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
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
  dateContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '900', color: '#334155' },
  badge: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  
  recordDetails: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center' },
  detailText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
  reasonText: { color: '#dc2626', fontSize: 14, textAlign: 'right', lineHeight: 22, backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', marginTop: 8 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 64, height: 64, borderRadius: 32, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});
