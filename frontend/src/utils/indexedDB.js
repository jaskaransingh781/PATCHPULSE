import axios from 'axios';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PatchPulseDB', 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('imageQueue')) {
        db.createObjectStore('imageQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Convert File/Blob to Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Save image data to IndexedDB
export const queueImageUpload = async (file, metadata = {}) => {
  try {
    const db = await initDB();
    const base64Data = await fileToBase64(file);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['imageQueue'], 'readwrite');
      const store = transaction.objectStore('imageQueue');
      
      const item = {
        data: base64Data, // Base64 string instead of raw FormData/File
        filename: file.name,
        type: file.type,
        metadata: metadata,
        timestamp: new Date().getTime(),
        status: 'queued'
      };

      const request = store.add(item);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to queue image:', error);
    throw error;
  }
};

// Get all queued images
export const getQueuedImages = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['imageQueue'], 'readonly');
    const store = transaction.objectStore('imageQueue');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Remove image from queue after successful upload
export const removeQueuedImage = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['imageQueue'], 'readwrite');
    const store = transaction.objectStore('imageQueue');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clear the entire queue
export const clearQueue = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['imageQueue'], 'readwrite');
    const store = transaction.objectStore('imageQueue');
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Helper to convert base64 to Blob
const base64ToBlob = (base64, mime) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
};

// Sync queued images
export const syncOfflineQueue = async () => {
  if (!navigator.onLine) return;
  
  try {
    const queuedItems = await getQueuedImages();
    if (queuedItems.length === 0) return;
    
    console.log(`Syncing ${queuedItems.length} offline reports...`);
    
    for (const item of queuedItems) {
      try {
        const formData = new FormData();
        const blob = base64ToBlob(item.data, item.type);
        formData.append('image', blob, item.filename);
        
        if (item.metadata.longitude) formData.append('longitude', item.metadata.longitude);
        if (item.metadata.latitude) formData.append('latitude', item.metadata.latitude);
        if (item.metadata.reporterNotes) formData.append('reporterNotes', item.metadata.reporterNotes);
        if (item.metadata.wardOrDistrict) formData.append('wardOrDistrict', item.metadata.wardOrDistrict);
        
        await axios.post(import.meta.env.VITE_API_URL + '/issues/report', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        await removeQueuedImage(item.id);
        console.log(`Successfully synced offline report ${item.id}`);
      } catch (err) {
        console.error(`Failed to sync offline report ${item.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error during offline sync:', error);
  }
};
