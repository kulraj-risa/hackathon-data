//TODO : break the file into smaller chunks
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  FirestoreError,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  QueryCompositeFilterConstraint,
  QueryConstraint,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
} from "firebase/storage";
import { Checklist } from "risa-data-model";
import { CmmEvent } from "../../data-model/cmmEvent";
import { logDataToConsole, logError } from "./../../utils/customLogger";
import * as firebaseDemoConfig from "./../firebase/config-demo.json";
import * as firebaseDevConfig from "./../firebase/config-dev.json";
import * as firebaseProdConfig from "./../firebase/config-prod.json";
import { rapidsApp } from "./rapidsFirestore";
import { FirestoreCollectionReference } from "./references";

const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";

const authConfig = isDemo ? firebaseDemoConfig : firebaseDevConfig;

const dataConfig = isDemo
  ? firebaseDemoConfig
  : process.env.REACT_APP_ENV === "production"
    ? firebaseProdConfig
    : firebaseDevConfig;

// In demo mode, use a single Firebase app so Firestore sees the authenticated user.
// In non-demo mode, auth and data may point to different projects, so keep them separate.
const authApp = initializeApp(authConfig, "auth-app");
const dataApp = isDemo ? authApp : initializeApp(dataConfig, "data-app");

export const firebaseAuth = getAuth(authApp);

// Named Firestore database id. Defaults to "(default)"; set
// REACT_APP_FIRESTORE_DB="pharmacy" to point at the dedicated pharmacy
// database (isolates rules/data from other apps in the shared project).
const FIRESTORE_DB_ID = process.env.REACT_APP_FIRESTORE_DB || "(default)";

export const firestoreDB = getFirestore(dataApp, FIRESTORE_DB_ID);

// Make Analytics initialization optional and safe
export let firebaseAnalytics: ReturnType<typeof getAnalytics> | null = null;

try {
  firebaseAnalytics = getAnalytics(dataApp);
} catch (error) {
  console.warn("Firebase Analytics not available:", error);
  firebaseAnalytics = null;
}

function docToData<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
  const data = doc.data() as DocumentData;

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      data[key] = value.toDate();
    } else if (typeof value === "object" && value !== null) {
      data[key] = convertTimestamps(value);
    }
  }
  return { id: doc.id, ...data } as T;
}

function convertTimestamps(obj: any): any {
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Timestamp) {
      obj[key] = value.toDate();
    } else if (typeof value === "object" && value !== null) {
      obj[key] = convertTimestamps(value);
    }
  }
  return obj;
}

