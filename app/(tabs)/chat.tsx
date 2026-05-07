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
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Ini adalah respon otomatis. Chat interface Anda sudah berfungsi!',
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
        <ThemedView
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
            { backgroundColor: isUser ? '#007AFF' : colorScheme === 'dark' ? '#3A3A3C' : '#E9E9EB' },
          ]}>
          <ThemedText style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
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
            <IconSymbol name="paperplane.fill" size={24} color="#007AFF" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 12 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 2 },
  botBubble: { borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16, lineHeight: 20 },
  userMessageText: { color: '#fff' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  input: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, maxHeight: 100 },
  sendButton: { marginLeft: 12, padding: 4 },
});