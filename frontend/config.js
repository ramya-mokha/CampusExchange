
// For Android Emulator, localhost is accessed via 10.0.2.2.
// For Expo Go on a real physical Android phone, change this to your machine's local Wi-Fi IP address (e.g. 192.168.1.100).
// Change this to your deployed Render URL once hosted.
const LOCAL_IP = 'localhost';

export const BASE_URL = `http://${LOCAL_IP}:5000`;
export const API_URL = `${BASE_URL}/api`;
export const WS_URL = BASE_URL;

// Helper to normalize image URLs (handles Cloudinary, local server uploads, and old hardcoded IPs)
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400';
  if (imgUrl.startsWith('https://res.cloudinary.com')) return imgUrl;
  if (imgUrl.startsWith('https://') || imgUrl.startsWith(`${BASE_URL}/uploads/`)) return imgUrl;
  if (imgUrl.includes('/uploads/')) {
    const filename = imgUrl.split('/uploads/').pop();
    return `${BASE_URL}/uploads/${filename}`;
  }
  return imgUrl;
};

// Warm, human-friendly marketplace color palette
export const THEME = {
  primary: '#E8622A',        // Warm burnt orange — friendly & energetic
  primaryDark: '#C94F1A',    // Deeper shade for pressed states
  primaryLight: '#FEF0E9',   // Soft peach tint for backgrounds
  secondary: '#2E7D32',      // Earthy forest green for success/verified
  secondaryLight: '#F1F8F2', // Soft mint wash
  danger: '#C0392B',         // Natural warm red
  dangerLight: '#FDF2F2',
  warning: '#D97706',        // Amber
  warningLight: '#FFFBEB',
  background: '#FAF8F5',     // Warm off-white — not cold, feels like paper
  cardBg: '#FFFFFF',
  cardBorder: '#EDE9E3',     // Warm hairline border
  inputBg: '#F5F2EE',        // Warm input background
  text: '#1C1917',           // Warm near-black (stone-900)
  textMuted: '#78716C',      // Warm stone-500
  textLight: '#A8A29E',      // Stone-400 for timestamps
  border: '#EDE9E3',         // Warm divider
  accent: '#7C3AED',         // Purple accent for badges
  gold: '#F59E0B',           // Warm star rating
  white: '#FFFFFF',
  pickupBg: '#FEF0E9',       // Warm peach badge
  pickupText: '#C94F1A',
  chatBubbleMe: '#E8622A',   // My message bubble color
  chatBubbleOther: '#F0EDE8', // Their message bubble — warm gray
};
