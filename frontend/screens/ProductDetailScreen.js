import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 8 : 16;

  const { productId } = route.params;
  const { user, token, updateWishlist } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProduct(data);
        
        // Load wishlist status
        // Fetch current user details to check wishlist
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (meRes.ok && meData.wishlist) {
          const list = meData.wishlist.map(id => id.toString());
          setIsWishlisted(list.includes(productId.toString()));
          updateWishlist(meData.wishlist);
        }
      } else {
        Alert.alert('Error', data.message || 'Could not fetch product details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Fetch product details error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const handleToggleWishlist = async () => {
    try {
      setWishlistLoading(true);
      const res = await fetch(`${API_URL}/products/${productId}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setIsWishlisted(data.isWishlisted);
        updateWishlist(data.wishlist);
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleMarkAsSold = async () => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this item as sold? It will not appear in the browse feed anymore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await fetch(`${API_URL}/products/${productId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'sold' })
              });
              if (res.ok) {
                Alert.alert('Success', 'Item marked as sold.');
                navigation.goBack();
              }
            } catch (err) {
              console.error('Mark as sold error:', err);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteListing = async () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to permanently delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (res.ok) {
                Alert.alert('Success', 'Listing deleted.');
                navigation.goBack();
              }
            } catch (err) {
              console.error('Delete listing error:', err);
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
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Product not found.</Text>
      </View>
    );
  }

  const isSeller = product.seller?._id?.toString() === user?._id?.toString() || product.seller === user?._id;
  const isAdmin = user?.role === 'admin';
  const isVitSeller = product.seller?.email?.endsWith('@vitstudent.ac.in') || product.seller?.email?.endsWith('@vit.ac.in');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Main Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400' }} 
            style={styles.image} 
            resizeMode="cover"
          />
          {product.status === 'sold' && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldOverlayText}>SOLD</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.categoryBadge}>{product.category}</Text>
            <Text style={styles.conditionBadge}>Condition: {product.condition}</Text>
          </View>

          {/* Title and Price */}
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>

          {/* Designated Campus Pickup Point */}
          <View style={styles.pickupSection}>
            <Text style={styles.sectionLabel}>📍 Designated Campus Pickup Location</Text>
            <View style={styles.pickupCard}>
              <Text style={styles.pickupName}>{product.pickupLocation}</Text>
              <Text style={styles.pickupHint}>Safe public exchange zone. Meet the seller here for handovers.</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Seller Information */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {(product.seller?.name || 'S').substring(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{product.seller?.name || 'Campus Student'}</Text>
                  {isVitSeller && (
                    <View style={styles.vitBadge}>
                      <Text style={styles.vitBadgeText}>VIT Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sellerEmail}>{product.seller?.email || ''}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isSeller || isAdmin ? (
              // Owner or Admin Controls
              <View style={styles.ownerControls}>
                {product.status === 'active' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.soldBtn]} 
                    onPress={handleMarkAsSold}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionBtnText}>✅ Mark as Sold</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.deleteBtn]} 
                  onPress={handleDeleteListing}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnText}>🗑️ Delete Listing</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Student Buyer Controls
              <View style={styles.buyerControls}>
                <TouchableOpacity 
                  style={[styles.wishlistBtn, isWishlisted && styles.wishlistBtnActive]}
                  onPress={handleToggleWishlist}
                  disabled={wishlistLoading}
                >
                  {wishlistLoading ? (
                    <ActivityIndicator size="small" color={THEME.primary} />
                  ) : (
                    <Text style={[styles.wishlistBtnText, isWishlisted && styles.wishlistBtnTextActive]}>
                      {isWishlisted ? '❤️ Saved' : '🤍 Save to Wishlist'}
                    </Text>
                  )}
                </TouchableOpacity>

                {product.status === 'active' ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.chatBtn]}
                    onPress={() => navigation.navigate('ChatRoom', { 
                      otherUserId: product.seller?._id || product.seller, 
                      otherUserName: product.seller?.name || 'Seller',
                      itemInfo: { name: product.name, price: product.price }
                    })}
                  >
                    <Text style={styles.actionBtnText}>💬 Chat with Seller</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.soldIndicator}>
                    <Text style={styles.soldIndicatorText}>Listing Closed (Sold)</Text>
                  </View>
                )}
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: THEME.cardBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOverlayText: {
    color: THEME.danger,
    fontSize: 48,
    fontWeight: '900',
    borderWidth: 4,
    borderColor: THEME.danger,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },
  detailsCard: {
    padding: 20,
    marginTop: -20,
    backgroundColor: THEME.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: THEME.border,
    color: THEME.text,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  conditionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: THEME.secondary,
    borderWidth: 1,
    borderColor: THEME.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.secondary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: THEME.textMuted,
    lineHeight: 22,
  },
  pickupSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  pickupCard: {
    marginTop: 4,
  },
  pickupName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.primary,
  },
  pickupHint: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    color: THEME.white,
    fontSize: 20,
    fontWeight: '700',
  },
  sellerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
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
  sellerEmail: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 20,
  },
  ownerControls: {
    gap: 12,
  },
  buyerControls: {
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: '700',
  },
  chatBtn: {
    backgroundColor: THEME.primary,
  },
  soldBtn: {
    backgroundColor: THEME.secondary,
  },
  deleteBtn: {
    backgroundColor: THEME.danger,
  },
  wishlistBtn: {
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.cardBg,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistBtnActive: {
    borderColor: THEME.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  wishlistBtnText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '700',
  },
  wishlistBtnTextActive: {
    color: THEME.danger,
  },
  soldIndicator: {
    backgroundColor: THEME.inputBg,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  soldIndicatorText: {
    color: THEME.textMuted,
    fontSize: 16,
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
