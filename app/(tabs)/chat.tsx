import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { database } from '@/services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, onValue, push, ref, set } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
  
  // State untuk Fitur Kontak & Login
  const [isProfilePending, setIsProfilePending] = useState(false);
  const [tempName, setTempName] = useState('');
  const [targetContactId, setTargetContactId] = useState(''); // ID teman yang dicari
  const [currentChatId, setCurrentChatId] = useState('global'); // Default ke chat global

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkUser = async () => {
      const savedId = await AsyncStorage.getItem('user_id');
      const savedName = await AsyncStorage.getItem('user_name');
      if (!savedId || !savedName) {
        setIsProfilePending(true);
      } else {
        setUserId(savedId);
        setUserName(savedName);
        setUserAvatar(`https://ui-avatars.com/api/?name=${savedName}&background=random`);
      }
    };
    checkUser();
  }, []);

  const handleSaveProfile = async () => {
    if (tempName.trim().length < 2) return;
    const newId = 'USER-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const avatar = `https://ui-avatars.com/api/?name=${tempName}&background=random`;

    // Simpan ke HP
    await AsyncStorage.multiSet([['user_id', newId], ['user_name', tempName], ['user_avatar', avatar]]);
    
    // Simpan ke Firebase Users agar bisa dicari orang lain
    set(ref(database, 'users/' + newId), { username: tempName, avatar: avatar, id: newId });

    setUserId(newId);
    setUserName(tempName);
    setUserAvatar(avatar);
    setIsProfilePending(false);
  };

  // FUNGSI TAMBAH KONTAK / CARI TEMAN
  const handleAddContact = async () => {
    if (!targetContactId.trim()) return;
    const userRef = ref(database, 'users/' + targetContactId.trim().toUpperCase());
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const contactData = snapshot.val();
      // Buat ID Ruangan Unik (ID kecil _ ID besar) agar konsisten
      const ids = [userId, contactData.id].sort();
      const roomId = `private_${ids[0]}_${ids[1]}`;
      
      setCurrentChatId(roomId);
      Alert.alert("Berhasil!", `Sekarang chatting dengan ${contactData.username}`);
    } else {
      Alert.alert("Gagal", "ID Teman tidak ditemukan di database!");
    }
  };

  useEffect(() => {
    const path = currentChatId === 'global' ? 'messages' : `private_messages/${currentChatId}`;
    const chatRef = ref(database, path);
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formatted = Object.keys(data).map(key => ({ 
            id: key, ...data[key], timestamp: new Date(data[key].timestamp) 
        }));
        setMessages(formatted.reverse());
      } else {
        setMessages([]);
      }
    });
  }, [currentChatId]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isProfilePending) return;
    const path = currentChatId === 'global' ? 'messages' : `private_messages/${currentChatId}`;
    
    push(ref(database, path), {
      text: inputText.trim(),
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      timestamp: Date.now(),
    });
    setInputText('');
  }, [inputText, userId, userName, userAvatar, isProfilePending, currentChatId]);

  return (
    <ThemedView style={styles.container}>
      
      {/* HEADER: LOGIN & TAMBAH KONTAK */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {isProfilePending ? (
          <ThemedView style={styles.pendingRow}>
            <TextInput style={styles.headerInput} placeholder="Nama kamu..." value={tempName} onChangeText={setTempName} />
            <TouchableOpacity style={styles.btn} onPress={handleSaveProfile}><ThemedText style={styles.btnText}>Set Profil</ThemedText></TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.pendingRow}>
            <TextInput style={styles.headerInput} placeholder="Masukkan ID Teman..." value={targetContactId} onChangeText={setTargetContactId} />
            <TouchableOpacity style={[styles.btn, {backgroundColor: '#075E54'}]} onPress={handleAddContact}>
              <ThemedText style={styles.btnText}>Tambah</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentChatId('global')} style={{marginLeft: 10}}>
                <IconSymbol name="house.fill" size={24} color="#666" />
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <ThemedText style={styles.chatStatus}>
            Mode: {currentChatId === 'global' ? '🌍 Chat Global' : '🔒 Chat Privat'}
        </ThemedText>
        
        <FlatList
          data={messages}
          inverted
          renderItem={({ item }) => {
            const isMe = item.senderId === userId;
            return (
              <ThemedView style={[styles.msgRow, isMe ? {alignSelf:'flex-end'} : {alignSelf:'flex-start'}]}>
                <ThemedView style={[styles.bubble, {backgroundColor: isMe ? '#dcf8c6' : '#fff'}]}>
                  <ThemedText style={styles.sName}>{item.senderName} ({item.senderId})</ThemedText>
                  <ThemedText style={{color:'#000'}}>{item.text}</ThemedText>
                </ThemedView>
              </ThemedView>
            );
          }}
        />

        <ThemedView style={[styles.inputArea, {paddingBottom: insets.bottom + 10}]}>
          <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Tulis pesan..." editable={!isProfilePending} />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={isProfilePending}>
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efe7de' },
  header: { padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  headerInput: { flex: 1, backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, marginRight: 8, color: '#000' },
  btn: { backgroundColor: '#00a884', padding: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  chatStatus: { textAlign: 'center', fontSize: 10, color: '#888', marginVertical: 5 },
  msgRow: { marginBottom: 10, maxWidth: '80%', paddingHorizontal: 10 },
  bubble: { padding: 10, borderRadius: 12, elevation: 1 },
  sName: { fontSize: 9, fontWeight: 'bold', color: '#075E54', marginBottom: 2 },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  sendBtn: { backgroundColor: '#00a884', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});