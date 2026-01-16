import {
    collection,
    doc,
    runTransaction,
    serverTimestamp,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    DocumentData,
    QueryDocumentSnapshot,
    getDoc,
    where,
    writeBatch,
    Timestamp,
    increment,
    onSnapshot,
    getCountFromServer
} from "firebase/firestore";
import { db } from "./config";
import { QuestionSet, QuestionFilters, DictionaryItem } from "@/types/submit";

/**
 * Recursively removes keys with undefined values from an object.
 * Firestore does not support undefined values.
 */
export function sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            const value = obj[key];
            if (value !== undefined) {
                newObj[key] = sanitizeForFirestore(value);
            }
        }
        return newObj;
    }
    return obj;
}

/**
 * Fetches a single question set from Firestore.
 * 
 * @param id The ID of the document to fetch.
 * @returns The question set data or null if not found.
 */
export async function getQuestionSet(id: string): Promise<QuestionSet | null> {
    const docRef = doc(db, "question_sets", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate() || new Date(),
        } as QuestionSet;
    }

    return null;
}

/**
 * Saves a question set to Firestore using a transaction to update stats.
 * 
 * @param data The question set data (without ID).
 * @returns The ID of the newly created document.
 */
export async function saveQuestionSet(data: Omit<QuestionSet, 'id' | 'createdAt'>): Promise<string> {
    try {
        const newDocRef = doc(collection(db, "question_sets"));
        const statsRef = doc(db, "stats", "general");

        await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);

            // Initialize stats if not exists
            if (!statsDoc.exists()) {
                transaction.set(statsRef, {
                    totalQuestions: 0,
                    bySubcategory: {},
                    byStatus: {}
                });
            }

            // Create the question document
            const cleanData = sanitizeForFirestore(data); // Sanitize ONLY user data
            
            transaction.set(newDocRef, {
                ...cleanData,
                id: newDocRef.id,
                createdAt: serverTimestamp(),
            });

            // Update stats atomically using increment
            const subcategoryKey = `bySubcategory.${data.subcategory}`;
            const categoryKey = `byCategory.${data.category}`;
            const statusKey = `byStatus.${data.status}`;
            const authorKey = `byAuthor.${data.author}`;

            const updates: any = {
                totalQuestions: increment(1),
                [subcategoryKey]: increment(1),
                [categoryKey]: increment(1),
                [statusKey]: increment(1),
                [authorKey]: increment(1),
                [`byDifficulty.${data.difficulty}`]: increment(1)
            };

            if (data.topic) {
                const topicKey = `byTopic.${data.topic}`;
                updates[topicKey] = increment(1);
            }

            transaction.update(statsRef, updates);
        });

        return newDocRef.id;
    } catch (error) {
        console.error("Error saving question set:", error);
        throw error;
    }
}



/**
 * Updates an existing question set.
 * 
 * @param id The ID of the document to update.
 * @param data Partial data to update.
 */
export async function updateQuestionSet(id: string, data: Partial<QuestionSet>): Promise<void> {
    try {
        const docRef = doc(db, "question_sets", id);
        const statsRef = doc(db, "stats", "general");

        await runTransaction(db, async (transaction) => {
            // 1. Get current document to know old values
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) {
                throw new Error("Document does not exist!");
            }
            const oldData = docSnap.data() as QuestionSet;

            // 2. Prepare Stats Updates
            const statsUpdates: any = {};
            let statsChanged = false;

            // Check Status Change
            if (data.status && data.status !== oldData.status) {
                statsUpdates[`byStatus.${oldData.status}`] = increment(-1);
                statsUpdates[`byStatus.${data.status}`] = increment(1);
                statsChanged = true;
            }

            // Check Category Change
            if (data.category && data.category !== oldData.category) {
                statsUpdates[`byCategory.${oldData.category}`] = increment(-1);
                statsUpdates[`byCategory.${data.category}`] = increment(1);
                statsChanged = true;
            }

            // Check Subcategory Change
            if (data.subcategory && data.subcategory !== oldData.subcategory) {
                statsUpdates[`bySubcategory.${oldData.subcategory}`] = increment(-1);
                statsUpdates[`bySubcategory.${data.subcategory}`] = increment(1);
                statsChanged = true;
            }

            // Check Topic Change
            if ('topic' in data) {
                const oldTopic = oldData.topic;
                const newTopic = data.topic;

                if (oldTopic !== newTopic) {
                    if (oldTopic) {
                        statsUpdates[`byTopic.${oldTopic}`] = increment(-1);
                        statsChanged = true;
                    }
                    if (newTopic) {
                        statsUpdates[`byTopic.${newTopic}`] = increment(1);
                        statsChanged = true;
                    }
                }
            }

            // Check Author Change
            if (data.author && data.author !== oldData.author) {
                statsUpdates[`byAuthor.${oldData.author}`] = increment(-1);
                statsUpdates[`byAuthor.${data.author}`] = increment(1);
                statsChanged = true;
            }

            // Check Difficulty Change
            if (data.difficulty && data.difficulty !== oldData.difficulty) {
                statsUpdates[`byDifficulty.${oldData.difficulty}`] = increment(-1);
                statsUpdates[`byDifficulty.${data.difficulty}`] = increment(1);
                statsChanged = true;
            }

            // 3. Perform Updates
            const cleanData = sanitizeForFirestore(data); // Sanitize ONLY user data

            transaction.update(docRef, {
                ...cleanData,
                updatedAt: serverTimestamp()
            });

            if (statsChanged) {
                transaction.update(statsRef, statsUpdates);
            }
        });

    } catch (error) {
        console.error("Error updating question set:", error);
        throw error;
    }
}

