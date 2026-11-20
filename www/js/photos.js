// Progress photos live in IndexedDB on this phone only. They are never uploaded or put in backups.
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open('fianna-photos', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('photos', mode), q = fn(t.objectStore('photos')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
export const allPhotos = async () => { try { return ((await tx('readonly', (s) => s.getAll())) || []).sort((a, b) => a.id - b.id); } catch { return []; } };
export const addPhoto = (date, dataUrl) => tx('readwrite', (s) => s.put({ id: Date.now(), date, dataUrl }));
export const removePhoto = (id) => tx('readwrite', (s) => s.delete(id));
