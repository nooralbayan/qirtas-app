import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, Trash2, ArrowRightLeft, FileWarning, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function RecycleBinScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const { state, loading } = useAppContext();
  const scrollY = new Animated.Value(0);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f43f5e" />
      </View>
    );
  }

  const recycleBin = state.recycleBin || [];
  const filteredItems = recycleBin.filter((item: any) => 
    item.type && item.type.includes(search) || 
    item.name && item.name.includes(search)
  );

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <LinearGradient colors={['#ffe4e6', '#fecdd3']} style={styles.avatarInner}>
                <FileWarning color="#e11d48" size={24} />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name || 'عنصر محذوف'}</Text>
              <Text style={styles.type}>{item.type}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Clock color="#64748b" size={14} />
              <Text style={styles.detailText}>{item.deletedAt || 'غير متوفر'}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <ArrowRightLeft color="#10b981" size={16} />
              <Text style={[styles.actionBtnText, { color: '#10b981' }]}>استعادة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(225, 29, 72, 0.1)' }]}>
              <Trash2 color="#e11d48" size={16} />
              <Text style={[styles.actionBtnText, { color: '#e11d48' }]}>حذف نهائي</Text>
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
            <Text style={styles.title}>سلة المحذوفات</Text>
            <Text style={styles.subtitle}>{recycleBin.length} عنصر محذوف</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث في المحذوفات..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Trash2 color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>سلة المحذوفات فارغة</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredItems}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(244, 63, 94, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#f43f5e', fontWeight: 'bold', textAlign: 'right' },
  
  searchSection: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 24, borderRadius: 20, paddingHorizontal: 16,
    height: 56, shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
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
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginLeft: 12, shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarInner: { flex: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  type: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },

  detailsRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', marginBottom: 12 },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14, color: '#475569', fontWeight: '600' },

  actionRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, gap: 12 },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }
});