/**
 * Bulk deletes question sets.
 * 
 * @param ids Array of document IDs to delete.
 */
export async function deleteQuestionSets(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, "question_sets", id);
            batch.delete(docRef);
        });

        await batch.commit();

        // Recalculate stats after bulk deletion
        await recalculateStatistics();
    } catch (error) {
        console.error("Error batch deleting question sets:", error);
        throw error;
    }
}

/**
 * Bulk updates question sets status to approved.
 * 
 * @param ids Array of document IDs to approve.
 */
export async function approveQuestionSets(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, "question_sets", id);
            batch.update(docRef, {
                status: 'approved',
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();

        // Recalculate stats after bulk approval
        await recalculateStatistics();
    } catch (error) {
        console.error("Error batch approving question sets:", error);
        throw error;
    }
}

export async function getStatistics() {
    try {
        const statsRef = doc(db, "stats", "general");
        const docSnap = await getDoc(statsRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return { totalQuestions: 0, bySubcategory: {}, byStatus: {}, byTopic: {}, byCategory: {} };
        }
    } catch (error) {
        console.error("Error fetching statistics:", error);
        throw error;
    }
}

/**
 * Subscribes to real-time statistics updates.
 * 
 * @param callback Function to call when statistics change.
 * @returns Unsubscribe function.
 */
export function subscribeToStatistics(callback: (stats: any) => void) {
    const statsRef = doc(db, "stats", "general");
    return onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        }
    }, (error) => {
        console.error("Error subscribing to statistics:", error);
    });
}

interface PaginatedResult {
    questions: QuestionSet[];
    lastVisible: QueryDocumentSnapshot<DocumentData> | null;
    totalCount: number;
}

/**
 * Fetches paginated questions from Firestore with optional filters.
 * Note: Complex filter combinations might require Firestore composite indexes.
 */
export async function getPaginatedQuestions(
    pageSize: number = 20,
    lastVisible: QueryDocumentSnapshot<DocumentData> | null = null,
    sortField: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc',
    filters?: QuestionFilters
): Promise<PaginatedResult> {
    try {
        let q = collection(db, "question_sets") as any;

        // 1. Build Base Constraints (Common Filters)
        const baseConstraints: any[] = [];

        if (filters) {
            if (filters.creator) baseConstraints.push(where('author', '==', filters.creator));
            if (filters.category) baseConstraints.push(where('category', '==', filters.category));
            if (filters.subcategory) {
                if (Array.isArray(filters.subcategory)) {
                    if (filters.subcategory.length > 0) baseConstraints.push(where('subcategory', 'in', filters.subcategory));
                } else {
                    baseConstraints.push(where('subcategory', '==', filters.subcategory));
                }
            }
            if (filters.topic) {
                if (Array.isArray(filters.topic)) {
                    if (filters.topic.length > 0) baseConstraints.push(where('topic', 'in', filters.topic));
                } else {
                    baseConstraints.push(where('topic', '==', filters.topic));
                }
            }
            if (filters.status) baseConstraints.push(where('status', '==', filters.status));
            if (filters.difficulty) baseConstraints.push(where('difficulty', '==', filters.difficulty));

            // Date Range
            if (filters.startDate) baseConstraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
            if (filters.endDate) baseConstraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
        }

        // 2. Build Count Query (Base + Exclude Author if needed)
        const countConstraints = [...baseConstraints];
        if (filters?.excludeAuthor) {
            countConstraints.push(where('author', '!=', filters.excludeAuthor));
            countConstraints.push(orderBy('author', 'asc')); // Required for inequality filter
        }

        const countSnapshot = await getCountFromServer(query(q, ...countConstraints));
        const totalCount = countSnapshot.data().count;

        // 3. Build Data Query (Base + Sort + Limit + StartAfter)
        const dataConstraints = [...baseConstraints];

        // Sort Logic
        if (filters?.startDate || filters?.endDate) {
            dataConstraints.push(orderBy('createdAt', sortDirection));
            if (sortField !== 'createdAt') {
                dataConstraints.push(orderBy(sortField, sortDirection));
            }
        } else {
            dataConstraints.push(orderBy(sortField, sortDirection));
        }

        // Fetch Limit (Client-side filtering buffer)
        const fetchLimit = filters?.excludeAuthor ? pageSize + 5 : pageSize;
        dataConstraints.push(limit(fetchLimit));

        if (lastVisible) {
            dataConstraints.push(startAfter(lastVisible));
        }

        const finalQuery = query(q, ...dataConstraints);
        const snapshot = await getDocs(finalQuery);
        let questions: QuestionSet[] = snapshot.docs.map(doc => doc.data() as QuestionSet);

        // Client-side filtering for excludeAuthor (to preserve sort order)
        if (filters?.excludeAuthor) {
            questions = questions.filter(q => q.author !== filters.excludeAuthor);
            // Cap at original page size
            questions = questions.slice(0, pageSize);
        }

        return {
            questions,
            lastVisible: snapshot.docs.length < fetchLimit ? null : (snapshot.docs[snapshot.docs.length - 1] as QueryDocumentSnapshot<DocumentData> || null),
            totalCount
        };
    } catch (error) {
        console.error("Error fetching questions:", error);
        throw error;
    }
}

