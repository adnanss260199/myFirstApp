import { router } from 'expo-router';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../../src/services/firebaseConfig';

export default function ProfileScreen() {
  // State untuk data User
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // State untuk Form Login/Register
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Pantau status login secara otomatis sewaktu halaman dibuka
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        const uid = currentUser.uid;
        
        try {
          const userRef = ref(database, `users/${uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserEmail(userData.email || currentUser.email || '');
            setUserName(userData.username || (currentUser.email ? currentUser.email.split('@')[0] : 'User'));
          } else {
            const fallbackName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
            setUserEmail(currentUser.email || '');
            setUserName(fallbackName);
          }
        } catch (error) {
          console.error("Gagal ambil data database:", error);
          setUserEmail(currentUser.email || '');
          setUserName(currentUser.email ? currentUser.email.split('@')[0] : 'User');
        }
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserName('');
      }
      setLoading(false);
    });

    return unsubscribe; // Bersihkan listener saat unmount
  }, []);

  // 2. Fungsi Eksekusi Login / Register
  const handleAuth = async () => {
    if (!emailInput || !passwordInput) {
      alert('Harap isi email dan password!');
      return;
    }

    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        // Proses Daftar
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        const uid = userCredential.user.uid;

        // Tulis data ke Realtime Database
        await set(ref(database, `users/${uid}`), {
          email: emailInput,
          username: emailInput.split('@')[0],
          createdAt: new Date().toISOString()
        });

        alert('Akun berhasil dibuat! Silakan masuk.');
        setIsRegisterMode(false);
      } else {
        // Proses Masuk
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      }
      // Kosongkan input setelah sukses
      setEmailInput('');
      setPasswordInput('');
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar!';
      if (error.code === 'auth/weak-password') msg = 'Password minimal 6 karakter!';
      if (error.code === 'auth/invalid-credential') msg = 'Email/password salah, atau periksa konfigurasi Firebase.';
      alert(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Logika pemotong huruf avatar
  const getInitial = (email: string) => {
    if (!email) return '?';
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const avatarInitial = getInitial(userEmail);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  // ==================== TAMPILAN 1: JIKA BELUM LOGIN ====================
  if (!isLoggedIn) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>{isRegisterMode ? 'Daftar Akun Baru' : 'Masuk ke Aplikasi'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email Anda"
          value={emailInput}
          onChangeText={setEmailInput}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
        />

        {authLoading ? (
          <ActivityIndicator size="small" color="#1E90FF" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
            <Text style={styles.authButtonText}>{isRegisterMode ? 'DAFTAR' : 'MASUK'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)}>
          <Text style={styles.switchText}>
            {isRegisterMode ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar di sini'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==================== TAMPILAN 2: JIKA SUDAH LOGIN SUKSES ====================
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/modal')}>
          <Text style={styles.menuText}>Edit Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => alert('Halaman Pengaturan')}>
          <Text style={styles.menuText}>Pengaturan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]}
          onPress={async () => {
            try {
              await auth.signOut();
            } catch (error) {
              console.error("Gagal logout:", error);
            }
          }}
        >
          <Text style={[styles.menuText, styles.logoutText]}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center', // Khusus form auth ditaruh di tengah layar
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E90FF', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutItem: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#000'
  },
  authButton: {
    height: 50,
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    marginTop: 20,
    color: '#1E90FF',
    textAlign: 'center',
  },
});