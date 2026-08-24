import { Platform } from 'react-native';

// For Android Emulator, localhost is accessed via 10.0.2.2.
// For Expo Go on a real physical Android phone, change this to your machine's local Wi-Fi IP address (e.g. 192.168.1.100).
// Change this to your deployed Render URL once hosted.
const LOCAL_IP = '10.0.2.2'; 

export const BASE_URL = `http://${LOCAL_IP}:5000`;
export const API_URL = `${BASE_URL}/api`;
export const WS_URL = BASE_URL;

// Color Palette for Premium Dark Mode / Light Mode aesthetics
export const THEME = {
  primary: '#6366f1',      // Indigo
  primaryDark: '#4f46e5',
  secondary: '#10b981',    // Emerald Green
  danger: '#ef4444',       // Rose Red
  warning: '#f59e0b',      // Amber Yellow
  background: '#0f172a',   // Sleek Slate Dark (900)
  cardBg: '#1e293b',       // Slate (800)
  inputBg: '#334155',      // Slate (700)
  text: '#f8fafc',         // Slate Light (50)
  textMuted: '#94a3b8',    // Slate Medium (400)
  border: '#334155',
  accent: '#a855f7',       // Purple Accent
  gold: '#fbbf24',         // Gold Star
  white: '#ffffff',
  pickupBg: '#312e81',     // Deep Indigo for safe locations
  pickupText: '#c7d2fe'
};
