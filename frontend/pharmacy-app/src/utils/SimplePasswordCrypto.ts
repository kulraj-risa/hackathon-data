import { limit, orderBy } from "firebase/firestore";
import { FirestoreService } from "../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../api/firebase/references";

/**
 * Simple password encryption/decryption compatible with Node.js implementation
 * Uses AES-256-GCM for authenticated encryption
 */
export class SimplePasswordCrypto {
  private encryptionKey: string;
  private key: Uint8Array;

  constructor() {
    this.encryptionKey = "";
    this.key = new Uint8Array();
  }

  /**
   * Initialize the crypto instance by fetching the encryption key
   */
  async initialize(): Promise<void> {
    this.encryptionKey = await this.getEncryptionKey();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.encryptionKey);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", keyData);
    this.key = new Uint8Array(hashBuffer);
  }

  /**
   * Get encryption key from Firestore
   */
  private async getEncryptionKey(): Promise<string> {
    try {
      const collectionPath = FirestoreCollectionReference.encryptionKey();
      const queryConstraints = [orderBy("created_at", "desc"), limit(1)];

      const documents = await FirestoreService.getDocumentsByQuery<any>(
        collectionPath,
        queryConstraints,
      );

      if (!documents || documents.length === 0) {
        throw new Error("No encryption key found");
      }

      const encryptionKey = documents[0].encryption_key;

      if (!encryptionKey) {
        throw new Error("No encryption key found");
      }

      return encryptionKey;
    } catch (error) {
      throw new Error(`Failed to get encryption key: ${error}`);
    }
  }

  /**
   * Encrypt password using AES-256-GCM
   *
   * @param plaintext - Password to encrypt
   * @returns Base64 encoded encrypted data
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      if (!this.key.length) {
        await this.initialize();
      }

      // Generate random 12-byte IV for GCM
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Import the key for encryption
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        this.key,
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );

      // Encrypt the plaintext
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(plaintext);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        cryptoKey,
        plaintextBuffer,
      );

      // Combine IV + ciphertext + auth_tag
      // In Web Crypto API, the auth tag is automatically appended to the ciphertext
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encryptedBuffer), iv.length);

      // Base64 encode the result
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt password using AES-256-GCM
   *
   * @param encryptedData - Base64 encoded encrypted data
   * @returns Decrypted password
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!this.key.length) {
        await this.initialize();
      }

      // Decode from base64
      const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

      // Extract components
      const iv = data.slice(0, 12); // First 12 bytes
      const ciphertextWithTag = data.slice(12); // Everything after IV (ciphertext + auth_tag)

      // Import the key for decryption
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        this.key,
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );

      // Decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        cryptoKey,
        ciphertextWithTag,
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }
}

export const encryptPassword = async (plaintext: string): Promise<string> => {
  try {
    const crypto = new SimplePasswordCrypto();
    return crypto.encrypt(plaintext);
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
};

export const decryptPassword = async (
  encryptedData: string,
): Promise<string> => {
  try {
    const crypto = new SimplePasswordCrypto();
    return crypto.decrypt(encryptedData);
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
};
