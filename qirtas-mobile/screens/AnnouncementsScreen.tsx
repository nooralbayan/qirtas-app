import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, Bell, Calendar, Info, Megaphone, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function AnnouncementsScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const { state, loading, user } = useAppContext();
  const scrollY = new Animated.Value(0);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const role = user?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'hr';
  const isParent = role === 'parent';
  
  const allAnnouncements = (state.announcements || [])
    .filter((a: any) => role === 'admin' || role === 'accountant' || a.target === 'الكل' || a.target === (isParent ? 'أولياء الأمور' : 'المعلمين'))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredAnnouncements = allAnnouncements.filter((a: any) => 
    (a.title && a.title.includes(search)) || 
    (a.content && a.content.includes(search))
  );

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });
    
    const isUrgent = item.priority === 'عاجل';

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
              <Calendar color="#64748b" size={16} style={{ marginLeft: 6 }} />
              <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('ar-SA')}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isUrgent ? '#fee2e2' : '#f1f5f9', borderColor: isUrgent ? '#fecaca' : '#e2e8f0' }]}>
              <Text style={[styles.badgeText, { color: isUrgent ? '#dc2626' : '#64748b' }]}>{item.priority || 'عادي'}</Text>
            </View>
          </View>
          
          <Text style={styles.titleText}>{item.title}</Text>
          <View style={styles.divider} />
          <Text style={styles.contentText}>{item.content}</Text>

          <View style={styles.footer}>
            <Info color="#94a3b8" size={16} style={{ marginLeft: 6 }} />
            <Text style={styles.footerText}>مستهدف: {item.target}</Text>
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
            <Text style={styles.title}>التعاميم والإعلانات</Text>
            <Text style={styles.subtitle}>{allAnnouncements.length} إعلان متاح</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث في التعاميم..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      </View>

      {filteredAnnouncements.length === 0 ? (
        <View style={styles.emptyState}>
          <Megaphone color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا توجد تعاميم حالياً</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredAnnouncements}
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

      {isAdmin && (
        <TouchableOpacity style={styles.fab}>
          <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.fabGradient}>
            <Plus color="#fff" size={32} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(139, 92, 246, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#8b5cf6', fontWeight: 'bold', textAlign: 'right' },
  
  searchSection: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 24, borderRadius: 20, paddingHorizontal: 16,
    height: 56, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
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
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  dateText: { fontSize: 14, color: '#64748b', fontWeight: 'bold' },
  badge: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  
  titleText: { fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'right', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  contentText: { fontSize: 15, color: '#475569', textAlign: 'right', lineHeight: 24 },
  
  footer: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 14, color: '#64748b', fontWeight: '600' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 64, height: 64, borderRadius: 32, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});
