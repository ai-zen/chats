import { ChatPL } from "../types/ChatPL";

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("scene", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("list")) {
        db.createObjectStore("list", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("config")) {
        db.createObjectStore("config", { keyPath: "key" });
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = reject;
  });
}

export async function getCurrentSceneId(): Promise<string | null> {
  const db = await openDB();
  return new Promise<string>((resolve, reject) => {
    const request = db
      .transaction("config", "readwrite")
      .objectStore("config")
      .get("current-scene-id");
    request.onsuccess = () => {
      resolve((request.result as { key: string; value: string })?.value);
    };
    request.onerror = reject;
  }).finally(() => db.close());
}

export async function setCurrentSceneId(id: string | null | undefined) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("config", "readwrite")
      .objectStore("config")
      .put({ key: "current-scene-id", value: id });
    request.onsuccess = resolve;
    request.onerror = reject;
  }).finally(() => db.close());
}

export async function getSceneList(): Promise<ChatPL.ScenePO[]> {
  const db = await openDB();
  return new Promise<ChatPL.ScenePO[]>((resolve, reject) => {
    const request = db
      .transaction("list", "readonly")
      .objectStore("list")
      .getAll();
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = reject;
  }).finally(() => db.close());
}

export async function addScene(scene: ChatPL.ScenePO) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("list", "readwrite")
      .objectStore("list")
      .add(scene);
    request.onsuccess = resolve;
    request.onerror = reject;
  }).finally(() => db.close());
}

export async function editScene(scene: ChatPL.ScenePO) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("list", "readwrite")
      .objectStore("list")
      .put(scene);
    request.onsuccess = resolve;
    request.onerror = reject;
  }).finally(() => db.close());
}

export async function deleteScene(id: string) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("list", "readwrite")
      .objectStore("list")
      .delete(id);
    request.onsuccess = resolve;
    request.onerror = reject;
  }).finally(() => db.close());
}

export async function getScene(id: string): Promise<ChatPL.ScenePO | null> {
  const db = await openDB();
  return new Promise<ChatPL.ScenePO>((resolve, reject) => {
    const request = db
      .transaction("list", "readonly")
      .objectStore("list")
      .get(id);
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = reject;
  }).finally(() => db.close());
}
