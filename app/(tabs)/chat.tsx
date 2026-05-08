import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { database } from '@/constants/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onValue, push, ref } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  // State untuk Banner Pending
  const [isProfilePending, setIsProfilePending] = useState(false);
  const [tempName, setTempName] = useState('');

  const insets = useSafeAreaInsets();

  // 1. Cek User saat buka App
  useEffect(() => {
    const checkUser = async () => {
      const savedId = await AsyncStorage.getItem('user_id');
      const savedName = await AsyncStorage.getItem('user_name');
      
      if (!savedId || !savedName) {
        // Jika belum ada profil, aktifkan status "Pending"
        setIsProfilePending(true);
      } else {
        setUserId(savedId);
        setUserName(savedName);
        setUserAvatar(`https://ui-avatars.com/api/?name=${savedName}&background=random`);
      }
    };
    checkUser();
  }, []);

  // 2. Simpan Profil (dari Banner)
  const handleSaveProfile = async () => {
    if (tempName.trim().length < 2) return;
    
    const newId = 'USER-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const avatar = `https://ui-avatars.com/api/?name=${tempName}&background=random`;

    await AsyncStorage.multiSet([
      ['user_id', newId],
      ['user_name', tempName],
      ['user_avatar', avatar]
    ]);

    setUserId(newId);
    setUserName(tempName);
    setUserAvatar(avatar);
    setIsProfilePending(false);
  };

  // 3. Monitor Chat (Tetap jalan meski belum login)
  useEffect(() => {
    const chatRef = ref(database, 'messages');
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formatted = Object.keys(data).map(key => ({ 
            id: key, 
            ...data[key], 
            timestamp: new Date(data[key].timestamp) 
        }));
        setMessages(formatted.reverse());
      }
    });
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    if (isProfilePending) {
        alert("Isi profil dulu di atas ya!");
        return;
    }
    
    push(ref(database, 'messages'), {
      text: inputText.trim(),
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      timestamp: Date.now(),
    });
    setInputText('');
  }, [inputText, userId, userName, userAvatar, isProfilePending]);

  return (
    <ThemedView style={styles.container}>
      
      {/* BANNER PENDING (Melayang di atas chat) */}
      {isProfilePending && (
        <ThemedView style={[styles.pendingBanner, { marginTop: insets.top + 10 }]}>
          <ThemedText style={styles.pendingTitle}>Lengkapi Profil Yuk!</ThemedText>
          <ThemedView style={styles.pendingRow}>
            <TextInput 
              style={styles.pendingInput} 
              placeholder="Ketik namamu..." 
              value={tempName} 
              onChangeText={setTempName} 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <ThemedText style={{color: '#fff', fontWeight: 'bold', fontSize: 12}}>Simpan</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10, paddingTop: isProfilePending ? 100 : 10 }}
          renderItem={({ item }) => {
            // Jika ID belum ada, kita anggap semua pesan adalah orang lain (putih)
            const isMe = userId ? item.senderId === userId : false;
            return (
              <ThemedView style={[styles.msgRow, isMe ? {alignSelf:'flex-end'} : {alignSelf:'flex-start'}]}>
                <ThemedView style={[styles.bubble, {backgroundColor: isMe ? '#dcf8c6' : '#fff'}]}>
                  <ThemedText style={styles.sName}>{item.senderName}</ThemedText>
                  <ThemedText style={{color:'#000'}}>{item.text}</ThemedText>
                </ThemedView>
              </ThemedView>
            );
          }}
        />

        {/* INPUT CHAT */}
        <ThemedView style={[styles.inputArea, {paddingBottom: insets.bottom + 10}]}>
          <TextInput 
            style={styles.input} 
            value={inputText} 
            onChangeText={setInputText} 
            placeholder={isProfilePending ? "Isi profil dulu..." : "Ketik pesan..."}
            editable={!isProfilePending} // User gak bisa ngetik sebelum isi nama
          />
          <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, isProfilePending && {backgroundColor: '#ccc'}]}>
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efe7de' },
  // Style Banner Pending
  pendingBanner: { 
    position: 'absolute', 
    top: 0, left: 10, right: 10, 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  pendingTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: '#00a884' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  pendingInput: { flex: 1, backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, marginRight: 10, color: '#000' },
  saveBtn: { backgroundColor: '#00a884', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  
  msgRow: { marginBottom: 10, maxWidth: '80%' },
  bubble: { padding: 10, borderRadius: 12, elevation: 1 },
  sName: { fontSize: 10, fontWeight: 'bold', color: '#075E54', marginBottom: 2 },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  sendBtn: { backgroundColor: '#00a884', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});