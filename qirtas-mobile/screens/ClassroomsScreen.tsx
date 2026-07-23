import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Users, Home, BookOpen, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';

export default function ClassroomsScreen({ navigation }: any) {
  const { state, loading } = useAppContext();
  const scrollY = new Animated.Value(0);

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const classRooms = state.classRooms || {};
  const classroomsList = Object.keys(classRooms).map((grade) => ({
    grade,
    classes: classRooms[grade] || []
  }));

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.avatarInner}>
                <Home color="#4f46e5" size={24} />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.titleText}>{item.grade}</Text>
              <Text style={styles.subtitleText}>{item.classes.length} شعبة متوفرة</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.classesList}>
            {item.classes.map((cls: string, idx: number) => (
              <View key={idx} style={styles.classItem}>
                <Users color="#6366f1" size={14} />
                <Text style={styles.classText}>{cls}</Text>
              </View>
            ))}
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
            <Text style={styles.title}>إدارة الفصول</Text>
            <Text style={styles.subtitle}>{classroomsList.length} صف دراسي</Text>
          </View>
        </View>
      </View>
      
      {classroomsList.length === 0 ? (
        <View style={styles.emptyState}>
          <Home color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا توجد فصول مسجلة</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={classroomsList}
          keyExtractor={(item, idx) => idx.toString()}
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
  bgCircle: { position: 'absolute', top: -150, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.05)', filter: 'blur(40px)' },
  header: { padding: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#6366f1', fontWeight: 'bold', textAlign: 'right' },
  
  list: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 },
  cardContainer: { marginBottom: 16 },
  card: {
    padding: 20, borderRadius: 24,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#fff'
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginLeft: 12, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarInner: { flex: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-end' },
  titleText: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitleText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  
  classesList: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
  classItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  classText: { color: '#4f46e5', fontSize: 14, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }
});
