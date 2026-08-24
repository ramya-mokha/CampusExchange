import React, { useState, useContext, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

export default function WishlistScreen({ navigation }) {
  const { token, updateWishlist } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      // Fetch fresh profile data to get updated wishlist IDs
      const profileRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (!profileRes.ok) {
        throw new Error(profileData.message || 'Error loading profile');
      }

      updateWishlist(profileData.wishlist);

      if (profileData.wishlist.length === 0) {
        setWishlistItems([]);
        return;
      }

      // Fetch all products and filter locally (simplifies backend logic and ensures offline-sync compatibility)
      const productsRes = await fetch(`${API_URL}/products?status=all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      
      if (productsRes.ok) {
        const wishlistIds = profileData.wishlist.map(id => id.toString());
        const filtered = productsData.filter(p => wishlistIds.includes(p._id.toString()));
        setWishlistItems(filtered);
      }
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [])
  );

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Filter out item from state immediately for responsive micro-interactions
        setWishlistItems(wishlistItems.filter(item => item._id !== productId));
        const data = await res.json();
        updateWishlist(data.wishlist);
      }
    } catch (err) {
      console.error('Remove wishlist error:', err);
    }
  };

  const renderWishlistItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: item.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400' }} 
          style={styles.image} 
        />
        
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
            {item.status === 'sold' && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.location}>📍 Pickup: {item.pickupLocation}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.viewBtn} 
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            >
              <Text style={styles.viewBtnText}>View Item</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={() => handleRemoveFromWishlist(item._id)}
            >
              <Text style={styles.removeBtnText}>Remove ✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
      
      <Text style={styles.pageTitle}>Saved Wishlist</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on any listing details to save it here.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.browseBtnText}>Explore Listings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchWishlist}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  image: {
    width: 110,
    height: 120,
    backgroundColor: THEME.inputBg,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  soldBadge: {
    backgroundColor: THEME.danger,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soldBadgeText: {
    color: THEME.white,
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.secondary,
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  viewBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewBtnText: {
    color: THEME.white,
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeBtnText: {
    color: THEME.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: THEME.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
