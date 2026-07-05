const RECORDING_LIBRARY_DB_CONFIG = {
  name: 'voice-training-recordings',
  version: 3,
  stores: [
    { name: 'recordings', options: { keyPath: 'id' } },
    { name: 'accompaniments', options: { keyPath: 'id' } },
    { name: 'successSamples', options: { keyPath: 'id' } },
  ],
};

function openRecordingLibraryDb() {
  return appStorage.openIndexedDb(RECORDING_LIBRARY_DB_CONFIG);
}

async function saveRecordingLibraryItem(recording) {
  await appStorage.put(RECORDING_LIBRARY_DB_CONFIG, 'recordings', recording);
}

async function deleteRecordingLibraryItem(id) {
  await appStorage.remove(RECORDING_LIBRARY_DB_CONFIG, 'recordings', id);
}

async function saveAccompanimentLibraryItem(item) {
  await appStorage.put(RECORDING_LIBRARY_DB_CONFIG, 'accompaniments', item);
}

async function deleteAccompanimentLibraryItem(id) {
  await appStorage.remove(RECORDING_LIBRARY_DB_CONFIG, 'accompaniments', id);
}

async function loadRecordingLibraryItems() {
  return appStorage.getAll(RECORDING_LIBRARY_DB_CONFIG, 'recordings');
}

async function loadAccompanimentLibraryItems() {
  return appStorage.getAll(RECORDING_LIBRARY_DB_CONFIG, 'accompaniments');
}

async function saveSuccessLibraryItemToStore(sample) {
  await appStorage.put(RECORDING_LIBRARY_DB_CONFIG, 'successSamples', sample);
}

async function loadSuccessLibraryItems() {
  return appStorage.getAll(RECORDING_LIBRARY_DB_CONFIG, 'successSamples');
}
