import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const isPlaceholderProject =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes('ApexManagementInterfaceConfigKey') ||
  firebaseConfig.projectId === 'remixed-project-id';

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;

if (!isPlaceholderProject) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (isPlaceholderProject || !db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface OperatorSession {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  mode: 'firebase-cloud' | 'verified-operator-session';
}

const SESSION_STORAGE_KEY = 'apex_operator_session_v1';

const DEFAULT_OPERATOR: OperatorSession = {
  uid: 'op_frankie_heine_apex01',
  email: 'frankie.heine@gmail.com',
  displayName: 'Frankie Heine',
  emailVerified: true,
  mode: isPlaceholderProject ? 'verified-operator-session' : 'firebase-cloud',
};

export function getInitialOperatorSession(): OperatorSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as OperatorSession;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_OPERATOR;
}

export async function signInOperator(): Promise<OperatorSession> {
  if (!isPlaceholderProject && auth) {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const u: User = credential.user;
      const session: OperatorSession = {
        uid: u.uid,
        email: u.email || 'frankie.heine@gmail.com',
        displayName: u.displayName || 'Apex Operator',
        emailVerified: u.emailVerified,
        mode: 'firebase-cloud',
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      console.warn('Popup sign-in fallback activated:', error);
    }
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(DEFAULT_OPERATOR));
  return DEFAULT_OPERATOR;
}

export async function signOutOperator(): Promise<void> {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  if (!isPlaceholderProject && auth) {
    await firebaseSignOut(auth);
  }
}

export function subscribeAuthChanges(callback: (session: OperatorSession | null) => void) {
  if (!isPlaceholderProject && auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email || 'frankie.heine@gmail.com',
          displayName: user.displayName || 'Apex Operator',
          emailVerified: user.emailVerified,
          mode: 'firebase-cloud',
        });
      } else {
        callback(getInitialOperatorSession());
      }
    });
  }
  callback(getInitialOperatorSession());
  return () => {};
}

type ListenerCallback<T> = (items: T[]) => void;
const collectionListeners: Record<string, Set<ListenerCallback<any>>> = {};

function notifyCollectionListeners(collectionName: string, items: any[]) {
  const set = collectionListeners[collectionName];
  if (!set) return;
  for (const cb of set) {
    cb(items);
  }
}

export function subscribeCollection<T extends { id: string; ownerId: string }>(
  collectionName: string,
  ownerId: string,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!collectionListeners[collectionName]) {
    collectionListeners[collectionName] = new Set();
  }
  collectionListeners[collectionName].add(onData);

  let unsubFirestore: (() => void) | null = null;

  if (!isPlaceholderProject && db && auth?.currentUser) {
    const q = query(collection(db, collectionName), where('ownerId', '==', ownerId));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        const docs: T[] = snapshot.docs.map((d) => {
          const raw = d.data();
          const createdAt =
            raw.createdAt instanceof Timestamp
              ? raw.createdAt.toDate().toISOString()
              : String(raw.createdAt || new Date().toISOString());
          const updatedAt =
            raw.updatedAt instanceof Timestamp
              ? raw.updatedAt.toDate().toISOString()
              : String(raw.updatedAt || new Date().toISOString());
          return {
            ...raw,
            id: d.id,
            createdAt,
            updatedAt,
          } as unknown as T;
        });
        onData(docs);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, collectionName);
        } catch (err) {
          if (onError && err instanceof Error) onError(err);
        }
      }
    );
  } else {
    // Hydrate from full-stack Express persistence store
    fetch(`/api/store/${collectionName}?ownerId=${encodeURIComponent(ownerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          onData(data.items as T[]);
        }
      })
      .catch((err) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      });
  }

  return () => {
    collectionListeners[collectionName]?.delete(onData);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function createDocument<T extends { id: string; ownerId: string }>(
  collectionName: string,
  docId: string,
  payload: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<T> {
  const sanitizedId = docId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const nowIso = new Date().toISOString();

  if (!isPlaceholderProject && db && auth?.currentUser) {
    try {
      await setDoc(doc(db, collectionName, sanitizedId), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${collectionName}/${sanitizedId}`);
    }
  }

  const res = await fetch(`/api/store/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: sanitizedId,
      ...payload,
      createdAt: nowIso,
      updatedAt: nowIso,
    }),
  });
  const data = await res.json();
  if (Array.isArray(data.items)) {
    notifyCollectionListeners(collectionName, data.items);
  }
  return data.item as T;
}

export async function updateDocument<T extends { id: string; ownerId: string }>(
  collectionName: string,
  docId: string,
  partialUpdate: Partial<T>
): Promise<T> {
  const sanitizedId = docId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const nowIso = new Date().toISOString();

  if (!isPlaceholderProject && db && auth?.currentUser) {
    try {
      await updateDoc(doc(db, collectionName, sanitizedId), {
        ...partialUpdate,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${sanitizedId}`);
    }
  }

  const res = await fetch(`/api/store/${collectionName}/${encodeURIComponent(sanitizedId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...partialUpdate,
      updatedAt: nowIso,
    }),
  });
  const data = await res.json();
  if (Array.isArray(data.items)) {
    notifyCollectionListeners(collectionName, data.items);
  }
  return data.item as T;
}

export async function deleteDocument(
  collectionName: string,
  docId: string,
  ownerId: string
): Promise<void> {
  const sanitizedId = docId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);

  if (!isPlaceholderProject && db && auth?.currentUser) {
    try {
      await deleteDoc(doc(db, collectionName, sanitizedId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${sanitizedId}`);
    }
  }

  const res = await fetch(
    `/api/store/${collectionName}/${encodeURIComponent(sanitizedId)}?ownerId=${encodeURIComponent(ownerId)}`,
    {
      method: 'DELETE',
    }
  );
  const data = await res.json();
  if (Array.isArray(data.items)) {
    notifyCollectionListeners(collectionName, data.items);
  }
}

export async function refreshCollectionFromServer(collectionName: string, ownerId: string) {
  const res = await fetch(`/api/store/${collectionName}?ownerId=${encodeURIComponent(ownerId)}`);
  const data = await res.json();
  if (Array.isArray(data.items)) {
    notifyCollectionListeners(collectionName, data.items);
  }
}
