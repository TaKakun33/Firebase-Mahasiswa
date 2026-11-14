import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { colors, styles } from '../theme';

const WEB_CLIENT_ID = '867090622920-vhcr25kjisasnnq36g0p6130g2t9qvuf.apps.googleusercontent.com';
export default function LoginScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  }, []);

  async function loginWithGoogle() {
    setBusy(true);
    setError('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // User menutup dialog pilih akun -> bukan error
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) throw new Error('ID token Google tidak tersedia.');

      // Tukar token Google dengan kredensial Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getAuth(), credential);
      // Selanjutnya ditangani AuthContext -> simpan sesi -> pindah ke Home
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) {
        setError('Proses login masih berjalan.');
      } else if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services tidak tersedia di perangkat ini.');
      } else {
        setError('Login Google gagal. Periksa SHA-1, Web Client ID, dan koneksi internet.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.background} pointerEvents="none">
        <View style={styles.peach} />
        <View style={styles.teal} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.shadow}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>DATA MAHASISWA</Text>
            <Text style={styles.title}>Selamat datang</Text>
            <Text style={styles.muted}>Masuk dengan akun Google untuk melihat data mahasiswa.</Text>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={loginWithGoogle}
              style={({ pressed }) => [styles.button, { opacity: busy ? 0.5 : pressed ? 0.8 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonLabel}>Masuk dengan Google</Text>
              )}
            </Pressable>

            {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}