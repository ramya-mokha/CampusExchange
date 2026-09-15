import React, { useState, useContext, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 12 : 20;

  const { user, token, logout } = useContext(AuthContext);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'sold'

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products?seller=${user._id}&status=all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Fetch my products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyProducts();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const filteredProducts = products.filter(p => p.status === activeTab);
  const activeCount = products.filter(p => p.status === 'active').length;
  const soldCount = products.filter(p => p.status === 'sold').length;

  const renderProductItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: item.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400' }} 
          style={styles.image} 
        />
        <View style={styles.info}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.location}>📍 Pickup: {item.pickupLocation}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutBtnText}>Sign Out 🚪</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.cardBg} />
      
      {/* Profile Header Block */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'S').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{user?.name || 'Student'}</Text>
              {user?.isVitVerified && (
                <View style={styles.vitBadge}>
                  <Text style={styles.vitBadgeText}>VIT Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            <Text style={styles.roleText}>{user?.role === 'admin' ? '🔑 Administrator' : '🎓 Student Member'}</Text>
          </View>
        </View>

        {/* User stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{soldCount}</Text>
            <Text style={styles.statLabel}>Items Sold</Text>
          </View>
        </View>

        {/* Admin Navigation Button */}
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={styles.adminConsoleBtn}
            onPress={() => navigation.navigate('AdminDashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.adminConsoleBtnText}>🛡️ Open Admin Moderation Panel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active listings ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
          onPress={() => setActiveTab('sold')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}>
            Sold listings ({soldCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile listings list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchMyProducts}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No Listings Here</Text>
              <Text style={styles.emptySubtitle}>You don't have any {activeTab} listings currently.</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: THEME.white,
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
  },
  vitBadge: {
    backgroundColor: '#e11d48',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  vitBadgeText: {
    color: THEME.white,
    fontSize: 9,
    fontWeight: '800',
  },
  email: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 2,
  },
  roleText: {
    fontSize: 12,
    color: THEME.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
  },
  statLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  adminConsoleBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: THEME.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  adminConsoleBtnText: {
    color: THEME.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderColor: THEME.primary,
  },
  tabText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: THEME.inputBg,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  category: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.secondary,
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  footerContainer: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  logoutBtn: {
    backgroundColor: THEME.danger,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 13,
  },
});

