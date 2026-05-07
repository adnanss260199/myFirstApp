import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { database } from '@/constants/firebaseConfig';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onValue, push, ref } from 'firebase/database';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  senderId?: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // 1. Inisialisasi User ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        let id = await AsyncStorage.getItem('user_id');
        if (!id) {
          id = 'USER-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          await AsyncStorage.setItem('user_id', id);
        }
        setUserId(id);
      } catch (e) {
        console.error("Gagal memproses User ID", e);
      }
    };
    getUserId();
  }, []);

// 2. Listener Firebase (Menerima Pesan Real-time)
  useEffect(() => {
    if (!userId) return;

    const chatRef = ref(database, 'messages');
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Kita beri tipe Message[] pada variabel ini
        const formattedMessages: Message[] = Object.keys(data).map((key) => ({
          id: key,
          text: data[key].text || '',
          senderId: data[key].senderId || '',
          // Tambahkan "as 'user' | 'bot'" di akhir baris ini
          sender: (data[key].senderId === userId ? 'user' : 'bot') as 'user' | 'bot',
          timestamp: new Date(data[key].timestamp),
        })); 

        // Urutkan dari yang terbaru karena FlatList kita 'inverted'
        setMessages(formattedMessages.reverse());
      } else {
        setMessages([]); // Kosongkan jika database benar-benar kosong
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // 3. Fungsi Kirim Pesan
  const handleSend = useCallback(() => {
    if (inputText.trim().length === 0 || !userId) return;

    const chatRef = ref(database, 'messages');
    const newMessage = {
      text: inputText.trim(),
      senderId: userId,
      timestamp: Date.now(), // Gunakan format number agar aman di Firebase
    };

    push(chatRef, newMessage);
    setInputText('');
  }, [inputText, userId]);

  const renderItem: ListRenderItem<Message> = ({ item }) => {
    // Penentu posisi bubble: user (kanan/hijau), bot/orang lain (kiri/putih)
    const isMe = item.sender === 'user';

    return (
      <ThemedView style={[styles.messageRow, isMe ? styles.userRow : styles.botRow]}>
        <ThemedView style={[
          styles.bubble, 
          isMe ? styles.userBubble : styles.botBubble,
          { backgroundColor: isMe ? '#dcf8c6' : colorScheme === 'dark' ? '#1f2c33' : '#fff' }
        ]}>
          <ThemedText style={[styles.messageText, { color: '#000' }]}>
            {item.text}
          </ThemedText>
          <ThemedText style={styles.timestampText}>
            {item.timestamp instanceof Date && !isNaN(item.timestamp.getTime()) 
              ? item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      style={styles.container}>
      <ThemedView style={styles.container}>
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
        />
        <ThemedView style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: '#000', // Paksa hitam agar terbaca di bubble putih/hijau
                borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ketik pesan..."
            placeholderTextColor="#8E8E93"
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ... (Styles tetap sama seperti kode Anda sebelumnya)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efe7de' },
  listContent: { paddingHorizontal: 10, paddingTop: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 4 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  bubble: { 
    maxWidth: '85%', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    flexDirection: 'row', alignItems: 'flex-end', elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2,
  },
  userBubble: { borderTopRightRadius: 0 },
  botBubble: { borderTopLeftRadius: 0 },
  messageText: { fontSize: 16, lineHeight: 20 },
  timestampText: { fontSize: 11, color: '#667781', marginLeft: 8, marginBottom: -2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f0f0f0' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8, fontSize: 16, maxHeight: 100 },
  sendButton: { backgroundColor: '#00a884', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});