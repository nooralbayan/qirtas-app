import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, User as UserIcon, BookOpen, GraduationCap, Filter, Edit, Trash2, Star, CreditCard } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function StudentsListScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [classFilter, setClassFilter] = useState('الكل');
  const [showFilters, setShowFilters] = useState(false);
  
  const { state, loading, user } = useAppContext();
  const scrollY = new Animated.Value(0);
  const filterHeightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(filterHeightAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const role = user?.role || 'admin';
  const isParent = role === 'parent';
  const { gradeFees, classRooms, receipts } = state;

  let allStudents = state.students?.filter((s: any) => !s.wasWithdrawn) || [];
  
  if (isParent) {
    const childId = user?.studentId;
    allStudents = allStudents.filter((s: any) => s.id === childId || s._id === childId);
  }

  const availableGrades = Object.keys(gradeFees || {});
  const availableClasses = classRooms?.[gradeFilter] || ['أ'];

  const filteredStudents = allStudents.filter((s: any) => {
    const matchesName = s.name.includes(search) || (s.enrollmentNumber && s.enrollmentNumber.includes(search));
    const matchesGrade = gradeFilter === 'الكل' || s.grade === gradeFilter;
    const matchesClass = classFilter === 'الكل' || s.classRoom === classFilter;
    return matchesName && matchesGrade && matchesClass;
  });

  const getPaymentStatus = (student: any) => {
    const stdReceipts = (receipts || []).filter((r: any) => r.studentId === student.id);
    const totalPaid = stdReceipts.reduce((a: number, r: any) => a + (Number(r.paidAmount) || 0), 0);
    const dynamicFees = (gradeFees && gradeFees[student.grade]) || student.totalFees || 0;
    
    if (totalPaid === 0) return { label: 'غير مسدد', color: '#ef4444', bg: '#fee2e2' };
    if (totalPaid >= dynamicFees) return { label: 'مسدد بالكامل', color: '#10b981', bg: '#d1fae5' };
    return { label: 'مسدد جزئياً', color: '#f59e0b', bg: '#fef3c7' };
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });
    const pStatus = getPaymentStatus(item);

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.avatarInner}>
                <UserIcon color="#4f46e5" size={24} />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.enrollmentText}>رقم القيد: {item.enrollmentNumber || '-'}</Text>
            </View>
          </View>
          
          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <GraduationCap color="#64748b" size={14} style={{ marginLeft: 4 }} />
              <Text style={styles.tagText}>{item.grade || 'غير محدد'}</Text>
            </View>
            <View style={styles.tag}>
              <BookOpen color="#64748b" size={14} style={{ marginLeft: 4 }} />
              <Text style={styles.tagText}>فصل {item.classRoom || '-'}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: pStatus.bg, borderColor: pStatus.bg }]}>
              <CreditCard color={pStatus.color} size={14} style={{ marginLeft: 4 }} />
              <Text style={[styles.tagText, { color: pStatus.color }]}>{pStatus.label}</Text>
            </View>
          </View>

          {!isParent && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Star color="#8b5cf6" size={16} />
                <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>سلوك</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Edit color="#3b82f6" size={16} />
                <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Trash2 color="#ef4444" size={16} />
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>حذف</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const filterHeight = filterHeightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140]
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgCircle} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#0f172a" size={28} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{isParent ? 'أبنائي' : 'إدارة الطلاب'}</Text>
            <Text style={styles.subtitle}>{isParent ? 'متابعة السجل الأكاديمي' : `${filteredStudents.length} طالب`}</Text>
          </View>
        </View>
      </View>
      
      {!isParent && (
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
              <Filter color={showFilters ? "#4f46e5" : "#64748b"} size={20} />
            </TouchableOpacity>
            <TextInput 
              style={styles.searchInput}
              placeholder="ابحث بالاسم أو رقم القيد..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              textAlign="right"
            />
            <Search color="#94a3b8" size={20} style={styles.searchIcon} />
          </View>

          <Animated.View style={[styles.filtersWrapper, { height: filterHeight, opacity: filterHeightAnim }]}>
            <View style={styles.filtersInner}>
              <Text style={styles.filterLabel}>الصف الدراسي</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 24, flexDirection: 'row-reverse' }}>
                <TouchableOpacity onPress={() => { setGradeFilter('الكل'); setClassFilter('الكل'); }} style={[styles.filterChip, gradeFilter === 'الكل' && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, gradeFilter === 'الكل' && styles.filterChipTextActive]}>الكل</Text>
                </TouchableOpacity>
                {availableGrades.map((g) => (
                  <TouchableOpacity key={g} onPress={() => { setGradeFilter(g); setClassFilter('الكل'); }} style={[styles.filterChip, gradeFilter === g && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, gradeFilter === g && styles.filterChipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {gradeFilter !== 'الكل' && (
                <>
                  <Text style={styles.filterLabel}>الفصل</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 24, flexDirection: 'row-reverse' }}>
                    <TouchableOpacity onPress={() => setClassFilter('الكل')} style={[styles.filterChip, classFilter === 'الكل' && styles.filterChipActive]}>
                      <Text style={[styles.filterChipText, classFilter === 'الكل' && styles.filterChipTextActive]}>الكل</Text>
                    </TouchableOpacity>
                    {availableClasses.map((c: string) => (
                      <TouchableOpacity key={c} onPress={() => setClassFilter(c)} style={[styles.filterChip, classFilter === c && styles.filterChipActive]}>
                        <Text style={[styles.filterChipText, classFilter === c && styles.filterChipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          </Animated.View>
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

      {!isParent && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddStudent')}>
          <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.fabGradient}>
            <Text style={{color: '#fff', fontSize: 32, marginTop: -4}}>+</Text>
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
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
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
  filterToggle: { padding: 8, marginRight: 8, backgroundColor: '#f8fafc', borderRadius: 12 },
  
  filtersWrapper: { overflow: 'hidden' },
  filtersInner: { paddingTop: 16, paddingBottom: 8 },
  filterLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b', textAlign: 'right', paddingHorizontal: 24, marginBottom: 8 },
  filterScroll: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginLeft: 8, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },

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
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  enrollmentText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  
  tagContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  tagText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  
  actionRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 64, height: 64, borderRadius: 32, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});
