const appStorage = (() => {
  function openIndexedDb({ name, version, stores = [] }) {
    if (!window.indexedDB) {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = () => {
        stores.forEach((store) => {
          if (!request.result.objectStoreNames.contains(store.name)) {
            request.result.createObjectStore(store.name, store.options || { keyPath: 'id' });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(config, storeName, mode, action) {
    const db = await openIndexedDb(config);
    if (!db || !db.objectStoreNames.contains(storeName)) {
      return null;
    }
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const result = action(store, transaction);
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }

  async function getAll(config, storeName) {
    const result = await withStore(config, storeName, 'readonly', (store) => {
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
    return result || [];
  }

  function put(config, storeName, value) {
    return withStore(config, storeName, 'readwrite', (store) => {
      store.put(value);
    });
  }

  function putMany(config, storeName, values) {
    return withStore(config, storeName, 'readwrite', (store) => {
      values.forEach((value) => store.put(value));
    });
  }

  function remove(config, storeName, id) {
    return withStore(config, storeName, 'readwrite', (store) => {
      store.delete(id);
    });
  }

  function getJson(key, fallback = null, storage = window.localStorage) {
    try {
      const raw = storage?.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error(error);
      return fallback;
    }
  }

  function setJson(key, value, storage = window.localStorage) {
    try {
      storage?.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  return {
    openIndexedDb,
    getAll,
    put,
    putMany,
    remove,
    getJson,
    setJson,
  };
})();
