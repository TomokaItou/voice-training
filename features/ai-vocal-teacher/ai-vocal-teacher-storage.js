const AI_TEACHER_DB_NAME = 'voice-training-ai-vocal-teacher';
const AI_TEACHER_DB_VERSION = 9;
const AI_TEACHER_DB_CONFIG = {
  name: AI_TEACHER_DB_NAME,
  version: AI_TEACHER_DB_VERSION,
  stores: [
    { name: 'recordings', options: { keyPath: 'id' } },
    { name: 'vectors', options: { keyPath: 'id' } },
    { name: 'estimates', options: { keyPath: 'id' } },
    { name: 'comparisons', options: { keyPath: 'id' } },
    { name: 'memoryRecords', options: { keyPath: 'id' } },
    { name: 'teachingSessions', options: { keyPath: 'id' } },
    { name: 'successMemories', options: { keyPath: 'id' } },
    { name: 'lessonStates', options: { keyPath: 'lesson_id' } },
    { name: 'experimentSessions', options: { keyPath: 'id' } },
    { name: 'courseProgress', options: { keyPath: 'id' } },
    { name: 'skillProfiles', options: { keyPath: 'id' } },
    { name: 'lessonAttempts', options: { keyPath: 'id' } },
    { name: 'vocalExperiments', options: { keyPath: 'id' } },
    { name: 'vocalStateSessions', options: { keyPath: 'sessionId' } },
  ],
};

function aiTeacherOpenDb() {
  return appStorage.openIndexedDb(AI_TEACHER_DB_CONFIG);
}

async function aiTeacherLoadAll(storeName) {
  return appStorage.getAll(AI_TEACHER_DB_CONFIG, storeName);
}

async function aiTeacherSaveMany(storeName, values) {
  await appStorage.putMany(AI_TEACHER_DB_CONFIG, storeName, values);
}

async function aiTeacherSave(storeName, value) {
  await appStorage.put(AI_TEACHER_DB_CONFIG, storeName, value);
}
