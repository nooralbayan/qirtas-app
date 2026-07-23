import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, Users, Briefcase, Phone, BookOpen, UserCheck, UserMinus, Plus, Edit, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function TeachersScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const { state, loading, user } = useAppContext();
  const scrollY = new Animated.Value(0);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const role = user?.role || 'admin';
  const isAdmin = role === 'admin' || role === 'hr';

  const allTeachers = state.teachers || [];
  
  const filteredTeachers = allTeachers.filter((t: any) => 
    t.name.includes(search) || 
    (t.subject && t.subject.includes(search))
  );

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.avatarInner}>
                <Users color="#4f46e5" size={24} />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <BookOpen color="#64748b" size={12} style={{ marginLeft: 4 }} />
                  <Text style={styles.tagText}>{item.subject || 'غير محدد'}</Text>
                </View>
                <View style={styles.tag}>
                  <Briefcase color="#64748b" size={12} style={{ marginLeft: 4 }} />
                  <Text style={styles.tagText}>{item.type || 'أساسي'}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Phone color="#94a3b8" size={16} style={{ marginLeft: 6 }} />
              <Text style={styles.contactText}>{item.phone || 'لا يوجد رقم'}</Text>
            </View>
            {isAdmin && (
              <View style={styles.salaryBadge}>
                <Text style={styles.salaryText}>{item.salary || 0} د.ل</Text>
              </View>
            )}
          </View>

          {isAdmin && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <UserCheck color="#10b981" size={16} />
                <Text style={[styles.actionBtnText, { color: '#10b981' }]}>حضور</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <UserMinus color="#f59e0b" size={16} />
                <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>غياب</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Edit color="#3b82f6" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Trash2 color="#ef4444" size={16} />
              </TouchableOpacity>
            </View>
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
            <Text style={styles.title}>المعلمون والموظفون</Text>
            <Text style={styles.subtitle}>{allTeachers.length} موظف مسجل</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث بالاسم أو التخصص..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      </View>

      {filteredTeachers.length === 0 ? (
        <View style={styles.emptyState}>
          <Users color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا توجد بيانات متاحة</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredTeachers}
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
          <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.fabGradient}>
            <Plus color="#fff" size={32} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(79, 70, 229, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#64748b', fontWeight: '600', textAlign: 'right' },
  
  searchSection: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 24, borderRadius: 20, paddingHorizontal: 16,
    height: 56, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
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
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginLeft: 16, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarInner: { flex: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  
  tagRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tagText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  
  contactRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  contactItem: { flexDirection: 'row-reverse', alignItems: 'center' },
  contactText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  salaryBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  salaryText: { color: '#059669', fontSize: 13, fontWeight: 'bold' },

  actionRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold' },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 64, height: 64, borderRadius: 32, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});
