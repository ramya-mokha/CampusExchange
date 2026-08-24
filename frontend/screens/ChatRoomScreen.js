import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { API_URL, WS_URL, THEME } from '../config';

// Local helper to create chatId (same logic as backend)
const getChatRoomId = (uid1, uid2) => {
  return [uid1.toString(), uid2.toString()].sort().join('_');
};

export default function ChatRoomScreen({ route, navigation }) {
  const { otherUserId, otherUserName, itemInfo } = route.params;
  const { user, token } = useContext(AuthContext);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const chatId = getChatRoomId(user._id, otherUserId);

  // Load message logs
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/chats/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Initialize WebSockets
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      query: { token }
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      socketRef.current.emit('joinRoom', { chatId });
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for incoming messages
    socketRef.current.on('message', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [otherUserId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const payload = {
      chatId,
      sender: user._id,
      recipient: otherUserId,
      text: inputText.trim()
    };

    // Emit message to backend
    if (socketRef.current && connected) {
      socketRef.current.emit('sendMessage', payload);
    } else {
      // Offline fallback: try REST posting or warn user
      console.warn('Socket not connected. Sending failed.');
    }
    
    setInputText('');
  };

  const renderMessageBubble = ({ item }) => {
    const isMe = item.sender?._id ? item.sender._id === user._id : item.sender === user._id;
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={styles.bubbleText}>{item.text}</Text>
          <Text style={styles.bubbleTime}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
      
      {/* Header bar showing other user details */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>◀</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, connected ? styles.statusOnline : styles.statusOffline]} />
            <Text style={styles.statusText}>{connected ? 'Online' : 'Reconnecting...'}</Text>
          </View>
        </View>
      </View>

      {/* Optional negotiated product banner */}
      {itemInfo && (
        <View style={styles.productBanner}>
          <Text style={styles.productBannerText} numberOfLines={1}>
            Negotiating for: <Text style={styles.boldText}>{itemInfo.name}</Text> (₹{itemInfo.price})
          </Text>
        </View>
      )}

      {/* Message history */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageBubble}
          keyExtractor={(item, idx) => item._id || idx.toString()}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Bottom Text Inputs */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type your message..."
            placeholderTextColor={THEME.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backBtnText: {
    color: THEME.primary,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusOnline: {
    backgroundColor: THEME.secondary,
  },
  statusOffline: {
    backgroundColor: THEME.warning,
  },
  statusText: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  productBanner: {
    backgroundColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  productBannerText: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  boldText: {
    color: THEME.text,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
    width: '100%',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'relative',
  },
  bubbleMe: {
    backgroundColor: THEME.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: THEME.cardBg,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  bubbleText: {
    color: THEME.white,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    color: 'rgba(248, 250, 252, 0.6)',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: THEME.cardBg,
    borderTopWidth: 1,
    borderColor: THEME.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: THEME.inputBg,
    borderRadius: 20,
    color: THEME.text,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: THEME.secondary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
