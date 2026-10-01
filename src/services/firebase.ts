import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  push,
  Database
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyAvJH9WCIY3CFqOe1j83gc6wAxwEMr4JJs",
  authDomain: "channel-varyfay.firebaseapp.com",
  databaseURL: "https://channel-varyfay-default-rtdb.firebaseio.com",
  projectId: "channel-varyfay",
  storageBucket: "channel-varyfay.firebasestorage.app",
  messagingSenderId: "731091117423",
  appId: "1:731091117423:web:0d23e685cdabd97775b49a",
  measurementId: "G-6XQ962CFXH"
};

// Initialize Firebase
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let dbInstance: Database | null = null;
try {
  dbInstance = getDatabase(firebaseApp);
} catch (e) {
  console.warn("Firebase Realtime Database initialization warning:", e);
}

export const db = dbInstance;

export interface TelegramUser {
  chat_id: number | string;
  username?: string;
  first_name?: string;
  last_seen: string;
  joined_at: string;
  status: 'Active' | 'Blocked';
  language?: string;
  broadcast_status: 'allowed' | 'blocked';
}

export interface BroadcastRecord {
  id: string;
  broadcast_number: number;
  name: string;
  text: string;
  button_text?: string;
  button_url?: string;
  total_users: number;
  sent: number;
  failed: number;
  blocked: number;
  progress: number;
  status: 'In Progress' | 'Completed' | 'Stopped' | 'Failed';
  started_at: string;
  completed_at?: string;
}

// Local cache key
const LOCAL_USERS_KEY = "tg_bot_firebase_users_cache";
const LOCAL_BROADCASTS_KEY = "tg_bot_broadcast_records_cache";

// Known demo chat IDs to strip out so ONLY genuine users appear
const DEMO_IDS = new Set([569842104, 612847193, 593847291, 649281745, 582910471]);

function getLocalUsers(): TelegramUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed: TelegramUser[] = JSON.parse(raw);
      return parsed.filter(u => !DEMO_IDS.has(Number(u.chat_id)));
    }
  } catch {}
  return [];
}

function saveLocalUsers(users: TelegramUser[]) {
  try {
    const genuine = users.filter(u => !DEMO_IDS.has(Number(u.chat_id)));
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(genuine));
  } catch {}
}

export async function saveOrUpdateUser(user: TelegramUser): Promise<void> {
  // Update local cache
  const local = getLocalUsers();
  const index = local.findIndex((u) => String(u.chat_id) === String(user.chat_id));
  if (index >= 0) {
    local[index] = { ...local[index], ...user };
  } else {
    local.push(user);
  }
  saveLocalUsers(local);

  // Sync to Firebase RTDB if available
  if (db) {
    try {
      const userRef = ref(db, `users/${user.chat_id}`);
      await set(userRef, user);
    } catch (err) {
      console.warn("Failed to write user to Firebase RTDB, kept in local cache:", err);
    }
  }
}

export async function markUserBlocked(chat_id: number | string): Promise<void> {
  const local = getLocalUsers();
  const index = local.findIndex((u) => String(u.chat_id) === String(chat_id));
  if (index >= 0) {
    local[index].status = 'Blocked';
    local[index].broadcast_status = 'blocked';
    saveLocalUsers(local);
  }

  if (db) {
    try {
      const userRef = ref(db, `users/${chat_id}`);
      await update(userRef, {
        status: 'Blocked',
        broadcast_status: 'blocked',
      });
    } catch (err) {
      console.warn("Failed to mark user blocked in Firebase:", err);
    }
  }
}

export async function fetchAllUsers(): Promise<TelegramUser[]> {
  if (db) {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = (Object.values(val) as TelegramUser[]).filter((u) => !DEMO_IDS.has(Number(u.chat_id)));
        saveLocalUsers(list);
        return list;
      }
    } catch (err) {
      console.warn("Firebase fetch error, reading local fallback:", err);
    }
  }
  return getLocalUsers();
}

export function subscribeToUsers(onUsersChanged: (users: TelegramUser[]) => void): () => void {
  if (!db) {
    onUsersChanged(getLocalUsers());
    return () => {};
  }

  const usersRef = ref(db, 'users');
  const unsubscribe = onValue(
    usersRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = (Object.values(val) as TelegramUser[]).filter((u) => !DEMO_IDS.has(Number(u.chat_id)));
        saveLocalUsers(list);
        onUsersChanged(list);
      } else {
        const local = getLocalUsers();
        onUsersChanged(local);
      }
    },
    (error) => {
      console.warn("Firebase onValue error, falling back to local storage:", error);
      onUsersChanged(getLocalUsers());
    }
  );

  return unsubscribe;
}

export async function saveBroadcastRecord(record: BroadcastRecord): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_BROADCASTS_KEY);
    const list: BroadcastRecord[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(LOCAL_BROADCASTS_KEY, JSON.stringify(list));
  } catch {}

  if (db) {
    try {
      const recordRef = ref(db, `broadcasts/${record.id}`);
      await set(recordRef, record);
    } catch (err) {
      console.warn("Failed to write broadcast record to Firebase:", err);
    }
  }
}

export async function fetchBroadcastRecords(): Promise<BroadcastRecord[]> {
  if (db) {
    try {
      const bRef = ref(db, 'broadcasts');
      const snapshot = await get(bRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: BroadcastRecord[] = Object.values(val);
        list.sort((a, b) => (b.broadcast_number || 0) - (a.broadcast_number || 0));
        return list;
      }
    } catch (err) {
      console.warn("Firebase broadcast fetch error:", err);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_BROADCASTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// Generate realistic initial starter users for demonstration
export function getInitialDemoUsers(): TelegramUser[] {
  return [
    {
      chat_id: 569842104,
      username: "tanvir_ahmed",
      first_name: "Tanvir",
      last_seen: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      status: "Active",
      language: "bn",
      broadcast_status: "allowed",
    },
    {
      chat_id: 612847193,
      username: "sakib_hossain",
      first_name: "Sakib",
      last_seen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      status: "Active",
      language: "bn",
      broadcast_status: "allowed",
    },
    {
      chat_id: 593847291,
      username: "alex_miller",
      first_name: "Alex",
      last_seen: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: "Active",
      language: "en",
      broadcast_status: "allowed",
    },
    {
      chat_id: 649281745,
      username: "rubel_mia",
      first_name: "Rubel",
      last_seen: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      status: "Blocked",
      language: "bn",
      broadcast_status: "blocked",
    },
    {
      chat_id: 582910471,
      username: "nadia_islam",
      first_name: "Nadia",
      last_seen: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: "Active",
      language: "bn",
      broadcast_status: "allowed",
    },
  ];
}
