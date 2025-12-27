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
    where,
    writeBatch,
    Timestamp
} from "firebase/firestore";
import { db } from "./config";
import { QuestionSet, QuestionFilters } from "@/types/submit";

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
            transaction.set(newDocRef, {
                ...data,
                id: newDocRef.id,
                createdAt: serverTimestamp(),
            });

            // Update stats
            const currentStats = statsDoc.exists() ? statsDoc.data() : { totalQuestions: 0, bySubcategory: {}, byStatus: {}, byTopic: {}, byCategory: {} };
            const subcategoryKey = `bySubcategory.${data.subcategory}`;
            const categoryKey = `byCategory.${data.category}`;
            const statusKey = `byStatus.${data.status}`;

            const updates: any = {
                totalQuestions: (currentStats.totalQuestions || 0) + 1,
                [subcategoryKey]: (currentStats.bySubcategory?.[data.subcategory] || 0) + 1,
                [categoryKey]: (currentStats.byCategory?.[data.category] || 0) + 1,
                [statusKey]: (currentStats.byStatus?.[data.status] || 0) + 1
            };

            if (data.topic) {
                const topicKey = `byTopic.${data.topic}`;
                updates[topicKey] = (currentStats.byTopic?.[data.topic] || 0) + 1;
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

export async function getStatistics() {
    try {
        const statsRef = doc(db, "stats", "general");
        const snapshot = await getDocs(query(collection(db, "stats"))); // Just getting the doc directly via getDoc would be better but getDocs is imported
        const docSnap = await import("firebase/firestore").then(mod => mod.getDoc(statsRef));

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

interface PaginatedResult {
    questions: QuestionSet[];
    lastVisible: QueryDocumentSnapshot<DocumentData> | null;
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
        const constraints: any[] = [];

        // Apply Filters
        if (filters) {
            if (filters.creator) {
                constraints.push(where('author', '==', filters.creator));
            }
            if (filters.category) {
                constraints.push(where('category', '==', filters.category));
            }
            if (filters.subcategory) {
                constraints.push(where('subcategory', '==', filters.subcategory));
            }
            if (filters.status) {
                constraints.push(where('status', '==', filters.status));
            }
            if (filters.difficulty) {
                constraints.push(where('difficulty', '==', filters.difficulty));
            }

            // Date Range
            if (filters.startDate) {
                constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
            }
            if (filters.endDate) {
                constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
            }
        }

        // Apply Sort & Pagination
        // Note: Firestore requires the first orderBy field to match any inequality filter fields.
        // If sorting by createdAt, and filtering by category (equality), it's fine.
        // If filtering by createdAt (inequality), we MUST sort by createdAt first.

        if (filters?.startDate || filters?.endDate) {
            // Force sort by createdAt if filtering by date range to satisfy Firestore constraint
            constraints.push(orderBy('createdAt', sortDirection));
            if (sortField !== 'createdAt') {
                // Secondary sort if needed (may require index)
                constraints.push(orderBy(sortField, sortDirection));
            }
        } else {
            constraints.push(orderBy(sortField, sortDirection));
        }

        constraints.push(limit(pageSize));

        if (lastVisible) {
            constraints.push(startAfter(lastVisible));
        }

        const finalQuery = query(q, ...constraints);

        const snapshot = await getDocs(finalQuery);
        const questions: QuestionSet[] = [];

        snapshot.forEach((doc) => {
            questions.push(doc.data() as QuestionSet);
        });

        return {
            questions,
            lastVisible: snapshot.docs.length < pageSize ? null : (snapshot.docs[snapshot.docs.length - 1] as QueryDocumentSnapshot<DocumentData> || null)
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
            byTopic: {} as Record<string, number>
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

            if (data.topic) {
                stats.byTopic[data.topic] = (stats.byTopic[data.topic] || 0) + 1;
            }
        });

        await import("firebase/firestore").then(mod => mod.setDoc(statsRef, stats));
        return stats;
    } catch (error) {
        console.error("Error recalculating statistics:", error);
        throw error;
    }
}

