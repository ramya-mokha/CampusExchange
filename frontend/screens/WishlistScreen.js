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
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

export default function WishlistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 12 : 20;

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

      if (!profileData.wishlist || profileData.wishlist.length === 0) {
        setWishlistItems([]);
        return;
      }

      // Fetch all products and filter locally
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
      // Optimistically filter out item for instant responsiveness
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
      
      const res = await fetch(`${API_URL}/products/${productId}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        updateWishlist(data.wishlist);
      }
    } catch (err) {
      console.error('Remove wishlist error:', err);
    }
  };

  const renderWishlistItem = ({ item }) => {
    const isSold = item.status === 'sold';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.88}
      >
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400' }} 
            style={styles.image} 
          />
          {item.condition ? (
            <View style={styles.conditionTag}>
              <Text style={styles.conditionTagText}>{item.condition}</Text>
            </View>
          ) : null}
          {isSold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldOverlayText}>SOLD</Text>
            </View>
          )}
        </View>
        
        <View style={styles.info}>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText} numberOfLines={1}>{item.category || 'Item'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeIconBtn} 
              onPress={() => handleRemoveFromWishlist(item._id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color={THEME.danger} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>

          <View style={styles.bottomRow}>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={THEME.primary} />
              <Text style={styles.location} numberOfLines={1}>{item.pickupLocation}</Text>
            </View>

            <View style={styles.viewLinkRow}>
              <Text style={styles.viewLinkText}>Details</Text>
              <Ionicons name="chevron-forward" size={12} color={THEME.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      <View style={[styles.headerContainer, { paddingTop: headerTopPadding }]}>
        <Text style={styles.pageTitle}>Saved Wishlist</Text>
        <Text style={styles.pageSubtitle}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'saved item' : 'saved items'}
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading saved listings...</Text>
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={36} color={THEME.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any listing while browsing to save it here for quick access.
          </Text>
          <TouchableOpacity 
            style={styles.browseBtn} 
            onPress={() => navigation.navigate('Browse')} 
            activeOpacity={0.85}
          >
            <Text style={styles.browseBtnText}>Explore Marketplace</Text>
            <Ionicons name="arrow-forward" size={16} color={THEME.white} style={{ marginLeft: 6 }} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: THEME.inputBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  conditionTag: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.text,
    textTransform: 'uppercase',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 25, 23, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOverlayText: {
    color: THEME.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: THEME.inputBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  removeIconBtn: {
    padding: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    lineHeight: 18,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  location: {
    fontSize: 11,
    color: THEME.textMuted,
    marginLeft: 3,
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  viewLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary,
    marginRight: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    color: THEME.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  browseBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
