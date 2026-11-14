import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { collection, getFirestore, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { colors, styles } from '../theme';
import type { Mahasiswa } from '../types';

export default function HomeScreen() {
  const { session, logout } = useAuth();
  const [data, setData] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(getFirestore(), 'mahasiswa'), orderBy('nama'));

    // Realtime: list otomatis ter-update jika data di Firestore berubah.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Mahasiswa, 'id'>),
          })),
        );
        setError('');
        setLoading(false);
      },
      (err) => {
        setError(`Gagal memuat data: ${err.message}`);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (!session) return null;

  return (
    <View style={styles.screen}>
      <View style={local.header}>
        {session.photoURL ? (
          <Image source={{ uri: session.photoURL }} style={local.avatar} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={local.hello}>Halo, {session.displayName ?? 'Pengguna'}</Text>
          <Text style={local.email}>{session.email}</Text>
        </View>
        <Pressable onPress={logout} style={local.logoutBtn} accessibilityRole="button">
          <Text style={local.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.teal} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListHeaderComponent={<Text style={styles.subtitle}>Daftar Mahasiswa ({data.length})</Text>}
          ListEmptyComponent={
            <Text style={styles.muted}>{error || 'Belum ada data mahasiswa di database.'}</Text>
          }
          renderItem={({ item }) => (
            <View style={local.card}>
              <Text style={styles.label}>{item.nama}</Text>
              <Text style={styles.text}>NIM: {item.nim}</Text>
              <Text style={styles.muted}>
                {item.jurusan}
                {item.angkatan ? ` • Angkatan ${item.angkatan}` : ''}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const local = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingTop: 48, backgroundColor: colors.navy,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  hello: { color: colors.white, fontSize: 16, fontWeight: '700' },
  email: { color: colors.softTeal, fontSize: 12 },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.teal },
  logoutText: { color: colors.white, fontWeight: '600' },
  card: {
    padding: 16, gap: 4, borderRadius: 16,
    backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(23,50,77,0.1)',
  },
});