export class FirestoreService {
  static async getDocument<T>(documentPath: string): Promise<T> {
    try {
      const docRef = doc(firestoreDB, documentPath);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docToData<T>(docSnap);
      } else {
        throw new Error("Document does not exist!");
      }
    } catch (error) {
      logError(error as Error, "Error fetching document");
      throw error;
    }
  }

  static getFirestore() {
    return firestoreDB;
  }

  static paginateQueryRealtime<T extends DocumentData>(
    collectionPath: string,
    pageSize: number,
    onData: (data: {
      docs: T[];
      lastVisible: QueryDocumentSnapshot | null;
    }) => void,
    onError?: (error: FirestoreError) => void,
    lastDoc?: QueryDocumentSnapshot,
    extraConstraints: QueryConstraint[] = [],
  ): () => void {
    try {
      const constraints: QueryConstraint[] = [
        ...extraConstraints,
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(pageSize),
      ];

      const q = query(collection(firestoreDB, collectionPath), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => docToData<T>(doc));
          const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;
          onData({ docs, lastVisible });
        },
        (error) => {
          if (onError) {
            onError(error);
          } else {
            logError(error as Error, "Error in paginated query");
          }
        },
      );

      return unsubscribe;
    } catch (error) {
      logError(error as Error, "Error setting up paginated query");
      throw error;
    }
  }

  static async paginateQuery<T extends DocumentData>(
    collectionPath: string,
    pageSize: number,
    onData: (data: {
      docs: T[];
      lastVisible: QueryDocumentSnapshot | null;
    }) => void,
    onError?: (error: FirestoreError) => void,
    lastDoc?: QueryDocumentSnapshot,
    extraConstraints: QueryConstraint[] = [],
  ): Promise<void> {
    try {
      const constraints: QueryConstraint[] = [
        ...extraConstraints,
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(pageSize),
      ];

      const q = query(collection(firestoreDB, collectionPath), ...constraints);

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => docToData<T>(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;
      onData({ docs, lastVisible });
    } catch (error) {
      if (onError) {
        onError(error as FirestoreError);
      } else {
        logError(error as Error, "Error in paginated query");
      }
    }
  }

  static async paginateQueryWithCompositeFilter<T extends DocumentData>(
    collectionPath: string,
    pageSize: number,
    onData: (data: {
      docs: T[];
      lastVisible: QueryDocumentSnapshot | null;
    }) => void,
    onError?: (error: FirestoreError) => void,
    lastDoc?: QueryDocumentSnapshot,
    compositeFilter?: QueryCompositeFilterConstraint,
    extraConstraint?: QueryConstraint | QueryConstraint[],
  ): Promise<void> {
    try {
      const constraints: QueryConstraint[] = [
        ...(compositeFilter
          ? [compositeFilter as unknown as QueryConstraint]
          : []),
        ...(extraConstraint
          ? Array.isArray(extraConstraint)
            ? extraConstraint
            : [extraConstraint]
          : []),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(pageSize),
      ];

      const q = query(collection(firestoreDB, collectionPath), ...constraints);

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => docToData<T>(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;
      onData({ docs, lastVisible });
    } catch (error) {
      if (onError) {
        onError(error as FirestoreError);
      } else {
        logError(
          error as Error,
          "Error in paginated query with composite filter",
        );
      }
    }
  }

  static async getDocumentsByQuery<T>(
    collectionPath: string,
    queryConstraints: QueryConstraint[],
  ): Promise<T[]> {
    try {
      const q = query(
        collection(firestoreDB, collectionPath),
        ...queryConstraints,
      );
      const querySnapshot = await getDocs(q);
      let documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push(docToData<T>(doc));
      });
      return documents;
    } catch (error) {
      logError(error as Error, "Error fetching documents with query");
      throw error;
    }
  }

  static async getAllDocuments<T>(collectionPath: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(
        collection(firestoreDB, collectionPath),
      );
      let documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push(docToData<T>(doc));
      });
      return documents;
    } catch (error) {
      logError(error as Error, "Error fetching documents");
      throw error;
    }
  }

  static async fetchQueryCollectionByCompositeFilter<T>(
    collectionPath: string,
    compositeFilter: QueryCompositeFilterConstraint,
    extraConstraints: QueryConstraint[] = [],
  ): Promise<T[]> {
    try {
      const constraints: QueryConstraint[] = [
        compositeFilter as unknown as QueryConstraint,
        ...extraConstraints,
      ];
      const q = query(collection(firestoreDB, collectionPath), ...constraints);
      const querySnapshot = await getDocs(q);
      let documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push(docToData<T>(doc));
      });
      return documents;
    } catch (error) {
      logError(
        error as Error,
        "Error fetching documents for fetchQueryCollection with composite filter",
      );
      throw error;
    }
  }

  static async getDocumentsByCompositeFilter<T>(
    collectionPath: string,
    compositeFilter: QueryCompositeFilterConstraint,
  ): Promise<T[]> {
    try {
      const q = query(
        collection(firestoreDB, collectionPath),
        compositeFilter as unknown as QueryConstraint,
      );
      const querySnapshot = await getDocs(q);
      let documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push(docToData<T>(doc));
      });
      return documents;
    } catch (error) {
      logError(
        error as Error,
        "Error fetching documents with composite filter",
      );
      throw error;
    }
  }

  static listenToAllDocuments<T>(
    collectionPath: string,
    onDocumentsReceived: (documents: T[]) => void,
    onError?: (error: FirestoreError) => void,
  ): () => void {
    const unsubscribe = onSnapshot(
      collection(firestoreDB, collectionPath),
      (querySnapshot) => {
        let documents: T[] = [];
        querySnapshot.forEach((doc) => {
          documents.push(docToData<T>(doc));
        });
        onDocumentsReceived(documents);
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          logError(error as Error, "Error listening to documents");
        }
      },
    );

    return unsubscribe;
  }

  static async addDocument<T extends { [x: string]: any }>(
    collectionPath: string,
    data: T,
  ): Promise<T> {
    try {
      const docRef = await addDoc(
        collection(firestoreDB, collectionPath),
        data,
      );
      return { id: docRef.id, ...data };
    } catch (error) {
      logError(error as Error, "Error adding document");
      throw error;
    }
  }

  static async addDocumentWithId<T extends { id?: string; [x: string]: any }>(
    collectionPath: string,
    data: T,
  ): Promise<T> {
    try {
      const docRef = data.id
        ? doc(collection(firestoreDB, collectionPath), data.id)
        : doc(collection(firestoreDB, collectionPath));

      await setDoc(docRef, data);

      return { id: docRef.id, ...data };
    } catch (error) {
      logError(error as Error, "Error adding document");
      throw error;
    }
  }

  static async addDocumentWithId2<T extends { id?: string; [x: string]: any }>(
    collectionPath: string,
    data: T,
  ): Promise<T> {
    try {
      const docRef = doc(collection(firestoreDB, collectionPath));
      data["id"] = docRef.id;
      await addDoc(collection(firestoreDB, collectionPath), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      throw error;
    }
  }

  static async updateDocument(
    collectionPath: string,
    docId: string,
    fieldsToUpdate: Record<string, any>,
  ): Promise<void> {
    try {
      const docRef = doc(firestoreDB, collectionPath, docId);
      await updateDoc(docRef, fieldsToUpdate);
    } catch (error) {
      logError(error as Error, "Error updating document");
      throw error;
    }
  }

  static async deleteDocument(
    collectionPath: string,
    docId: string,
  ): Promise<void> {
    try {
      const docRef = doc(firestoreDB, collectionPath, docId);
      await deleteDoc(docRef);
    } catch (error) {
      logError(error as Error, "Error deleting document");
      throw error;
    }
  }

  static listenToDocument<T>(
    collectionPath: string,
    documentId: string,
    onDocumentReceived: (document: T | null) => void,
    onError?: (error: FirestoreError) => void,
  ): () => void {
    const documentRef = doc(firestoreDB, collectionPath, documentId);

    const unsubscribe = onSnapshot(
      documentRef,
      (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const documentData = docToData<T>(documentSnapshot);
          onDocumentReceived(documentData);
        } else {
          onDocumentReceived(null);
        }
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          logError(error as Error, "Error listening to document");
        }
      },
    );

    return unsubscribe;
  }

  static listenToQueryCollection<T>(
    collectionPath: string,
    onCollectionUpdate: (documents: T[]) => void,
    onError?: (error: FirestoreError) => void,
    ...queryConstraints: QueryConstraint[]
  ): () => void {
    const queryCollection = query(
      collection(firestoreDB, collectionPath),
      ...queryConstraints,
    );
    const unsubscribe = onSnapshot(
      queryCollection,
      (querySnapshot) => {
        let documents: T[] = [];
        querySnapshot.forEach((doc) => {
          documents.push(docToData<T>(doc));
        });
        onCollectionUpdate(documents);
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          logError(error as Error, "Error listening to collection");
        }
      },
    );
    return unsubscribe;
  }

  static listenToQueryCollectionForFirstBatch<T>(
    collectionPath: string,
    limitingValue: number,
    onCollectionUpdate: (documents: T[]) => void,
    onError?: (error: FirestoreError) => void,
    ...queryConstraints: QueryConstraint[]
  ): () => void {
    const initialQuery = query(
      collection(firestoreDB, collectionPath),
      ...queryConstraints,
      limit(limitingValue),
    );

    const unsubscribe = onSnapshot(
      initialQuery,
      (querySnapshot) => {
        let documents: T[] = [];
        querySnapshot.forEach((doc) => {
          documents.push(docToData<T>(doc));
        });
        onCollectionUpdate(documents);
      },
      (error) => {
        logError(error as Error, "Error listening to collection");
        if (onError) {
          onError(error);
        } else {
          logError(error as Error, "Error listening to collection");
        }
      },
    );
    return unsubscribe;
  }

  static async fetchQueryCollection<T>(
    collectionPath: string,
    onCollectionUpdate: (documents: T[]) => void,
    onError?: (error: FirestoreError) => void,
    ...queryConstraints: QueryConstraint[]
  ): Promise<void> {
    const queryCollection = query(
      collection(firestoreDB, collectionPath),
      ...queryConstraints,
    );

    try {
      const querySnapshot = await getDocs(queryCollection);
      let documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push(docToData<T>(doc));
      });
      onCollectionUpdate(documents);
    } catch (error) {
      if (onError) {
        onError(error as FirestoreError);
      } else {
        logError(error as Error, "Error fetching collection");
      }
    }
  }

  static async getAllDocumentCount(
    collectionPath: string,
    ...queryConstraints: QueryConstraint[]
  ): Promise<number> {
    try {
      const collectionQuery = query(
        collection(firestoreDB, collectionPath),
        ...queryConstraints,
      );

      const snapShot = await getCountFromServer(collectionQuery);
      return snapShot.data().count;
    } catch (error) {
      logError(error as Error, "Error fetching document count");
      throw error;
    }
  }

  static async getAllDocumentCountByCompositeFilter(
    collectionPath: string,
    compositeFilter: QueryCompositeFilterConstraint,
    extraConstraints: QueryConstraint[] = [],
  ): Promise<number> {
    try {
      const constraints: QueryConstraint[] = [
        compositeFilter as unknown as QueryConstraint,
        ...extraConstraints,
      ];

      const collectionQuery = query(
        collection(firestoreDB, collectionPath),
        ...constraints,
      );

      const snapShot = await getCountFromServer(collectionQuery);
      return snapShot.data().count;
    } catch (error) {
      logError(
        error as Error,
        "Error fetching document count with composite filter",
      );
      throw error;
    }
  }

  static async addHumanEvidencesOn(
    caseId: string,
    data: Checklist[],
    checklistId: string,
  ): Promise<void> {
    try {
      if (!data || data.length === 0) {
        logError(new Error("No data provided to add to the checklist."));
        throw new Error();
      }

      const checklistValueModelObject: Checklist = data[0];
      const docPath = `/orders/${caseId}/filledChecklist/${checklistId}`;
      const docRef = doc(firestoreDB, docPath);
      await setDoc(docRef, checklistValueModelObject, { merge: true });
    } catch (error) {
      logError(error as Error, "Error adding human evidences to checklist");
      throw new Error(
        `Failed to add human evidences to case ID: ${caseId}, checklist ID: ${checklistId}. ${
          error instanceof Error ? error.message : ""
        }`,
      );
    }
  }

  static async addCPTDetailsOnOrder(
    orderId: string,
    cptCode: string,
    cptDescription: string,
  ): Promise<void> {
    const docRef = doc(firestoreDB, "orders", orderId);
    try {
      await setDoc(
        docRef,
        {
          Orders: arrayUnion({
            Procedure: {
              Code: cptCode,
              Description: cptDescription,
            },
            IsDeletable: true,
            PriorAuthNeeded: true,
          }),
        },
        { merge: true },
      );
    } catch (error) {
      logError(error as Error, "Error adding CPT details to order");
    }
  }

  static async deleteCPTDetailsFromOrder(
    orderId: string,
    cptCode: string,
    cptDescription: string,
  ): Promise<void> {
    const docRef = doc(firestoreDB, "orders", orderId);
    try {
      await setDoc(
        docRef,
        {
          Orders: arrayRemove({
            Procedure: {
              Code: cptCode,
              Description: cptDescription,
            },
            IsDeletable: true,
            PriorAuthNeeded: true,
          }),
        },
        { merge: true },
      );
    } catch (error) {
      logError(error as Error, "Error removing CPT details from order");
    }
  }

  static async updateVisitTypeForOrder(
    orderId: string,
    visitType: string,
    visitDescription: string,
  ): Promise<void> {
    const docRef = doc(firestoreDB, "orders", orderId);
    try {
      await updateDoc(docRef, {
        "Visit.Type.Type": visitType,
        "Visit.Type.Description": visitDescription,
      });
    } catch (error) {
      logError(error as Error, "Error updating visit type");
    }
  }

  static async setDocument(
    collectionPath: string,
    docId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      const docRef = doc(firestoreDB, collectionPath, docId);
      await setDoc(docRef, data);
    } catch (error) {
      throw error;
    }
  }
}

