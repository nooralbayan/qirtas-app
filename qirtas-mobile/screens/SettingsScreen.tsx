import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut, Bell, Moon, Globe, ChevronLeft, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

export default function SettingsScreen() {
  const { user, logout } = useAppContext();

  const handleLogout = async () => {
    await logout();
  };

  const renderSettingItem = (icon: any, title: string, subtitle?: string, action?: any, hasSwitch?: boolean, titleColor?: string) => (
    <TouchableOpacity style={styles.settingItem} onPress={action} disabled={hasSwitch} activeOpacity={0.7}>
      <View style={styles.settingIconContainer}>
        {icon}
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, titleColor && { color: titleColor }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch ? (
        <Switch trackColor={{ false: '#cbd5e1', true: '#4f46e5' }} thumbColor="#fff" value={false} />
      ) : (
        <ChevronLeft color="#94a3b8" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f1f5f9', '#e2e8f0']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.bgCircle} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>الإعدادات</Text>
          
          <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.profileCard}>
            <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.avatarContainer}>
              <User color="#fff" size={32} />
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'مستخدم'}</Text>
              <Text style={styles.profileRole}>
                {user?.role === 'admin' ? 'مدير النظام' : user?.role === 'teacher' ? 'معلم' : user?.role === 'parent' ? 'ولي أمر' : 'مستخدم'}
              </Text>
            </View>
          </LinearGradient>

          {(user?.role === 'admin' || user?.role === 'accountant') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>إدارة النظام</Text>
              <View style={styles.sectionCard}>
                {renderSettingItem(<RefreshCw color="#d97706" size={20} />, 'الترحيل الأكاديمي', 'نقل الطلاب للعام الدراسي الجديد', undefined, false, '#d97706')}
                <View style={styles.divider} />
                {renderSettingItem(<CreditCard color="#059669" size={20} />, 'إعدادات الرسوم', 'تعديل رسوم المراحل الدراسية', undefined, false, '#059669')}
                <View style={styles.divider} />
                {renderSettingItem(<ShieldCheck color="#2563eb" size={20} />, 'الأدوار والصلاحيات', 'إدارة صلاحيات المستخدمين', undefined, false, '#2563eb')}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفضيلات التطبيق</Text>
            <View style={styles.sectionCard}>
              {renderSettingItem(<Bell color="#4f46e5" size={20} />, 'الإشعارات', 'تفعيل أو إيقاف إشعارات التطبيق', null, true)}
              <View style={styles.divider} />
              {renderSettingItem(<Moon color="#4f46e5" size={20} />, 'الوضع الليلي', 'تغيير مظهر التطبيق', null, true)}
              <View style={styles.divider} />
              {renderSettingItem(<Globe color="#4f46e5" size={20} />, 'اللغة', 'العربية')}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الحساب</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut color="#ef4444" size={20} style={{ marginRight: 12 }} />
                <Text style={styles.logoutText}>تسجيل الخروج</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.versionText}>قرطاس موبايل v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  bgCircle: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(79, 70, 229, 0.05)', filter: 'blur(40px)' },
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 24, textAlign: 'right', letterSpacing: -0.5 },
  profileCard: {
    flexDirection: 'row-reverse', alignItems: 'center', padding: 24, borderRadius: 28,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
    marginBottom: 32, borderWidth: 1, borderColor: '#fff'
  },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginLeft: 20, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  profileInfo: { flex: 1, alignItems: 'flex-end' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  profileRole: { fontSize: 15, color: '#4f46e5', fontWeight: 'bold' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#64748b', marginBottom: 16, textAlign: 'right' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 24, shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  settingItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 20 },
  settingIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  settingTextContainer: { flex: 1, alignItems: 'flex-end', marginRight: 12 },
  settingTitle: { fontSize: 16, color: '#0f172a', fontWeight: 'bold' },
  settingSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 20 },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fef2f2' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 10, fontWeight: 'bold' }
});
