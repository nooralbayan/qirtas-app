import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, User as UserIcon } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

export default function StudentsListScreen() {
  const [search, setSearch] = useState('');
  const { state, loading } = useAppContext();

  if (loading || !state) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const allStudents = state.students?.filter((s: any) => !s.wasWithdrawn) || [];
  
  const filteredStudents = allStudents.filter((s: any) => 
    s.name.includes(search) || 
    (s.grade && s.grade.includes(search))
  );

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.actionBtn}>
        <ChevronLeft color="#cbd5e1" size={24} />
      </TouchableOpacity>
      
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.tagContainer}>
          <View style={styles.tag}><Text style={styles.tagText}>{item.grade}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>فصل {item.classRoom}</Text></View>
        </View>
      </View>
      
      <View style={styles.avatar}>
        <UserIcon color="#3b82f6" size={24} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>قائمة الطلاب</Text>
        <Text style={styles.subtitle}>{allStudents.length} طالب مسجل</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="ابحث بالاسم أو الصف..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        <Search color="#9ca3af" size={20} style={styles.searchIcon} />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 56,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'sans-serif',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for bottom tab bar
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  actionBtn: {
    padding: 8,
  }
});