export const getFileDownloadUrl = async (filePath: string): Promise<string> => {
  try {
    const storage = getStorage(rapidsApp);
    const fileRef = ref(storage, filePath);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    logError(error as Error, "Error fetching the download URL");
    return "";
  }
};

export const updateFormDetailsForCmm = async (
  orderId: string,
  formData: Record<string, any>,
): Promise<void> => {
  const docRef = doc(
    firestoreDB,
    FirestoreCollectionReference.oncoEmrOrders(),
    orderId,
  );

  try {
    await updateDoc(docRef, {
      "form.form_data": formData,
    });
  } catch (error) {
    logError(error as Error, "Error updating form details");
    throw new Error();
  }
};

export const updateOrCreateDiffDocumentForCmmWithId = async (
  orderId: string,
  docId: string,
  data: Record<string, any>,
  modifiedBy: string,
): Promise<void> => {
  const docRef = doc(
    firestoreDB,
    FirestoreCollectionReference.cmmFormDiffData(orderId),
    docId,
  );

  try {
    await updateDoc(docRef, {
      data: data,
      modifiedBy: modifiedBy,
      modifiedAt: Timestamp.now(),
    });
  } catch (error) {
    const fireStoreError = error as FirestoreError;
    if (fireStoreError.code.includes("not-found")) {
      try {
        await setDoc(docRef, {
          data: data,
          modifiedBy: modifiedBy,
          modifiedAt: Timestamp.now(),
        });
      } catch (createError) {
        logError(createError as Error, "Error creating document");
      }
    } else {
      logError(error as Error, "Error updating document");
    }
  }
};

