import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

/**
 * Saves a question set to Firestore.
 * 
 * @param id The custom ID for the document (timestamp).
 * @param data The data object to save.
 */
export async function saveQuestionSet(id: string, data: any): Promise<void> {
    try {
        await setDoc(doc(db, "question_sets", id), {
            ...data,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving question set:", error);
        throw error;
    }
}
