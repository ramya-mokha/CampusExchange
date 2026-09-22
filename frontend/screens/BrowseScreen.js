import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME, resolveImageUrl } from '../config';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  'All',
  '📚 Books',
  '💻 Electronics',
  '🪑 Furniture',
  '🚲 Cycles',
  '👕 Clothing',
  '🎒 Hostel Essentials',
  '🔌 Accessories',
  'Others'
];

const PICKUP_POINTS = [
  'All Locations',
  'Library',
  'AB1',
  'AB2',
  'Hostel Gate',
  'Food Court',
  'Academic Block'
];

export default function BrowseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user, updateWishlist } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic top spacing ensuring search bar is moved slightly downward without overlapping status bar
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 12 : 16;

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = async (overrideSearch, overrideCategory, overrideLocation, overrideMinPrice, overrideMaxPrice) => {
    try {
      setLoading(true);
      const searchVal = overrideSearch !== undefined ? overrideSearch : search;
      const catVal = overrideCategory !== undefined ? overrideCategory : selectedCategory;
      const locVal = overrideLocation !== undefined ? overrideLocation : selectedLocation;
      const minP = overrideMinPrice !== undefined ? overrideMinPrice : minPrice;
      const maxP = overrideMaxPrice !== undefined ? overrideMaxPrice : maxPrice;

      let queryParams = [];
      const trimmedSearch = (searchVal || '').trim();
      if (trimmedSearch) queryParams.push(`search=${encodeURIComponent(trimmedSearch)}`);
      if (catVal && catVal !== 'All') queryParams.push(`category=${encodeURIComponent(catVal)}`);
      if (locVal && locVal !== 'All Locations') queryParams.push(`pickupLocation=${encodeURIComponent(locVal)}`);
      if (minP) queryParams.push(`minPrice=${minP}`);
      if (maxP) queryParams.push(`maxPrice=${maxP}`);
      queryParams.push('status=active'); // only fetch active products

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await fetch(`${API_URL}/products${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch products when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const handleSearchSubmit = () => {
    fetchProducts();
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    fetchProducts(search, cat, selectedLocation, minPrice, maxPrice);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedLocation('All Locations');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setShowFilters(false);
    fetchProducts('', 'All', 'All Locations', '', '');
  };

  const handleToggleWishlist = async (productId, e) => {
    e?.stopPropagation?.();
    if (!token) return;
    try {
      const currentList = (user?.wishlist || []).map(id => id.toString());
      const isCurrentlySaved = currentList.includes(productId.toString());
      let newWishlist;
      if (isCurrentlySaved) {
        newWishlist = currentList.filter(id => id !== productId.toString());
      } else {
        newWishlist = [...currentList, productId.toString()];
      }
      updateWishlist(newWishlist);

      const res = await fetch(`${API_URL}/products/${productId}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.wishlist) {
        updateWishlist(data.wishlist);
      }
    } catch (err) {
      console.error('Toggle wishlist error in Browse:', err);
    }
  };

  const renderProductItem = ({ item }) => {
    const isVitSeller = item.seller?.email?.endsWith('@vitstudent.ac.in') || item.seller?.email?.endsWith('@vit.ac.in');
    const isWishlisted = (user?.wishlist || []).map(id => id.toString()).includes(item._id?.toString());

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.88}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: resolveImageUrl(item.images?.[0]) }}
            style={styles.productImage}
          />
          {item.condition ? (
            <View style={styles.badgeContainer}>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionBadgeText}>{item.condition}</Text>
              </View>
            </View>
          ) : null}

          {/* Quick Wishlist Toggle */}
          <TouchableOpacity
            style={styles.cardWishlistBtn}
            onPress={(e) => handleToggleWishlist(item._id, e)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={15}
              color={isWishlisted ? "#E11D48" : THEME.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          {item.category ? (
            <Text style={styles.cardCategoryText} numberOfLines={1}>{item.category}</Text>
          ) : null}

          <Text style={styles.titleText} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.priceText}>₹{item.price}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={THEME.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{item.pickupLocation}</Text>
          </View>

          <View style={styles.sellerRow}>
            <Text style={styles.sellerName} numberOfLines={1}>{item.seller?.name || 'Student'}</Text>
            {isVitSeller && (
              <View style={styles.vitBadge}>
                <Ionicons name="checkmark-circle" size={10} color={THEME.primary} />
                <Text style={styles.vitBadgeText}>VIT</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* Top Search & Filter Bar */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={18} color={THEME.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books, cycles, calculators..."
              placeholderTextColor={THEME.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              multiline={false}
              numberOfLines={1}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={16} color={THEME.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterIconButton, showFilters && styles.filterIconButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showFilters ? 'close' : 'options-outline'}
              size={20}
              color={showFilters ? THEME.white : THEME.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Filters Expandable Drawer */}
      {showFilters && (
        <View style={styles.filtersDrawer}>
          <Text style={styles.filterSectionTitle}>Campus Pickup Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {PICKUP_POINTS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.filterBubble,
                  selectedLocation === loc && styles.filterBubbleActive
                ]}
                onPress={() => setSelectedLocation(loc)}
              >
                <Text style={[
                  styles.filterBubbleText,
                  selectedLocation === loc && styles.filterBubbleTextActive
                ]}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterSectionTitle}>Price Range (₹)</Text>
          <View style={styles.priceRangeContainer}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor={THEME.textMuted}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={styles.priceSeparator}>to</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor={THEME.textMuted}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={maxPrice => setMaxPrice(maxPrice)}
            />
          </View>

          <View style={styles.drawerActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
              <Text style={styles.resetBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={fetchProducts}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Categories Horizontal Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBubble,
                selectedCategory === cat && styles.categoryBubbleActive
              ]}
              onPress={() => handleCategorySelect(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive
                ]}
                numberOfLines={1}
              >{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Fetching campus listings...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>Try searching for something else or clearing filters.</Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={handleResetFilters}>
            <Text style={styles.reloadBtnText}>Reset Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchProducts}
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: THEME.text,
    fontSize: 14,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: THEME.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  filterIconButtonActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filtersDrawer: {
    backgroundColor: THEME.cardBg,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  filterSectionTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  horizontalScroll: {
    marginBottom: 12,
  },
  filterBubble: {
    backgroundColor: THEME.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterBubbleActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterBubbleText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  filterBubbleTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
    backgroundColor: THEME.inputBg,
    height: 40,
    borderRadius: 8,
    color: THEME.text,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  priceSeparator: {
    color: THEME.textMuted,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  drawerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  resetBtnText: {
    color: THEME.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  applyBtn: {
    backgroundColor: THEME.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 14,
  },
  categoryContainer: {
    paddingVertical: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryBubble: {
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: THEME.border,
    flexShrink: 0,
  },
  categoryBubbleActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  categoryText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  categoryTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: COLUMN_WIDTH,
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  imageWrapper: {
    position: 'relative',
    backgroundColor: THEME.inputBg,
  },
  productImage: {
    width: '100%',
    height: COLUMN_WIDTH * 0.95,
  },
  badgeContainer: {
    position: 'absolute',
    top: 7,
    left: 7,
  },
  conditionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  conditionBadgeText: {
    color: THEME.text,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardWishlistBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productInfo: {
    padding: 10,
  },
  cardCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    lineHeight: 17,
    marginBottom: 3,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    color: THEME.textMuted,
    marginLeft: 3,
    flex: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  sellerName: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  vitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 4,
  },
  vitBadgeText: {
    color: THEME.primary,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  reloadBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  reloadBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
