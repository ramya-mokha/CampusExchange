import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

export default function AdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 10 : 16;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  const { token } = useContext(AuthContext);
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('stats'); // 'stats' or 'users'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      
      // Fetch users list
      const usersRes = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      
      if (statsRes.ok && usersRes.ok) {
        setStats(statsData);
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      'Moderate User',
      `Are you sure you want to delete the account for ${userName}? This will remove all their active and sold listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                Alert.alert('Success', 'User deleted successfully.');
                fetchAdminData(); // reload
              } else {
                const data = await res.json();
                Alert.alert('Error', data.message || 'Failed to delete user.');
              }
            } catch (err) {
              console.error(err);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleModerateProduct = (productId, productName) => {
    Alert.alert(
      'Moderate Listing',
      `Delete listing "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Listing',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                Alert.alert('Success', 'Listing removed.');
                fetchAdminData();
              }
            } catch (err) {
              console.error(err);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading admin records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.cardBg} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'stats' && styles.tabBtnActive]}
          onPress={() => setSubTab('stats')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, subTab === 'stats' && styles.tabTextActive]}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'users' && styles.tabBtnActive]}
          onPress={() => setSubTab('users')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, subTab === 'users' && styles.tabTextActive]}>Users ({users.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {subTab === 'stats' ? (
          // Analytics View
          <View>
            {/* Grid Summary Cards */}
            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>👥</Text>
                <Text style={styles.cardVal}>{stats?.summary?.totalUsers || 0}</Text>
                <Text style={styles.cardLabel}>Total Students</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>📦</Text>
                <Text style={styles.cardVal}>{stats?.summary?.totalProducts || 0}</Text>
                <Text style={styles.cardLabel}>Total Postings</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>🏷️</Text>
                <Text style={styles.cardVal}>{stats?.summary?.activeProducts || 0}</Text>
                <Text style={styles.cardLabel}>Active Listings</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardIcon}>🤝</Text>
                <Text style={styles.cardVal}>{stats?.summary?.soldProducts || 0}</Text>
                <Text style={styles.cardLabel}>Successful Sales</Text>
              </View>
            </View>

            {/* Popular Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category Distribution</Text>
              <View style={styles.tableCard}>
                {stats?.categoryDistribution?.map((item) => (
                  <View key={item.name} style={styles.tableRow}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowVal}>{item.count} items</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent Product Submissions for Moderation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Listings (Moderation)</Text>
              <View style={styles.recentContainer}>
                {stats?.recentProducts?.length === 0 ? (
                  <Text style={styles.emptyText}>No recent listings found.</Text>
                ) : (
                  stats?.recentProducts?.map((item) => (
                    <View key={item._id} style={styles.recentItem}>
                      <View style={styles.recentDetails}>
                        <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.recentSubText}>
                          Price: ₹{item.price} | Seller: {item.seller?.name || 'Student'} | Location: {item.pickupLocation}
                        </Text>
                      </View>
                      <View style={styles.recentActions}>
                        <TouchableOpacity 
                          style={styles.viewBtn} 
                          onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                        >
                          <Text style={styles.btnText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteBtn}
                          onPress={() => handleModerateProduct(item._id, item.name)}
                        >
                          <Text style={styles.btnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        ) : (
          // Users List View
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manage Students</Text>
            {users.length === 0 ? (
              <Text style={styles.emptyText}>No users registered yet.</Text>
            ) : (
              users.map((item) => (
                <View key={item._id} style={styles.userRow}>
                  <View style={styles.userMeta}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{item.name}</Text>
                      {item.isVitVerified && (
                        <View style={styles.vitBadge}>
                          <Text style={styles.vitBadgeText}>VIT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={styles.userDate}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>

                  {item.role !== 'admin' && (
                    <TouchableOpacity
                      style={styles.banBtn}
                      onPress={() => handleDeleteUser(item._id, item.name)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.banBtnText}>Delete Profile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backBtnText: {
    color: THEME.accent,
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderColor: THEME.accent,
  },
  tabText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: THEME.accent,
    fontWeight: '700',
  },
  scrollContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardVal: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
  },
  cardLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  tableCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  rowName: {
    color: THEME.text,
    fontSize: 14,
  },
  rowVal: {
    color: THEME.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  recentContainer: {
    gap: 10,
  },
  recentItem: {
    backgroundColor: THEME.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
  },
  recentDetails: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  recentSubText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  recentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  viewBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteBtn: {
    backgroundColor: THEME.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnText: {
    color: THEME.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 10,
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  vitBadge: {
    backgroundColor: '#e11d48',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  vitBadgeText: {
    color: THEME.white,
    fontSize: 8,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 2,
  },
  userDate: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  banBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: THEME.danger,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  banBtnText: {
    color: THEME.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  loadingText: {
    color: THEME.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
});