/**
 * Recalculates all statistics based on the entire question_sets collection.
 * This is used to ensure stats consistency.
 */
export async function recalculateStatistics() {
    try {
        const statsRef = doc(db, "stats", "general");
        const questionsSnapshot = await getDocs(collection(db, "question_sets"));

        const stats = {
            totalQuestions: 0,
            byCategory: {} as Record<string, number>,
            bySubcategory: {} as Record<string, number>,
            byStatus: {} as Record<string, number>,
            byDifficulty: {} as Record<string, number>,
            byTopic: {} as Record<string, number>,
            byAuthor: {} as Record<string, number>,
            authorsByCategory: {} as Record<string, Set<string>>,
            subcategoriesByCategory: {} as Record<string, Set<string>>,
            topicsBySubcategory: {} as Record<string, Set<string>>
        };

        questionsSnapshot.forEach((doc) => {
            const data = doc.data() as QuestionSet;
            stats.totalQuestions++;

            const cat = data.category || 'unknown';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

            const sub = data.subcategory || 'unknown';
            stats.bySubcategory[sub] = (stats.bySubcategory[sub] || 0) + 1;

            const status = data.status || 'pending';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            const author = data.author || 'unknown';
            stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;

            const difficulty = data.difficulty || 'medium';
            stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;

            // Track Relations
            if (!stats.authorsByCategory[cat]) stats.authorsByCategory[cat] = new Set();
            stats.authorsByCategory[cat].add(author);

            if (!stats.subcategoriesByCategory[cat]) stats.subcategoriesByCategory[cat] = new Set();
            stats.subcategoriesByCategory[cat].add(sub);

            if (data.topic) {
                stats.byTopic[data.topic] = (stats.byTopic[data.topic] || 0) + 1;
                if (!stats.topicsBySubcategory[sub]) stats.topicsBySubcategory[sub] = new Set();
                stats.topicsBySubcategory[sub].add(data.topic);
            }
        });

        // Convert Sets to Arrays for Firestore
        const finalStats = {
            ...stats,
            authorsByCategory: Object.fromEntries(Object.entries(stats.authorsByCategory).map(([k, v]) => [k, Array.from(v)])),
            subcategoriesByCategory: Object.fromEntries(Object.entries(stats.subcategoriesByCategory).map(([k, v]) => [k, Array.from(v)])),
            topicsBySubcategory: Object.fromEntries(Object.entries(stats.topicsBySubcategory).map(([k, v]) => [k, Array.from(v)]))
        };

        await import("firebase/firestore").then(mod => mod.setDoc(statsRef, finalStats));
        return finalStats;
    } catch (error) {
        console.error("Error recalculating statistics:", error);
        throw error;
    }
}


/**
 * Retrieves the user's saved Gemini API Key.
 * Stored in `admin_users/{email}`.
 */
