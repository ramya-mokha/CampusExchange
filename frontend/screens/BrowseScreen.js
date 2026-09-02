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
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

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
  const { token } = useContext(AuthContext);
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

  const renderProductItem = ({ item }) => {
    const isVitSeller = item.seller?.email?.endsWith('@vitstudent.ac.in') || item.seller?.email?.endsWith('@vit.ac.in');

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
      >
        <Image
          source={{ uri: item.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400' }}
          style={styles.productImage}
        />
        <View style={styles.badgeContainer}>
          <Text style={styles.conditionBadge}>{item.condition}</Text>
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>📍 {item.pickupLocation}</Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.priceText}>₹{item.price}</Text>
          <Text style={styles.titleText} numberOfLines={1}>{item.name}</Text>

          <View style={styles.sellerRow}>
            <Text style={styles.sellerName} numberOfLines={1}>By: {item.seller?.name || 'Student'}</Text>
            {isVitSeller && (
              <View style={styles.vitBadge}>
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />

      {/* Top Search & Filter Bar */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search textbooks, bicycles, calculators..."
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
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleBtnText}>
            {showFilters ? 'Hide Advanced Filters ✕' : 'Advanced Filters ⚙️'}
          </Text>
        </TouchableOpacity>
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
              <Text style={styles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={fetchProducts}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
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
              <Text style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive
              ]}>{cat}</Text>
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
    paddingBottom: 14,
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    height: 48,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: THEME.text,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 14,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchButton: {
    width: 48,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.primary,
  },
  searchButtonText: {
    fontSize: 18,
  },
  filterToggleBtn: {
    marginTop: 8,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  filterToggleBtnActive: {
    opacity: 0.8,
  },
  filterToggleBtnText: {
    color: THEME.secondary,
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 16,
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
    borderRadius: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryBubbleActive: {
    backgroundColor: THEME.secondary,
    borderColor: THEME.secondary,
  },
  categoryText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: THEME.white,
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
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: COLUMN_WIDTH - 20,
    backgroundColor: THEME.inputBg,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    color: THEME.text,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  locationBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationBadgeText: {
    color: THEME.white,
    fontSize: 9,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.secondary,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 2,
    marginBottom: 6,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerName: {
    fontSize: 11,
    color: THEME.textMuted,
    flex: 1,
  },
  vitBadge: {
    backgroundColor: '#e11d48',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  vitBadgeText: {
    color: THEME.white,
    fontSize: 8,
    fontWeight: '800',
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
