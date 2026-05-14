import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
// PERBAIKAN 1: Jalur import disesuaikan tanpa tanda @ berlebih
import { onAuthStateChanged } from 'firebase/auth';
import { get, onValue, push, ref } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, database } from '../../src/services/firebaseConfig';

export default function ChatScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [isNotLoggedIn, setIsNotLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetContactId, setTargetContactId] = useState(''); 
  const [currentChatId, setCurrentChatId] = useState('global'); 

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const uid = currentUser.uid;
        setUserId(uid);
        
        try {
          const userRef = ref(database, `users/${uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const fallbackName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
            const name = userData.username || fallbackName;
            
            setUserName(name);
            setUserAvatar(`https://ui-avatars.com/api/?name=${name}&background=random`);
          } else {
            const fallbackName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
            setUserName(fallbackName);
            setUserAvatar(`https://ui-avatars.com/api/?name=${fallbackName}&background=random`);
          }
        } catch (error) {
          console.error("Gagal memuat info user chat:", error);
        }
        setIsNotLoggedIn(false);
      } else {
        setIsNotLoggedIn(true);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddContact = async () => {
    if (!targetContactId.trim() || !userId) return;
    
    try {
      const targetUid = targetContactId.trim();
      const userRef = ref(database, 'users/' + targetUid);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const contactData = snapshot.val();
        const ids = [userId, targetUid].sort();
        const roomId = `private_${ids[0]}_${ids[1]}`;
        
        setCurrentChatId(roomId);
        Alert.alert("Berhasil!", `Sekarang terhubung dengan ${contactData.username || 'Pengguna'}`);
        setTargetContactId(''); 
      } else {
        Alert.alert("Gagal", "UID Teman tidak ditemukan di Firebase database!");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mencari kontak.");
    }
  };

  useEffect(() => {
    if (isNotLoggedIn) return;

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
  }, [currentChatId, isNotLoggedIn]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isNotLoggedIn || !userId) return;
    const path = currentChatId === 'global' ? 'messages' : `private_messages/${currentChatId}`;
    
    push(ref(database, path), {
      text: inputText.trim(),
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      timestamp: Date.now(),
    });
    setInputText('');
  }, [inputText, userId, userName, userAvatar, isNotLoggedIn, currentChatId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00a884" />
      </View>
    );
  }

  if (isNotLoggedIn) {
    return (
      <ThemedView style={[styles.container, {justifyContent: 'center', alignItems: 'center', padding: 20}]}>
        <Ionicons name="lock-closed" size={64} color="#888" />
        <ThemedText style={{fontSize: 18, fontWeight: 'bold', marginTop: 15, textAlign: 'center'}}>
          Akses Chat Terkunci
        </ThemedText>
        <ThemedText style={{textAlign: 'center', color: '#666', marginTop: 5, marginBottom: 20}}>
          Kamu harus masuk atau mendaftar akun terlebih dahulu di tab Profile sebelum bisa berkirim pesan.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedView style={styles.pendingRow}>
          <TextInput 
            style={styles.headerInput} 
            placeholder="Masukkan ID/UID Teman..." 
            value={targetContactId} 
            onChangeText={setTargetContactId} 
          />
          <TouchableOpacity style={[styles.btn, {backgroundColor: '#075E54'}]} onPress={handleAddContact}>
            <ThemedText style={styles.btnText}>Cari</ThemedText>
          </TouchableOpacity>
          
          {currentChatId !== 'global' && (
            <TouchableOpacity onPress={() => setCurrentChatId('global')} style={{marginLeft: 12}}>
              <Ionicons name="earth" size={26} color="#00a884" />
            </TouchableOpacity>
          )}
        </ThemedView>
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
                  <ThemedText style={styles.sName}>{item.senderName} ({item.senderId?.substring(0, 5)}...)</ThemedText>
                  <ThemedText style={{color:'#000'}}>{item.text}</ThemedText>
                </ThemedView>
              </ThemedView>
            );
          }}
        />

        <ThemedView style={[styles.inputArea, {paddingBottom: insets.bottom + 10}]}>
          <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Tulis pesan..." />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color="#fff" />
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
  // PERBAIKAN 2 & 3: justifyComtent diganti menjadi justifyContent yang benar
  sendBtn: { backgroundColor: '#00a884', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});