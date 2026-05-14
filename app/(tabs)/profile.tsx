import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Import auth dan database dari path config yang benar
import { get, ref } from 'firebase/database';
import { auth, database } from '../../src/services/firebaseConfig';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1. Ambil user yang sedang login saat ini dari Firebase Auth
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const uid = currentUser.uid;
          
          // 2. Ambil referensi ke node 'users/UID_PENGGUNA' di Realtime Database
          const userRef = ref(database, `users/${uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            // Mengambil field 'email' dari database. Jika kosong, gunakan email dari Auth.
            setUserEmail(userData.email || currentUser.email || 'tanpaemail@email.com');
          } else {
            // Jika data UID belum terdaftar di node 'users', pakai email langsung dari Auth
            setUserEmail(currentUser.email || 'guest@email.com');
          }
        } else {
          setUserEmail('Belum Login@email.com');
        }
      } catch (error) {
        console.error("Gagal mengambil data dari Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 3. Fungsi pemotong email untuk dijadikan inisial avatar
  const getInitial = (email: string) => {
    if (!email) return '?';
    const username = email.split('@')[0]; // Ambil karakter sebelum '@'
    return username.charAt(0).toUpperCase(); // Ambil huruf pertama & jadikan kapital
  };

  const avatarInitial = getInitial(userEmail);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bagian Avatar / Foto Profil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          {/* Otomatis menampilkan inisial dari email */}
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </View>
        <Text style={styles.userName}>User Nama</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      {/* Bagian Menu Opsi */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Pengaturan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]}>
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
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E90FF', // Kamu bisa ganti warna dasarnya di sini
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
});