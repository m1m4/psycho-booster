import * as sharedFirebase from "@shared/firebase";

console.log('Firebase Config Loading. DB present:', !!sharedFirebase.db);

export const db = sharedFirebase.db;
export const storage = sharedFirebase.storage;
export const auth = sharedFirebase.auth;
export default sharedFirebase.default;
