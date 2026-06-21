import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";
const rapidsConfig = {
  apiKey: "AIzaSyAaAd5ju7W_-BY_L0Vk6ecaE03DlCWr6g8",
  authDomain: "rapids-platform.firebaseapp.com",
  projectId: "rapids-platform",
  storageBucket: "rapids-platform.firebasestorage.app",
  messagingSenderId: "835676485453",
};

export const rapidsApp = initializeApp(rapidsConfig, "rapids-platform");

// Named Firestore database id (see firestoreService.ts). Defaults to
// "(default)"; set REACT_APP_FIRESTORE_DB="pharmacy" to use the dedicated db.
const FIRESTORE_DB_ID = process.env.REACT_APP_FIRESTORE_DB || "(default)";
export const rapidsFirestore = getFirestore(rapidsApp, FIRESTORE_DB_ID);

const rapidsAuth = getAuth(rapidsApp);
const authReady = signInAnonymously(rapidsAuth).catch((err) =>
  console.warn("Rapids anonymous auth failed:", err),
);

const PROXY_BASE =
  process.env.REACT_APP_PROXY_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3002"
    : "/api");
const STORAGE_PROXY = `${PROXY_BASE}/storage`;

/**
 * Get a proxied download URL for a file stored in the rapids-platform
 * Firebase Storage bucket.  Goes through the local cors-proxy server which
 * has Google Cloud credentials with Storage read access.
 */
export function getRapidsFileDownloadUrl(filePath: string): string {
  if (!filePath) return "";
  return `${STORAGE_PROXY}?path=${encodeURIComponent(filePath)}&t=${Date.now()}`;
}

/**
 * Download a file from rapids-platform Firebase Storage via the proxy
 * and return it as a File object.
 */
export async function getFileFromRapidsStorage(
  filePath: string,
): Promise<File> {
  const url = getRapidsFileDownloadUrl(filePath);
  if (!url) throw new Error("Empty file path");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Storage fetch failed: ${response.status}`);
  const blob = await response.blob();
  const name = filePath.split("/").pop() || "document";
  return new File([blob], name, { type: blob.type });
}

const COLLECTION = "dashboard_config";

export async function getConfigDoc<T>(docId: string): Promise<T | null> {
  await authReady;
  try {
    const docRef = doc(rapidsFirestore, COLLECTION, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const raw = snap.data();
      if (raw?.json) {
        return JSON.parse(raw.json) as T;
      }
      return raw as T;
    }
    return null;
  } catch (error) {
    console.error(`Error reading config "${docId}":`, error);
    return null;
  }
}

export async function setConfigDoc(
  docId: string,
  data: Record<string, any>,
): Promise<boolean> {
  await authReady;
  try {
    const docRef = doc(rapidsFirestore, COLLECTION, docId);
    await setDoc(docRef, {
      json: JSON.stringify(data),
      updated_at: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error(`Error writing config "${docId}":`, error);
    return false;
  }
}
