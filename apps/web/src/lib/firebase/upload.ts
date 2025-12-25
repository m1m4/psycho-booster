import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

/**
 * Uploads a file to Firebase Storage.
 * 
 * @param file The file to upload.
 * @param path The path where the file should be stored (e.g., 'uploads/123/image.png').
 * @returns A promise that resolves to the download URL of the uploaded file.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}
