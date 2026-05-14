import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ModalScreen() {
  const [name, setName] = useState('');

  const handleSave = () => {
    // Nanti di sini kita masukkan logika untuk menyimpan nama baru ke Firebase Realtime Database
    alert(`Nama berhasil diubah menjadi: ${name}`);
    router.back(); // Otomatis menutup modal dan kembali ke halaman profil
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profil Kamu</Text>
      <View style={styles.separator} />

      {/* Input Teks untuk Nama Baru */}
      <Text style={styles.label}>Nama Lengkap</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan nama baru..."
        value={name}
        onChangeText={setName}
      />

      {/* Tombol Simpan */}
      <View style={{ marginTop: 20, width: '100%' }}>
        <Button title="Simpan Perubahan" onPress={handleSave} color="#1E90FF" />
      </View>

      {/* Mengatur warna status bar di iOS / Android */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
    backgroundColor: '#eee',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
});