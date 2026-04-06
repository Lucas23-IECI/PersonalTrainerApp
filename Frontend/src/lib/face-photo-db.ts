// =============================================
// Face Photo Storage — IndexedDB
// Stores face progress photos with full-res blobs
// =============================================

export type FacePhotoAngle = "front" | "left" | "right" | "45-left" | "45-right" | "smile";

export interface FacePhotoMeta {
  id: string;
  date: string;       // YYYY-MM-DD
  angle: FacePhotoAngle;
  mirrored: boolean;
  createdAt: string;   // ISO timestamp
  width: number;
  height: number;
  analysisData?: FaceAnalysisResult;
}

export interface FaceAnalysisResult {
  symmetryScore: number;     // 0-100
  midlineDeviation: number;  // degrees
  chinTorsion: number;       // degrees
  eyeSymmetry: number;       // 0-100
  mouthSymmetry: number;     // 0-100
  jawSymmetry: number;       // 0-100
  landmarks?: number[][];    // [x,y] pairs
  timestamp: string;
}

interface FacePhotoRecord {
  id: string;
  meta: FacePhotoMeta;
  blob: Blob;
  mirroredBlob?: Blob;
}

const DB_NAME = "markpt-face-photos";
const DB_VERSION = 1;
const STORE_NAME = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("date", "meta.date", { unique: false });
        store.createIndex("angle", "meta.angle", { unique: false });
      }
    };
  });
}

function generatePhotoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function saveFacePhoto(
  blob: Blob,
  angle: FacePhotoAngle,
  mirroredBlob?: Blob,
  width = 0,
  height = 0,
): Promise<FacePhotoMeta> {
  const db = await openDB();
  const id = generatePhotoId();
  const now = new Date();
  const meta: FacePhotoMeta = {
    id,
    date: now.toISOString().split("T")[0],
    angle,
    mirrored: false,
    createdAt: now.toISOString(),
    width,
    height,
  };
  const record: FacePhotoRecord = { id, meta, blob, mirroredBlob };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(meta);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFacePhotoMetas(): Promise<FacePhotoMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const records = request.result as FacePhotoRecord[];
      resolve(records.map(r => r.meta).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getFacePhotoBlob(id: string, mirrored = false): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => {
      const record = request.result as FacePhotoRecord | undefined;
      if (!record) return resolve(null);
      resolve(mirrored && record.mirroredBlob ? record.mirroredBlob : record.blob);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFacePhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateFacePhotoAnalysis(id: string, analysis: FaceAnalysisResult): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as FacePhotoRecord | undefined;
      if (!record) return resolve();
      record.meta.analysisData = analysis;
      store.put(record);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFacePhotosByDate(date: string): Promise<FacePhotoMeta[]> {
  const allMetas = await getFacePhotoMetas();
  return allMetas.filter(m => m.date === date);
}

export async function getUniqueDates(): Promise<string[]> {
  const metas = await getFacePhotoMetas();
  const dates = new Set(metas.map(m => m.date));
  return Array.from(dates).sort().reverse();
}

export async function getFacePhotoCount(): Promise<number> {
  const metas = await getFacePhotoMetas();
  return metas.length;
}

/** Get a photo as a data URL for display */
export async function getFacePhotoDataUrl(id: string, mirrored = false): Promise<string | null> {
  const blob = await getFacePhotoBlob(id, mirrored);
  if (!blob) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