export async function getUserApiKey(email: string): Promise<string | null> {
    try {
        const docRef = doc(db, "admin_users", email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().geminiApiKey || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching API key:", error);
        return null; // Don't throw, just return null if fail (or handle appropriately)
    }
}

/**
 * Saves the user's Gemini API Key.
 */
export async function saveUserApiKey(email: string, apiKey: string): Promise<void> {
    try {
        const docRef = doc(db, "admin_users", email);
        // Use set with merge: true to avoid overwriting other user data/permissions
        await import("firebase/firestore").then(mod => mod.setDoc(docRef, { geminiApiKey: apiKey }, { merge: true }));
    } catch (error) {
        console.error("Error saving API key:", error);
        throw error;
    }
}

/**
 * Retrieves the global prompts configuration.
 * Stored in `settings/prompts`.
 */
export async function getGlobalPrompts(): Promise<{ base_prompt: string, categories: Record<string, string> }> {
    try {
        const docRef = doc(db, "settings", "prompts");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as any;
        }
        // Return default structure if empty
        return { base_prompt: '', categories: {} };
    } catch (error) {
        console.error("Error fetching global prompts:", error);
        return { base_prompt: '', categories: {} };
    }
}

/**
 * Saves the global prompts configuration.
 */
export async function saveGlobalPrompts(prompts: { base_prompt: string, categories: Record<string, string> }): Promise<void> {
    try {
        const docRef = doc(db, "settings", "prompts");
        await import("firebase/firestore").then(mod => mod.setDoc(docRef, prompts));
    } catch (error) {
        console.error("Error saving global prompts:", error);
        throw error;
    }
}

// --- Dictionary Management ---

/**
 * Adds a single dictionary item.
 */
export async function addDictionaryItem(item: Omit<DictionaryItem, 'id' | 'createdAt'>): Promise<string> {
    try {
        const docRef = doc(collection(db, "dictionary_items"));
        const cleanData = sanitizeForFirestore(item);
        
        await import("firebase/firestore").then(mod => mod.setDoc(docRef, {
            ...cleanData,
            id: docRef.id,
            createdAt: serverTimestamp()
        }));
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding dictionary item:", error);
        throw error;
    }
}

/**
 * Updates a dictionary item.
 */
export async function updateDictionaryItem(id: string, item: Partial<DictionaryItem>): Promise<void> {
    try {
        const docRef = doc(db, "dictionary_items", id);
        const cleanData = sanitizeForFirestore(item);
        
        await import("firebase/firestore").then(mod => mod.updateDoc(docRef, {
            ...cleanData,
            updatedAt: serverTimestamp()
        }));
    } catch (error) {
        console.error("Error updating dictionary item:", error);
        throw error;
    }
}

/**
 * Deletes a dictionary item.
 */
export async function deleteDictionaryItem(id: string): Promise<void> {
    try {
        const docRef = doc(db, "dictionary_items", id);
        await import("firebase/firestore").then(mod => mod.deleteDoc(docRef));
    } catch (error) {
        console.error("Error deleting dictionary item:", error);
        throw error;
    }
}

/**
 * Fetches dictionary items with optional filtering.
 */
export async function getDictionaryItems(
    language?: 'he' | 'en', 
    set?: number,
    limitCount: number = 100
): Promise<DictionaryItem[]> {
    try {
        // Start with basic collection reference
        let q = collection(db, "dictionary_items") as any;
        
        const constraints: any[] = [];
        if (language) constraints.push(where('language', '==', language));
        if (set) constraints.push(where('set', '==', set));
        
        // Apply filters
        // Note: We removed orderBy('createdAt') to avoid needing a composite index for every combination
        if (constraints.length > 0) {
             q = query(collection(db, "dictionary_items"), ...constraints, limit(limitCount));
        } else {
             q = query(collection(db, "dictionary_items"), limit(limitCount));
        }

        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate() 
        } as DictionaryItem));

        // Sort client-side
        return items.sort((a, b) => {
            const dateA = a.createdAt?.getTime() || 0;
            const dateB = b.createdAt?.getTime() || 0;
            return dateB - dateA; // Descending
        });

    } catch (error) {
        console.error("Error fetching dictionary items:", error);
        throw error;
    }
}

/**
 * Bulk adds dictionary items.
 */
export async function bulkAddDictionaryItems(items: Omit<DictionaryItem, 'id' | 'createdAt'>[]): Promise<void> {
    if (items.length === 0) return;
    
    try {
        const batch = writeBatch(db);
        
        items.forEach(item => {
            const docRef = doc(collection(db, "dictionary_items"));
            const cleanData = sanitizeForFirestore(item);
            batch.set(docRef, {
                ...cleanData,
                id: docRef.id,
                createdAt: serverTimestamp()
            });
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Error bulk adding dictionary items:", error);
        throw error;
    }
}
