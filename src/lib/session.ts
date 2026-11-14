import AsyncStorage from '@react-native-async-storage/async-storage';

export type Session = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  token: string;
  expiresAt: number; // epoch ms kapan ID token kedaluwarsa
};

const KEY = 'auth_session';

export async function saveSession(session: Session) {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(KEY);
}

// Token dianggap aktif jika belum kedaluwarsa (dengan margin 60 detik).
export function isSessionActive(session: Session | null): session is Session {
  return !!session && session.expiresAt - 60_000 > Date.now();
}