import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { clearSession, isSessionActive, loadSession, saveSession, type Session } from '../lib/session';

type AuthState = {
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dipanggil saat app dibuka (memulihkan sesi) dan setiap login/logout.
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) {
        // Tidak ada sesi Firebase -> hapus data lokal, tampilkan login.
        await clearSession();
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        const saved = await loadSession();

        if (saved && saved.uid === user.uid && isSessionActive(saved)) {
          // Token lokal masih aktif -> pakai langsung (bypass halaman login).
          setSession(saved);
        } else {
          // Belum ada / sudah kedaluwarsa -> minta token baru dari Firebase, lalu simpan.
          const result = await user.getIdTokenResult(true);
          const fresh: Session = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            token: result.token,
            expiresAt: new Date(result.expirationTime).getTime(),
          };
          await saveSession(fresh);
          setSession(fresh);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function logout() {
    try {
      await GoogleSignin.signOut(); // lepas akun Google di perangkat
    } catch {}
    await signOut(getAuth()); // listener di atas otomatis menghapus data lokal
  }

  return (
    <AuthContext.Provider value={{ session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}