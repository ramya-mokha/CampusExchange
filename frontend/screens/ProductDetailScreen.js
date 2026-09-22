import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Alert,
  Animated,
  Share,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME, resolveImageUrl } from '../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 8 : 16;
  const bottomInset = Math.max(insets.bottom, 16);

  const { productId } = route.params;
  const { user, token, updateWishlist } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Micro spring animation for buttons
  const backScale = useRef(new Animated.Value(1)).current;
  const wishScale = useRef(new Animated.Value(1)).current;

  const animatePress = (anim, toVal) => {
    Animated.spring(anim, {
      toValue: toVal,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

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

  const handleMoreOptions = () => {
    if (!product) return;
    Alert.alert(
      'Listing Options',
      product.name,
      [
        {
          text: 'Share Listing',
          onPress: async () => {
            try {
              await Share.share({
                message: `Check out "${product.name}" for ₹${product.price} on CampusExchange! Handover point: ${product.pickupLocation}.`,
                title: product.name,
              });
            } catch (err) {
              console.error(err);
            }
          }
        },
        {
          text: 'Report Item',
          style: 'destructive',
          onPress: () => Alert.alert('Report Submitted', 'Thank you. Our campus moderator will review this listing.')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleMarkAsSold = async () => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this item as sold? It will no longer appear as available.',
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

  const getCategoryIcon = (category = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('book')) return 'book-outline';
    if (cat.includes('elect') || cat.includes('laptop') || cat.includes('phone') || cat.includes('calc')) return 'laptop-outline';
    if (cat.includes('cycle') || cat.includes('bike')) return 'bicycle-outline';
    if (cat.includes('furnit') || cat.includes('chair')) return 'easel-outline';
    if (cat.includes('cloth')) return 'shirt-outline';
    if (cat.includes('hostel')) return 'bed-outline';
    return 'pricetag-outline';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
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
  const isSold = product.status === 'sold';
  const imageCount = Math.max(product.images?.length || 1, 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Floating Top Nav Bar (Back, Wishlist, More...) */}
      <View style={[styles.floatingNav, { top: headerTopPadding }]}>
        <Animated.View style={{ transform: [{ scale: backScale }] }}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={() => navigation.goBack()}
            onPressIn={() => animatePress(backScale, 0.9)}
            onPressOut={() => animatePress(backScale, 1)}
            activeOpacity={0.9}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.navRightRow}>
          {!isSeller && (
            <Animated.View style={{ transform: [{ scale: wishScale }] }}>
              <TouchableOpacity
                style={[styles.navCircleBtn, isWishlisted && styles.navCircleBtnActive]}
                onPress={handleToggleWishlist}
                onPressIn={() => animatePress(wishScale, 0.9)}
                onPressOut={() => animatePress(wishScale, 1)}
                disabled={wishlistLoading}
                activeOpacity={0.9}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {wishlistLoading ? (
                  <ActivityIndicator size="small" color={THEME.primary} />
                ) : (
                  <Ionicons
                    name={isWishlisted ? "heart" : "heart-outline"}
                    size={20}
                    color={isWishlisted ? "#EF4444" : "#111827"}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={handleMoreOptions}
            activeOpacity={0.9}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 88 }]}
      >
        {/* Rounded Hero Image Area */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: resolveImageUrl(product.images?.[0]) }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {isSold && (
            <View style={styles.soldBadgeOverlay}>
              <View style={styles.soldBadgePill}>
                <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            </View>
          )}

          {/* Dots Pagination Indicator */}
          <View style={styles.paginationDotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Image Counter Badge */}
          <View style={styles.imageCounterBadge}>
            <Ionicons name="images-outline" size={13} color="#FFFFFF" />
            <Text style={styles.imageCounterText}>1/{imageCount}</Text>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.bodyContent}>
          {/* Tags Row */}
          <View style={styles.tagsRow}>
            <View style={styles.categoryPill}>
              <Ionicons name={getCategoryIcon(product.category)} size={13} color="#4F46E5" style={{ marginRight: 5 }} />
              <Text style={styles.categoryPillText}>{product.category.replace(/^[^\w]+/, '')}</Text>
            </View>

            <View style={styles.conditionPill}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 5 }} />
              <Text style={styles.conditionPillText}>{product.condition}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Price */}
          <Text style={styles.priceText}>₹{Number(product.price).toLocaleString('en-IN')}</Text>

          {/* Pickup Point Card */}
          <View style={styles.pickupCard}>
            <View style={styles.pickupIconWrap}>
              <Ionicons name="location-sharp" size={20} color="#EA580C" />
            </View>
            <View style={styles.pickupInfo}>
              <Text style={styles.pickupSubLabel}>Pickup Point</Text>
              <Text style={styles.pickupMainTitle}>Campus Handover Point</Text>
              <Text style={styles.pickupSpotName}>{product.pickupLocation}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>

          {/* Description */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.descriptionText}>{product.description || 'No additional details provided by the seller.'}</Text>
          </View>

          <View style={styles.sectionDivider} />

          {/* Seller */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Seller</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerTopRow}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarInitial}>
                    {(product.seller?.name || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.sellerDetails}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>{product.seller?.name || 'Jane Doe'}</Text>
                    {isVitSeller && (
                      <View style={styles.vitVerifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#059669" />
                        <Text style={styles.vitVerifiedText}>VIT Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sellerEmail} numberOfLines={1}>{product.seller?.email || 'student@vitstudent.ac.in'}</Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.sellerStatsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.statRatingScore}>4.8</Text>
                  <Text style={styles.statRatingCount}>(12 reviews)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="cube-outline" size={14} color="#6B7280" />
                  <Text style={styles.statSoldText}>12 items sold</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset, height: 72 + bottomInset }]}>
        {isSeller || isAdmin ? (
          // Seller / Admin actions
          <View style={styles.ownerActionsRow}>
            {!isSold && (
              <TouchableOpacity
                style={[styles.ownerBtn, styles.soldBtn]}
                onPress={handleMarkAsSold}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.ownerBtnText}>Mark as Sold</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.ownerBtn, styles.deleteBtn]}
              onPress={handleDeleteListing}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.ownerBtnText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Buyer Action: Full Width Orange Chat Button
          !isSold ? (
            <TouchableOpacity
              style={styles.chatCTAButton}
              onPress={() => navigation.navigate('ChatRoom', {
                otherUserId: product.seller?._id || product.seller,
                otherUserName: product.seller?.name || 'Seller',
                itemInfo: { name: product.name, price: product.price }
              })}
              activeOpacity={0.88}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.chatCTAButtonText}>Chat with Seller</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.soldDisabledCTA}>
              <Text style={styles.soldDisabledCTAText}>Item Sold</Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 12,
    fontSize: 15,
  },
  floatingNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  navCircleBtnActive: {
    backgroundColor: '#FEF2F2',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroImageContainer: {
    width: SCREEN_WIDTH,
    height: 360,
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  soldBadgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  paginationDotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  imageCounterBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPillText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conditionPillText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  priceText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#E8622A',
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    gap: 12,
  },
  pickupIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupInfo: {
    flex: 1,
  },
  pickupSubLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  pickupMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 1,
  },
  pickupSpotName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  sectionBlock: {
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  sellerCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sellerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sellerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  vitVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 3,
  },
  vitVerifiedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  sellerEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  sellerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRatingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 4,
  },
  statRatingCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  statSoldText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'center',
  },
  chatCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8622A',
    height: 52,
    borderRadius: 16,
    shadowColor: '#E8622A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  chatCTAButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  soldDisabledCTA: {
    backgroundColor: '#F3F4F6',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldDisabledCTAText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBtn: {
    backgroundColor: '#059669',
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  ownerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
