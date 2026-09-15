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
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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
  const preKeyboardScrollY = useRef(0);
  const keyboardActive = useRef(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        keyboardActive.current = true;
        setKeyboardVisible(true);
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        keyboardActive.current = false;
        // Smoothly restore screen to its exact pre-keyboard position with zero extra gap
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: preKeyboardScrollY.current, animated: true });
        }, 50);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleScroll = (event) => {
    if (!keyboardActive.current) {
      preKeyboardScrollY.current = event.nativeEvent.contentOffset.y;
    }
  };

  const handleInputFocus = (targetY) => {
    keyboardActive.current = true;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 120);
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
        // Append selected image uri
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
    if (!name || !description || !price) {
      Alert.alert('Missing Info', 'Please fill in all fields (Name, Description, and Price).');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
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
        Alert.alert('Listing Created!', 'Your item is now live on the Campus Exchange marketplace.', [
          {
            text: 'OK',
            onPress: () => {
              // Reset state
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: keyboardVisible ? 140 : 20 }
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.pageTitle, { paddingTop: headerTopPadding }]}>Post an Item</Text>

          {/* Image Selection Area */}
          <View style={styles.section}>
            <Text style={styles.label}>Product Photos</Text>
            <View style={styles.imagesRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(idx)}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <View style={styles.pickerButtonsContainer}>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage(false)}>
                    <Text style={styles.pickerIcon}>🖼️</Text>
                    <Text style={styles.pickerLabel}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage(true)}>
                    <Text style={styles.pickerIcon}>📷</Text>
                    <Text style={styles.pickerLabel}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.hint}>Upload up to 5 photos. High resolution images make sales faster.</Text>
          </View>

          {/* Item details */}
          <View style={styles.section}>
            <Text style={styles.label}>Product Name / Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. fx-991EX Calculator / HC Verma Vol 1"
              placeholderTextColor={THEME.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => handleInputFocus(140)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor={THEME.textMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              onFocus={() => handleInputFocus(220)}
            />
          </View>

          {/* Categories choices */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.selectorBubble,
                    selectedCategory === cat && styles.selectorBubbleActive
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.selectorBubbleText,
                    selectedCategory === cat && styles.selectorBubbleTextActive
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Condition choices */}
          <View style={styles.section}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[
                    styles.conditionBtn,
                    selectedCondition === cond && styles.conditionBtnActive
                  ]}
                  onPress={() => setSelectedCondition(cond)}
                >
                  <Text style={[
                    styles.conditionBtnText,
                    selectedCondition === cond && styles.conditionBtnTextActive
                  ]}>{cond}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Campus Pickup Location Dropdown */}
          <View style={styles.section}>
            <Text style={styles.label}>📍 Designated Safe Pickup Location</Text>
            <Text style={styles.hint}>Choose an official campus zone for physical handovers:</Text>
            <View style={styles.locationsGrid}>
              {PICKUP_POINTS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.locationBtn,
                    selectedLocation === loc && styles.locationBtnActive
                  ]}
                  onPress={() => setSelectedLocation(loc)}
                >
                  <Text style={[
                    styles.locationBtnText,
                    selectedLocation === loc && styles.locationBtnTextActive
                  ]}>📍 {loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Detailed Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe condition, usage history, inclusions, and when you are available for exchanges."
              placeholderTextColor={THEME.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              onFocus={() => handleInputFocus(460)}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={THEME.white} />
            ) : (
              <Text style={styles.submitBtnText}>Post Listing Now</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  multilineInput: {
    height: 88,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 3,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  imageWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: THEME.white,
    fontSize: 10,
    fontWeight: '800',
  },
  pickerButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  imagePickerBtn: {
    width: 72,
    height: 72,
    backgroundColor: THEME.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerIcon: {
    fontSize: 20,
  },
  pickerLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 2,
  },
  horizontalScroll: {
    marginTop: 4,
  },
  selectorBubble: {
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  selectorBubbleActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  selectorBubbleText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  selectorBubbleTextActive: {
    color: THEME.white,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  conditionBtn: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  conditionBtnActive: {
    backgroundColor: THEME.secondary,
    borderColor: THEME.secondary,
  },
  conditionBtnText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  conditionBtnTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  locationBtn: {
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  locationBtnActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  locationBtnText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
  },
  locationBtnTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: THEME.secondary,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
