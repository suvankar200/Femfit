const store = {
  users: new Map(),
  trackerEntries: new Map(),
  assessments: new Map()
};

export function createUser({ name, language }) {
  const id = `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const user = { id, name: name || "User", language: language || "en", createdAt: new Date().toISOString() };
  store.users.set(id, user);
  store.trackerEntries.set(id, []);
  store.assessments.set(id, []);
  return user;
}

export function getUser(userId) {
  return store.users.get(userId);
}

export function updateUserLanguage(userId, language) {
  const user = store.users.get(userId);
  if (!user) return null;
  user.language = language;
  return user;
}

export function addTrackerEntry(userId, entry) {
  const entries = store.trackerEntries.get(userId) || [];
  const record = { ...entry, createdAt: new Date().toISOString() };
  entries.push(record);
  store.trackerEntries.set(userId, entries);
  return record;
}

export function addAssessment(userId, results) {
  const assessments = store.assessments.get(userId) || [];
  const record = { createdAt: new Date().toISOString(), engines: results };
  assessments.push(record);
  store.assessments.set(userId, assessments);
  return record;
}

export function getDashboard(userId) {
  return {
    user: store.users.get(userId) || null,
    entries: store.trackerEntries.get(userId) || [],
    assessments: store.assessments.get(userId) || []
  };
}
