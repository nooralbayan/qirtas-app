import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, User as UserIcon, BookOpen, GraduationCap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function StudentsListScreen() {
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
  const isParent = role === 'parent';

  let allStudents = state.students?.filter((s: any) => !s.wasWithdrawn) || [];
  
  // Role-based filtering: Parents see only their kids (using studentId stored in user context)
  if (isParent) {
    // Parent logs in using enrollment number or phone. The API returns the student ID in user.studentId
    // If we have multiple children, they would be handled here, but currently, it returns one `user.studentId`.
    const childId = user?.studentId;
    allStudents = allStudents.filter((s: any) => s.id === childId || s._id === childId);
  }

  const filteredStudents = allStudents.filter((s: any) => 
    s.name.includes(search) || 
    (s.grade && s.grade.includes(search))
  );

  const renderItem = ({ item, index }: any) => {
    const inputRange = [
      -1,
      0,
      (index * 120),
      (index + 2) * 120
    ];
    
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.95]
    });

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionBtnInner}>
              <ChevronLeft color="#4f46e5" size={20} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.tagContainer}>
              <View style={styles.tag}>
                <GraduationCap color="#64748b" size={14} style={{ marginLeft: 4 }} />
                <Text style={styles.tagText}>{item.grade || 'غير محدد'}</Text>
              </View>
              <View style={styles.tag}>
                <BookOpen color="#64748b" size={14} style={{ marginLeft: 4 }} />
                <Text style={styles.tagText}>فصل {item.classRoom || '-'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.avatar}>
            <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.avatarInner}>
              <UserIcon color="#4f46e5" size={28} />
            </LinearGradient>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgCircle} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isParent ? 'أبنائي' : 'قائمة الطلاب'}</Text>
          <Text style={styles.subtitle}>{isParent ? 'متابعة السجل الأكاديمي' : `${allStudents.length} طالب مسجل`}</Text>
        </View>
      </View>
      
      {!isParent && (
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث باسم الطالب أو الصف..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      )}

      {filteredStudents.length === 0 ? (
        <View style={styles.emptyState}>
          <UserIcon color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا توجد بيانات متاحة</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredStudents}
          keyExtractor={(item) => (item.id || item._id).toString()}
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
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(79, 70, 229, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16, alignItems: 'flex-end', backgroundColor: 'transparent' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 24, marginBottom: 24, borderRadius: 20, paddingHorizontal: 16,
    height: 56, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  searchIcon: { marginLeft: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', fontFamily: 'sans-serif', fontWeight: '500' },
  list: { paddingHorizontal: 24, paddingBottom: 120 },
  cardContainer: { marginBottom: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#fff'
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginLeft: 16, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarInner: { flex: 1, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  tagContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tagText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  actionBtn: { padding: 8 },
  actionBtnInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }
});
