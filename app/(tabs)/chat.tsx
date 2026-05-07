import React, { useCallback, useState } from 'react';
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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Halo! Ada yang bisa saya bantu hari ini?', sender: 'bot', timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState('');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const handleSend = useCallback(() => {
    if (inputText.trim().length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [userMessage, ...prev]);
    setInputText('');

  // Simulasi respon otomatis dari bot
    setTimeout(() => {
      // 1. Tentukan pesan balasan berdasarkan input user
      let replyText = "Siap! Ada lagi yang bisa saya bantu?"; // Jawaban default
      const lowerInput = inputText.toLowerCase();

      if (lowerInput.includes("halo") || lowerInput.includes("p")) {
        replyText = "Halo juga! Ada apa nih?";
      } else if (lowerInput.includes("kabar")) {
        replyText = "Kabar baik, kalau kamu gimana?";
      } else if (lowerInput.includes("terima kasih") || lowerInput.includes("thanks")) {
        replyText = "Sama-sama! Senang bisa membantu. 😊";
      }

      // 2. Masukkan ke dalam objek pesan bot
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText, // Menggunakan variabel replyText yang dinamis
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [botResponse, ...prev]);
    }, 1000);
  }, [inputText]);

const renderItem: ListRenderItem<Message> = ({ item }) => {
  const isUser = item.sender === 'user';
  return (
    <ThemedView style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      <ThemedView style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.botBubble,
        // Ganti warna ke hijau khas WA (#dcf8c6)
        { backgroundColor: isUser ? '#dcf8c6' : colorScheme === 'dark' ? '#1f2c33' : '#fff' }
      ]}>
        {/* Teks Pesan */}
        <ThemedText style={[styles.messageText, { color: '#000' }]}>
          {item.text}
        </ThemedText>
        
        {/* TAMBAHAN KODE: Jam pengiriman */}
        <ThemedText style={styles.timestampText}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                color: Colors[colorScheme ?? 'light'].text,
                borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ketik pesan..."
            placeholderTextColor={colorScheme === 'dark' ? '#9BA1A6' : '#8E8E93'}
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

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#efe7de', // Warna background chat WhatsApp
  },
  listContent: { 
    paddingHorizontal: 10, 
    paddingTop: 16 
  },
  messageRow: { 
    flexDirection: 'row', 
    marginBottom: 4 // Jarak antar chat lebih rapat
  },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  bubble: { 
    maxWidth: '85%', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    flexDirection: 'row', // Agar teks dan jam bisa sejajar horizontal
    alignItems: 'flex-end',
    elevation: 1, // Shadow di Android
    shadowColor: '#000', // Shadow di iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },
  userBubble: { 
    borderTopRightRadius: 0, // Sudut runcing di kanan atas
  },
  botBubble: { 
    borderTopLeftRadius: 0, // Sudut runcing di kiri atas
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 20 
  },
  timestampText: {
    fontSize: 11,
    color: '#667781',
    marginLeft: 8,
    marginBottom: -2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#00a884', // Hijau tombol WhatsApp
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});