import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronLeft, Shield, Users, UserCog, Edit, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function UsersScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const scrollY = new Animated.Value(0);

  // Mock data for users since it's an admin-only feature
  const usersList = [
    { id: 1, name: 'أحمد محمود', role: 'admin', email: 'admin@school.com' },
    { id: 2, name: 'سارة خالد', role: 'accountant', email: 'sara@school.com' },
    { id: 3, name: 'محمد علي', role: 'teacher', email: 'mohammad@school.com' },
    { id: 4, name: 'فاطمة سعد', role: 'hr', email: 'fatima@school.com' },
  ];

  const filteredUsers = usersList.filter((u) => 
    u.name.includes(search) || u.role.includes(search)
  );

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      case 'accountant': return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
      case 'hr': return { bg: '#fef9c3', text: '#ca8a04', border: '#fef08a' };
      default: return { bg: '#e0e7ff', text: '#4f46e5', border: '#c7d2fe' };
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'مدير النظام';
      case 'accountant': return 'محاسب';
      case 'hr': return 'موارد بشرية';
      default: return 'معلم';
    }
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [-1, 0, (index * 120), (index + 2) * 120];
    const scale = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1, 0.95] });
    
    const roleColors = getRoleBadgeColor(item.role);

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <LinearGradient colors={['#f1f5f9', '#e2e8f0']} style={styles.avatarInner}>
                <UserCog color="#64748b" size={24} />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColors.bg, borderColor: roleColors.border }]}>
              <Text style={[styles.roleText, { color: roleColors.text }]}>{getRoleLabel(item.role)}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconBtn}>
              <Edit color="#3b82f6" size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Trash2 color="#ef4444" size={18} />
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
            <Text style={styles.title}>إدارة المستخدمين</Text>
            <Text style={styles.subtitle}>{usersList.length} مستخدم نشط</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="ابحث عن مستخدم..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        </View>
      </View>

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyStateText}>لا يوجد مستخدمين</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredUsers}
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
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginLeft: 12, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatarInner: { flex: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-end', paddingRight: 8 },
  name: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  email: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, marginLeft: 8 },
  roleText: { fontSize: 13, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },

  actionRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 12 },
  iconBtn: { padding: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyStateText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }
});
