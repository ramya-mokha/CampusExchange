import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { API_URL, THEME } from '../config';

const CATEGORIES = [
  '📚 Books',
  '💻 Electronics',
  '🪑 Furniture',
  '🚲 Cycles',
  '👕 Clothing',
  '🎒 Hostel Essentials',
  '🔌 Accessories',
  'Others'
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

const PICKUP_POINTS = [
  'Library',
  'AB1',
  'AB2',
  'Hostel Gate',
  'Food Court',
  'Academic Block'
];

export default function AddProductScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 12 : 20;

  const { token } = useContext(AuthContext);
  const scrollViewRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Modal states for dropdowns
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height || 320);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (offset) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    }, 150);
  };

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedCondition, setSelectedCondition] = useState(CONDITIONS[2]); // Default 'Good'
  const [selectedLocation, setSelectedLocation] = useState(PICKUP_POINTS[0]); // Default 'Library'
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Request permissions and pick image
  const handlePickImage = async (useCamera = false) => {
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', `We need permission to access your ${useCamera ? 'camera' : 'photos'} to upload listings.`);
        return;
      }

      let result;
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (err) {
      console.error('Image picking error:', err);
    }
  };

  const handleRemoveImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields (Title, Price, and Description).');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', price.trim());
      formData.append('category', selectedCategory);
      formData.append('condition', selectedCondition);
      formData.append('pickupLocation', selectedLocation);

      // Append image files
      if (images.length > 0) {
        images.forEach((uri, idx) => {
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('images', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: filename || `image_${idx}.jpg`,
            type
          });
        });
      }

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Listing Created! 🎉', 'Your item is now live on the Campus Exchange marketplace.', [
          {
            text: 'View Marketplace',
            onPress: () => {
              setName('');
              setDescription('');
              setPrice('');
              setImages([]);
              navigation.navigate('Browse');
            }
          }
        ]);
      } else {
        Alert.alert('Submission Failed', data.message || 'Error occurred while saving product listing.');
      }
    } catch (error) {
      console.error('Submit product error:', error);
      Alert.alert('Error', 'Network request failed. Ensure your server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: keyboardVisible ? Math.max(keyboardHeight + 60, 340) : 40 }
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.headerContainer, { paddingTop: headerTopPadding }]}>
            <Text style={styles.pageTitle}>Post an Item</Text>
            <Text style={styles.pageSubtitle}>List your item for fellow VIT campus students</Text>
          </View>

          {/* Image Selection Area */}
          <View style={styles.section}>
            <Text style={styles.label}>Product Photos</Text>
            <View style={styles.photosWrapper}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageThumbWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => handleRemoveImage(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={12} color={THEME.white} />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <View style={styles.pickerButtonsRow}>
                  <TouchableOpacity 
                    style={styles.uploadCard} 
                    onPress={() => handlePickImage(false)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="images-outline" size={20} color={THEME.primary} />
                    </View>
                    <Text style={styles.uploadCardLabel}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.uploadCard} 
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="camera-outline" size={20} color={THEME.primary} />
                    </View>
                    <Text style={styles.uploadCardLabel}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.hint}>Upload up to 5 clear photos (PNG, JPG). First photo is the cover.</Text>
          </View>

          {/* Product Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Product Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. fx-991EX Calculator / Engineering Physics Notes"
              placeholderTextColor={THEME.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => scrollToInput(100)}
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.label}>Price (₹)</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.pricePrefix}>₹</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="500"
                placeholderTextColor={THEME.textMuted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                onFocus={() => scrollToInput(180)}
              />
            </View>
          </View>

          {/* Select Category — Modern Dropdown */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValueText}>{selectedCategory}</Text>
              <View style={styles.dropdownChevronWrap}>
                <Ionicons name="chevron-down" size={18} color={THEME.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Condition — Clean Segmented Control */}
          <View style={styles.section}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.segmentedContainer}>
              {CONDITIONS.map((cond) => {
                const isSelected = selectedCondition === cond;
                return (
                  <TouchableOpacity
                    key={cond}
                    style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                    onPress={() => setSelectedCondition(cond)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                      {cond}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Designated Pickup Location — Modern Dropdown */}
          <View style={styles.section}>
            <Text style={styles.label}>Safe Campus Pickup Location</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownValueRow}>
                <Ionicons name="location-sharp" size={17} color={THEME.primary} style={{ marginRight: 8 }} />
                <Text style={styles.dropdownValueText}>{selectedLocation}</Text>
              </View>
              <View style={styles.dropdownChevronWrap}>
                <Ionicons name="chevron-down" size={18} color={THEME.textMuted} />
              </View>
            </TouchableOpacity>
            <Text style={styles.hint}>Designated safe zones for physical handovers on campus.</Text>
          </View>

          {/* Detailed Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Detailed Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe condition, usage history, inclusions, and when you are free for handovers."
              placeholderTextColor={THEME.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={THEME.white} />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text style={styles.submitBtnText}>Post Listing Now</Text>
                <Ionicons name="arrow-forward" size={18} color={THEME.white} style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Bottom Sheet Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Category</Text>
                  <TouchableOpacity 
                    onPress={() => setShowCategoryModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color={THEME.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalList}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setShowCategoryModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                          {cat}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={THEME.primary} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={20} color={THEME.border} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Pickup Location Selection Bottom Sheet Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLocationModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Pickup Zone</Text>
                  <TouchableOpacity 
                    onPress={() => setShowLocationModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color={THEME.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalList}>
                  {PICKUP_POINTS.map((loc) => {
                    const isSelected = selectedLocation === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedLocation(loc);
                          setShowLocationModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalLocationLeft}>
                          <Ionicons 
                            name="location-sharp" 
                            size={18} 
                            color={isSelected ? THEME.primary : THEME.textMuted} 
                            style={{ marginRight: 10 }}
                          />
                          <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                            {loc}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={THEME.primary} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={20} color={THEME.border} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 18,
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
    marginTop: 3,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 7,
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },
  input: {
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.border,
    color: THEME.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  multilineInput: {
    height: 96,
    textAlignVertical: 'top',
    paddingTop: 11,
  },

  // Photos
  photosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageThumbWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(28, 25, 23, 0.75)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadCard: {
    width: 74,
    height: 72,
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  uploadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  uploadCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.text,
  },

  // Price with integrated currency symbol
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 46,
  },
  pricePrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textMuted,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    height: '100%',
    padding: 0,
  },

  // Dropdown Select Field
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.cardBg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    flex: 1,
  },
  dropdownChevronWrap: {
    marginLeft: 8,
  },

  // Segmented Control for Condition
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: THEME.primary,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  segmentTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },

  // Submit Button
  submitBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: THEME.white,
    fontSize: 15,
    fontWeight: '700',
  },

  // Bottom Sheet Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
  },
  modalList: {
    marginTop: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: THEME.primaryLight,
  },
  modalLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  modalItemTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
});
