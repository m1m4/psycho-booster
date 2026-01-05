
import { QuestionItem, DEFAULT_QUESTION } from '@/types/submit';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerationParams {
    apiKey: string;
    instructions: string; // User instructions (ignored if fullPrompt is present)
    basePrompt: string; // Global base prompt (ignored if fullPrompt is present)
    contextPrompt: string; // Category prompt (ignored if fullPrompt is present)
    category: string;
    subcategory: string;
    topic?: string;
    model?: string;
    fullPrompt?: string; // New: Full system prompt constructed by UI
    currentQuestions?: QuestionItem[]; // New: Existing questions for refinement
}

export async function generateQuestions(params: GenerationParams): Promise<QuestionItem[]> {
    const { apiKey, instructions, basePrompt, contextPrompt, category, subcategory, topic, model: modelName, fullPrompt, currentQuestions } = params;

    if (!apiKey) {
        throw new Error("Missing API Key");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.0-flash-exp" });

        let systemPrompt = fullPrompt;

        if (!systemPrompt) {
            systemPrompt = `
${basePrompt}

Context:
Category: ${category}
Subcategory: ${subcategory}
${topic ? `Topic: ${topic}` : ''}

Specific Context Rules:
${contextPrompt}

User Additional Instructions:
${instructions}
        `;
        }

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        console.log('AI Raw Response:', responseText); // Debugging log

        // Parse JSON
        const jsonStart = responseText.indexOf('{'); // Or '[' if array
        const jsonEnd = responseText.lastIndexOf('}') + 1; // Or ']'
        // Also support array start/end
        const arrayStart = responseText.indexOf('[');
        const arrayEnd = responseText.lastIndexOf(']') + 1;

        let validJson = responseText;

        // simple heuristic to find the outer most wrapper
        if (arrayStart !== -1 && (jsonStart === -1 || arrayStart < jsonStart)) {
            if (arrayEnd !== -1) validJson = responseText.substring(arrayStart, arrayEnd);
        } else if (jsonStart !== -1 && jsonEnd !== -1) {
            validJson = responseText.substring(jsonStart, jsonEnd);
        }

        // Clean markdown code blocks if any
        validJson = validJson.replace(/```json/g, '').replace(/```/g, '');

        let parsedData;
        try {
            parsedData = JSON.parse(validJson);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Raw Text:", responseText);
            throw new Error("Failed to parse AI response. Please try again.");
        }

        // Handle Refinement Mode (Merge logic)
        if (currentQuestions && currentQuestions.length > 0) {
            let changesArray: any[] = [];
            if (Array.isArray(parsedData)) {
                changesArray = parsedData;
            } else if (parsedData.questions) {
                changesArray = parsedData.questions;
            } else {
                // Single object?
                changesArray = [parsedData];
            }

            // Create a map of changes for faster lookup
            const changesMap = new Map();
            changesArray.forEach((change: any, index: number) => {
                // Normalize ID to string for robust matching (handling "1" vs 1)
                if (change.id !== undefined && change.id !== null) {
                    changesMap.set(String(change.id), change);
                }
            });

            console.log('Merge - Changes Map Keys:', Array.from(changesMap.keys()));

            return currentQuestions.map((q, idx) => {
                // Look for change for this question (normalized ID)
                const qIdString = String(q.id);
                let change = changesMap.get(qIdString);

                console.log(`Merge - Checking Q ${qIdString}: Match Found?`, !!change);

                // Fallback: if no ID match, try array index if lengths match exactly
                if (!change && changesArray.length === currentQuestions.length) {
                    console.log(`Merge - Fallback to index ${idx} for Q ${qIdString}`);
                    change = changesArray[idx];
                }

                if (change) {
                    // Merge!
                    // We only update fields that are present in the 'change' object
                    // and are not metadata fields we might want to protect?
                    // Actually, we trust the AI/User prompt.
                    return {
                        ...q,
                        // Update basic string fields
                        questionText: change.questionText !== undefined ? change.questionText : q.questionText,
                        difficulty: change.difficulty !== undefined ? change.difficulty : q.difficulty,
                        answer1: change.answer1 !== undefined ? change.answer1 : q.answer1,
                        answer2: change.answer2 !== undefined ? change.answer2 : q.answer2,
                        answer3: change.answer3 !== undefined ? change.answer3 : q.answer3,
                        answer4: change.answer4 !== undefined ? change.answer4 : q.answer4,
                        correctAnswer: change.correctAnswer !== undefined ? change.correctAnswer.toString() : q.correctAnswer,
                        explanation: change.explanation !== undefined ? change.explanation : q.explanation,
                        // Don't wipe images unless explicitly set to null/empty string by logic (unlikely from AI unless requested)
                        // If AI sends 'questionImage': null, it might mean delete. 
                        // For now let's assume text updates don't touch images unless specified.
                    };
                }
                return q; // No change for this question
            });
        }

        // Normal Generation Mode (Creation)
        const questionsArray = Array.isArray(parsedData) ? parsedData : (parsedData.questions || [parsedData]);

        // Map to internal QuestionItem format
        return questionsArray.map((q: any, idx: number) => ({
            ...DEFAULT_QUESTION,
            id: idx + 1,
            difficulty: q.difficulty || 'medium',
            questionText: q.questionText || '',
            answer1: q.answer1 || '',
            answer2: q.answer2 || '',
            answer3: q.answer3 || '',
            answer4: q.answer4 || '',
            correctAnswer: (q.correctAnswer || 1).toString(),
            explanation: q.explanation || '',
            answersMode: 'text' // Auto-assume text for AI generated for now
        }));

    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw error;
    }
}