export const getFileFromFirebaseStorage = async (
  filePath: string,
): Promise<File> => {
  try {
    const downloadURL = await getFileDownloadUrl(filePath);
    const response = await fetch(downloadURL);
    const blob = await response.blob();
    logDataToConsole("Fetched file from Firebase Storage", blob);
    return new File([blob], filePath);
  } catch (error) {
    logError(error as Error, "Could not download the file");
    throw new Error("Error downloading document from url");
  }
};

export const updateMedicalPaOrder = async (
  orderId: string,
  data: Record<string, any>,
): Promise<void> => {
  try {
    await FirestoreService.updateDocument(
      FirestoreCollectionReference.medicalPaOrders(),
      orderId,
      data,
    );
  } catch (error) {
    logError(error as Error, "Error updating medical pa order");
    throw new Error();
  }
};

export const updateEvBvStatus = async (
  orderId: string,
  status: string,
): Promise<void> => {
  const docRef = doc(
    firestoreDB,
    FirestoreCollectionReference.medicalPaOrders(),
    orderId,
  );
  try {
    await updateDoc(docRef, {
      "status.financial_review": status,
      "status_history.evbv_at": new Date().toISOString(),
    });
  } catch (error) {
    logError(error as Error, "Error updating evbv status");
    throw new Error();
  }
};
export const addCmmEvent = async (
  orderId: string,
  event: CmmEvent,
): Promise<void> => {
  try {
    await FirestoreService.addDocument(
      FirestoreCollectionReference.cmmEvents(orderId),
      event,
    );
  } catch (error) {
    logError(error as Error, "Error adding CMM event");
  }
};

export async function batchUpdateDocuments(
  updates: {
    collectionRef: ReturnType<typeof doc>["parent"];
    docId: string;
    data: Record<string, any>;
  }[],
): Promise<void> {
  const batch = writeBatch(firestoreDB);

  for (const { collectionRef, docId, data } of updates) {
    const docRef = doc(collectionRef, docId);
    batch.update(docRef, data);
  }

  await batch.commit();
}

export const writeOtpErrorToFirebase = async (
  email: string,
  error: string,
): Promise<void> => {
  await FirestoreService.addDocument(FirestoreCollectionReference.otpErrors(), {
    email: email,
    error: error,
    created_at: Timestamp.now(),
  });
};

export const deleteFileFromFirebaseStorage = async (
  filePath: string,
): Promise<void> => {
  try {
    const storage = getStorage(rapidsApp);
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    logError(error as Error, "Error deleting file from Firebase Storage");
    throw new Error(
      `Failed to delete file from Firebase Storage at ${filePath}: ${(error as Error).message}`,
    );
  }
};
